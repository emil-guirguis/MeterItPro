/**
 * Sync Local API Server
 *
 * Provides HTTP endpoints for the Sync Frontend to query local data and trigger sync operations.
 * This API serves only local network requests and does not expose data to the internet.
 */
import express from 'express';
import cors from 'cors';
import { syncPool } from '../data-sync/data-sync.js';
import { syncTenant } from '../remote_to_local-sync/sync-tenant.js';
import { execQuery } from '../helpers/sql-functions.js';
export class LocalApiServer {
    app;
    port;
    database;
    remoteToLocalSyncAgent;
    bacnetMeterReadingAgent;
    meterReadingUploadManager;
    remotePool;
    server;
    syncManager;
    constructor(config) {
        this.port = config.port;
        this.database = config.database;
        this.remoteToLocalSyncAgent = config.remoteToLocalSyncAgent;
        this.bacnetMeterReadingAgent = config.bacnetMeterReadingAgent;
        this.meterReadingUploadManager = config.meterReadingUploadManager;
        this.remotePool = config.remotePool;
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }
    /**
     * Setup Express middleware
     */
    setupMiddleware() {
        // Enable CORS for local network access
        this.app.use(cors({
            origin: '*', // Allow all origins on local network
            methods: ['GET', 'POST'],
        }));
        // Parse JSON bodies
        this.app.use(express.json());
        // Request logging
        this.app.use((req, _res, next) => {
            console.log(`\n🌐 [API] ${new Date().toISOString()} - ${req.method} ${req.path}`);
            console.log(`   Client IP: ${req.ip}`);
            console.log(`   User Agent: ${req.get('user-agent')}`);
            next();
        });
    }
    /**
     * Setup API routes
     */
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ status: 'ok', timestamp: new Date().toISOString() });
        });
        // Health check for sync database
        this.app.get('/api/health/sync-db', async (_req, res, next) => {
            try {
                console.log('📥 [API] GET /api/health/sync-db - Request received');
                const result = await syncPool.query('SELECT NOW()');
                console.log('✅ [API] Sync database is healthy');
                res.json({
                    status: 'ok',
                    database: 'sync',
                    timestamp: result.rows[0].now,
                });
            }
            catch (error) {
                console.error('❌ [API] Sync database health check failed:', error);
                res.status(503).json({
                    status: 'error',
                    database: 'sync',
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        });
        // Health check for remote database
        this.app.get('/api/health/remote-db', async (_req, res, next) => {
            try {
                console.log('📥 [API] GET /api/health/remote-db - Request received');
                // Note: This would need remotePool to be passed in or available
                console.log('✅ [API] Remote database health check endpoint available');
                res.json({
                    status: 'ok',
                    database: 'remote',
                    timestamp: new Date().toISOString(),
                });
            }
            catch (error) {
                console.error('❌ [API] Remote database health check failed:', error);
                res.status(503).json({
                    status: 'error',
                    database: 'remote',
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        });
        // Get tenant information from memory
        this.app.get('/api/local/tenant', async (_req, res, next) => {
            try {
                console.log('📥 [API] GET /api/local/tenant - Request received');
                // if (!this.syncManager) {
                //   console.warn('⚠️  [API] Sync Manager not available');
                //   return res.status(503).json({
                //     error: 'Sync Manager not available'
                //   });
                // }
                const tenantData = this.syncManager.getTenantData();
                if (!tenantData) {
                    console.log('📤 [API] GET /api/local/tenant - No tenant data available (still initializing)');
                    return res.status(503).json({
                        error: 'Tenant data not yet loaded - system is initializing',
                        status: 'initializing'
                    });
                }
                console.log(`📤 [API] GET /api/local/tenant - Returning tenant: ${tenantData.name}`);
                res.json(tenantData);
                console.log('✅ [API] GET /api/local/tenant - Response sent successfully');
            }
            catch (error) {
                console.error('❌ [API] GET /api/local/tenant - Error:', error);
                next(error);
            }
        });
        // Trigger tenant sync from remote to local database
        this.app.post('/api/local/tenant-sync', async (req, res, next) => {
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
                if (!this.remotePool) {
                    console.error('❌ [API] Remote database pool not available');
                    return res.status(503).json({
                        success: false,
                        error: 'Remote database pool not available'
                    });
                }
                // Execute tenant sync for specific tenant
                let syncResult;
                if (tenant_id > 0) {
                    console.log('🔄 [API] Executing tenant sync...');
                    syncResult = await syncTenant(this.remotePool, syncPool, tenant_id);
                    if (!syncResult.success) {
                        console.error('❌ [API] Tenant sync failed:', syncResult.error);
                        return res.status(500).json({
                            success: false,
                            error: syncResult.error || 'Tenant sync failed',
                            timestamp: syncResult.timestamp,
                        });
                    }
                }
                // Fetch the synced tenant data to return to frontend
                let tenantData = null;
                try {
                    const tenantQuery = `
            SELECT tenant_id, name, url, street, street2, city, state, zip, country, active
            FROM tenant
            WHERE tenant_id = $1
          `;
                    const tenantResult = await syncPool.query(tenantQuery, [tenant_id]);
                    if (tenantResult.rows.length > 0) {
                        tenantData = tenantResult.rows[0];
                    }
                }
                catch (err) {
                    console.warn('⚠️  [API] Failed to fetch synced tenant data:', err);
                }
                const response = {
                    success: true,
                    message: 'Tenant sync completed successfully',
                    sync_result: syncResult ? {
                        inserted: syncResult.inserted,
                        updated: syncResult.updated,
                        timestamp: syncResult.timestamp,
                    } : null,
                    tenant_data: tenantData,
                };
                console.log(`📤 [API] POST /api/local/tenant-sync - Returning:`, JSON.stringify(response, null, 2));
                res.json(response);
                console.log('✅ [API] POST /api/local/tenant-sync - Response sent successfully');
            }
            catch (error) {
                console.error('❌ [API] POST /api/local/tenant-sync - Error:', error);
                const errorMsg = error instanceof Error ? error.message : String(error);
                res.status(500).json({
                    success: false,
                    error: errorMsg,
                    timestamp: new Date().toISOString(),
                });
            }
        });
        // Get all meters
        this.app.get('/api/local/meters', async (_req, res, next) => {
            try {
                console.log('📥 [API] GET /api/local/meters - Request received');
                const meters = await this.database.getMeters(true);
                console.log(`📤 [API] GET /api/local/meters - Returning ${meters.length} meter(s)`);
                res.json(meters);
                console.log('✅ [API] GET /api/local/meters - Response sent successfully');
            }
            catch (error) {
                console.error('❌ [API] GET /api/local/meters - Error:', error);
                next(error);
            }
        });
        // Get recent readings
        this.app.get('/api/local/readings', async (req, res, next) => {
            try {
                const hours = parseInt(req.query.hours) || 24;
                console.log(`📥 [API] GET /api/local/readings - Request received (hours: ${hours})`);
                // Query the local sync database for recent readings
                const query = `
          SELECT 
            meter_reading_id,
            meter_id,
            timestamp,
            data_point,
            value,
            unit,
            is_synchronized,
            retry_count
          FROM meter_reading
          WHERE created_at >= NOW() - INTERVAL '${hours} hours'
          ORDER BY created_at DESC
          LIMIT 1000
        `;
                const result = await execQuery(syncPool, query, [], 'server.ts>setupRoutes');
                const readings = result.rows;
                console.log(`📤 [API] GET /api/local/readings - Returning ${readings.length} reading(s)`);
                res.json(readings);
                console.log('✅ [API] GET /api/local/readings - Response sent successfully');
            }
            catch (error) {
                console.error('❌ [API] GET /api/local/readings - Error:', error);
                next(error);
            }
        });
        // Get sync status
        this.app.get('/api/local/sync-status', async (_req, res, next) => {
            try {
                console.log('📥 [API] GET /api/local/sync-status - Request received');
                let queueSize = 0;
                let recentLogs = [];
                try {
                    // Query recent sync logs from local sync database
                    const logsQuery = `
            SELECT sync_log_id, batch_size, success, error_message, synced_at
            FROM sync_log
            ORDER BY synced_at DESC
            LIMIT 10
          `;
                    const logsResult = await syncPool.query(logsQuery);
                    recentLogs = logsResult.rows;
                }
                catch (err) {
                    console.error('❌ [API] Error getting recent logs:', err);
                }
                // Get last successful sync
                const successfulLogs = recentLogs.filter((log) => log.success);
                const lastSuccessfulSync = successfulLogs.length > 0
                    ? successfulLogs[0].synced_at
                    : null;
                // Get recent errors (last 10 failed syncs)
                const errorLogs = recentLogs
                    .filter((log) => !log.success)
                    .slice(0, 10)
                    .map((log) => ({
                    sync_log_id: log.sync_log_id,
                    batch_size: log.batch_size,
                    error_message: log.error_message || 'Unknown error',
                    synced_at: log.synced_at,
                }));
                // Get connectivity status from sync manager if available
                let isConnected = false;
                if (this.syncManager) {
                    const syncStatus = this.syncManager.getStatus();
                    console.log('🔍 [API] Sync Manager Status:', JSON.stringify(syncStatus, null, 2));
                    isConnected = syncStatus.isClientConnected;
                    console.log(`🔗 [API] isClientConnected from SyncManager: ${isConnected}`);
                }
                else {
                    console.warn('⚠️  [API] Sync Manager not available');
                }
                const response = {
                    is_connected: isConnected,
                    last_sync_at: lastSuccessfulSync,
                    queue_size: queueSize,
                    sync_errors: errorLogs,
                };
                console.log(`📤 [API] GET /api/local/sync-status - Returning:`, JSON.stringify(response, null, 2));
                res.json(response);
                console.log('✅ [API] GET /api/local/sync-status - Response sent successfully');
            }
            catch (error) {
                console.error('❌ [API] GET /api/local/sync-status - Error:', error);
                next(error);
            }
        });
        // Trigger manual sync
        this.app.post('/api/local/sync-trigger', async (_req, res, next) => {
            try {
                console.log('📥 [API] POST /api/local/sync-trigger - Request received');
                if (!this.syncManager) {
                    console.error('❌ [API] Sync manager not available');
                    return res.status(503).json({
                        error: 'Sync manager not available'
                    });
                }
                const syncStatus = this.syncManager.getStatus();
                if (!syncStatus.isClientConnected) {
                    console.error('❌ [API] Client System is not reachable');
                    return res.status(503).json({
                        error: 'Client System is not reachable'
                    });
                }
                if (syncStatus.isRunning) {
                    console.warn('⚠️  [API] Sync is already in progress');
                    return res.status(409).json({
                        error: 'Sync is already in progress'
                    });
                }
                // Trigger sync asynchronously
                this.syncManager.triggerManualSync().catch((error) => {
                    console.error('❌ [API] Manual sync failed:', error);
                });
                const response = {
                    message: 'Sync triggered successfully',
                    queue_size: syncStatus.queueSize,
                };
                console.log(`📤 [API] POST /api/local/sync-trigger - Returning:`, JSON.stringify(response, null, 2));
                res.json(response);
                console.log('✅ [API] POST /api/local/sync-trigger - Response sent successfully');
            }
            catch (error) {
                console.error('❌ [API] POST /api/local/sync-trigger - Error:', error);
                next(error);
            }
        });
        // Get meter sync status
        this.app.get('/api/local/meter-sync-status', async (_req, res, next) => {
            try {
                console.log('📥 [API] GET /api/local/meter-sync-status - Request received');
                if (!this.remoteToLocalSyncAgent) {
                    console.error('❌ [API] Remote to Local Sync Agent not available');
                    return res.status(503).json({
                        error: 'Remote to Local Sync Agent not available'
                    });
                }
                const syncStatus = this.remoteToLocalSyncAgent.getStatus();
                // Get meter count from database
                let meterCount = 0;
                try {
                    const meters = await this.database.getMeters(true);
                    meterCount = meters.length;
                }
                catch (err) {
                    console.error('❌ [API] Error getting meter count:', err);
                }
                const response = {
                    last_sync_at: syncStatus.lastSyncTime || null,
                    last_sync_success: syncStatus.lastSyncSuccess !== undefined ? syncStatus.lastSyncSuccess : null,
                    last_sync_error: syncStatus.lastSyncError || null,
                    inserted_count: syncStatus.lastInsertedCount,
                    updated_count: syncStatus.lastUpdatedCount,
                    deleted_count: syncStatus.lastDeletedCount,
                    meter_count: meterCount,
                    is_syncing: syncStatus.isSyncing,
                };
                console.log(`📤 [API] GET /api/local/meter-sync-status - Returning:`, JSON.stringify(response, null, 2));
                res.json(response);
                console.log('✅ [API] GET /api/local/meter-sync-status - Response sent successfully');
            }
            catch (error) {
                console.error('❌ [API] GET /api/local/meter-sync-status - Error:', error);
                next(error);
            }
        });
        // Trigger manual meter sync
        this.app.post('/api/local/meter-sync-trigger', async (_req, res, next) => {
            try {
                console.log('📥 [API] POST /api/local/meter-sync-trigger - Request received');
                if (!this.remoteToLocalSyncAgent) {
                    console.error('❌ [API] Remote to Local Sync Agent not available');
                    return res.status(503).json({
                        success: false,
                        message: 'Remote to Local Sync Agent not available',
                    });
                }
                const syncStatus = this.remoteToLocalSyncAgent.getStatus();
                if (syncStatus.isSyncing) {
                    console.warn('⚠️  [API] Meter sync is already in progress');
                    return res.status(409).json({
                        success: false,
                        message: 'Meter sync is already in progress',
                    });
                }
                // Trigger sync
                console.log('🔄 [API] Triggering meter sync...');
                const result = await this.remoteToLocalSyncAgent.triggerSync();
                const response = {
                    success: result.success,
                    message: result.success
                        ? 'Meter sync completed successfully'
                        : `Meter sync failed: ${result.error}`,
                    result: {
                        inserted: result.inserted,
                        updated: result.updated,
                        deleted: result.deleted,
                        timestamp: result.timestamp,
                    },
                };
                console.log(`📤 [API] POST /api/local/meter-sync-trigger - Returning:`, JSON.stringify(response, null, 2));
                res.json(response);
                console.log('✅ [API] POST /api/local/meter-sync-trigger - Response sent successfully');
            }
            catch (error) {
                console.error('❌ [API] POST /api/local/meter-sync-trigger - Error:', error);
                next(error);
            }
        });
        // Get BACnet meter reading agent status
        this.app.get('/api/meter-reading/status', async (_req, res, next) => {
            try {
                console.log('📥 [API] GET /api/meter-reading/status - Request received');
                if (!this.bacnetMeterReadingAgent) {
                    console.error('❌ [API] BACnet meter reading agent not available');
                    return res.status(503).json({
                        error: 'BACnet meter reading agent not available',
                    });
                }
                const agentStatus = this.bacnetMeterReadingAgent.getStatus();
                const response = {
                    agent_status: {
                        isRunning: agentStatus.isRunning,
                        totalCyclesExecuted: agentStatus.totalCyclesExecuted,
                        totalReadingsCollected: agentStatus.totalReadingsCollected,
                        totalErrorsEncountered: agentStatus.totalErrorsEncountered,
                    },
                    last_cycle_result: agentStatus.lastCycleResult ? {
                        cycleId: agentStatus.lastCycleResult.cycleId,
                        startTime: agentStatus.lastCycleResult.startTime,
                        endTime: agentStatus.lastCycleResult.endTime,
                        metersProcessed: agentStatus.lastCycleResult.metersProcessed,
                        readingsCollected: agentStatus.lastCycleResult.readingsCollected,
                        errorCount: agentStatus.lastCycleResult.errors.length,
                        success: agentStatus.lastCycleResult.success,
                    } : null,
                    active_errors: agentStatus.activeErrors.map(err => ({
                        meterId: err.meterId,
                        dataPoint: err.dataPoint,
                        operation: err.operation,
                        error: err.error,
                        timestamp: err.timestamp,
                    })),
                };
                console.log(`📤 [API] GET /api/meter-reading/status - Returning:`, JSON.stringify(response, null, 2));
                res.json(response);
                console.log('✅ [API] GET /api/meter-reading/status - Response sent successfully');
            }
            catch (error) {
                console.error('❌ [API] GET /api/meter-reading/status - Error:', error);
                next(error);
            }
        });
        // Trigger manual BACnet meter reading collection
        this.app.post('/api/meter-reading/trigger', async (_req, res, next) => {
            try {
                console.log('📥 [API] POST /api/meter-reading/trigger - Request received');
                debugger; // Breakpoint for debugging
                // Set a longer timeout for this endpoint (collection can take time)
                // Default is 120 seconds, but we'll set it to 5 minutes for manual triggers
                res.setTimeout(300000); // 5 minutes
                if (!this.bacnetMeterReadingAgent) {
                    console.error('❌ [API] BACnet meter reading agent not available');
                    return res.status(503).json({
                        success: false,
                        error: 'BACnet meter reading agent not available',
                    });
                }
                const agentStatus = this.bacnetMeterReadingAgent.getStatus();
                // Allow trigger even if agent is not running (for debugging)
                console.log(`🔄 [API] Agent status: isRunning=${agentStatus.isRunning}`);
                // Trigger collection cycle
                console.log('🔄 [API] Triggering BACnet meter reading collection...');
                const result = await this.bacnetMeterReadingAgent.triggerCollection();
                const response = {
                    success: true,
                    message: 'Meter reading collection cycle triggered successfully',
                    cycle_result: {
                        cycleId: result.cycleId,
                        startTime: result.startTime,
                        endTime: result.endTime,
                        metersProcessed: result.metersProcessed,
                        readingsCollected: result.readingsCollected,
                        errorCount: result.errors.length,
                        errors: result.errors.map(err => ({
                            meterId: err.meterId,
                            dataPoint: err.dataPoint,
                            operation: err.operation,
                            error: err.error,
                            timestamp: err.timestamp,
                        })),
                    },
                };
                console.log(`📤 [API] POST /api/meter-reading/trigger - Returning:`, JSON.stringify(response, null, 2));
                res.json(response);
                console.log('✅ [API] POST /api/meter-reading/trigger - Response sent successfully');
            }
            catch (error) {
                console.error('❌ [API] POST /api/meter-reading/trigger - Error:', error);
                const errorMsg = error instanceof Error ? error.message : String(error);
                res.status(409).json({
                    success: false,
                    error: errorMsg,
                });
            }
        });
        // Get meter reading upload status
        this.app.get('/api/sync/meter-reading-upload/status', async (_req, res, next) => {
            try {
                console.log('📥 [API] GET /api/sync/meter-reading-upload/status - Request received');
                if (!this.meterReadingUploadManager) {
                    console.error('❌ [API] Meter reading upload manager not available');
                    return res.status(503).json({
                        error: 'Meter reading upload manager not available',
                    });
                }
                const uploadStatus = this.meterReadingUploadManager.getStatus();
                const response = {
                    is_running: uploadStatus.isRunning,
                    last_upload_time: uploadStatus.lastUploadTime || null,
                    last_upload_success: uploadStatus.lastUploadSuccess !== undefined ? uploadStatus.lastUploadSuccess : null,
                    last_upload_error: uploadStatus.lastUploadError || null,
                    queue_size: uploadStatus.queueSize,
                    total_uploaded: uploadStatus.totalUploaded,
                    total_failed: uploadStatus.totalFailed,
                    is_client_connected: uploadStatus.isClientConnected,
                };
                console.log(`📤 [API] GET /api/sync/meter-reading-upload/status - Returning:`, JSON.stringify(response, null, 2));
                res.json(response);
                console.log('✅ [API] GET /api/sync/meter-reading-upload/status - Response sent successfully');
            }
            catch (error) {
                console.error('❌ [API] GET /api/sync/meter-reading-upload/status - Error:', error);
                next(error);
            }
        });
        // Get meter reading upload operation log
        this.app.get('/api/sync/meter-reading-upload/log', async (_req, res, next) => {
            try {
                console.log('📥 [API] GET /api/sync/meter-reading-upload/log - Request received');
                // Query recent sync operations from the sync database
                const query = `
          SELECT sync_operation_id, tenant_id, operation_type, readings_count, success, error_message, created_at
          FROM sync_operation_log
          WHERE operation_type = 'upload'
          ORDER BY created_at DESC
          LIMIT 20
        `;
                const result = await execQuery(syncPool, query, [], 'server.ts>setupRoutes');
                const operations = result.rows.map((row) => ({
                    sync_operation_id: row.sync_operation_id,
                    tenant_id: row.tenant_id,
                    operation_type: row.operation_type,
                    readings_count: row.readings_count,
                    success: row.success,
                    error_message: row.error_message || null,
                    created_at: row.created_at,
                }));
                console.log(`📤 [API] GET /api/sync/meter-reading-upload/log - Returning ${operations.length} operation(s)`);
                res.json(operations);
                console.log('✅ [API] GET /api/sync/meter-reading-upload/log - Response sent successfully');
            }
            catch (error) {
                console.error('❌ [API] GET /api/sync/meter-reading-upload/log - Error:', error);
                next(error);
            }
        });
        // Trigger manual meter reading upload
        this.app.post('/api/sync/meter-reading-upload/trigger', async (_req, res, next) => {
            try {
                console.log('📥 [API] POST /api/sync/meter-reading-upload/trigger - Request received');
                if (!this.meterReadingUploadManager) {
                    console.error('❌ [API] Meter reading upload manager not available');
                    return res.status(503).json({
                        success: false,
                        error: 'Meter reading upload manager not available',
                    });
                }
                const uploadStatus = this.meterReadingUploadManager.getStatus();
                if (uploadStatus.isRunning) {
                    console.warn('⚠️  [API] Upload is already in progress');
                    return res.status(409).json({
                        success: false,
                        error: 'Upload is already in progress',
                    });
                }
                // Trigger upload asynchronously
                console.log('🔄 [API] Triggering meter reading upload...');
                this.meterReadingUploadManager.triggerUpload().catch((error) => {
                    console.error('❌ [API] Manual upload failed:', error);
                });
                const response = {
                    success: true,
                    message: 'Upload triggered successfully',
                    queue_size: uploadStatus.queueSize,
                };
                console.log(`📤 [API] POST /api/sync/meter-reading-upload/trigger - Returning:`, JSON.stringify(response, null, 2));
                res.json(response);
                console.log('✅ [API] POST /api/sync/meter-reading-upload/trigger - Response sent successfully');
            }
            catch (error) {
                console.error('❌ [API] POST /api/sync/meter-reading-upload/trigger - Error:', error);
                next(error);
            }
        });
    }
    /**
     * Setup error handling middleware
     */
    setupErrorHandling() {
        // 404 handler
        this.app.use((req, res) => {
            console.warn(`⚠️  [API] 404 Not Found: ${req.method} ${req.path}`);
            res.status(404).json({ error: 'Not found' });
        });
        // Error handler
        this.app.use((err, _req, res, _next) => {
            console.error('❌ [API] Internal Server Error:', err);
            res.status(500).json({
                error: 'Internal server error',
                message: err.message,
            });
        });
    }
    /**
     * Start the API server
     */
    async start() {
        return new Promise((resolve, reject) => {
            try {
                console.log(`\n🚀 [API Server] Starting Local API Server on port ${this.port}...`);
                this.server = this.app.listen(this.port, () => {
                    console.log(`✅ [API Server] Local API server listening on port ${this.port}`);
                    console.log(`   Health check: http://localhost:${this.port}/health`);
                    console.log(`   Meters endpoint: http://localhost:${this.port}/api/local/meters`);
                    console.log(`   Readings endpoint: http://localhost:${this.port}/api/local/readings`);
                    console.log(`   Sync status endpoint: http://localhost:${this.port}/api/local/sync-status`);
                    console.log(`   Meter sync status endpoint: http://localhost:${this.port}/api/local/meter-sync-status`);
                    console.log(`   Meter sync trigger endpoint: http://localhost:${this.port}/api/local/meter-sync-trigger`);
                    console.log(`   Meter reading status endpoint: http://localhost:${this.port}/api/meter-reading/status`);
                    console.log(`   Meter reading trigger endpoint: http://localhost:${this.port}/api/meter-reading/trigger`);
                    console.log(`   Meter reading upload status endpoint: http://localhost:${this.port}/api/sync/meter-reading-upload/status`);
                    console.log(`   Meter reading upload log endpoint: http://localhost:${this.port}/api/sync/meter-reading-upload/log`);
                    console.log(`   Meter reading upload trigger endpoint: http://localhost:${this.port}/api/sync/meter-reading-upload/trigger\n`);
                    resolve();
                });
                this.server.on('error', (error) => {
                    console.error('❌ [API Server] Failed to start API server:', error);
                    reject(error);
                });
            }
            catch (error) {
                console.error('❌ [API Server] Exception during startup:', error);
                reject(error);
            }
        });
    }
    /**
     * Stop the API server
     */
    async stop() {
        return new Promise((resolve, reject) => {
            if (!this.server) {
                resolve();
                return;
            }
            this.server.close((err) => {
                if (err) {
                    console.error('Error stopping API server:', err);
                    reject(err);
                }
                else {
                    console.log('Local API server stopped');
                    resolve();
                }
            });
        });
    }
    /**
     * Set sync manager (can be set after construction)
     */
    setSyncManager(syncManager) {
        this.syncManager = syncManager;
    }
}
/**
 * Create and start local API server from environment variables
 */
export async function createAndStartLocalApiServer(database, remoteToLocalSyncAgent, bacnetMeterReadingAgent, meterReadingUploadManager, remotePool) {
    const port = parseInt(process.env.LOCAL_API_PORT || '3002', 10);
    const server = new LocalApiServer({
        port,
        database,
        remoteToLocalSyncAgent,
        bacnetMeterReadingAgent,
        meterReadingUploadManager,
        remotePool,
    });
    await server.start();
    return server;
}
//# sourceMappingURL=server.js.map