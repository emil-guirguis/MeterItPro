// @ts-nocheck
const express = require('express');
const db = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  validateReportConfig,
  isReportNameUnique,
  isValidCronExpression,
  validateEmailList
} = require('../utils/reportValidation.js');

const router = express.Router();

/**
 * POST /api/reports
 * Create a new report with the provided configuration
 */
router.post('/', asyncHandler(async (req, res) => {
  console.log('\n' + '█'.repeat(120));
  console.log('█ [API] POST /api/reports - Create Report');
  console.log('█'.repeat(120));
  console.log('Request Body:', JSON.stringify(req.body, null, 2));
  console.log('█'.repeat(120) + '\n');

  const { name, type, schedule, recipients, config } = req.body;
  const basicErrors = [];

  if (!name || typeof name !== 'string') {
    basicErrors.push('Report name is required and must be a string');
  } else if (name.trim().length === 0) {
    basicErrors.push('Report name cannot be empty');
  } else if (name.length > 255) {
    basicErrors.push('Report name must not exceed 255 characters');
  }

  if (!type || typeof type !== 'string') {
    basicErrors.push('Report type is required and must be a string');
  } else if (type.trim().length === 0) {
    basicErrors.push('Report type cannot be empty');
  }

  if (!schedule || typeof schedule !== 'string') {
    basicErrors.push('Report schedule is required and must be a string');
  } else if (!isValidCronExpression(schedule)) {
    basicErrors.push('Report schedule must be a valid cron expression');
  }

  if (!Array.isArray(recipients)) {
    basicErrors.push('Recipients must be an array');
  } else if (recipients.length === 0) {
    basicErrors.push('At least one recipient is required');
  } else {
    const emailValidation = validateEmailList(recipients);
    if (!emailValidation.isValid) {
      basicErrors.push(`Invalid email format in recipients: ${emailValidation.invalidEmails.join(', ')}`);
    }
  }

  if (basicErrors.length > 0) {
    console.log('[API] Basic validation failed:', basicErrors);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: basicErrors
    });
  }

  const reportConfig = {
    name,
    type,
    schedule,
    recipients,
    config: config || {}
  };

  const validationResult = await validateReportConfig(db.pool, reportConfig);

  if (!validationResult.isValid) {
    console.log('[API] Validation failed:', validationResult.errors);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validationResult.errors
    });
  }

  try {
    const query = `
      INSERT INTO public.report (name, type, schedule, recipients, config, enabled, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING report_id, name, type, schedule, recipients, config, enabled, created_at, updated_at
    `;

    const now = new Date();
    const values = [
      name.trim(),
      type.trim(),
      schedule.trim(),
      recipients,
      config || {},
      true,
      now,
      now
    ];

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      console.error('[API] INSERT query returned no rows');
      return res.status(500).json({
        success: false,
        message: 'Failed to create report'
      });
    }

    const createdReport = result.rows[0];

    console.log('[API] Report created successfully:', {
      id: createdReport.report_id,
      name: createdReport.name,
      type: createdReport.type
    });

    res.status(201).json({
      success: true,
      data: createdReport
    });
  } catch (error) {
    console.error('[API] Error creating report:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Report name already exists'
      });
    }

    if (error.code === '23502') {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

/**
 * GET /api/reports
 * Retrieve all reports with pagination support
 */
router.get('/', asyncHandler(async (req, res) => {
  console.log('\n' + '█'.repeat(120));
  console.log('█ [API] GET /api/reports - List Reports');
  console.log('█'.repeat(120));
  console.log('Query Parameters:', req.query);
  console.log('Tenant ID:', req.tenantId);
  console.log('█'.repeat(120) + '\n');

  let page = parseInt(req.query.page, 10) || 1;
  let limit = parseInt(req.query.limit, 10) || 10;

  if (page < 1) page = 1;
  if (limit < 1 || limit > 100) limit = 10;

  const offset = (page - 1) * limit;

  try {
    const countResult = await db.query('SELECT COUNT(*) as total FROM public.report');
    const total = parseInt(countResult.rows[0].total, 10);

    const query = `
      SELECT report_id, name, type, schedule, recipients, config, enabled, created_at, updated_at
      FROM public.report
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await db.query(query, [limit, offset]);
    const totalPages = Math.ceil(total / limit);

    console.log('[API] Retrieved reports:', {
      count: result.rows.length,
      page,
      limit,
      total,
      totalPages
    });

    res.status(200).json({
      success: true,
      data: {
        items: result.rows,
        total,
        page,
        pageSize: limit,
        totalPages
      }
    });
  } catch (error) {
    console.error('[API] Error retrieving reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve reports',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

/**
 * GET /api/reports/:id
 * Retrieve a specific report by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  console.log('\n' + '█'.repeat(120));
  console.log('█ [API] GET /api/reports/:id - Get Report Details');
  console.log('█'.repeat(120));
  console.log('Report ID:', req.params.id);
  console.log('█'.repeat(120) + '\n');

  const { id } = req.params;
  
  // Validate that id is a number (bigint)
  if (isNaN(id) || !Number.isInteger(Number(id))) {
    console.log('[API] Invalid report ID format:', id);
    return res.status(400).json({
      success: false,
      message: 'Invalid report ID format'
    });
  }

  try {
    const query = `
      SELECT report_id, name, type, schedule, recipients, config, enabled, created_at, updated_at
      FROM public.report
      WHERE report_id = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      console.log('[API] Report not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const report = result.rows[0];

    console.log('[API] Retrieved report:', {
      id: report.report_id,
      name: report.name,
      type: report.type
    });

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('[API] Error retrieving report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

/**
 * PUT /api/reports/:id
 * Update an existing report configuration
 */
router.put('/:id', asyncHandler(async (req, res) => {
  console.log('\n' + '█'.repeat(120));
  console.log('█ [API] PUT /api/reports/:id - Update Report');
  console.log('█'.repeat(120));
  console.log('Report ID:', req.params.id);
  console.log('Request Body:', JSON.stringify(req.body, null, 2));
  console.log('█'.repeat(120) + '\n');

  const { id } = req.params;
  const { name, type, schedule, recipients, config } = req.body;
  
  // Validate that id is a number (bigint)
  if (isNaN(id) || !Number.isInteger(Number(id))) {
    console.log('[API] Invalid report ID format:', id);
    return res.status(400).json({
      success: false,
      message: 'Invalid report ID format'
    });
  }

  try {
    const existingReport = await db.query('SELECT report_id FROM public.report WHERE report_id = $1', [id]);
    if (existingReport.rows.length === 0) {
      console.log('[API] Report not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: ['Report name must be a non-empty string']
        });
      }
      if (name.length > 255) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: ['Report name must not exceed 255 characters']
        });
      }
      updates.push(`name = $${paramCount}`);
      values.push(name.trim());
      paramCount++;
    }

    if (type !== undefined) {
      if (typeof type !== 'string' || type.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: ['Report type must be a non-empty string']
        });
      }
      updates.push(`type = $${paramCount}`);
      values.push(type.trim());
      paramCount++;
    }

    if (schedule !== undefined) {
      if (!isValidCronExpression(schedule)) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: ['Report schedule must be a valid cron expression']
        });
      }
      updates.push(`schedule = $${paramCount}`);
      values.push(schedule.trim());
      paramCount++;
    }

    if (recipients !== undefined) {
      if (!Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: ['Recipients must be a non-empty array']
        });
      }
      const emailValidation = validateEmailList(recipients);
      if (!emailValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: [`Invalid email format in recipients: ${emailValidation.invalidEmails.join(', ')}`]
        });
      }
      updates.push(`recipients = $${paramCount}`);
      values.push(recipients);
      paramCount++;
    }

    if (config !== undefined) {
      if (typeof config !== 'object' || config === null) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: ['Report config must be an object']
        });
      }
      updates.push(`config = $${paramCount}`);
      values.push(config);
      paramCount++;
    }

    if (name !== undefined) {
      const nameCheck = await isReportNameUnique(db.pool, name, id);
      if (!nameCheck) {
        console.log('[API] Report name already exists:', name);
        return res.status(409).json({
          success: false,
          message: 'Report name already exists'
        });
      }
    }

    if (updates.length === 0) {
      const query = `
        SELECT report_id, name, type, schedule, recipients, config, enabled, created_at, updated_at
        FROM public.report
        WHERE report_id = $1
      `;
      const result = await db.query(query, [id]);
      return res.status(200).json({
        success: true,
        data: result.rows[0]
      });
    }

    updates.push(`updated_at = $${paramCount}`);
    values.push(new Date());
    paramCount++;

    values.push(id);

    const updateQuery = `
      UPDATE public.report
      SET ${updates.join(', ')}
      WHERE report_id = $${paramCount}
      RETURNING report_id, name, type, schedule, recipients, config, enabled, created_at, updated_at
    `;

    const result = await db.query(updateQuery, values);

    if (result.rows.length === 0) {
      console.error('[API] UPDATE query returned no rows');
      return res.status(500).json({
        success: false,
        message: 'Failed to update report'
      });
    }

    const updatedReport = result.rows[0];

    console.log('[API] Report updated successfully:', {
      id: updatedReport.report_id,
      name: updatedReport.name,
      type: updatedReport.type
    });

    res.status(200).json({
      success: true,
      data: updatedReport
    });
  } catch (error) {
    console.error('[API] Error updating report:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Report name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

/**
 * DELETE /api/reports/:id
 * Delete a report and cascade delete all associated history and email logs
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  console.log('\n' + '█'.repeat(120));
  console.log('█ [API] DELETE /api/reports/:id - Delete Report');
  console.log('█'.repeat(120));
  console.log('Report ID:', req.params.id);
  console.log('█'.repeat(120) + '\n');

  const { id } = req.params;
  
  // Validate that id is a number (bigint)
  if (isNaN(id) || !Number.isInteger(Number(id))) {
    console.log('[API] Invalid report ID format:', id);
    return res.status(400).json({
      success: false,
      message: 'Invalid report ID format'
    });
  }

  try {
    const existingReport = await db.query('SELECT report_id, name FROM public.report WHERE report_id = $1', [id]);
    if (existingReport.rows.length === 0) {
      console.log('[API] Report not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const reportName = existingReport.rows[0].name;

    const deleteQuery = 'DELETE FROM public.report WHERE report_id = $1';
    await db.query(deleteQuery, [id]);

    console.log('[API] Report deleted successfully:', {
      id,
      name: reportName
    });

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('[API] Error deleting report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

/**
 * PATCH /api/reports/:id/toggle
 * Toggle the enabled status of a report
 */
router.patch('/:id/toggle', asyncHandler(async (req, res) => {
  console.log('\n' + '█'.repeat(120));
  console.log('█ [API] PATCH /api/reports/:id/toggle - Toggle Report Status');
  console.log('█'.repeat(120));
  console.log('Report ID:', req.params.id);
  console.log('█'.repeat(120) + '\n');

  const { id } = req.params;
  
  // Validate that id is a number (bigint)
  if (isNaN(id) || !Number.isInteger(Number(id))) {
    console.log('[API] Invalid report ID format:', id);
    return res.status(400).json({
      success: false,
      message: 'Invalid report ID format'
    });
  }

  try {
    const getQuery = 'SELECT report_id, name, enabled FROM public.report WHERE report_id = $1';
    const getResult = await db.query(getQuery, [id]);

    if (getResult.rows.length === 0) {
      console.log('[API] Report not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const currentReport = getResult.rows[0];
    const newEnabledStatus = !currentReport.enabled;

    const updateQuery = `
      UPDATE public.report
      SET enabled = $1, updated_at = $2
      WHERE report_id = $3
      RETURNING report_id, name, enabled, updated_at
    `;

    const updateResult = await db.query(updateQuery, [newEnabledStatus, new Date(), id]);

    if (updateResult.rows.length === 0) {
      console.error('[API] UPDATE query returned no rows');
      return res.status(500).json({
        success: false,
        message: 'Failed to toggle report status'
      });
    }

    const updatedReport = updateResult.rows[0];

    console.log('[API] Report status toggled successfully:', {
      id: updatedReport.report_id,
      name: updatedReport.name,
      enabled: updatedReport.enabled
    });

    res.status(200).json({
      success: true,
      data: {
        id: updatedReport.report_id,
        name: updatedReport.name,
        enabled: updatedReport.enabled,
        updated_at: updatedReport.updated_at
      }
    });
  } catch (error) {
    console.error('[API] Error toggling report status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle report status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

/**
 * GET /api/reports/:id/history
 * Retrieve report execution history with pagination and date range filtering
 */
router.get('/:id/history', asyncHandler(async (req, res) => {
  console.log('\n' + '█'.repeat(120));
  console.log('█ [API] GET /api/reports/:id/history - Get Report History');
  console.log('█'.repeat(120));
  console.log('Report ID:', req.params.id);
  console.log('Query Parameters:', req.query);
  console.log('█'.repeat(120) + '\n');

  const { id } = req.params;
  const { startDate, endDate } = req.query;
  
  // Validate that id is a number (bigint)
  if (isNaN(id) || !Number.isInteger(Number(id))) {
    console.log('[API] Invalid report ID format:', id);
    return res.status(400).json({
      success: false,
      message: 'Invalid report ID format'
    });
  }

  let page = parseInt(req.query.page, 10) || 1;
  let limit = parseInt(req.query.limit, 10) || 10;

  if (page < 1) page = 1;
  if (limit < 1 || limit > 100) limit = 10;

  const offset = (page - 1) * limit;

  try {
    const reportCheck = await db.query('SELECT report_id FROM public.report WHERE report_id = $1', [id]);
    if (reportCheck.rows.length === 0) {
      console.log('[API] Report not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    let countQuery = 'SELECT COUNT(*) as total FROM public.report_history WHERE report_id = $1';
    let historyQuery = `
      SELECT report_history_id, report_id, executed_at, status, error_message, created_at
      FROM public.report_history
      WHERE report_id = $1
    `;
    const countParams = [id];
    const historyParams = [id];

    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid startDate format. Use ISO date format (YYYY-MM-DD or ISO 8601)'
        });
      }
      countQuery += ' AND executed_at >= $2';
      historyQuery += ' AND executed_at >= $2';
      countParams.push(start);
      historyParams.push(start);
    }

    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid endDate format. Use ISO date format (YYYY-MM-DD or ISO 8601)'
        });
      }
      const paramIndex = countParams.length + 1;
      countQuery += ` AND executed_at < $${paramIndex}`;
      historyQuery += ` AND executed_at < $${paramIndex}`;
      countParams.push(end);
      historyParams.push(end);
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total, 10);

    const paramIndex = historyParams.length + 1;
    historyQuery += ` ORDER BY executed_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    historyParams.push(limit, offset);

    const historyResult = await db.query(historyQuery, historyParams);
    const totalPages = Math.ceil(total / limit);

    console.log('[API] Retrieved report history:', {
      reportId: id,
      count: historyResult.rows.length,
      page,
      limit,
      total,
      totalPages
    });

    res.status(200).json({
      success: true,
      data: {
        history: historyResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('[API] Error retrieving report history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve report history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

/**
 * GET /api/reports/:id/history/:historyId/emails
 * Retrieve email logs for a specific report execution
 */
router.get('/:id/history/:historyId/emails', asyncHandler(async (req, res) => {
  console.log('\n' + '█'.repeat(120));
  console.log('█ [API] GET /api/reports/:id/history/:historyId/emails - Get Email Logs');
  console.log('█'.repeat(120));
  console.log('Report ID:', req.params.id);
  console.log('History ID:', req.params.historyId);
  console.log('█'.repeat(120) + '\n');

  const { id, historyId } = req.params;
  
  // Validate that ids are numbers (bigint)
  if (isNaN(id) || !Number.isInteger(Number(id)) || isNaN(historyId) || !Number.isInteger(Number(historyId))) {
    console.log('[API] Invalid ID format');
    return res.status(400).json({
      success: false,
      message: 'Invalid report ID or history ID format'
    });
  }

  try {
    const reportCheck = await db.query('SELECT report_id FROM public.report WHERE report_id = $1', [id]);
    if (reportCheck.rows.length === 0) {
      console.log('[API] Report not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const historyCheck = await db.query(
      'SELECT report_history_id FROM public.report_history WHERE report_history_id = $1 AND report_id = $2',
      [historyId, id]
    );
    if (historyCheck.rows.length === 0) {
      console.log('[API] History entry not found:', historyId);
      return res.status(404).json({
        success: false,
        message: 'History entry not found'
      });
    }

    const emailsQuery = `
      SELECT report_email_logs_id, report_id, report_history_id, recipient, sent_at, status, error_details, created_at
      FROM public.report_email_logs
      WHERE report_history_id = $1
      ORDER BY sent_at DESC
    `;

    const emailsResult = await db.query(emailsQuery, [historyId]);

    console.log('[API] Retrieved email logs:', {
      historyId,
      count: emailsResult.rows.length
    });

    res.status(200).json({
      success: true,
      data: {
        emails: emailsResult.rows
      }
    });
  } catch (error) {
    console.error('[API] Error retrieving email logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve email logs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

module.exports = router;
