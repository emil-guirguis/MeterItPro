#!/usr/bin/env node
/**
 * Sync MCP Server
 *
 * Model Context Protocol server for Sync operations.
 * Provides AI tools for controlling meter collection, synchronization, and local data queries.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import winston from 'winston';
import { initializePools, remotePool as globalRemotePool } from './data-sync/data-sync.js';
import { ClientSystemApiClient } from './api/client-system-api.js';
import { createAndStartLocalApiServer } from './api/server.js';
import { RemoteToLocalSyncAgent } from './remote_to_local-sync/sync-agent.js';
import { BACnetMeterReadingAgent } from './bacnet-collection/bacnet-reading-agent.js';
import { MeterReadingCleanupAgent } from './bacnet-collection/meter-reading-cleanup-agent.js';
import { SyncManager } from './remote_to_local-sync/sync-manager.js';
import { SyncDatabase } from './data-sync/data-sync.js';
import { getBACnetCollectionIntervalSeconds, getBACnetUploadCronExpression, } from './config/scheduling-constants.js';
// Load environment variables from root .env file first, then local .env
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { cacheManager } from './cache/cache-manager.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') }); // Root .env
dotenv.config({ path: join(__dirname, '../.env') }); // Local .env to override if needed
// Configure logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), winston.format.printf(({ level, message }) => `${level}: ${message}`)),
        }),
        new winston.transports.File({
            filename: 'logs/sync-mcp-error.log',
            level: 'error'
        }),
        new winston.transports.File({
            filename: 'logs/sync-mcp.log'
        }),
    ],
});
/**
 * Sync MCP Server Class
 */
class SyncMcpServer {
    server;
    apiServer;
    syncDatabase;
    remotePool;
    remoteToLocalSyncAgent;
    bacnetMeterReadingAgent;
    meterReadingCleanupAgent;
    syncManager;
    isInitialized = false;
    constructor() {
        this.server = new Server({
            name: 'sync-mcp-server',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupHandlers();
        console.log('🚀 [Init] Sync MCP Server created');
    }
    /**
     * Initialize services
     */
    async initializeServices() {
        if (this.isInitialized) {
            console.log('ℹ️  [Services] Already initialized, skipping...');
            return;
        }
        try {
            console.log('\n🔧 [Services] Initializing Sync MCP services...');
            // Step 1: Initialize database pools (creates global syncPool and remotePool)
            console.log('🔗 [Services] Initializing database pools...');
            await initializePools();
            console.log('✅ [Services] Database pools initialized');
            // Step 2: Create SyncDatabase service (will use global syncPool)
            console.log('📊 [Services] Creating SyncDatabase service...');
            this.syncDatabase = new SyncDatabase();
            console.log('✅ [Services] SyncDatabase service created');
            // Step 3: Test sync database connection
            console.log('🔧 [Services] Testing sync database connection...');
            const syncConnected = await this.syncDatabase.testConnectionLocal();
            if (!syncConnected) {
                throw new Error('Failed to connect to sync database - connection test failed');
            }
            console.log('✅ [Services] Sync database connection successful');
            // Step 4: Initialize database schema
            console.log('🔧 [Services] Initializing database schema...');
            await this.syncDatabase.initialize();
            console.log('✅ [Services] Database schema initialized');
            await cacheManager.tenantCache.initialize(this.syncDatabase);
            const tenant = cacheManager.tenantCache.getTenant();
            const tenantId = tenant?.tenant_id || 0;
            console.log('✅ [sync\mcp\src\index.ts.initializeServices] TenantCache initialized');
            if (tenantId > 0) {
                // Step 4b: Update tenant API key from environment
                const apiKeyFromEnv = process.env.CLIENT_API_KEY || '';
                if (apiKeyFromEnv) {
                    console.log('🔑 [Services] Updating tenant API key from environment...');
                    await this.syncDatabase.updateTenantApiKey(apiKeyFromEnv);
                    console.log('✅ [Services] Tenant API key updated');
                }
                else {
                    console.warn('⚠️  [Services] No CLIENT_API_KEY in environment - API uploads may fail');
                }
                // Create API client for uploads
                const apiClient = new ClientSystemApiClient({
                    apiUrl: process.env.CLIENT_API_URL || 'http://localhost:3001/api',
                    apiKey: apiKeyFromEnv,
                    timeout: parseInt(process.env.API_TIMEOUT || '30000', 10),
                    maxRetries: parseInt(process.env.MAX_RETRIES || '5', 10),
                });
                console.log('✅ [Services] Client System API Client created');
                this.bacnetMeterReadingAgent = new BACnetMeterReadingAgent({
                    syncDatabase: this.syncDatabase,
                    collectionIntervalSeconds: getBACnetCollectionIntervalSeconds(),
                    uploadCronExpression: getBACnetUploadCronExpression(),
                    enableAutoStart: process.env.BACNET_AUTO_START !== 'false',
                    bacnetInterface: process.env.BACNET_INTERFACE || '0.0.0.0',
                    bacnetPort: parseInt(process.env.BACNET_PORT || '47808', 10),
                    connectionTimeoutMs: parseInt(process.env.BACNET_CONNECTION_TIMEOUT_MS || '5000', 10),
                    readTimeoutMs: parseInt(process.env.BACNET_READ_TIMEOUT_MS || '1000', 10),
                    batchReadTimeoutMs: parseInt(process.env.BACNET_BATCH_READ_TIMEOUT_MS || '1000', 10),
                    sequentialReadTimeoutMs: parseInt(process.env.BACNET_SEQUENTIAL_READ_TIMEOUT_MS || '1000', 10),
                    connectivityCheckTimeoutMs: parseInt(process.env.BACNET_CONNECTIVITY_CHECK_TIMEOUT_MS || '2000', 10),
                    enableConnectivityCheck: process.env.BACNET_ENABLE_CONNECTIVITY_CHECK !== 'false',
                    enableSequentialFallback: process.env.BACNET_ENABLE_SEQUENTIAL_FALLBACK !== 'false',
                    adaptiveBatchSizing: process.env.BACNET_ADAPTIVE_BATCH_SIZING !== 'false',
                    apiClient: apiClient,
                }, logger);
                console.log('✅ [Services] BACnet Meter Reading Agent initialized');
                // Initialize Remote to Local Sync Agent
                console.log('🔄 [Services] Initializing Remote to Local Sync Agent...');
                this.remotePool = this.getRemoteDatabasePool();
                this.remoteToLocalSyncAgent = new RemoteToLocalSyncAgent({
                    syncDatabase: this.syncDatabase,
                    remotePool: this.remotePool,
                    syncIntervalMinutes: parseInt(process.env.METER_SYNC_INTERVAL_MINUTES || '60', 10),
                    enableAutoSync: process.env.METER_SYNC_AUTO_START !== 'false',
                    bacnetMeterReadingAgent: this.bacnetMeterReadingAgent,
                });
                console.log('✅ [Services] Remote to Local Sync Agent initialized');
                // Step 7: Start Sync Agent (syncs all 3 entities AND loads caches)
                console.log('▶️  [Services] Starting Remote to Local Sync Agent...');
                await this.remoteToLocalSyncAgent.start();
                console.log('✅ [Services] Remote to Local Sync Agent started (all data synced and caches loaded)');
                // Step 8: Start BACnet Meter Reading Agent AFTER sync agent completes
                console.log('▶️  [Services] Starting BACnet Meter Reading Agent...');
                await this.bacnetMeterReadingAgent.start();
                console.log('✅ [Services] BACnet Meter Reading Agent started');
                // Step 9: Initialize and start Meter Reading Cleanup Agent
                console.log('🧹 [Services] Initializing Meter Reading Cleanup Agent...');
                this.meterReadingCleanupAgent = new MeterReadingCleanupAgent({
                    database: this.syncDatabase,
                    retentionDays: parseInt(process.env.METER_READING_RETENTION_DAYS || '60', 10),
                    enableAutoStart: process.env.METER_READING_CLEANUP_AUTO_START !== 'false',
                }, logger);
                console.log('✅ [Services] Meter Reading Cleanup Agent initialized');
                console.log('▶️  [Services] Starting Meter Reading Cleanup Agent...');
                await this.meterReadingCleanupAgent.start();
                console.log('✅ [Services] Meter Reading Cleanup Agent started');
                // Step 10: Initialize Sync Manager
                console.log('🔄 [Services] Initializing Sync Manager...');
                this.syncManager = new SyncManager({
                    database: this.syncDatabase,
                    apiClient: apiClient,
                    syncIntervalMinutes: parseInt(process.env.METER_SYNC_INTERVAL_MINUTES || '60', 10),
                    batchSize: parseInt(process.env.BATCH_SIZE || '1000', 10),
                    maxRetries: parseInt(process.env.MAX_RETRIES || '5', 10),
                    enableAutoSync: process.env.METER_SYNC_AUTO_START !== 'false',
                });
                console.log('✅ [Services] Sync Manager initialized');
                console.log('▶️  [Services] Starting Sync Manager...');
                await this.syncManager.start();
                console.log('✅ [Services] Sync Manager started');
                // Step 11: Initialize Local API Server
                console.log('🌐 [Services] Initializing Local API Server...');
                this.apiServer = await createAndStartLocalApiServer(this.syncDatabase, this.remoteToLocalSyncAgent, this.bacnetMeterReadingAgent, undefined, this.remotePool);
                // Step 12: Set Sync Manager on API Server
                console.log('🔗 [Services] Setting Sync Manager on Local API Server...');
                this.apiServer.setSyncManager(this.syncManager);
                console.log('✅ [Services] Sync Manager set on Local API Server');
                this.isInitialized = true;
                console.log('✅ [Services] All services initialized successfully\n');
            }
        }
        catch (error) {
            console.error('❌ [Services] Failed to initialize services:', error);
            if (this.remotePool) {
                await this.closeRemotePool(this.remotePool);
            }
            throw error;
        }
    }
    /**
     * Get remote database pool (uses global remotePool from initializePools)
     */
    getRemoteDatabasePool() {
        if (!globalRemotePool) {
            throw new Error('Remote database pool not initialized. Call initializePools() first.');
        }
        return globalRemotePool;
    }
    /**
     * Close remote database pool
     */
    async closeRemotePool(pool) {
        try {
            await pool.end();
            console.log('✅ Remote pool closed');
        }
        catch (error) {
            console.error('Failed to close remote pool:', error);
        }
    }
    /**
     * Setup MCP request handlers
     */
    setupHandlers() {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: this.getTools(),
            };
        });
        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                // Ensure services are initialized
                await this.initializeServices();
                // Route to appropriate tool handler
                switch (name) {
                    case 'get_upload_status':
                        return await this.handleGetUploadStatus();
                    case 'trigger_upload':
                        return await this.handleTriggerUpload();
                    case 'query_meter_reading':
                        return await this.handleQueryMeterReadings(args);
                    case 'get_meter_status':
                        return await this.handleGetMeterStatus(args);
                    case 'trigger_meter_reading':
                        return await this.handleTriggerMeterReading();
                    case 'get_meter_reading_status':
                        return await this.handleGetMeterReadingStatus();
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            }
            catch (error) {
                logger.error(`Tool execution error (${name}):`, error);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        },
                    ],
                };
            }
        });
    }
    /**
     * Get list of available tools
     */
    getTools() {
        return [
            {
                name: 'get_upload_status',
                description: 'Get the current upload status including connectivity, queue size, and recent upload operations',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'trigger_upload',
                description: 'Manually trigger an upload operation to send queued readings to the Client System',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'query_meter_reading',
                description: 'Query local meter readings with optional filters',
                inputSchema: {
                    type: 'object',
                    properties: {
                        meter_id: {
                            type: 'string',
                            description: 'Filter by meter external ID (optional)',
                        },
                        hours: {
                            type: 'number',
                            description: 'Number of hours to look back (default: 24)',
                        },
                        limit: {
                            type: 'number',
                            description: 'Maximum number of readings to return (default: 100)',
                        },
                    },
                },
            },
            {
                name: 'get_meter_status',
                description: 'Get the connectivity and health status of BACnet meters',
                inputSchema: {
                    type: 'object',
                    properties: {
                        meter_id: {
                            type: 'string',
                            description: 'Get status for specific meter (optional, returns all if omitted)',
                        },
                    },
                },
            },
            {
                name: 'trigger_meter_reading',
                description: 'Manually trigger an immediate BACnet meter reading collection cycle',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'get_meter_reading_status',
                description: 'Get the current status of the BACnet meter reading agent including cycle results and metrics',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
        ];
    }
    /**
     * Tool Handler: get_upload_status
     */
    async handleGetUploadStatus() {
        if (!this.bacnetMeterReadingAgent) {
            throw new Error('BACnet Meter Reading Agent not initialized');
        }
        const status = this.bacnetMeterReadingAgent.getStatus();
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        message: 'Upload status is managed by BACnet Meter Reading Agent',
                        agent_status: {
                            isRunning: status.isRunning,
                            totalCyclesExecuted: status.totalCyclesExecuted,
                            totalReadingsCollected: status.totalReadingsCollected,
                            totalErrorsEncountered: status.totalErrorsEncountered,
                        },
                        last_cycle: status.lastCycleResult ? {
                            cycleId: status.lastCycleResult.cycleId,
                            metersProcessed: status.lastCycleResult.metersProcessed,
                            readingsCollected: status.lastCycleResult.readingsCollected,
                            errorCount: status.lastCycleResult.errors.length,
                        } : null,
                    }, null, 2),
                },
            ],
        };
    }
    /**
     * Tool Handler: trigger_upload
     */
    async handleTriggerUpload() {
        if (!this.bacnetMeterReadingAgent) {
            throw new Error('BACnet Meter Reading Agent not initialized');
        }
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        message: 'Upload is managed automatically by BACnet Meter Reading Agent every 5 minutes',
                        note: 'Use trigger_meter_reading to manually trigger a collection cycle',
                    }, null, 2),
                },
            ],
        };
    }
    /**
     * Tool Handler: query_meter_reading
     */
    async handleQueryMeterReadings(args) {
        const meterId = args.meter_id;
        const limit = args.limit || 100;
        let readings = [];
        if (meterId) {
            // Query specific meter
            // TODO: Implement getReadingsByMeterAndTimeRange when database service is available
            readings = [];
            readings = readings.slice(0, limit);
        }
        else {
            // Query all recent readings
            // TODO: Implement getRecentReadings when database service is available
            readings = [];
            readings = readings.slice(0, limit);
        }
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        count: readings.length,
                        readings,
                    }, null, 2),
                },
            ],
        };
    }
    /**
     * Tool Handler: get_meter_status
     */
    async handleGetMeterStatus(args) {
        if (!this.bacnetMeterReadingAgent) {
            throw new Error('BACnet Meter Reading Agent not initialized');
        }
        const meterId = args.meter_id;
        const status = this.bacnetMeterReadingAgent.getStatus();
        if (meterId) {
            // Filter for specific meter from last cycle result
            if (!status.lastCycleResult) {
                throw new Error('No collection cycle has been executed yet');
            }
            // Find meter in the cycle result
            const meterError = status.lastCycleResult.errors.find((e) => e.meterId === meterId);
            if (meterError) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                meter_id: meterId,
                                status: 'error',
                                error: meterError.error,
                                lastChecked: meterError.timestamp,
                            }, null, 2),
                        },
                    ],
                };
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            meter_id: meterId,
                            status: 'healthy',
                            lastCycleId: status.lastCycleResult.cycleId,
                            lastCycleTime: status.lastCycleResult.endTime,
                        }, null, 2),
                    },
                ],
            };
        }
        else {
            // Return overall agent status
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            agent_status: {
                                isRunning: status.isRunning,
                                totalCyclesExecuted: status.totalCyclesExecuted,
                                totalReadingsCollected: status.totalReadingsCollected,
                                totalErrorsEncountered: status.totalErrorsEncountered,
                            },
                            last_cycle: status.lastCycleResult ? {
                                cycleId: status.lastCycleResult.cycleId,
                                metersProcessed: status.lastCycleResult.metersProcessed,
                                readingsCollected: status.lastCycleResult.readingsCollected,
                                errorCount: status.lastCycleResult.errors.length,
                            } : null,
                            offline_meters: status.offlineMeters.length,
                        }, null, 2),
                    },
                ],
            };
        }
    }
    /**
     * Tool Handler: trigger_meter_reading
     */
    async handleTriggerMeterReading() {
        if (!this.bacnetMeterReadingAgent) {
            throw new Error('BACnet Meter Reading Agent not initialized');
        }
        if (!this.bacnetMeterReadingAgent.getStatus().isRunning) {
            throw new Error('BACnet Meter Reading Agent is not running');
        }
        try {
            const result = await this.bacnetMeterReadingAgent.triggerCollection();
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            message: 'Meter reading collection cycle triggered successfully',
                            cycle_result: {
                                cycleId: result.cycleId,
                                startTime: result.startTime,
                                endTime: result.endTime,
                                metersProcessed: result.metersProcessed,
                                readingsCollected: result.readingsCollected,
                                errorCount: result.errors.length,
                                errors: result.errors,
                            },
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to trigger meter reading collection: ${errorMsg}`);
        }
    }
    /**
     * Tool Handler: get_meter_reading_status
     */
    async handleGetMeterReadingStatus() {
        if (!this.bacnetMeterReadingAgent) {
            throw new Error('BACnet Meter Reading Agent not initialized');
        }
        const status = this.bacnetMeterReadingAgent.getStatus();
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        agent_status: {
                            isRunning: status.isRunning,
                            totalCyclesExecuted: status.totalCyclesExecuted,
                            totalReadingsCollected: status.totalReadingsCollected,
                            totalErrorsEncountered: status.totalErrorsEncountered,
                        },
                        last_cycle_result: status.lastCycleResult ? {
                            cycleId: status.lastCycleResult.cycleId,
                            startTime: status.lastCycleResult.startTime,
                            endTime: status.lastCycleResult.endTime,
                            metersProcessed: status.lastCycleResult.metersProcessed,
                            readingsCollected: status.lastCycleResult.readingsCollected,
                            errorCount: status.lastCycleResult.errors.length,
                            success: status.lastCycleResult.success,
                        } : null,
                        active_errors: status.activeErrors.map(err => ({
                            meterId: err.meterId,
                            dataPoint: err.dataPoint,
                            operation: err.operation,
                            error: err.error,
                            timestamp: err.timestamp,
                        })),
                    }, null, 2),
                },
            ],
        };
    }
    /**
     * Start the MCP server
     */
    async start() {
        console.log('\n🚀 [MCP] Starting Sync MCP Server...');
        // Initialize services immediately
        console.log('🔧 [MCP] Initializing services before connecting transport...');
        await this.initializeServices();
        const transport = new StdioServerTransport();
        console.log('🔌 [MCP] Connecting to stdio transport...');
        await this.server.connect(transport);
        console.log('✅ [MCP] Sync MCP Server started');
        console.log('📋 [MCP] Available tools: get_upload_status, trigger_upload, query_meter_reading, get_meter_status, trigger_meter_reading, get_meter_reading_status');
    }
    /**
     * Shutdown the server
     */
    async shutdown() {
        logger.info('Shutting down Sync MCP Server...');
        if (this.syncManager) {
            await this.syncManager.stop();
        }
        if (this.meterReadingCleanupAgent) {
            await this.meterReadingCleanupAgent.stop();
        }
        if (this.bacnetMeterReadingAgent) {
            await this.bacnetMeterReadingAgent.stop();
        }
        if (this.remoteToLocalSyncAgent) {
            await this.remoteToLocalSyncAgent.stop();
        }
        if (this.apiServer) {
            await this.apiServer.stop();
        }
        if (this.remotePool) {
            await this.closeRemotePool(this.remotePool);
        }
        logger.info('Sync MCP Server shutdown complete');
    }
}
// Main execution
const server = new SyncMcpServer();
// Handle graceful shutdown
process.on('SIGINT', async () => {
    await server.shutdown();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await server.shutdown();
    process.exit(0);
});
// Start server
server.start().catch((error) => {
    logger.error('Failed to start Sync MCP Server:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map