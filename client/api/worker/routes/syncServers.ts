import { Hono } from 'hono';
import { Env, execQuery } from '../db';
import { authenticateToken, requirePermission, AuthVariables } from '../middleware';
import { logError } from '../errorHandler';

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
      `SELECT sync_server_id, tenant_id, name, tunnel_url, timezone, api_key, active,
              bootstrap_key, tunnel_id, provision_status, provision_error, dns_record_id,
              client_api_url, github_owner,
              remote_db_host, remote_db_port, remote_db_name, remote_db_user, remote_db_password,
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
    const {
      name, tunnel_url = '', timezone = 'UTC', api_key = '', active = true,
      client_api_url = 'https://meteritpro.com/api', github_owner = '',
      remote_db_host = '', remote_db_port = 5432, remote_db_name = '',
      remote_db_user = '', remote_db_password = '',
    } = body;

    if (!name) return c.json({ success: false, message: 'name is required' }, 400);

    const bootstrapKey = crypto.randomUUID();

    const result = await execQuery(
      c.env,
      `INSERT INTO public.sync_server
         (tenant_id, name, tunnel_url, timezone, api_key, active, bootstrap_key, provision_status,
          client_api_url, github_owner, remote_db_host, remote_db_port, remote_db_name, remote_db_user, remote_db_password)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, $10, $11, $12, $13, $14) RETURNING
         sync_server_id, tenant_id, name, tunnel_url, timezone, api_key, active,
         bootstrap_key, tunnel_id, provision_status, provision_error, dns_record_id,
         client_api_url, github_owner,
         remote_db_host, remote_db_port, remote_db_name, remote_db_user, remote_db_password,
         created_at, updated_at`,
      [tenantId, name, tunnel_url, timezone, api_key, active, bootstrapKey,
       client_api_url, github_owner, remote_db_host, remote_db_port, remote_db_name, remote_db_user, remote_db_password]
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
    if (body.name               !== undefined) fields.name               = body.name;
    if (body.tunnel_url         !== undefined) fields.tunnel_url         = body.tunnel_url;
    if (body.timezone           !== undefined) fields.timezone           = body.timezone;
    if (body.api_key            !== undefined) fields.api_key            = body.api_key;
    if (body.active             !== undefined) fields.active             = body.active;
    if (body.client_api_url     !== undefined) fields.client_api_url     = body.client_api_url;
    if (body.github_owner       !== undefined) fields.github_owner       = body.github_owner;
    if (body.remote_db_host     !== undefined) fields.remote_db_host     = body.remote_db_host;
    if (body.remote_db_port     !== undefined) fields.remote_db_port     = body.remote_db_port;
    if (body.remote_db_name     !== undefined) fields.remote_db_name     = body.remote_db_name;
    if (body.remote_db_user     !== undefined) fields.remote_db_user     = body.remote_db_user;
    if (body.remote_db_password !== undefined) fields.remote_db_password = body.remote_db_password;

    if (Object.keys(fields).length === 0) return c.json({ success: true, message: 'No fields to update' });

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
                 RETURNING sync_server_id, tenant_id, name, tunnel_url, timezone, api_key, active,
                           bootstrap_key, tunnel_id, provision_status, provision_error, dns_record_id,
                           client_api_url, github_owner,
                           remote_db_host, remote_db_port, remote_db_name, remote_db_user, remote_db_password,
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
      `SELECT sync_server_id, tenant_id, name, tunnel_url, timezone, api_key, active,
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
      `SELECT provision_status, provision_error, tunnel_token,
              client_api_url, github_owner, api_key,
              remote_db_host, remote_db_port, remote_db_name,
              remote_db_user, remote_db_password
       FROM public.sync_server
       WHERE sync_server_id = $1 AND bootstrap_key = $2`,
      [id, key]
    );

    if (result.rows.length === 0) return c.json({ success: false, message: 'Not found' }, 404);

    const row = result.rows[0];

    return c.json({
      success: true,
      data: {
        provision_status:   row.provision_status,
        provision_error:    row.provision_error,
        tunnel_token:       row.provision_status === 'active' ? row.tunnel_token : null,
        client_api_url:     row.client_api_url,
        github_owner:       row.github_owner,
        github_token:       c.env.GITHUB_TOKEN ?? '',
        api_key:            row.api_key,
        remote_db_host:     row.remote_db_host,
        remote_db_port:     row.remote_db_port,
        remote_db_name:     row.remote_db_name,
        remote_db_user:     row.remote_db_user,
        remote_db_password: row.provision_status === 'active' ? row.remote_db_password : null,
      },
    });
  } catch (error: any) {
    logError('Error in bootstrap endpoint:', error);
    return c.json({ success: false, message: 'Internal error' }, 500);
  }
});

export default app;
