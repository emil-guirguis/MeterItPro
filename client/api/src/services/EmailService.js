/**
 * Email Service
 * Handles email composition, delivery, and tracking using SMTP
 */

const nodemailer = require('nodemailer');
const TemplateRenderer = require('./TemplateRenderer');
// const EmailTemplate = require('../models/EmailTemplatesWithSchema');
const db = require('../config/database');

class EmailService {
    constructor() {
        this.transporter = null;
        this.config = null;
        this.isInitialized = false;
    }

    /**
     * Helper to safely get error message
     * @param {unknown} error 
     * @returns {string}
     */
    getErrorMessage(error) {
        if (error && typeof error === 'object' && 'message' in error) {
            return String(error.message);
        }
        return String(error);
    }

    /**
     * Initialize email service with SMTP configuration
     */
    async initialize(config = null) {
        try {
            // Use provided config or load from environment
            this.config = config || this.getDefaultConfig();
            
            // Validate configuration
            const validation = this.validateConfig(this.config);
            if (!validation.isValid) {
                throw new Error(`Invalid email configuration: ${validation.errors.join(', ')}`);
            }

            // Create SMTP transporter
            this.transporter = nodemailer.createTransport({
                host: this.config.smtp.host,
                port: this.config.smtp.port,
                secure: this.config.smtp.secure, // true for 465, false for other ports
                auth: {
                    user: this.config.smtp.user,
                    pass: this.config.smtp.password
                },
                pool: this.config.smtp.pool || true,
                maxConnections: this.config.smtp.maxConnections || 5,
                maxMessages: this.config.smtp.maxMessages || 100,
                rateDelta: this.config.smtp.rateDelta || 1000,
                rateLimit: this.config.smtp.rateLimit || 10
            });

            // Verify SMTP connection
            if (this.config.verifyConnection !== false) {
                await this.verifyConnection();
            }

            this.isInitialized = true;
            console.log('✅ Email service initialized successfully');
            
            return { success: true };
        } catch (error) {
            const errorMessage = error && typeof error === 'object' && 'message' in error ? String(error.message) : String(error);
            console.error('❌ Failed to initialize email service:', errorMessage);
            this.isInitialized = false;
            return { success: false, error: errorMessage };
        }
    }

    /**
     * Get default SMTP configuration from environment variables
     */
    getDefaultConfig() {
        return {
            smtp: {
                host: process.env.SMTP_HOST || 'localhost',
                port: parseInt(process.env.SMTP_PORT || '587') || 587,
                secure: process.env.SMTP_SECURE === 'true',
                user: process.env.SMTP_USER || '',
                password: process.env.SMTP_PASSWORD || ''
            },
            sender: {
                name: process.env.EMAIL_FROM_NAME || 'Facility Management System',
                email: process.env.EMAIL_FROM_ADDRESS || 'noreply@facility.com'
            },
            defaults: {
                replyTo: process.env.EMAIL_REPLY_TO || null,
                bcc: process.env.EMAIL_BCC || null,
                priority: process.env.EMAIL_PRIORITY || 'normal'
            },
            tracking: {
                enabled: process.env.EMAIL_TRACKING_ENABLED === 'true',
                baseUrl: process.env.EMAIL_TRACKING_BASE_URL || 'http://localhost:3001'
            },
            verifyConnection: process.env.EMAIL_VERIFY_CONNECTION !== 'false'
        };
    }

    /**
     * Validate email configuration
     */
    validateConfig(config) {
        const errors = [];

        // Validate SMTP settings
        if (!config.smtp) {
            errors.push('SMTP configuration is required');
        } else {
            if (!config.smtp.host) errors.push('SMTP host is required');
            if (!config.smtp.port) errors.push('SMTP port is required');
            if (!config.smtp.user) errors.push('SMTP user is required');
            if (!config.smtp.password) errors.push('SMTP password is required');
        }

        // Validate sender settings
        if (!config.sender) {
            errors.push('Sender configuration is required');
        } else {
            if (!config.sender.email) errors.push('Sender email is required');
            if (!this.isValidEmail(config.sender.email)) errors.push('Sender email is invalid');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Verify SMTP connection
     */
    async verifyConnection() {
        if (!this.transporter) {
            throw new Error('Email service not initialized');
        }

        try {
            await this.transporter.verify();
            console.log('✅ SMTP connection verified');
            return true;
        } catch (error) {
            const errorMsg = this.getErrorMessage(error);
            console.error('❌ SMTP connection failed:', errorMsg);
            throw new Error(`SMTP connection failed: ${errorMsg}`);
        }
    }

    /**
     * Send email using template
     */
    async sendTemplateEmail(templateId, recipients, variables = {}, options = {}) {
        try {
            if (!this.isInitialized) {
                throw new Error('Email service not initialized');
            }

            // Render template
            const renderResult = await TemplateRenderer.renderTemplate(templateId, variables, {
                escapeHtml: options.escapeHtml !== false,
                allowMissingVariables: options.allowMissingVariables !== false
            });

            if (!renderResult.success) {
                throw new Error(`Template rendering failed: ${renderResult.error}`);
            }

            const { renderedSubject, renderedContent } = renderResult.data || {};

            // Send email
            const emailResult = await this.sendEmail({
                to: recipients,
                subject: renderedSubject,
                html: renderedContent,
                ...options
            });

            // // Record template usage
            // if (emailResult.success) {
            //     try {
            //         const template = await EmailTemplate.findById(templateId);
            //         if (template) {
            //             await template.incrementUsage();
            //         }
            //     } catch (error) {
            //         console.warn('Failed to record template usage:', this.getErrorMessage(error));
            //     }
            // }

            return {
                success: emailResult.success,
                messageId: emailResult.messageId,
                templateId,
                recipients: Array.isArray(recipients) ? recipients : [recipients],
                warnings: renderResult.data?.warnings,
                error: emailResult.error
            };

        } catch (error) {
            return {
                success: false,
                error: this.getErrorMessage(error),
                templateId,
                recipients: Array.isArray(recipients) ? recipients : [recipients]
            };
        }
    }

    /**
     * Send raw email
     */
    async sendEmail(emailData) {
        try {
            if (!this.isInitialized) {
                throw new Error('Email service not initialized');
            }

            if (!this.config || !this.transporter) {
                throw new Error('Email service not properly initialized');
            }

            // Prepare email options
            const mailOptions = {
                from: `${this.config.sender.name} <${this.config.sender.email}>`,
                to: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
                subject: emailData.subject,
                html: emailData.html,
                text: emailData.text,
                cc: emailData.cc,
                bcc: emailData.bcc || this.config.defaults.bcc,
                replyTo: emailData.replyTo || this.config.defaults.replyTo,
                priority: emailData.priority || this.config.defaults.priority,
                attachments: emailData.attachments
            };

            // Add tracking if enabled
            if (this.config.tracking.enabled && emailData.trackingId) {
                mailOptions.html = this.addTrackingPixel(mailOptions.html, emailData.trackingId);
            }

            // Send email
            const info = await this.transporter.sendMail(mailOptions);

            // Log delivery
            await this.logEmailDelivery({
                messageId: info.messageId,
                to: mailOptions.to,
                subject: mailOptions.subject,
                status: 'sent',
                response: info.response
            });

            return {
                success: true,
                messageId: info.messageId,
                response: info.response
            };

        } catch (error) {
            // Log delivery failure
            await this.logEmailDelivery({
                messageId: null,
                to: emailData.to,
                subject: emailData.subject,
                status: 'failed',
                error: this.getErrorMessage(error)
            });

            return {
                success: false,
                error: this.getErrorMessage(error)
            };
        }
    }

    /**
     * Send bulk emails with rate limiting
     */
    async sendBulkEmails(emails, options = {}) {
        const {
            batchSize = 10,
            delayBetweenBatches = 1000,
            continueOnError = true
        } = options;

        const results = [];
        const batches = this.chunkArray(emails, batchSize);

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`📧 Processing batch ${i + 1}/${batches.length} (${batch.length} emails)`);

            // Process batch in parallel
            const batchPromises = batch.map(async (email, index) => {
                try {
                    const result = email.templateId 
                        ? await this.sendTemplateEmail(email.templateId, email.to, email.variables, email.options)
                        : await this.sendEmail(email);
                    
                    return { index: i * batchSize + index, ...result };
                } catch (error) {
                    return { 
                        index: i * batchSize + index, 
                        success: false, 
                        error: this.getErrorMessage(error),
                        to: email.to
                    };
                }
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);

            // Check for errors
            const batchErrors = batchResults.filter(r => !r.success);
            if (batchErrors.length > 0 && !continueOnError) {
                throw new Error(`Batch ${i + 1} failed: ${batchErrors.length} errors`);
            }

            // Delay between batches (except for the last batch)
            if (i < batches.length - 1 && delayBetweenBatches > 0) {
                await this.delay(delayBetweenBatches);
            }
        }

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        console.log(`📧 Bulk email completed: ${successful} sent, ${failed} failed`);

        return {
            success: failed === 0,
            total: results.length,
            successful,
            failed,
            results
        };
    }

    /**
     * Add tracking pixel to HTML content
     */
    addTrackingPixel(html, trackingId) {
        if (!this.config) {
            return html;
        }
        const trackingUrl = `${this.config.tracking.baseUrl}/api/email/track/open/${trackingId}`;
        const trackingPixel = `<img src="${trackingUrl}" width="1" height="1" style="display:none;" alt="" />`;
        
        // Try to insert before closing body tag, otherwise append
        if (html.includes('</body>')) {
            return html.replace('</body>', `${trackingPixel}</body>`);
        } else {
            return html + trackingPixel;
        }
    }

    /**
     * Log email delivery to database
     */
    async logEmailDelivery(logData) {
        try {
            const query = `
                INSERT INTO email_logs (message_id, recipient, subject, status, response, error, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
            `;

            const values = [
                logData.messageId,
                Array.isArray(logData.to) ? logData.to.join(', ') : logData.to,
                logData.subject,
                logData.status,
                logData.response || null,
                logData.error || null
            ];

            await db.query(query, values);
        } catch (error) {
            console.error('Failed to log email delivery:', this.getErrorMessage(error));
            // Don't throw - logging failure shouldn't break email sending
        }
    }

    /**
     * Get email delivery statistics
     */
    async getDeliveryStats(options = {}) {
        try {
            const {
                startDate,
                endDate,
                status,
                limit = 100
            } = options;

            let query = `
                SELECT 
                    status,
                    COUNT(*) as count,
                    DATE(created_at) as date
                FROM email_logs
                WHERE 1=1
            `;

            const values = [];
            let paramCount = 0;

            if (startDate) {
                paramCount++;
                query += ` AND created_at >= $${paramCount}`;
                values.push(startDate);
            }

            if (endDate) {
                paramCount++;
                query += ` AND created_at <= $${paramCount}`;
                values.push(endDate);
            }

            if (status) {
                paramCount++;
                query += ` AND status = $${paramCount}`;
                values.push(status);
            }

            query += ` GROUP BY status, DATE(created_at) ORDER BY date DESC`;

            if (limit) {
                paramCount++;
                query += ` LIMIT $${paramCount}`;
                values.push(limit);
            }

            const result = await db.query(query, values);

            return {
                success: true,
                stats: result.rows
            };
        } catch (error) {
            return {
                success: false,
                error: this.getErrorMessage(error)
            };
        }
    }

    /**
     * Get service health status
     */
    async getHealthStatus() {
        try {
            const health = {
                isHealthy: this.isInitialized,
                initialized: this.isInitialized,
                config: {
                    host: this.config?.smtp?.host || 'not configured',
                    port: this.config?.smtp?.port || 'not configured',
                    secure: this.config?.smtp?.secure || false
                },
                connection: /** @type {string | null} */ (null),
                lastCheck: new Date().toISOString()
            };

            if (this.isInitialized) {
                try {
                    await this.verifyConnection();
                    health.connection = 'verified';
                } catch (error) {
                    health.connection = 'failed';
                    health.connectionError = this.getErrorMessage(error);
                    health.isHealthy = false;
                }
            }

            return health;
        } catch (error) {
            return {
                isHealthy: false,
                error: this.getErrorMessage(error),
                lastCheck: new Date().toISOString()
            };
        }
    }

    /**
     * Utility methods
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Close email service connections
     */
    async close() {
        if (this.transporter) {
            this.transporter.close();
            this.transporter = null;
        }
        this.isInitialized = false;
        console.log('📧 Email service closed');
    }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;