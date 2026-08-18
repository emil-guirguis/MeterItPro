/**
 * Verify a Supabase access token by calling the Auth REST API
 * (GET /auth/v1/user) — a standard HTTPS fetch, no JWT secret needed.
 * Results are cached per-token within the isolate to avoid a round-trip on
 * every request.
 */
import { Env } from './db';

interface CacheEntry {
  userId: string;
  email: string | null;
  expiresAt: number;
}

const TTL_MS = 60_000; // 1 min — short, since tokens can be revoked
const cache = new Map<string, CacheEntry>();

export interface VerifiedToken {
  userId: string;
  email: string | null;
}

export async function verifySupabaseToken(env: Env, token: string): Promise<VerifiedToken | null> {
  const now = Date.now();
  const cached = cache.get(token);
  if (cached && cached.expiresAt > now) {
    return { userId: cached.userId, email: cached.email };
  }

  const res = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;

  const user = (await res.json()) as { id?: string; email?: string };
  if (!user?.id) return null;

  const entry: CacheEntry = { userId: user.id, email: user.email ?? null, expiresAt: now + TTL_MS };
  cache.set(token, entry);
  return { userId: entry.userId, email: entry.email };
}
