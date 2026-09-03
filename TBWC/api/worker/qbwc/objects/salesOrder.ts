/**
 * SalesOrder pull (QB -> qb_sales_order). QB Premier/Enterprise only; on QB Pro
 * the QueryRq returns a statusCode we log and skip. Incremental via FromModifiedDate.
 */
import { Env, execQuery } from '../../db';
import { QbObject } from './types';
import {
  qbxmlDoc, tag, blocks, statusCode, escapeXml, refField, lineItems,
  qbTimeToTs, qbDate, num, toQbLocal, bumpSecond,
} from '../qbxml';

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
  return qbxmlDoc(
    `    <SalesOrderQueryRq requestID="${REQUEST_ID}">${filter}\n` +
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

  for (const ret of rets) {
    const txnId = tag(ret, 'TxnID');
    if (!txnId) continue;
    const cust = refField(ret, 'CustomerRef');
    const boolOf = (v: string | undefined) => (v == null ? null : v === 'true');
    await execQuery(
      env,
      `INSERT INTO public.qb_sales_order
         (txn_id, edit_sequence, ref_number, customer_list_id, customer_name, txn_date,
          total, is_fully_invoiced, is_manually_closed, lines, time_modified, raw, synced_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12::jsonb, CURRENT_TIMESTAMP)
       ON CONFLICT (txn_id) DO UPDATE SET
         edit_sequence=EXCLUDED.edit_sequence, ref_number=EXCLUDED.ref_number,
         customer_list_id=EXCLUDED.customer_list_id, customer_name=EXCLUDED.customer_name,
         txn_date=EXCLUDED.txn_date, total=EXCLUDED.total, is_fully_invoiced=EXCLUDED.is_fully_invoiced,
         is_manually_closed=EXCLUDED.is_manually_closed, lines=EXCLUDED.lines,
         time_modified=EXCLUDED.time_modified, raw=EXCLUDED.raw, synced_at=CURRENT_TIMESTAMP`,
      [
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
      ],
      'qbwc.so.upsert'
    );
    await execQuery(
      env,
      `INSERT INTO public.qbwc_map (object_type, qb_list_id, qb_edit_sequence, last_synced_at)
       VALUES ('SalesOrder', $1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (object_type, qb_list_id) DO UPDATE SET
         qb_edit_sequence=EXCLUDED.qb_edit_sequence, last_synced_at=CURRENT_TIMESTAMP`,
      [txnId, tag(ret, 'EditSequence') ?? null],
      'qbwc.so.map'
    );
  }
}

const salesOrder: QbObject = { name: 'SalesOrder', requestID: REQUEST_ID, buildRequest, parseResponse };
export default salesOrder;
