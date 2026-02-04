// @ts-nocheck
const express = require('express');
const db = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /api/email-logs/search
 * Search email logs by recipient
 * 
 * Query parameters:
 * - recipient: string (required) - Email address to search for
 * - page: number (default: 1)
 * - limit: number (default: 10, max: 100)
 * 
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     emails: array of email log objects,
 *     pagination: {
 *       page: number,
 *       limit: number,
 *       total: number,
 *       totalPages: number
 *     }
 *   }
 * }
 * 
 * Error responses:
 * - 400: Missing or invalid parameters
 * - 500: Database error
 */
router.get('/search', asyncHandler(async (req, res) => {
  console.log('\n' + '█'.repeat(120));
  console.log('█ [API] GET /api/email-logs/search - Search Email Logs');
  console.log('█'.repeat(120));
  console.log('Query Parameters:', req.query);
  console.log('█'.repeat(120) + '\n');

  const { recipient } = req.query;

  // Validate recipient parameter
  if (!recipient || typeof recipient !== 'string' || recipient.trim().length === 0) {
    console.log('[API] Missing or invalid recipient parameter');
    return res.status(400).json({
      success: false,
      message: 'Recipient parameter is required and must be a non-empty string'
    });
  }

  // Parse pagination parameters
  let page = parseInt(req.query.page, 10) || 1;
  let limit = parseInt(req.query.limit, 10) || 10;

  // Validate pagination parameters
  if (page < 1) {
    page = 1;
  }
  if (limit < 1 || limit > 100) {
    limit = 10;
  }

  const offset = (page - 1) * limit;

  try {
    // Get total count of matching email logs
    const countQuery = `
      SELECT COUNT(*) as total FROM public.report_email_logs
      WHERE recipient ILIKE $1
    `;
    const countResult = await db.query(countQuery, [`%${recipient}%`]);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated email logs
    const emailsQuery = `
      SELECT report_email_logs_id, report_id, report_history_id, recipient, sent_at, status, error_details, created_at
      FROM public.report_email_logs
      WHERE recipient ILIKE $1
      ORDER BY sent_at DESC
      LIMIT $2 OFFSET $3
    `;

    const emailsResult = await db.query(emailsQuery, [`%${recipient}%`, limit, offset]);

    const totalPages = Math.ceil(total / limit);

    console.log('[API] Retrieved email logs by recipient:', {
      recipient,
      count: emailsResult.rows.length,
      page,
      limit,
      total,
      totalPages
    });

    res.status(200).json({
      success: true,
      data: {
        emails: emailsResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('[API] Error searching email logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search email logs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

/**
 * GET /api/email-logs/export
 * Export email logs as CSV or JSON
 * 
 * Query parameters:
 * - format: string (default: 'csv', options: 'csv', 'json')
 * - reportId: number (optional) - Filter by report ID
 * - startDate: string (optional, ISO date) - Filter from this date
 * - endDate: string (optional, ISO date) - Filter until this date
 * 
 * Response:
 * - CSV: text/csv with attachment header
 * - JSON: application/json with email logs array
 * 
 * Error responses:
 * - 400: Invalid parameters
 * - 500: Database error
 */
router.get('/export', asyncHandler(async (req, res) => {
  console.log('\n' + '█'.repeat(120));
  console.log('█ [API] GET /api/email-logs/export - Export Email Logs');
  console.log('█'.repeat(120));
  console.log('Query Parameters:', req.query);
  console.log('█'.repeat(120) + '\n');

  const { format = 'csv', reportId, startDate, endDate } = req.query;

  // Validate format parameter
  if (!['csv', 'json'].includes(format)) {
    console.log('[API] Invalid format parameter:', format);
    return res.status(400).json({
      success: false,
      message: 'Format must be either "csv" or "json"'
    });
  }

  try {
    // Build query with optional filters
    let query = `
      SELECT report_email_logs_id, report_id, report_history_id, recipient, sent_at, status, error_details, created_at
      FROM public.report_email_logs
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Add report ID filter if provided
    if (reportId) {
      // Validate that reportId is a number (bigint)
      if (isNaN(reportId) || !Number.isInteger(Number(reportId))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid report ID format'
        });
      }
      query += ` AND report_id = $${paramCount}`;
      params.push(reportId);
      paramCount++;
    }

    // Add date range filters if provided
    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid startDate format. Use ISO date format (YYYY-MM-DD or ISO 8601)'
        });
      }
      query += ` AND sent_at >= $${paramCount}`;
      params.push(start);
      paramCount++;
    }

    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid endDate format. Use ISO date format (YYYY-MM-DD or ISO 8601)'
        });
      }
      query += ` AND sent_at < $${paramCount}`;
      params.push(end);
      paramCount++;
    }

    query += ' ORDER BY sent_at DESC';

    // Execute query
    const result = await db.query(query, params);
    const emailLogs = result.rows;

    console.log('[API] Retrieved email logs for export:', {
      count: emailLogs.length,
      format
    });

    if (format === 'json') {
      // Return JSON format
      res.status(200).json({
        success: true,
        data: {
          emails: emailLogs,
          exportedAt: new Date().toISOString(),
          count: emailLogs.length
        }
      });
    } else {
      // Return CSV format
      if (emailLogs.length === 0) {
        // Return empty CSV with headers
        const headers = ['ID', 'Report ID', 'History ID', 'Recipient', 'Sent At', 'Status', 'Error Details', 'Created At'];
        const csv = headers.join(',');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="email-logs-${new Date().toISOString().split('T')[0]}.csv"`);
        return res.send(csv);
      }

      // Convert to CSV
      const headers = ['ID', 'Report ID', 'History ID', 'Recipient', 'Sent At', 'Status', 'Error Details', 'Created At'];
      const rows = emailLogs.map(log => [
        log.report_email_logs_id,
        log.report_id,
        log.report_history_id,
        log.recipient,
        log.sent_at,
        log.status,
        log.error_details ? `"${log.error_details.replace(/"/g, '""')}"` : '',
        log.created_at
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="email-logs-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    }
  } catch (error) {
    console.error('[API] Error exporting email logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export email logs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

module.exports = router;
