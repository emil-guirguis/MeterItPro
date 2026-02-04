// This file is deprecated - Modbus protocol has been removed
// All endpoints return 410 Gone status
const express = require('express');

const router = express.Router();

router.post('/direct-meter-read', (req, res) => {
  res.status(410).json({
    success: false,
    error: 'Direct meter read endpoint has been disabled (Modbus protocol removed)',
    timestamp: new Date().toISOString()
  });
});

router.get('/modbus-pool-stats', (req, res) => {
  res.status(410).json({
    success: false,
    error: 'Modbus pool stats endpoint has been disabled (Modbus protocol removed)',
    timestamp: new Date().toISOString()
  });
});

router.post('/test-modbus-connection', (req, res) => {
  res.status(410).json({
    success: false,
    error: 'Modbus connection test endpoint has been disabled (Modbus protocol removed)',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;