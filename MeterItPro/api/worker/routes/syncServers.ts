import { Hono } from 'hono';
import { Env, execQuery } from '../db';
import { authenticateToken, requirePermission, AuthVariables } from '../middleware';
import { logError } from '../errorHandler';
import { checkDeleteRestrictions } from '../crud';
import { syncServerSchema } from './syncServerSchema';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

const CF_API = 'https://api.cloudflare.com/client/v4';
const DOMAIN = 'meteritpro.com';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function cfFetch(token: string, path: string, options: RequestInit = {}) {
  const res = await fetch(`${CF_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    },
  });
  const data: any = await res.json();
  if (!data.success) throw new Error(data.errors?.[0]?.message || 'Cloudflare API error');
  return data.result;
}

// Authenticated routes
app.use('*', async (c, next) => {
  // Bootstrap endpoint skips JWT auth
  if (c.req.path.endsWith('/bootstrap')) return next();
  return authenticateToken(c, next);
});

// GET / - list sync servers for tenant (omit tunnel_token)
app.get('/', requirePermission('settings:read'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    if (!tenantId) return c.json({ success: false, message: 'Tenant context required' }, 401);

    const result = await execQuery(
      c.env,
      `SELECT sync_server_id, tenant_id, location_id, name, tunnel_url, timezone, active, notes,
              bootstrap_key, tunnel_id, provision_status, provision_error, dns_record_id,
              created_at, updated_at
       FROM public.sync_server WHERE tenant_id = $1 ORDER BY sync_server_id DESC`,
      [tenantId]
    );

    return c.json({ success: true, data: result.rows });
  } catch (error: any) {
    logError('Error fetching sync servers:', error);
    return c.json({ success: false, message: 'Failed to fetch sync servers', error: error.message }, 500);
  }
});

// POST / - create sync server (auto-generates bootstrap_key)
app.post('/', requirePermission('settings:update'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    if (!tenantId) return c.json({ success: false, message: 'Tenant context required' }, 401);

    const body = await c.req.json();
    const { tunnel_url = '', timezone = 'UTC', active = true, notes = '', location_id = null } = body;
    let name: string = (body.name ?? '').trim();

    if (name) {
      const existing = await execQuery(
        c.env,
        'SELECT 1 FROM public.sync_server WHERE tenant_id = $1 AND LOWER(name) = LOWER($2)',
        [tenantId, name]
      );
      if (existing.rows.length > 0) return c.json({ success: false, message: `A sync server named "${name}" already exists.` }, 409);
    } else {
      // Auto-generate a unique sync-<6hex> name. The operator never types it;
      // it becomes the hostname + tunnel slug, and is written to the USB config.
      name = '';
      for (let i = 0; i < 10 && !name; i++) {
        const candidate = `sync-${crypto.randomUUID().replace(/-/g, '').slice(0, 6)}`;
        const dup = await execQuery(
          c.env,
          'SELECT 1 FROM public.sync_server WHERE tenant_id = $1 AND LOWER(name) = LOWER($2)',
          [tenantId, candidate]
        );
        if (dup.rows.length === 0) name = candidate;
      }
      if (!name) return c.json({ success: false, message: 'Failed to generate a unique server name' }, 500);
    }

    const bootstrapKey = crypto.randomUUID();

    const result = await execQuery(
      c.env,
      `INSERT INTO public.sync_server
         (tenant_id, location_id, name, tunnel_url, timezone, active, notes, bootstrap_key, provision_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending') RETURNING
         sync_server_id, tenant_id, location_id, name, tunnel_url, timezone, active, notes,
         bootstrap_key, tunnel_id, provision_status, provision_error, dns_record_id,
         created_at, updated_at`,
      [tenantId, location_id, name, tunnel_url, timezone, active, notes, bootstrapKey]
    );

    return c.json({ success: true, data: result.rows[0] }, 201);
  } catch (error: any) {
    logError('Error creating sync server:', error);
    return c.json({ success: false, message: 'Failed to create sync server', error: error.message }, 500);
  }
});

// PUT /:id - update sync server
app.put('/:id', requirePermission('settings:update'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');
    if (!tenantId) return c.json({ success: false, message: 'Tenant context required' }, 401);

    const body = await c.req.json();
    const fields: Record<string, any> = {};
    if (body.name        !== undefined) fields.name        = body.name;
    if (body.tunnel_url  !== undefined) fields.tunnel_url  = body.tunnel_url;
    if (body.timezone    !== undefined) fields.timezone    = body.timezone;
    if (body.active      !== undefined) fields.active      = body.active;
    if (body.notes       !== undefined) fields.notes       = body.notes;
    if (body.location_id !== undefined) fields.location_id = body.location_id;

    if (Object.keys(fields).length === 0) return c.json({ success: true, message: 'No fields to update' });

    if (fields.name) {
      const existing = await execQuery(
        c.env,
        'SELECT 1 FROM public.sync_server WHERE tenant_id = $1 AND LOWER(name) = LOWER($2) AND sync_server_id != $3',
        [tenantId, fields.name, id]
      );
      if (existing.rows.length > 0) return c.json({ success: false, message: `A sync server named "${fields.name}" already exists.` }, 409);
    }

    const setClauses: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [key, val] of Object.entries(fields)) {
      setClauses.push(`${key} = $${idx}`);
      values.push(val);
      idx++;
    }
    setClauses.push(`updated_at = NOW()`);
    values.push(tenantId, id);

    const sql = `UPDATE public.sync_server SET ${setClauses.join(', ')}
                 WHERE tenant_id = $${idx} AND sync_server_id = $${idx + 1}
                 RETURNING sync_server_id, tenant_id, location_id, name, tunnel_url, timezone, active, notes,
                           bootstrap_key, tunnel_id, provision_status, provision_error, dns_record_id,
                           created_at, updated_at`;
    const result = await execQuery(c.env, sql, values);

    if (result.rows.length === 0) return c.json({ success: false, message: 'Sync server not found' }, 404);
    return c.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    logError('Error updating sync server:', error);
    return c.json({ success: false, message: 'Failed to update sync server', error: error.message }, 500);
  }
});

// DELETE /:id - remove sync server (also removes CF tunnel if provisioned)
app.delete('/:id', requirePermission('settings:update'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');
    if (!tenantId) return c.json({ success: false, message: 'Tenant context required' }, 401);

    const existing = await execQuery(
      c.env,
      'SELECT tunnel_id, dns_record_id FROM public.sync_server WHERE tenant_id = $1 AND sync_server_id = $2',
      [tenantId, id]
    );
    if (existing.rows.length === 0) return c.json({ success: false, message: 'Sync server not found' }, 404);

    // Schema-declared delete restrictions (DB FK ON DELETE RESTRICT is the backstop)
    const violation = await checkDeleteRestrictions(c.env, syncServerSchema, id);
    if (violation) return c.json({ success: false, message: violation.message }, 409);

    // Best-effort CF cleanup
    const { tunnel_id, dns_record_id } = existing.rows[0];
    if (tunnel_id) {
      try {
        const accountId = c.env.CLOUDFLARE_ACCOUNT_ID;
        const apiToken = c.env.CLOUDFLARE_API_TOKEN;
        if (accountId && apiToken) {
          if (dns_record_id) {
            const zoneResult = await cfFetch(apiToken, `/zones?name=${DOMAIN}`);
            const zoneId = zoneResult[0]?.id;
            if (zoneId) await cfFetch(apiToken, `/zones/${zoneId}/dns_records/${dns_record_id}`, { method: 'DELETE' });
          }
          await cfFetch(apiToken, `/accounts/${accountId}/cfd_tunnel/${tunnel_id}`, { method: 'DELETE' });
        }
      } catch (cfErr: any) {
        console.warn('[sync-servers] CF cleanup failed (non-fatal):', cfErr.message);
      }
    }

    await execQuery(
      c.env,
      'DELETE FROM public.sync_server WHERE tenant_id = $1 AND sync_server_id = $2',
      [tenantId, id]
    );

    return c.json({ success: true, message: 'Sync server deleted' });
  } catch (error: any) {
    logError('Error deleting sync server:', error);
    return c.json({ success: false, message: 'Failed to delete sync server', error: error.message }, 500);
  }
});

// POST /:id/provision - create CF tunnel, configure ingress, create DNS record
app.post('/:id/provision', requirePermission('settings:update'), async (c) => {
  const tenantId = c.get('tenantId');
  const id = c.req.param('id');
  if (!tenantId) return c.json({ success: false, message: 'Tenant context required' }, 401);

  // Mark as provisioning
  await execQuery(
    c.env,
    `UPDATE public.sync_server SET provision_status = 'provisioning', provision_error = NULL, updated_at = NOW()
     WHERE tenant_id = $1 AND sync_server_id = $2`,
    [tenantId, id]
  );

  try {
    const serverRes = await execQuery(
      c.env, 'SELECT * FROM public.sync_server WHERE tenant_id = $1 AND sync_server_id = $2', [tenantId, id]
    );

    if (serverRes.rows.length === 0) return c.json({ success: false, message: 'Sync server not found' }, 404);
    const server = serverRes.rows[0];
    const accountId = c.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = c.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      await execQuery(c.env,
        `UPDATE public.sync_server SET provision_status = 'error', provision_error = $1, updated_at = NOW()
         WHERE sync_server_id = $2`,
        ['Cloudflare credentials not configured on server', id]
      );
      return c.json({ success: false, message: 'Cloudflare credentials not configured on server' }, 400);
    }

    // Clean up old tunnel if re-provisioning
    if (server.tunnel_id) {
      try {
        if (server.dns_record_id) {
          const zones = await cfFetch(apiToken, `/zones?name=${DOMAIN}`);
          const zoneId = zones[0]?.id;
          if (zoneId) await cfFetch(apiToken, `/zones/${zoneId}/dns_records/${server.dns_record_id}`, { method: 'DELETE' });
        }
        await cfFetch(apiToken, `/accounts/${accountId}/cfd_tunnel/${server.tunnel_id}`, { method: 'DELETE' });
      } catch {
        // non-fatal
      }
    }

    const slug = slugify(server.name);
    const tunnelName = `meteritpro-sync-${slug}`;
    const hostname = `${slug}.${DOMAIN}`;

    // 1. Create tunnel
    const tunnel = await cfFetch(apiToken, `/accounts/${accountId}/cfd_tunnel`, {
      method: 'POST',
      body: JSON.stringify({ name: tunnelName, config_src: 'cloudflare' }),
    });

    // 2. Configure ingress
    await cfFetch(apiToken, `/accounts/${accountId}/cfd_tunnel/${tunnel.id}/configurations`, {
      method: 'PUT',
      body: JSON.stringify({
        config: {
          ingress: [
            { hostname, service: 'http://sync-frontend:80' },
            { service: 'http_status:404' },
          ],
        },
      }),
    });

    // 3. Get zone ID and create CNAME
    const zones = await cfFetch(apiToken, `/zones?name=${DOMAIN}`);
    const zoneId = zones[0]?.id;
    if (!zoneId) throw new Error(`Zone not found for ${DOMAIN}`);

    const dnsRecord = await cfFetch(apiToken, `/zones/${zoneId}/dns_records`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'CNAME',
        name: slug,
        content: `${tunnel.id}.cfargotunnel.com`,
        proxied: true,
        ttl: 1,
      }),
    });

    // 4. Save everything
    await execQuery(
      c.env,
      `UPDATE public.sync_server
       SET tunnel_id = $1, tunnel_token = $2, tunnel_url = $3,
           dns_record_id = $4, provision_status = 'active', provision_error = NULL,
           updated_at = NOW()
       WHERE sync_server_id = $5`,
      [tunnel.id, tunnel.token, `https://${hostname}`, dnsRecord.id, id]
    );

    const updated = await execQuery(
      c.env,
      `SELECT sync_server_id, tenant_id, location_id, name, tunnel_url, timezone, active, notes,
              bootstrap_key, tunnel_id, provision_status, provision_error, dns_record_id,
              created_at, updated_at
       FROM public.sync_server WHERE sync_server_id = $1`,
      [id]
    );

    return c.json({ success: true, data: updated.rows[0] });
  } catch (error: any) {
    logError('Error provisioning sync server:', error);
    await execQuery(
      c.env,
      `UPDATE public.sync_server SET provision_status = 'error', provision_error = $1, updated_at = NOW()
       WHERE sync_server_id = $2`,
      [error.message, id]
    );
    return c.json({ success: false, message: error.message }, 500);
  }
});

// POST /:id/test-connection - proxy health check through worker
app.post('/:id/test-connection', requirePermission('settings:read'), async (c) => {
  try {
    const tenantId = c.get('tenantId');
    const id = c.req.param('id');
    if (!tenantId) return c.json({ success: false, message: 'Tenant context required' }, 401);

    const result = await execQuery(
      c.env,
      'SELECT tunnel_url FROM public.sync_server WHERE tenant_id = $1 AND sync_server_id = $2',
      [tenantId, id]
    );

    if (result.rows.length === 0) return c.json({ success: false, message: 'Sync server not found' }, 404);

    const { tunnel_url } = result.rows[0];
    if (!tunnel_url) return c.json({ success: false, message: 'No tunnel URL configured' });

    try {
      const response = await fetch(`${tunnel_url.replace(/\/$/, '')}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const data: any = await response.json();
        return c.json({ success: true, message: 'Connected', status: data });
      }
      return c.json({ success: false, message: `Server returned ${response.status}` });
    } catch (fetchErr: any) {
      return c.json({ success: false, message: fetchErr.message || 'Connection failed' });
    }
  } catch (error: any) {
    logError('Error testing sync server connection:', error);
    return c.json({ success: false, message: 'Failed to test connection', error: error.message }, 500);
  }
});

// GET /:id/bootstrap - no JWT, secured by bootstrap_key, used by sync-provisioner
app.get('/:id/bootstrap', async (c) => {
  try {
    const id = c.req.param('id');
    const key = c.req.query('key');

    if (!key) return c.json({ success: false, message: 'key required' }, 400);

    const result = await execQuery(
      c.env,
      `SELECT ss.name, ss.provision_status, ss.provision_error, ss.tunnel_token,
              t.tenant_id, t.name AS tenant_name, t.url AS tenant_url, t.street, t.street2,
              t.city, t.state, t.zip, t.country, t.active AS tenant_active, t.api_key AS tenant_api_key
       FROM public.sync_server ss
       LEFT JOIN public.tenant t ON t.tenant_id = ss.tenant_id
       WHERE ss.sync_server_id = $1 AND ss.bootstrap_key = $2`,
      [id, key]
    );

    if (result.rows.length === 0) return c.json({ success: false, message: 'Not found' }, 404);

    const row = result.rows[0];

    return c.json({
      success: true,
      data: {
        name:               row.name,
        provision_status:   row.provision_status,
        provision_error:    row.provision_error,
        tunnel_token:       row.provision_status === 'active' ? row.tunnel_token : null,
        client_api_url:     c.env.CLIENT_API_URL ?? 'https://meteritpro.com/api',
        github_owner:       c.env.GITHUB_OWNER ?? '',
        github_token:       c.env.GITHUB_TOKEN ?? '',
        remote_db_host:     c.env.REMOTE_DB_HOST ?? '',
        remote_db_port:     Number(c.env.REMOTE_DB_PORT) || 5432,
        remote_db_name:     c.env.REMOTE_DB_NAME ?? '',
        remote_db_user:     c.env.REMOTE_DB_USER ?? '',
        remote_db_password: row.provision_status === 'active' ? (c.env.REMOTE_DB_PASSWORD ?? '') : null,
        tenant: row.tenant_id == null ? null : {
          tenant_id: row.tenant_id,
          name:      row.tenant_name,
          url:       row.tenant_url,
          street:    row.street,
          street2:   row.street2,
          city:      row.city,
          state:     row.state,
          zip:       row.zip,
          country:   row.country,
          active:    row.tenant_active,
          api_key:   row.tenant_api_key,
        },
      },
    });
  } catch (error: any) {
    logError('Error in bootstrap endpoint:', error);
    return c.json({ success: false, message: 'Internal error' }, 500);
  }
});

export default app;
