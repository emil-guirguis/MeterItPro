/**
 * Rep inquiries (rep_leads) client.
 *
 * Ports the tbwc-site admin "Rep Inquiries" logic: list inquiries, approve
 * (mint an invite token + email the applicant a signup link), and delete
 * (which also sweeps an orphaned auth account, via the delete-lead edge fn).
 *
 * Like storageService, this talks to the shared Supabase project directly with
 * plain fetch (PostgREST + edge functions) using the admin's access token — the
 * same project this portal already authenticates against. Approve/delete reuse
 * the existing tbwc-site edge functions so business logic isn't duplicated.
 */
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/api';
import { tokenStorage } from '../utils/tokenStorage';

/** Where a rep completes signup — the public tbwc-site page, not this admin app. */
const SIGNUP_BASE = 'https://tbwctechnology.com/rep-signup.html';

export interface RepLead {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  about: string | null;
  /** Set once an invite has been sent. */
  invited_at: string | null;
  /** Applicant confirmed their email — gates the Approve button. */
  email_verified: boolean;
  created_at: string;
}

function restBase(): string {
  return `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1`;
}
function fnBase(): string {
  return `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1`;
}

function authHeaders(): Record<string, string> {
  const token = tokenStorage.getToken();
  if (!token) throw new Error('Not signed in — please log in again.');
  return { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY };
}

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.error || body.message || body.msg || body.hint || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

const LEAD_COLS = 'id,first_name,last_name,email,phone,about,invited_at,email_verified,created_at';

/** All inquiries, newest first. */
export async function listLeads(): Promise<RepLead[]> {
  const res = await fetch(
    `${restBase()}/rep_leads?select=${LEAD_COLS}&order=created_at.desc`,
    { headers: { ...authHeaders(), Accept: 'application/json' } }
  );
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as RepLead[];
}

/**
 * Approve an inquiry: mint an invite token, stamp the row, and email the
 * applicant a signup link. Mirrors tbwc-site admin.html onLeadAction.
 */
export async function approveLead(id: string): Promise<{ email: string }> {
  const token = crypto.randomUUID();
  const patch = await fetch(
    `${restBase()}/rep_leads?id=eq.${encodeURIComponent(id)}&select=first_name,email`,
    {
      method: 'PATCH',
      headers: {
        ...authHeaders(),
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ invite_token: token, invited_at: new Date().toISOString() }),
    }
  );
  if (!patch.ok) throw new Error(await readError(patch));
  const rows = (await patch.json()) as { first_name: string | null; email: string }[];
  const row = rows[0];
  if (!row) throw new Error('Inquiry not found.');

  const link = `${SIGNUP_BASE}?token=${token}`;
  const mail = await fetch(`${fnBase()}/send-mail`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'invite', email: row.email, firstName: row.first_name, link }),
  });
  if (!mail.ok) {
    throw new Error('Approved, but the invite email failed to send — try again or check the address.');
  }
  return { email: row.email };
}

/** Delete an inquiry (edge fn also removes any orphaned auth account). */
export async function deleteLead(id: string): Promise<void> {
  const res = await fetch(`${fnBase()}/delete-lead`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error(await readError(res));
}
