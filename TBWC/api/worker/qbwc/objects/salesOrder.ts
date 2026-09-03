/**
 * SalesOrder pull (QB -> qb_sales_order). QB Premier/Enterprise only; on QB Pro
 * the QueryRq returns a statusCode we log and skip. Incremental via FromModifiedDate.
 */
import { Env, execQuery } from '../../db';
import { QbObject } from './types';
import {
  qbxmlDoc, tag, blocks, statusCode, escapeXml, refField, lineItems,
  qbTimeToTs, qbDate, num, toQbLocal, bumpSecond, QB_MAX_RETURNED,
} from '../qbxml';
import { multiRowValues, chunk, BATCH_SIZE } from '../batchSql';

const REQUEST_ID = 'salesorder';

async function since(env: Env): Promise<string | null> {
  const r = await execQuery(env, `SELECT MAX(time_modified) AS m FROM public.qb_sales_order`, [], 'qbwc.so.since');
  const m = r.rows[0]?.m;
  return m ? new Date(m).toISOString() : null;
}

async function buildRequest(env: Env): Promise<string> {
  const from = await since(env);
  const filter = from
    ? `\n      <ModifiedDateRangeFilter><FromModifiedDate>${escapeXml(toQbLocal(bumpSecond(from)))}</FromModifiedDate></ModifiedDateRangeFilter>`
    : '';
  // qbXML schema order for SalesOrderQueryRq: MaxReturned before
  // ModifiedDateRangeFilter, IncludeLineItems after all filters — QB rejects
  // the whole request (0x80040400) if MaxReturned isn't first.
  return qbxmlDoc(
    `    <SalesOrderQueryRq requestID="${REQUEST_ID}" iterator="Start">\n` +
    `      <MaxReturned>${QB_MAX_RETURNED}</MaxReturned>${filter}\n` +
    `      <IncludeLineItems>true</IncludeLineItems>\n    </SalesOrderQueryRq>`
  );
}

async function parseResponse(env: Env, xml: string): Promise<void> {
  const status = statusCode(xml, 'SalesOrderQueryRs');
  if (status && status !== '0' && status !== '1') {
    console.error('[QBWC] SalesOrderQueryRs status', status, '(QB Pro does not support SalesOrders)');
    return;
  }
  const rets = blocks(xml, 'SalesOrderRet');
  console.log(`[QBWC] SalesOrderQueryRs: ${rets.length} sales order(s)`);

  // Collect rows, deduped by txn_id (last wins) — a duplicate key inside one
  // multi-row upsert makes Postgres error with "cannot affect row a second time".
  const byId = new Map<string, any[]>();
  for (const ret of rets) {
    const txnId = tag(ret, 'TxnID');
    if (!txnId) continue;
    const cust = refField(ret, 'CustomerRef');
    const boolOf = (v: string | undefined) => (v == null ? null : v === 'true');
    byId.set(txnId, [
      txnId,
      tag(ret, 'EditSequence') ?? null,
      tag(ret, 'RefNumber') ?? null,
      cust.listId ?? null,
      cust.fullName ?? null,
      qbDate(tag(ret, 'TxnDate')),
      num(tag(ret, 'TotalAmount')),
      boolOf(tag(ret, 'IsFullyInvoiced')),
      boolOf(tag(ret, 'IsManuallyClosed')),
      JSON.stringify(lineItems(ret, 'SalesOrderLineRet')),
      qbTimeToTs(tag(ret, 'TimeModified')),
      JSON.stringify({ txnId, ret: ret.slice(0, 8000) }),
    ]);
  }

  // Batched multi-row upserts: execQuery opens a connection per call, so an
  // iterator page must be a handful of statements, not one per record.
  const CASTS = ['', '', '', '', '', '', '', '', '', '::jsonb', '', '::jsonb'];
  for (const rows of chunk([...byId.values()], BATCH_SIZE)) {
    await execQuery(
      env,
      `INSERT INTO public.qb_sales_order
         (txn_id, edit_sequence, ref_number, customer_list_id, customer_name, txn_date,
          total, is_fully_invoiced, is_manually_closed, lines, time_modified, raw, synced_at)
       VALUES ${multiRowValues(rows.length, CASTS, ', CURRENT_TIMESTAMP')}
       ON CONFLICT (txn_id) DO UPDATE SET
         edit_sequence=EXCLUDED.edit_sequence, ref_number=EXCLUDED.ref_number,
         customer_list_id=EXCLUDED.customer_list_id, customer_name=EXCLUDED.customer_name,
         txn_date=EXCLUDED.txn_date, total=EXCLUDED.total, is_fully_invoiced=EXCLUDED.is_fully_invoiced,
         is_manually_closed=EXCLUDED.is_manually_closed, lines=EXCLUDED.lines,
         time_modified=EXCLUDED.time_modified, raw=EXCLUDED.raw, synced_at=CURRENT_TIMESTAMP`,
      rows.flat(),
      'qbwc.so.upsert'
    );
    await execQuery(
      env,
      `INSERT INTO public.qbwc_map (qb_list_id, qb_edit_sequence, object_type, last_synced_at)
       VALUES ${multiRowValues(rows.length, ['', ''], `, 'SalesOrder', CURRENT_TIMESTAMP`)}
       ON CONFLICT (object_type, qb_list_id) DO UPDATE SET
         qb_edit_sequence=EXCLUDED.qb_edit_sequence, last_synced_at=CURRENT_TIMESTAMP`,
      rows.flatMap((r) => [r[0], r[1]]),
      'qbwc.so.map'
    );
  }
}

const salesOrder: QbObject = {
  name: 'SalesOrder',
  requestID: REQUEST_ID,
  buildRequest,
  parseResponse,
  iteratorExtra: '      <IncludeLineItems>true</IncludeLineItems>\n',
};
export default salesOrder;
