// @ts-nocheck
const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');
const MeterElement = require('../models/MeterElementsWithSchema');

// Middleware to authenticate all routes
router.use(authenticateToken);

// GET /api/meters/:meterId/elements/schema - Get schema for meter elements
router.get('/schema', (req, res) => {
  try {
    const schema = MeterElement.schema;
    
    if (!schema) {
      return res.status(500).json({
        success: false,
        message: 'Schema not available',
      });
    }

    console.log('📋 [SCHEMA] MeterElement.schema:', schema);
    console.log('📋 [SCHEMA] formFields:', schema.formFields);
    console.log('📋 [SCHEMA] element field:', schema.formFields?.element);

    // Return schema in a format the frontend expects
    res.json({
      success: true,
      data: {
        formFields: schema.formFields || {},
        entityFields: schema.entityFields || {},
      },
    });
  } catch (error) {
    console.error('Error fetching meter elements schema:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meter elements schema',
      error: errorMessage,
    });
  }
});

// GET /api/meters/:meterId/elements - Get all elements for a meter
router.get('/', async (req, res) => {
  try {
    const { meterId } = req.params;
    const tenantId = req.user?.tenantId || req.user?.tenant_id;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant context required',
      });
    }

    // Verify meter exists and belongs to tenant
    const meterResult = await db.query(
      'SELECT meter_id FROM meter WHERE meter_id = $1 AND tenant_id = $2',
      [meterId, tenantId]
    );

    if (meterResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Meter not found',
      });
    }

    // Simple query without favorite check
    const query = `SELECT 
      me.meter_element_id, 
      me.meter_id, 
      me.name, 
      me.element
     FROM meter_element me
     WHERE me.meter_id = $1
     ORDER BY me.element ASC`;

    const elements = await db.query(query, [meterId]);

    res.json({
      success: true,
      data: elements.rows,
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
});

// POST /api/meters/:meterId/elements - Add an element to a meter
router.post('/', async (req, res) => {
  try {
    const { meterId } = req.params;
    const { name, element } = req.body;
    const tenantId = req.user?.tenantId || req.user?.tenant_id;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant context required',
      });
    }

    // Validate against schema
    const validation = MeterElement.schema.validate({
      name,
      element,
    });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    // Verify meter exists and belongs to tenant
    const meterResult = await db.query(
      'SELECT meter_id FROM meter WHERE meter_id = $1 AND tenant_id = $2',
      [meterId, tenantId]
    );

    if (meterResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Meter not found',
      });
    }

    // Check for duplicate element
    const duplicateCheck = await db.query(
      `SELECT meter_element_id FROM meter_element 
       WHERE meter_id = $1 AND element = $2`,
      [meterId, element]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: {
          element: `Element "${element}" is already assigned to this meter`,
        },
      });
    }

    // Create meter_element record
    const result = await db.query(
      `INSERT INTO meter_element (meter_id, tenant_id, name, element)
       VALUES ($1, $2, $3, $4)
       RETURNING meter_element_id, meter_id, name, element`,
      [meterId, tenantId, name, element]
    );

    if (result.rows.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create meter element',
      });
    }

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error adding meter element:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'Failed to add meter element',
      error: errorMessage,
    });
  }
});

// PUT /api/meters/:meterId/elements/:elementId - Update a meter element
router.put('/:elementId', async (req, res) => {
  try {
    const { meterId, elementId } = req.params;
    const { name,  element } = req.body;
    const tenantId = req.user?.tenantId || req.user?.tenant_id;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant context required',
      });
    }

    // Verify meter exists and belongs to tenant
    const meterResult = await db.query(
      'SELECT meter_id FROM meter WHERE meter_id = $1 AND tenant_id = $2',
      [meterId, tenantId]
    );

    if (meterResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Meter not found',
      });
    }

    // Verify element exists and belongs to meter
    const elementResult = await db.query(
      'SELECT meter_element_id, name, element FROM meter_element WHERE meter_element_id = $1 AND meter_id = $2',
      [elementId, meterId]
    );

    if (elementResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Element not found',
      });
    }

    // Build data object with current values and updates
    const currentElement = elementResult.rows[0];
    const updatedData = {
      name: name !== undefined ? name : currentElement.name,
      element: element !== undefined ? element : currentElement.element,
    };

    // Validate against schema
    const validation = MeterElement.schema.validate(updatedData);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    // Check for duplicate element (if element is being changed)
    if (element !== undefined && element !== currentElement.element) {
      const duplicateCheck = await db.query(
        `SELECT meter_element_id FROM meter_element 
         WHERE meter_id = $1 AND element = $2 AND meter_element_id != $3`,
        [meterId, element, elementId]
      );

      if (duplicateCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: {
            element: `Element "${element}" is already assigned to this meter`,
          },
        });
      }
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (element !== undefined) {
      updates.push(`element = $${paramCount++}`);
      values.push(element);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
      });
    }

    values.push(elementId);
    values.push(meterId);

    const query = `
      UPDATE meter_element
      SET ${updates.join(', ')}
      WHERE meter_element_id = $${paramCount++} AND meter_id = $${paramCount++}
      RETURNING meter_element_id, meter_id, name, element
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update meter element',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating meter element:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'Failed to update meter element',
      error: errorMessage,
    });
  }
});

// DELETE /api/meters/:meterId/elements/:elementId - Delete a meter element
router.delete('/:elementId', async (req, res) => {
  try {
    const { meterId, elementId } = req.params;
    const tenantId = req.user?.tenantId || req.user?.tenant_id;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Tenant context required',
      });
    }

    // Verify meter exists and belongs to tenant
    const meterResult = await db.query(
      'SELECT meter_id FROM meter WHERE meter_id = $1 AND tenant_id = $2',
      [meterId, tenantId]
    );

    if (meterResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Meter not found',
      });
    }

    // Verify element exists and belongs to meter
    const elementResult = await db.query(
      'SELECT meter_element_id FROM meter_element WHERE meter_element_id = $1 AND meter_id = $2',
      [elementId, meterId]
    );

    if (elementResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Element not found',
      });
    }

    // Delete the meter_element record
    await db.query(
      'DELETE FROM meter_element WHERE meter_element_id = $1 AND meter_id = $2',
      [elementId, meterId]
    );

    res.json({
      success: true,
      message: 'Element deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting meter element:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'Failed to delete meter element',
      error: errorMessage,
    });
  }
});

module.exports = router;
