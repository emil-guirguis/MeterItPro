/**
 * AI Search Routes
 * Natural language search for devices and meters
 * Endpoint: POST /api/ai/search
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * @typedef {Object} Device
 * @property {string} id
 * @property {string} tenantId
 * @property {string} name
 * @property {string} type
 * @property {string} location
 * @property {string} status
 * @property {any} metadata
 */

/**
 * @typedef {Object} Meter
 * @property {string} id
 * @property {string} tenantId
 * @property {string} deviceId
 * @property {string} name
 * @property {string} unit
 * @property {string} type
 */

/**
 * @typedef {Object} Reading
 * @property {string} meterId
 * @property {number} value
 * @property {string} timestamp
 * @property {string} quality
 */

/**
 * POST /api/ai/search
 * Natural language search for devices and meters
 * 
 * Request body:
 * {
 *   query: string (natural language query)
 *   limit?: number (default: 20)
 *   offset?: number (default: 0)
 * }
 * 
 * Response:
 * {
 *   success: boolean
 *   data: {
 *     results: SearchResult[]
 *     total: number
 *     clarifications?: string[]
 *     executionTime: number
 *   }
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { query, limit = 20, offset = 0 } = req.body;
    const tenantId = req.tenantId;

    // Validate input
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      console.warn('⚠️ [AI_SEARCH] Invalid query parameter');
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUERY',
          message: 'Query is required and must be a non-empty string',
        },
      });
    }

    // Validate limit parameter
    if (!Number.isInteger(limit) || limit <= 0) {
      console.warn('⚠️ [AI_SEARCH] Invalid limit parameter:', limit);
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_LIMIT',
          message: 'Limit must be a positive integer',
        },
      });
    }

    // Validate offset parameter
    if (!Number.isInteger(offset) || offset < 0) {
      console.warn('⚠️ [AI_SEARCH] Invalid offset parameter:', offset);
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OFFSET',
          message: 'Offset must be a non-negative integer',
        },
      });
    }

    if (!tenantId) {
      console.error('❌ [AI_SEARCH] Missing tenant ID in request context');
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TENANT',
          message: 'Tenant ID is required',
        },
      });
    }

    console.log(`🔍 [AI_SEARCH] Searching for: "${query}" (tenant: ${tenantId}, limit: ${limit}, offset: ${offset})`);

    const startTime = Date.now();

    // Get all devices for the tenant
    const devicesResult = await db.query(
      `SELECT device_id as id, tenant_id as "tenantId", name, type, location, status, metadata
       FROM public.device
       WHERE tenant_id = $1
       ORDER BY name ASC`,
      [tenantId]
    );

    // @ts-ignore - db.query returns any[][], but we know the shape from the SQL query
    const devices = devicesResult.rows || [];

    if (devices.length === 0) {
      console.log(`ℹ️ [AI_SEARCH] No devices found for tenant: ${tenantId}`);
      return res.status(200).json({
        success: true,
        data: {
          results: [],
          total: 0,
          clarifications: [],
          executionTime: Date.now() - startTime,
        },
      });
    }

    // Get all meters for the tenant
    const metersResult = await db.query(
      `SELECT meter_id as id, tenant_id as "tenantId", device_id as "deviceId", name, unit, type
       FROM public.meter
       WHERE tenant_id = $1`,
      [tenantId]
    );

    // @ts-ignore - db.query returns any[][], but we know the shape from the SQL query
    const meters = metersResult.rows || [];

    // Get recent readings for all meters
    const readingsResult = await db.query(
      `SELECT mr.meter_id as "meterId", mr.value, mr.timestamp, mr.quality
       FROM public.meter_reading mr
       WHERE mr.tenant_id = $1
       AND mr.timestamp >= NOW() - INTERVAL '30 days'
       ORDER BY mr.meter_id, mr.timestamp DESC`,
      [tenantId]
    );

    // @ts-ignore - db.query returns any[][], but we know the shape from the SQL query
    const readings = readingsResult.rows || [];

    // Build readings map by device
    const readingsByDevice = new Map();
    devices.forEach((device) => {
      const deviceReadings = readings.filter((r) => {
        // @ts-ignore - r has meterId from SQL query
        const meter = meters.find((m) => m.id === r.meterId);
        // @ts-ignore - meter and device have id from SQL query
        return meter && meter.deviceId === device.id;
      });
      // @ts-ignore - device has id from SQL query
      readingsByDevice.set(device.id, deviceReadings || []);
    });

    // Perform simple keyword-based search (fallback if AI service unavailable)
    const queryLower = query.toLowerCase();
    const searchResults = performKeywordSearch(
      devices,
      meters,
      readingsByDevice,
      queryLower,
      limit,
      offset
    );

    const executionTime = Date.now() - startTime;

    console.log(`✅ [AI_SEARCH] Search completed in ${executionTime}ms, returned ${searchResults.length} results`);

    return res.status(200).json({
      success: true,
      data: {
        results: searchResults,
        total: devices.length,
        clarifications: [],
        executionTime,
      },
    });
  } catch (error) {
    console.error('❌ [AI_SEARCH] Error:', error instanceof Error ? error.message : String(error));
    console.error('❌ [AI_SEARCH] Stack:', error instanceof Error ? error.stack : 'No stack trace');

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while processing your search',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
      },
    });
  }
});

/**
 * Performs keyword-based search on devices
 * This is a fallback implementation until full AI service is integrated
 * 
 * Scoring algorithm:
 * - Exact name match: +10 points
 * - Partial name match: +5 points
 * - Type match: +3 points
 * - Location match: +2 points
 * - Status match: +1 point
 */
function performKeywordSearch(devices, meters, readingsByDevice, query, limit, offset) {
  const results = [];

  // Score each device based on keyword matches
  const scoredDevices = devices
    .map((device) => {
      let score = 0;

      // Match device name (exact and partial)
      const deviceNameLower = device.name.toLowerCase();
      if (deviceNameLower === query) {
        // Exact match
        score += 10;
      } else if (deviceNameLower.includes(query)) {
        // Partial match
        score += 5;
      }

      // Match device type
      if (device.type && device.type.toLowerCase().includes(query)) {
        score += 3;
      }

      // Match location
      if (device.location && device.location.toLowerCase().includes(query)) {
        score += 2;
      }

      // Match status
      if (device.status && device.status.toLowerCase().includes(query)) {
        score += 1;
      }

      return { device, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  // Build results
  for (let i = offset; i < Math.min(offset + limit, scoredDevices.length); i++) {
    const { device, score } = scoredDevices[i];
    const deviceReadings = readingsByDevice.get(device.id) || [];

    // Get latest reading or use placeholder data for devices without readings
    let latestReading;
    if (deviceReadings.length > 0) {
      latestReading = deviceReadings[0];
    } else {
      // Placeholder data for devices without readings
      latestReading = {
        value: 0,
        timestamp: new Date().toISOString(),
      };
    }

    // Normalize score to 0-1 range
    const normalizedScore = Math.min(score / 10, 1.0);

    results.push({
      id: device.id,
      name: device.name,
      type: 'device',
      location: device.location || 'Unknown',
      currentConsumption: latestReading.value || 0,
      unit: 'kWh',
      status: device.status || 'unknown',
      relevanceScore: normalizedScore,
      lastReading: {
        value: latestReading.value || 0,
        timestamp: latestReading.timestamp || new Date().toISOString(),
      },
    });
  }

  return results;
}

module.exports = router;
