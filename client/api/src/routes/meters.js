// @ts-nocheck
const express = require('express');
const Meter = require('../models/MeterWithSchema');
const Device = require('../models/DeviceWithSchema');
const { requirePermission } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const db = require('../config/database');

const router = express.Router();
// Note: authenticateToken is now applied globally in server.js

/**
 * GET /api/meters/elements
 * Get available meters for selection in combined meters selector, favorites, and meter readings sidebar
 * 
 * Query Parameters:
 * - type: 'physical' or 'virtual' (optional) - filter by meter type
 * - excludeIds: comma-separated meter IDs to exclude (optional)
 * - searchQuery: search by name or identifier (optional)
 * 
 * Response: { data: [{ id, name, identifier }, ...] }
 */
router.get('/elements', requirePermission('meter:read'), asyncHandler(async (req, res) => {
  const { type, excludeIds, searchQuery } = req.query;
  const tenantId = req.user?.tenant_id || req.user?.tenantId;

  if (!tenantId) {
    return res.status(401).json({
      success: false,
      message: 'Tenant context required',
    });
  }

  try {
    // Build the base query
    let query = 'SELECT m.meter_id as id, m.name, m.identifier FROM public.meter m WHERE m.tenant_id = $1';
    
    const params = [tenantId];
    let paramCount = 2;

    // Filter by type if provided
    if (type) {
      query += ' AND m.meter_type = $' + paramCount;
      params.push(type);
      paramCount++;
    }

    // Filter by search query if provided (search in name or identifier)
    if (searchQuery) {
      query += ' AND (LOWER(m.name) LIKE LOWER($' + paramCount + ') OR LOWER(m.identifier) LIKE LOWER($' + (paramCount + 1) + '))';
      params.push('%' + searchQuery + '%');
      params.push('%' + searchQuery + '%');
      paramCount += 2;
    }

    // Exclude specific meter IDs if provided
    if (excludeIds) {
      const excludeIdArray = excludeIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
      if (excludeIdArray.length > 0) {
        const placeholders = excludeIdArray.map((_, i) => '$' + (paramCount + i)).join(',');
        query += ' AND m.meter_id NOT IN (' + placeholders + ')';
        params.push(...excludeIdArray);
        paramCount += excludeIdArray.length;
      }
    }

    // Order by name
    query += ' ORDER BY m.name ASC';

    const result = await db.query(query, params);

    // Validate response data - ensure all required fields are present
    const validatedData = result.rows.filter(row => {
      if (!row.id || !row.name || !row.identifier) {
        console.warn('Skipping meter with missing required fields:', row);
        return false;
      }
      return true;
    });

    res.json({
      success: true,
      data: validatedData,
    });
  } catch (error) {
    console.error('Error fetching meter elements:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meter elements',
      error: errorMessage,
    });
  }
}));

// IMPORTANT: Virtual config routes must come BEFORE generic :id routes
// Use explicit path matching to ensure virtual-config routes are matched first

/**
 * GET /api/meters/:meterId/virtual-config
 * Get previously selected meters for a virtual meter
 * 
 * Returns the list of physical meters that have been selected to be combined
 * into the specified virtual meter.
 * 
 * Response: { meterId, selectedMeters: [{ id, name, identifier }, ...] }
 * 
 * Requirements: 11.3, 4.2
 */
router.get('/:meterId/virtual-config', requirePermission('meter:read'), asyncHandler(async (req, res) => {
  const { meterId } = req.params;
  const tenantId = req.user?.tenant_id || req.user?.tenantId;

  if (!tenantId) {
    return res.status(401).json({
      success: false,
      message: 'Tenant context required',
    });
  }

  if (!meterId) {
    return res.status(400).json({
      success: false,
      message: 'Meter ID is required',
    });
  }

  try {
    // First, verify that the meter exists and belongs to the tenant
    const meterCheckQuery = 'SELECT meter_id FROM public.meter WHERE meter_id = $1 AND tenant_id = $2';
    const meterCheckResult = await db.query(meterCheckQuery, [meterId, tenantId]);

    if (meterCheckResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Meter not found',
      });
    }

    // Query the meter_virtual table to find all selected meters for this virtual meter
    // Join with the meter table to get full meter details
    const query = `
      SELECT 
        m.meter_id as id,
        m.name,
        m.identifier
      FROM public.meter_virtual mv
      JOIN public.meter m ON mv.selected_meter_id = m.meter_id
      WHERE mv.meter_id = $1
      ORDER BY m.name ASC
    `;

    const result = await db.query(query, [meterId]);

    // Validate response data - ensure all required fields are present
    const selectedMeters = result.rows.filter(row => {
      if (!row.id || !row.name || !row.identifier) {
        console.warn('Skipping meter with missing required fields:', row);
        return false;
      }
      return true;
    });

    res.json({
      success: true,
      meterId,
      selectedMeters,
    });
  } catch (error) {
    console.error('Error fetching virtual meter config:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'Failed to fetch virtual meter configuration',
      error: errorMessage,
    });
  }
}));

/**
 * POST /api/meters/:meterId/virtual-config
 * Save selected meters for a virtual meter
 * 
 * Accepts selectedMeterIds and selectedMeterElementIds in request body.
 * Deletes existing records in meter_virtual table for this meter and inserts new ones.
 * 
 * Request body:
 * {
 *   "selectedMeterIds": [1, 2, 3],
 *   "selectedMeterElementIds": [101, 102, 103]
 * }
 * 
 * Response: { success: true, meterId, savedConfiguration: { selectedMeterIds, selectedMeterElementIds } }
 * 
 * Requirements: 11.2, 8.1
 */
router.post('/:meterId/virtual-config', requirePermission('meter:update'), asyncHandler(async (req, res) => {
  const { meterId } = req.params;
  const { selectedMeterIds = [], selectedMeterElementIds = [] } = req.body;
  const tenantId = req.user?.tenant_id || req.user?.tenantId;

  if (!tenantId) {
    return res.status(401).json({
      success: false,
      message: 'Tenant context required',
    });
  }

  if (!meterId) {
    return res.status(400).json({
      success: false,
      message: 'Meter ID is required',
    });
  }

  // Validate request body
  if (!Array.isArray(selectedMeterIds) || !Array.isArray(selectedMeterElementIds)) {
    return res.status(400).json({
      success: false,
      message: 'selectedMeterIds and selectedMeterElementIds must be arrays',
    });
  }

  // Validate that arrays have the same length
  if (selectedMeterIds.length !== selectedMeterElementIds.length) {
    return res.status(400).json({
      success: false,
      message: 'selectedMeterIds and selectedMeterElementIds must have the same length',
    });
  }

  try {
    // First, verify that the meter exists and belongs to the tenant
    const meterCheckQuery = 'SELECT meter_id FROM public.meter WHERE meter_id = $1 AND tenant_id = $2';
    const meterCheckResult = await db.query(meterCheckQuery, [meterId, tenantId]);

    if (meterCheckResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Meter not found',
      });
    }

    // Start a transaction to ensure atomicity
    await db.query('BEGIN');

    try {
      // Delete existing records for this meter
      const deleteQuery = 'DELETE FROM public.meter_virtual WHERE meter_id = $1';
      await db.query(deleteQuery, [meterId]);

      // Insert new records for each selected meter
      if (selectedMeterIds.length > 0) {
        const insertQuery = `
          INSERT INTO public.meter_virtual (meter_id, selected_meter_id, select_meter_element_id)
          VALUES ${selectedMeterIds.map((_, i) => `($1, $${i * 2 + 2}, $${i * 2 + 3})`).join(', ')}
        `;

        const insertParams = [meterId];
        for (let i = 0; i < selectedMeterIds.length; i++) {
          insertParams.push(selectedMeterIds[i]);
          insertParams.push(selectedMeterElementIds[i]);
        }

        await db.query(insertQuery, insertParams);
      }

      // Commit the transaction
      await db.query('COMMIT');

      res.json({
        success: true,
        meterId,
        savedConfiguration: {
          selectedMeterIds,
          selectedMeterElementIds,
        },
      });
    } catch (error) {
      // Rollback the transaction on error
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error saving virtual meter config:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'Failed to save virtual meter configuration',
      error: errorMessage,
    });
  }
}));

// Get all meters with filtering and pagination
router.get('/', requirePermission('meter:read'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      search
    } = req.query;

    // Build where clause for Meter using framework filter processing
    let where = {};
    if (search) where.name = search; // Assuming search by name
    
    // Use framework method to process filters from query parameters
    const filters = Meter.processFilters(req.query);
    where = { ...where, ...filters };

    // Build options for findAll
    const options = {
      where,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      tenant_id: req.user?.tenant_id || req.user?.tenantId // Automatic tenant filtering
    };

    // Get meters
    const result = await Meter.findAll(options);

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
    console.error('Error fetching meters:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch meters' });
  }
});

// Create meter
router.post('/', requirePermission('meter:create'), async (req, res) => {
  try {
    console.log('[METER CREATE] Request body:', JSON.stringify(req.body, null, 2));
    
    // CRITICAL: Always set tenant_id from authenticated user
    // This is required for the foreign key constraint on tenant_id
    const tenantId = req.user?.tenant_id || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'User must have a valid tenant_id to create meters'
      });
    }
    
    const meterData = {
      ...req.body,
      tenant_id: tenantId
    };
    
    console.log('[METER CREATE] Before delete - meterData keys:', Object.keys(meterData));
    
    // Remove fields that don't exist in the database
    delete meterData.elements;
    
    console.log('[METER CREATE] After delete - meterData keys:', Object.keys(meterData));
    console.log('[METER CREATE] Final meterData:', JSON.stringify(meterData, null, 2));
    
    const meter = new Meter(meterData);
    await meter.save();
    res.status(201).json({ success: true, data: meter });
  } catch (error) {
    console.error('Error creating meter:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create meter',
      error: error.message,
      detail: error.detail,
      code: error.code
    });
  }
});

// Get single meter by ID
router.get('/:id', requirePermission('meter:read'), async (req, res) => {
  try {
    const meter = await Meter.findById(req.params.id);
    if (!meter) {
      return res.status(404).json({ success: false, message: 'Meter not found' });
    }
    res.json({ success: true, data: meter });
  } catch (error) {
    console.error('Error fetching meter:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch meter' });
  }
});

// Middleware to handle the :id parameter - check if it's followed by /virtual-config
router.param('id', (req, res, next, id) => {
  // If the remaining path starts with /virtual-config, skip this route
  const remainingPath = req.path.substring(req.path.indexOf(id) + id.length);
  if (remainingPath.startsWith('/virtual-config')) {
    // Don't process this as a meter ID, let the virtual-config route handle it
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  next();
});

// Update meter
router.put('/:id', requirePermission('meter:update'), asyncHandler(async (req, res) => {
  console.log('\n' + '='.repeat(100));
  console.log('PUT /meters/:id - Update Request');
  console.log('='.repeat(100));
  console.log('Meter ID:', req.params.id);
  console.log('Request Body:', JSON.stringify(req.body, null, 2));
  
  // Find the meter first
  const meter = await Meter.findById(req.params.id);
  if (!meter) {
    return res.status(404).json({ success: false, message: 'Meter not found' });
  }
  
  // CRITICAL: Protect tenant_id from being changed
  // Validate that the meter belongs to the authenticated user's tenant
  const userTenantId = req.user?.tenant_id || req.user?.tenantId;
  if (meter.tenant_id !== userTenantId) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to update this meter'
    });
  }
  
  console.log('Found meter:', JSON.stringify(meter, null, 2));
  
  // Filter out fields that don't exist in the database or are read-only
  const updateData = { ...req.body };
  delete updateData.device;  // read-only computed field
  delete updateData.model;   // read-only computed field
  delete updateData.status;  // doesn't exist in database
  delete updateData.tenant_id;  // cannot be changed
  delete updateData.tenantId;   // cannot be changed
  delete updateData.elements;   // custom field, not in database
  
  console.log('Filtered update data:', JSON.stringify(updateData, null, 2));
  
  // Update the meter using instance method
  await meter.update(updateData);
  
  console.log('Update successful');
  console.log('='.repeat(100) + '\n');
  
  res.json({ success: true, data: meter });
}));

// Delete meter
router.delete('/:id', requirePermission('meter:delete'), async (req, res) => {
  try {
    // Find the meter first
    const meter = await Meter.findById(req.params.id);
    if (!meter) {
      return res.status(404).json({ success: false, message: 'Meter not found' });
    }
    
    // Delete the meter using instance method
    await meter.delete();
    
    res.json({ success: true, message: 'Meter deleted successfully' });
  } catch (error) {
    console.error('Error deleting meter:', error);
    res.status(500).json({ success: false, message: 'Failed to delete meter' });
  }
});

module.exports = router;
