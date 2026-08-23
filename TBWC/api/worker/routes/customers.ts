/**
 * Customers (QuickBooks) — read-only. Table public.qb_customer, PK qb_customer_id.
 * Populated by the QBWC pull (CustomerQueryRq); the source of truth is QuickBooks,
 * so this module exposes list + detail only. No writes: edits here would be
 * clobbered on the next sync, and QB push-back is an unbuilt stub.
 * Admin-only.
 */
import { Hono } from 'hono';
import { Env } from '../db';
import { AuthVariables, authenticateToken, requireAdmin } from '../middleware';
import { findAll, findById } from '../crud';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();
app.use('*', authenticateToken);
app.use('*', requireAdmin);

const TABLE = 'qb_customer';
const PK = 'qb_customer_id';
const SEARCH = ['full_name', 'company_name', 'email', 'phone'];

app.get('/', async (c) => {
  const q = c.req.query();
  const where: Record<string, any> = {};
  if (q.is_active != null && q.is_active !== '') where.is_active = q.is_active === 'true';
  const result = await findAll(c.env, {
    table: TABLE,
    primaryKey: PK,
    page: q.page ? parseInt(q.page, 10) : 1,
    limit: q.limit ? parseInt(q.limit, 10) : 25,
    search: q.search,
    searchFields: SEARCH,
    sortBy: q.sortBy,
    sortOrder: q.sortOrder,
    orderBy: q.sortBy ? undefined : `"${TABLE}".full_name ASC`,
    where,
  });
  return c.json({ success: true, data: { items: result.rows, total: result.pagination.total } });
});

app.get('/:id', async (c) => {
  const row = await findById(c.env, TABLE, PK, c.req.param('id'));
  if (!row) return c.json({ success: false, message: 'Customer not found' }, 404);
  return c.json({ success: true, data: row });
});

export default app;
