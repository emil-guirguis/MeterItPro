/**
 * Inventory (product catalog) CRUD. Table public.inventory, PK inventory_id.
 * Seeded from the "Unit Price | Project BOM" workbook tab.
 * Reads: any approved user. Writes: admin-only.
 */
import { Hono } from 'hono';
import { Env } from '../db';
import { AuthVariables, authenticateToken, requireAdmin } from '../middleware';
import { findAll, findById, create, update, remove, whereFromQuery, likeFieldsFromSchema } from '../crud';
import { inventorySchema } from './inventorySchema';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();
app.use('*', authenticateToken);

const TABLE = 'inventory';
const PK = 'inventory_id';
const SEARCH = ['part_number', 'description', 'category', 'upc_code'];
// Free-text individual filters, derived from the schema (list-shown string/number
// fields with no enumValues).
const LIKE_FIELDS = likeFieldsFromSchema(inventorySchema);

app.get('/', async (c) => {
  const q = c.req.query();
  const { where, whereLike } = whereFromQuery(q, { likeFields: LIKE_FIELDS });
  const result = await findAll(c.env, {
    table: TABLE,
    primaryKey: PK,
    page: q.page ? parseInt(q.page, 10) : 1,
    limit: q.limit ? parseInt(q.limit, 10) : 25,
    search: q.search,
    searchFields: SEARCH,
    sortBy: q.sortBy,
    sortOrder: q.sortOrder,
    orderBy: q.sortBy ? undefined : `"${TABLE}".part_number ASC`,
    where,
    whereLike,
  });
  return c.json({ success: true, data: { items: result.rows, total: result.pagination.total } });
});

app.get('/:id', async (c) => {
  const row = await findById(c.env, TABLE, PK, c.req.param('id'));
  if (!row) return c.json({ success: false, message: 'Inventory item not found' }, 404);
  return c.json({ success: true, data: row });
});

app.post('/', requireAdmin, async (c) => {
  const row = await create(c.env, TABLE, await c.req.json());
  return c.json({ success: true, data: row }, 201);
});

app.put('/:id', requireAdmin, async (c) => {
  // public.inventory has no updated_at column.
  const row = await update(c.env, TABLE, PK, c.req.param('id'), await c.req.json(), { touchUpdatedAt: false });
  if (!row) return c.json({ success: false, message: 'Inventory item not found or nothing to update' }, 404);
  return c.json({ success: true, data: row });
});

app.delete('/:id', requireAdmin, async (c) => {
  const row = await remove(c.env, TABLE, PK, c.req.param('id'));
  if (!row) return c.json({ success: false, message: 'Inventory item not found' }, 404);
  return c.json({ success: true, data: row });
});

export default app;
