/**
 * Favorites Routes
 * Favorites endpoint for meter elements
 * Columns: tenant_id, users_id, table_name, id1 (meter_id), id2 (meter_element_id)
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * Transform raw query results into nested meter structure with elements
 * 
 * @param {Array} rows - Raw database query results
 * @returns {Array} Nested structure: { id, name, elements: [...] }
 */
function transformMetersWithElements(rows) {
  const metersMap = {};
  
  rows.forEach(row => {
    if (!metersMap[row.meter_id]) {
      metersMap[row.meter_id] = {
        id: row.meter_id,
        name: row.meter_name,
        elements: []
      };
    }
    
    if (row.meter_element_id) {
      metersMap[row.meter_id].elements.push({
        meter_element_id: row.meter_element_id,
        element: row.element,
        name: row.name,
        favorite_name: row.favorite_name,
        is_favorited: row.is_favorited,
        favorite_id: row.favorite_id
      });
    }
  });

  return Object.values(metersMap);
}

/**
 * @typedef {Object} MeterRow
 * @property {number} meter_id
 * @property {string} meter_name
 * @property {number} meter_element_id
 * @property {string} favorite_name
 * @property {boolean} is_favorited
 */

/**
 * @typedef {Object} FavoriteRow
 * @property {number} favorite_id
 * @property {number} tenant_id
 * @property {number} users_id
 * @property {string} table_name
 * @property {number} id1
 * @property {number} id2
 * @property {string} favorite_name
 */

/**
 * GET /api/favorites/meters
 * Get all meters with their elements and favorite status for the sidebar
 * Custom query that joins meters, meter_elements, and favorites
 */
router.get('/meters', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Database connection not available',
      });
    }

    const { tenant_id, users_id } = req.query;

    if (!users_id) {
      return res.status(400).json({
        success: false,
        message: 'users_id is required',
      });
    }

    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        message: 'tenant_id is required',
      });
    }

    // Custom query that returns meters with their elements and favorite status
    // Use COALESCE to handle NULL values from LEFT JOINs
    const query = `
      SELECT 
        m.meter_id,
        m.name as meter_name,
        me.meter_element_id,
        me.element,
        me.name,
        CASE 
          WHEN me.meter_element_id IS NOT NULL THEN 
            CONCAT(COALESCE(m.name, 'Unknown Meter'), '    ', COALESCE(TRIM(me.element), '?'), '-', COALESCE(me.name, 'Unknown'))
          ELSE 
            COALESCE(m.name, 'Unknown Meter')
        END as favorite_name,
        CASE WHEN f.favorite_id IS NOT NULL THEN true ELSE false END as is_favorited,
        f.favorite_id
      FROM public.meter m
      LEFT JOIN public.meter_element me ON m.meter_id = me.meter_id AND me.tenant_id = $1
      LEFT JOIN public.favorite f ON 
        f.id1 = me.meter_id 
        AND f.id2 = me.meter_element_id 
        AND f.table_name = 'meter'
        AND f.tenant_id = $1
        AND f.users_id = $2
      WHERE m.tenant_id = $1
      ORDER BY m.name ASC, me.element ASC
    `;

    const result = await db.query(query, [tenant_id, users_id]);

    // Transform results into nested structure using shared helper
    const meters = transformMetersWithElements(result.rows);

    res.json({
      success: true,
      data: meters,
    });
  } catch (error) {
    console.error('Error fetching meters with elements:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meters with elements',
      error: errorMessage,
    });
  }
});

/**
 * GET /api/favorites
 * Get all favorites for a user in a tenant with joined data (meter/element names)
 * Query params: tenant_id, users_id, table_name (optional)
 */
router.get('/', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Database connection not available',
      });
    }

    const { tenant_id, users_id, table_name } = req.query;

    if (!users_id) {
      return res.status(400).json({
        success: false,
        message: 'users_id is required',
      });
    }

    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        message: 'tenant_id is required',
      });
    }

    // Query that joins favorite with meter and meter_element tables to get names
    // Use COALESCE to handle NULL values from LEFT JOINs
    let query = `
      SELECT 
        f.favorite_id,
        f.tenant_id,
        f.users_id,
        f.table_name,
        f.id1,
        f.id2,
        m.name as meter_name,
        me.element,
        me.name as element_name,
        CASE 
          WHEN me.meter_element_id IS NOT NULL THEN 
            CONCAT(COALESCE(m.name, 'Unknown Meter'), '    ', COALESCE(TRIM(me.element), '?'), '-', COALESCE(me.name, 'Unknown'))
          ELSE 
            COALESCE(m.name, 'Unknown Meter')
        END as favorite_name
      FROM public.favorite f
      LEFT JOIN public.meter m ON f.id1 = m.meter_id AND m.tenant_id = $1
      LEFT JOIN public.meter_element me ON f.id1 = me.meter_id AND f.id2 = me.meter_element_id AND me.tenant_id = $1
      WHERE f.tenant_id = $1 AND f.users_id = $2
    `;
    const params = [tenant_id, users_id];

    if (table_name) {
      query += ' AND f.table_name = $3';
      params.push(table_name);
    }

    query += ' ORDER BY f.favorite_id DESC';

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'Failed to fetch favorites',
      error: errorMessage,
    });
  }
});

/**
 * POST /api/favorites
 * Create a new favorite
 * Body: { tenant_id, users_id, table_name, id1 (meter_id), id2 (meter_element_id) }
 */
router.post('/', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Database connection not available',
      });
    }

    const { tenant_id, users_id, table_name, id1, id2 } = req.body;
    const id2Value = id2 !== undefined && id2 !== null ? parseInt(id2, 10) : 0;

    console.log('[favorites.POST] Request body:', req.body);
    console.log('[favorites.POST] Extracted values - tenant_id:', tenant_id, 'users_id:', users_id, 'table_name:', table_name, 'id1:', id1, 'id2 (raw):', id2, 'id2Value (parsed):', id2Value);

    if (!users_id || !table_name || !id1) {
      return res.status(400).json({
        success: false,
        message: 'users_id, table_name, and id1 (meter_id) are required',
      });
    }

    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        message: 'tenant_id is required',
      });
    }

    // Check if favorite already exists
    const existingResult = await db.query(
      'SELECT * FROM public.favorite WHERE tenant_id = $1 AND users_id = $2 AND table_name = $3 AND id1 = $4 AND id2 = $5',
      [tenant_id, users_id, table_name, id1, id2Value]
    );

    if (existingResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Favorite already exists',
        data: existingResult.rows[0],
      });
    }

    // Insert new favorite
    const result = await db.query(
      'INSERT INTO public.favorite (tenant_id, users_id, table_name, id1, id2) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [tenant_id, users_id, table_name, id1, id2Value]
    );

    console.log('[favorites.POST] Inserted favorite with id2:', id2Value, 'Result:', result.rows[0]);

    res.status(201).json({
      success: true,
      message: 'Favorite created successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating favorite:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'Failed to create favorite',
      error: errorMessage,
    });
  }
});

/**
 * DELETE /api/favorites/:favoriteId
 * Delete a favorite by ID
 * Query params: tenant_id
 */
router.delete('/:favoriteId', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Database connection not available',
      });
    }

    const { favoriteId } = req.params;
    const { tenant_id } = req.query;

    if (!favoriteId) {
      return res.status(400).json({
        success: false,
        message: 'favoriteId is required',
      });
    }

    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        message: 'tenant_id is required',
      });
    }

    const result = await db.query(
      'DELETE FROM public.favorite WHERE favorite_id = $1 AND tenant_id = $2 RETURNING *',
      [favoriteId, tenant_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found',
      });
    }

    res.json({
      success: true,
      message: 'Favorite deleted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting favorite:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'Failed to delete favorite',
      error: errorMessage,
    });
  }
});

module.exports = router;
