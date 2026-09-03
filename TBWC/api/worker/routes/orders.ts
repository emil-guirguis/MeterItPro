/**
 * Orders CRUD. Table public."order" (reserved word — crud.ts quotes it), PK id.
 * Visibility mirrors the tbwc RLS intent (enforced here since the Worker
 * connects at service level and bypasses RLS):
 *   - admins / can_see_orders  -> every order
 *   - everyone else (a rep)    -> only their own (rep_id = user.id)
 * Writes are admin-only.
 */
import { Hono } from 'hono';
import { Env } from '../db';
import { AuthVariables, authenticateToken, requireAdmin } from '../middleware';
import { findAll, findById, create, update, remove, whereFromQuery, likeFieldsFromSchema } from '../crud';
import { orderSchema } from './orderSchema';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();
app.use('*', authenticateToken);

const TABLE = 'order';
const PK = 'id';
const SEARCH = ['customer', 'job_name', 'tbwc_number', 'po_number', 'rep'];
// Free-text individual filters, derived from the schema (list-shown string/number
// fields with no enumValues).
const LIKE_FIELDS = likeFieldsFromSchema(orderSchema);

function canSeeAll(user: any): boolean {
  return !!(user?.is_admin || user?.can_see_orders);
}

app.get('/', async (c) => {
  const user = c.get('user');
  const q = c.req.query();
  const { where: fieldWhere, whereLike } = whereFromQuery(q, { likeFields: LIKE_FIELDS });
  // Field filters first, then the security scope — rep_id always wins so a rep
  // can't widen their own visibility via a crafted query param.
  const where = { ...fieldWhere, ...(canSeeAll(user) ? {} : { rep_id: user.id }) };
  const result = await findAll(c.env, {
    table: TABLE,
    primaryKey: PK,
    page: q.page ? parseInt(q.page, 10) : 1,
    limit: q.limit ? parseInt(q.limit, 10) : 25,
    search: q.search,
    searchFields: SEARCH,
    sortBy: q.sortBy,
    sortOrder: q.sortOrder,
    where,
    whereLike,
  });
  return c.json({ success: true, data: { items: result.rows, total: result.pagination.total } });
});

app.get('/:id', async (c) => {
  const user = c.get('user');
  const row = await findById(c.env, TABLE, PK, c.req.param('id'));
  if (!row) return c.json({ success: false, message: 'Order not found' }, 404);
  if (!canSeeAll(user) && row.rep_id !== user.id) {
    return c.json({ success: false, message: 'Not found' }, 404);
  }
  return c.json({ success: true, data: row });
});

app.post('/', requireAdmin, async (c) => {
  const body = await c.req.json();
  const row = await create(c.env, TABLE, body);
  return c.json({ success: true, data: row }, 201);
});

app.put('/:id', requireAdmin, async (c) => {
  const body = await c.req.json();
  // public."order" has no updated_at column.
  const row = await update(c.env, TABLE, PK, c.req.param('id'), body, { touchUpdatedAt: false });
  if (!row) return c.json({ success: false, message: 'Order not found or nothing to update' }, 404);
  return c.json({ success: true, data: row });
});

app.delete('/:id', requireAdmin, async (c) => {
  const row = await remove(c.env, TABLE, PK, c.req.param('id'));
  if (!row) return c.json({ success: false, message: 'Order not found' }, 404);
  return c.json({ success: true, data: row });
});

export default app;
