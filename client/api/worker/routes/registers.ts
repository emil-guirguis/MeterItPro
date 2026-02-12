import { Hono } from 'hono';
import { query, Env } from '../db';
import { authenticateToken, AuthVariables } from '../middleware';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();
app.use('*', authenticateToken);

app.get('/', async (c) => {
  try {
    const result = await query(c.env,
      `SELECT register_id, number, name, unit, field_name FROM register ORDER BY number ASC`
    );
    return c.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('Error fetching registers:', error);
    return c.json({ success: false, message: 'Failed to fetch registers' }, 500);
  }
});

export default app;
