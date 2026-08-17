import axios from 'axios';

/**
 * Format a PostgreSQL (or any) error with full context.
 * Extracts pg-specific fields: table, column, detail, code, constraint.
 */
export function formatPgError(error: unknown): string {
  if (!error || typeof error !== 'object') return String(error);
  const e = error as any;
  const parts: string[] = [e.message || 'Unknown error'];
  if (e.table) parts.push(`table: ${e.table}`);
  if (e.column) parts.push(`column: ${e.column}`);
  if (e.detail) parts.push(`detail: ${e.detail}`);
  if (e.code) parts.push(`pg_code: ${e.code}`);
  if (e.constraint) parts.push(`constraint: ${e.constraint}`);
  if (e.sql) parts.push(`sql: ${e.sql.replace(/\s+/g, ' ').trim()}`);
  if (Array.isArray(e.sqlParams) && e.sqlParams.length > 0) {
    parts.push(`params: [${e.sqlParams.map((p: any) => JSON.stringify(p)).join(', ')}]`);
  }
  return parts.join(' | ');
}

/**
 * Send a sync failure alert email via Resend API.
 * Silently skips if RESEND_API_KEY is not set.
 */
export async function sendSyncFailureAlert(subject: string, body: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[SyncAlert] RESEND_API_KEY not set — skipping failure email');
    return;
  }
  const to = process.env.ALERT_EMAIL || 'emilguirguis@yahoo.com';
  const from = process.env.RESEND_FROM || 'MeterItPro <noreply@mail.meteritpro.com>';

  try {
    await axios.post(
      'https://api.resend.com/emails',
      { from, to: [to], subject, html: `<pre style="font-family:monospace">${body}</pre>` },
      { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 10000 }
    );
    console.log(`✅ [SyncAlert] Failure alert sent to ${to}: ${subject}`);
  } catch (err: any) {
    console.error(`❌ [SyncAlert] Failed to send alert email: ${err?.message ?? err}`);
  }
}
