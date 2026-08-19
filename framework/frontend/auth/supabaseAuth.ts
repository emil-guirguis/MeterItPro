/**
 * Framework Supabase Auth client.
 *
 * A standard-HTTPS-fetch wrapper over the Supabase Auth (GoTrue) REST API. No
 * @supabase/supabase-js dependency — every call is a plain fetch to
 * `${url}/auth/v1/*`, so any framework app authenticates the same way.
 *
 * Intended as the single shared login path for all apps on the framework:
 * the frontend obtains a Supabase-issued JWT here and sends it as a Bearer
 * token to the app's data API, which verifies it against the same project.
 */

export interface SupabaseAuthConfig {
  /** Project URL, e.g. https://xxxx.supabase.co */
  url: string;
  /** Public anon key (sent as the apikey header). */
  anonKey: string;
}

export interface SupabaseUser {
  id: string;
  email?: string;
  [key: string]: unknown;
}

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  /** Seconds until the access token expires. */
  expires_in: number;
  token_type: string;
  user: SupabaseUser;
}

export interface AuthResult<T> {
  data?: T;
  error?: string;
}

function authBase(url: string): string {
  return `${url.replace(/\/$/, '')}/auth/v1`;
}

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    // GoTrue returns { error, error_description } or { msg } / { message }.
    return (
      body.error_description ||
      body.msg ||
      body.message ||
      body.error ||
      `Auth request failed (${res.status})`
    );
  } catch {
    return `Auth request failed (${res.status})`;
  }
}

export function createSupabaseAuth(config: SupabaseAuthConfig) {
  const base = authBase(config.url);
  const apikey = config.anonKey;

  return {
    /** Password grant — validates credentials, returns a session with tokens. */
    async signInWithPassword(email: string, password: string): Promise<AuthResult<SupabaseSession>> {
      const res = await fetch(`${base}/token?grant_type=password`, {
        method: 'POST',
        headers: { apikey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return { error: await readError(res) };
      return { data: (await res.json()) as SupabaseSession };
    },

    /** Exchange a refresh token for a fresh session. */
    async refreshSession(refreshToken: string): Promise<AuthResult<SupabaseSession>> {
      const res = await fetch(`${base}/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: { apikey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) return { error: await readError(res) };
      return { data: (await res.json()) as SupabaseSession };
    },

    /** Fetch the user for an access token (also validates the token). */
    async getUser(accessToken: string): Promise<AuthResult<SupabaseUser>> {
      const res = await fetch(`${base}/user`, {
        headers: { apikey, Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return { error: await readError(res) };
      return { data: (await res.json()) as SupabaseUser };
    },

    /** Revoke the session server-side. */
    async signOut(accessToken: string): Promise<void> {
      await fetch(`${base}/logout`, {
        method: 'POST',
        headers: { apikey, Authorization: `Bearer ${accessToken}` },
      }).catch(() => {});
    },
  };
}

export type SupabaseAuthClient = ReturnType<typeof createSupabaseAuth>;
