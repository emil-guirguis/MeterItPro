import { Hono } from 'hono';
import { query, Env } from '../db';
import { authenticateToken, AuthVariables } from '../middleware';

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();
app.use('*', authenticateToken);

// GET /api/email-logs/search
app.get('/search', async (c) => {
  try {
    const { recipient, page: pageStr, limit: limitStr } = c.req.query();

    if (!recipient || recipient.trim().length === 0) {
      return c.json({ success: false, message: 'Recipient parameter is required' }, 400);
    }

    let page = parseInt(pageStr || '1', 10);
    let limit = parseInt(limitStr || '10', 10);
    if (page < 1) page = 1;
    if (limit < 1 || limit > 100) limit = 10;
    const offset = (page - 1) * limit;

    const countResult = await query(c.env,
      `SELECT COUNT(*) as total FROM public.report_email_logs WHERE recipient ILIKE $1`,
      [`%${recipient}%`]
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const emailsResult = await query(c.env,
      `SELECT report_email_logs_id, report_id, report_history_id, recipient, sent_at, status, error_details, created_at
       FROM public.report_email_logs WHERE recipient ILIKE $1 ORDER BY sent_at DESC LIMIT $2 OFFSET $3`,
      [`%${recipient}%`, limit, offset]
    );

    return c.json({
      success: true,
      data: {
        emails: emailsResult.rows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error: any) {
    console.error('Error searching email logs:', error);
    return c.json({ success: false, message: 'Failed to search email logs' }, 500);
  }
});

// GET /api/email-logs/export
app.get('/export', async (c) => {
  try {
    const { format = 'csv', reportId, startDate, endDate } = c.req.query();

    if (format && !['csv', 'json'].includes(format)) {
      return c.json({ success: false, message: 'Format must be either "csv" or "json"' }, 400);
    }

    let sql = `SELECT report_email_logs_id, report_id, report_history_id, recipient, sent_at, status, error_details, created_at
               FROM public.report_email_logs WHERE 1=1`;
    const params: any[] = [];
    let paramCount = 1;

    if (reportId) {
      sql += ` AND report_id = $${paramCount}`;
      params.push(reportId);
      paramCount++;
    }
    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) return c.json({ success: false, message: 'Invalid startDate format' }, 400);
      sql += ` AND sent_at >= $${paramCount}`;
      params.push(start);
      paramCount++;
    }
    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) return c.json({ success: false, message: 'Invalid endDate format' }, 400);
      sql += ` AND sent_at < $${paramCount}`;
      params.push(end);
      paramCount++;
    }

    sql += ' ORDER BY sent_at DESC';
    const result = await query(c.env, sql, params);
    const emailLogs = result.rows;

    if (format === 'json') {
      return c.json({ success: true, data: { emails: emailLogs, exportedAt: new Date().toISOString(), count: emailLogs.length } });
    }

    // CSV format
    const headers = ['ID', 'Report ID', 'History ID', 'Recipient', 'Sent At', 'Status', 'Error Details', 'Created At'];
    const rows = emailLogs.map((log: any) => [
      log.report_email_logs_id, log.report_id, log.report_history_id,
      log.recipient, log.sent_at, log.status,
      log.error_details ? `"${log.error_details.replace(/"/g, '""')}"` : '',
      log.created_at,
    ]);

    const csv = [headers.join(','), ...rows.map((row: any[]) => row.join(','))].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="email-logs-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting email logs:', error);
    return c.json({ success: false, message: 'Failed to export email logs' }, 500);
  }
});

export default app;
