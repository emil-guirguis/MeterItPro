import { db } from '../database/client.js';
import { logger } from '../utils/logger.js';

interface GetTenantStatusArgs {
  tenant_id?: number;
  include_inactive?: boolean;
}

interface TenantRow {
  tenant_id: number;
  name: string;
  is_active: boolean;
  created_at: Date;
  meter_count: number;
  last_reading_timestamp: Date | null;
}

export async function getTenantStatus(args: GetTenantStatusArgs) {
  logger.info('Executing get_tenant_status tool', { args });

  try {
    // Build query with filters
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (args.tenant_id !== undefined) {
      conditions.push(`t.tenant_id = $${paramIndex++}`);
      params.push(args.tenant_id);
    }

    if (!args.include_inactive) {
      conditions.push(`m.active = $${paramIndex++}`);
      params.push(true);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        t.tenant_id,
        t.name,
        t.active,
        t.created_at,
        COUNT(DISTINCT m.meter_id) as meter_count,
        MAX(mr.timestamp) as last_reading_timestamp
      FROM tenant t
      LEFT JOIN meter m ON t.tenant_id = m.tenant_id
      LEFT JOIN meter_reading mr ON m.meter_id = mr.meter_id
      ${whereClause}
      GROUP BY t.tenant_id, t.name, t.active, t.created_at
      ORDER BY t.name
    `;

    const result = await db.query<TenantRow>(query, params);

    const tenants = result.rows.map(row => ({
      tenant_id: row.tenant_id,
      name: row.name,
      is_active: row.is_active,
      created_at: row.created_at,
      meter_count: parseInt(row.meter_count as any, 10),
      last_reading_timestamp: row.last_reading_timestamp,
    }));

    logger.info('get_tenant_status completed', { count: tenants.length });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            count: tenants.length,
            tenants,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error('get_tenant_status error', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw error;
  }
}
