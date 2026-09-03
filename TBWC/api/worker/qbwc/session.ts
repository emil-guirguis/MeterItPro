/**
 * QBWC session state, persisted in public.qbwc_session keyed by ticket.
 *
 * A single Web Connector run is multi-request:
 *   authenticate -> (sendRequestXML -> receiveResponseXML)* -> closeConnection
 * Cloudflare may route each request to a different isolate, so state MUST live in
 * the database, not process memory. We remember, per ticket, the ordered queue of
 * qbXML requests still to send and how far through it we are (to report progress).
 */
import { Env, execQuery } from '../db';

export interface QbwcSession {
  ticket: string;
  companyFile: string;
  /** qbXML request bodies still to be sent, in order. */
  queue: string[];
  /** index of the next request to send from `queue`. */
  cursor: number;
  lastError: string;
}

const SESSION_TTL = "30 minutes";

function rowToSession(r: any): QbwcSession {
  return {
    ticket: r.qbwc_session_id,
    companyFile: r.company_file ?? '',
    // jsonb comes back already parsed from pg.
    queue: Array.isArray(r.queue) ? r.queue : JSON.parse(r.queue ?? '[]'),
    cursor: r.cursor ?? 0,
    lastError: r.last_error ?? '',
  };
}

export async function createSession(env: Env, ticket: string, queue: string[]): Promise<QbwcSession> {
  await reap(env);
  await execQuery(
    env,
    `INSERT INTO public.qbwc_session (qbwc_session_id, queue, cursor, last_error)
     VALUES ($1, $2::jsonb, 0, '')`,
    [ticket, JSON.stringify(queue)],
    'qbwc.createSession'
  );
  return { ticket, companyFile: '', queue, cursor: 0, lastError: '' };
}

export async function getSession(env: Env, ticket: string): Promise<QbwcSession | undefined> {
  if (!ticket) return undefined;
  const r = await execQuery(
    env,
    `SELECT qbwc_session_id, company_file, queue, cursor, last_error
     FROM public.qbwc_session WHERE qbwc_session_id = $1`,
    [ticket],
    'qbwc.getSession'
  );
  return r.rows.length ? rowToSession(r.rows[0]) : undefined;
}

/**
 * Splice a follow-up request (an iterator `Continue` page) into the queue right
 * after the item currently at `cursor`, so it's sent on the next poll. Queue
 * lives in the DB (see module doc), so this re-persists the whole array.
 */
export async function insertAfterCursor(env: Env, ticket: string, cursor: number, qbxml: string): Promise<number> {
  const r = await execQuery(
    env,
    `SELECT queue FROM public.qbwc_session WHERE qbwc_session_id = $1`,
    [ticket],
    'qbwc.insertAfterCursor.read'
  );
  if (!r.rows.length) return 0;
  const queue: string[] = Array.isArray(r.rows[0].queue) ? r.rows[0].queue : JSON.parse(r.rows[0].queue ?? '[]');
  queue.splice(cursor + 1, 0, qbxml);
  await execQuery(
    env,
    `UPDATE public.qbwc_session SET queue = $2::jsonb WHERE qbwc_session_id = $1`,
    [ticket, JSON.stringify(queue)],
    'qbwc.insertAfterCursor.write'
  );
  return queue.length;
}

/** Advance the cursor by one and optionally record an error; returns new cursor. */
export async function advanceCursor(env: Env, ticket: string, lastError?: string): Promise<number> {
  const r = await execQuery(
    env,
    `UPDATE public.qbwc_session
     SET cursor = cursor + 1, last_error = COALESCE($2, last_error)
     WHERE qbwc_session_id = $1
     RETURNING cursor`,
    [ticket, lastError ?? null],
    'qbwc.advanceCursor'
  );
  return r.rows.length ? r.rows[0].cursor : 0;
}

export async function dropSession(env: Env, ticket: string): Promise<void> {
  if (!ticket) return;
  await execQuery(
    env,
    `DELETE FROM public.qbwc_session WHERE qbwc_session_id = $1`,
    [ticket],
    'qbwc.dropSession'
  );
}

/** Percent complete (0..100) for QBWC's progress bar; 100 signals "done". */
export function progress(s: QbwcSession): number {
  if (s.queue.length === 0) return 100;
  return Math.floor((s.cursor / s.queue.length) * 100);
}

async function reap(env: Env): Promise<void> {
  await execQuery(
    env,
    `DELETE FROM public.qbwc_session WHERE created_at < NOW() - INTERVAL '${SESSION_TTL}'`,
    [],
    'qbwc.reap'
  );
}
