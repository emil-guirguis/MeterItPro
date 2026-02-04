/**
 * Dashboard Routes
 * 
 * Endpoints for managing dashboard cards and retrieving power column metadata.
 */

const express = require('express');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { query, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const PowerColumnDiscoveryService = require('../services/PowerColumnDiscoveryService');
const TimeFrameCalculationService = require('../services/TimeFrameCalculationService');
const DataAggregationService = require('../services/DataAggregationService');
const Dashboard = require('../models/DashboardWithSchema');
const MeterElements = require('../models/MeterElementsWithSchema');
const Meter = require('../models/MeterWithSchema');

const router = express.Router();
router.use(authenticateToken);

/**
 * GET /api/dashboard/cards
 * 
 * Retrieve all dashboard cards for the authenticated user's tenant.
 * Supports pagination and filtering.
 * 
 * Requirements: 3.1, 3.7
 */
router.get('/cards', requirePermission('dashboard:read'), asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      search
    } = req.query;

    console.log('📊 [Dashboard API] GET /cards called');

    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'User must have a valid tenant_id'
      });
    }

    // Build where clause
    let where = { tenant_id: tenantId };

    // Handle search parameter (search by card name)
    if (search) {
      where.card_name = search;
    }

    // Build options for findAll
    const options = {
      where,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      tenant_id: tenantId
    };

    console.log('📊 [Dashboard API] Query options:', JSON.stringify(options));

    // Get dashboard cards
    const result = await Dashboard.findAll(options);
    
    console.log('📊 [Dashboard API] Query result rows:', result.rows.length);
    console.log('📊 [Dashboard API] Query result pagination:', result.pagination);

    // Map id to dashboard_id for API response
    const items = result.rows.map((card, index) => {
      const cardIndex = (parseInt(page) - 1) * parseInt(limit) + index;
      const cardData = /** @type {any} */ (card);
      
      return {
        ...card,
        dashboard_id: card.dashboard_id || card.id,
        grid_x: cardData.grid_x !== null && cardData.grid_x !== undefined ? cardData.grid_x : 0,
        grid_y: cardData.grid_y !== null && cardData.grid_y !== undefined ? cardData.grid_y : (cardIndex * 520),
        grid_w: cardData.grid_w !== null && cardData.grid_w !== undefined ? cardData.grid_w : 500,
        grid_h: cardData.grid_h !== null && cardData.grid_h !== undefined ? cardData.grid_h : 500,
      };
    });

    res.json({
      success: true,
      data: {
        items,
        total: result.pagination.total,
        page: parseInt(page),
        pageSize: parseInt(limit),
        totalPages: result.pagination.totalPages
      }
    });
    
    console.log('📊 [Dashboard API] Final response items:', JSON.stringify(items.map(i => ({ id: i.dashboard_id, grid_w: i.grid_w, grid_h: i.grid_h }))));
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('❌ [Dashboard API] Error fetching cards:', err.message);
    console.error('❌ [Dashboard API] Error stack:', err.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard cards',
      ...(process.env.NODE_ENV !== 'production' ? { error: err.message, stack: err.stack } : {})
    });
  }
}));

/**
 * GET /api/dashboard/cards/:id
 * 
 * Retrieve a single dashboard card by ID.
 * Validates tenant ownership.
 * 
 * Requirements: 3.1, 3.7
 */
router.get('/cards/:id', requirePermission('dashboard:read'), asyncHandler(async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'User must have a valid tenant_id'
      });
    }

    const card = await Dashboard.findById(req.params.id);
    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard card not found'
      });
    }

    // Validate tenant ownership
    if (card.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this dashboard card'
      });
    }

    // Map id to dashboard_id for API response
    const cardData = /** @type {any} */ (card);
    const cardResponse = {
      ...card,
      dashboard_id: card.id,
      grid_x: cardData.grid_x !== null && cardData.grid_x !== undefined ? cardData.grid_x : 0,
      grid_y: cardData.grid_y !== null && cardData.grid_y !== undefined ? cardData.grid_y : 0,
      grid_w: cardData.grid_w !== null && cardData.grid_w !== undefined ? cardData.grid_w : 500,
      grid_h: cardData.grid_h !== null && cardData.grid_h !== undefined ? cardData.grid_h : 500,
    };

    res.json({ success: true, data: cardResponse });
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('❌ [Dashboard API] Error fetching card:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard card',
      ...(process.env.NODE_ENV !== 'production' ? { error: err.message } : {})
    });
  }
}));

/**
 * GET /api/dashboard/cards/:id/data
 * 
 * Retrieve aggregated data for a dashboard card.
 * Calculates time frame boundaries and aggregates meter reading data.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
router.get('/cards/:id/data', requirePermission('dashboard:read'), asyncHandler(async (req, res) => {
  try {
    console.log('📊 [Dashboard API] GET /cards/:id/data called');

    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'User must have a valid tenant_id'
      });
    }

    // Retrieve the dashboard card
    const card = await Dashboard.findById(req.params.id);
    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard card not found'
      });
    }

    // Validate tenant ownership
    if (card.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this dashboard card'
      });
    }

    // Calculate time frame boundaries
    const timeFrame = await TimeFrameCalculationService.calculateTimeFrame(
      card.time_frame_type,
      {
        customStartDate: card.custom_start_date,
        customEndDate: card.custom_end_date,
        meterElementId: card.meter_element_id,
        tenantId: tenantId
      }
    );

    console.log(`📊 [Dashboard API] Time frame calculated: ${timeFrame.start.toISOString()} to ${timeFrame.end.toISOString()}`);

    // Aggregate card data based on grouping type
    const aggregatedValues = await DataAggregationService.aggregateCardData({
      meterElementId: card.meter_element_id,
      tenantId: tenantId,
      selectedColumns: card.selected_columns,
      startDate: timeFrame.start,
      endDate: timeFrame.end
    });

    // Get grouped data based on card's grouping preference
    const groupedData = await DataAggregationService.getAggregatedDataByGrouping({
      meterElementId: card.meter_element_id,
      tenantId: tenantId,
      selectedColumns: card.selected_columns,
      startDate: timeFrame.start,
      endDate: timeFrame.end,
      groupingType: card.grouping_type || 'daily'
    });

    console.log('📊 [Dashboard API] Data aggregation complete');
    console.log(`📊 [Dashboard API] Using grouping type: ${card.grouping_type || 'daily'}`);
    console.log(`📊 [Dashboard API] Grouped data type: ${Array.isArray(groupedData) ? 'array' : 'object'}`);
    console.log(`📊 [Dashboard API] Grouped data length: ${Array.isArray(groupedData) ? groupedData.length : 'N/A'}`);
    console.log(`📊 [Dashboard API] Grouped data sample:`, Array.isArray(groupedData) ? groupedData.slice(0, 2) : groupedData);

    // Return aggregated data with card metadata
    res.json({
      success: true,
      data: {
        card_id: card.id,
        card_name: card.card_name,
        meter_element_id: card.meter_element_id,
        time_frame: {
          type: timeFrame.type,
          start: timeFrame.start.toISOString(),
          end: timeFrame.end.toISOString()
        },
        selected_columns: card.selected_columns,
        aggregated_values: aggregatedValues,
        grouped_data: groupedData,
        grouping_type: card.grouping_type || 'daily',
        visualization_type: card.visualization_type
      }
    });
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('❌ [Dashboard API] Error fetching aggregated data:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch aggregated card data',
      ...(process.env.NODE_ENV !== 'production' ? { error: err.message } : {})
    });
  }
}));

/**
 * POST /api/dashboard/cards
 * 
 * Create a new dashboard card.
 * Validates meter element and selected columns.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */
router.post('/cards', requirePermission('dashboard:create'), asyncHandler(async (req, res) => {
  try {
    console.log('📊 [Dashboard API] POST /cards called');

    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'User must have a valid tenant_id'
      });
    }

    const userId = req.user?.id;
    console.log('📊 [Dashboard API] POST /cards - req.user:', req.user);
    console.log('📊 [Dashboard API] POST /cards - userId:', userId);
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User must have a valid user ID'
      });
    }

    // Validate meter exists and belongs to tenant
    const meter = await Meter.findById(req.body.meter_id);
    if (!meter) {
      return res.status(400).json({
        success: false,
        message: 'Meter not found',
        errors: [{ field: 'meter_id', message: 'Meter does not exist' }]
      });
    }

    // Validate meter belongs to tenant
    if (meter.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this meter',
        errors: [{ field: 'meter_id', message: 'Meter does not belong to your tenant' }]
      });
    }

    // Validate meter element exists and belongs to tenant
    const meterElement = await MeterElements.findById(req.body.meter_element_id);
    if (!meterElement) {
      return res.status(400).json({
        success: false,
        message: 'Meter element not found',
        errors: [{ field: 'meter_element_id', message: 'Meter element does not exist' }]
      });
    }

    // Validate meter element belongs to tenant
    if (meterElement.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this meter element',
        errors: [{ field: 'meter_element_id', message: 'Meter element does not belong to your tenant' }]
      });
    }

    // Validate meter element belongs to the selected meter
    if (meterElement.meter_id !== req.body.meter_id) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'meter_element_id', message: 'Meter element does not belong to the selected meter' }]
      });
    }

    // Validate selected columns are not empty
    if (!req.body.selected_columns || (Array.isArray(req.body.selected_columns) && req.body.selected_columns.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'selected_columns', message: 'At least one power column must be selected' }]
      });
    }

    // Validate that selected columns exist in the database
    const DataAggregationService = require('../services/DataAggregationService');
    const columnValidation = await DataAggregationService.validateSelectedColumns(req.body.selected_columns);
    if (!columnValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [{ 
          field: 'selected_columns', 
          message: `Invalid columns: ${columnValidation.invalid.join(', ')}. Valid columns are: ${columnValidation.valid.join(', ')}` 
        }]
      });
    }

    // Create dashboard card with tenant and user info
    // Get the next available grid position
    const existingCards = await Dashboard.findAll({
      where: { tenant_id: tenantId },
      limit: 1000
    });
    
    const nextIndex = existingCards.rows.length;
    const defaultGridX = 0;  // Start at left
    const defaultGridY = nextIndex * 520;  // Stack vertically with 20px gap
    
    const cardData = {
      ...req.body,
      tenant_id: tenantId,
      created_by_users_id: userId,
      // Set default grid values in PIXELS if not provided
      // Only set if explicitly provided - don't override with defaults on insert
      grid_x: req.body.grid_x !== undefined ? req.body.grid_x : defaultGridX,
      grid_y: req.body.grid_y !== undefined ? req.body.grid_y : defaultGridY,
      grid_w: req.body.grid_w !== undefined ? req.body.grid_w : 500,  // 500px width
      grid_h: req.body.grid_h !== undefined ? req.body.grid_h : 500,  // 500px height
    };

    const card = new Dashboard(cardData);
    await card.save();

    console.log('📊 [Dashboard API] Card created successfully:', card.id);
    
    // Map id to dashboard_id for API response
    const cardObj = /** @type {any} */ (card);
    const cardResponse = {
      ...card,
      dashboard_id: card.id,
      grid_x: cardObj.grid_x !== null && cardObj.grid_x !== undefined ? cardObj.grid_x : 0,
      grid_y: cardObj.grid_y !== null && cardObj.grid_y !== undefined ? cardObj.grid_y : 0,
      grid_w: cardObj.grid_w !== null && cardObj.grid_w !== undefined ? cardObj.grid_w : 500,
      grid_h: cardObj.grid_h !== null && cardObj.grid_h !== undefined ? cardObj.grid_h : 500,
    };
    
    res.status(201).json({ success: true, data: cardResponse });
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('❌ [Dashboard API] Error creating card:', err.message);
    
    // Check if it's a validation error
    if (err.message && err.message.includes('validation')) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        ...(process.env.NODE_ENV !== 'production' ? { error: err.message } : {})
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create dashboard card',
      ...(process.env.NODE_ENV !== 'production' ? { error: err.message } : {})
    });
  }
}));

/**
 * PUT /api/dashboard/cards/:id
 * 
 * Update an existing dashboard card.
 * Validates tenant ownership and input data.
 * 
 * Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */
router.put('/cards/:id', requirePermission('dashboard:update'), asyncHandler(async (req, res) => {
  try {
    console.log('📊 [Dashboard API] PUT /cards/:id called');

    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'User must have a valid tenant_id'
      });
    }

    // Find the card
    const card = await Dashboard.findById(req.params.id);
    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard card not found'
      });
    }

    // Validate tenant ownership
    if (card.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this dashboard card'
      });
    }

    // Determine which meter_id to validate against (new or existing)
    const meterIdToValidate = req.body.meter_id || card.meter_id;
    const meterElementIdToValidate = req.body.meter_element_id || card.meter_element_id;

    // Validate meter if provided and different from current
    if (req.body.meter_id && req.body.meter_id !== card.meter_id) {
      const meter = await Meter.findById(req.body.meter_id);
      if (!meter) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: [{ field: 'meter_id', message: 'Meter does not exist' }]
        });
      }

      // Validate meter belongs to tenant
      if (meter.tenant_id !== tenantId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this meter',
          errors: [{ field: 'meter_id', message: 'Meter does not belong to your tenant' }]
        });
      }
    }

    // Validate meter element if provided and different from current
    if (req.body.meter_element_id && req.body.meter_element_id !== card.meter_element_id) {
      const meterElement = await MeterElements.findById(req.body.meter_element_id);
      if (!meterElement) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: [{ field: 'meter_element_id', message: 'Meter element does not exist' }]
        });
      }

      // Validate meter element belongs to tenant
      if (meterElement.tenant_id !== tenantId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this meter element',
          errors: [{ field: 'meter_element_id', message: 'Meter element does not belong to your tenant' }]
        });
      }
    }

    // Validate meter element belongs to the selected meter (check both new and existing)
    if (meterIdToValidate && meterElementIdToValidate) {
      const meterElement = await MeterElements.findById(meterElementIdToValidate);
      if (meterElement && meterElement.meter_id !== meterIdToValidate) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: [{ field: 'meter_element_id', message: 'Meter element does not belong to the selected meter' }]
        });
      }
    }

    // Validate selected columns if provided
    if (req.body.selected_columns !== undefined) {
      if (!Array.isArray(req.body.selected_columns) || req.body.selected_columns.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: [{ field: 'selected_columns', message: 'At least one power column must be selected' }]
        });
      }

      // Validate that selected columns exist in the database
      const DataAggregationService = require('../services/DataAggregationService');
      const columnValidation = await DataAggregationService.validateSelectedColumns(req.body.selected_columns);
      if (!columnValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: [{ 
            field: 'selected_columns', 
            message: `Invalid columns: ${columnValidation.invalid.join(', ')}. Valid columns are: ${columnValidation.valid.join(', ')}` 
          }]
        });
      }
    }

    // Remove tenant_id from update data - it cannot be changed
    const updateData = { ...req.body };
    delete updateData.tenant_id;
    delete updateData.created_by_users_id;

    // Update the card
    await card.update(updateData);

    console.log('📊 [Dashboard API] Card updated successfully:', card.id);
    
    // Map id to dashboard_id for API response
    const cardObj = /** @type {any} */ (card);
    const cardResponse = {
      ...card,
      dashboard_id: card.id,
      grid_x: cardObj.grid_x !== null && cardObj.grid_x !== undefined ? cardObj.grid_x : 0,
      grid_y: cardObj.grid_y !== null && cardObj.grid_y !== undefined ? cardObj.grid_y : 0,
      grid_w: cardObj.grid_w !== null && cardObj.grid_w !== undefined ? cardObj.grid_w : 500,
      grid_h: cardObj.grid_h !== null && cardObj.grid_h !== undefined ? cardObj.grid_h : 500,
    };
    
    res.json({ success: true, data: cardResponse });
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('❌ [Dashboard API] Error updating card:', err.message);
    
    // Check if it's a validation error
    if (err.message && err.message.includes('validation')) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        ...(process.env.NODE_ENV !== 'production' ? { error: err.message } : {})
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update dashboard card',
      ...(process.env.NODE_ENV !== 'production' ? { error: err.message } : {})
    });
  }
}));

/**
 * DELETE /api/dashboard/cards/:id
 * 
 * Delete a dashboard card.
 * Validates tenant ownership.
 * 
 * Requirements: 3.3, 3.7
 */
router.delete('/cards/:id', requirePermission('dashboard:delete'), asyncHandler(async (req, res) => {
  try {
    console.log('📊 [Dashboard API] DELETE /cards/:id called');

    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'User must have a valid tenant_id'
      });
    }

    // Find the card
    const card = await Dashboard.findById(req.params.id);
    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard card not found'
      });
    }

    // Validate tenant ownership
    if (card.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this dashboard card'
      });
    }

    // Delete the card
    await card.delete();

    console.log('📊 [Dashboard API] Card deleted successfully:', req.params.id);
    res.json({ success: true, message: 'Dashboard card deleted successfully' });
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('❌ [Dashboard API] Error deleting card:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete dashboard card',
      ...(process.env.NODE_ENV !== 'production' ? { error: err.message } : {})
    });
  }
}));

/**
 * GET /api/dashboard/cards/:id/readings
 * 
 * Retrieve detailed meter readings for a dashboard card with pagination and sorting.
 * Filters by card's time frame, meter element, and selected columns.
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - pageSize: Number of items per page (default: 50, max: 500)
 * - sortBy: Column to sort by (default: created_at)
 * - sortOrder: Sort order - 'asc' or 'desc' (default: desc)
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9
 */
router.get('/cards/:id/readings', requirePermission('dashboard:read'), asyncHandler(async (req, res) => {
  try {
    console.log('📊 [Dashboard API] GET /cards/:id/readings called');

    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'User must have a valid tenant_id'
      });
    }

    // Parse pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(500, Math.max(1, parseInt(req.query.pageSize) || 50));
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = (req.query.sortOrder || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Retrieve the dashboard card
    const card = await Dashboard.findById(req.params.id);
    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard card not found'
      });
    }

    // Validate tenant ownership
    if (card.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this dashboard card'
      });
    }

    // Calculate time frame boundaries
    const timeFrame = await TimeFrameCalculationService.calculateTimeFrame(
      card.time_frame_type,
      {
        customStartDate: card.custom_start_date,
        customEndDate: card.custom_end_date,
        meterElementId: card.meter_element_id,
        tenantId: tenantId
      }
    );

    console.log(`📊 [Dashboard API] Time frame calculated: ${timeFrame.start.toISOString()} to ${timeFrame.end.toISOString()}`);

    // Build the query to fetch meter readings
    const db = require('../config/database');
    
    // Build selected columns list - always include timestamp
    const selectedColumns = Array.isArray(card.selected_columns) ? card.selected_columns : [];
    const columnsList = ['id', 'created_at', ...selectedColumns];
    
    // Validate sort column is in selected columns or is a system column
    const validSortColumns = ['id', 'created_at', 'updated_at', 'meter_id', 'meter_element_id', ...selectedColumns];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';

    // Build the query
        //   SELECT ${columnsList.map(col => `"${col}"`).join(', ')}
    //   FROM meter_reading
    //   WHERE
    //     tenant_id = $1
    //     AND meter_element_id = $2
    //     AND created_at >= $3
    //     AND created_at <= $4
    //   ORDER BY "${safeSortBy}" ${sortOrder}
    //   LIMIT $5
    //   OFFSET $6
    // `;
//     const query = `
// SELECT 
//     DATE(created_at AT TIME ZONE 'America/Los_Angeles')          AS reading_date,          -- local day
//     EXTRACT(HOUR FROM created_at AT TIME ZONE 'America/Los_Angeles') AS hour_of_day,       -- 0–23 local hour
//     SUM("active_energy")                                          AS total_active_energy
// FROM meter_reading
// WHERE 
//     tenant_id = $1
//     AND meter_element_id = $2
//     AND created_at >= $3::timestamptz
//     AND created_at <= $4::timestamptz
// GROUP BY 
//     DATE(created_at AT TIME ZONE 'America/Los_Angeles'),
//     EXTRACT(HOUR FROM created_at AT TIME ZONE 'America/Los_Angeles')
// ORDER BY "${safeSortBy}" ${sortOrder}
//      `;
//       //  --LIMIT $5
//       // --OFFSET $6

    const query = `
SELECT 
     FORMAT(created_at, 'mm/dd/yyyy')) AS reading_date,          -- local day
     FORMAT(created_at, 'HH:mm') AS hour_of_day,       -- 0–23 local hour
    SUM("active_energy")                                          AS total_active_energy
FROM meter_reading
WHERE 
    tenant_id = $1
    AND meter_element_id = $2
    AND created_at >= $3
    AND created_at <= $4
GROUP BY 
    DATE(created_at),
    EXTRACT(HOUR FROM created_at )
ORDER BY "${safeSortBy}" ${sortOrder}
     `;


    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM meter_reading
      WHERE
        tenant_id = $1
        AND meter_element_id = $2
        AND created_at >= $3
        AND created_at <= $4
    `;

    const countResult = await db.query(countQuery, [
      tenantId,
      card.meter_element_id,
      timeFrame.start,
      timeFrame.end
    ]);

    const countRow = /** @type {{ total: number }} */ (/** @type {unknown} */ (countResult.rows?.[0] || {}));
    const total = parseInt(String(countRow?.total || 0));
    const totalPages = Math.ceil(total / pageSize);

    // Execute the query
    const result = await db.query(query, [
      tenantId,
      card.meter_element_id,
      timeFrame.start,
      timeFrame.end,
      pageSize,
      (page - 1) * pageSize
    ]);

    console.log(`📊 [Dashboard API] Retrieved ${result.rows.length} meter readings`);

    // Return paginated results
    res.json({
      success: true,
      data: {
        items: result.rows,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasMore: page < totalPages
        },
        metadata: {
          card_id: card.dashboard_id,
          card_name: card.card_name,
          meter_element_id: card.meter_element_id,
          time_frame: {
            type: timeFrame.type,
            start: timeFrame.start.toISOString(),
            end: timeFrame.end.toISOString()
          },
          selected_columns: selectedColumns,
          sort_by: safeSortBy,
          sort_order: sortOrder
        }
      }
    });
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('❌ [Dashboard API] Error fetching meter readings:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meter readings',
      ...(process.env.NODE_ENV !== 'production' ? { error: err.message } : {})
    });
  }
}));

/**
 * GET /api/dashboard/cards/:id/readings/export
 * 
 * Export detailed meter readings to CSV format.
 * Respects the same filters and sorting as the readings endpoint.
 * 
 * Query Parameters:
 * - sortBy: Column to sort by (default: created_at)
 * - sortOrder: Sort order - 'asc' or 'desc' (default: desc)
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8
 */
router.get('/cards/:id/readings/export', requirePermission('dashboard:read'), asyncHandler(async (req, res) => {
  try {
    console.log('📊 [Dashboard API] GET /cards/:id/readings/export called');

    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'User must have a valid tenant_id'
      });
    }

    // Parse sorting parameters
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = (req.query.sortOrder || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Retrieve the dashboard card
    const card = await Dashboard.findById(req.params.id);
    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard card not found'
      });
    }

    // Validate tenant ownership
    if (card.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this dashboard card'
      });
    }

    // Calculate time frame boundaries
    const timeFrame = await TimeFrameCalculationService.calculateTimeFrame(
      card.time_frame_type,
      {
        customStartDate: card.custom_start_date,
        customEndDate: card.custom_end_date,
        meterElementId: card.meter_element_id,
        tenantId: tenantId
      }
    );

    console.log(`📊 [Dashboard API] Time frame calculated: ${timeFrame.start.toISOString()} to ${timeFrame.end.toISOString()}`);

    // Build the query to fetch all meter readings (no pagination for export)
    const db = require('../config/database');
    
    // Build selected columns list - always include timestamp
    const selectedColumns = Array.isArray(card.selected_columns) ? card.selected_columns : [];
    const columnsList = ['id', 'created_at', ...selectedColumns];
    
    // Validate sort column
    const validSortColumns = ['id', 'created_at', 'updated_at', 'meter_id', 'meter_element_id', ...selectedColumns];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';

    // Build the query
    const query = `
      SELECT ${columnsList.map(col => `"${col}"`).join(', ')}
      FROM meter_reading
      WHERE
        tenant_id = $1
        AND meter_element_id = $2
        AND created_at >= $3
        AND created_at <= $4
      ORDER BY "${safeSortBy}" ${sortOrder}
    `;

    // Execute the query
    const result = await db.query(query, [
      tenantId,
      card.meter_element_id,
      timeFrame.start,
      timeFrame.end
    ]);

    console.log(`📊 [Dashboard API] Retrieved ${result.rows.length} meter readings for export`);

    // Generate CSV content
    const csvContent = generateCSV(result.rows, columnsList, card, timeFrame);

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${card.card_name.replace(/\s+/g, '_')}_${timestamp}.csv`;

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);

    console.log('📊 [Dashboard API] CSV export completed');
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('❌ [Dashboard API] Error exporting meter readings:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to export meter readings',
      ...(process.env.NODE_ENV !== 'production' ? { error: err.message } : {})
    });
  }
}));

/**
 * Helper function to generate CSV content from meter readings
 * @param {Array} rows - Array of meter reading objects
 * @param {Array} columns - Array of column names to include
 * @param {Object} card - Dashboard card object
 * @param {Object} timeFrame - Time frame object with start and end dates
 * @returns {string} CSV content
 */
function generateCSV(rows, columns, card, timeFrame) {
  // Helper function to escape CSV values
  const escapeCSV = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Build header row
  const headers = columns.map(col => {
    // Convert snake_case to Title Case
    return col
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  });

  // Build metadata section
  const metadata = [
    ['Meter Reading Export'],
    ['Card Name', card.card_name],
    ['Meter Element ID', card.meter_element_id],
    ['Time Frame', `${timeFrame.start.toISOString()} to ${timeFrame.end.toISOString()}`],
    ['Export Date', new Date().toISOString()],
    ['Total Records', rows.length],
    []
  ];

  // Build data rows
  const dataRows = rows.map(row => {
    return columns.map(col => escapeCSV(row[col]));
  });

  // Combine all sections
  const allRows = [
    ...metadata.map(row => row.map(escapeCSV).join(',')),
    headers.join(','),
    ...dataRows.map(row => row.join(','))
  ];

  return allRows.join('\n');
}

/**
 * GET /api/dashboard/meters
 * 
 * Retrieve all meters for the authenticated user's tenant.
 * Returns array of { id, name } for meter selection in forms.
 * 
 * Requirements: 1.1, 5.1
 */
router.get('/meters', requirePermission('dashboard:read'), asyncHandler(async (req, res) => {
  try {
    console.log('📊 [Dashboard API] GET /meters called');

    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'User must have a valid tenant_id'
      });
    }

    // Custom query to get meters for the tenant
    const query = `
      SELECT 
        meter_id as id,
        name
      FROM public.meter
      WHERE tenant_id = $1
      ORDER BY name ASC
    `;
    
    const db = Meter.getDb();
    const result = await db.query(query, [tenantId]);

    console.log(`📊 [Dashboard API] Retrieved ${result.rows.length} meters for tenant ${tenantId}`);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('❌ [Dashboard API] Error fetching meters:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meters',
      ...(process.env.NODE_ENV !== 'production' ? { error: err.message } : {})
    });
  }
}));

/**
 * GET /api/dashboard/meters/:meterId/elements
 * 
 * Retrieve all meter elements for a specific meter.
 * Validates meter belongs to user's tenant.
 * Returns array of { id, name, meter_id } for element selection in forms.
 * 
 * Requirements: 2.1, 5.2
 */
router.get('/meters/:meterId/elements', requirePermission('dashboard:read'), asyncHandler(async (req, res) => {
  try {
    console.log('📊 [Dashboard API] GET /meters/:meterId/elements called');

    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'User must have a valid tenant_id'
      });
    }

    const meterId = parseInt(req.params.meterId);
    if (isNaN(meterId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid meter ID'
      });
    }

    // Verify meter exists and belongs to tenant
    const meter = await Meter.findById(meterId);
    if (!meter) {
      return res.status(404).json({
        success: false,
        message: 'Meter not found'
      });
    }

    if (meter.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this meter'
      });
    }

    // Query meter elements for this meter
    const result = await MeterElements.findAll({
      where: { 
        meter_id: meterId,
        tenant_id: tenantId
      },
      select: ['id', 'element', 'name', 'meter_id'],
      order: [['element', 'ASC']]
    });

    const elements = result.rows.map(element => ({
      meter_element_id: element.meter_element_id || element.id,
      element: element.element,
      name: element.name,
      meter_id: element.meter_id
    }));

    console.log(`📊 [Dashboard API] Retrieved ${elements.length} elements for meter ${meterId}`);

    res.json({
      success: true,
      data: elements
    });
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('❌ [Dashboard API] Error fetching meter elements:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meter elements',
      ...(process.env.NODE_ENV !== 'production' ? { error: err.message } : {})
    });
  }
}));

/**
 * GET /api/dashboard/meters/:meterId/elements
 * 
 * Retrieve all meter elements for a specific meter.
 * 
 * Requirements: 3.1
 */
router.get('/meters/:meterId/elements', requirePermission('dashboard:read'), asyncHandler(async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'User must have a valid tenant_id'
      });
    }

    const meterId = parseInt(req.params.meterId);
    
    // Verify meter belongs to tenant
    const meter = await Meter.findById(meterId);
    if (!meter) {
      return res.status(404).json({
        success: false,
        message: 'Meter not found'
      });
    }

    if (meter.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this meter'
      });
    }

    // Get meter elements
    const elements = await MeterElements.findAll({
      where: { meter_id: meterId, tenant_id: tenantId },
      limit: 1000
    });

    res.json({
      success: true,
      data: elements.rows.map(el => ({
        meter_element_id: el.meter_element_id || el.id,
        meter_id: el.meter_id,
        element: el.element,
        name: el.name
      }))
    });
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('❌ [Dashboard API] Error fetching meter elements:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meter elements',
      ...(process.env.NODE_ENV !== 'production' ? { error: err.message } : {})
    });
  }
}));

/**
 * GET /api/dashboard/power-columns
 * 
 * Discover available numeric power columns from the meter_reading table.
 * Returns column metadata with caching support.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */
router.get('/power-columns', requirePermission('dashboard:read'), async (req, res) => {
  try {
    console.log('📊 [Dashboard API] GET /power-columns called');

    // Discover power columns (uses cache if available)
    const columns = await PowerColumnDiscoveryService.discoverColumns();

    // Get cache statistics for debugging
    const cacheStats = PowerColumnDiscoveryService.getCacheStats();

    res.json({
      success: true,
      data: columns,
      meta: {
        count: columns.length,
        cache: cacheStats
      }
    });
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('❌ [Dashboard API] Error discovering power columns:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to discover power columns',
      ...(process.env.NODE_ENV !== 'production' ? { error: err.message } : {})
    });
  }
});

/**
 * GET /api/dashboard/power-columns/cache/invalidate
 * 
 * Invalidate the power columns cache (admin only).
 * Useful for forcing a refresh after schema changes.
 */
router.get('/power-columns/cache/invalidate', requirePermission('dashboard:admin'), async (req, res) => {
  try {
    console.log('📊 [Dashboard API] Invalidating power columns cache');
    PowerColumnDiscoveryService.invalidateCache();

    res.json({
      success: true,
      message: 'Power columns cache invalidated',
      data: PowerColumnDiscoveryService.getCacheStats()
    });
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('❌ [Dashboard API] Error invalidating cache:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to invalidate cache',
      ...(process.env.NODE_ENV !== 'production' ? { error: err.message } : {})
    });
  }
});

/**
 * GET /api/dashboard/power-columns/cache/stats
 * 
 * Get cache statistics for debugging.
 */
router.get('/power-columns/cache/stats', requirePermission('dashboard:read'), async (req, res) => {
  try {
    const stats = PowerColumnDiscoveryService.getCacheStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('❌ [Dashboard API] Error getting cache stats:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache statistics',
      ...(process.env.NODE_ENV !== 'production' ? { error: err.message } : {})
    });
  }
});

module.exports = router;
