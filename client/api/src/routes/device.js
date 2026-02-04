// @ts-nocheck
const express = require('express');
const Device = require('../models/DeviceWithSchema.js');
const { requirePermission } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
// Note: authenticateToken is now applied globally in server.js

// Get all devices with filtering and pagination
router.get('/', requirePermission('device:read'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      search
    } = req.query;

    // Build where clause for Device using framework filter processing
    let where = {};
    if (search) where.description = search; // Assuming search by description
    
    // Use framework method to process filters from query parameters
    const filters = Device.processFilters(req.query);
    where = { ...where, ...filters };

    // Build options for findAll
    const options = {
      where,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    };

    // Get devices
    const result = await Device.findAll(options);

    res.json({
      success: true,
      data: {
        items: result.rows,
        total: result.pagination.total,
        page: parseInt(page),
        pageSize: parseInt(limit),
        totalPages: result.pagination.totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch devices' });
  }
});

// Get single device by ID
router.get('/:id', requirePermission('device:read'), async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }
    res.json({ success: true, data: device });
  } catch (error) {
    console.error('Error fetching device:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch device' });
  }
});

// NOTE: Device module is READ-ONLY
// CREATE, UPDATE, DELETE operations have been removed
// Devices are managed externally and should not be modified through this API

module.exports = router;
