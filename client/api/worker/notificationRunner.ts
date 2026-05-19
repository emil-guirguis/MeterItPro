/**
 * Notification rule execution for Cloudflare Workers.
 *
 * Ports NotificationRuleAgent from the client MCP to run inside the Worker.
 * Email is sent via Resend (same as reportRunner). DB access via query().
 */

import { Env, execQuery } from './db';
import { matchesCronSchedule } from './cronMatcher';

// --- Types --------------------------------------------------------------------

interface NotificationRule {
  notification_rule_id: string;
  tenant_id: string;
  name: string;
  rule_type: string;
  threshold_hours: number | null;
  demand_threshold: number | null;
  schedule_cron: string;
  meter_selections: any;
}

interface MeterSelection {
  id: string;
  meter_id: number | null;
  meter_element_ids: number[] | null;
  register_field_names: string[];
}

interface MeterElementPair {
  meter_id: string;
  meter_element_id: string;
  display_name: string;
}

// --- Helpers ------------------------------------------------------------------

function parseMeterSelections(raw: any): MeterSelection[] | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return null; }
  }
  if (Array.isArray(raw)) return raw as MeterSelection[];
  return null;
}

async function getRuleMeterElements(env: Env, rule: NotificationRule): Promise<MeterElementPair[]> {
  const selections = parseMeterSelections(rule.meter_selections);
  let pairs: Array<{ meter_id: string; meter_element_id: string }> = [];

  if (selections && selections.length > 0) {
    for (const sel of selections) {
      if (!sel.meter_id) continue;
      const meterId = String(sel.meter_id);

      if (sel.meter_element_ids && sel.meter_element_ids.length > 0) {
        for (const elId of sel.meter_element_ids) {
          pairs.push({ meter_id: meterId, meter_element_id: String(elId) });
        }
      } else {
        const elements = await execQuery(
          env,
          `SELECT meter_element_id FROM meter_element WHERE meter_id = $1`,
          [meterId]
        );
        for (const el of elements.rows) {
          pairs.push({ meter_id: meterId, meter_element_id: el.meter_element_id });
        }
      }
    }
  } else {
    const all = await execQuery(
      env,
      `SELECT m.meter_id, me.meter_element_id
       FROM meter m
       JOIN meter_element me ON me.meter_id = m.meter_id
       WHERE m.tenant_id = $1 AND m.active = true`,
      [rule.tenant_id]
    );
    pairs = all.rows;
  }

  if (pairs.length === 0) return [];

  // Fetch display names in one query
  const placeholders = pairs.map((_, i) => `($${i * 2 + 1}::bigint, $${i * 2 + 2}::bigint)`).join(', ');
  const flatParams = pairs.flatMap(p => [p.meter_id, p.meter_element_id]);

  const nameResult = await execQuery(
    env,
    `SELECT m.meter_id, me.meter_element_id,
       CONCAT(COALESCE(m.name,'Unknown'),'    ',COALESCE(TRIM(me.element),'?'),'-',COALESCE(me.name,'Unknown')) AS display_name
     FROM (VALUES ${placeholders}) AS v(mid, meid)
     JOIN meter m ON m.meter_id = v.mid
     JOIN meter_element me ON me.meter_element_id = v.meid`,
    flatParams
  );

  return nameResult.rows.map(r => ({
    meter_id: String(r.meter_id),
    meter_element_id: String(r.meter_element_id),
    display_name: r.display_name,
  }));
}

async function getEmailRecipients(env: Env, ruleId: string): Promise<string[]> {
  const result = await execQuery(
    env,
    `SELECT email_address FROM notification_rule_recipient WHERE notification_rule_id = $1`,
    [ruleId]
  );
  return result.rows.map(r => r.email_address).filter((e): e is string => !!e);
}

async function clearNotification(
  env: Env, tenantId: string, meterId: string, meterElementId: string, notificationType: string
): Promise<void> {
  await execQuery(env,
    `DELETE FROM notification WHERE tenant_id=$1 AND meter_id=$2 AND meter_element_id=$3 AND notification_type=$4`,
    [tenantId, meterId, meterElementId, notificationType]
  );
}

async function upsertNotification(
  env: Env, tenantId: string, meterId: string, meterElementId: string,
  notificationType: string, severity: string, title: string, description: string
): Promise<void> {
  await clearNotification(env, tenantId, meterId, meterElementId, notificationType);
  await execQuery(env,
    `INSERT INTO notification (tenant_id, meter_id, meter_element_id, notification_type, severity, title, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [tenantId, meterId, meterElementId, notificationType, severity, title, description]
  );
}

// --- Email via Resend ---------------------------------------------------------

async function sendEmail(env: Env, recipients: string[], subject: string, html: string): Promise<void> {
  const apiKey = (env as any).RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[notificationRunner] RESEND_API_KEY not set � skipping email');
    return;
  }
  const from = (env as any).RESEND_FROM || 'MeterItPro <noreply@meteritpro.com>';

  for (const to of recipients) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`[notificationRunner] Resend error for ${to} (${res.status}): ${err}`);
    }
  }
}

function buildEmailHtml(opts: {
  headerColor: string;
  headerTitle: string;
  headerSubtitle: string;
  body: string;
  ruleName: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head><style>
  body{font-family:Arial,sans-serif;color:#333;margin:0;padding:0}
  .hdr{background:${opts.headerColor};color:#fff;padding:16px 20px}
  .hdr h2{margin:0 0 4px;font-size:18px}
  .hdr p{margin:0;font-size:13px;opacity:.85}
  .body{padding:20px;line-height:1.6}
  .foot{border-top:1px solid #eee;padding:12px 20px;font-size:11px;color:#999}
</style></head>
<body>
  <div class="hdr"><h2>${opts.headerTitle}</h2><p>${opts.headerSubtitle}</p></div>
  <div class="body">${opts.body}</div>
  <div class="foot">Automated alert from MeterItPro � Rule: ${opts.ruleName}</div>
</body>
</html>`;
}

// --- Rule type: meter_no_reading ----------------------------------------------

async function checkMeterNoReading(env: Env, rule: NotificationRule): Promise<void> {
  const thresholdHours = rule.threshold_hours ?? 24;
  const pairs = await getRuleMeterElements(env, rule);

  for (const pair of pairs) {
    // Pre-check: find the most recent reading regardless of window.
    // If no reading exists or the last reading is older than the threshold,
    // fire immediately — the gap query below returns empty rows when there
    // are NO readings in the window, which would incorrectly clear the alert.
    const lastResult = await execQuery(env,
      `SELECT MAX(created_at) AS last_reading_at FROM meter_reading
       WHERE tenant_id = $1 AND meter_id = $2 AND meter_element_id = $3`,
      [rule.tenant_id, pair.meter_id, pair.meter_element_id]
    );
    const lastReadingAt: Date | null = lastResult.rows[0]?.last_reading_at
      ? new Date(lastResult.rows[0].last_reading_at)
      : null;
    const cutoff = new Date(Date.now() - thresholdHours * 3_600_000);

    if (!lastReadingAt || lastReadingAt < cutoff) {
      const hoursSince = lastReadingAt
        ? Math.round((Date.now() - lastReadingAt.getTime()) / 3_600_000)
        : null;
      const title = `${pair.display_name} — No readings for ${hoursSince ?? '?'} hours`;
      const description = lastReadingAt
        ? `Last reading was ${hoursSince} hours ago (${lastReadingAt.toLocaleString()}), exceeding the ${thresholdHours}h threshold.`
        : `No readings have ever been recorded for this meter element.`;

      await upsertNotification(env, rule.tenant_id, pair.meter_id, pair.meter_element_id,
        'meter_no_reading', 'error', title, description);

      const recipients = await getEmailRecipients(env, rule.notification_rule_id);
      if (recipients.length > 0) {
        await sendEmail(env, recipients,
          `Alert: ${pair.display_name} — No readings for ${hoursSince ?? '?'}h`,
          buildEmailHtml({
            headerColor: '#c62828', headerTitle: 'Missing Meter Readings Alert',
            headerSubtitle: `${rule.name} — ${pair.display_name}`,
            body: `<p><strong>${pair.display_name}</strong> has not sent any readings for
                   <strong>${hoursSince ?? 'an unknown number of'} hours</strong>,
                   exceeding the configured threshold of
                   <strong>${thresholdHours} hour${thresholdHours !== 1 ? 's' : ''}</strong>.</p>
                   ${lastReadingAt ? `<p><strong>Last reading:</strong> ${lastReadingAt.toLocaleString()}</p>` : ''}
                   <p>Please check the meter connection and BACnet configuration.</p>`,
            ruleName: rule.name,
          })
        );
      }
      continue;
    }

    // Recent readings exist — check for gaps within the threshold window.
    // Include the last reading before the window so cross-boundary gaps are detected.
    const result = await execQuery(env, `
      WITH boundary AS (
        SELECT created_at AS ts
        FROM meter_reading
        WHERE tenant_id = $1 AND meter_id = $2 AND meter_element_id = $3
          AND created_at < NOW() - INTERVAL '1 hour' * $4
          AND created_at IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 1
      ),
      ordered AS (
        SELECT created_at AS ts, LAG(created_at) OVER (ORDER BY created_at) AS prev_ts
        FROM (
          SELECT created_at FROM meter_reading
          WHERE tenant_id = $1 AND meter_id = $2 AND meter_element_id = $3
            AND created_at >= NOW() - INTERVAL '1 hour' * $4
            AND created_at IS NOT NULL
          UNION ALL
          SELECT ts FROM boundary
        ) combined
      ),
      gaps AS (
        SELECT
          prev_ts AS last_record_before_gap, ts AS first_record_after_gap,
          prev_ts + INTERVAL '15 minutes' AS gap_starts_at,
          ts - INTERVAL '15 minutes' AS gap_ends_at,
          ROUND(EXTRACT(EPOCH FROM (ts - prev_ts)) / 60) AS gap_duration_minutes,
          FLOOR(EXTRACT(EPOCH FROM (ts - prev_ts)) / 900)::int - 1 AS missing_records_in_this_gap
        FROM ordered
        WHERE prev_ts IS NOT NULL AND ts > prev_ts + INTERVAL '20 minutes'
      )
      SELECT *, COUNT(*) OVER () AS total_number_of_gaps
      FROM gaps ORDER BY gap_duration_minutes DESC LIMIT 100`,
      [rule.tenant_id, pair.meter_id, pair.meter_element_id, thresholdHours]
    );

    if (result.rows.length === 0) {
      await clearNotification(env, rule.tenant_id, pair.meter_id, pair.meter_element_id, 'meter_no_reading');
      continue;
    }

    const worst = result.rows[0];
    const totalGaps = parseInt(worst.total_number_of_gaps, 10);
    const gapMinutes = parseFloat(worst.gap_duration_minutes);
    const gapHours = Math.round((gapMinutes / 60) * 10) / 10;
    const gapStart = new Date(worst.gap_starts_at);
    const gapEnd = new Date(worst.gap_ends_at);

    const title = `${pair.display_name} � ${totalGaps} reading gap${totalGaps !== 1 ? 's' : ''} detected`;
    const description = `Largest gap: ${gapMinutes} min (${gapStart.toLocaleString()} � ${gapEnd.toLocaleString()}). `
      + `${totalGaps} gap${totalGaps !== 1 ? 's' : ''} found in the last ${thresholdHours}h window.`;

    await upsertNotification(env, rule.tenant_id, pair.meter_id, pair.meter_element_id,
      'meter_no_reading', 'error', title, description);

    const recipients = await getEmailRecipients(env, rule.notification_rule_id);
    if (recipients.length > 0) {
      await sendEmail(env, recipients,
        `Alert: ${pair.display_name} � ${gapHours}h gap in readings`,
        buildEmailHtml({
          headerColor: '#c62828', headerTitle: 'Missing Meter Readings Alert',
          headerSubtitle: `${rule.name} � ${pair.display_name}`,
          body: `<p>A gap of <strong>${gapHours} hours</strong> was detected for <strong>${pair.display_name}</strong>
                 within the last ${thresholdHours} hours, exceeding the configured threshold of
                 <strong>${thresholdHours} hour${thresholdHours !== 1 ? 's' : ''}</strong>.</p>
                 <p><strong>Gap period:</strong> ${gapStart.toLocaleString()} &mdash; ${gapEnd.toLocaleString()}</p>
                 <p>Please check the meter connection and BACnet configuration.</p>`,
          ruleName: rule.name,
        })
      );
    }
  }
}

// --- Rule type: meter_zero_reading --------------------------------------------

async function checkMeterZeroReading(env: Env, rule: NotificationRule): Promise<void> {
  const thresholdHours = rule.threshold_hours ?? 24;
  const pairs = await getRuleMeterElements(env, rule);

  for (const pair of pairs) {
    const result = await execQuery(env,
      `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE kwh=0 AND kw=0) AS zero_count
       FROM meter_reading
       WHERE meter_id=$1 AND meter_element_id=$2
         AND created_at >= NOW() - ($3 || ' hours')::INTERVAL`,
      [pair.meter_id, pair.meter_element_id, thresholdHours]
    );

    const total = parseInt(result.rows[0]?.total ?? '0', 10);
    const zeroCount = parseInt(result.rows[0]?.zero_count ?? '0', 10);
    const allZero = total > 0 && total === zeroCount;

    if (!allZero) {
      await clearNotification(env, rule.tenant_id, pair.meter_id, pair.meter_element_id, 'meter_zero_reading');
      continue;
    }

    const title = `${pair.display_name} � ${total} reading${total !== 1 ? 's' : ''} all zero`;
    const description = `All ${total} reading${total !== 1 ? 's' : ''} in the last ${thresholdHours} hours show kWh=0 and kW=0.`;

    await upsertNotification(env, rule.tenant_id, pair.meter_id, pair.meter_element_id,
      'meter_zero_reading', 'warning', title, description);

    const recipients = await getEmailRecipients(env, rule.notification_rule_id);
    if (recipients.length > 0) {
      await sendEmail(env, recipients,
        `Alert: ${pair.display_name} � All ${total} readings are zero`,
        buildEmailHtml({
          headerColor: '#e65100', headerTitle: 'Zero Energy Readings Alert',
          headerSubtitle: `${rule.name} � ${pair.display_name}`,
          body: `<p><strong>${pair.display_name}</strong> has sent <strong>${total} reading${total !== 1 ? 's' : ''}</strong>
                 in the last <strong>${thresholdHours} hour${thresholdHours !== 1 ? 's' : ''}</strong>,
                 but every reading shows <strong>kWh = 0</strong> and <strong>kW = 0</strong>.</p>
                 <p>The meter is communicating but reporting no energy consumption.
                 This may indicate a wiring issue, CT clamp problem, or meter configuration error.</p>`,
          ruleName: rule.name,
        })
      );
    }
  }
}

// --- Rule type: demand_threshold ---------------------------------------------

async function checkDemandThreshold(env: Env, rule: NotificationRule): Promise<void> {
  if (!rule.demand_threshold) return;
  const thresholdHours = rule.threshold_hours ?? 1;
  const pairs = await getRuleMeterElements(env, rule);

  for (const pair of pairs) {
    const result = await execQuery(env,
      `SELECT kw, created_at FROM meter_reading
       WHERE meter_id=$1 AND meter_element_id=$2
         AND created_at >= NOW() - ($3 || ' hours')::INTERVAL
         AND kw > $4
       ORDER BY kw DESC LIMIT 1`,
      [pair.meter_id, pair.meter_element_id, thresholdHours, rule.demand_threshold]
    );

    if (result.rows.length === 0) {
      await clearNotification(env, rule.tenant_id, pair.meter_id, pair.meter_element_id, 'demand_threshold');
      continue;
    }

    const peakKw = Number(result.rows[0].kw);
    const peakAt = new Date(result.rows[0].created_at);
    const threshold = Number(rule.demand_threshold);
    const overBy = (peakKw - threshold).toFixed(1);

    const title = `${pair.display_name} � Peak demand ${peakKw.toFixed(1)} kW exceeds ${threshold} kW`;
    const description = `Peak demand of ${peakKw.toFixed(1)} kW at ${peakAt.toISOString()}, exceeding threshold of ${threshold} kW.`;

    await upsertNotification(env, rule.tenant_id, pair.meter_id, pair.meter_element_id,
      'demand_threshold', 'error', title, description);

    const recipients = await getEmailRecipients(env, rule.notification_rule_id);
    if (recipients.length > 0) {
      await sendEmail(env, recipients,
        `Alert: ${pair.display_name} � Peak demand ${peakKw.toFixed(1)} kW exceeds ${threshold} kW`,
        buildEmailHtml({
          headerColor: '#1565c0', headerTitle: 'Demand Threshold Exceeded',
          headerSubtitle: `${rule.name} � ${pair.display_name}`,
          body: `<p><strong>${pair.display_name}</strong> reached a peak demand of
                 <strong>${peakKw.toFixed(1)} kW</strong> at ${peakAt.toLocaleString()},
                 exceeding the configured threshold of <strong>${threshold} kW</strong>
                 by <strong>${overBy} kW</strong>.</p>
                 <p>Review load scheduling or consider increasing demand capacity.</p>`,
          ruleName: rule.name,
        })
      );
    }
  }
}

// --- Public API ---------------------------------------------------------------

export async function runNotificationRule(env: Env, ruleId: string): Promise<void> {
  const result = await execQuery(env,
    `SELECT notification_rule_id, tenant_id, name, rule_type,
            threshold_hours, demand_threshold, schedule_cron, meter_selections
     FROM notification_rule WHERE notification_rule_id = $1 AND active = true`,
    [ruleId]
  );
  if (result.rows.length === 0) throw new Error(`Notification rule ${ruleId} not found or inactive`);
  await executeRule(env, result.rows[0]);
}

export async function runAllActiveNotificationRules(env: Env, now: Date = new Date()): Promise<void> {
  const result = await execQuery(env,
    `SELECT notification_rule_id, tenant_id, name, rule_type,
            threshold_hours, demand_threshold, schedule_cron, meter_selections
     FROM notification_rule WHERE active = true`
  );

  for (const rule of result.rows) {
    if (!matchesCronSchedule(rule.schedule_cron, now)) {
      console.log(`[cron] Notification rule ${rule.notification_rule_id} skipped � schedule "${rule.schedule_cron}" does not match ${now.toISOString()}`);
      continue;
    }

    try {
      await executeRule(env, rule);
      console.log(`[cron] Notification rule ${rule.notification_rule_id} (${rule.name}) executed`);
    } catch (err) {
      console.error(`[cron] Notification rule ${rule.notification_rule_id} failed:`, err instanceof Error ? err.message : err);
    }
  }
}

async function executeRule(env: Env, rule: NotificationRule): Promise<void> {
  switch (rule.rule_type) {
    case 'meter_no_reading':   return checkMeterNoReading(env, rule);
    case 'meter_zero_reading': return checkMeterZeroReading(env, rule);
    case 'demand_threshold':   return checkDemandThreshold(env, rule);
    default:
      console.warn(`[notificationRunner] Unknown rule type: ${rule.rule_type}`);
  }
}
