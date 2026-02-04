// @ts-nocheck
const express = require('express');
const Location = require('../models/LocationWithSchema');
const Meter = require('../models/MeterWithSchema');
const { requirePermission } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
// Note: authenticateToken is now applied globally in server.js

// Get all locations with filtering and pagination
router.get('/', requirePermission('location:read'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      search
    } = req.query;

    // Build where clause for Location using framework filter processing
    let where = {};
    if (search) where.name = search; // Assuming search by name
    
    // Use framework method to process filters from query parameters
    const filters = Location.processFilters(req.query);
    where = { ...where, ...filters };

    // Build options for findAll
    const options = {
      where,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      tenantId: req.user?.tenantId // Automatic tenant filtering
    };

    // Get locations
    const result = await Location.findAll(options);

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
    console.error('Error fetching locations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch locations' });
  }
});

// Get single location by ID
router.get('/:id', requirePermission('location:read'), async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }
    res.json({ success: true, data: location });
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch location' });
  }
});

// Create location
router.post('/', requirePermission('location:create'), async (req, res) => {
  try {
    // CRITICAL: Always set tenant_id from authenticated user
    // This is required for the foreign key constraint on tenant_id
    const tenantId = req.user?.tenant_id || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'User must have a valid tenant_id to create locations'
      });
    }
    
    const locationData = {
      ...req.body,
      tenant_id: tenantId
    };
    
    const location = new Location(locationData);
    await location.save();
    res.status(201).json({ success: true, data: location });
  } catch (error) {
    console.error('Error creating location:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create location',
      error: error.message,
      detail: error.detail,
      code: error.code
    });
  }
});

// Update location
router.put('/:id', requirePermission('location:update'), asyncHandler(async (req, res) => {
  // Find the location first
  const location = await Location.findById(req.params.id);
  if (!location) {
    return res.status(404).json({ success: false, message: 'Location not found' });
  }
  
  // CRITICAL: Protect tenant_id from being changed
  // Validate that the location belongs to the authenticated user's tenant
  const userTenantId = req.user?.tenant_id || req.user?.tenantId;
  if (location.tenant_id !== userTenantId) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to update this location'
    });
  }
  
  // Remove tenant_id from update data - it cannot be changed
  const updateData = { ...req.body };
  delete updateData.tenant_id;
  delete updateData.tenantId;
  
  // Update the location using instance method
  await location.update(updateData);
  
  res.json({ success: true, data: location });
}));

// Delete location
router.delete('/:id', requirePermission('location:delete'), async (req, res) => {
  try {
    // Find the location first
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    // Check if location has associated meters
    const metersResult = await Meter.findAll({ 
      where: { location_id: req.params.id },
      tenantId: req.user?.tenantId
    });
    const meterCount = metersResult?.rows?.length || 0;

    if (meterCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete location. It has ${meterCount} meters associated with it.`
      });
    }
    
    // Delete the location using instance method
    await location.delete();
    
    res.json({ success: true, message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ success: false, message: 'Failed to delete location' });
  }
});

module.exports = router;