/**
 * Schema routes — serve defineSchema() JSON to the framework's schemaLoader.
 * GET /api/schema/:entity -> { success: true, data: <schema.toJSON()> }
 */
import { Hono } from 'hono';
import { Env } from '../db';
import { AuthVariables, authenticateToken } from '../middleware';
import { usersSchema } from './usersSchema';
import { orderSchema } from './orderSchema';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();
app.use('*', authenticateToken);

const schemas: Record<string, any> = {
  user: usersSchema,
  order: orderSchema,
};

app.get('/:entity', (c) => {
  const entity = c.req.param('entity');
  const schema = schemas[entity];
  if (!schema) return c.json({ success: false, message: `Unknown schema: ${entity}` }, 404);
  return c.json({ success: true, data: schema.toJSON() });
});

export default app;
