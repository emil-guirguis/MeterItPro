import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifySupabaseToken } from './supabaseVerify';

const ENV = {
  SUPABASE_URL: 'https://proj.supabase.co/',
  SUPABASE_ANON_KEY: 'anon-key',
} as any;

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

/** Build a Response-like object for the mocked fetch. */
const resp = (ok: boolean, body: any) => ({ ok, json: () => Promise.resolve(body) });

describe('verifySupabaseToken', () => {
  it('calls the Supabase /auth/v1/user endpoint with apikey + bearer', async () => {
    fetchMock.mockResolvedValue(resp(true, { id: 'u1', email: 'a@b.com' }));
    const v = await verifySupabaseToken(ENV, 'tok-endpoint');
    expect(v).toEqual({ userId: 'u1', email: 'a@b.com' });

    const [url, init] = fetchMock.mock.calls[0];
    // trailing slash on SUPABASE_URL is trimmed
    expect(url).toBe('https://proj.supabase.co/auth/v1/user');
    expect(init.headers.apikey).toBe('anon-key');
    expect(init.headers.Authorization).toBe('Bearer tok-endpoint');
  });

  it('returns null when the token is rejected (non-2xx)', async () => {
    fetchMock.mockResolvedValue(resp(false, {}));
    expect(await verifySupabaseToken(ENV, 'tok-bad')).toBeNull();
  });

  it('returns null when the response has no user id', async () => {
    fetchMock.mockResolvedValue(resp(true, { email: 'a@b.com' }));
    expect(await verifySupabaseToken(ENV, 'tok-noid')).toBeNull();
  });

  it('defaults a missing email to null', async () => {
    fetchMock.mockResolvedValue(resp(true, { id: 'u2' }));
    expect(await verifySupabaseToken(ENV, 'tok-noemail')).toEqual({ userId: 'u2', email: null });
  });

  it('caches a verified token and does not re-fetch within the TTL', async () => {
    fetchMock.mockResolvedValue(resp(true, { id: 'u3', email: 'c@d.com' }));
    const a = await verifySupabaseToken(ENV, 'tok-cached');
    const b = await verifySupabaseToken(ENV, 'tok-cached');
    expect(a).toEqual(b);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
