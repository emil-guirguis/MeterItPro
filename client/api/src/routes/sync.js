const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateSyncServer } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

/**
 * Helper function to log SQL queries
 */
const logQuery = (query, params = []) => {
  console.log('\n=== SQL QUERY ===');
  console.log('Query:', query);
  if (params && params.length > 0) {
    console.log('Parameters:', params);
  }
  console.log('==================\n');
};


/**
 * POST /api/sync/readings/batch
 * Upload batch meter readings from Sync MCP
 * 
 * Accepts readings collected from BACnet devices and stores them in the client database.
 * Each reading is inserted into the meter_reading table with the tenant_id from the authenticated request.
 * 
 * Request body:
 * {
 *   "readings": [
 *     {
 *       "meter_id": 123,
 *       "timestamp": "2024-01-17T10:30:00Z",
 *       "data_point": "field_name",
 *       "value": 42.5,
 *       "unit": "kWh"
 *     }
 *   ]
 * }
 */
router.post(
  '/readings/batch',
  authenticateSyncServer,
  [
    body('readings').isArray().withMessage('Readings must be an array'),
    body('readings.*.meter_id').isNumeric().withMessage('meter_id must be numeric'),
    body('readings.*.meter_element_id').optional().isNumeric().withMessage('meter_element_id must be numeric'),
    body('readings.*.active_energy').optional().isNumeric().withMessage('active_energy must be numeric'),
    body('readings.*.active_energy_export').optional().isNumeric().withMessage('active_energy_export must be numeric'),
    body('readings.*.apparent_energy').optional().isNumeric().withMessage('apparent_energy must be numeric'),
    body('readings.*.apparent_energy_export').optional().isNumeric().withMessage('apparent_energy_export must be numeric'),
    body('readings.*.apparent_power').optional().isNumeric().withMessage('apparent_power must be numeric'),
    body('readings.*.apparent_power_phase_a').optional().isNumeric().withMessage('apparent_power_phase_a must be numeric'),
    body('readings.*.apparent_power_phase_b').optional().isNumeric().withMessage('apparent_power_phase_b must be numeric'),
    body('readings.*.apparent_power_phase_c').optional().isNumeric().withMessage('apparent_power_phase_c must be numeric'),
    body('readings.*.current').optional().isNumeric().withMessage('current must be numeric'),
    body('readings.*.current_line_a').optional().isNumeric().withMessage('current_line_a must be numeric'),
    body('readings.*.current_line_b').optional().isNumeric().withMessage('current_line_b must be numeric'),
    body('readings.*.current_line_c').optional().isNumeric().withMessage('current_line_c must be numeric'),
    body('readings.*.frequency').optional().isNumeric().withMessage('frequency must be numeric'),
    body('readings.*.maximum_demand_real').optional().isNumeric().withMessage('maximum_demand_real must be numeric'),
    body('readings.*.power').optional().isNumeric().withMessage('power must be numeric'),
    body('readings.*.power_factor').optional().isNumeric().withMessage('power_factor must be numeric'),
    body('readings.*.power_factor_phase_a').optional().isNumeric().withMessage('power_factor_phase_a must be numeric'),
    body('readings.*.power_factor_phase_b').optional().isNumeric().withMessage('power_factor_phase_b must be numeric'),
    body('readings.*.power_factor_phase_c').optional().isNumeric().withMessage('power_factor_phase_c must be numeric'),
    body('readings.*.power_phase_a').optional().isNumeric().withMessage('power_phase_a must be numeric'),
    body('readings.*.power_phase_b').optional().isNumeric().withMessage('power_phase_b must be numeric'),
    body('readings.*.power_phase_c').optional().isNumeric().withMessage('power_phase_c must be numeric'),
    body('readings.*.reactive_energy').optional().isNumeric().withMessage('reactive_energy must be numeric'),
    body('readings.*.reactive_energy_export').optional().isNumeric().withMessage('reactive_energy_export must be numeric'),
    body('readings.*.reactive_power').optional().isNumeric().withMessage('reactive_power must be numeric'),
    body('readings.*.reactive_power_phase_a').optional().isNumeric().withMessage('reactive_power_phase_a must be numeric'),
    body('readings.*.reactive_power_phase_b').optional().isNumeric().withMessage('reactive_power_phase_b must be numeric'),
    body('readings.*.reactive_power_phase_c').optional().isNumeric().withMessage('reactive_power_phase_c must be numeric'),
    body('readings.*.voltage_a_b').optional().isNumeric().withMessage('voltage_a_b must be numeric'),
    body('readings.*.voltage_a_n').optional().isNumeric().withMessage('voltage_a_n must be numeric'),
    body('readings.*.voltage_b_c').optional().isNumeric().withMessage('voltage_b_c must be numeric'),
    body('readings.*.voltage_b_n').optional().isNumeric().withMessage('voltage_b_n must be numeric'),
    body('readings.*.voltage_c_a').optional().isNumeric().withMessage('voltage_c_a must be numeric'),
    body('readings.*.voltage_c_n').optional().isNumeric().withMessage('voltage_c_n must be numeric'),
    body('readings.*.voltage_p_n').optional().isNumeric().withMessage('voltage_p_n must be numeric'),
    body('readings.*.voltage_p_p').optional().isNumeric().withMessage('voltage_p_p must be numeric'),
    body('readings.*.voltage_thd').optional().isNumeric().withMessage('voltage_thd must be numeric'),
    body('readings.*.voltage_thd_phase_a').optional().isNumeric().withMessage('voltage_thd_phase_a must be numeric'),
    body('readings.*.voltage_thd_phase_b').optional().isNumeric().withMessage('voltage_thd_phase_b must be numeric'),
    body('readings.*.voltage_thd_phase_c').optional().isNumeric().withMessage('voltage_thd_phase_c must be numeric')
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('❌ [Sync] Validation errors:', errors.array());
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const { readings } = req.body;
      const tenantId = parseInt(req.tenantId, 10);

      if (!readings || readings.length === 0) {
        console.warn('⚠️  [Sync] No readings provided in batch upload');
        return res.status(400).json({
          success: false,
          message: 'No readings provided'
        });
      }

      console.log(`📥 [Sync] Received batch upload with ${readings.length} readings for tenant ${tenantId}`);

      // Process readings in a transaction with savepoints
      const result = await db.transaction(async (client) => {
        let insertedCount = 0;
        let skippedCount = 0;
        const insertErrors = [];

        for (let i = 0; i < readings.length; i++) {
          const reading = readings[i];
          const savepointName = `sp_${i}`;
          
          try {
            // Create savepoint for this reading
            await client.query(`SAVEPOINT ${savepointName}`);
            
            // // Validate meter exists before insert
            // const meterCheckQuery = `
            //   SELECT meter_id FROM meter 
            //   WHERE meter_id = $1 AND tenant_id = $2
            // `;
            // const meterCheckParams = [parseInt(reading.meter_id, 10), tenantId];
            // logQuery(meterCheckQuery, meterCheckParams);
            // const meterCheckResult = await client.query(meterCheckQuery, meterCheckParams);
            
            // if (meterCheckResult.rows.length === 0) {
            //   throw new Error(`Meter ${reading.meter_id} not found for tenant ${tenantId}`);
            // }
            
            // Insert meter reading with all provided fields
            const readingQuery = `
              INSERT INTO meter_reading (
                tenant_id, meter_id, created_at, sync_status,
                active_energy, active_energy_export, apparent_energy, apparent_energy_export,
                apparent_power, apparent_power_phase_a, apparent_power_phase_b, apparent_power_phase_c,
                current, current_line_a, current_line_b, current_line_c,
                frequency, maximum_demand_real, power, power_factor,
                power_factor_phase_a, power_factor_phase_b, power_factor_phase_c,
                power_phase_a, power_phase_b, power_phase_c,
                reactive_energy, reactive_energy_export, reactive_power,
                reactive_power_phase_a, reactive_power_phase_b, reactive_power_phase_c,
                voltage_a_b, voltage_a_n, voltage_b_c, voltage_b_n,
                voltage_c_a, voltage_c_n, voltage_p_n, voltage_p_p,
                voltage_thd, voltage_thd_phase_a, voltage_thd_phase_b, voltage_thd_phase_c,
                meter_element_id
              )
              VALUES (
                $1, $2, $3, $4,
                $5, $6, $7, $8,
                $9, $10, $11, $12,
                $13, $14, $15, $16,
                $17, $18, $19, $20,
                $21, $22, $23,
                $24, $25, $26,
                $27, $28, $29,
                $30, $31, $32,
                $33, $34, $35, $36,
                $37, $38, $39, $40,
                $41, $42, $43, $44,
                $45
              )
              RETURNING meter_reading_id
            `;
            const readingParams = [
              tenantId,
              parseInt(reading.meter_id, 10),
              new Date(),
              'pending',
              reading.active_energy ?? null,
              reading.active_energy_export ?? null,
              reading.apparent_energy ?? null,
              reading.apparent_energy_export ?? null,
              reading.apparent_power ?? null,
              reading.apparent_power_phase_a ?? null,
              reading.apparent_power_phase_b ?? null,
              reading.apparent_power_phase_c ?? null,
              reading.current ?? null,
              reading.current_line_a ?? null,
              reading.current_line_b ?? null,
              reading.current_line_c ?? null,
              reading.frequency ?? null,
              reading.maximum_demand_real ?? null,
              reading.power ?? null,
              reading.power_factor ?? null,
              reading.power_factor_phase_a ?? null,
              reading.power_factor_phase_b ?? null,
              reading.power_factor_phase_c ?? null,
              reading.power_phase_a ?? null,
              reading.power_phase_b ?? null,
              reading.power_phase_c ?? null,
              reading.reactive_energy ?? null,
              reading.reactive_energy_export ?? null,
              reading.reactive_power ?? null,
              reading.reactive_power_phase_a ?? null,
              reading.reactive_power_phase_b ?? null,
              reading.reactive_power_phase_c ?? null,
              reading.voltage_a_b ?? null,
              reading.voltage_a_n ?? null,
              reading.voltage_b_c ?? null,
              reading.voltage_b_n ?? null,
              reading.voltage_c_a ?? null,
              reading.voltage_c_n ?? null,
              reading.voltage_p_n ?? null,
              reading.voltage_p_p ?? null,
              reading.voltage_thd ?? null,
              reading.voltage_thd_phase_a ?? null,
              reading.voltage_thd_phase_b ?? null,
              reading.voltage_thd_phase_c ?? null,
              reading.meter_element_id ?? null
            ];
            
            logQuery(readingQuery, readingParams);
            const insertResult = await client.query(readingQuery, readingParams);
            
            console.log(`📊 [Sync] INSERT result - rowCount: ${insertResult.rowCount}, rows: ${JSON.stringify(insertResult.rows)}`);
            
            // Verify the data was actually inserted by querying it back
            if (insertResult.rowCount > 0) {
              const verifyQuery = `SELECT meter_reading_id, meter_id, tenant_id, created_at FROM meter_reading WHERE meter_reading_id = $1`;
              const verifyResult = await client.query(verifyQuery, [insertResult.rows[0].meter_reading_id]);
              console.log(`✅ [Sync] Verification query result:`, JSON.stringify(verifyResult.rows[0]));
            }
            
            // Release savepoint on success
            await client.query(`RELEASE SAVEPOINT ${savepointName}`);
            
            if (insertResult.rowCount > 0) {
              insertedCount++;
              console.log(`✅ [Sync] Inserted reading for meter ${reading.meter_id} - ID: ${insertResult.rows[0]?.meter_reading_id}`);
            } else {
              skippedCount++;
              console.warn(`⚠️  [Sync] Failed to insert reading for meter ${reading.meter_id} - rowCount was 0`);
            }
          } catch (error) {
            // Rollback to savepoint (not entire transaction)
            try {
              await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
            } catch (rollbackError) {
              console.warn(`⚠️  [Sync] Savepoint rollback warning:`, rollbackError);
            }
            
            console.error(`❌ [Sync] Error inserting reading for meter ${reading.meter_id}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorObj = error || {};
            const errorDetail = errorObj['detail'] || '';
            const errorCode = errorObj['code'] || '';
            console.error(`❌ [Sync] Error details - Code: ${errorCode}, Detail: ${errorDetail}`);
            insertErrors.push({
              meter_id: reading.meter_id,
              data_point: reading.data_point,
              error: errorMessage,
              code: errorCode,
              detail: errorDetail
            });
            skippedCount++;
          }
        }

        return { insertedCount, skippedCount, insertErrors };
      });

      console.log(`📊 [Sync] Batch upload completed: ${result.insertedCount} inserted, ${result.skippedCount} skipped`);
      console.log(`📊 [Sync] Transaction result:`, JSON.stringify(result, null, 2));

      // Verify data in database after transaction
      try {
        const countResult = await db.query('SELECT COUNT(*) as count FROM meter_reading WHERE tenant_id = $1', [parseInt(req.tenantId, 10)]);
        const countRow = countResult.rows[0];
        console.log(`📊 [Sync] Total readings in database for tenant ${req.tenantId}: ${countRow ? countRow['count'] : 'unknown'}`);
      } catch (verifyError) {
        console.error('❌ [Sync] Failed to verify data in database:', verifyError);
      }

      res.json({
        success: true,
        recordsProcessed: result.insertedCount,
        message: `Batch upload completed: ${result.insertedCount} inserted, ${result.skippedCount} skipped`,
        inserted: result.insertedCount,
        skipped: result.skippedCount,
        errors: result.insertErrors
      });
    } catch (error) {
      console.error('❌ [Sync] Batch upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({
        success: false,
        recordsProcessed: 0,
        message: 'Batch upload error',
        error: errorMessage
      });
    }
  }
);


/**
 * GET /api/sync/getmeters  
 * Download get meters for Sync
 */
router.get('/getmeters', authenticateSyncServer, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const sql = `select m.meter_id, m.device_id, m.ip, m.port, m.active ,  
                me.meter_element_id, me.element, me.name as name 
                 from meter m
                 	  join meter_element me on me.meter_id = m.meter_id
                 where m.tenant_id = $1`;

    const params = [tenantId];
    logQuery(sql, params);
    const result = await db.query(sql, params);

    const meter = result.rows[0];
    if (!meter) {
      return res.status(404).json({
        success: false,
        message: 'meter not found'
      });
    }

    const meters = result.rows || [];

    res.json({
      success: true,
      config: {
        site: {
          id: meter['meter_id'],
          ip: meter['ip']
        },
        meters: meters.map(meter => ({
          meter_id: meter['meter_id'],
          device_id: meter['device_id'],
          ip: meter['ip'],
          port: meter['port'],
          element: meter['element'],
          active: meter['active']
        })),
        sync_interval_minutes: 5,
        batch_size: 1000
      }
    });
  } catch (error) {
    console.error('Meter download error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'Meter  download error',
      error: errorMessage
    });
  }
});


/**
 * GET /api/sync/getmregisters
 * Download get registers for Sync
 */
router.get('/getmregisters', authenticateSyncServer, async (req, res) => {
  try {
    const deviceId = req.deviceId;
    const sql = `select dr.device_id, register, field_name
                 from register r 
                    join device_register dr on dr.register_id = r.register_id 
                 where dr.device_id = $1`;

    const params = [deviceId];
    logQuery(sql, params);
    const result = await db.query(sql, params);

    const register = result.rows[0];
    if (!register) {
      return res.status(404).json({
        success: false,
        message: 'register not found'
      });
    }

    const registers = result.rows || [];

    res.json({
      success: true,
      config: {
        register: {
          id: register['id'],
          name: register['name']
        },
        registers: registers.map(register => ({
          device_id: register['device_id'],
          register: register['register'],
          field_name: register['field_name'],
        })),
        sync_interval_minutes: 5,
        batch_size: 1000
      }
    });
  } catch (error) {
    console.error('register download error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'register  download error',
      error: errorMessage
    });
  }
});

/**
 * POST /api/sync/trigger-upload
 * Manually trigger meter reading upload from frontend
 * 
 * This endpoint is called from the frontend to manually trigger an upload
 * of collected meter readings to the remote client system.
 */
router.post('/trigger-upload', async (req, res) => {
  try {
    console.log('📤 [Sync] Manual upload triggered from frontend');
    
    // This is a placeholder response - in a real implementation,
    // this would communicate with the sync MCP system to trigger the upload
    // For now, we'll just return a success message
    
    res.json({
      success: true,
      message: 'Upload triggered successfully. Check the sync system logs for details.'
    });
  } catch (error) {
    console.error('❌ [Sync] Failed to trigger upload:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'Failed to trigger upload',
      error: errorMessage
    });
  }
});

module.exports = router;
