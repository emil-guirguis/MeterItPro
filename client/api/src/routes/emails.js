/**
 * Email Routes
 * API endpoints for email sending and notification management
 */

const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const emailService = require('../services/EmailService');
const notificationScheduler = require('../services/NotificationScheduler');
const TemplateService = require('../services/TemplateService');
const db = require('../config/database');

const router = express.Router();
router.use(authenticateToken);

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// POST /api/emails/send - Send email using template
router.post('/send',
  requirePermission('email:send'),
  [
    body('templateId').isInt().withMessage('Template ID must be an integer'),
    body('recipients').isArray({ min: 1 }).withMessage('Recipients array is required'),
    body('recipients.*').isEmail().withMessage('All recipients must be valid email addresses'),
    body('variables').optional().isObject().withMessage('Variables must be an object'),
    body('options').optional().isObject().withMessage('Options must be an object')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { templateId, recipients, variables = {}, options = {} } = req.body;

      // Verify template exists
      const templateResult = await TemplateService.getTemplate(templateId);
      if (!templateResult.success) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      // Add tracking ID if not provided
      if (!options.trackingId) {
        options.trackingId = `manual-${templateId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      // Send email
      const result = await emailService.sendTemplateEmail(templateId, recipients, variables, options);

      if (result.success) {
        res.json({
          success: true,
          data: {
            messageId: result.messageId,
            templateId: result.templateId,
            recipients: result.recipients,
            trackingId: options.trackingId
          },
          message: `Email sent successfully to ${result.recipients.length} recipient(s)`
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send email'
      });
    }
  }
);

// POST /api/emails/send-raw - Send raw email without template
router.post('/send-raw',
  requirePermission('email:send'),
  [
    body('to').custom((value) => {
      if (Array.isArray(value)) {
        return value.every(email => typeof email === 'string' && /\S+@\S+\.\S+/.test(email));
      }
      return typeof value === 'string' && /\S+@\S+\.\S+/.test(value);
    }).withMessage('Recipients must be valid email address(es)'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('html').optional().isString().withMessage('HTML content must be a string'),
    body('text').optional().isString().withMessage('Text content must be a string'),
    body('cc').optional().custom((value) => {
      if (Array.isArray(value)) {
        return value.every(email => typeof email === 'string' && /\S+@\S+\.\S+/.test(email));
      }
      return typeof value === 'string' && /\S+@\S+\.\S+/.test(value);
    }).withMessage('CC recipients must be valid email address(es)'),
    body('bcc').optional().custom((value) => {
      if (Array.isArray(value)) {
        return value.every(email => typeof email === 'string' && /\S+@\S+\.\S+/.test(email));
      }
      return typeof value === 'string' && /\S+@\S+\.\S+/.test(value);
    }).withMessage('BCC recipients must be valid email address(es)')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const emailData = req.body;

      // Validate that either HTML or text content is provided
      if (!emailData.html && !emailData.text) {
        return res.status(400).json({
          success: false,
          message: 'Either HTML or text content is required'
        });
      }

      // Add tracking ID
      emailData.trackingId = `raw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Send email
      const result = await emailService.sendEmail(emailData);

      if (result.success) {
        res.json({
          success: true,
          data: {
            messageId: result.messageId,
            trackingId: emailData.trackingId,
            recipients: Array.isArray(emailData.to) ? emailData.to : [emailData.to]
          },
          message: 'Email sent successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error sending raw email:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send email'
      });
    }
  }
);

// POST /api/emails/send-with-attachment - Send email with CSV attachment
router.post('/send-with-attachment',
  authenticateToken,
  async (req, res) => {
    try {
      // Parse multipart form data manually since we're not using multer middleware
      const contentType = req.get('content-type');
      
      if (!contentType || !contentType.includes('multipart/form-data')) {
        return res.status(400).json({
          success: false,
          message: 'Content-Type must be multipart/form-data'
        });
      }

      // For now, we'll expect the file to be sent as base64 in the body
      // This is a workaround since we don't have multer middleware configured for this route
      const { subject, body, filename, fileContent, fileBase64 } = req.body;

      if (!subject) {
        return res.status(400).json({
          success: false,
          message: 'Subject is required'
        });
      }

      if (!filename) {
        return res.status(400).json({
          success: false,
          message: 'Filename is required'
        });
      }

      // Get file content - either from fileContent (string) or fileBase64 (base64 encoded)
      let fileBuffer;
      if (fileBase64) {
        fileBuffer = Buffer.from(fileBase64, 'base64');
      } else if (fileContent) {
        fileBuffer = Buffer.from(fileContent, 'utf-8');
      } else {
        return res.status(400).json({
          success: false,
          message: 'File content is required (either fileContent or fileBase64)'
        });
      }

      // Get user's email from authenticated user
      const userEmail = req.user?.email;
      if (!userEmail) {
        return res.status(400).json({
          success: false,
          message: 'User email not found'
        });
      }

      // Prepare email data with attachment
      const emailData = {
        to: userEmail,
        subject: subject,
        text: body || 'Please find the attached file',
        attachments: [
          {
            filename: filename,
            content: fileBuffer,
            contentType: 'text/csv'
          }
        ],
        trackingId: `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      // Send email
      const result = await emailService.sendEmail(emailData);

      if (result.success) {
        res.json({
          success: true,
          data: {
            messageId: result.messageId,
            trackingId: emailData.trackingId,
            recipient: userEmail
          },
          message: 'Email with attachment sent successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error sending email with attachment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send email with attachment'
      });
    }
  }
);

// POST /api/emails/send-bulk - Send bulk emails
router.post('/send-bulk',
  requirePermission('email:send'),
  [
    body('emails').isArray({ min: 1, max: 100 }).withMessage('Emails array is required (max 100)'),
    body('options.batchSize').optional().isInt({ min: 1, max: 50 }).withMessage('Batch size must be between 1 and 50'),
    body('options.delayBetweenBatches').optional().isInt({ min: 0 }).withMessage('Delay must be non-negative'),
    body('options.continueOnError').optional().isBoolean().withMessage('Continue on error must be boolean')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { emails, options = {} } = req.body;

      // Validate each email in the array
      for (let i = 0; i < emails.length; i++) {
        const email = emails[i];
        
        if (email.templateId && !Number.isInteger(email.templateId)) {
          return res.status(400).json({
            success: false,
            message: `Email ${i + 1}: Template ID must be an integer`
          });
        }

        if (!email.to || (Array.isArray(email.to) ? email.to.length === 0 : !email.to)) {
          return res.status(400).json({
            success: false,
            message: `Email ${i + 1}: Recipients are required`
          });
        }

        if (!email.templateId && !email.subject) {
          return res.status(400).json({
            success: false,
            message: `Email ${i + 1}: Subject is required for raw emails`
          });
        }
      }

      // Send bulk emails
      const result = await emailService.sendBulkEmails(emails, options);

      res.json({
        success: result.success,
        data: {
          total: result.total,
          successful: result.successful,
          failed: result.failed,
          results: result.results
        },
        message: `Bulk email completed: ${result.successful} sent, ${result.failed} failed`
      });
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send bulk emails'
      });
    }
  }
);

// GET /api/emails/delivery-stats - Get email delivery statistics
router.get('/delivery-stats',
  requirePermission('email:read'),
  [
    query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO date'),
    query('endDate').optional().isISO8601().withMessage('End date must be valid ISO date'),
    query('status').optional().isIn(['pending', 'sent', 'delivered', 'failed', 'bounced']).withMessage('Invalid status'),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const result = await emailService.getDeliveryStats(req.query);

      if (result.success) {
        res.json({
          success: true,
          data: result.stats
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error fetching delivery stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch delivery statistics'
      });
    }
  }
);

// GET /api/emails/logs - Get email logs
router.get('/logs',
  requirePermission('email:read'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['pending', 'sent', 'delivered', 'failed', 'bounced']).withMessage('Invalid status'),
    query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO date'),
    query('endDate').optional().isISO8601().withMessage('End date must be valid ISO date'),
    query('search').optional().isLength({ min: 1, max: 100 }).withMessage('Search query must be 1-100 characters')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        startDate,
        endDate,
        search
      } = req.query;

      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          el.*,
          et.name as template_name
        FROM email_logs el
        LEFT JOIN email_templates et ON el.template_id = et.email_template_id
        WHERE 1=1
      `;

      const values = [];
      let paramCount = 0;

      if (status) {
        paramCount++;
        query += ` AND el.status = $${paramCount}`;
        values.push(status);
      }

      if (startDate) {
        paramCount++;
        query += ` AND el.created_at >= $${paramCount}`;
        values.push(startDate);
      }

      if (endDate) {
        paramCount++;
        query += ` AND el.created_at <= $${paramCount}`;
        values.push(endDate);
      }

      if (search) {
        paramCount++;
        query += ` AND (el.recipient ILIKE $${paramCount} OR el.subject ILIKE $${paramCount})`;
        values.push(`%${search}%`);
      }

      // Get total count
      const countQuery = query.replace('SELECT el.*, et.name as template_name', 'SELECT COUNT(*)');
      const countResult = await db.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Add pagination
      query += ` ORDER BY el.created_at DESC`;
      
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(parseInt(limit));

      paramCount++;
      query += ` OFFSET $${paramCount}`;
      values.push(offset);

      const result = await db.query(query, values);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });
    } catch (error) {
      console.error('Error fetching email logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch email logs'
      });
    }
  }
);

// GET /api/emails/track/open/:trackingId - Track email opens
router.get('/track/open/:trackingId',
  [
    param('trackingId').notEmpty().withMessage('Tracking ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { trackingId } = req.params;

      // Update email log with open tracking
      const query = `
        UPDATE email_logs 
        SET opened_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE tracking_id = $1 AND opened_at IS NULL
        RETURNING id
      `;

      const result = await db.query(query, [trackingId]);

      // Return 1x1 transparent pixel
      const pixel = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      );

      res.set({
        'Content-Type': 'image/png',
        'Content-Length': pixel.length,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      res.send(pixel);
    } catch (error) {
      console.error('Error tracking email open:', error);
      
      // Still return pixel even if tracking fails
      const pixel = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      );

      res.set({
        'Content-Type': 'image/png',
        'Content-Length': pixel.length
      });

      res.send(pixel);
    }
  }
);

// POST /api/emails/notifications/trigger - Trigger manual notification
router.post('/notifications/trigger',
  requirePermission('notification:send'),
  [
    body('type').isIn(['monthly_report', 'maintenance_reminder', 'error_notification']).withMessage('Invalid notification type'),
    body('meterId').optional().isInt().withMessage('Meter ID must be an integer'),
    body('locationId').optional().isInt().withMessage('Location ID must be an integer'),
    body('data').optional().isObject().withMessage('Data must be an object')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { type, meterId, locationId, data = {} } = req.body;

      let result;

      switch (type) {
        case 'monthly_report':
          if (!locationId) {
            return res.status(400).json({
              success: false,
              message: 'Location ID is required for monthly reports'
            });
          }
          
          // Trigger monthly report for specific location
          result = await notificationScheduler.sendMonthlyReports();
          break;

        case 'maintenance_reminder':
          if (!meterId) {
            return res.status(400).json({
              success: false,
              message: 'Meter ID is required for maintenance reminders'
            });
          }
          
          // Trigger maintenance reminder for specific meter
          result = await notificationScheduler.sendMaintenanceReminders();
          break;

        case 'error_notification':
          if (!meterId) {
            return res.status(400).json({
              success: false,
              message: 'Meter ID is required for error notifications'
            });
          }
          
          // Prepare meter data for error notification
          const meterData = {
            meter_id: meterId,
            location_id: locationId,
            ...data
          };
          
          result = await notificationScheduler.sendMeterErrorNotification(meterData);
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid notification type'
          });
      }

      if (result && result.success) {
        res.json({
          success: true,
          data: result,
          message: `${type} notification triggered successfully`
        });
      } else {
        res.status(400).json({
          success: false,
          message: result ? result.error : 'Failed to trigger notification'
        });
      }
    } catch (error) {
      console.error('Error triggering notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to trigger notification'
      });
    }
  }
);

// GET /api/emails/notifications/status - Get notification scheduler status
router.get('/notifications/status',
  requirePermission('notification:read'),
  async (req, res) => {
    try {
      const health = await notificationScheduler.getHealthStatus();

      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      console.error('Error fetching notification status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notification status'
      });
    }
  }
);

// GET /api/emails/notifications/logs - Get notification logs
router.get('/notifications/logs',
  requirePermission('notification:read'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('type').optional().isIn(['monthly_report', 'maintenance_reminder', 'error_notification']).withMessage('Invalid notification type'),
    query('status').optional().isIn(['pending', 'sent', 'failed', 'failed_max_retries']).withMessage('Invalid status'),
    query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO date'),
    query('endDate').optional().isISO8601().withMessage('End date must be valid ISO date')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        status,
        startDate,
        endDate
      } = req.query;

      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          nl.*,
          et.name as template_name,
          m.meter_id as meter_name,
          b.name as location_name
        FROM notification_logs nl
        LEFT JOIN email_templates et ON nl.template_id = et.email_template_id
        LEFT JOIN meters m ON nl.meter_id = m.meter_id
        LEFT JOIN locations b ON nl.location_id = b.location_id
        WHERE 1=1
      `;

      const values = [];
      let paramCount = 0;

      if (type) {
        paramCount++;
        query += ` AND nl.type = $${paramCount}`;
        values.push(type);
      }

      if (status) {
        paramCount++;
        query += ` AND nl.status = $${paramCount}`;
        values.push(status);
      }

      if (startDate) {
        paramCount++;
        query += ` AND nl.created_at >= $${paramCount}`;
        values.push(startDate);
      }

      if (endDate) {
        paramCount++;
        query += ` AND nl.created_at <= $${paramCount}`;
        values.push(endDate);
      }

      // Get total count
      const countQuery = query.replace(
        'SELECT nl.*, et.name as template_name, m.meter_id as meter_name, b.name as location_name',
        'SELECT COUNT(*)'
      );
      const countResult = await db.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Add pagination
      query += ` ORDER BY nl.created_at DESC`;
      
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(parseInt(limit));

      paramCount++;
      query += ` OFFSET $${paramCount}`;
      values.push(offset);

      const result = await db.query(query, values);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });
    } catch (error) {
      console.error('Error fetching notification logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notification logs'
      });
    }
  }
);

module.exports = router;