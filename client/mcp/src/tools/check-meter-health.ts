import { db } from '../database/client.js';
import { logger } from '../utils/logger.js';

interface CheckMeterHealthArgs {
  // No required arguments - checks all active meters
}

interface MeterElementRow {
  meter_id: string;
  meter_name: string;
  tenant_id: string;
  meter_element_id: string;
  element_name: string;
  last_reading_at: Date | null;
  latest_kwh: number | null;
  latest_kw: number | null;
}

interface HealthIssue {
  meter_id: string;
  meter_name: string;
  tenant_id: string;
  meter_element_id: string;
  element_name: string;
  issue_type: 'stale' | 'all_zero';
  last_reading_at: string | null;
}

/**
 * Check meter health for all active meters and elements.
 * Identifies stale readings (no update in past 2 hours) and all-zero readings (kwh=0 AND kw=0).
 * Automatically creates notifications for new issues, skipping duplicates.
 */
export async function checkMeterHealth(_args: CheckMeterHealthArgs) {
  logger.info('Executing check_meter_health tool');

  try {
    const healthQuery = `
      WITH latest_readings AS (
        SELECT DISTINCT ON (meter_id, meter_element_id)
          meter_id, meter_element_id, kwh, kw, created_at
        FROM meter_reading
        ORDER BY meter_id, meter_element_id, created_at DESC
      )
      SELECT
        m.meter_id, m.name as meter_name, m.tenant_id,
        me.meter_element_id, me.name as element_name,
        lr.created_at as last_reading_at,
        lr.kwh as latest_kwh, lr.kw as latest_kw
      FROM meter m
      INNER JOIN meter_element me ON me.meter_id = m.meter_id
      LEFT JOIN latest_readings lr ON lr.meter_id = m.meter_id AND lr.meter_element_id = me.meter_element_id
      WHERE m.active = true
      ORDER BY m.meter_id, me.meter_element_id
    `;

    const result = await db.query<MeterElementRow>(healthQuery, []);

    const issues: HealthIssue[] = [];
    let notificationsCreated = 0;
    let notificationsSkipped = 0;

    for (const row of result.rows) {
      const isStale =
        row.last_reading_at === null ||
        new Date(row.last_reading_at) < new Date(Date.now() - 2 * 60 * 60 * 1000);

      const isAllZero =
        !isStale &&
        row.latest_kwh !== null &&
        row.latest_kw !== null &&
        Number(row.latest_kwh) === 0 &&
        Number(row.latest_kw) === 0;

      if (isStale) {
        issues.push({
          meter_id: String(row.meter_id),
          meter_name: row.meter_name,
          tenant_id: String(row.tenant_id),
          meter_element_id: String(row.meter_element_id),
          element_name: row.element_name,
          issue_type: 'stale',
          last_reading_at: row.last_reading_at ? new Date(row.last_reading_at).toISOString() : null,
        });

        const created = await upsertNotification({
          tenant_id: row.tenant_id,
          meter_id: row.meter_id,
          meter_element_id: row.meter_element_id,
          notification_type: 'stale',
          severity: 'error',
          title: `Meter ${row.meter_name} element ${row.element_name} – No recent readings`,
          description: row.last_reading_at
            ? `Last reading was at ${new Date(row.last_reading_at).toISOString()}`
            : 'No readings have ever been recorded',
        });
        if (created) notificationsCreated++; else notificationsSkipped++;
      }

      if (isAllZero) {
        issues.push({
          meter_id: String(row.meter_id),
          meter_name: row.meter_name,
          tenant_id: String(row.tenant_id),
          meter_element_id: String(row.meter_element_id),
          element_name: row.element_name,
          issue_type: 'all_zero',
          last_reading_at: row.last_reading_at ? new Date(row.last_reading_at).toISOString() : null,
        });

        const created = await upsertNotification({
          tenant_id: row.tenant_id,
          meter_id: row.meter_id,
          meter_element_id: row.meter_element_id,
          notification_type: 'all_zero',
          severity: 'warning',
          title: `Meter ${row.meter_name} element ${row.element_name} – Zero energy readings`,
          description: 'Latest reading shows both kWh and kW at zero',
        });
        if (created) notificationsCreated++; else notificationsSkipped++;
      }
    }

    const summary = {
      total_issues: issues.length,
      stale_count: issues.filter((i) => i.issue_type === 'stale').length,
      all_zero_count: issues.filter((i) => i.issue_type === 'all_zero').length,
      notifications_created: notificationsCreated,
      notifications_skipped: notificationsSkipped,
    };

    logger.info('check_meter_health completed', summary);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: true, issues, summary }, null, 2),
        },
      ],
    };
  } catch (error) {
    logger.error('check_meter_health error', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

interface NotificationInput {
  tenant_id: string;
  meter_id: string;
  meter_element_id: string;
  notification_type: string;
  severity: string;
  title: string;
  description: string;
}

/**
 * Insert a notification only if one doesn't already exist for
 * the same tenant + meter + element + type combination.
 * Returns true if created, false if skipped.
 */
async function upsertNotification(n: NotificationInput): Promise<boolean> {
  try {
    const existing = await db.query(
      `SELECT notification_id FROM notification
       WHERE tenant_id = $1
         AND notification_type = $2
         AND (meter_id IS NOT DISTINCT FROM $3)
         AND (meter_element_id IS NOT DISTINCT FROM $4)
       LIMIT 1`,
      [n.tenant_id, n.notification_type, n.meter_id, n.meter_element_id]
    );

    if (existing.rows.length > 0) {
      return false;
    }

    await db.query(
      `INSERT INTO notification
         (tenant_id, meter_id, meter_element_id, notification_type, severity, title, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [n.tenant_id, n.meter_id, n.meter_element_id, n.notification_type, n.severity, n.title, n.description]
    );

    logger.info('Notification created', {
      tenant_id: n.tenant_id,
      meter_id: n.meter_id,
      notification_type: n.notification_type,
    });
    return true;
  } catch (error) {
    logger.error('Failed to upsert notification', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
