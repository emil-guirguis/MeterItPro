/**
 * Customer sync (reference implementation).
 *
 * PULL (QB -> TBWC): CustomerQueryRq, optionally incremental via FromModifiedDate
 * (the max time_modified we've already stored). Each CustomerRet is upserted into
 * qb_customer and its ListID/EditSequence recorded in qbwc_map.
 *
 * PUSH (TBWC -> QB): buildRequest also emits CustomerAddRq/CustomerModRq — left as
 * a TODO stub here until the TBWC->QB field mapping is confirmed.
 */
import { Env, execQuery } from '../../db';
import { QbObject } from './types';
import {
  qbxmlDoc, tag, blocks, statusCode, escapeXml, qbTimeToTs, toQbLocal, bumpSecond, QB_MAX_RETURNED,
} from '../qbxml';

const REQUEST_ID = 'customer';

async function lastModified(env: Env): Promise<string | null> {
  const r = await execQuery(
    env,
    `SELECT MAX(time_modified) AS m FROM public.qb_customer`,
    [],
    'qbwc.customer.lastModified'
  );
  const m = r.rows[0]?.m;
  return m ? new Date(m).toISOString() : null;
}

async function buildRequest(env: Env): Promise<string> {
  const since = await lastModified(env);
  // qbXML LIST queries (Customer/SalesRep) take a bare <FromModifiedDate> that
  // must come AFTER <ActiveStatus>. The <ModifiedDateRangeFilter> wrapper is
  // transaction-only; using it on a list query makes QB reject the whole request
  // with 0x80040400 (parse error). Emit QB-local time WITH offset (toQbLocal) so
  // the incremental window matches QB's local TimeModified.
  const fromMod = since
    ? `\n      <FromModifiedDate>${escapeXml(toQbLocal(bumpSecond(since)))}</FromModifiedDate>`
    : '';
  const rq =
    `    <CustomerQueryRq requestID="${REQUEST_ID}" iterator="Start">\n` +
    // All (not ActiveOnly): TBWC's customer counts must include inactive
    // customers to match QuickBooks' own totals.
    `      <ActiveStatus>All</ActiveStatus>${fromMod}\n` +
    `      <MaxReturned>${QB_MAX_RETURNED}</MaxReturned>\n` +
    `    </CustomerQueryRq>`;
  return qbxmlDoc(rq);
  // PUSH TODO: append CustomerAddRq/ModRq for pending TBWC records once mapping known.
}

async function parseResponse(env: Env, xml: string): Promise<void> {
  const status = statusCode(xml, 'CustomerQueryRs');
  // statusCode 1 = "no matching records" (empty result) — not an error.
  if (status && status !== '0' && status !== '1') {
    console.error('[QBWC] CustomerQueryRs status', status);
    return;
  }

  const rets = blocks(xml, 'CustomerRet');
  console.log(`[QBWC] CustomerQueryRs: ${rets.length} customer(s)`);

  for (const ret of rets) {
    const listId = tag(ret, 'ListID');
    if (!listId) continue;
    const editSeq = tag(ret, 'EditSequence') ?? null;
    const timeModified = qbTimeToTs(tag(ret, 'TimeModified'));

    const billAddrBlock = blocks(ret, 'BillAddress')[0];
    const billAddr = billAddrBlock ? JSON.stringify({
      addr1: tag(billAddrBlock, 'Addr1') ?? null,
      addr2: tag(billAddrBlock, 'Addr2') ?? null,
      city: tag(billAddrBlock, 'City') ?? null,
      state: tag(billAddrBlock, 'State') ?? null,
      postal: tag(billAddrBlock, 'PostalCode') ?? null,
    }) : null;

    const isActiveStr = tag(ret, 'IsActive');
    const balanceStr = tag(ret, 'Balance');

    await execQuery(
      env,
      `INSERT INTO public.qb_customer
         (list_id, edit_sequence, full_name, name, company_name, first_name,
          last_name, email, phone, bill_addr, is_active, balance, time_modified, raw, synced_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13,$14::jsonb, CURRENT_TIMESTAMP)
       ON CONFLICT (list_id) DO UPDATE SET
         edit_sequence = EXCLUDED.edit_sequence,
         full_name     = EXCLUDED.full_name,
         name          = EXCLUDED.name,
         company_name  = EXCLUDED.company_name,
         first_name    = EXCLUDED.first_name,
         last_name     = EXCLUDED.last_name,
         email         = EXCLUDED.email,
         phone         = EXCLUDED.phone,
         bill_addr     = EXCLUDED.bill_addr,
         is_active     = EXCLUDED.is_active,
         balance       = EXCLUDED.balance,
         time_modified = EXCLUDED.time_modified,
         raw           = EXCLUDED.raw,
         synced_at     = CURRENT_TIMESTAMP`,
      [
        listId,
        editSeq,
        tag(ret, 'FullName') ?? null,
        tag(ret, 'Name') ?? null,
        tag(ret, 'CompanyName') ?? null,
        tag(ret, 'FirstName') ?? null,
        tag(ret, 'LastName') ?? null,
        tag(ret, 'Email') ?? null,
        tag(ret, 'Phone') ?? null,
        billAddr,
        isActiveStr == null ? null : isActiveStr === 'true',
        balanceStr == null ? null : Number(balanceStr),
        timeModified,
        JSON.stringify({ listId, ret: ret.slice(0, 8000) }),
      ],
      'qbwc.customer.upsert'
    );

    // Record the QB identity so future *ModRq can supply the current EditSequence.
    await execQuery(
      env,
      `INSERT INTO public.qbwc_map (object_type, qb_list_id, qb_edit_sequence, last_synced_at)
       VALUES ('Customer', $1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (object_type, qb_list_id) DO UPDATE SET
         qb_edit_sequence = EXCLUDED.qb_edit_sequence,
         last_synced_at   = CURRENT_TIMESTAMP`,
      [listId, editSeq],
      'qbwc.customer.map'
    );
  }
}

const customer: QbObject = { name: 'Customer', requestID: REQUEST_ID, buildRequest, parseResponse };
export default customer;
