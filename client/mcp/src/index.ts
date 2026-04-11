#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';

// Resolve .env relative to this file so it works regardless of process.cwd()
const __dirname_local = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname_local, '../.env') });

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import http from 'http';
import { db } from './database/client.js';
import { logger } from './utils/logger.js';
import { queryMeters } from './tools/query-meters.js';
import { queryReadings } from './tools/query-readings.js';
import { getTenantStatus } from './tools/get-site-status.js';
import { generateReport } from './tools/generate-report.js';
import { checkMeterHealth } from './tools/check-meter-health.js';
import { createNotification } from './tools/create-notification.js';
import { getNotifications } from './tools/get-notifications.js';
import { deleteNotification } from './tools/delete-notification.js';
import { SchedulerService } from './services/scheduler-service.js';

const server = new Server(
  {
    name: 'meteritpro-client-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'query_meters',
        description: 'Query meter information. Returns meters with their tenant information and last reading timestamp.',
        inputSchema: {
          type: 'object',
          properties: {
            tenant_id: {
              type: 'number',
              description: 'Optional: Filter by specific tenant ID',
            },
            meter_id: {
              type: 'number',
              description: 'Optional: Filter by meter ID',
            },
            is_active: {
              type: 'boolean',
              description: 'Optional: Filter by active status',
            },
          },
        },
      },
      {
        name: 'query_readings',
        description: 'Query meter readings with filters. Returns readings with meter and tenant information.',
        inputSchema: {
          type: 'object',
          properties: {
            tenant_id: {
              type: 'number',
              description: 'Optional: Filter by tenant ID',
            },
            meter_id: {
              type: 'number',
              description: 'Optional: Filter by meter ID',
            },
            data_point: {
              type: 'string',
              description: 'Optional: Filter by data point type (e.g., total_kwh, current_kw)',
            },
            start_date: {
              type: 'string',
              description: 'Optional: Start date for readings (ISO 8601 format)',
            },
            end_date: {
              type: 'string',
              description: 'Optional: End date for readings (ISO 8601 format)',
            },
            limit: {
              type: 'number',
              description: 'Optional: Maximum number of readings to return (default: 1000)',
            },
          },
        },
      },
      {
        name: 'get_tenant_status',
        description: 'Get status of tenants. Returns tenant information including active status and meter count.',
        inputSchema: {
          type: 'object',
          properties: {
            tenant_id: {
              type: 'number',
              description: 'Optional: Get status for specific tenant ID',
            },
            include_inactive: {
              type: 'boolean',
              description: 'Optional: Include inactive tenants (default: false)',
            },
          },
        },
      },
      {
        name: 'generate_report',
        description: 'Generate multi-tenant reports with aggregated data. Returns summary statistics and detailed readings.',
        inputSchema: {
          type: 'object',
          properties: {
            report_type: {
              type: 'string',
              enum: ['summary', 'detailed', 'comparison'],
              description: 'Type of report to generate',
            },
            tenant_ids: {
              type: 'array',
              items: { type: 'number' },
              description: 'Optional: Array of tenant IDs to include (default: all tenants)',
            },
            start_date: {
              type: 'string',
              description: 'Start date for report (ISO 8601 format)',
            },
            end_date: {
              type: 'string',
              description: 'End date for report (ISO 8601 format)',
            },
            data_point: {
              type: 'string',
              description: 'Optional: Specific data point to report on (e.g., total_kwh)',
            },
          },
          required: ['report_type', 'start_date', 'end_date'],
        },
      },
      {
        name: 'check_meter_health',
        description: 'Check health status of all meters and elements. Identifies failing readings (error status) and stale readings (no update in past 1 hour).',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'create_notification',
        description: 'Create a new notification for a tenant. Prevents duplicate notifications of the same type.',
        inputSchema: {
          type: 'object',
          properties: {
            tenant_id: {
              type: 'number',
              description: 'The tenant ID',
            },
            notification_type: {
              type: 'string',
              description: 'Type of notification (e.g., meter_health, alert, system)',
            },
            description: {
              type: 'string',
              description: 'Optional: Detailed description of the notification',
            },
          },
          required: ['tenant_id', 'notification_type'],
        },
      },
      {
        name: 'get_notifications',
        description: 'Get notifications for a tenant with optional filtering by type.',
        inputSchema: {
          type: 'object',
          properties: {
            tenant_id: {
              type: 'number',
              description: 'The tenant ID',
            },
            notification_type: {
              type: 'string',
              description: 'Optional: Filter by notification type',
            },
            limit: {
              type: 'number',
              description: 'Optional: Maximum number of notifications to return (default: 100)',
            },
            offset: {
              type: 'number',
              description: 'Optional: Number of notifications to skip (default: 0)',
            },
          },
          required: ['tenant_id'],
        },
      },
      {
        name: 'delete_notification',
        description: 'Delete a specific notification by ID.',
        inputSchema: {
          type: 'object',
          properties: {
            notification_id: {
              type: 'number',
              description: 'The notification ID to delete',
            },
          },
          required: ['notification_id'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'query_meters':
        return await queryMeters(args || {});
      
      case 'query_readings':
        return await queryReadings(args || {});
      
      case 'get_tenant_status':
        return await getTenantStatus(args || {});
      
      case 'generate_report':
        if (!args || !args.report_type || !args.start_date || !args.end_date) {
          throw new Error('generate_report requires report_type, start_date, and end_date');
        }
        return await generateReport(args as any);
      
      case 'check_meter_health':
        return await checkMeterHealth(args || {});
      
      case 'create_notification':
        if (!args || !args.tenant_id || !args.notification_type) {
          throw new Error('create_notification requires tenant_id and notification_type');
        }
        return await createNotification(args as any);
      
      case 'get_notifications':
        if (!args || !args.tenant_id) {
          throw new Error('get_notifications requires tenant_id');
        }
        return await getNotifications(args as any);
      
      case 'delete_notification':
        if (!args || !args.notification_id) {
          throw new Error('delete_notification requires notification_id');
        }
        return await deleteNotification(args as any);
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    logger.error('Tool execution error', { 
      tool: name, 
      error: error instanceof Error ? error.message : String(error) 
    });
    return {
      content: [
        {
          type: 'text',
          text: `Error executing tool: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
});

/**
 * Lightweight debug HTTP server — only started when NODE_ENV !== 'production'.
 * Exposes POST /debug/run-notification-rules to manually trigger the agent.
 */
function startDebugServer(scheduler: SchedulerService): void {
  const port = parseInt(process.env.MCP_DEBUG_PORT || '3005', 10);

  const server = http.createServer((req, res) => {
    // CORS headers so the local frontend can call this
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'POST' && req.url === '/debug/run-notification-rules') {
      logger.info('[debug] Manually triggering all notification rules via debug endpoint');
      scheduler
        .runAllNotificationRules()
        .then(result => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, ...result }));
        })
        .catch(err => {
          logger.error('[debug] Error running notification rules', { error: err.message });
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        });
      return;
    }

    // POST /debug/run-all-reports — run all active reports immediately
    if (req.method === 'POST' && req.url === '/debug/run-all-reports') {
      logger.info('[debug] Manually triggering all reports via debug endpoint');
      scheduler
        .runAllReports()
        .then(result => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, ...result }));
        })
        .catch(err => {
          logger.error('[debug] Error running reports', { error: err.message });
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        });
      return;
    }

    // GET /debug/preview-report/:id — generate HTML preview without sending emails
    const previewMatch = req.url?.match(/^\/debug\/preview-report\/(\d+)$/);
    if (req.method === 'GET' && previewMatch) {
      const reportId = previewMatch[1];
      logger.info(`[debug] Generating preview for report ${reportId}`);
      scheduler
        .previewReport(reportId)
        .then(result => {
          if (!result.found) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>Report not found or inactive</h1>');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(result.html);
          }
        })
        .catch(err => {
          logger.error(`[debug] Error previewing report ${reportId}`, { error: err.message });
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end(`<h1>Error generating preview</h1><pre>${err.message}</pre>`);
        });
      return;
    }

    // POST /debug/run-report/:id — run a single report by ID
    const reportMatch = req.url?.match(/^\/debug\/run-report\/(\d+)$/);
    if (req.method === 'POST' && reportMatch) {
      const reportId = reportMatch[1];
      logger.info(`[debug] Manually triggering report ${reportId}`);
      scheduler
        .runReport(reportId)
        .then(result => {
          if (!result.found) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: `Report ${reportId} not found or inactive` }));
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, report_id: reportId }));
          }
        })
        .catch(err => {
          logger.error(`[debug] Error running report ${reportId}`, { error: err.message });
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        });
      return;
    }

    // POST /debug/reload-reports — reconcile report jobs with DB
    if (req.method === 'POST' && req.url === '/debug/reload-reports') {
      logger.info('[debug] Reloading report jobs from database');
      scheduler
        .reconcileReports()
        .then(result => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, ...result }));
        })
        .catch(err => {
          logger.error('[debug] Error reloading reports', { error: err.message });
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        });
      return;
    }

    // POST /debug/reload-notification-rules — reconcile rule jobs with DB
    if (req.method === 'POST' && req.url === '/debug/reload-notification-rules') {
      logger.info('[debug] Reloading notification rule jobs from database');
      scheduler
        .reconcileNotificationRules()
        .then(result => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, ...result }));
        })
        .catch(err => {
          logger.error('[debug] Error reloading notification rules', { error: err.message });
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        });
      return;
    }

    // POST /debug/run-notification-rule/:id — run a single rule by ID
    const singleMatch = req.url?.match(/^\/debug\/run-notification-rule\/(\d+)$/);
    if (req.method === 'POST' && singleMatch) {
      const ruleId = singleMatch[1];
      logger.info(`[debug] Manually triggering notification rule ${ruleId}`);
      scheduler
        .runNotificationRule(ruleId)
        .then(result => {
          if (!result.found) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: `Rule ${ruleId} not found or inactive` }));
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, rule_id: ruleId }));
          }
        })
        .catch(err => {
          logger.error(`[debug] Error running rule ${ruleId}`, { error: err.message });
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  server.listen(port, () => {
    logger.info(`[debug] MCP debug server listening on http://localhost:${port}`);
  });
}

// Start server
async function main() {
  logger.info('Starting Client MCP Server...');
  
  // Test database connection
  const connected = await db.testConnection();
  if (!connected) {
    logger.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  // Initialize scheduler service
  const scheduler = new SchedulerService();
  try {
    await scheduler.initialize();
    logger.info('Scheduler service initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize scheduler service', {
      error: error instanceof Error ? error.message : String(error),
    });
    // Continue even if scheduler fails to initialize
  }

  // Start debug HTTP server for manual rule triggering
  startDebugServer(scheduler);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  logger.info('Client MCP Server started successfully');

  // Store scheduler reference for shutdown
  (global as any).scheduler = scheduler;
}

// Handle shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down Client MCP Server...');
  const scheduler = (global as any).scheduler;
  if (scheduler) {
    try {
      await scheduler.shutdown();
    } catch (error) {
      logger.error('Error shutting down scheduler', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  await db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down Client MCP Server...');
  const scheduler = (global as any).scheduler;
  if (scheduler) {
    try {
      await scheduler.shutdown();
    } catch (error) {
      logger.error('Error shutting down scheduler', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  await db.close();
  process.exit(0);
});

main().catch((error) => {
  logger.error('Fatal error', { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});
