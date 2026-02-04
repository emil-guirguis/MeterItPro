// /**
//  * Meter Integration Service
//  * Connects notification triggers to meter data and monitoring system
//  */

// const db = require('../config/database');
// const notificationScheduler = require('./NotificationScheduler');
// // const meterDataAnalyzer = require('./MeterDataAnalyzer');
// const Meter = require('../models/MeterWithSchema');

// /**
//  * @typedef {Object} MeterWithMeterId
//  * @property {string} meterid
//  * @property {number} id
//  * @property {string} status
//  * @property {Date} last_reading_date
//  * @property {Date} updated_at
//  * @property {string} location_location
//  * @property {string} type
//  * @property {string} maintenance_interval
//  * @property {Date} last_maintenance
//  * @property {Date} installation_date
//  * @property {Date} createdat
//  */

// class MeterIntegrationService {
//     constructor() {
//         this.isInitialized = false;
//         this.config = null;
//         this.eventListeners = new Map();
//     }

//     /**
//      * Helper to safely get error message
//      * @param {unknown} error 
//      * @returns {string}
//      */
//     getErrorMessage(error) {
//         if (error && typeof error === 'object' && 'message' in error) {
//             return String(error.message);
//         }
//         return String(error);
//     }

//     /**
//      * Initialize meter integration service
//      */
//     async initialize(config = null) {
//         // try {
//         //     this.config = config || this.getDefaultConfig();
            
//         //     // Set up event listeners for meter data changes
//         //     await this.setupEventListeners();
            
//         //     // Initialize maintenance scheduling
//         //     await this.initializeMaintenanceScheduling();
            
//         //     this.isInitialized = true;
//         //     console.log('✅ Meter integration service initialized successfully');
            
//         //     return { success: true };
//         // } catch (error) {
//         //     console.error('❌ Failed to initialize meter integration service:', error.message);
//         //     this.isInitialized = false;
//         //     return { success: false, error: error.message };
//         // }
//     }

//     /**
//      * Get default configuration
//      */
//     getDefaultConfig() {
//         return {
//             monitoring: {
//                 enabled: process.env.METER_INTEGRATION_ENABLED !== 'false',
//                 checkInterval: parseInt(process.env.METER_CHECK_INTERVAL || '300000') || 300000, // 5 minutes
//                 batchSize: parseInt(process.env.METER_BATCH_SIZE || '50') || 50
//             },
//             thresholds: {
//                 offlineTimeout: parseInt(process.env.METER_OFFLINE_THRESHOLD || '300000') || 300000, // 5 minutes
//                 highUsageThreshold: parseFloat(process.env.HIGH_USAGE_THRESHOLD || '1000') || 1000, // kWh
//                 lowUsageThreshold: parseFloat(process.env.LOW_USAGE_THRESHOLD || '0.1') || 0.1, // kWh
//                 usageSpikeMultiplier: parseFloat(process.env.USAGE_SPIKE_MULTIPLIER || '2.0') || 2.0
//             },
//             maintenance: {
//                 defaultInterval: process.env.DEFAULT_MAINTENANCE_INTERVAL || '3 months',
//                 reminderDays: parseInt(process.env.MAINTENANCE_REMINDER_DAYS || '7') || 7,
//                 autoSchedule: process.env.AUTO_SCHEDULE_MAINTENANCE !== 'false'
//             },
//             notifications: {
//                 errorNotifications: process.env.ERROR_NOTIFICATIONS_ENABLED !== 'false',
//                 maintenanceReminders: process.env.MAINTENANCE_REMINDERS_ENABLED !== 'false',
//                 usageAlerts: process.env.USAGE_ALERTS_ENABLED !== 'false'
//             }
//         };
//     }

//     /**
//      * Set up event listeners for meter data changes
//      */
//     async setupEventListeners() {
//         // Listen for new meter readings
//         this.eventListeners.set('newReading', this.handleNewMeterReading.bind(this));
        
//         // Listen for meter status changes
//         this.eventListeners.set('statusChange', this.handleMeterStatusChange.bind(this));
        
//         // Listen for maintenance events
//         this.eventListeners.set('maintenanceEvent', this.handleMaintenanceEvent.bind(this));
        
//         console.log('📡 Event listeners set up for meter integration');
//     }

//     /**
//      * Handle new meter reading
//      */
//     async handleNewMeterReading(readingData) {
//         try {
//             const { meterid, reading_value, reading_date } = readingData;
            
//             // Get meter information
//             const meter = await Meter.findByMeterId(meterid);
//             if (!meter) {
//                 console.warn(`Meter ${meterid} not found for reading processing`);
//                 return;
//             }

//             // Update meter's last reading date
//             await this.updateMeterLastReading(meter.id, reading_date);

//             // Check for usage anomalies
//             if (this.config.notifications.usageAlerts) {
//                 await this.checkUsageAnomalies(meter, reading_value);
//             }

//             // Update meter status to active if it was offline
//             if (meter.status !== 'active') {
//                 await this.updateMeterStatus(meter.id, 'active');
//                 console.log(`📡 Meter ${meterid} status updated to active`);
//             }

//         } catch (error) {
//             console.error(`Error handling new meter reading for ${readingData.meterid}:`, this.getErrorMessage(error));
//         }
//     }

//     /**
//      * Handle meter status changes
//      */
//     async handleMeterStatusChange(statusData) {
//         try {
//             const { meterid, oldStatus, newStatus, reason } = statusData;
            
//             // Get meter information
//             const meter = await Meter.findByMeterId(meterid);
//             if (!meter) {
//                 console.warn(`Meter ${meterid} not found for status change processing`);
//                 return;
//             }

//             // Send error notification if meter goes offline
//             if (newStatus === 'offline' && this.config.notifications.errorNotifications) {
//                 await this.sendMeterOfflineNotification(meter, reason);
//             }

//             // Log status change
//             await this.logMeterStatusChange(meter.id, oldStatus, newStatus, reason);

//         } catch (error) {
//             console.error(`Error handling meter status change for ${statusData.meterid}:`, this.getErrorMessage(error));
//         }
//     }

//     /**
//      * Handle maintenance events
//      */
//     async handleMaintenanceEvent(maintenanceData) {
//         try {
//             const { meterid, eventType, scheduledDate, completedDate, notes } = maintenanceData;
            
//             // Get meter information
//             const meter = await Meter.findByMeterId(meterid);
//             if (!meter) {
//                 console.warn(`Meter ${meterid} not found for maintenance event processing`);
//                 return;
//             }

//             switch (eventType) {
//                 case 'scheduled':
//                     await this.scheduleMeterMaintenance(meter.id, scheduledDate, notes);
//                     break;
                    
//                 case 'completed':
//                     await this.completeMeterMaintenance(meter.id, completedDate, notes);
//                     break;
                    
//                 case 'overdue':
//                     // TODO: Implement handleOverdueMaintenance
//                     console.warn(`Overdue maintenance for meter ${meter.meterid}: ${notes}`);
//                     break;
//             }

//         } catch (error) {
//             console.error(`Error handling maintenance event for ${maintenanceData.meterid}:`, this.getErrorMessage(error));
//         }
//     }

//     /**
//      * Initialize maintenance scheduling for all meters
//      */
//     async initializeMaintenanceScheduling() {
//         if (!this.config.maintenance.autoSchedule) {
//             console.log('📅 Auto maintenance scheduling is disabled');
//             return;
//         }

//         try {
//             console.log('📅 Initializing maintenance scheduling for all meters...');
            
//             // Get all active meters without maintenance schedules
//             const metersNeedingSchedule = await this.getMetersNeedingMaintenanceSchedule();
            
//             let scheduledCount = 0;
//             for (const meter of metersNeedingSchedule) {
//                 try {
//                     await this.autoScheduleMaintenance(meter);
//                     scheduledCount++;
//                 } catch (error) {
//                     console.error(`Failed to schedule maintenance for meter ${meter.id}:`, this.getErrorMessage(error));
//                 }
//             }

//             console.log(`📅 Maintenance scheduling initialized: ${scheduledCount} meters scheduled`);

//         } catch (error) {
//             console.error('Error initializing maintenance scheduling:', this.getErrorMessage(error));
//         }
//     }

//     /**
//      * Auto-schedule maintenance for a meter
//      */
//     async autoScheduleMaintenance(meter) {
//         const installationDate = new Date(meter.installation_date || meter.createdat);
//         const now = new Date();
        
//         // Calculate next maintenance date based on installation date and interval
//         const intervalMonths = this.parseMaintenanceInterval(this.config.maintenance.defaultInterval);
//         const nextMaintenanceDate = new Date(installationDate);
        
//         // Find the next maintenance date that's in the future
//         while (nextMaintenanceDate <= now) {
//             nextMaintenanceDate.setMonth(nextMaintenanceDate.getMonth() + intervalMonths);
//         }

//         // Update meter with maintenance schedule
//         await this.updateMeterMaintenanceSchedule(meter.id, {
//             next_maintenance: nextMaintenanceDate,
//             maintenance_interval: this.config.maintenance.defaultInterval,
//             last_maintenance: meter.installation_date
//         });

//         console.log(`📅 Scheduled maintenance for meter ${meter.meterid} on ${nextMaintenanceDate.toISOString().split('T')[0]}`);
//     }

//     /**
//      * Check for usage anomalies
//      */
//     async checkUsageAnomalies(meter, currentReading) {
//         try {
//             // Get recent readings for comparison
//             const recentReadings = await this.getRecentReadings(meter.meterid, 30); // Last 30 readings
            
//             if (recentReadings.length < 5) {
//                 return; // Not enough data for analysis
//             }

//             // Calculate average usage
//             const values = recentReadings.map(r => parseFloat(/** @type {any} */(r).reading_value));
//             const average = values.reduce((sum, val) => sum + val, 0) / values.length;
//             const currentValue = parseFloat(currentReading);

//             // Check for high usage
//             if (currentValue > this.config.thresholds.highUsageThreshold) {
//                 await this.sendUsageAlert(meter, 'high_usage', {
//                     current: currentValue,
//                     threshold: this.config.thresholds.highUsageThreshold,
//                     average: average
//                 });
//             }

//             // Check for usage spike
//             if (average > 0 && currentValue > (average * this.config.thresholds.usageSpikeMultiplier)) {
//                 await this.sendUsageAlert(meter, 'usage_spike', {
//                     current: currentValue,
//                     average: average,
//                     multiplier: this.config.thresholds.usageSpikeMultiplier
//                 });
//             }

//             // Check for unusually low usage
//             if (currentValue < this.config.thresholds.lowUsageThreshold && average > this.config.thresholds.lowUsageThreshold * 2) {
//                 await this.sendUsageAlert(meter, 'low_usage', {
//                     current: currentValue,
//                     threshold: this.config.thresholds.lowUsageThreshold,
//                     average: average
//                 });
//             }

//         } catch (error) {
//             console.error(`Error checking usage anomalies for meter ${meter.meterid}:`, this.getErrorMessage(error));
//         }
//     }

//     /**
//      * Send meter offline notification
//      */
//     async sendMeterOfflineNotification(meter, reason) {
//         try {
//             // Get location information
//             const location = await this.getLocationInfo(meter.location_location);
            
//             const meterData = {
//                 meter_id: meter.meterid,
//                 location_id: /** @type {any} */(location)?.id,
//                 location_name: /** @type {any} */(location)?.name || meter.location_location || 'Unknown Location',
//                 location: this.formatMeterLocation(meter),
//                 meter_type: meter.type || 'Electric Meter',
//                 last_communication: meter.last_reading_date || meter.updated_at,
//                 error_code: 'COMM_TIMEOUT',
//                 error_description: reason || 'Meter communication timeout - no recent readings received'
//             };

//             const result = await notificationScheduler.sendMeterErrorNotification(meterData);
            
//             if (result.success) {
//                 console.log(`📧 Offline notification sent for meter ${meter.meterid}`);
//             } else {
//                 console.error(`Failed to send offline notification for meter ${meter.meterid}:`, result.error);
//             }

//         } catch (error) {
//             console.error(`Error sending offline notification for meter ${meter.meterid}:`, this.getErrorMessage(error));
//         }
//     }

//     /**
//      * Send usage alert notification
//      */
//     async sendUsageAlert(meter, alertType, data) {
//         try {
//             // For now, just log the alert
//             // In the future, this could send specific usage alert emails
//             console.log(`⚠️ Usage alert for meter ${meter.meterid}: ${alertType}`, data);
            
//             // Log the alert to database
//             await this.logUsageAlert(meter.id, alertType, data);

//         } catch (error) {
//             console.error(`Error sending usage alert for meter ${meter.meterid}:`, this.getErrorMessage(error));
//         }
//     }

//     /**
//      * Database helper methods
//      */
//     async updateMeterLastReading(meterId, readingDate) {
//         const query = `
//             UPDATE meters 
//             SET last_reading_date = $1, updatedat = CURRENT_TIMESTAMP
//             WHERE id = $2
//         `;
        
//         try {
//             await db.query(query, [readingDate, meterId]);
//         } catch (error) {
//             console.error('Error updating meter last reading:', error);
//         }
//     }

//     async updateMeterStatus(meterId, status) {
//         const query = `
//             UPDATE meters 
//             SET status = $1, updatedat = CURRENT_TIMESTAMP
//             WHERE id = $2
//         `;
        
//         try {
//             await db.query(query, [status, meterId]);
//         } catch (error) {
//             console.error('Error updating meter status:', error);
//         }
//     }

//     async updateMeterMaintenanceSchedule(meterId, maintenanceData) {
//         const query = `
//             UPDATE meters 
//             SET next_maintenance = $1, 
//                 maintenance_interval = $2, 
//                 last_maintenance = $3,
//                 updatedat = CURRENT_TIMESTAMP
//             WHERE id = $4
//         `;
        
//         try {
//             await db.query(query, [
//                 maintenanceData.next_maintenance,
//                 maintenanceData.maintenance_interval,
//                 maintenanceData.last_maintenance,
//                 meterId
//             ]);
//         } catch (error) {
//             console.error('Error updating meter maintenance schedule:', error);
//         }
//     }

//     async getMetersNeedingMaintenanceSchedule() {
//         const query = `
//             SELECT * FROM meters 
//             WHERE status = 'active' 
//                 AND (next_maintenance IS NULL OR next_maintenance < CURRENT_DATE)
//             ORDER BY installation_date ASC
//         `;
        
//         try {
//             const result = await db.query(query);
//             return result.rows.map(row => new Meter(row));
//         } catch (error) {
//             console.error('Error fetching meters needing maintenance schedule:', error);
//             return [];
//         }
//     }

//     async getRecentReadings(meterid, count = 30) {
//         const query = `
//             SELECT reading_value, reading_date
//             FROM meterreadings
//             WHERE meterid = $1
//             ORDER BY reading_date DESC
//             LIMIT $2
//         `;
        
//         try {
//             const result = await db.query(query, [meterid, count]);
//             return result.rows;
//         } catch (error) {
//             console.error('Error fetching recent readings:', error);
//             return [];
//         }
//     }

//     async getLocationInfo(locationIdentifier) {
//         if (!locationIdentifier) return null;
        
//         const query = `
//             SELECT id, name FROM locations 
//             WHERE id = $1 OR name = $1
//             LIMIT 1
//         `;
        
//         try {
//             const result = await db.query(query, [locationIdentifier]);
//             return result.rows[0] || null;
//         } catch (error) {
//             console.error('Error fetching location info:', error);
//             return null;
//         }
//     }

//     async logMeterStatusChange(meterId, oldStatus, newStatus, reason) {
//         const query = `
//             INSERT INTO meter_status_log (meter_id, old_status, new_status, reason, created_at)
//             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
//         `;
        
//         try {
//             await db.query(query, [meterId, oldStatus, newStatus, reason]);
//         } catch (error) {
//             console.error('Error logging meter status change:', error);
//         }
//     }

//     async logUsageAlert(meterId, alertType, data) {
//         const query = `
//             INSERT INTO meter_usage_alerts (meter_id, alert_type, alert_data, created_at)
//             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
//         `;
        
//         try {
//             await db.query(query, [meterId, alertType, JSON.stringify(data)]);
//         } catch (error) {
//             console.error('Error logging usage alert:', error);
//         }
//     }

//     /**
//      * Utility methods
//      */
//     parseMaintenanceInterval(interval) {
//         const match = interval.match(/(\d+)\s*(month|months|week|weeks|day|days)/i);
//         if (!match) return 3; // Default to 3 months
        
//         const value = parseInt(match[1]);
//         const unit = match[2].toLowerCase();
        
//         switch (unit) {
//             case 'day':
//             case 'days':
//                 return Math.ceil(value / 30); // Convert days to months
//             case 'week':
//             case 'weeks':
//                 return Math.ceil(value / 4); // Convert weeks to months
//             case 'month':
//             case 'months':
//             default:
//                 return value;
//         }
//     }

//     formatMeterLocation(meter) {
//         const parts = [
//             meter.location_location,
//             meter.location_floor ? `Floor ${meter.location_floor}` : null,
//             meter.location_room ? `Room ${meter.location_room}` : null,
//             meter.location_description
//         ].filter(Boolean);
        
//         return parts.length > 0 ? parts.join(', ') : 'Location not specified';
//     }

//     /**
//      * Public API methods
//      */
//     async triggerMeterCheck(meterid) {
//         try {
//             const meter = await Meter.findByMeterId(meterid);
//             if (!meter) {
//                 throw new Error('Meter not found');
//             }

//             // Check if meter is offline
//             const lastReading = meter.last_reading_date;
//             const now = new Date();
//             const timeSinceLastReading = lastReading ? now.getTime() - new Date(lastReading).getTime() : Infinity;

//             if (timeSinceLastReading > this.config.thresholds.offlineTimeout) {
//                 await this.handleMeterStatusChange({
//                     meterid: meter.meterid,
//                     oldStatus: meter.status,
//                     newStatus: 'offline',
//                     reason: `No readings for ${Math.floor(timeSinceLastReading / 60000)} minutes`
//                 });
//             }

//             return { success: true, status: timeSinceLastReading > this.config.thresholds.offlineTimeout ? 'offline' : 'online' };
//         } catch (error) {
//             return { success: false, error: this.getErrorMessage(error) };
//         }
//     }

//     async scheduleMeterMaintenance(meterid, maintenanceDate, notes = '') {
//         try {
//             const meter = await Meter.findByMeterId(meterid);
//             if (!meter) {
//                 throw new Error('Meter not found');
//             }

//             await this.updateMeterMaintenanceSchedule(meter.id, {
//                 next_maintenance: maintenanceDate,
//                 maintenance_interval: this.config.maintenance.defaultInterval,
//                 last_maintenance: meter.last_maintenance
//             });

//             // Log the maintenance scheduling
//             await this.handleMaintenanceEvent({
//                 meterid: meter.meterid,
//                 eventType: 'scheduled',
//                 scheduledDate: maintenanceDate,
//                 notes
//             });

//             return { success: true, message: 'Maintenance scheduled successfully' };
//         } catch (error) {
//             return { success: false, error: this.getErrorMessage(error) };
//         }
//     }

//     async completeMeterMaintenance(meterid, completedDate, notes = '') {
//         try {
//             const meter = await Meter.findByMeterId(meterid);
//             if (!meter) {
//                 throw new Error('Meter not found');
//             }

//             // Calculate next maintenance date
//             const intervalMonths = this.parseMaintenanceInterval(meter.maintenance_interval || this.config.maintenance.defaultInterval);
//             const nextMaintenanceDate = new Date(completedDate);
//             nextMaintenanceDate.setMonth(nextMaintenanceDate.getMonth() + intervalMonths);

//             await this.updateMeterMaintenanceSchedule(meter.id, {
//                 next_maintenance: nextMaintenanceDate,
//                 maintenance_interval: meter.maintenance_interval || this.config.maintenance.defaultInterval,
//                 last_maintenance: completedDate
//             });

//             // Log the maintenance completion
//             await this.handleMaintenanceEvent({
//                 meterid: meter.meterid,
//                 eventType: 'completed',
//                 completedDate,
//                 notes
//             });

//             return { success: true, message: 'Maintenance completed and next maintenance scheduled' };
//         } catch (error) {
//             return { success: false, error: this.getErrorMessage(error) };
//         }
//     }

//     /**
//      * Get service health status
//      */
//     async getHealthStatus() {
//         return {
//             isHealthy: this.isInitialized,
//             initialized: this.isInitialized,
//             config: {
//                 monitoringEnabled: this.config?.monitoring?.enabled || false,
//                 errorNotificationsEnabled: this.config?.notifications?.errorNotifications || false,
//                 maintenanceRemindersEnabled: this.config?.notifications?.maintenanceReminders || false,
//                 usageAlertsEnabled: this.config?.notifications?.usageAlerts || false
//             },
//             eventListeners: Array.from(this.eventListeners.keys()),
//             lastCheck: new Date().toISOString()
//         };
//     }

//     /**
//      * Stop service and cleanup
//      */
//     async stop() {
//         this.eventListeners.clear();
//         this.isInitialized = false;
//         console.log('📡 Meter integration service stopped');
//     }
// }

// // Create singleton instance
// const meterIntegrationService = new MeterIntegrationService();

// module.exports = meterIntegrationService;