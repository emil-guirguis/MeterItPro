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
import { AuthVariables, authenticateToken } from '../middleware';
import { findAll, findById, create, update, remove } from '../crud';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();
app.use('*', authenticateToken);

const TABLE = 'order';
const PK = 'id';
const SEARCH = ['customer', 'job_name', 'tbwc_number', 'po_number', 'rep'];

function canSeeAll(user: any): boolean {
  return !!(user?.is_admin || user?.can_see_orders);
}

app.get('/', async (c) => {
  const user = c.get('user');
  const q = c.req.query();
  const where = canSeeAll(user) ? {} : { rep_id: user.id };
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

app.post('/', async (c) => {
  if (!c.get('user')?.is_admin) return c.json({ success: false, message: 'Admin access required' }, 403);
  const body = await c.req.json();
  const row = await create(c.env, TABLE, body);
  return c.json({ success: true, data: row }, 201);
});

app.put('/:id', async (c) => {
  if (!c.get('user')?.is_admin) return c.json({ success: false, message: 'Admin access required' }, 403);
  const body = await c.req.json();
  const row = await update(c.env, TABLE, PK, c.req.param('id'), body);
  if (!row) return c.json({ success: false, message: 'Order not found or nothing to update' }, 404);
  return c.json({ success: true, data: row });
});

app.delete('/:id', async (c) => {
  if (!c.get('user')?.is_admin) return c.json({ success: false, message: 'Admin access required' }, 403);
  const row = await remove(c.env, TABLE, PK, c.req.param('id'));
  if (!row) return c.json({ success: false, message: 'Order not found' }, 404);
  return c.json({ success: true, data: row });
});

export default app;
