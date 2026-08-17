import { db } from '../database/client.js';
import { logger } from '../utils/logger.js';

interface QueryMetersArgs {
  tenant_id?: number;
  meter_id?: number;
  is_active?: boolean;
}

interface MeterRow {
  tenant_id: number;
  meter_id: number;
  meter_name: string;
  device_id: number | null;
  ip: string | null;
  port: string | null;
  meter_created_at: Date;
  last_reading_timestamp: Date | null;
}

export async function queryMeters(args: QueryMetersArgs) {
  logger.info('Executing query_meters tool', { args });

  try {
    // Build query with filters
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (args.tenant_id !== undefined) {
      conditions.push(`m.tenant_id = $${paramIndex++}`);
      params.push(args.tenant_id);
    }

    if (args.meter_id !== undefined) {
      conditions.push(`m.id = $${paramIndex++}`);
      params.push(args.meter_id);
    }

    if (args.is_active !== undefined) {
      conditions.push(`m.active = $${paramIndex++}`);
      params.push(args.is_active);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        m.meter_id,
        m.name as meter_name,
        m.device_id,
        m.ip,
        m.port,
        m.active,
        m.tenant_id,
        m.created_at as meter_created_at,
        (
          SELECT MAX(timestamp) 
          FROM meter_reading mr 
          WHERE mr.meter_id = m.meter_id
        ) as last_reading_timestamp
      FROM meter m
      ${whereClause}
      ORDER BY m.name
    `;

    const result = await db.query<MeterRow>(query, params);

    const meters = result.rows.map(row => ({
      meter: {
        id: row.meter_id,
        tenant_id: row.tenant_id,
        name: row.meter_name,
        device_id: row.device_id,
        ip: row.ip,
        port: row.port,
        created_at: row.meter_created_at,
        last_reading_timestamp: row.last_reading_timestamp,
      },
    }));

    logger.info('query_meters completed', { count: meters.length });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            count: meters.length,
            meters,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error('query_meters error', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw error;
  }
}
