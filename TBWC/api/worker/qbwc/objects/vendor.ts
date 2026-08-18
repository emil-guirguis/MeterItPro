/**
 * Vendor sync — the reference bidirectional object.
 *
 * PULL: VendorQueryRq -> qb_vendor + qbwc_map (existing QB vendors).
 * PUSH: for every public.users row not yet mapped to a Vendor, emit a
 *       VendorAddRq with requestID="vendor:add:<userId>". On the VendorAddRs we
 *       read the new ListID and record qbwc_map(tbwc_id=userId, qb_list_id=ListID)
 *       so we never re-add it.
 *
 * All requests share the "vendor" prefix so a single receiveResponseXML blob
 * (VendorQueryRs + N VendorAddRs) routes here; parseResponse handles each block.
 *
 * LIMITATION: users has no updated_at, so we only ADD unmapped reps — Modifications
 * to an already-pushed rep are not detected yet (needs a change hash / dirty flag).
 * Name collisions (statusCode 3100) are logged and skipped.
 */
import { Env, execQuery } from '../../db';
import { QbObject } from './types';
import { qbxmlDoc, tag, blocks, escapeXml, qbTimeToTs, num } from '../qbxml';

const REQUEST_ID = 'vendor';

async function pendingReps(env: Env): Promise<any[]> {
  const r = await execQuery(
    env,
    `SELECT u.id, u.email, u.first_name, u.last_name, u.agency_name,
            u.work_phone, u.mobile, u.addr1, u.addr2, u.city, u.state, u.postal
     FROM public.users u
     WHERE NOT EXISTS (
       SELECT 1 FROM public.qbwc_map m
       WHERE m.object_type = 'Vendor' AND m.tbwc_id = u.id::text
     )`,
    [],
    'qbwc.vendor.pendingReps'
  );
  return r.rows;
}

/** QB Vendor Name must be unique and <= 41 chars. */
function vendorName(u: any): string {
  const base = (u.agency_name || [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email || 'Vendor').trim();
  return base.slice(0, 41);
}

function vendorAddRq(u: any): string {
  const el = (t: string, v: any) => (v == null || v === '' ? '' : `      <${t}>${escapeXml(String(v))}</${t}>\n`);
  const addrLines =
    (u.addr1 || u.city || u.state || u.postal)
      ? `      <VendorAddress>\n` +
        el('Addr1', u.addr1) + el('Addr2', u.addr2) +
        el('City', u.city) + el('State', u.state) + el('PostalCode', u.postal) +
        `      </VendorAddress>\n`
      : '';
  return (
    `    <VendorAddRq requestID="${REQUEST_ID}:add:${u.id}">\n` +
    `      <VendorAdd>\n` +
    el('Name', vendorName(u)) +
    el('CompanyName', u.agency_name) +
    el('FirstName', u.first_name) +
    el('LastName', u.last_name) +
    addrLines +
    el('Phone', u.work_phone || u.mobile) +
    el('Email', u.email) +
    `      </VendorAdd>\n` +
    `    </VendorAddRq>`
  );
}

async function buildRequest(env: Env): Promise<string> {
  const reps = await pendingReps(env);
  const parts = [`    <VendorQueryRq requestID="${REQUEST_ID}"/>`, ...reps.map(vendorAddRq)];
  return qbxmlDoc(parts.join('\n'));
}

/** Upsert a single VendorRet into qb_vendor and its qbwc_map row. */
async function saveVendorRet(env: Env, ret: string, tbwcId: string | null): Promise<string | undefined> {
  const listId = tag(ret, 'ListID');
  if (!listId) return undefined;
  const editSeq = tag(ret, 'EditSequence') ?? null;
  const addr = blocks(ret, 'VendorAddress')[0];
  const vendorAddr = addr ? JSON.stringify({
    addr1: tag(addr, 'Addr1') ?? null, addr2: tag(addr, 'Addr2') ?? null,
    city: tag(addr, 'City') ?? null, state: tag(addr, 'State') ?? null,
    postal: tag(addr, 'PostalCode') ?? null,
  }) : null;
  const isActive = tag(ret, 'IsActive');

  await execQuery(
    env,
    `INSERT INTO public.qb_vendor
       (list_id, edit_sequence, name, company_name, first_name, last_name, email, phone,
        vendor_addr, is_active, balance, time_modified, raw, synced_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13::jsonb, CURRENT_TIMESTAMP)
     ON CONFLICT (list_id) DO UPDATE SET
       edit_sequence=EXCLUDED.edit_sequence, name=EXCLUDED.name, company_name=EXCLUDED.company_name,
       first_name=EXCLUDED.first_name, last_name=EXCLUDED.last_name, email=EXCLUDED.email,
       phone=EXCLUDED.phone, vendor_addr=EXCLUDED.vendor_addr, is_active=EXCLUDED.is_active,
       balance=EXCLUDED.balance, time_modified=EXCLUDED.time_modified, raw=EXCLUDED.raw,
       synced_at=CURRENT_TIMESTAMP`,
    [
      listId, editSeq,
      tag(ret, 'Name') ?? null,
      tag(ret, 'CompanyName') ?? null,
      tag(ret, 'FirstName') ?? null,
      tag(ret, 'LastName') ?? null,
      tag(ret, 'Email') ?? null,
      tag(ret, 'Phone') ?? null,
      vendorAddr,
      isActive == null ? null : isActive === 'true',
      num(tag(ret, 'Balance')),
      qbTimeToTs(tag(ret, 'TimeModified')),
      JSON.stringify({ listId, ret: ret.slice(0, 8000) }),
    ],
    'qbwc.vendor.upsert'
  );

  // Map: keep an existing tbwc_id unless this call supplies one (VendorAdd result).
  await execQuery(
    env,
    `INSERT INTO public.qbwc_map (object_type, tbwc_id, qb_list_id, qb_edit_sequence, last_synced_at)
     VALUES ('Vendor', $2, $1, $3, CURRENT_TIMESTAMP)
     ON CONFLICT (object_type, qb_list_id) DO UPDATE SET
       tbwc_id = COALESCE($2, public.qbwc_map.tbwc_id),
       qb_edit_sequence = EXCLUDED.qb_edit_sequence,
       last_synced_at = CURRENT_TIMESTAMP`,
    [listId, tbwcId, editSeq],
    'qbwc.vendor.map'
  );
  return listId;
}

async function parseResponse(env: Env, xml: string): Promise<void> {
  // --- pull results: only VendorRet *inside* the VendorQueryRs element ---
  const qBlock = xml.match(/<VendorQueryRs\b([^>]*)>([\s\S]*?)<\/VendorQueryRs>/);
  if (qBlock) {
    const qStatus = qBlock[1].match(/statusCode="([^"]*)"/)?.[1];
    if (!qStatus || qStatus === '0' || qStatus === '1') {
      for (const ret of blocks(qBlock[2], 'VendorRet')) {
        await saveVendorRet(env, ret, null);
      }
    } else {
      console.error('[QBWC] VendorQueryRs status', qStatus);
    }
  }

  // --- push (VendorAddRs) results, each carrying requestID="vendor:add:<userId>" ---
  const addRe = /<VendorAddRs\b([^>]*)>([\s\S]*?)<\/VendorAddRs>/g;
  let m: RegExpExecArray | null;
  while ((m = addRe.exec(xml)) !== null) {
    const attrs = m[1];
    const inner = m[2];
    const ridMatch = attrs.match(/requestID="([^"]*)"/);
    const scMatch = attrs.match(/statusCode="([^"]*)"/);
    const userId = ridMatch?.[1]?.split(':add:')[1];
    const sc = scMatch?.[1];
    if (sc && sc !== '0') {
      const msg = attrs.match(/statusMessage="([^"]*)"/)?.[1];
      console.error(`[QBWC] VendorAdd failed for user ${userId}: ${sc} ${msg}`);
      continue;
    }
    const ret = blocks(inner, 'VendorRet')[0];
    if (ret && userId) await saveVendorRet(env, ret, userId);
  }
}

const vendor: QbObject = { name: 'Vendor', requestID: REQUEST_ID, buildRequest, parseResponse };
export default vendor;
