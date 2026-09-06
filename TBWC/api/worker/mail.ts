/**
 * Server-side caller for the tbwc-site Supabase edge fn `send-mail`.
 * Mirrors the frontend's repLeadsService.approveLead, which calls the same
 * fn with the admin's own access token — the cron has no browser session to
 * borrow one from, so it authenticates as the service role instead.
 */
import { Env } from './db';

export interface SendMailPayload {
  type: string;
  email: string;
  firstName?: string | null;
  link: string;
}

export async function sendMail(env: Env, payload: SendMailPayload): Promise<void> {
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');

  const res = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}/functions/v1/send-mail`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`send-mail failed (${res.status}): ${await res.text().catch(() => '')}`);
  }
}
