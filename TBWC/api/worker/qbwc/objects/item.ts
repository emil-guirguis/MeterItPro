/**
 * Item pull (QB -> qb_item). ItemQueryRq returns each item as a type-specific
 * element (ItemServiceRet, ItemInventoryRet, …). Price/desc live either directly
 * (Inventory) or nested under SalesOrPurchase / SalesAndPurchase (Service etc.),
 * so we probe both. item_type is derived from the *Ret element name.
 */
import { Env, execQuery } from '../../db';
import { QbObject } from './types';
import { qbxmlDoc, tag, blocks, statusCode, qbTimeToTs, num } from '../qbxml';

const REQUEST_ID = 'item';
const RET_TYPES = [
  'ItemServiceRet', 'ItemInventoryRet', 'ItemNonInventoryRet',
  'ItemOtherChargeRet', 'ItemInventoryAssemblyRet', 'ItemDiscountRet',
];

async function buildRequest(_env: Env): Promise<string> {
  // Items rarely change; full pull each run (no reliable incremental across types).
  return qbxmlDoc(`    <ItemQueryRq requestID="${REQUEST_ID}"/>`);
}

function priceDesc(ret: string): { price: number | null; desc: string | null } {
  // Direct (Inventory): <SalesPrice>, <SalesDesc>. Nested: SalesOrPurchase / SalesAndPurchase.
  const nested = blocks(ret, 'SalesOrPurchase')[0] || blocks(ret, 'SalesAndPurchase')[0] || '';
  const price = num(tag(ret, 'SalesPrice')) ?? num(tag(nested, 'SalesPrice')) ?? num(tag(nested, 'Price'));
  const desc = tag(ret, 'SalesDesc') ?? tag(nested, 'SalesDesc') ?? tag(nested, 'Desc') ?? null;
  return { price, desc };
}

async function parseResponse(env: Env, xml: string): Promise<void> {
  const status = statusCode(xml, 'ItemQueryRs');
  if (status && status !== '0' && status !== '1') {
    console.error('[QBWC] ItemQueryRs status', status);
    return;
  }
  let count = 0;
  for (const retName of RET_TYPES) {
    for (const ret of blocks(xml, retName)) {
      const listId = tag(ret, 'ListID');
      if (!listId) continue;
      const { price, desc } = priceDesc(ret);
      const isActive = tag(ret, 'IsActive');
      await execQuery(
        env,
        `INSERT INTO public.qb_item
           (list_id, edit_sequence, item_type, name, full_name, sales_desc, sales_price,
            is_active, time_modified, raw, synced_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb, CURRENT_TIMESTAMP)
         ON CONFLICT (list_id) DO UPDATE SET
           edit_sequence=EXCLUDED.edit_sequence, item_type=EXCLUDED.item_type, name=EXCLUDED.name,
           full_name=EXCLUDED.full_name, sales_desc=EXCLUDED.sales_desc, sales_price=EXCLUDED.sales_price,
           is_active=EXCLUDED.is_active, time_modified=EXCLUDED.time_modified, raw=EXCLUDED.raw,
           synced_at=CURRENT_TIMESTAMP`,
        [
          listId,
          tag(ret, 'EditSequence') ?? null,
          retName.replace(/^Item/, '').replace(/Ret$/, ''),  // 'Service','Inventory',...
          tag(ret, 'Name') ?? null,
          tag(ret, 'FullName') ?? null,
          desc,
          price,
          isActive == null ? null : isActive === 'true',
          qbTimeToTs(tag(ret, 'TimeModified')),
          JSON.stringify({ listId, ret: ret.slice(0, 8000) }),
        ],
        'qbwc.item.upsert'
      );
      await execQuery(
        env,
        `INSERT INTO public.qbwc_map (object_type, qb_list_id, qb_edit_sequence, last_synced_at)
         VALUES ('Item', $1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (object_type, qb_list_id) DO UPDATE SET
           qb_edit_sequence=EXCLUDED.qb_edit_sequence, last_synced_at=CURRENT_TIMESTAMP`,
        [listId, tag(ret, 'EditSequence') ?? null],
        'qbwc.item.map'
      );
      count++;
    }
  }
  console.log(`[QBWC] ItemQueryRs: ${count} item(s)`);
}

const item: QbObject = { name: 'Item', requestID: REQUEST_ID, buildRequest, parseResponse };
export default item;
