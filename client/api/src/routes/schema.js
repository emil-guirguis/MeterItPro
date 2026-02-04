/**
 * Schema API Routes
 * 
 * Exposes entity schemas to the frontend.
 * This allows the frontend to dynamically fetch schema definitions
 * instead of duplicating them.
 * 
 * Endpoints:
 * - GET /api/schema/:entity - Get schema for a specific entity
 * - GET /api/schema - Get all available schemas
 */

const express = require('express');
const router = express.Router();

// Import models with schema definitions
// Add your models here as you create them
// console.log('[SCHEMA ROUTES] Loading models...');

// console.log('[SCHEMA ROUTES] Loading MeterReadingsWithSchema...');
const meterReadingsModel = require('../models/MeterReadingsWithSchema');
// console.log('[SCHEMA ROUTES] ✅ MeterReadingsWithSchema loaded');

// console.log('[SCHEMA ROUTES] Loading MeterWithSchema...');
const meterModel = require('../models/MeterWithSchema');
// console.log('[SCHEMA ROUTES] ✅ MeterWithSchema loaded');

// console.log('[SCHEMA ROUTES] Loading ContactWithSchema...');
const contactModel = require('../models/ContactWithSchema');
// console.log('[SCHEMA ROUTES] ✅ ContactWithSchema loaded');

// console.log('[SCHEMA ROUTES] Loading DeviceWithSchema...');
const deviceModel = require('../models/DeviceWithSchema');
// console.log('[SCHEMA ROUTES] ✅ DeviceWithSchema loaded');

// console.log('[SCHEMA ROUTES] Loading LocationWithSchema...');
const locationModel = require('../models/LocationWithSchema');
// console.log('[SCHEMA ROUTES] ✅ LocationWithSchema loaded');

// console.log('[SCHEMA ROUTES] Loading UserWithSchema...');
const userModel = require('../models/UserWithSchema');
// console.log('[SCHEMA ROUTES] ✅ UserWithSchema loaded');

// console.log('[SCHEMA ROUTES] Loading TenantWithSchema...');
const tenantModel = require('../models/TenantWithSchema');
// console.log('[SCHEMA ROUTES] ✅ TenantWithSchema loaded');

// console.log('[SCHEMA ROUTES] Loading EmailTemplatesWithSchema...');
const emailTemplatesModel = require('../models/EmailTemplatesWithSchema');
// console.log('[SCHEMA ROUTES] ✅ EmailTemplatesWithSchema loaded');

// console.log('[SCHEMA ROUTES] Loading MeterMonitoringAlertsWithSchema...');
const meterMonitoringAlertsModel = require('../models/MeterMonitoringAlertsWithSchema');
// console.log('[SCHEMA ROUTES] ✅ MeterMonitoringAlertsWithSchema loaded');

// console.log('[SCHEMA ROUTES] Loading MeterStatusLogWithSchema...');
const meterStatusLogModel = require('../models/MeterStatusLogWithSchema');
// console.log('[SCHEMA ROUTES] ✅ MeterStatusLogWithSchema loaded');

// console.log('[SCHEMA ROUTES] Loading MeterTriggersWithSchema...');
const meterTriggersModel = require('../models/MeterTriggersWithSchema');
// console.log('[SCHEMA ROUTES] ✅ MeterTriggersWithSchema loaded');

// console.log('[SCHEMA ROUTES] Loading MeterUsageAlertsWithSchema...');
const meterUsageAlertsModel = require('../models/MeterUsageAlertsWithSchema');
// console.log('[SCHEMA ROUTES] ✅ MeterUsageAlertsWithSchema loaded');

// console.log('[SCHEMA ROUTES] Loading NotificationLogsWithSchema...');
const notificationLogsModel = require('../models/NotificationLogsWithSchema');
// console.log('[SCHEMA ROUTES] ✅ NotificationLogsWithSchema loaded');

// console.log('[SCHEMA ROUTES] Loading MeterElementsWithSchema...');
const meterElementsModel = require('../models/MeterElementsWithSchema');
// console.log('[SCHEMA ROUTES] ✅ MeterElementsWithSchema loaded');

// console.log('[SCHEMA ROUTES] Loading ReportWithSchema...');
const reportModel = require('../models/ReportWithSchema');
// console.log('[SCHEMA ROUTES] ✅ ReportWithSchema loaded');

// console.log('[SCHEMA ROUTES] ✅ All models loaded successfully');

const models = {
  meter: meterModel,
  contact: contactModel,
  device: deviceModel,
  location: locationModel,
  meterReadings: meterReadingsModel,
  meter_reading: meterReadingsModel, // Alias for frontend
  user: userModel,
  tenant: tenantModel,
  emailTemplates: emailTemplatesModel,
  meterMonitoringAlerts: meterMonitoringAlertsModel,
  meterStatusLog: meterStatusLogModel,
  meterTriggers: meterTriggersModel,
  meterUsageAlerts: meterUsageAlertsModel,
  notificationLogs: notificationLogsModel,
  meterElements: meterElementsModel,
  report: reportModel,
  // Add more models here
};

/**
 * GET /api/schema
 * Get list of all available schemas
 */
router.get('/', (req, res) => {
  try {
    const availableSchemas = Object.keys(models).map(entityName => {
      const model = models[entityName];
      const schema = model.schema;
      
      return {
        entityName: schema.entityName,
        tableName: schema.tableName,
        description: schema.description,
        endpoint: `/api/schema/${entityName}`,
      };
    });

    res.json({
      success: true,
      data: {
        schemas: availableSchemas,
        count: availableSchemas.length,
      },
    });
  } catch (error) {
    console.error('Error fetching schema list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schema list',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/schema/:entity
 * Get schema for a specific entity
 * 
 * @param {string} entity - Entity name (e.g., 'meter', 'location')
 * @returns {Object} Schema definition
 */
router.get('/:entity', (req, res) => {
  try {
    const { entity } = req.params;
    
    // Check if model exists
    if (!models[entity]) {
      return res.status(404).json({
        success: false,
        message: `Schema not found for entity: ${entity}`,
        availableEntities: Object.keys(models),
      });
    }

    // Get model and schema
    const model = models[entity];
    const schema = model.schema;

    // Return schema as JSON
    res.json({
      success: true,
      data: schema.toJSON(),
    });
  } catch (error) {
    console.error(`Error fetching schema for ${req.params.entity}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schema',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/schema/:entity/validate
 * Validate data against entity schema
 * 
 * @param {string} entity - Entity name
 * @param {Object} body - Data to validate
 * @returns {Object} Validation result
 */
router.post('/:entity/validate', (req, res) => {
  try {
    const { entity } = req.params;
    const data = req.body;

    // Check if model exists
    if (!models[entity]) {
      return res.status(404).json({
        success: false,
        message: `Schema not found for entity: ${entity}`,
      });
    }

    // Get model and validate
    const model = models[entity];
    const schema = model.schema;
    const validation = schema.validate(data);

    res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    console.error(`Error validating data for ${req.params.entity}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate data',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

module.exports = router;
