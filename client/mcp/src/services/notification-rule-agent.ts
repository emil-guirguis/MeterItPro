import nodemailer from 'nodemailer';
import { db } from '../database/client.js';
import { logger, formatSqlForDebug } from '../utils/logger.js';
import { config } from '../config.js';

interface MeterSelection {
  id: string;
  meter_id: number | null;
  meter_element_ids: number[] | null;
  register_field_names: string[];
}

interface NotificationRule {
  notification_rule_id: string;
  tenant_id: string;
  name: string;
  rule_type: string;
  threshold_hours: number | null;
  demand_threshold: number | null;
  schedule_cron: string;
  meter_selections: MeterSelection[] | string | null;
}

/** A (meter_id, meter_element_id) pair with the display name built the same way as favorites */
interface MeterElementPair {
  meter_id: string;
  meter_element_id: string;
  display_name: string;
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

  async loadRuleById(ruleId: string): Promise<NotificationRule | null> {
    const sql = `SELECT notification_rule_id, tenant_id, name, rule_type,
              threshold_hours, demand_threshold, schedule_cron, meter_selections
       FROM notification_rule
       WHERE notification_rule_id = $1`;
    logger.info(`[SQL] loadRuleById:\n${formatSqlForDebug(sql, [ruleId])}`);
    const result = await db.query<NotificationRule>(sql, [ruleId]);
    if (result.rows.length === 0) {
      logger.warn(`[rule] loadRuleById: no rule found for id=${ruleId}`);
      return null;
    }
    const r = result.rows[0];
    const rule = { ...r, meter_selections: this.parseMeterSelections(r.meter_selections) };
    logger.info(`[rule] loaded rule: id=${rule.notification_rule_id} name="${rule.name}" type="${rule.rule_type}" threshold_hours=${rule.threshold_hours} meter_selections=${JSON.stringify(rule.meter_selections)}`);
    return rule;
  }

  async loadActiveRules(): Promise<NotificationRule[]> {
    const sql = `SELECT notification_rule_id, tenant_id, name, rule_type,
              threshold_hours, demand_threshold, schedule_cron, meter_selections
       FROM notification_rule
       WHERE active = true
       ORDER BY notification_rule_id ASC`;
    logger.info(`[SQL] loadActiveRules:\n${formatSqlForDebug(sql, [])}`);
    const result = await db.query<NotificationRule>(sql);
    return result.rows.map(r => ({
      ...r,
      meter_selections: this.parseMeterSelections(r.meter_selections),
    }));
  }

  private parseMeterSelections(raw: any): MeterSelection[] | null {
    if (!raw) return null;
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch { return null; }
    }
    if (Array.isArray(raw)) return raw as MeterSelection[];
    return null;
  }

  async executeRule(rule: NotificationRule): Promise<void> {
    logger.info(`Executing rule: ${rule.name} (${rule.notification_rule_id}), type: ${rule.rule_type}`);
    try {
      switch (rule.rule_type) {
        case 'meter_no_reading':
          await this.checkMeterNoReading(rule);
          break;
        case 'meter_zero_reading':
          await this.checkMeterZeroReading(rule);
          break;
        case 'demand_threshold':
          await this.checkDemandThreshold(rule);
          break;
        default:
          logger.warn(`Rule type '${rule.rule_type}' is not handled — no queries will run for rule ${rule.notification_rule_id}`);
      }
    } catch (error) {
      logger.error(`Failed to execute rule ${rule.notification_rule_id}`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  // ─── Meter helpers ────────────────────────────────────────────────────────────

  /**
   * Returns the (meter_id, meter_element_id) pairs targeted by the rule.
   * Reads from meter_selections JSONB on the rule. If no selections are set,
   * returns every active (meter, element) for the tenant.
   */
  private async getRuleMeterElements(rule: NotificationRule): Promise<MeterElementPair[]> {
    const selections = Array.isArray(rule.meter_selections) ? rule.meter_selections : null;
    let pairs: Array<{ meter_id: string; meter_element_id: string }>;

    if (selections && selections.length > 0) {
      const resolved: Array<{ meter_id: string; meter_element_id: string }> = [];
      for (const sel of selections) {
        if (!sel.meter_id) continue;
        const meterId = String(sel.meter_id);

        if (sel.meter_element_ids && sel.meter_element_ids.length > 0) {
          // Specific elements chosen
          for (const elId of sel.meter_element_ids) {
            resolved.push({ meter_id: meterId, meter_element_id: String(elId) });
          }
        } else {
          // No element filter → expand to all elements for this meter
          const elemSql = `SELECT meter_element_id FROM meter_element WHERE meter_id = $1`;
          logger.info(`[SQL] expand elements for meter ${meterId}:\n${formatSqlForDebug(elemSql, [meterId])}`);
          const elements = await db.query<{ meter_element_id: string }>(elemSql, [meterId]);
          for (const el of elements.rows) {
            resolved.push({ meter_id: meterId, meter_element_id: el.meter_element_id });
          }
        }
      }
      pairs = resolved;
    } else {
      // No specific meters – check every active (meter, element) for the tenant
      const allSql = `SELECT m.meter_id, me.meter_element_id
         FROM meter m
         JOIN meter_element me ON me.meter_id = m.meter_id
         WHERE m.tenant_id = $1 AND m.active = true`;
      logger.info(`[SQL] all tenant meter elements (rule ${rule.notification_rule_id}):\n${formatSqlForDebug(allSql, [rule.tenant_id])}`);
      const all = await db.query<{ meter_id: string; meter_element_id: string }>(allSql, [rule.tenant_id]);
      pairs = all.rows;
    }

    logger.info(`[rule] getRuleMeterElements: resolved ${pairs.length} pairs for rule ${rule.notification_rule_id}`);
    if (pairs.length === 0) {
      logger.warn(`[rule] no meter/element pairs found for rule ${rule.notification_rule_id} — nothing to check`);
      return [];
    }

    // Fetch display names in one query
    const placeholders = pairs
      .map((_, i) => `($${i * 2 + 1}::bigint, $${i * 2 + 2}::bigint)`)
      .join(', ');
    const flatParams = pairs.flatMap(p => [p.meter_id, p.meter_element_id]);

    const nameSql = `SELECT
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
       JOIN meter_element me ON me.meter_element_id = v.meid`;
    logger.info(`[SQL] fetch display names:\n${formatSqlForDebug(nameSql, flatParams)}`);
    const nameResult = await db.query<{
      meter_id: string;
      meter_element_id: string;
      display_name: string;
    }>(nameSql, flatParams);

    return nameResult.rows.map(r => ({
      meter_id: String(r.meter_id),
      meter_element_id: String(r.meter_element_id),
      display_name: r.display_name,
    }));
  }

  private async clearNotification(
    tenantId: string,
    meterId: string,
    meterElementId: string,
    notificationType: string
  ): Promise<void> {
    const sql = `DELETE FROM notification
       WHERE tenant_id = $1 AND meter_id = $2 AND meter_element_id = $3 AND notification_type = $4`;
    logger.info(`[SQL] clearNotification:\n${formatSqlForDebug(sql, [tenantId, meterId, meterElementId, notificationType])}`);
    await db.query(sql, [tenantId, meterId, meterElementId, notificationType]);
  }

  private async upsertNotification(
    tenantId: string,
    meterId: string,
    meterElementId: string,
    notificationType: string,
    severity: string,
    title: string,
    description: string
  ): Promise<string> {
    await this.clearNotification(tenantId, meterId, meterElementId, notificationType);
    const insertSql = `INSERT INTO notification
         (tenant_id, meter_id, meter_element_id, notification_type, severity, title, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING notification_id`;
    logger.info(`[SQL] upsertNotification:\n${formatSqlForDebug(insertSql, [tenantId, meterId, meterElementId, notificationType, severity, title, description])}`);
    const result = await db.query<{ notification_id: string }>(insertSql, [tenantId, meterId, meterElementId, notificationType, severity, title, description]);
    return result.rows[0]?.notification_id ?? '';
  }

  // ─── meter_no_reading ─────────────────────────────────────────────────────────
  //
  // Fires when NO records exist in the threshold window.
  // Clears the notification when readings resume.

  private async checkMeterNoReading(rule: NotificationRule): Promise<void> {
    const thresholdHours = rule.threshold_hours ?? 24;
    const pairs = await this.getRuleMeterElements(rule);
    logger.info(`meter_no_reading: checking ${pairs.length} meter elements`);
    for (const pair of pairs) {
      await this.checkNoReadingForPair(rule, pair, thresholdHours);
    }
  }

  private async checkNoReadingForPair(
    rule: NotificationRule,
    pair: MeterElementPair,
    thresholdHours: number
  ): Promise<void> {
    logger.info(`[rule] checkNoReadingForPair start: meter=${pair.meter_id} element=${pair.meter_element_id} threshold=${thresholdHours}h`);

    // Detect gaps in the reading sequence using LAG().
    // A gap is any consecutive pair of readings more than 15 minutes apart.
    // Looks back over the last threshold_hours window.
    const gapSql = `
      WITH ordered AS (
        SELECT
          created_at AS ts,
          LAG(created_at) OVER (ORDER BY created_at) AS prev_ts
        FROM meter_reading
        WHERE tenant_id = $1
          AND meter_id = $2
          AND meter_element_id = $3
          AND created_at >= NOW() - INTERVAL '1 hour' * $4
          AND created_at IS NOT NULL
      ),
      gaps AS (
        SELECT
          prev_ts                                                          AS last_record_before_gap,
          ts                                                               AS first_record_after_gap,
          prev_ts + INTERVAL '15 minutes'                                  AS gap_starts_at,
          ts - INTERVAL '15 minutes'                                       AS gap_ends_at,
          ROUND(EXTRACT(EPOCH FROM (ts - prev_ts)) / 60)                  AS gap_duration_minutes,
          FLOOR(EXTRACT(EPOCH FROM (ts - prev_ts)) / 900)::int - 1        AS missing_records_in_this_gap
        FROM ordered
        WHERE prev_ts IS NOT NULL
          AND ts > prev_ts + INTERVAL '15 minutes'
      )
      SELECT
        last_record_before_gap,
        first_record_after_gap,
        gap_starts_at,
        gap_ends_at,
        gap_duration_minutes,
        missing_records_in_this_gap,
        COUNT(*) OVER () AS total_number_of_gaps
      FROM gaps
      ORDER BY gap_duration_minutes DESC
      LIMIT 100`;

    const params = [rule.tenant_id, pair.meter_id, pair.meter_element_id, thresholdHours];
    logger.info(`[SQL] checkNoReading gaps (meter=${pair.meter_id}, element=${pair.meter_element_id}):\n${formatSqlForDebug(gapSql, params)}`);

    interface GapRow {
      last_record_before_gap: Date;
      first_record_after_gap: Date;
      gap_starts_at: Date;
      gap_ends_at: Date;
      gap_duration_minutes: string;
      missing_records_in_this_gap: number;
      total_number_of_gaps: string;
    }

    let gapResult: { rows: GapRow[] };
    try {
      gapResult = await db.query<GapRow>(gapSql, params);
    } catch (queryErr) {
      logger.error(`[rule] gap query failed for meter=${pair.meter_id} element=${pair.meter_element_id}`, {
        error: queryErr instanceof Error ? queryErr.message : String(queryErr),
        stack: queryErr instanceof Error ? queryErr.stack : undefined,
      });
      return;
    }

    const hasGaps = gapResult.rows.length > 0;
    logger.info(`[rule] gap check: meter=${pair.meter_id} element=${pair.meter_element_id} rows=${gapResult.rows.length} gaps=${hasGaps ? gapResult.rows[0].total_number_of_gaps : 0} threshold=${thresholdHours}h tenant=${rule.tenant_id}`);
    logger.info(`[rule] gap results:\n${JSON.stringify(gapResult.rows, null, 2)}`);

    if (!hasGaps) {
      await this.clearNotification(rule.tenant_id, pair.meter_id, pair.meter_element_id, 'meter_no_reading');
      return;
    }

    // rows[0] is the largest gap (ORDER BY gap_duration_minutes DESC)
    const worst = gapResult.rows[0];
    const totalGaps = parseInt(worst.total_number_of_gaps, 10);
    const gapMinutes = parseFloat(worst.gap_duration_minutes);
    const gapHours = Math.round((gapMinutes / 60) * 10) / 10;
    const gapStart = new Date(worst.gap_starts_at);
    const gapEnd = new Date(worst.gap_ends_at);

    const title = `${pair.display_name} – ${totalGaps} reading gap${totalGaps !== 1 ? 's' : ''} detected`;
    const description = `Largest gap: ${gapMinutes} min (${gapStart.toLocaleString()} – ${gapEnd.toLocaleString()}). `
      + `${totalGaps} gap${totalGaps !== 1 ? 's' : ''} found in the last ${thresholdHours}h window.`;

    const notificationId = await this.upsertNotification(
      rule.tenant_id, pair.meter_id, pair.meter_element_id,
      'meter_no_reading', 'error', title, description
    );
    logger.info('meter_no_reading alert', {
      notification_id: notificationId,
      meter: pair.display_name,
      total_gaps: totalGaps,
      largest_gap_minutes: gapMinutes,
    });

    const recipients = await this.getEmailRecipients(rule.notification_rule_id);
    if (recipients.length > 0) {
      await this.sendNoReadingEmail(
        rule, pair.display_name, thresholdHours, gapHours,
        gapStart, gapEnd,
        recipients
      );
    }
  }

  // ─── meter_zero_reading ───────────────────────────────────────────────────────
  //
  // Fires when readings DO exist in the threshold window but every single one
  // shows kWh = 0 AND kW = 0 (meter is communicating but measuring nothing).
  // Clears the notification when any non-zero reading appears.

  private async checkMeterZeroReading(rule: NotificationRule): Promise<void> {
    const thresholdHours = rule.threshold_hours ?? 24;
    const pairs = await this.getRuleMeterElements(rule);
    logger.info(`meter_zero_reading: checking ${pairs.length} meter elements`);
    for (const pair of pairs) {
      await this.checkZeroReadingForPair(rule, pair, thresholdHours);
    }
  }

  private async checkZeroReadingForPair(
    rule: NotificationRule,
    pair: MeterElementPair,
    thresholdHours: number
  ): Promise<void> {
    const zeroSql = `SELECT
         COUNT(*)                                          AS total,
         COUNT(*) FILTER (WHERE kwh = 0 AND kw = 0)      AS zero_count
       FROM meter_reading
       WHERE meter_id = $1
         AND meter_element_id = $2
         AND created_at >= NOW() - ($3 || ' hours')::INTERVAL`;
    logger.info(`[SQL] checkZeroReading (meter=${pair.meter_id}, element=${pair.meter_element_id}):\n${formatSqlForDebug(zeroSql, [pair.meter_id, pair.meter_element_id, thresholdHours])}`);
    const result = await db.query<{ total: string; zero_count: string }>(zeroSql, [pair.meter_id, pair.meter_element_id, thresholdHours]);

    const total = parseInt(result.rows[0]?.total ?? '0', 10);
    const zeroCount = parseInt(result.rows[0]?.zero_count ?? '0', 10);
    const allZero = total > 0 && total === zeroCount;

    if (!allZero) {
      // Either no readings (meter_no_reading's job) or some non-zero readings — clear
      await this.clearNotification(rule.tenant_id, pair.meter_id, pair.meter_element_id, 'meter_zero_reading');
      return;
    }

    const title = `${pair.display_name} – ${total} reading${total !== 1 ? 's' : ''} all zero`;
    const description = `All ${total} reading${total !== 1 ? 's' : ''} in the last ${thresholdHours} hours show kWh = 0 and kW = 0. The meter is communicating but reporting no energy.`;

    const notificationId = await this.upsertNotification(
      rule.tenant_id, pair.meter_id, pair.meter_element_id,
      'meter_zero_reading', 'warning', title, description
    );
    logger.info('meter_zero_reading notification created', {
      notification_id: notificationId,
      meter: pair.display_name,
      total_readings: total,
    });

    const recipients = await this.getEmailRecipients(rule.notification_rule_id);
    if (recipients.length > 0) {
      await this.sendZeroReadingEmail(rule, pair.display_name, thresholdHours, total, recipients);
    }
  }

  // ─── demand_threshold ─────────────────────────────────────────────────────────
  //
  // Fires when any reading in the threshold window has kW > demand_threshold.
  // Clears when no breach exists in the current window.

  private async checkDemandThreshold(rule: NotificationRule): Promise<void> {
    if (!rule.demand_threshold) {
      logger.warn(`Rule ${rule.notification_rule_id} (demand_threshold) has no threshold value set — skipping`);
      return;
    }
    const pairs = await this.getRuleMeterElements(rule);
    logger.info(`demand_threshold: checking ${pairs.length} meter elements, threshold=${rule.demand_threshold} kW`);
    for (const pair of pairs) {
      await this.checkDemandThresholdForPair(rule, pair);
    }
  }

  private async checkDemandThresholdForPair(
    rule: NotificationRule,
    pair: MeterElementPair
  ): Promise<void> {
    const thresholdHours = rule.threshold_hours ?? 1;

    const demandSql = `SELECT kw, created_at
       FROM meter_reading
       WHERE meter_id = $1
         AND meter_element_id = $2
         AND created_at >= NOW() - ($3 || ' hours')::INTERVAL
         AND kw > $4
       ORDER BY kw DESC
       LIMIT 1`;
    logger.info(`[SQL] checkDemandThreshold (meter=${pair.meter_id}, element=${pair.meter_element_id}):\n${formatSqlForDebug(demandSql, [pair.meter_id, pair.meter_element_id, thresholdHours, rule.demand_threshold])}`);
    const result = await db.query<{ kw: string; created_at: Date }>(demandSql, [pair.meter_id, pair.meter_element_id, thresholdHours, rule.demand_threshold]);

    if (result.rows.length === 0) {
      // No breach in window — clear standing notification
      await this.clearNotification(rule.tenant_id, pair.meter_id, pair.meter_element_id, 'demand_threshold');
      return;
    }

    const peakKw = Number(result.rows[0].kw);
    const peakAt = new Date(result.rows[0].created_at);
    const threshold = Number(rule.demand_threshold);

    const title = `${pair.display_name} – Peak demand ${peakKw.toFixed(1)} kW exceeds ${threshold} kW`;
    const description = `Peak demand of ${peakKw.toFixed(1)} kW recorded at ${peakAt.toISOString()}, exceeding the configured threshold of ${threshold} kW.`;

    const notificationId = await this.upsertNotification(
      rule.tenant_id, pair.meter_id, pair.meter_element_id,
      'demand_threshold', 'error', title, description
    );
    logger.info('demand_threshold notification created', {
      notification_id: notificationId,
      meter: pair.display_name,
      peak_kw: peakKw,
      threshold,
    });

    const recipients = await this.getEmailRecipients(rule.notification_rule_id);
    if (recipients.length > 0) {
      await this.sendDemandThresholdEmail(rule, pair.display_name, peakKw, threshold, peakAt, recipients);
    }
  }

  // ─── Email helpers ────────────────────────────────────────────────────────────

  private async getEmailRecipients(ruleId: string): Promise<string[]> {
    const recipSql = `SELECT COALESCE(r.email_address, u.email) AS email_address
       FROM notification_rule_recipient r
       LEFT JOIN users u ON u.users_id = r.users_id
       WHERE r.notification_rule_id = $1 AND r.receive_email = true`;
    logger.info(`[SQL] getEmailRecipients (rule=${ruleId}):\n${formatSqlForDebug(recipSql, [ruleId])}`);
    const result = await db.query<{ email_address: string | null }>(recipSql, [ruleId]);
    return result.rows.map(r => r.email_address).filter((e): e is string => !!e);
  }

  private async sendEmail(to: string[], subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      logger.warn('Email transporter not available — skipping notification email');
      return;
    }
    for (const recipient of to) {
      try {
        await this.transporter.sendMail({ from: config.email.from, to: recipient, subject, html });
        logger.info(`Notification email sent to ${recipient}`);
      } catch (error) {
        logger.error(`Failed to send notification email to ${recipient}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  private async sendNoReadingEmail(
    rule: NotificationRule,
    displayName: string,
    thresholdHours: number,
    gapHours: number,
    gapStart: Date,
    gapEnd: Date,
    recipients: string[]
  ): Promise<void> {
    const html = this.buildEmailHtml({
      headerColor: '#c62828',
      headerTitle: 'Missing Meter Readings Alert',
      headerSubtitle: `${rule.name} — ${displayName}`,
      body: `
        <p>
          A gap of <strong>${gapHours} hours</strong> was detected for
          <strong>${displayName}</strong> within the last 24 hours,
          exceeding the configured threshold of <strong>${thresholdHours} hour${thresholdHours !== 1 ? 's' : ''}</strong>.
        </p>
        <p>
          <strong>Gap period:</strong> ${gapStart.toLocaleString()} &mdash; ${gapEnd.toLocaleString()}
        </p>
        <p>Please check the meter connection and BACnet configuration.</p>
      `,
      ruleName: rule.name,
    });

    await this.sendEmail(
      recipients,
      `Alert: ${displayName} – ${gapHours}h gap in readings`,
      html
    );
  }

  private async sendZeroReadingEmail(
    rule: NotificationRule,
    displayName: string,
    thresholdHours: number,
    totalReadings: number,
    recipients: string[]
  ): Promise<void> {
    const html = this.buildEmailHtml({
      headerColor: '#e65100',
      headerTitle: 'Zero Energy Readings Alert',
      headerSubtitle: `${rule.name} — ${displayName}`,
      body: `
        <p>
          <strong>${displayName}</strong> has sent
          <strong>${totalReadings} reading${totalReadings !== 1 ? 's' : ''}</strong>
          in the last <strong>${thresholdHours} hour${thresholdHours !== 1 ? 's' : ''}</strong>,
          but every reading shows <strong>kWh = 0</strong> and <strong>kW = 0</strong>.
        </p>
        <p>
          The meter is communicating but reporting no energy consumption.
          This may indicate a wiring issue, CT clamp problem, or meter configuration error.
        </p>
      `,
      ruleName: rule.name,
    });

    await this.sendEmail(
      recipients,
      `Alert: ${displayName} – All ${totalReadings} readings are zero`,
      html
    );
  }

  private async sendDemandThresholdEmail(
    rule: NotificationRule,
    displayName: string,
    peakKw: number,
    threshold: number,
    peakAt: Date,
    recipients: string[]
  ): Promise<void> {
    const overBy = (peakKw - threshold).toFixed(1);
    const html = this.buildEmailHtml({
      headerColor: '#1565c0',
      headerTitle: 'Demand Threshold Exceeded',
      headerSubtitle: `${rule.name} — ${displayName}`,
      body: `
        <p>
          <strong>${displayName}</strong> reached a peak demand of
          <strong>${peakKw.toFixed(1)} kW</strong> at ${peakAt.toLocaleString()},
          exceeding the configured threshold of <strong>${threshold} kW</strong>
          by <strong>${overBy} kW</strong>.
        </p>
        <p>Review load scheduling or consider increasing demand capacity.</p>
      `,
      ruleName: rule.name,
    });

    await this.sendEmail(
      recipients,
      `Alert: ${displayName} – Peak demand ${peakKw.toFixed(1)} kW exceeds ${threshold} kW`,
      html
    );
  }

  private buildEmailHtml(opts: {
    headerColor: string;
    headerTitle: string;
    headerSubtitle: string;
    body: string;
    ruleName: string;
  }): string {
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body  { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; }
    .hdr  { background: ${opts.headerColor}; color: #fff; padding: 16px 20px; }
    .hdr h2 { margin: 0 0 4px; font-size: 18px; }
    .hdr p  { margin: 0; font-size: 13px; opacity: .85; }
    .body { padding: 20px; line-height: 1.6; }
    .foot { border-top: 1px solid #eee; padding: 12px 20px; font-size: 11px; color: #999; }
  </style>
</head>
<body>
  <div class="hdr">
    <h2>${opts.headerTitle}</h2>
    <p>${opts.headerSubtitle}</p>
  </div>
  <div class="body">${opts.body}</div>
  <div class="foot">Automated alert from MeterItPro &mdash; Rule: ${opts.ruleName}</div>
</body>
</html>`;
  }
}
