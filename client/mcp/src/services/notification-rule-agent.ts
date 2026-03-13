import nodemailer from 'nodemailer';
import { db } from '../database/client.js';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';

interface NotificationRule {
  notification_rule_id: string;
  tenant_id: string;
  name: string;
  rule_type: string;
  threshold_hours: number | null;
  schedule_cron: string;
}

/** A (meter_id, meter_element_id) pair with the display name built the same way as favorites */
interface MeterElementPair {
  meter_id: string;
  meter_element_id: string;
  display_name: string; // "Meter Name    A-Phase"
}

export interface HourlyData {
  hour: string;
  label: string;
  count: number;
}

export class NotificationRuleAgent {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    try {
      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: { user: config.email.user, pass: config.email.password },
      });
    } catch (error) {
      logger.error('NotificationRuleAgent: failed to init email transporter', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ─── Public API ───────────────────────────────────────────────────────────────

  async loadActiveRules(): Promise<NotificationRule[]> {
    const result = await db.query<NotificationRule>(
      `SELECT notification_rule_id, tenant_id, name, rule_type, threshold_hours, schedule_cron
       FROM notification_rule
       WHERE active = true
       ORDER BY notification_rule_id ASC`
    );
    return result.rows;
  }

  async executeRule(rule: NotificationRule): Promise<void> {
    logger.info(`Executing notification rule: ${rule.name} (${rule.notification_rule_id}), type: ${rule.rule_type}`);
    try {
      if (rule.rule_type === 'meter_no_reading') {
        await this.checkMeterNoReading(rule);
      } else if (rule.rule_type === 'meter_zero_reading') {
        await this.checkMeterZeroReading(rule);
      } else {
        logger.debug(`Rule type '${rule.rule_type}' not handled by NotificationRuleAgent`);
      }
    } catch (error) {
      logger.error(`Failed to execute rule ${rule.notification_rule_id}`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ─── Meter helpers ────────────────────────────────────────────────────────────

  /**
   * Returns the (meter_id, meter_element_id) pairs targeted by the rule.
   * If the rule has no specific meters, returns every active (meter, element) for the tenant.
   * Name is built using the same pattern as favorites:
   *   CONCAT(meter.name, '    ', meter_element.element, '-', meter_element.name)
   */
  private async getRuleMeterElements(rule: NotificationRule): Promise<MeterElementPair[]> {
    const ruleMeters = await db.query<{ meter_id: string; meter_element_id: string | null }>(
      `SELECT meter_id, meter_element_id
       FROM notification_rule_meter
       WHERE notification_rule_id = $1`,
      [rule.notification_rule_id]
    );

    let pairs: Array<{ meter_id: string; meter_element_id: string }>;

    if (ruleMeters.rows.length > 0) {
      // Rule has explicit meters; resolve any rows where meter_element_id is NULL
      // to all elements of that meter
      const resolved: Array<{ meter_id: string; meter_element_id: string }> = [];
      for (const row of ruleMeters.rows) {
        if (row.meter_element_id) {
          resolved.push({ meter_id: row.meter_id, meter_element_id: row.meter_element_id });
        } else {
          // No element specified → expand to all elements for this meter
          const elements = await db.query<{ meter_element_id: string }>(
            `SELECT meter_element_id FROM meter_element WHERE meter_id = $1`,
            [row.meter_id]
          );
          for (const el of elements.rows) {
            resolved.push({ meter_id: row.meter_id, meter_element_id: el.meter_element_id });
          }
        }
      }
      pairs = resolved;
    } else {
      // No specific meters – check every active (meter, element) for the tenant
      const all = await db.query<{ meter_id: string; meter_element_id: string }>(
        `SELECT m.meter_id, me.meter_element_id
         FROM meter m
         JOIN meter_element me ON me.meter_id = m.meter_id
         WHERE m.tenant_id = $1 AND m.active = true`,
        [rule.tenant_id]
      );
      pairs = all.rows;
    }

    // Fetch display names in one query using the favorites naming pattern
    if (pairs.length === 0) return [];

    const placeholders = pairs
      .map((_, i) => `($${i * 2 + 1}::bigint, $${i * 2 + 2}::bigint)`)
      .join(', ');
    const flatParams = pairs.flatMap(p => [p.meter_id, p.meter_element_id]);

    const nameResult = await db.query<{
      meter_id: string;
      meter_element_id: string;
      display_name: string;
    }>(
      `SELECT
         m.meter_id,
         me.meter_element_id,
         CONCAT(
           COALESCE(m.name, 'Unknown Meter'),
           '    ',
           COALESCE(TRIM(me.element), '?'),
           '-',
           COALESCE(me.name, 'Unknown')
         ) AS display_name
       FROM (VALUES ${placeholders}) AS v(mid, meid)
       JOIN meter         m  ON m.meter_id          = v.mid
       JOIN meter_element me ON me.meter_element_id = v.meid`,
      flatParams
    );

    return nameResult.rows.map(r => ({
      meter_id: String(r.meter_id),
      meter_element_id: String(r.meter_element_id),
      display_name: r.display_name,
    }));
  }

  // ─── meter_no_reading ─────────────────────────────────────────────────────────

  private async checkMeterNoReading(rule: NotificationRule): Promise<void> {
    const thresholdHours = rule.threshold_hours ?? 24;
    const pairs = await this.getRuleMeterElements(rule);

    logger.info(`meter_no_reading: checking ${pairs.length} meter elements for rule ${rule.notification_rule_id}`);
    for (const pair of pairs) {
      await this.checkNoReadingForMeterElement(rule, pair, thresholdHours);
    }
  }

  private async checkNoReadingForMeterElement(
    rule: NotificationRule,
    pair: MeterElementPair,
    thresholdHours: number
  ): Promise<void> {
    // Count readings per hour for the threshold window, keyed on (meter_id, meter_element_id)
    const hourlyResult = await db.query<{ hour: Date; count: string }>(
      `SELECT date_trunc('hour', created_at) AS hour, COUNT(*) AS count
       FROM meter_reading
       WHERE meter_id = $1
         AND meter_element_id = $2
         AND created_at >= NOW() - ($3 || ' hours')::INTERVAL
       GROUP BY 1
       ORDER BY 1 ASC`,
      [pair.meter_id, pair.meter_element_id, thresholdHours]
    );

    // Build map: ISO-hour-prefix → count
    const hourlyMap = new Map<string, number>();
    for (const row of hourlyResult.rows) {
      hourlyMap.set(new Date(row.hour).toISOString().slice(0, 13), parseInt(row.count, 10));
    }

    // Generate all hour slots in the window
    const now = new Date();
    const hourlyData: HourlyData[] = [];
    for (let i = thresholdHours - 1; i >= 0; i--) {
      const slot = new Date(now);
      slot.setHours(slot.getHours() - i, 0, 0, 0);
      const key = slot.toISOString().slice(0, 13);
      hourlyData.push({
        hour: slot.toISOString(),
        label: slot.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        count: hourlyMap.get(key) ?? 0,
      });
    }

    const gapHours = hourlyData.filter(h => h.count === 0);
    if (gapHours.length === 0) {
      logger.info(`No gaps for ${pair.display_name}`);
      return;
    }

    const totalReadings = hourlyData.reduce((s, h) => s + h.count, 0);
    const description = JSON.stringify({
      summary: `Found ${gapHours.length} gap hour${gapHours.length !== 1 ? 's' : ''} in the last ${thresholdHours} hours`,
      hourly_data: hourlyData,
      gap_hours: gapHours.map(h => h.label),
      total_readings: totalReadings,
      threshold_hours: thresholdHours,
    });

    const title = `${pair.display_name} – ${gapHours.length} gap${gapHours.length !== 1 ? 's' : ''} in last ${thresholdHours}h`;

    // Replace existing notification for this (meter, element) pair so the chart stays current
    await db.query(
      `DELETE FROM notification
       WHERE tenant_id = $1 AND meter_id = $2 AND meter_element_id = $3 AND notification_type = 'meter_no_reading'`,
      [rule.tenant_id, pair.meter_id, pair.meter_element_id]
    );
    const insertResult = await db.query<{ notification_id: string }>(
      `INSERT INTO notification
         (tenant_id, meter_id, meter_element_id, notification_type, severity, title, description)
       VALUES ($1, $2, $3, 'meter_no_reading', 'warning', $4, $5)
       RETURNING notification_id`,
      [rule.tenant_id, pair.meter_id, pair.meter_element_id, title, description]
    );
    logger.info('meter_no_reading notification created', {
      notification_id: insertResult.rows[0]?.notification_id,
      meter: pair.display_name,
      gaps: gapHours.length,
    });

    const recipients = await this.getEmailRecipients(rule.notification_rule_id);
    if (recipients.length > 0) {
      await this.sendGapEmail(rule, pair.display_name, hourlyData, gapHours, recipients);
    }
  }

  // ─── meter_zero_reading ───────────────────────────────────────────────────────

  private async checkMeterZeroReading(rule: NotificationRule): Promise<void> {
    const thresholdHours = rule.threshold_hours ?? 24;
    const pairs = await this.getRuleMeterElements(rule);

    for (const pair of pairs) {
      await this.checkZeroReadingForMeterElement(rule, pair, thresholdHours);
    }
  }

  private async checkZeroReadingForMeterElement(
    rule: NotificationRule,
    pair: MeterElementPair,
    thresholdHours: number
  ): Promise<void> {
    const latestResult = await db.query<{ kwh: string; kw: string }>(
      `SELECT kwh, kw FROM meter_reading
       WHERE meter_id = $1
         AND meter_element_id = $2
         AND created_at >= NOW() - ($3 || ' hours')::INTERVAL
       ORDER BY created_at DESC LIMIT 1`,
      [pair.meter_id, pair.meter_element_id, thresholdHours]
    );

    if (latestResult.rows.length === 0) return;

    const { kwh, kw } = latestResult.rows[0];
    if (Number(kwh) !== 0 || Number(kw) !== 0) return;

    await db.query(
      `DELETE FROM notification
       WHERE tenant_id = $1 AND meter_id = $2 AND meter_element_id = $3 AND notification_type = 'meter_zero_reading'`,
      [rule.tenant_id, pair.meter_id, pair.meter_element_id]
    );
    await db.query(
      `INSERT INTO notification
         (tenant_id, meter_id, meter_element_id, notification_type, severity, title, description)
       VALUES ($1, $2, $3, 'meter_zero_reading', 'warning', $4, $5)`,
      [
        rule.tenant_id,
        pair.meter_id,
        pair.meter_element_id,
        `${pair.display_name} – Zero energy readings`,
        'Latest reading shows both kWh and kW at zero',
      ]
    );
    logger.info('meter_zero_reading notification created', { meter: pair.display_name });
  }

  // ─── Email helpers ────────────────────────────────────────────────────────────

  private async getEmailRecipients(ruleId: string): Promise<string[]> {
    const result = await db.query<{ email_address: string | null }>(
      `SELECT COALESCE(r.email_address, u.email) AS email_address
       FROM notification_rule_recipient r
       LEFT JOIN users u ON u.users_id = r.users_id
       WHERE r.notification_rule_id = $1 AND r.receive_email = true`,
      [ruleId]
    );
    return result.rows.map(r => r.email_address).filter((e): e is string => !!e);
  }

  private async sendGapEmail(
    rule: NotificationRule,
    displayName: string,
    hourlyData: HourlyData[],
    gapHours: HourlyData[],
    recipients: string[]
  ): Promise<void> {
    if (!this.transporter) {
      logger.warn('Email transporter not available – skipping gap email');
      return;
    }

    const html = this.buildGapEmailHtml(rule, displayName, hourlyData, gapHours);
    const subject = `Alert: ${displayName} – ${gapHours.length} missing reading${gapHours.length !== 1 ? 's' : ''} (last ${rule.threshold_hours ?? 24}h)`;

    for (const to of recipients) {
      try {
        await this.transporter.sendMail({ from: config.email.from, to, subject, html });
        logger.info(`Gap notification email sent to ${to}`);
      } catch (error) {
        logger.error(`Failed to send gap email to ${to}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  private buildGapEmailHtml(
    rule: NotificationRule,
    displayName: string,
    hourlyData: HourlyData[],
    gapHours: HourlyData[]
  ): string {
    const maxCount = Math.max(...hourlyData.map(h => h.count), 1);
    const barWidth = Math.max(Math.floor(600 / hourlyData.length), 12);

    const barsHtml = hourlyData
      .map(h => {
        const pct = Math.round((h.count / maxCount) * 100);
        const barColor = h.count === 0 ? '#ef5350' : '#42a5f5';
        return `
          <td style="padding:1px 2px;vertical-align:bottom;text-align:center;width:${barWidth}px;">
            <div style="background:${barColor};height:${Math.max(pct, 2)}px;width:100%;margin-bottom:2px;"></div>
            <div style="font-size:9px;color:#666;white-space:nowrap;">${h.label}</div>
            <div style="font-size:10px;font-weight:bold;">${h.count}</div>
          </td>`;
      })
      .join('');

    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; }
    .header { background: #d32f2f; color: white; padding: 16px 20px; }
    .header h2 { margin: 0 0 4px; font-size: 18px; }
    .header p  { margin: 0; font-size: 13px; opacity: .85; }
    .body  { padding: 20px; }
    .gap-list { color: #d32f2f; font-weight: bold; }
    .chart-wrap { overflow-x: auto; margin: 16px 0; }
    .chart-table { border-collapse: collapse; min-width: 600px; }
    .legend { font-size: 11px; color: #777; margin-top: 4px; }
    .footer { border-top: 1px solid #eee; padding: 12px 20px; font-size: 11px; color: #999; }
  </style>
</head>
<body>
  <div class="header">
    <h2>Missing Meter Readings Alert</h2>
    <p>${rule.name} &mdash; ${displayName}</p>
  </div>
  <div class="body">
    <p>
      <strong class="gap-list">${gapHours.length} gap hour${gapHours.length !== 1 ? 's' : ''}</strong>
      detected in the last <strong>${rule.threshold_hours ?? 24} hours</strong> for
      <strong>${displayName}</strong>.
    </p>
    <p>Missing at: <span class="gap-list">${gapHours.map(h => h.label).join(', ')}</span></p>
    <h3 style="margin-bottom:8px;">Readings per Hour</h3>
    <div class="chart-wrap">
      <table class="chart-table">
        <tr style="vertical-align:bottom;height:120px;">${barsHtml}</tr>
      </table>
    </div>
    <p class="legend">&#9632; Blue = readings received &nbsp; &#9632; Red = no readings (gap)</p>
  </div>
  <div class="footer">
    Automated alert from MeterItPro &mdash; Rule: ${rule.name}
  </div>
</body>
</html>`;
  }
}
