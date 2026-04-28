import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./db.tsx";

// ⚠️  npm:@supabase/supabase-js is intentionally NOT imported here.
// Even with { auth: { autoRefreshToken: false, ... } }, the createClient()
// call itself parses the JWT key with jose at initialization time.
// Newer Supabase projects sign ALL keys (anon, service_role) with ES256.
// jose in the Deno edge-function runtime does not support ES256 without a
// proper EC public key, so createClient() throws "Unsupported JWT algorithm
// ES256" before Hono can register a single route.
// Fix: every Supabase operation uses a plain fetch() with the key as a
// Bearer token — no local JWT parsing at all.

const app = new Hono();

// ── Environment ───────────────────────────────────────────────────────────────
const SUPABASE_URL: string = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY: string = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY: string = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const BUCKET: string = "make-8bfb3e73-avatars";
const OPENAI_KEY: string = Deno.env.get("OPENAI_API_KEY") ?? "";

// ── Header factories (return plain objects — no type-cast needed) ─────────────
function serviceHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + SERVICE_KEY,
    "apikey": SERVICE_KEY,
  };
}

function anonHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + ANON_KEY,
    "apikey": ANON_KEY,
  };
}

// ── Auth: verify token via Supabase REST (no local JWT parsing) ───────────────

/** Extract the user's access token from X-User-Token (preferred) or Authorization Bearer. */
function extractToken(c: { req: { header: (name: string) => string | undefined } }): string {
  // X-User-Token is set by the frontend to bypass ES256 gateway JWT verification.
  // The gateway only sees the anon key in Authorization; user identity comes here.
  return (
    c.req.header("X-User-Token") ??
    c.req.header("Authorization")?.split(" ")[1] ??
    ""
  );
}

async function getUser(token: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(SUPABASE_URL + "/auth/v1/user", {
      headers: {
        "Authorization": "Bearer " + token,
        "apikey": ANON_KEY,
      },
    });
    if (!res.ok) {
      console.log("getUser failed:", res.status, await res.text());
      return null;
    }
    return (await res.json()) as Record<string, unknown>;
  } catch (e) {
    console.log("getUser error:", e);
    return null;
  }
}

// ── Storage helpers (Supabase Storage REST API, no supabase-js) ───────────────
async function storageBucketInit(): Promise<void> {
  try {
    // Attempt to create; if it already exists the API returns 409 which is fine
    await fetch(SUPABASE_URL + "/storage/v1/bucket", {
      method: "POST",
      headers: serviceHeaders(),
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false }),
    });
  } catch (e) {
    console.log("storageBucketInit warning:", e);
  }
}

async function storageUploadAndSign(
  filePath: string,
  data: Uint8Array,
  contentType: string,
): Promise<string | null> {
  // Upload (upsert via x-upsert header)
  const upRes = await fetch(
    SUPABASE_URL + "/storage/v1/object/" + BUCKET + "/" + filePath,
    {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + SERVICE_KEY,
        "apikey": SERVICE_KEY,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body: data,
    },
  );
  if (!upRes.ok) {
    console.log("storageUpload error:", await upRes.text());
    return null;
  }
  return storageSignedUrl(filePath);
}

async function storageSignedUrl(filePath: string): Promise<string | null> {
  const res = await fetch(
    SUPABASE_URL + "/storage/v1/object/sign/" + BUCKET + "/" + filePath,
    {
      method: "POST",
      headers: serviceHeaders(),
      body: JSON.stringify({ expiresIn: 604800 }),
    },
  );
  if (!res.ok) {
    console.log("storageSignedUrl error:", await res.text());
    return null;
  }
  const body = (await res.json()) as { signedURL?: string };
  const path: string = body.signedURL ?? "";
  if (!path) return null;
  return path.startsWith("http") ? path : SUPABASE_URL + path;
}

// ── Bootstrap (fire-and-forget; never blocks server startup) ─────────────────
storageBucketInit().catch((e) => console.log("bucket init error:", e));

// ── Middleware ────────────────────────────────────────────────────────────────
app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-User-Token"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/make-server-8bfb3e73/health", (c) => c.json({ status: "ok" }));

// ── AUTH ──────────────────────────────────────────────────────────────────────

app.post("/make-server-8bfb3e73/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    if (!email || !password || !name) {
      return c.json({ error: "email, password, and name are required" }, 400);
    }
    const res = await fetch(SUPABASE_URL + "/auth/v1/admin/users", {
      method: "POST",
      headers: serviceHeaders(),
      body: JSON.stringify({
        email,
        password,
        user_metadata: { name },
        email_confirm: true,
      }),
    });
    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      const msg = (data.message ?? data.error ?? JSON.stringify(data)) as string;
      return c.json({ error: "Signup error: " + msg }, 400);
    }
    const userId = data.id as string;
    await kv.set("profile:" + userId, {
      userId,
      name,
      email,
      currency: "IDR",
      biometricEnabled: false,
      cloudSyncEnabled: true,
    });
    return c.json({ user: data });
  } catch (e) {
    console.log("signup error:", e);
    return c.json({ error: "Server error during signup: " + e }, 500);
  }
});

app.post("/make-server-8bfb3e73/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();
    const res = await fetch(SUPABASE_URL + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: anonHeaders(),
      body: JSON.stringify({ email, password }),
    });
    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      const msg = (data.error_description ?? data.error ?? JSON.stringify(data)) as string;
      return c.json({ error: "Sign in error: " + msg }, 400);
    }
    return c.json({ session: data, user: data.user });
  } catch (e) {
    console.log("signin error:", e);
    return c.json({ error: "Server error during signin: " + e }, 500);
  }
});

// ── TRANSACTIONS ──────────────────────────────────────────────────────────────

app.get("/make-server-8bfb3e73/transactions", async (c) => {
  try {
    const token = extractToken(c);
    if (!token) return c.json({ error: "Unauthorized: missing token" }, 401);
    const user = await getUser(token);
    if (!user) return c.json({ error: "Unauthorized: invalid token" }, 401);
    const userId = user.id as string;
    const rows = (await kv.getByPrefix("txn:" + userId + ":")) as unknown[];
    const txns = rows
      .filter(Boolean)
      .sort((a: unknown, b: unknown) => {
        const aDate = new Date(((a as Record<string, unknown>).date as string) + "T00:00:00").getTime();
        const bDate = new Date(((b as Record<string, unknown>).date as string) + "T00:00:00").getTime();
        return bDate - aDate;
      });
    return c.json({ transactions: txns });
  } catch (e) {
    console.log("getTransactions error:", e);
    return c.json({ error: "Error fetching transactions: " + e }, 500);
  }
});

app.post("/make-server-8bfb3e73/transactions", async (c) => {
  try {
    const token = extractToken(c);
    if (!token) return c.json({ error: "Unauthorized: missing token" }, 401);
    const user = await getUser(token);
    if (!user) return c.json({ error: "Unauthorized: invalid token" }, 401);
    const userId = user.id as string;
    const body = (await c.req.json()) as Record<string, unknown>;
    const id: string = crypto.randomUUID();
    const txn = {
      id,
      userId,
      type: body.type,
      amount: Number(body.amount),
      title: body.title,
      category: body.category,
      date: body.date,
      notes: body.notes ?? "",
      createdAt: new Date().toISOString(),
    };
    await kv.set("txn:" + userId + ":" + id, txn);
    return c.json({ transaction: txn });
  } catch (e) {
    console.log("createTransaction error:", e);
    return c.json({ error: "Error creating transaction: " + e }, 500);
  }
});

app.put("/make-server-8bfb3e73/transactions/:id", async (c) => {
  try {
    const token = extractToken(c);
    if (!token) return c.json({ error: "Unauthorized: missing token" }, 401);
    const user = await getUser(token);
    if (!user) return c.json({ error: "Unauthorized: invalid token" }, 401);
    const userId = user.id as string;
    const id = c.req.param("id");
    const body = (await c.req.json()) as Record<string, unknown>;
    const existing = await kv.get("txn:" + userId + ":" + id);
    if (!existing) return c.json({ error: "Transaction not found" }, 404);
    const updated = {
      ...(existing as Record<string, unknown>),
      ...body,
      id,
      userId,
      amount: Number(body.amount),
      updatedAt: new Date().toISOString(),
    };
    await kv.set("txn:" + userId + ":" + id, updated);
    return c.json({ transaction: updated });
  } catch (e) {
    console.log("updateTransaction error:", e);
    return c.json({ error: "Error updating transaction: " + e }, 500);
  }
});

app.delete("/make-server-8bfb3e73/transactions/:id", async (c) => {
  try {
    const token = extractToken(c);
    if (!token) return c.json({ error: "Unauthorized: missing token" }, 401);
    const user = await getUser(token);
    if (!user) return c.json({ error: "Unauthorized: invalid token" }, 401);
    const userId = user.id as string;
    const id = c.req.param("id");
    await kv.del("txn:" + userId + ":" + id);
    return c.json({ success: true });
  } catch (e) {
    console.log("deleteTransaction error:", e);
    return c.json({ error: "Error deleting transaction: " + e }, 500);
  }
});

// ── PROFILE ───────────────────────────────────────────────────────────────────

app.get("/make-server-8bfb3e73/profile", async (c) => {
  try {
    const token = extractToken(c);
    if (!token) return c.json({ error: "Unauthorized: missing token" }, 401);
    const user = await getUser(token);
    if (!user) return c.json({ error: "Unauthorized: invalid token" }, 401);
    const userId = user.id as string;
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    let profile = await kv.get("profile:" + userId);
    if (!profile) {
      profile = {
        userId,
        name: (meta.name as string) ?? "",
        email: (user.email as string) ?? "",
        currency: "IDR",
        biometricEnabled: false,
        cloudSyncEnabled: true,
      };
      try {
        await kv.set("profile:" + userId, profile);
      } catch (e2) {
        console.log("profile auto-create warning:", e2);
      }
    }
    return c.json({ profile });
  } catch (e) {
    console.log("getProfile error:", e);
    return c.json({ error: "Error fetching profile: " + e }, 500);
  }
});

app.put("/make-server-8bfb3e73/profile", async (c) => {
  try {
    const token = extractToken(c);
    if (!token) return c.json({ error: "Unauthorized: missing token" }, 401);
    const user = await getUser(token);
    if (!user) return c.json({ error: "Unauthorized: invalid token" }, 401);
    const userId = user.id as string;
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const body = (await c.req.json()) as Record<string, unknown>;
    const existing = ((await kv.get("profile:" + userId)) as Record<string, unknown>) ?? {
      userId,
      name: (meta.name as string) ?? "",
      email: (user.email as string) ?? "",
      currency: "IDR",
      biometricEnabled: false,
      cloudSyncEnabled: true,
    };
    const updated = { ...existing, ...body, userId };
    await kv.set("profile:" + userId, updated);
    return c.json({ profile: updated });
  } catch (e) {
    console.log("updateProfile error:", e);
    return c.json({ error: "Error updating profile: " + e }, 500);
  }
});

// ── AVATAR ────────────────────────────────────────────────────────────────────

app.post("/make-server-8bfb3e73/avatar/upload", async (c) => {
  try {
    const token = extractToken(c);
    if (!token) return c.json({ error: "Unauthorized" }, 401);
    const user = await getUser(token);
    if (!user) return c.json({ error: "Unauthorized: invalid token" }, 401);
    const userId = user.id as string;
    const { base64, mimeType } = (await c.req.json()) as {
      base64: string;
      mimeType: string;
    };
    if (!base64 || !mimeType) {
      return c.json({ error: "base64 and mimeType required" }, 400);
    }
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const ext = mimeType.split("/")[1] ?? "jpg";
    const filePath = userId + "/avatar." + ext;
    const signedUrl = await storageUploadAndSign(filePath, bytes, mimeType);
    if (!signedUrl) {
      return c.json({ error: "Upload or signing failed" }, 500);
    }
    const existing = ((await kv.get("profile:" + userId)) as Record<string, unknown>) ?? {};
    await kv.set("profile:" + userId, {
      ...existing,
      avatarUrl: signedUrl,
      avatarPath: filePath,
    });
    return c.json({ avatarUrl: signedUrl });
  } catch (e) {
    console.log("avatarUpload error:", e);
    return c.json({ error: "Server error during avatar upload: " + e }, 500);
  }
});

app.get("/make-server-8bfb3e73/avatar", async (c) => {
  try {
    const token = extractToken(c);
    if (!token) return c.json({ avatarUrl: null });
    const user = await getUser(token);
    if (!user) return c.json({ avatarUrl: null });
    const userId = user.id as string;
    const profile = ((await kv.get("profile:" + userId)) as Record<string, unknown>) ?? {};
    const filePath = profile.avatarPath as string | undefined;
    if (!filePath) return c.json({ avatarUrl: null });
    const signedUrl = await storageSignedUrl(filePath);
    if (!signedUrl) return c.json({ avatarUrl: null });
    await kv.set("profile:" + userId, { ...profile, avatarUrl: signedUrl });
    return c.json({ avatarUrl: signedUrl });
  } catch (e) {
    console.log("getAvatar error:", e);
    return c.json({ avatarUrl: null });
  }
});

// ── SCAN RECEIPT / SCREENSHOT ─────────────────────────────────────────────────

app.post("/make-server-8bfb3e73/scan-receipt", async (c) => {
  try {
    const token = extractToken(c);
    if (!token) return c.json({ error: "Unauthorized: missing token" }, 401);
    const user = await getUser(token);
    if (!user) return c.json({ error: "Unauthorized: invalid token" }, 401);

    if (!OPENAI_KEY) {
      return c.json({ error: "OpenAI API key not configured" }, 500);
    }

    const { base64, mimeType, userName } = (await c.req.json()) as {
      base64: string;
      mimeType: string;
      userName?: string;
    };

    if (!base64 || !mimeType) {
      return c.json({ error: "base64 and mimeType are required" }, 400);
    }

    const userNameLine = userName
      ? `The account owner's name is: "${userName}" (may appear in ALL CAPS or with name prefixes like "A ", "H ", "DR ", "IR ", extra middle/family name words, or slight spelling variations — treat fuzzy matches as the same person).`
      : `The account owner's name is unknown.`;

    const prompt = `You are an expert financial data extraction assistant specializing in Indonesian and Southeast Asian mobile banking apps. Analyze this image and extract ALL transactions visible from THE ACCOUNT OWNER'S POINT OF VIEW.

${userNameLine}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — SELF-TRANSFER / INCOMING DETECTION (READ THIS FIRST)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Indonesian banks show transfer receipts that can be EITHER outgoing (you sent) OR incoming (you received). Use these rules:

INCOME — classify as "income" when:
• The image shows "Transfer Masuk", "Incoming Transfer", "Uang Masuk", "Terima dari", "Received from"
• The word "KREDIT", "CR", or a "+" prefix appears next to the amount
• YOU are the RECIPIENT: "Ke Rekening: [YOUR NAME]" or "Beneficiary: [YOUR NAME]" — recipient name closely matches the account owner's name above
• A notification says someone sent/transferred money TO you
• GoPay/OVO/DANA shows "Uang Masuk" or green arrow pointing inward

EXPENSE — classify as "expense" when:
• The image shows "Transfer Keluar", "Outgoing Transfer", "Uang Keluar", "Pembayaran ke", "Debit"
• The word "DEBIT", "DB", or a "-" prefix appears next to the amount
• YOU are the SENDER: "Dari Rekening: [YOUR ACCOUNT]" → "Ke Rekening: [SOMEONE ELSE'S NAME]" — recipient name does NOT match the owner's name
• A purchase receipt, nota, or invoice showing you paid a merchant
• GoPay/OVO/DANA shows "Uang Keluar" or red arrow pointing outward

SELF-TRANSFER = INCOME RULE (CRITICAL):
• If a transfer receipt shows "Ke [account] [NAME]" and that NAME closely matches the account owner's name (same key words, ignoring prefixes "A ", "H ", extra words) → classify as "income" because the owner is transferring to their OWN account
• Example: Owner = "Alif Lakipadada", recipient shown = "A ALIF LAKIPADADA NORMAN" → MATCH → income, category "Other", title "Self Transfer"
• Example: Owner = "Budi Santoso", recipient = "BUDI SANTOSO" → MATCH → income
• Example: Owner = "Alif Lakipadada", recipient = "SITI RAHMA" → NO MATCH → expense

SKIP entirely (do not include):
• Internal pocket/kantong transfers within the same e-wallet (e.g. GoPay Tabungan → GoPay)
• Top-ups from same person's own bank to their own e-wallet (unless self-transfer rule above applies)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — INDONESIAN BANKING GLOSSARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Dari Rekening / Dari = From Account (sender)
• Ke Rekening / Ke / Tujuan = To Account (recipient)
• BERHASIL / Sukses / Berhasil Dikirim = Transaction successful
• Jumlah / Nominal = Amount
• Tanggal / Tgl = Date
• m-Transfer (BCA) = bank transfer via mobile
• Livin' (Mandiri), BRImo (BRI), BNI Mobile = other Indonesian bank apps
• GoPay, OVO, DANA, ShopeePay, SeaBank = Indonesian e-wallets
• Rp / IDR = Indonesian Rupiah (integer, no decimals)
• Gaji = Salary | Belanja = Shopping | Makan = Food | Bensin = Fuel/Transport
• Tagihan = Bill | Listrik = Electricity | BPJS = Health insurance

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Return a JSON array. Each object has:
- type: "income" or "expense"
- amount: number (raw integer or decimal — NO currency symbols, NO thousand separators, NO dots/commas as separators)
- title: string (merchant name, sender name, or description — concise, max 40 chars)
- category: EXACTLY one of:
    Expense categories: "Food", "Shopping", "Transport", "Bills", "Entertainment", "Health", "Travel", "Education", "Other"
    Income categories: "Salary", "Freelance", "Investment", "Gift", "Other"
- date: "YYYY-MM-DD" (if only DD/MM/YYYY shown, convert it; if no year, use 2026; if no date use today 2026-04-22)
- notes: string (extra info, or "")
- currency: 3-letter ISO code ("IDR", "USD", "SGD", "MYR", etc.)

Category assignment:
• Food/drink/restaurant/café/warung/kopi → "Food"
• Belanja/marketplace/Tokopedia/Shopee/retail/clothing → "Shopping"
• Transport/Grab/Gojek/toll/parkir/bensin/BBM → "Transport"
• Electricity/PLN/water/internet/Telkom/phone/subscription/Netflix/Spotify/BPJS → "Bills"
• Games/cinema/hiburan/streaming/bar/recreation → "Entertainment"
• Hospital/RS/klinik/pharmacy/apotek/health → "Health"
• Hotel/flight/travel/pesawat → "Travel"
• School/kursus/course/buku/books → "Education"
• Gaji/salary/payroll → "Salary"
• Freelance/project/client payment/jasa → "Freelance"
• Saham/reksa dana/investasi/stock/return → "Investment"
• Hadiah/gift/bonus/cashback → "Gift"
• Self-transfers, unknown → "Other"

FINAL RULES:
- If multiple transactions are visible, extract ALL as separate objects
- Return ONLY a valid JSON array — no markdown fences, no explanation, nothing else
- Example: [{"type":"income","amount":1400000,"title":"Self Transfer","category":"Other","date":"2026-04-01","notes":"m-Transfer from own BCA account","currency":"IDR"}]`;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + OPENAI_KEY,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.log("OpenAI error:", errText);
      return c.json({ error: "OpenAI API error: " + errText }, 500);
    }

    const openaiData = (await openaiRes.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const raw = openaiData.choices?.[0]?.message?.content ?? "";
    console.log("OpenAI raw response:", raw);

    // Strip markdown code fences if present
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

    let transactions: unknown[];
    try {
      transactions = JSON.parse(cleaned);
      if (!Array.isArray(transactions)) transactions = [transactions];
    } catch (parseErr) {
      console.log("JSON parse error:", parseErr, "raw:", cleaned);
      return c.json({ error: "Could not parse AI response as JSON. Raw: " + cleaned.slice(0, 200) }, 500);
    }

    return c.json({ transactions, raw: cleaned });
  } catch (e) {
    console.log("scan-receipt error:", e);
    return c.json({ error: "Error scanning receipt: " + e }, 500);
  }
});

// ── ADMIN: SEED TRANSACTIONS FOR A USER ───────────────────────────────────────

app.post("/make-server-8bfb3e73/admin/seed-transactions", async (c) => {
  try {
    const { email, transactions } = (await c.req.json()) as {
      email: string;
      transactions: Array<{
        type: string;
        amount: number;
        title: string;
        category: string;
        date: string;
        notes: string;
      }>;
    };

    if (!email || !transactions?.length) {
      return c.json({ error: "email and transactions[] are required" }, 400);
    }

    // Find user by email via admin API
    const listRes = await fetch(
      SUPABASE_URL + "/auth/v1/admin/users?per_page=1000",
      { headers: serviceHeaders() }
    );
    const listData = (await listRes.json()) as { users?: Array<Record<string, unknown>> };
    const authUser = (listData.users ?? []).find(
      (u) => (u.email as string)?.toLowerCase() === email.toLowerCase()
    );

    if (!authUser) {
      return c.json({ error: `No user found with email: ${email}` }, 404);
    }

    const userId = authUser.id as string;
    const created: unknown[] = [];

    for (const txn of transactions) {
      const id = crypto.randomUUID();
      const record = {
        id,
        userId,
        type: txn.type,
        amount: Number(txn.amount),
        title: txn.title,
        category: txn.category,
        date: txn.date,
        notes: txn.notes ?? "",
        createdAt: new Date().toISOString(),
      };
      await kv.set("txn:" + userId + ":" + id, record);
      created.push(record);
    }

    return c.json({ success: true, userId, inserted: created.length });
  } catch (e) {
    console.log("seed-transactions error:", e);
    return c.json({ error: "Error seeding transactions: " + e }, 500);
  }
});

// ── ADMIN: REMOVE SEED TRANSACTIONS FOR A USER ────────────────────────────────

app.delete("/make-server-8bfb3e73/admin/remove-seed", async (c) => {
  try {
    const { email } = (await c.req.json()) as { email: string };
    if (!email) return c.json({ error: "email is required" }, 400);

    // Resolve user id from email
    const listRes = await fetch(SUPABASE_URL + "/auth/v1/admin/users?per_page=1000", {
      headers: serviceHeaders(),
    });
    const listData = (await listRes.json()) as { users?: Array<Record<string, unknown>> };
    const authUser = (listData.users ?? []).find((u: any) => u.email === email);
    if (!authUser) return c.json({ error: `User not found: ${email}` }, 404);

    const userId = authUser.id as string;

    // Delete all transactions belonging to this user
    const allTxns = await kv.getByPrefix(`txn:${userId}:`);
    let deleted = 0;
    for (const txn of allTxns) {
      if (txn && (txn as any).id) {
        await kv.del(`txn:${userId}:${(txn as any).id}`);
        deleted++;
      }
    }

    console.log(`remove-seed: deleted ${deleted} transactions for ${email}`);
    return c.json({ success: true, deleted });
  } catch (e) {
    console.log("remove-seed error:", e);
    return c.json({ error: "Error removing seed transactions: " + e }, 500);
  }
});

// ── ADMIN: CLEAR ALL DATA ─────────────────────────────────────────────────────

app.get("/make-server-8bfb3e73/admin/users", async (c) => {
  try {
    const listRes = await fetch(SUPABASE_URL + "/auth/v1/admin/users?per_page=1000", {
      headers: serviceHeaders(),
    });
    const listData = (await listRes.json()) as { users?: Array<Record<string, unknown>> };
    const authUsers = listData.users ?? [];

    const enriched = await Promise.all(
      authUsers.map(async (u) => {
        const userId = u.id as string;
        const profile = ((await kv.get("profile:" + userId)) as Record<string, unknown>) ?? {};
        const txns = (await kv.getByPrefix("txn:" + userId + ":")) as unknown[];
        return {
          id: userId,
          email: u.email,
          createdAt: u.created_at,
          lastSignIn: u.last_sign_in_at,
          name: (profile.name as string) ?? (((u.user_metadata as Record<string, unknown>)?.name) as string) ?? "",
          currency: (profile.currency as string) ?? "IDR",
          transactionCount: txns.filter(Boolean).length,
        };
      })
    );

    return c.json({ users: enriched });
  } catch (e) {
    console.log("admin/users error:", e);
    return c.json({ error: "Error listing users: " + e }, 500);
  }
});

app.delete("/make-server-8bfb3e73/admin/users/:id", async (c) => {
  try {
    const userId = c.req.param("id");

    // Delete all transactions
    const txns = (await kv.getByPrefix("txn:" + userId + ":")) as Array<Record<string, unknown>>;
    for (const txn of txns) {
      if (txn?.id) await kv.del("txn:" + userId + ":" + (txn.id as string));
    }

    // Delete profile
    await kv.del("profile:" + userId);

    // Delete from Supabase Auth
    const delRes = await fetch(SUPABASE_URL + "/auth/v1/admin/users/" + userId, {
      method: "DELETE",
      headers: serviceHeaders(),
    });

    if (!delRes.ok) {
      const err = await delRes.text();
      console.log("admin delete user auth error:", err);
      return c.json({ error: "Auth delete failed: " + err }, 500);
    }

    return c.json({ success: true, deleted: userId });
  } catch (e) {
    console.log("admin/delete user error:", e);
    return c.json({ error: "Error deleting user: " + e }, 500);
  }
});

app.delete("/make-server-8bfb3e73/admin/clear-all", async (c) => {
  try {
    const allTxns = (await kv.getByPrefix("txn:")) as Array<Record<string, unknown>>;
    const allProfiles = (await kv.getByPrefix("profile:")) as Array<Record<string, unknown>>;
    for (const txn of allTxns) {
      if (txn?.userId && txn?.id) {
        await kv.del("txn:" + (txn.userId as string) + ":" + (txn.id as string));
      }
    }
    for (const profile of allProfiles) {
      if (profile?.userId) {
        await kv.del("profile:" + (profile.userId as string));
      }
    }
    const listRes = await fetch(SUPABASE_URL + "/auth/v1/admin/users?per_page=1000", {
      headers: serviceHeaders(),
    });
    const listData = (await listRes.json()) as { users?: Array<{ id: string }> };
    const users = listData.users ?? [];
    for (const u of users) {
      await fetch(SUPABASE_URL + "/auth/v1/admin/users/" + u.id, {
        method: "DELETE",
        headers: serviceHeaders(),
      });
    }
    return c.json({
      success: true,
      cleared: {
        transactions: allTxns.length,
        profiles: allProfiles.length,
        authUsers: users.length,
      },
    });
  } catch (e) {
    console.log("clearAll error:", e);
    return c.json({ error: "Error clearing data: " + e }, 500);
  }
});

Deno.serve(app.fetch);