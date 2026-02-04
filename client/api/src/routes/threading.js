const express = require('express');
const router = express.Router();

// Import threading components (will be initialized in server.js)
let threadingService = null;

/**
 * Initialize threading service reference
 * This will be called from server.js after the threading service is created
 */
function initializeThreadingService(service) {
  threadingService = service;
}

/**
 * Middleware to ensure threading service is available
 */
function ensureThreadingService(req, res, next) {
  if (!threadingService) {
    return res.status(503).json({
      success: false,
      message: 'Threading service not available',
      error: 'Service not initialized'
    });
  }
  next();
}

/**
 * GET /api/threading/status
 * Get current status of the MCP worker thread
 */
router.get('/status', ensureThreadingService, async (req, res) => {
  try {
    const status = await threadingService.getStatus();
    
    res.json({
      success: true,
      data: {
        worker: status.worker,
        health: status.health,
        restart: status.restart,
        messages: status.messages,
        errors: status.errors,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting threading status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get threading status',
      error: error.message
    });
  }
});

/**
 * POST /api/threading/start
 * Start the MCP worker thread
 */
router.post('/start', ensureThreadingService, async (req, res) => {
  try {
    const { config } = req.body;
    
    const result = await threadingService.startWorker(config);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'MCP worker thread started successfully',
        data: {
          threadId: result.threadId,
          startTime: result.startTime
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to start MCP worker thread',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error starting worker thread:', error);
    res.status(500).json({
      success: false,
      message: 'Internal error starting worker thread',
      error: error.message
    });
  }
});

/**
 * POST /api/threading/stop
 * Stop the MCP worker thread
 */
router.post('/stop', ensureThreadingService, async (req, res) => {
  try {
    const { graceful = true } = req.body;
    
    const result = await threadingService.stopWorker(graceful);
    
    res.json({
      success: true,
      message: 'MCP worker thread stopped successfully',
      data: {
        graceful,
        stopTime: result.stopTime
      }
    });
  } catch (error) {
    console.error('Error stopping worker thread:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop worker thread',
      error: error.message
    });
  }
});

/**
 * POST /api/threading/restart
 * Restart the MCP worker thread
 */
router.post('/restart', ensureThreadingService, async (req, res) => {
  try {
    const { reason = 'Manual restart', config } = req.body;
    
    const result = await threadingService.restartWorker(reason, config);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'MCP worker thread restarted successfully',
        data: {
          reason,
          threadId: result.threadId,
          restartTime: result.restartTime,
          restartCount: result.restartCount
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to restart MCP worker thread',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error restarting worker thread:', error);
    res.status(500).json({
      success: false,
      message: 'Internal error restarting worker thread',
      error: error.message
    });
  }
});

/**
 * GET /api/threading/health
 * Get detailed health information about the threading system
 */
router.get('/health', ensureThreadingService, async (req, res) => {
  try {
    const healthStatus = await threadingService.getHealthStatus();
    
    res.json({
      success: true,
      data: {
        overall: healthStatus.isHealthy ? 'healthy' : 'unhealthy',
        worker: healthStatus.worker,
        health: healthStatus.health,
        memory: healthStatus.memory,
        uptime: healthStatus.uptime,
        lastCheck: healthStatus.lastCheck,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting health status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get health status',
      error: error.message
    });
  }
});

/**
 * GET /api/threading/stats
 * Get comprehensive statistics about the threading system
 */
router.get('/stats', ensureThreadingService, async (req, res) => {
  try {
    const stats = await threadingService.getStats();
    
    res.json({
      success: true,
      data: {
        messages: stats.messages,
        queue: stats.queue,
        errors: stats.errors,
        performance: stats.performance,
        uptime: stats.uptime,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting threading stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get threading statistics',
      error: error.message
    });
  }
});

/**
 * GET /api/threading/config
 * Get current threading system configuration
 */
router.get('/config', ensureThreadingService, async (req, res) => {
  try {
    const config = await threadingService.getConfig();
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error getting threading config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get threading configuration',
      error: error.message
    });
  }
});

/**
 * PUT /api/threading/config
 * Update threading system configuration
 */
router.put('/config', ensureThreadingService, async (req, res) => {
  try {
    const { config, section } = req.body;
    
    if (!config) {
      return res.status(400).json({
        success: false,
        message: 'Configuration data is required'
      });
    }
    
    const result = await threadingService.updateConfig(config, section);
    
    if (result.isValid) {
      res.json({
        success: true,
        message: 'Configuration updated successfully',
        data: {
          updatedConfig: result.config,
          warnings: result.warnings
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Configuration validation failed',
        errors: result.errors,
        warnings: result.warnings
      });
    }
  } catch (error) {
    console.error('Error updating threading config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update threading configuration',
      error: error.message
    });
  }
});

/**
 * POST /api/threading/message
 * Send a message to the worker thread
 */
router.post('/message', ensureThreadingService, async (req, res) => {
  try {
    const { type, payload, priority = 'normal', timeout } = req.body;
    
    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Message type is required'
      });
    }
    
    const result = await threadingService.sendMessage({
      type,
      payload,
      priority,
      timeout
    });
    
    res.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        requestId: result.requestId,
        response: result.response,
        processingTime: result.processingTime
      }
    });
  } catch (error) {
    console.error('Error sending message to worker:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message to worker thread',
      error: error.message
    });
  }
});

/**
 * GET /api/threading/messages/pending
 * Get information about pending messages
 */
router.get('/messages/pending', ensureThreadingService, async (req, res) => {
  try {
    const pendingMessages = await threadingService.getPendingMessages();
    
    res.json({
      success: true,
      data: {
        count: pendingMessages.count,
        messages: pendingMessages.messages,
        oldestAge: pendingMessages.oldestAge,
        averageAge: pendingMessages.averageAge
      }
    });
  } catch (error) {
    console.error('Error getting pending messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending messages',
      error: error.message
    });
  }
});

/**
 * DELETE /api/threading/messages/pending
 * Clear all pending messages
 */
router.delete('/messages/pending', ensureThreadingService, async (req, res) => {
  try {
    const { reason = 'Manual cleanup' } = req.body;
    
    const result = await threadingService.clearPendingMessages(reason);
    
    res.json({
      success: true,
      message: 'Pending messages cleared successfully',
      data: {
        clearedCount: result.clearedCount,
        reason
      }
    });
  } catch (error) {
    console.error('Error clearing pending messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear pending messages',
      error: error.message
    });
  }
});

/**
 * GET /api/threading/errors
 * Get error history and statistics
 */
router.get('/errors', ensureThreadingService, async (req, res) => {
  try {
    const { limit = 50, severity, type } = req.query;
    
    const errors = await threadingService.getErrors({
      limit: parseInt(limit),
      severity,
      type
    });
    
    res.json({
      success: true,
      data: {
        errors: errors.history,
        stats: errors.stats,
        filters: { limit, severity, type }
      }
    });
  } catch (error) {
    console.error('Error getting threading errors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get threading errors',
      error: error.message
    });
  }
});

/**
 * DELETE /api/threading/errors
 * Clear error history
 */
router.delete('/errors', ensureThreadingService, async (req, res) => {
  try {
    const result = await threadingService.clearErrors();
    
    res.json({
      success: true,
      message: 'Error history cleared successfully',
      data: {
        clearedCount: result.clearedCount
      }
    });
  } catch (error) {
    console.error('Error clearing threading errors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear error history',
      error: error.message
    });
  }
});

/**
 * POST /api/threading/health-check
 * Trigger immediate health check
 */
router.post('/health-check', ensureThreadingService, async (req, res) => {
  try {
    const result = await threadingService.performHealthCheck();
    
    res.json({
      success: true,
      message: 'Health check completed',
      data: {
        isHealthy: result.isHealthy,
        responseTime: result.responseTime,
        timestamp: result.timestamp,
        details: result.details
      }
    });
  } catch (error) {
    console.error('Error performing health check:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform health check',
      error: error.message
    });
  }
});

/**
 * GET /api/threading/logs
 * Get recent log entries from the threading system
 */
router.get('/logs', ensureThreadingService, async (req, res) => {
  try {
    const { limit = 100, level, since } = req.query;
    
    const logs = await threadingService.getLogs({
      limit: parseInt(limit),
      level,
      since: since ? new Date(since) : undefined
    });
    
    res.json({
      success: true,
      data: {
        logs: logs.entries,
        count: logs.count,
        filters: { limit, level, since }
      }
    });
  } catch (error) {
    console.error('Error getting threading logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get threading logs',
      error: error.message
    });
  }
});

module.exports = {
  router,
  initializeThreadingService
};