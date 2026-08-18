/**
 * Invoice pull (QB -> qb_invoice). Incremental via FromModifiedDate. Lines are
 * flattened into a jsonb array; header customer ref + totals into columns.
 */
import { Env, execQuery } from '../../db';
import { QbObject } from './types';
import {
  qbxmlDoc, tag, blocks, statusCode, escapeXml, refField, lineItems,
  qbTimeToTs, qbDate, num,
} from '../qbxml';

const REQUEST_ID = 'invoice';

async function since(env: Env): Promise<string | null> {
  const r = await execQuery(env, `SELECT MAX(time_modified) AS m FROM public.qb_invoice`, [], 'qbwc.invoice.since');
  const m = r.rows[0]?.m;
  return m ? new Date(m).toISOString() : null;
}

async function buildRequest(env: Env): Promise<string> {
  const from = await since(env);
  const filter = from
    ? `\n      <ModifiedDateRangeFilter><FromModifiedDate>${escapeXml(from)}</FromModifiedDate></ModifiedDateRangeFilter>`
    : '';
  return qbxmlDoc(
    `    <InvoiceQueryRq requestID="${REQUEST_ID}">${filter}\n` +
    `      <IncludeLineItems>true</IncludeLineItems>\n` +
    `    </InvoiceQueryRq>`
  );
}

async function parseResponse(env: Env, xml: string): Promise<void> {
  const status = statusCode(xml, 'InvoiceQueryRs');
  if (status && status !== '0' && status !== '1') {
    console.error('[QBWC] InvoiceQueryRs status', status);
    return;
  }
  const rets = blocks(xml, 'InvoiceRet');
  console.log(`[QBWC] InvoiceQueryRs: ${rets.length} invoice(s)`);

  for (const ret of rets) {
    const txnId = tag(ret, 'TxnID');
    if (!txnId) continue;
    const cust = refField(ret, 'CustomerRef');
    await execQuery(
      env,
      `INSERT INTO public.qb_invoice
         (txn_id, edit_sequence, ref_number, customer_list_id, customer_name, txn_date,
          due_date, subtotal, total, balance_remaining, is_paid, lines, time_modified, raw, synced_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14::jsonb, CURRENT_TIMESTAMP)
       ON CONFLICT (txn_id) DO UPDATE SET
         edit_sequence=EXCLUDED.edit_sequence, ref_number=EXCLUDED.ref_number,
         customer_list_id=EXCLUDED.customer_list_id, customer_name=EXCLUDED.customer_name,
         txn_date=EXCLUDED.txn_date, due_date=EXCLUDED.due_date, subtotal=EXCLUDED.subtotal,
         total=EXCLUDED.total, balance_remaining=EXCLUDED.balance_remaining, is_paid=EXCLUDED.is_paid,
         lines=EXCLUDED.lines, time_modified=EXCLUDED.time_modified, raw=EXCLUDED.raw,
         synced_at=CURRENT_TIMESTAMP`,
      [
        txnId,
        tag(ret, 'EditSequence') ?? null,
        tag(ret, 'RefNumber') ?? null,
        cust.listId ?? null,
        cust.fullName ?? null,
        qbDate(tag(ret, 'TxnDate')),
        qbDate(tag(ret, 'DueDate')),
        num(tag(ret, 'Subtotal')),
        // QB InvoiceRet has no Total element: total = Subtotal + SalesTaxTotal.
        (() => {
          const sub = num(tag(ret, 'Subtotal'));
          const taxV = num(tag(ret, 'SalesTaxTotal'));
          if (sub == null && taxV == null) return null;
          return (sub ?? 0) + (taxV ?? 0);
        })(),
        num(tag(ret, 'BalanceRemaining')),
        (() => { const b = num(tag(ret, 'BalanceRemaining')); return b == null ? null : b === 0; })(),
        JSON.stringify(lineItems(ret, 'InvoiceLineRet')),
        qbTimeToTs(tag(ret, 'TimeModified')),
        JSON.stringify({ txnId, ret: ret.slice(0, 8000) }),
      ],
      'qbwc.invoice.upsert'
    );

    await execQuery(
      env,
      `INSERT INTO public.qbwc_map (object_type, qb_list_id, qb_edit_sequence, last_synced_at)
       VALUES ('Invoice', $1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (object_type, qb_list_id) DO UPDATE SET
         qb_edit_sequence=EXCLUDED.qb_edit_sequence, last_synced_at=CURRENT_TIMESTAMP`,
      [txnId, tag(ret, 'EditSequence') ?? null],
      'qbwc.invoice.map'
    );
  }
}

const invoice: QbObject = { name: 'Invoice', requestID: REQUEST_ID, buildRequest, parseResponse };
export default invoice;
