/**
 * Public re-verification link click — no auth, the token is the credential.
 * Backs VerifyEmailPage. See TBWC/api/worker/routes/verify.ts.
 */
import { API_BASE_URL } from '../config/api';

export type VerifyStatus = 'ok' | 'invalid' | 'expired';

export async function consumeVerifyToken(token: string): Promise<VerifyStatus> {
  const res = await fetch(`${API_BASE_URL}/verify?token=${encodeURIComponent(token)}`);
  const body = await res.json().catch(() => ({}));
  if (body.status === 'ok' || body.status === 'invalid' || body.status === 'expired') {
    return body.status;
  }
  throw new Error(body.message || `Verification failed (${res.status})`);
}
