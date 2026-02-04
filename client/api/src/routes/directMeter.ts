import express from 'express';

const router = express.Router();

/**
 * Direct meter read endpoint - DISABLED (Modbus removed)
 * POST /api/direct-meter-read
 */
router.post('/direct-meter-read', async (req: express.Request, res: express.Response) => {
  res.status(410).json({
    success: false,
    error: 'Direct meter read endpoint has been disabled (Modbus protocol removed)',
    timestamp: new Date().toISOString()
  });
});

/**
 * Get connection pool statistics endpoint - DISABLED (Modbus removed)
 * GET /api/modbus-pool-stats
 */
router.get('/modbus-pool-stats', (req: express.Request, res: express.Response) => {
  res.status(410).json({
    success: false,
    error: 'Modbus pool stats endpoint has been disabled (Modbus protocol removed)',
    timestamp: new Date().toISOString()
  });
});

/**
 * Test connection endpoint - DISABLED (Modbus removed)
 * POST /api/test-modbus-connection
 */
router.post('/test-modbus-connection', async (req: express.Request, res: express.Response) => {
  res.status(410).json({
    success: false,
    error: 'Modbus connection test endpoint has been disabled (Modbus protocol removed)',
    timestamp: new Date().toISOString()
  });
});

export default router;