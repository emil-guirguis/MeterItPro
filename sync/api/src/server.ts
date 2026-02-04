/**
 * Sync Backend API Server
 *
 * Provides HTTP endpoints for the Sync Frontend to query local data.
 * This API serves only local network requests (binds to 127.0.0.1).
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  initializePools,
  closePools,
  syncPool,
  remotePool,
  healthCheckSync,
  healthCheckRemote,
} from './config/database.js';

// Load environment variables from root .env file first, then local .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') }); // Root .env
dotenv.config({ path: join(__dirname, '../.env') }); // Local .env to override if needed

const app = express();
const PORT = parseInt(process.env.SYNC_API_PORT || '3002', 10);

// Middleware
app.use(cors({
  origin: '*', // Allow all origins on local network
  methods: ['GET', 'POST'],
}));
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  console.log(`\n🌐 [API] ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ==================== ROUTES ====================

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Health check for sync database
app.get('/api/health/sync-db', async (_req, res) => {
  try {
    const health = await healthCheckSync();
    if (health.status === 'healthy') {
      res.json({ status: 'ok', database: 'sync', timestamp: health.timestamp });
    } else {
      res.status(503).json({ status: 'error', database: 'sync', error: health.error });
    }
  } catch (error) {
    res.status(503).json({
      status: 'error',
      database: 'sync',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Health check for remote database
app.get('/api/health/remote-db', async (_req, res) => {
  try {
    const health = await healthCheckRemote();
    if (health.status === 'healthy') {
      res.json({ status: 'ok', database: 'remote', timestamp: health.timestamp });
    } else {
      res.status(503).json({ status: 'error', database: 'remote', error: health.error });
    }
  } catch (error) {
    res.status(503).json({
      status: 'error',
      database: 'remote',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Get tenant information from local database
app.get('/api/local/tenant', async (_req, res) => {
  try {
    console.log('📥 [API] GET /api/local/tenant - Request received');

    const query = `
      SELECT tenant_id, name, url, street, street2, city, state, zip, country, active
      FROM tenant
      LIMIT 1
    `;
    const result = await syncPool.query(query);

    if (result.rows.length === 0) {
      console.log('📤 [API] GET /api/local/tenant - No tenant data available');
      return res.status(404).json({
        error: 'No tenant found',
        status: 'not_found'
      });
    }

    console.log(`📤 [API] GET /api/local/tenant - Returning tenant: ${result.rows[0].name}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ [API] GET /api/local/tenant - Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Trigger tenant sync from remote to local database
app.post('/api/local/tenant-sync', async (req, res) => {
  try {
    console.log('📥 [API] POST /api/local/tenant-sync - Request received');

    const { tenant_id } = req.body;

    if (!tenant_id) {
      console.error('❌ [API] Missing tenant_id in request body');
      return res.status(400).json({
        success: false,
        error: 'tenant_id is required'
      });
    }

    console.log(`🔍 [API] Syncing tenant: ${tenant_id}`);

    if (!remotePool) {
      console.error('❌ [API] Remote database pool not available');
      return res.status(503).json({
        success: false,
        error: 'Remote database pool not available'
      });
    }

    // Query remote database for tenant data
    console.log('🔄 [API] Querying remote database for tenant...');
    const remoteQuery = `
      SELECT tenant_id, name, url, street, street2, city, state, zip, country, active, api_key
      FROM tenant
      WHERE tenant_id = $1
    `;
    const remoteResult = await remotePool.query(remoteQuery, [tenant_id]);

    if (remoteResult.rows.length === 0) {
      console.error(`❌ [API] Tenant ${tenant_id} not found in remote database`);
      return res.status(404).json({
        success: false,
        error: `Tenant ${tenant_id} not found in remote database`
      });
    }

    const remoteTenant = remoteResult.rows[0];
    console.log('✅ [API] Found tenant in remote database:', remoteTenant.name);

    // Upsert to local sync database
    console.log('🔄 [API] Upserting tenant to local database...');
    const upsertQuery = `
      INSERT INTO tenant (tenant_id, name, url, street, street2, city, state, zip, country, active, api_key)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (tenant_id) DO UPDATE SET
        name = EXCLUDED.name,
        url = EXCLUDED.url,
        street = EXCLUDED.street,
        street2 = EXCLUDED.street2,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        zip = EXCLUDED.zip,
        country = EXCLUDED.country,
        active = EXCLUDED.active,
        api_key = EXCLUDED.api_key
      RETURNING *
    `;
    const upsertResult = await syncPool.query(upsertQuery, [
      remoteTenant.tenant_id,
      remoteTenant.name,
      remoteTenant.url,
      remoteTenant.street,
      remoteTenant.street2,
      remoteTenant.city,
      remoteTenant.state,
      remoteTenant.zip,
      remoteTenant.country,
      remoteTenant.active,
      remoteTenant.api_key,
    ]);

    const localTenant = upsertResult.rows[0];
    console.log('✅ [API] Tenant synced successfully');

    const response = {
      success: true,
      message: 'Tenant sync completed successfully',
      sync_result: {
        inserted: upsertResult.rowCount === 1 ? 1 : 0,
        updated: upsertResult.rowCount === 1 ? 0 : 1,
        timestamp: new Date(),
      },
      tenant_data: {
        tenant_id: localTenant.tenant_id,
        name: localTenant.name,
        url: localTenant.url,
        street: localTenant.street,
        street2: localTenant.street2,
        city: localTenant.city,
        state: localTenant.state,
        zip: localTenant.zip,
        country: localTenant.country,
        active: localTenant.active,
      },
    };

    console.log(`📤 [API] POST /api/local/tenant-sync - Success`);
    res.json(response);
  } catch (error) {
    console.error('❌ [API] POST /api/local/tenant-sync - Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
  }
});

// Get all meters
app.get('/api/local/meters', async (_req, res) => {
  try {
    console.log('📥 [API] GET /api/local/meters - Request received');

    const query = `
      SELECT meter_id, device_id, name, active, ip, port, meter_element_id, element
      FROM meter
      WHERE active = true
      ORDER BY meter_id
    `;
    const result = await syncPool.query(query);

    console.log(`📤 [API] GET /api/local/meters - Returning ${result.rows.length} meter(s)`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ [API] GET /api/local/meters - Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Get recent readings
app.get('/api/local/readings', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    console.log(`📥 [API] GET /api/local/readings - Request received (hours: ${hours})`);

    const query = `
      SELECT
        meter_reading_id,
        meter_id,
        created_at as timestamp,
        sync_status,
        is_synchronized,
        retry_count
      FROM meter_reading
      WHERE created_at >= NOW() - INTERVAL '${hours} hours'
      ORDER BY created_at DESC
      LIMIT 1000
    `;

    const result = await syncPool.query(query);

    console.log(`📤 [API] GET /api/local/readings - Returning ${result.rows.length} reading(s)`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ [API] GET /api/local/readings - Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Get sync status
app.get('/api/local/sync-status', async (_req, res) => {
  try {
    console.log('📥 [API] GET /api/local/sync-status - Request received');

    // Get queue size (unsynchronized readings)
    const queueQuery = `SELECT COUNT(*) as count FROM meter_reading WHERE is_synchronized = false`;
    const queueResult = await syncPool.query(queueQuery);
    const queueSize = parseInt(queueResult.rows[0].count, 10);

    // Get recent sync logs
    const logsQuery = `
      SELECT id as sync_log_id, batch_size, success, error_message, synced_at
      FROM sync_log
      ORDER BY synced_at DESC
      LIMIT 10
    `;
    const logsResult = await syncPool.query(logsQuery);
    const recentLogs = logsResult.rows;

    // Get last successful sync
    const successfulLogs = recentLogs.filter((log: any) => log.success);
    const lastSuccessfulSync = successfulLogs.length > 0 ? successfulLogs[0].synced_at : null;

    // Get recent errors
    const errorLogs = recentLogs
      .filter((log: any) => !log.success)
      .slice(0, 10)
      .map((log: any) => ({
        sync_log_id: log.sync_log_id,
        batch_size: log.batch_size,
        error_message: log.error_message || 'Unknown error',
        synced_at: log.synced_at,
      }));

    // Check if remote database is connected
    let isConnected = false;
    try {
      await remotePool.query('SELECT 1');
      isConnected = true;
    } catch {
      isConnected = false;
    }

    const response = {
      is_connected: isConnected,
      last_sync_at: lastSuccessfulSync,
      queue_size: queueSize,
      sync_errors: errorLogs,
    };

    console.log(`📤 [API] GET /api/local/sync-status - Queue size: ${queueSize}, Connected: ${isConnected}`);
    res.json(response);
  } catch (error) {
    console.error('❌ [API] GET /api/local/sync-status - Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Get meter reading upload status
app.get('/api/sync/meter-reading-upload/status', async (_req, res) => {
  try {
    console.log('📥 [API] GET /api/sync/meter-reading-upload/status - Request received');

    // Get queue size
    const queueQuery = `SELECT COUNT(*) as count FROM meter_reading WHERE is_synchronized = false`;
    const queueResult = await syncPool.query(queueQuery);
    const queueSize = parseInt(queueResult.rows[0].count, 10);

    // Get last upload from sync_log
    const lastUploadQuery = `
      SELECT success, error_message, synced_at, batch_size
      FROM sync_log
      WHERE operation_type = 'upload'
      ORDER BY synced_at DESC
      LIMIT 1
    `;
    const lastUploadResult = await syncPool.query(lastUploadQuery);
    const lastUpload = lastUploadResult.rows[0];

    // Check if remote is connected
    let isClientConnected = false;
    try {
      await remotePool.query('SELECT 1');
      isClientConnected = true;
    } catch {
      isClientConnected = false;
    }

    const response = {
      is_running: false, // API doesn't manage the upload process
      last_upload_time: lastUpload?.synced_at || null,
      last_upload_success: lastUpload?.success ?? null,
      last_upload_error: lastUpload?.error_message || null,
      queue_size: queueSize,
      total_uploaded: 0, // Would need to track this separately
      total_failed: 0,
      is_client_connected: isClientConnected,
    };

    console.log(`📤 [API] GET /api/sync/meter-reading-upload/status - Queue: ${queueSize}`);
    res.json(response);
  } catch (error) {
    console.error('❌ [API] GET /api/sync/meter-reading-upload/status - Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Get meter reading upload log
app.get('/api/sync/meter-reading-upload/log', async (_req, res) => {
  try {
    console.log('📥 [API] GET /api/sync/meter-reading-upload/log - Request received');

    const query = `
      SELECT id as sync_operation_id, operation_type, batch_size as readings_count, success, error_message, synced_at as created_at
      FROM sync_log
      WHERE operation_type = 'upload'
      ORDER BY synced_at DESC
      LIMIT 20
    `;

    const result = await syncPool.query(query);

    console.log(`📤 [API] GET /api/sync/meter-reading-upload/log - Returning ${result.rows.length} entries`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ [API] GET /api/sync/meter-reading-upload/log - Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
  console.warn(`⚠️  [API] 404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ [API] Internal Server Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// ==================== SERVER STARTUP ====================

async function startServer() {
  try {
    console.log('\n🚀 [Sync API] Starting server...');

    // Initialize database pools
    await initializePools();

    // Start listening (bind to localhost only for security)
    const server = app.listen(PORT, '127.0.0.1', () => {
      console.log(`\n✅ [Sync API] Server listening on http://127.0.0.1:${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/health`);
      console.log(`   Tenant endpoint: http://localhost:${PORT}/api/local/tenant`);
      console.log(`   Meters endpoint: http://localhost:${PORT}/api/local/meters`);
      console.log(`   Readings endpoint: http://localhost:${PORT}/api/local/readings`);
      console.log(`   Sync status endpoint: http://localhost:${PORT}/api/local/sync-status\n`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 [Sync API] Received ${signal}, shutting down...`);
      server.close(async () => {
        await closePools();
        console.log('✅ [Sync API] Server stopped');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (error) {
    console.error('❌ [Sync API] Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
