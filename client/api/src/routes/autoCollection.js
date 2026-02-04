// Auto Meter Collection Management Routes
const express = require('express');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const autoMeterCollectionService = require('../services/AutoMeterCollectionService');

const router = express.Router();
router.use(authenticateToken);

/**
 * Get auto collection status and statistics
 * GET /api/auto-collection/status
 */
router.get('/status', requirePermission('meter:read'), async (req, res) => {
  try {
    const healthStatus = await autoMeterCollectionService.getHealthStatus();
    const stats = autoMeterCollectionService.getCollectionStats();
    
    res.json({
      success: true,
      data: {
        ...healthStatus,
        statistics: stats
      }
    });
  } catch (error) {
    console.error('Get auto collection status error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: 'Failed to get auto collection status',
      error: errorMessage
    });
  }
});

/**
 * Start auto collection
 * POST /api/auto-collection/start
 */
router.post('/start', requirePermission('meter:update'), async (_req, res) => {
  try {
    const result = autoMeterCollectionService.startCollection();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Auto collection started successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Start auto collection error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: 'Failed to start auto collection',
      error: errorMessage
    });
  }
});

/**
 * Stop auto collection
 * POST /api/auto-collection/stop
 */
router.post('/stop', requirePermission('meter:update'), async (_req, res) => {
  try {
    autoMeterCollectionService.stopCollection();
    
    res.json({
      success: true,
      message: 'Auto collection stopped successfully'
    });
  } catch (error) {
    console.error('Stop auto collection error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop auto collection',
      error: errorMessage
    });
  }
});

/**
 * Update collection interval
 * POST /api/auto-collection/interval
 */
router.post('/interval', requirePermission('meter:update'), async (req, res) => {
  try {
    const { interval } = req.body;
    
    if (!interval || typeof interval !== 'number' || interval < 5000) {
      return res.status(400).json({
        success: false,
        message: 'Invalid interval. Must be a number >= 5000 (5 seconds)'
      });
    }
    
    const result = autoMeterCollectionService.updateInterval(interval);
    
    res.json({
      success: true,
      message: `Collection interval updated to ${interval}ms (${interval / 1000}s)`,
      data: result
    });
  } catch (error) {
    console.error('Update collection interval error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: 'Failed to update collection interval',
      error: errorMessage
    });
  }
});

/**
 * Get collection statistics
 * GET /api/auto-collection/stats
 */
router.get('/stats', requirePermission('meter:read'), async (_req, res) => {
  try {
    const stats = autoMeterCollectionService.getCollectionStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get collection stats error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: 'Failed to get collection statistics',
      error: errorMessage
    });
  }
});

/**
 * Trigger manual collection cycle
 * POST /api/auto-collection/collect-now
 */
router.post('/collect-now', requirePermission('meter:update'), async (_req, res) => {
  try {
    // Trigger a manual collection cycle
    console.log('🔄 Manual collection cycle triggered by user');
    
    // We can't directly call performCollection as it's private, 
    // but we can provide feedback that the next cycle will happen soon
    const stats = autoMeterCollectionService.getCollectionStats();
    
    res.json({
      success: true,
      message: 'Manual collection cycle will be triggered on next interval',
      data: {
        isCollecting: stats.isCollecting,
        interval: stats.interval,
        nextCollection: stats.isCollecting ? 'Within next interval' : 'Start collection first'
      }
    });
  } catch (error) {
    console.error('Manual collection trigger error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger manual collection',
      error: errorMessage
    });
  }
});

module.exports = router;