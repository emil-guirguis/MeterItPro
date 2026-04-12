/**
 * AI Chat route — Cloudflare Worker
 *
 * POST /api/ai/chat
 * Body: { message: string, history?: { role: 'user' | 'assistant', content: string }[] }
 *
 * Uses Claude with tool use to answer questions about the tenant's meter data.
 * The agentic loop runs entirely inside the Worker — no external processes needed.
 */

import { Hono } from 'hono';
import Anthropic from '@anthropic-ai/sdk';
import { query, Env } from '../db';
import { authenticateToken, AuthVariables } from '../middleware';
import { logError } from '../errorHandler';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();
app.use('*', authenticateToken);

// ─── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'list_meters',
    description:
      'List all meters for this tenant. Returns meter name, location, unit, and the most recent reading value and timestamp.',
    input_schema: {
      type: 'object' as const,
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of meters to return (default 50)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_meter_readings',
    description:
      'Get recent readings for a specific meter. Use this to check current consumption, look for anomalies, or compare values over time.',
    input_schema: {
      type: 'object' as const,
      properties: {
        meter_id: {
          type: 'number',
          description: 'The numeric meter_id to query',
        },
        days: {
          type: 'number',
          description: 'How many days of history to return (default 7, max 90)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of readings to return (default 100)',
        },
      },
      required: ['meter_id'],
    },
  },
  {
    name: 'list_notification_rules',
    description:
      'List all notification/alert rules configured for this tenant — thresholds, schedules, and which meters they monitor.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_recent_alerts',
    description:
      'Get the most recent notification history — which rules fired, when, and whether emails were sent successfully.',
    input_schema: {
      type: 'object' as const,
      properties: {
        limit: {
          type: 'number',
          description: 'Number of recent alerts to return (default 20)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_dashboard_summary',
    description:
      'Get a high-level summary: total meters, devices, locations, readings in the last 24 hours, and any meters that have not reported recently.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
];

// ─── Tool executor ────────────────────────────────────────────────────────────

async function executeTool(
  env: Env,
  tenantId: number,
  toolName: string,
  toolInput: Record<string, any>
): Promise<string> {
  try {
    switch (toolName) {
      case 'list_meters': {
        const limit = Math.min(toolInput.limit ?? 50, 200);
        const result = await query(
          env,
          `SELECT m.meter_id, m.name, m.unit, m.type,
                  l.name AS location_name,
                  (SELECT mr.value FROM meter_reading mr
                   WHERE mr.meter_id = m.meter_id
                   ORDER BY mr.timestamp DESC LIMIT 1) AS latest_value,
                  (SELECT mr.timestamp FROM meter_reading mr
                   WHERE mr.meter_id = m.meter_id
                   ORDER BY mr.timestamp DESC LIMIT 1) AS latest_timestamp
           FROM meter m
           LEFT JOIN location l ON m.location_id = l.location_id
           WHERE m.tenant_id = $1
           ORDER BY m.name ASC
           LIMIT $2`,
          [tenantId, limit]
        );
        return JSON.stringify(result.rows);
      }

      case 'get_meter_readings': {
        const meterId = toolInput.meter_id;
        const days = Math.min(toolInput.days ?? 7, 90);
        const limit = Math.min(toolInput.limit ?? 100, 500);
        // Verify meter belongs to tenant
        const meterCheck = await query(
          env,
          `SELECT meter_id, name, unit FROM meter WHERE meter_id = $1 AND tenant_id = $2`,
          [meterId, tenantId]
        );
        if (meterCheck.rows.length === 0) {
          return JSON.stringify({ error: 'Meter not found or does not belong to this tenant' });
        }
        const result = await query(
          env,
          `SELECT value, timestamp, quality
           FROM meter_reading
           WHERE meter_id = $1
             AND tenant_id = $2
             AND timestamp >= NOW() - ($3 || ' days')::INTERVAL
           ORDER BY timestamp DESC
           LIMIT $4`,
          [meterId, tenantId, days, limit]
        );
        return JSON.stringify({ meter: meterCheck.rows[0], readings: result.rows });
      }

      case 'list_notification_rules': {
        const result = await query(
          env,
          `SELECT nr.notification_rule_id, nr.name, nr.description, nr.rule_type,
                  nr.active, nr.threshold_hours, nr.demand_threshold, nr.schedule_cron,
                  (SELECT COUNT(*) FROM notification_rule_recipient nrr
                   WHERE nrr.notification_rule_id = nr.notification_rule_id) AS recipient_count
           FROM notification_rule nr
           WHERE nr.tenant_id = $1
           ORDER BY nr.name ASC`,
          [tenantId]
        );
        return JSON.stringify(result.rows);
      }

      case 'get_recent_alerts': {
        const limit = Math.min(toolInput.limit ?? 20, 100);
        const result = await query(
          env,
          `SELECT nh.notification_history_id, nh.title, nh.description,
                  nh.status, nh.sent_at,
                  nr.name AS rule_name, nr.rule_type
           FROM notification_history nh
           LEFT JOIN notification_rule nr ON nh.notification_rule_id = nr.notification_rule_id
           WHERE nh.tenant_id = $1
           ORDER BY nh.sent_at DESC
           LIMIT $2`,
          [tenantId, limit]
        );
        return JSON.stringify(result.rows);
      }

      case 'get_dashboard_summary': {
        const [meters, devices, locations, recentReadings, staleMeters] = await Promise.all([
          query(env, `SELECT COUNT(*) AS total FROM meter WHERE tenant_id = $1`, [tenantId]),
          query(env, `SELECT COUNT(*) AS total FROM device WHERE tenant_id = $1`, [tenantId]),
          query(env, `SELECT COUNT(*) AS total FROM location WHERE tenant_id = $1`, [tenantId]),
          query(
            env,
            `SELECT COUNT(*) AS total FROM meter_reading
             WHERE tenant_id = $1 AND timestamp >= NOW() - INTERVAL '24 hours'`,
            [tenantId]
          ),
          query(
            env,
            `SELECT m.meter_id, m.name,
                    MAX(mr.timestamp) AS last_reading
             FROM meter m
             LEFT JOIN meter_reading mr ON mr.meter_id = m.meter_id AND mr.tenant_id = m.tenant_id
             WHERE m.tenant_id = $1
             GROUP BY m.meter_id, m.name
             HAVING MAX(mr.timestamp) < NOW() - INTERVAL '48 hours' OR MAX(mr.timestamp) IS NULL
             ORDER BY last_reading ASC NULLS FIRST
             LIMIT 10`,
            [tenantId]
          ),
        ]);
        return JSON.stringify({
          total_meters: parseInt(meters.rows[0].total, 10),
          total_devices: parseInt(devices.rows[0].total, 10),
          total_locations: parseInt(locations.rows[0].total, 10),
          readings_last_24h: parseInt(recentReadings.rows[0].total, 10),
          stale_meters: staleMeters.rows,
        });
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  } catch (err: any) {
    logError(`[AI tool error] ${toolName}:`, err);
    return JSON.stringify({ error: err.message ?? 'Tool execution failed' });
  }
}

// ─── Route ────────────────────────────────────────────────────────────────────

app.post('/', async (c) => {
  const tenantId = c.get('tenantId');

  if (!c.env.ANTHROPIC_API_KEY) {
    return c.json(
      { success: false, message: 'AI chat is not configured (ANTHROPIC_API_KEY missing)' },
      503
    );
  }

  let body: { message?: string; history?: { role: string; content: string }[] };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, message: 'Invalid JSON body' }, 400);
  }

  const { message, history = [] } = body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    return c.json({ success: false, message: 'message is required' }, 400);
  }

  const client = new Anthropic({ apiKey: c.env.ANTHROPIC_API_KEY });

  // Build the message history — validate roles
  const allowedRoles = new Set(['user', 'assistant']);
  const messages: Anthropic.MessageParam[] = [
    ...history
      .filter((h) => allowedRoles.has(h.role) && typeof h.content === 'string')
      .map((h) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
    { role: 'user' as const, content: message.trim() },
  ];

  const systemPrompt = `You are an AI assistant for MeterItPro, a facility energy management platform.
You help facility managers understand their meter data, identify issues, and make sense of their energy consumption.

You have access to tools that query the live database for this tenant. Use them to answer questions accurately.
When the user asks about meters, readings, alerts, or energy usage — always fetch fresh data using the tools rather than guessing.

Guidelines:
- Be concise and actionable. Lead with the key insight, then supporting data.
- Format numbers clearly (e.g., "123.4 kWh" not "123.4234234234 kWh").
- When you spot a problem (stale meter, missed readings, high demand), mention it proactively.
- If a meter has not reported in over 48 hours, flag it as potentially offline.
- Today's date: ${new Date().toISOString().split('T')[0]}`;

  // Agentic loop — run until Claude stops using tools
  const toolsUsed: string[] = [];
  let loopMessages = [...messages];
  const MAX_ITERATIONS = 8;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      thinking: { type: 'adaptive' },
      system: systemPrompt,
      tools: TOOLS,
      messages: loopMessages,
    });

    // If Claude is done (stop_reason = 'end_turn' and no tool use), return the response
    const textBlocks = response.content.filter((b): b is Anthropic.TextBlock => b.type === 'text');
    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
    );

    if (toolUseBlocks.length === 0) {
      const responseText = textBlocks.map((b) => b.text).join('\n');
      return c.json({
        success: true,
        response: responseText,
        tools_used: toolsUsed,
      });
    }

    // Execute all tool calls in parallel
    const toolResults = await Promise.all(
      toolUseBlocks.map(async (block) => {
        toolsUsed.push(block.name);
        const result = await executeTool(c.env, tenantId, block.name, block.input as Record<string, any>);
        return {
          type: 'tool_result' as const,
          tool_use_id: block.id,
          content: result,
        };
      })
    );

    // Append assistant response + tool results to the conversation
    loopMessages = [
      ...loopMessages,
      { role: 'assistant' as const, content: response.content },
      { role: 'user' as const, content: toolResults },
    ];
  }

  // If we exhausted iterations, return whatever text we have
  const lastAssistantMsg = [...loopMessages].reverse().find(
    (m) => m.role === 'assistant'
  );
  const lastText =
    Array.isArray(lastAssistantMsg?.content)
      ? (lastAssistantMsg!.content as Anthropic.ContentBlock[])
          .filter((b): b is Anthropic.TextBlock => b.type === 'text')
          .map((b) => b.text)
          .join('\n')
      : '';
  return c.json({
    success: true,
    response: lastText || 'I was unable to complete the analysis. Please try again.',
    tools_used: toolsUsed,
  });
});

export default app;
