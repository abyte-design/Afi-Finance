import { projectId, publicAnonKey } from '/utils/supabase/info';

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-8bfb3e73`;

/**
 * IMPORTANT — ES256 gateway workaround:
 * Newer Supabase projects sign user access_tokens with ES256 (ECDSA).
 * The Supabase edge-function gateway verifies the Authorization Bearer token
 * using its own JWT library, which rejects ES256 tokens with
 * "Unsupported JWT algorithm ES256" before our Hono handler ever runs.
 *
 * The anon key is HS256-signed and is always accepted by the gateway.
 * So we ALWAYS put the anon key in Authorization (satisfying the gateway),
 * and pass the user's actual token in the custom X-User-Token header
 * (our server reads this to identify the user via Supabase Auth REST).
 */
async function req(path: string, opts: RequestInit = {}, token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    // Always use anon key — never the user's ES256 token — in Authorization.
    'Authorization': `Bearer ${publicAnonKey}`,
  };

  // Pass the user's access token separately so the server can verify identity
  // without going through the ES256-incompatible gateway JWT check.
  if (token) {
    headers['X-User-Token'] = token;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { ...opts, headers });
  } catch (networkErr) {
    throw new Error(`Network error: ${networkErr}`);
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server error (${res.status}): non-JSON response`);
  }

  if (!res.ok) {
    const msg = data?.error || data?.message || data?.msg || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

export const api = {
  auth: {
    signup: (email: string, password: string, name: string) =>
      req('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, name }) }),
    signin: (email: string, password: string) =>
      req('/auth/signin', { method: 'POST', body: JSON.stringify({ email, password }) }),
  },
  transactions: {
    getAll: (token: string) => req('/transactions', {}, token),
    create: (token: string, data: object) =>
      req('/transactions', { method: 'POST', body: JSON.stringify(data) }, token),
    update: (token: string, id: string, data: object) =>
      req(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
    delete: (token: string, id: string) =>
      req(`/transactions/${id}`, { method: 'DELETE' }, token),
  },
  profile: {
    get: (token: string) => req('/profile', {}, token),
    update: (token: string, data: object) =>
      req('/profile', { method: 'PUT', body: JSON.stringify(data) }, token),
  },
  avatar: {
    upload: (token: string, base64: string, mimeType: string) =>
      req('/avatar/upload', { method: 'POST', body: JSON.stringify({ base64, mimeType }) }, token),
    getUrl: (token: string) => req('/avatar', {}, token),
  },
};
