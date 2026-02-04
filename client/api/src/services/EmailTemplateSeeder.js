/**
 * Email Template Seeder Service
 * Creates default email templates for the facility management system
 */

const EmailTemplate = require('../models/EmailTemplatesWithSchema');

class EmailTemplateSeeder {
    /**
     * Seed default email templates
     */
    static async seedDefaultTemplates(options = {}) {
        const { 
            force = false, 
            verbose = true,
            updateExisting = false 
        } = options;
        
        if (verbose) {
            console.log('🌱 Seeding default email templates...');
        }
        
        try {
            const defaultTemplates = this.getDefaultTemplates();
            let createdCount = 0;
            let skippedCount = 0;
            let updatedCount = 0;
            let errorCount = 0;

            for (const templateData of defaultTemplates) {
                try {
                    // Check if template already exists
                    const existingTemplate = await EmailTemplate.findByName(templateData.name);
                    
                    if (existingTemplate) {
                        if (updateExisting) {
                            // Update existing template with new content
                            await existingTemplate.update({
                                subject: templateData.subject,
                                content: templateData.content,
                                variables: templateData.variables,
                                category: templateData.category
                            });
                            
                            if (verbose) {
                                console.log(`🔄 Updated template: "${templateData.name}"`);
                            }
                            updatedCount++;
                        } else {
                            if (verbose) {
                                console.log(`⏭️  Template "${templateData.name}" already exists, skipping...`);
                            }
                            skippedCount++;
                        }
                        continue;
                    }

                    // Create the template
                    await EmailTemplate.create({
                        ...templateData,
                        isDefault: true,
                        createdBy: null // System created
                    });

                    if (verbose) {
                        console.log(`✅ Created template: "${templateData.name}"`);
                    }
                    createdCount++;
                } catch (error) {
                    errorCount++;
                    if (verbose) {
                        console.error(`❌ Failed to process template "${templateData.name}":`, error.message);
                    }
                    
                    if (force) {
                        continue; // Continue with other templates
                    } else {
                        throw error; // Stop on first error
                    }
                }
            }

            const result = { 
                created: createdCount, 
                skipped: skippedCount, 
                updated: updatedCount,
                errors: errorCount,
                total: defaultTemplates.length
            };

            if (verbose) {
                console.log(`🌱 Template seeding completed: ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped, ${errorCount} errors`);
            }
            
            return result;
        } catch (error) {
            console.error('❌ Failed to seed default templates:', error);
            throw error;
        }
    }

    /**
     * Seed templates on system initialization (silent mode)
     */
    static async seedOnStartup() {
        try {
            // Check if seeding is needed
            const stats = await EmailTemplate.getStats();
            const defaultCount = parseInt(stats.default_templates) || 0;
            
            if (defaultCount === 0) {
                console.log('📧 Seeding default email templates on startup...');
                const result = await this.seedDefaultTemplates({ verbose: false });
                
                if (result.created > 0) {
                    console.log(`✅ Seeded ${result.created} default email templates`);
                }
                
                return result;
            } else {
                console.log(`📧 Email templates ready (${defaultCount} default templates available)`);
                return { created: 0, skipped: defaultCount, updated: 0, errors: 0, total: defaultCount };
            }
        } catch (error) {
            console.error('❌ Failed to seed templates on startup:', error.message);
            // Don't throw - allow server to continue
            return { created: 0, skipped: 0, updated: 0, errors: 1, total: 0 };
        }
    }

    /**
     * Get default template definitions
     */
    static getDefaultTemplates() {
        return [
            {
                name: 'Password Reset Request',
                subject: 'Reset Your Password - {{company_name}}',
                content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Request</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .reset-box { background: #e3f2fd; padding: 20px; border-left: 4px solid #2196f3; margin: 20px 0; text-align: center; }
        .reset-button { display: inline-block; background: #2196f3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .reset-button:hover { background: #1976d2; }
        .warning-box { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
        .instructions { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .instructions ol { margin: 0; padding-left: 20px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
        .security-note { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; font-size: 13px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Password Reset Request</h2>
            <p>Dear {{user_name}},</p>
        </div>

        <p>We received a request to reset the password for your {{company_name}} account. If you did not make this request, you can safely ignore this email.</p>

        <div class="reset-box">
            <p><strong>Click the button below to reset your password:</strong></p>
            <a href="{{reset_link}}" class="reset-button">Reset Password</a>
            <p style="margin-top: 15px; font-size: 12px; color: #666;">Or copy and paste this link in your browser:<br>{{reset_link}}</p>
        </div>

        <div class="warning-box">
            <strong>⚠️ Important:</strong> This password reset link will expire in <strong>24 hours</strong>. If the link has expired, you can request a new one from the login page.
        </div>

        <div class="instructions">
            <h3>What to do next:</h3>
            <ol>
                <li>Click the "Reset Password" button above</li>
                <li>Enter your new password (must be at least 12 characters)</li>
                <li>Confirm your new password</li>
                <li>You'll be redirected to the login page</li>
                <li>Log in with your new password</li>
            </ol>
        </div>

        <div class="security-note">
            <strong>🔒 Security Tip:</strong> Your password should be unique and contain uppercase letters, lowercase letters, numbers, and special characters. Never share your password with anyone.
        </div>

        <p>If you did not request a password reset, please contact our support team immediately at {{support_email}}.</p>

        <div class="footer">
            <p>Best regards,<br>{{company_name}} Security Team</p>
            <p style="font-size: 12px; color: #999;">This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>`,
                category: 'authentication',
                variables: [
                    { name: 'user_name', description: 'Name of the user', type: 'text', required: true },
                    { name: 'reset_link', description: 'Password reset link with token', type: 'text', required: true },
                    { name: 'company_name', description: 'Company name', type: 'text', required: true },
                    { name: 'support_email', description: 'Support team email address', type: 'text', required: true }
                ]
            },
            {
                name: 'Two-Factor Authentication Code',
                subject: 'Your {{company_name}} Verification Code: {{otp_code}}',
                content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Two-Factor Authentication Code</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .code-box { background: #e3f2fd; padding: 20px; border-left: 4px solid #2196f3; margin: 20px 0; text-align: center; }
        .code-display { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2196f3; font-family: 'Courier New', monospace; margin: 15px 0; }
        .expiration-warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
        .security-info { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; font-size: 13px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
        .alert-box { background: #ffebee; padding: 15px; border-left: 4px solid #d32f2f; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Two-Factor Authentication Code</h2>
            <p>Dear {{user_name}},</p>
        </div>

        <p>You requested a verification code to log in to your {{company_name}} account. Use the code below to complete your login:</p>

        <div class="code-box">
            <p><strong>Your verification code is:</strong></p>
            <div class="code-display">{{otp_code}}</div>
            <p style="margin-top: 15px; font-size: 12px; color: #666;">This code is valid for <strong>5 minutes</strong></p>
        </div>

        <div class="expiration-warning">
            <strong>⏰ Important:</strong> This code will expire in <strong>5 minutes</strong>. If you don't use it in time, you'll need to request a new code.
        </div>

        <div class="security-info">
            <strong>🔒 Security Reminder:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Never share this code with anyone</li>
                <li>{{company_name}} staff will never ask for your verification code</li>
                <li>If you didn't request this code, someone may be trying to access your account</li>
            </ul>
        </div>

        {{#if suspicious_activity}}
        <div class="alert-box">
            <strong>⚠️ Suspicious Activity Detected:</strong> If you did not attempt to log in, please change your password immediately and contact our support team.
        </div>
        {{/if}}

        <p>If you did not request this code, please ignore this email. Your account remains secure.</p>

        <div class="footer">
            <p>Best regards,<br>{{company_name}} Security Team</p>
            <p style="font-size: 12px; color: #999;">This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>`,
                category: 'authentication',
                variables: [
                    { name: 'user_name', description: 'Name of the user', type: 'text', required: true },
                    { name: 'otp_code', description: '6-digit verification code', type: 'text', required: true },
                    { name: 'company_name', description: 'Company name', type: 'text', required: true },
                    { name: 'suspicious_activity', description: 'Flag indicating suspicious activity', type: 'boolean', required: false }
                ]
            },
            {
                name: 'Total Meter Reading (30 Days)',
                subject: 'Monthly Meter Reading Summary - {{location_name}}',
                content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monthly Meter Reading Summary</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .summary-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .summary-table th, .summary-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .summary-table th { background-color: #f2f2f2; font-weight: bold; }
        .increase { color: #d32f2f; }
        .decrease { color: #388e3c; }
        .stable { color: #1976d2; }
        .summary-box { background: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Monthly Meter Reading Summary</h2>
            <p>Dear {{recipient_name}},</p>
        </div>

        <p>Here is the meter reading summary for <strong>{{location_name}}</strong> for the period from {{start_date}} to {{end_date}}:</p>

        <table class="summary-table">
            <thead>
                <tr>
                    <th>Meter ID</th>
                    <th>Type</th>
                    <th>Total Usage</th>
                    <th>Previous Month</th>
                    <th>Change</th>
                </tr>
            </thead>
            <tbody>
                {{#each meters}}
                <tr>
                    <td>{{meter_id}}</td>
                    <td>{{meter_type}}</td>
                    <td>{{total_usage}} {{units}}</td>
                    <td>{{previous_usage}} {{units}}</td>
                    <td class="{{change_class}}">{{usage_change}}%</td>
                </tr>
                {{/each}}
            </tbody>
        </table>

        <div class="summary-box">
            <h3>Summary:</h3>
            <ul>
                <li>Total meters monitored: {{total_meters}}</li>
                <li>Total consumption: {{total_consumption}} {{primary_units}}</li>
                <li>Average daily usage: {{average_daily}} {{primary_units}}</li>
                <li>Month-over-month change: {{monthly_change}}%</li>
            </ul>
        </div>

        <p>If you have any questions about these readings, please contact our support team.</p>

        <div class="footer">
            <p>Best regards,<br>{{company_name}} Monitoring Team</p>
        </div>
    </div>
</body>
</html>`,
                category: 'meter_readings',
                variables: [
                    { name: 'recipient_name', description: 'Name of the email recipient', type: 'text', required: true },
                    { name: 'location_name', description: 'Name of the location', type: 'text', required: true },
                    { name: 'start_date', description: 'Start date of the reporting period', type: 'date', required: true },
                    { name: 'end_date', description: 'End date of the reporting period', type: 'date', required: true },
                    { name: 'meters', description: 'Array of meter data objects', type: 'array', required: true },
                    { name: 'total_meters', description: 'Total number of meters', type: 'number', required: true },
                    { name: 'total_consumption', description: 'Total consumption value', type: 'number', required: true },
                    { name: 'average_daily', description: 'Average daily usage', type: 'number', required: true },
                    { name: 'monthly_change', description: 'Month-over-month percentage change', type: 'number', required: true },
                    { name: 'primary_units', description: 'Primary measurement units', type: 'text', required: true },
                    { name: 'company_name', description: 'Company name', type: 'text', required: true }
                ]
            },
            {
                name: 'Meter Not Responding',
                subject: 'ALERT: Meter Not Responding - {{meter_id}} at {{location_name}}',
                content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meter Communication Alert</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .alert-header { background: #ffebee; padding: 20px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #d32f2f; }
        .alert-title { color: #d32f2f; margin: 0 0 10px 0; }
        .meter-details { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
        .actions-list { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .actions-list ol { margin: 0; padding-left: 20px; }
        .error-info { background: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
        .contact-info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="alert-header">
            <h2 class="alert-title">Meter Communication Alert</h2>
            <p>Dear {{recipient_name}},</p>
        </div>

        <p><strong>Alert:</strong> Meter {{meter_id}} at {{location_name}} has stopped responding.</p>

        <div class="meter-details">
            <h3>Meter Details:</h3>
            <ul>
                <li><strong>Meter ID:</strong> {{meter_id}}</li>
                <li><strong>Location:</strong> {{location_name}}}</li>
                <li><strong>Type:</strong> {{meter_type}}</li>
                <li><strong>Last Communication:</strong> {{last_communication}}</li>
                <li><strong>Error Duration:</strong> {{error_duration}}</li>
            </ul>
        </div>

        <div class="actions-list">
            <h3>Recommended Actions:</h3>
            <ol>
                <li>Check physical meter connection and power supply</li>
                <li>Verify network connectivity to the meter</li>
                <li>Review meter configuration settings</li>
                <li>Contact technical support if issue persists</li>
            </ol>
        </div>

        <div class="error-info">
            <p><strong>Error Code:</strong> {{error_code}}<br>
            <strong>Error Description:</strong> {{error_description}}</p>
        </div>

        <p>This alert was generated automatically. Please investigate and resolve the issue promptly to ensure continuous monitoring.</p>

        <div class="contact-info">
            <p>For technical support, contact: {{support_email}} or {{support_phone}}</p>
        </div>

        <div class="footer">
            <p>Best regards,<br>{{company_name}} Monitoring System</p>
        </div>
    </div>
</body>
</html>`,
                category: 'meter_errors',
                variables: [
                    { name: 'recipient_name', description: 'Name of the email recipient', type: 'text', required: true },
                    { name: 'meter_id', description: 'ID of the problematic meter', type: 'text', required: true },
                    { name: 'location_name', description: 'Name of the location', type: 'text', required: true },
                    { name: 'meter_type', description: 'Type of meter', type: 'text', required: true },
                    { name: 'last_communication', description: 'Last successful communication timestamp', type: 'date', required: true },
                    { name: 'error_duration', description: 'Duration of the error', type: 'text', required: true },
                    { name: 'error_code', description: 'Error code', type: 'text', required: true },
                    { name: 'error_description', description: 'Description of the error', type: 'text', required: true },
                    { name: 'support_email', description: 'Support team email', type: 'text', required: true },
                    { name: 'support_phone', description: 'Support team phone number', type: 'text', required: true },
                    { name: 'company_name', description: 'Company name', type: 'text', required: true }
                ]
            },
            {
                name: 'Meter Maintenance Reminder',
                subject: 'Maintenance Reminder: {{meter_id}} - Due {{due_date}}',
                content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scheduled Maintenance Reminder</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .maintenance-details { background: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; margin: 20px 0; }
        .checklist { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .checklist ul { margin: 0; padding-left: 20px; }
        .schedule-info { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
        .notes { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
        .contact-info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Scheduled Maintenance Reminder</h2>
            <p>Dear {{recipient_name}},</p>
        </div>

        <p>This is a reminder that maintenance is due for meter {{meter_id}} at {{location_name}}.</p>

        <div class="maintenance-details">
            <h3>Maintenance Details:</h3>
            <ul>
                <li><strong>Meter ID:</strong> {{meter_id}}</li>
                <li><strong>Location:</strong> {{location_name}}}</li>
                <li><strong>Maintenance Type:</strong> {{maintenance_type}}</li>
                <li><strong>Due Date:</strong> {{due_date}}</li>
                <li><strong>Last Maintenance:</strong> {{last_maintenance_date}}</li>
                <li><strong>Maintenance Interval:</strong> {{maintenance_interval}}</li>
            </ul>
        </div>

        <div class="checklist">
            <h3>Maintenance Checklist:</h3>
            <ul>
                {{#each maintenance_tasks}}
                <li>{{task_description}}</li>
                {{/each}}
            </ul>
        </div>

        <div class="schedule-info">
            <h3>Scheduling Information:</h3>
            <p><strong>Recommended Service Window:</strong> {{service_window}}<br>
            <strong>Estimated Duration:</strong> {{estimated_duration}}<br>
            <strong>Required Tools:</strong> {{required_tools}}</p>
        </div>

        <div class="notes">
            <p><strong>Notes:</strong> {{maintenance_notes}}</p>
        </div>

        <p>Please schedule this maintenance within the next {{grace_period}} days to ensure optimal meter performance and accuracy.</p>

        <div class="contact-info">
            <p>To schedule maintenance or for questions, contact: {{maintenance_contact}}</p>
        </div>

        <div class="footer">
            <p>Best regards,<br>{{company_name}} Maintenance Team</p>
        </div>
    </div>
</body>
</html>`,
                category: 'maintenance',
                variables: [
                    { name: 'recipient_name', description: 'Name of the email recipient', type: 'text', required: true },
                    { name: 'meter_id', description: 'ID of the meter requiring maintenance', type: 'text', required: true },
                    { name: 'location_name', description: 'Name of the location', type: 'text', required: true },
                    { name: 'maintenance_type', description: 'Type of maintenance required', type: 'text', required: true },
                    { name: 'due_date', description: 'Maintenance due date', type: 'date', required: true },
                    { name: 'last_maintenance_date', description: 'Date of last maintenance', type: 'date', required: true },
                    { name: 'maintenance_interval', description: 'Maintenance interval period', type: 'text', required: true },
                    { name: 'maintenance_tasks', description: 'Array of maintenance task objects', type: 'array', required: true },
                    { name: 'service_window', description: 'Recommended service time window', type: 'text', required: true },
                    { name: 'estimated_duration', description: 'Estimated maintenance duration', type: 'text', required: true },
                    { name: 'required_tools', description: 'Tools required for maintenance', type: 'text', required: true },
                    { name: 'maintenance_notes', description: 'Additional maintenance notes', type: 'text', required: false },
                    { name: 'grace_period', description: 'Grace period for scheduling', type: 'text', required: true },
                    { name: 'maintenance_contact', description: 'Maintenance team contact information', type: 'text', required: true },
                    { name: 'company_name', description: 'Company name', type: 'text', required: true }
                ]
            }
        ];
    }

    /**
     * Check template system health
     */
    static async checkTemplateHealth() {
        try {
            const stats = await EmailTemplate.getStats();
            const defaultTemplates = this.getDefaultTemplates();
            const requiredTemplateNames = defaultTemplates.map(t => t.name);
            
            // Check if all required templates exist
            const missingTemplates = [];
            for (const templateName of requiredTemplateNames) {
                const template = await EmailTemplate.findByName(templateName);
                if (!template) {
                    missingTemplates.push(templateName);
                }
            }
            
            const health = {
                isHealthy: missingTemplates.length === 0,
                totalTemplates: parseInt(stats.total_templates) || 0,
                defaultTemplates: parseInt(stats.default_templates) || 0,
                activeTemplates: parseInt(stats.active_templates) || 0,
                requiredTemplates: requiredTemplateNames.length,
                missingTemplates,
                categories: {
                    meterReadings: parseInt(stats.meter_reading_templates) || 0,
                    meterErrors: parseInt(stats.meter_error_templates) || 0,
                    maintenance: parseInt(stats.maintenance_templates) || 0,
                    general: parseInt(stats.general_templates) || 0
                }
            };
            
            return health;
        } catch (error) {
            return {
                isHealthy: false,
                error: error.message,
                totalTemplates: 0,
                defaultTemplates: 0,
                activeTemplates: 0,
                requiredTemplates: 0,
                missingTemplates: [],
                categories: {
                    meterReadings: 0,
                    meterErrors: 0,
                    maintenance: 0,
                    general: 0
                }
            };
        }
    }

    /**
     * Repair template system by seeding missing templates
     */
    static async repairTemplates() {
        console.log('🔧 Repairing email template system...');
        
        try {
            const health = await this.checkTemplateHealth();
            
            if (health.isHealthy) {
                console.log('✅ Template system is healthy, no repairs needed');
                return { repaired: 0, created: 0 };
            }
            
            console.log(`🔧 Found ${health.missingTemplates.length} missing templates, repairing...`);
            
            // Seed missing templates
            const result = await this.seedDefaultTemplates({ 
                force: true, 
                verbose: true 
            });
            
            console.log(`🔧 Template repair completed: ${result.created} templates restored`);
            return { repaired: result.created, created: result.created };
        } catch (error) {
            console.error('❌ Failed to repair templates:', error);
            throw error;
        }
    }

    /**
     * Remove all default templates (for testing/reset purposes)
     */
    static async removeDefaultTemplates() {
        console.log('🗑️  Removing default email templates...');
        
        try {
            const defaultTemplates = await EmailTemplate.findAll({ filters: { isDefault: true } });
            let removedCount = 0;

            for (const template of defaultTemplates.templates) {
                try {
                    await template.hardDelete();
                    console.log(`✅ Removed template: "${template.name}"`);
                    removedCount++;
                } catch (error) {
                    console.error(`❌ Failed to remove template "${template.name}":`, error.message);
                }
            }

            console.log(`🗑️  Template removal completed: ${removedCount} removed`);
            return { removed: removedCount };
        } catch (error) {
            console.error('❌ Failed to remove default templates:', error);
            throw error;
        }
    }
}

module.exports = EmailTemplateSeeder;