/**
 * db.tsx — Direct PostgREST implementation of the KV interface.
 *
 * This replaces kv_store.tsx which internally imports npm:@supabase/supabase-js.
 * On Supabase projects that sign JWT keys with ES256, supabase-js's createClient()
 * throws "Unsupported JWT algorithm ES256" at module-initialisation time —
 * before Hono can register a single route.  By talking directly to PostgREST
 * with plain fetch() + the service-role key as a Bearer token we avoid every
 * form of local JWT parsing.
 *
 * Table: kv_store_8bfb3e73  (created by Figma Make)
 * Columns assumed: key TEXT PRIMARY KEY, value JSONB
 */

const SUPABASE_URL: string = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY: string = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const TABLE = "kv_store_8bfb3e73";

function h(): Record<string, string> {
  return {
    Authorization: "Bearer " + SERVICE_KEY,
    apikey: SERVICE_KEY,
    "Content-Type": "application/json",
  };
}

/** Fetch a single value by key.  Returns null when not found. */
export async function get(key: string): Promise<unknown> {
  try {
    const url =
      SUPABASE_URL +
      "/rest/v1/" +
      TABLE +
      "?key=eq." +
      encodeURIComponent(key) +
      "&select=value";
    const res = await fetch(url, { headers: h() });
    if (!res.ok) {
      console.log("db.get error:", res.status, await res.text());
      return null;
    }
    const rows = (await res.json()) as Array<{ value: unknown }>;
    return rows[0]?.value ?? null;
  } catch (e) {
    console.log("db.get exception:", e);
    return null;
  }
}

/** Upsert a key-value pair. */
export async function set(key: string, value: unknown): Promise<void> {
  const res = await fetch(SUPABASE_URL + "/rest/v1/" + TABLE, {
    method: "POST",
    headers: {
      ...h(),
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.log("db.set error:", res.status, text);
    throw new Error("db.set failed: " + text);
  }
}

/** Delete a key. */
export async function del(key: string): Promise<void> {
  try {
    const url =
      SUPABASE_URL +
      "/rest/v1/" +
      TABLE +
      "?key=eq." +
      encodeURIComponent(key);
    const res = await fetch(url, { method: "DELETE", headers: h() });
    if (!res.ok) console.log("db.del error:", res.status, await res.text());
  } catch (e) {
    console.log("db.del exception:", e);
  }
}

/**
 * Return all values whose key starts with prefix.
 * PostgREST LIKE wildcard is % which must be URL-encoded as %25.
 */
export async function getByPrefix(prefix: string): Promise<unknown[]> {
  try {
    // encodeURIComponent("%") → "%25", so PostgREST decodes it back to SQL LIKE 'prefix%'
    const likeVal = encodeURIComponent(prefix + "%");
    const url =
      SUPABASE_URL +
      "/rest/v1/" +
      TABLE +
      "?key=like." +
      likeVal +
      "&select=value";
    const res = await fetch(url, { headers: h() });
    if (!res.ok) {
      console.log("db.getByPrefix error:", res.status, await res.text());
      return [];
    }
    const rows = (await res.json()) as Array<{ value: unknown }>;
    return rows.map((r) => r.value);
  } catch (e) {
    console.log("db.getByPrefix exception:", e);
    return [];
  }
}

/** Fetch multiple values by key (parallel). */
export async function mget(keys: string[]): Promise<unknown[]> {
  return Promise.all(keys.map((k) => get(k)));
}

/** Upsert multiple key-value pairs (parallel). */
export async function mset(pairs: Array<[string, unknown]>): Promise<void> {
  await Promise.all(pairs.map(([k, v]) => set(k, v)));
}

/** Delete multiple keys (parallel). */
export async function mdel(keys: string[]): Promise<void> {
  await Promise.all(keys.map((k) => del(k)));
}
