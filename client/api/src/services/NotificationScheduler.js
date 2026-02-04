// /**
//  * Notification Scheduler Service
//  * Handles automated meter notifications, scheduling, and trigger detection
//  */

// const cron = require('node-cron');
// const emailService = require('./EmailService');
// const EmailTemplate = require('../models/EmailTemplatesWithSchema');
// const db = require('../config/database');

// class NotificationScheduler {
//     constructor() {
//         this.scheduledJobs = new Map();
//         this.isInitialized = false;
//         this.config = null;
//         this.retryQueue = [];
//         this.processingRetries = false;
//     }

//     /**
//      * Initialize notification scheduler
//      */
//     async initialize(config = null) {
//         //emilmodbus
//         // try {
//         //     this.config = config || this.getDefaultConfig();
            
//         //     // Validate configuration
//         //     const validation = this.validateConfig(this.config);
//         //     if (!validation.isValid) {
//         //         throw new Error(`Invalid scheduler configuration: ${validation.errors.join(', ')}`);
//         //     }

//         //     // Initialize scheduled jobs
//         //     await this.initializeScheduledJobs();

//         //     // Start retry processor
//         //     this.startRetryProcessor();

//         //     this.isInitialized = true;
//         //     console.log('✅ Notification scheduler initialized successfully');
            
//         //     return { success: true };
//         // } catch (error) {
//         //     console.error('❌ Failed to initialize notification scheduler:', error.message);
//         //     this.isInitialized = false;
//         //     return { success: false, error: error.message };
//         // }
//     }

//     /**
//      * Get default scheduler configuration
//      */
//     getDefaultConfig() {
//         return {
//             schedules: {
//                 monthlyReports: {
//                     enabled: process.env.MONTHLY_REPORTS_ENABLED !== 'false',
//                     cron: process.env.MONTHLY_REPORTS_CRON || '0 9 1 * *', // 9 AM on 1st of each month
//                     template: 'Total Meter Reading (30 Days)'
//                 },
//                 maintenanceReminders: {
//                     enabled: process.env.MAINTENANCE_REMINDERS_ENABLED !== 'false',
//                     cron: process.env.MAINTENANCE_REMINDERS_CRON || '0 10 * * 1', // 10 AM every Monday
//                     template: 'Meter Maintenance Reminder'
//                 },
//                 errorNotifications: {
//                     enabled: process.env.ERROR_NOTIFICATIONS_ENABLED !== 'false',
//                     realtime: true, // Triggered by events, not cron
//                     template: 'Meter Not Responding'
//                 }
//             },
//             retry: {
//                 maxAttempts: parseInt(process.env.NOTIFICATION_MAX_RETRIES) || 3,
//                 baseDelay: parseInt(process.env.NOTIFICATION_RETRY_DELAY) || 5000, // 5 seconds
//                 maxDelay: parseInt(process.env.NOTIFICATION_MAX_DELAY) || 300000, // 5 minutes
//                 backoffMultiplier: parseFloat(process.env.NOTIFICATION_BACKOFF_MULTIPLIER) || 2
//             },
//             triggers: {
//                 meterOfflineThreshold: parseInt(process.env.METER_OFFLINE_THRESHOLD) || 300000, // 5 minutes
//                 highUsageThreshold: parseFloat(process.env.HIGH_USAGE_THRESHOLD) || 1000, // kWh
//                 maintenanceDueDays: parseInt(process.env.MAINTENANCE_DUE_DAYS) || 7 // days
//             }
//         };
//     }

//     /**
//      * Validate scheduler configuration
//      */
//     validateConfig(config) {
//         const errors = [];

//         if (!config.schedules) {
//             errors.push('Schedules configuration is required');
//         }

//         if (!config.retry) {
//             errors.push('Retry configuration is required');
//         } else {
//             if (config.retry.maxAttempts < 1) errors.push('Max retry attempts must be at least 1');
//             if (config.retry.baseDelay < 1000) errors.push('Base retry delay must be at least 1000ms');
//         }

//         return {
//             isValid: errors.length === 0,
//             errors
//         };
//     }

//     /**
//      * Initialize scheduled jobs
//      */
//     async initializeScheduledJobs() {
//         const { schedules } = this.config;

//         // Monthly meter reading reports
//         if (schedules.monthlyReports.enabled) {
//             const job = cron.schedule(schedules.monthlyReports.cron, async () => {
//                 await this.sendMonthlyReports();
//             }, { scheduled: false });

//             this.scheduledJobs.set('monthlyReports', job);
//             console.log(`📅 Scheduled monthly reports: ${schedules.monthlyReports.cron}`);
//         }

//         // Maintenance reminders
//         if (schedules.maintenanceReminders.enabled) {
//             const job = cron.schedule(schedules.maintenanceReminders.cron, async () => {
//                 await this.sendMaintenanceReminders();
//             }, { scheduled: false });

//             this.scheduledJobs.set('maintenanceReminders', job);
//             console.log(`📅 Scheduled maintenance reminders: ${schedules.maintenanceReminders.cron}`);
//         }

//         // Start all scheduled jobs
//         this.startAllJobs();
//     }

//     /**
//      * Start all scheduled jobs
//      */
//     startAllJobs() {
//         for (const [name, job] of this.scheduledJobs) {
//             job.start();
//             console.log(`▶️ Started scheduled job: ${name}`);
//         }
//     }

//     /**
//      * Stop all scheduled jobs
//      */
//     stopAllJobs() {
//         for (const [name, job] of this.scheduledJobs) {
//             job.stop();
//             console.log(`⏸️ Stopped scheduled job: ${name}`);
//         }
//     }

//     /**
//      * Send monthly meter reading reports
//      */
//     async sendMonthlyReports() {
//         console.log('📊 Generating monthly meter reading reports...');

//         try {
//             // Get template
//             const template = await EmailTemplate.findByName(this.config.schedules.monthlyReports.template);
//             if (!template) {
//                 throw new Error('Monthly report template not found');
//             }

//             // Get meter data for the past 30 days
//             const meterData = await this.getMeterDataForPeriod(30);
            
//             // Group by location and generate reports
//             const locationReports = this.groupMeterDataByLocation(meterData);

//             let successCount = 0;
//             let errorCount = 0;

//             for (const [locationId, data] of Object.entries(locationReports)) {
//                 try {
//                     // Get location contacts
//                     const contacts = await this.getLocationContacts(locationId);
                    
//                     if (contacts.length === 0) {
//                         console.warn(`No contacts found for location ${locationId}`);
//                         continue;
//                     }

//                     // Prepare template variables
//                     const variables = {
//                         location_name: data.locationName,
//                         recipient_name: contacts[0].name,
//                         start_date: this.formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
//                         end_date: this.formatDate(new Date()),
//                         meters: data.meters,
//                         total_meters: data.meters.length,
//                         total_consumption: data.totalConsumption,
//                         average_daily: (data.totalConsumption / 30).toFixed(2),
//                         monthly_change: data.monthlyChange,
//                         primary_units: 'kWh',
//                         company_name: 'Facility Management Co.'
//                     };

//                     // Send email to all contacts
//                     const recipients = contacts.map(c => c.email);
//                     const result = await emailService.sendTemplateEmail(
//                         template.id,
//                         recipients,
//                         variables,
//                         { trackingId: `monthly-${locationId}-${Date.now()}` }
//                     );

//                     if (result.success) {
//                         successCount++;
//                         console.log(`✅ Monthly report sent for location ${data.locationName}`);
//                     } else {
//                         throw new Error(result.error);
//                     }

//                 } catch (error) {
//                     errorCount++;
//                     console.error(`❌ Failed to send monthly report for location ${locationId}:`, error.message);
                    
//                     // Add to retry queue
//                     this.addToRetryQueue({
//                         type: 'monthlyReport',
//                         locationId,
//                         data,
//                         templateId: template.id,
//                         error: error.message,
//                         attempts: 0
//                     });
//                 }
//             }

//             console.log(`📊 Monthly reports completed: ${successCount} sent, ${errorCount} failed`);

//         } catch (error) {
//             console.error('❌ Monthly reports job failed:', error.message);
//         }
//     }

//     /**
//      * Send maintenance reminders
//      */
//     async sendMaintenanceReminders() {
//         console.log('🔧 Checking for maintenance reminders...');

//         try {
//             // Get template
//             const template = await EmailTemplate.findByName(this.config.schedules.maintenanceReminders.template);
//             if (!template) {
//                 throw new Error('Maintenance reminder template not found');
//             }

//             // Get meters due for maintenance
//             const dueMeters = await this.getMetersDueForMaintenance();

//             let successCount = 0;
//             let errorCount = 0;

//             for (const meter of dueMeters) {
//                 try {
//                     // Get location contacts
//                     const contacts = await this.getLocationContacts(meter.location_id);
                    
//                     if (contacts.length === 0) {
//                         console.warn(`No contacts found for location ${meter.location_name}`);
//                         continue;
//                     }

//                     // Prepare template variables
//                     const variables = {
//                         recipient_name: contacts[0].name,
//                         meter_id: meter.meter_id,
//                         location_name: meter.location_name,
//                         maintenance_type: meter.maintenance_type || 'Routine Maintenance',
//                         due_date: this.formatDate(meter.due_date),
//                         last_maintenance_date: this.formatDate(meter.last_maintenance),
//                         maintenance_interval: meter.maintenance_interval || '3 months',
//                         maintenance_tasks: [
//                             { task_description: 'Check meter calibration' },
//                             { task_description: 'Inspect physical connections' },
//                             { task_description: 'Clean meter housing' },
//                             { task_description: 'Update firmware if needed' }
//                         ],
//                         service_window: '9:00 AM - 5:00 PM',
//                         estimated_duration: '30-60 minutes',
//                         required_tools: 'Standard electrical tools',
//                         maintenance_notes: meter.notes || 'Standard maintenance procedure',
//                         grace_period: '7',
//                         maintenance_contact: 'maintenance@facility.com',
//                         company_name: 'Facility Management Co.'
//                     };

//                     // Send email to all contacts
//                     const recipients = contacts.map(c => c.email);
//                     const result = await emailService.sendTemplateEmail(
//                         template.id,
//                         recipients,
//                         variables,
//                         { trackingId: `maintenance-${meter.meter_id}-${Date.now()}` }
//                     );

//                     if (result.success) {
//                         successCount++;
//                         console.log(`✅ Maintenance reminder sent for meter ${meter.meter_id}`);
                        
//                         // Update meter maintenance reminder sent date
//                         await this.updateMaintenanceReminderSent(meter.meter_id);
//                     } else {
//                         throw new Error(result.error);
//                     }

//                 } catch (error) {
//                     errorCount++;
//                     console.error(`❌ Failed to send maintenance reminder for meter ${meter.meter_id}:`, error.message);
                    
//                     // Add to retry queue
//                     this.addToRetryQueue({
//                         type: 'maintenanceReminder',
//                         meter,
//                         templateId: template.id,
//                         error: error.message,
//                         attempts: 0
//                     });
//                 }
//             }

//             console.log(`🔧 Maintenance reminders completed: ${successCount} sent, ${errorCount} failed`);

//         } catch (error) {
//             console.error('❌ Maintenance reminders job failed:', error.message);
//         }
//     }

//     /**
//      * Send meter error notification (triggered by events)
//      */
//     async sendMeterErrorNotification(meterData) {
//         console.log(`⚠️ Sending meter error notification for ${meterData.meter_id}...`);

//         try {
//             // Get template
//             const template = await EmailTemplate.findByName(this.config.schedules.errorNotifications.template);
//             if (!template) {
//                 throw new Error('Meter error template not found');
//             }

//             // Get location contacts
//             const contacts = await this.getLocationContacts(meterData.location_id);
            
//             if (contacts.length === 0) {
//                 console.warn(`No contacts found for location ${meterData.location_name}`);
//                 return { success: false, error: 'No contacts found' };
//             }

//             // Prepare template variables
//             const variables = {
//                 recipient_name: contacts[0].name,
//                 meter_id: meterData.meter_id,
//                 location_name: meterData.location_name,
//                 meter_type: meterData.meter_type || 'Electric Meter',
//                 last_communication: this.formatDateTime(meterData.last_communication),
//                 error_duration: this.calculateErrorDuration(meterData.last_communication),
//                 error_code: meterData.error_code || 'COMM_TIMEOUT',
//                 error_description: meterData.error_description || 'Communication timeout - meter not responding',
//                 support_email: 'support@facility.com',
//                 support_phone: '(555) 123-4567',
//                 company_name: 'Facility Management Co.'
//             };

//             // Send email to all contacts
//             const recipients = contacts.map(c => c.email);
//             const result = await emailService.sendTemplateEmail(
//                 template.id,
//                 recipients,
//                 variables,
//                 { 
//                     trackingId: `error-${meterData.meter_id}-${Date.now()}`,
//                     priority: 'high'
//                 }
//             );

//             if (result.success) {
//                 console.log(`✅ Error notification sent for meter ${meterData.meter_id}`);
                
//                 // Log the notification
//                 await this.logNotification({
//                     type: 'error',
//                     meter_id: meterData.meter_id,
//                     location_id: meterData.location_id,
//                     template_id: template.id,
//                     recipients: recipients.join(', '),
//                     status: 'sent'
//                 });

//                 return { success: true, messageId: result.messageId };
//             } else {
//                 throw new Error(result.error);
//             }

//         } catch (error) {
//             console.error(`❌ Failed to send error notification for meter ${meterData.meter_id}:`, error.message);
            
//             // Add to retry queue
//             this.addToRetryQueue({
//                 type: 'errorNotification',
//                 meterData,
//                 error: error.message,
//                 attempts: 0
//             });

//             return { success: false, error: error.message };
//         }
//     }

//     /**
//      * Add failed notification to retry queue
//      */
//     addToRetryQueue(notification) {
//         notification.nextRetry = Date.now() + this.calculateRetryDelay(notification.attempts);
//         this.retryQueue.push(notification);
//         console.log(`📝 Added notification to retry queue: ${notification.type} (attempt ${notification.attempts + 1})`);
//     }

//     /**
//      * Calculate retry delay with exponential backoff
//      */
//     calculateRetryDelay(attempts) {
//         const { baseDelay, maxDelay, backoffMultiplier } = this.config.retry;
//         const delay = Math.min(baseDelay * Math.pow(backoffMultiplier, attempts), maxDelay);
//         return delay;
//     }

//     /**
//      * Start retry processor
//      */
//     startRetryProcessor() {
//         if (this.processingRetries) return;

//         this.processingRetries = true;
//         this.retryInterval = setInterval(async () => {
//             await this.processRetryQueue();
//         }, 30000); // Check every 30 seconds

//         console.log('🔄 Retry processor started');
//     }

//     /**
//      * Process retry queue
//      */
//     async processRetryQueue() {
//         if (this.retryQueue.length === 0) return;

//         const now = Date.now();
//         const readyToRetry = this.retryQueue.filter(n => n.nextRetry <= now);

//         for (const notification of readyToRetry) {
//             try {
//                 notification.attempts++;

//                 let result;
//                 switch (notification.type) {
//                     case 'errorNotification':
//                         result = await this.sendMeterErrorNotification(notification.meterData);
//                         break;
//                     case 'monthlyReport':
//                         // Implement retry logic for monthly reports
//                         result = { success: false, error: 'Retry not implemented for monthly reports' };
//                         break;
//                     case 'maintenanceReminder':
//                         // Implement retry logic for maintenance reminders
//                         result = { success: false, error: 'Retry not implemented for maintenance reminders' };
//                         break;
//                     default:
//                         result = { success: false, error: 'Unknown notification type' };
//                 }

//                 if (result.success) {
//                     // Remove from retry queue
//                     this.retryQueue = this.retryQueue.filter(n => n !== notification);
//                     console.log(`✅ Retry successful for ${notification.type}`);
//                 } else if (notification.attempts >= this.config.retry.maxAttempts) {
//                     // Max attempts reached, remove from queue and log failure
//                     this.retryQueue = this.retryQueue.filter(n => n !== notification);
//                     console.error(`❌ Max retry attempts reached for ${notification.type}, giving up`);
                    
//                     await this.logNotificationFailure(notification);
//                 } else {
//                     // Schedule next retry
//                     notification.nextRetry = now + this.calculateRetryDelay(notification.attempts);
//                     console.log(`🔄 Retry ${notification.attempts}/${this.config.retry.maxAttempts} failed for ${notification.type}, next retry in ${this.calculateRetryDelay(notification.attempts)}ms`);
//                 }

//             } catch (error) {
//                 console.error(`❌ Error processing retry for ${notification.type}:`, error.message);
//             }
//         }
//     }

//     /**
//      * Get meter data for a specific period
//      */
//     async getMeterDataForPeriod(days) {
//         const query = `
//             SELECT 
//                 m.id as meter_id,
//                 m.location_id,
//                 b.name as location_name,
//                 m.location,
//                 m.meter_type,
//                 COALESCE(SUM(mr.reading_value), 0) as total_consumption,
//                 COUNT(mr.id) as reading_count,
//                 MAX(mr.reading_date) as last_reading
//             FROM meter m
//             LEFT JOIN locations b ON m.location_id = b.id
//             LEFT JOIN meterreadings mr ON m.id = mr.meterid 
//                 AND mr.reading_date >= CURRENT_DATE - INTERVAL '${days} days'
//             WHERE m.is_active = true
//             GROUP BY m.id, m.location_id, b.name, m.location, m.meter_type
//             ORDER BY b.name, m.id
//         `;

//         try {
//             const result = await db.query(query);
//             return result.rows;
//         } catch (error) {
//             console.error('Error fetching meter data:', error);
//             return [];
//         }
//     }

//     /**
//      * Group meter data by location
//      */
//     groupMeterDataByLocation(meterData) {
//         const locations = {};

//         meterData.forEach(meter => {
//             const locationId = meter.location_id;
            
//             if (!locations[locationId]) {
//                 locations[locationId] = {
//                     locationName: meter.location_name,
//                     meters: [],
//                     totalConsumption: 0,
//                     monthlyChange: 0 // TODO: Calculate actual change
//                 };
//             }

//             locations[locationId].meters.push({
//                 meter_id: meter.meter_id,
//                 meter_type: meter.meter_type,
//                 total_usage: parseFloat(meter.total_consumption),
//                 previous_usage: parseFloat(meter.total_consumption) * 0.9, // Mock previous data
//                 usage_change: '+10', // Mock change
//                 change_class: 'increase',
//                 units: 'kWh'
//             });

//             locations[locationId].totalConsumption += parseFloat(meter.total_consumption);
//         });

//         return locations;
//     }

//     /**
//      * Get location contacts
//      */
//     async getLocationContacts(locationId) {
//         const query = `
//             SELECT name, email, phone, role
//             FROM contact 
//             WHERE location_id = $1 AND is_active = true
//             ORDER BY role, name
//         `;

//         try {
//             const result = await db.query(query, [locationId]);
//             return result.rows;
//         } catch (error) {
//             console.error('Error fetching location contacts:', error);
//             return [];
//         }
//     }

//     /**
//      * Get meters due for maintenance
//      */
//     async getMetersDueForMaintenance() {
//         const daysAhead = this.config.triggers.maintenanceDueDays;
        
//         const query = `
//             SELECT 
//                 m.id as meter_id,
//                 m.location_id,
//                 b.name as location_name,
//                 m.location,
//                 m.meter_type,
//                 m.last_maintenance,
//                 m.maintenance_interval,
//                 m.next_maintenance as due_date,
//                 m.maintenance_notes as notes
//             FROM meter m
//               LEFT JOIN locations b ON m.location_id = b.id
//             WHERE m.is_active = true 
//                 AND m.next_maintenance IS NOT NULL
//                 AND m.next_maintenance <= CURRENT_DATE + INTERVAL '${daysAhead} days'
//                 AND (m.maintenance_reminder_sent IS NULL 
//                      OR m.maintenance_reminder_sent < CURRENT_DATE - INTERVAL '7 days')
//             ORDER BY m.next_maintenance, b.name, m.id
//         `;

//         try {
//             const result = await db.query(query);
//             return result.rows;
//         } catch (error) {
//             console.error('Error fetching meters due for maintenance:', error);
//             return [];
//         }
//     }

//     /**
//      * Update maintenance reminder sent date
//      */
//     async updateMaintenanceReminderSent(meterId) {
//         const query = `
//             UPDATE meters 
//             SET maintenance_reminder_sent = CURRENT_DATE,
//                 updated_at = CURRENT_TIMESTAMP
//             WHERE id = $1
//         `;

//         try {
//             await db.query(query, [meterId]);
//         } catch (error) {
//             console.error('Error updating maintenance reminder sent date:', error);
//         }
//     }

//     /**
//      * Log notification
//      */
//     async logNotification(logData) {
//         const query = `
//             INSERT INTO notification_logs (type, meter_id, location_id, template_id, recipients, status, created_at)
//             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
//         `;

//         try {
//             await db.query(query, [
//                 logData.type,
//                 logData.meter_id,
//                 logData.location_id,
//                 logData.template_id,
//                 logData.recipients,
//                 logData.status
//             ]);
//         } catch (error) {
//             console.error('Error logging notification:', error);
//         }
//     }

//     /**
//      * Log notification failure
//      */
//     async logNotificationFailure(notification) {
//         await this.logNotification({
//             type: notification.type,
//             meter_id: notification.meterData?.meter_id || notification.meter?.meter_id,
//             location_id: notification.meterData?.location_id || notification.meter?.location_id,
//             template_id: notification.templateId,
//             recipients: 'failed',
//             status: 'failed_max_retries'
//         });
//     }

//     /**
//      * Utility methods
//      */
//     formatDate(date) {
//         return new Date(date).toLocaleDateString('en-US');
//     }

//     formatDateTime(date) {
//         return new Date(date).toLocaleString('en-US');
//     }

//     calculateErrorDuration(lastCommunication) {
//         const now = new Date();
//         const last = new Date(lastCommunication);
//         const diffMs = now - last;
//         const diffMins = Math.floor(diffMs / 60000);
        
//         if (diffMins < 60) {
//             return `${diffMins} minutes`;
//         } else if (diffMins < 1440) {
//             return `${Math.floor(diffMins / 60)} hours`;
//         } else {
//             return `${Math.floor(diffMins / 1440)} days`;
//         }
//     }

//     /**
//      * Get scheduler health status
//      */
//     async getHealthStatus() {
//         return {
//             isHealthy: this.isInitialized,
//             initialized: this.isInitialized,
//             scheduledJobs: Array.from(this.scheduledJobs.keys()),
//             retryQueueSize: this.retryQueue.length,
//             processingRetries: this.processingRetries,
//             config: {
//                 monthlyReportsEnabled: this.config?.schedules?.monthlyReports?.enabled || false,
//                 maintenanceRemindersEnabled: this.config?.schedules?.maintenanceReminders?.enabled || false,
//                 errorNotificationsEnabled: this.config?.schedules?.errorNotifications?.enabled || false
//             },
//             lastCheck: new Date().toISOString()
//         };
//     }

//     /**
//      * Stop scheduler and cleanup
//      */
//     async stop() {
//         this.stopAllJobs();
        
//         if (this.retryInterval) {
//             clearInterval(this.retryInterval);
//             this.retryInterval = null;
//         }
        
//         this.processingRetries = false;
//         this.isInitialized = false;
        
//         console.log('📅 Notification scheduler stopped');
//     }
// }

// // Create singleton instance
// const notificationScheduler = new NotificationScheduler();

// module.exports = notificationScheduler;