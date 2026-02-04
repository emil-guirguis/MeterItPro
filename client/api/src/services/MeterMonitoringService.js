// /**
//  * Meter Monitoring Service
//  * Actively monitors meter data and triggers notifications based on patterns and thresholds
//  */

// const db = require('../config/database');
// // const meterIntegrationService = require('./MeterIntegrationService');
// const Meter = require('../models/MeterWithSchema');

// class MeterMonitoringService {
//     constructor() {
//         this.isMonitoring = false;
//         this.monitoringInterval = null;
//         this.config = null;
//         this.lastCheckTime = null;
//     }

//     /**
//      * Initialize meter monitoring service
//      */
//     async initialize(config = null) {
//         // emilmodbus
//         // try {
//         //     this.config = config || this.getDefaultConfig();
            
//         //     console.log('✅ Meter monitoring service initialized successfully');
//         //     return { success: true };
//         // } catch (error) {
//         //     console.error('❌ Failed to initialize meter monitoring service:', error.message);
//         //     return { success: false, error: error.message };
//         // }
//     }

//     /**
//      * Get default configuration
//      */
//     getDefaultConfig() {
//         return {
//             monitoring: {
//                 enabled: process.env.METER_MONITORING_ENABLED !== 'false',
//                 interval: parseInt(process.env.METER_MONITORING_INTERVAL) || 300000, // 5 minutes
//                 batchSize: parseInt(process.env.METER_MONITORING_BATCH_SIZE) || 50
//             },
//             thresholds: {
//                 offlineTimeout: parseInt(process.env.METER_OFFLINE_THRESHOLD) || 900000, // 15 minutes
//                 communicationGap: parseInt(process.env.COMMUNICATION_GAP_THRESHOLD) || 1800000, // 30 minutes
//                 readingFrequency: parseInt(process.env.EXPECTED_READING_FREQUENCY) || 300000 // 5 minutes
//             },
//             notifications: {
//                 immediateAlerts: process.env.IMMEDIATE_ALERTS_ENABLED !== 'false',
//                 batchAlerts: process.env.BATCH_ALERTS_ENABLED !== 'false',
//                 maxAlertsPerHour: parseInt(process.env.MAX_ALERTS_PER_HOUR) || 10
//             }
//         };
//     }

//     /**
//      * Start monitoring meter data
//      */
//     startMonitoring() {
//         if (this.isMonitoring) {
//             console.log('⚠️ Meter monitoring is already running');
//             return;
//         }

//         if (!this.config.monitoring.enabled) {
//             console.log('📊 Meter monitoring is disabled in configuration');
//             return;
//         }

//         this.isMonitoring = true;
//         this.lastCheckTime = new Date();
        
//         this.monitoringInterval = setInterval(async () => {
//             await this.performMonitoringCheck();
//         }, this.config.monitoring.interval);

//         console.log(`📊 Started meter monitoring (interval: ${this.config.monitoring.interval}ms)`);
//     }

//     /**
//      * Stop monitoring meter data
//      */
//     stopMonitoring() {
//         if (this.monitoringInterval) {
//             clearInterval(this.monitoringInterval);
//             this.monitoringInterval = null;
//         }
        
//         this.isMonitoring = false;
//         console.log('📊 Stopped meter monitoring');
//     }

//     /**
//      * Perform monitoring check
//      */
//     async performMonitoringCheck() {
//         try {
//             const startTime = new Date();
//             console.log('🔍 Performing meter monitoring check...');

//             // Get all active meters
//             const meters = await this.getAllMeters();
            
//             if (meters.length === 0) {
//                 console.log('📊 No active meters found for monitoring');
//                 return;
//             }

//             let offlineCount = 0;
//             let alertsTriggered = 0;
//             const batchSize = this.config.monitoring.batchSize;

//             // Process meters in batches
//             for (let i = 0; i < meters.length; i += batchSize) {
//                 const batch = meters.slice(i, i + batchSize);
                
//                 for (const meter of batch) {
//                     try {
//                         const status = await this.checkMeterStatus(meter);
                        
//                         if (status.isOffline) {
//                             offlineCount++;
                            
//                             if (status.shouldAlert) {
//                                 await this.triggerOfflineAlert(meter, status);
//                                 alertsTriggered++;
//                             }
//                         }

//                         // Check for communication gaps
//                         const gapStatus = await this.checkCommunicationGaps(meter);
//                         if (gapStatus.hasGaps && gapStatus.shouldAlert) {
//                             await this.triggerCommunicationGapAlert(meter, gapStatus);
//                             alertsTriggered++;
//                         }

//                         // Check for reading patterns
//                         const patternStatus = await this.checkReadingPatterns(meter);
//                         if (patternStatus.hasAnomalies && patternStatus.shouldAlert) {
//                             await this.triggerPatternAlert(meter, patternStatus);
//                             alertsTriggered++;
//                         }

//                     } catch (error) {
//                         console.error(`❌ Error checking meter ${meter.meterid}:`, error.message);
//                     }
//                 }

//                 // Small delay between batches
//                 if (i + batchSize < meters.length) {
//                     await this.delay(100);
//                 }
//             }

//             const duration = new Date() - startTime;
//             this.lastCheckTime = new Date();

//             console.log(`🔍 Monitoring check completed: ${meters.length} meters checked, ${offlineCount} offline, ${alertsTriggered} alerts triggered (${duration}ms)`);

//         } catch (error) {
//             console.error('❌ Error during monitoring check:', error.message);
//         }
//     }

//     /**
//      * Check meter status (online/offline)
//      */
//     async checkMeterStatus(meter) {
//         try {
//             const now = new Date();
//             const lastReadingDate = meter.last_reading_date ? new Date(meter.last_reading_date) : null;
            
//             if (!lastReadingDate) {
//                 return {
//                     isOffline: true,
//                     reason: 'No readings found',
//                     duration: null,
//                     shouldAlert: true
//                 };
//             }

//             const timeSinceLastReading = now - lastReadingDate;
//             const isOffline = timeSinceLastReading > this.config.thresholds.offlineTimeout;

//             // Check if we should alert (avoid spam)
//             const shouldAlert = isOffline && await this.shouldSendAlert(meter.meter_id, 'offline');

//             return {
//                 isOffline,
//                 reason: isOffline ? `No readings for ${this.formatDuration(timeSinceLastReading)}` : null,
//                 duration: timeSinceLastReading,
//                 lastReading: lastReadingDate,
//                 shouldAlert
//             };

//         } catch (error) {
//             console.error(`Error checking status for meter ${meter.meterid}:`, error.message);
//             return { isOffline: false, shouldAlert: false };
//         }
//     }

//     /**
//      * Check for communication gaps
//      */
//     async checkCommunicationGaps(meter) {
//         try {
//             // Get recent readings to analyze gaps
//             const readings = await this.getRecentReadings(meter.meterid, 20);
            
//             if (readings.length < 2) {
//                 return { hasGaps: false, shouldAlert: false };
//             }

//             const gaps = [];
//             for (let i = 0; i < readings.length - 1; i++) {
//                 const current = new Date(readings[i].reading_date);
//                 const next = new Date(readings[i + 1].reading_date);
//                 const gap = current - next;
                
//                 if (gap > this.config.thresholds.communicationGap) {
//                     gaps.push({
//                         start: next,
//                         end: current,
//                         duration: gap
//                     });
//                 }
//             }

//             const hasSignificantGaps = gaps.length > 0;
//             const shouldAlert = hasSignificantGaps && await this.shouldSendAlert(meter.meter_id, 'communication_gaps');

//             return {
//                 hasGaps: hasSignificantGaps,
//                 gaps,
//                 shouldAlert
//             };

//         } catch (error) {
//             console.error(`Error checking communication gaps for meter ${meter.meterid}:`, error.message);
//             return { hasGaps: false, shouldAlert: false };
//         }
//     }

//     /**
//      * Check reading patterns for anomalies
//      */
//     async checkReadingPatterns(meter) {
//         try {
//             // Get recent readings for pattern analysis
//             const readings = await this.getRecentReadings(meter.meterid, 50);
            
//             if (readings.length < 10) {
//                 return { hasAnomalies: false, shouldAlert: false };
//             }

//             const values = readings.map(r => parseFloat(r.reading_value)).filter(v => !isNaN(v));
            
//             if (values.length < 10) {
//                 return { hasAnomalies: false, shouldAlert: false };
//             }

//             // Calculate statistics
//             const stats = this.calculateStatistics(values);
//             const anomalies = [];

//             // Check for consecutive zero readings
//             const zeroCount = this.countConsecutiveZeros(values);
//             if (zeroCount >= 5) {
//                 anomalies.push({
//                     type: 'consecutive_zeros',
//                     count: zeroCount,
//                     severity: 'medium'
//                 });
//             }

//             // Check for stuck readings (same value repeated)
//             const stuckCount = this.countStuckReadings(values);
//             if (stuckCount >= 10) {
//                 anomalies.push({
//                     type: 'stuck_readings',
//                     count: stuckCount,
//                     value: values[0],
//                     severity: 'high'
//                 });
//             }

//             // Check for extreme outliers
//             const outliers = this.findOutliers(values, stats);
//             if (outliers.length > 0) {
//                 anomalies.push({
//                     type: 'outliers',
//                     count: outliers.length,
//                     values: outliers,
//                     severity: 'medium'
//                 });
//             }

//             const hasAnomalies = anomalies.length > 0;
//             const shouldAlert = hasAnomalies && await this.shouldSendAlert(meter.meter_id, 'pattern_anomaly');

//             return {
//                 hasAnomalies,
//                 anomalies,
//                 statistics: stats,
//                 shouldAlert
//             };

//         } catch (error) {
//             console.error(`Error checking reading patterns for meter ${meter.meterid}:`, error.message);
//             return { hasAnomalies: false, shouldAlert: false };
//         }
//     }

//     /**
//      * Trigger offline alert
//      */
//     async triggerOfflineAlert(meter, status) {
//         try {
//             // Update meter status if needed
//             if (meter.status !== 'offline') {
//                 await this.updateMeterStatus(meter.meter_id, 'offline', status.reason);
//             }

//             // Trigger notification through integration service
//             await meterIntegrationService.handleMeterStatusChange({
//                 meterid: meter.meterid,
//                 oldStatus: meter.status,
//                 newStatus: 'offline',
//                 reason: status.reason
//             });

//             // Log the alert
//             await this.logAlert(meter.meter_id, 'offline', {
//                 reason: status.reason,
//                 duration: status.duration,
//                 lastReading: status.lastReading
//             });

//             console.log(`🚨 Offline alert triggered for meter ${meter.meterid}: ${status.reason}`);

//         } catch (error) {
//             console.error(`Error triggering offline alert for meter ${meter.meterid}:`, error.message);
//         }
//     }

//     /**
//      * Trigger communication gap alert
//      */
//     async triggerCommunicationGapAlert(meter, gapStatus) {
//         try {
//             // Log the alert
//             await this.logAlert(meter.meter_id, 'communication_gaps', {
//                 gapCount: gapStatus.gaps.length,
//                 gaps: gapStatus.gaps.map(gap => ({
//                     start: gap.start,
//                     end: gap.end,
//                     duration: gap.duration
//                 }))
//             });

//             console.log(`⚠️ Communication gap alert for meter ${meter.meterid}: ${gapStatus.gaps.length} gaps detected`);

//         } catch (error) {
//             console.error(`Error triggering communication gap alert for meter ${meter.meterid}:`, error.message);
//         }
//     }

//     /**
//      * Trigger pattern alert
//      */
//     async triggerPatternAlert(meter, patternStatus) {
//         try {
//             // Log the alert
//             await this.logAlert(meter.meter_id, 'pattern_anomaly', {
//                 anomalyCount: patternStatus.anomalies.length,
//                 anomalies: patternStatus.anomalies,
//                 statistics: patternStatus.statistics
//             });

//             console.log(`📊 Pattern anomaly alert for meter ${meter.meterid}: ${patternStatus.anomalies.length} anomalies detected`);

//         } catch (error) {
//             console.error(`Error triggering pattern alert for meter ${meter.meterid}:`, error.message);
//         }
//     }


//     async getRecentReadings(meterid, count = 20) {
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

//     async updateMeterStatus(meterId, status, reason) {
//         const query = `
//             UPDATE meters 
//             SET status = $1, updatedat = CURRENT_TIMESTAMP
//             WHERE id = $2
//         `;

//         try {
//             await db.query(query, [status, meterId]);
            
//             // Log status change
//             await this.logStatusChange(meterId, status, reason);
//         } catch (error) {
//             console.error('Error updating meter status:', error);
//         }
//     }

//     async logStatusChange(meterId, newStatus, reason) {
//         const query = `
//             INSERT INTO meter_status_log (meter_id, new_status, reason, created_at)
//             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
//         `;

//         try {
//             await db.query(query, [meterId, newStatus, reason]);
//         } catch (error) {
//             console.error('Error logging status change:', error);
//         }
//     }

//     async logAlert(meterId, alertType, alertData) {
//         const query = `
//             INSERT INTO meter_monitoring_alerts (meter_id, alert_type, alert_data, created_at)
//             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
//         `;

//         try {
//             await db.query(query, [meterId, alertType, JSON.stringify(alertData)]);
//         } catch (error) {
//             console.error('Error logging alert:', error);
//         }
//     }

//     async shouldSendAlert(meterId, alertType) {
//         // Check if we've sent this type of alert recently to avoid spam
//         const query = `
//             SELECT COUNT(*) as count
//             FROM meter_monitoring_alerts
//             WHERE meter_id = $1 
//                 AND alert_type = $2 
//                 AND created_at > NOW() - INTERVAL '1 hour'
//         `;

//         try {
//             const result = await db.query(query, [meterId, alertType]);
//             const recentAlerts = parseInt(result.rows[0].count);
            
//             return recentAlerts < this.config.notifications.maxAlertsPerHour;
//         } catch (error) {
//             console.error('Error checking alert frequency:', error);
//             return true; // Default to allowing alerts if check fails
//         }
//     }

//     /**
//      * Statistical analysis methods
//      */
//     calculateStatistics(values) {
//         if (values.length === 0) return null;

//         const sum = values.reduce((a, b) => a + b, 0);
//         const mean = sum / values.length;
        
//         const sortedValues = [...values].sort((a, b) => a - b);
//         const median = sortedValues.length % 2 === 0
//             ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
//             : sortedValues[Math.floor(sortedValues.length / 2)];

//         const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
//         const stdDev = Math.sqrt(variance);

//         return {
//             count: values.length,
//             mean,
//             median,
//             stdDev,
//             min: Math.min(...values),
//             max: Math.max(...values),
//             sum
//         };
//     }

//     countConsecutiveZeros(values) {
//         let maxCount = 0;
//         let currentCount = 0;

//         for (const value of values) {
//             if (value === 0) {
//                 currentCount++;
//                 maxCount = Math.max(maxCount, currentCount);
//             } else {
//                 currentCount = 0;
//             }
//         }

//         return maxCount;
//     }

//     countStuckReadings(values) {
//         if (values.length < 2) return 0;

//         let maxCount = 1;
//         let currentCount = 1;
//         let currentValue = values[0];

//         for (let i = 1; i < values.length; i++) {
//             if (values[i] === currentValue) {
//                 currentCount++;
//                 maxCount = Math.max(maxCount, currentCount);
//             } else {
//                 currentCount = 1;
//                 currentValue = values[i];
//             }
//         }

//         return maxCount;
//     }

//     findOutliers(values, stats) {
//         if (!stats || stats.stdDev === 0) return [];

//         const threshold = 3; // 3 standard deviations
//         const outliers = [];

//         for (const value of values) {
//             const zScore = Math.abs((value - stats.mean) / stats.stdDev);
//             if (zScore > threshold) {
//                 outliers.push({ value, zScore });
//             }
//         }

//         return outliers;
//     }

//     /**
//      * Utility methods
//      */
//     formatDuration(milliseconds) {
//         const minutes = Math.floor(milliseconds / 60000);
//         const hours = Math.floor(minutes / 60);
//         const days = Math.floor(hours / 24);

//         if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
//         if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
//         return `${minutes} minute${minutes > 1 ? 's' : ''}`;
//     }

//     delay(ms) {
//         return new Promise(resolve => setTimeout(resolve, ms));
//     }

//     /**
//      * Get service health status
//      */
//     async getHealthStatus() {
//         return {
//             isHealthy: true,
//             isMonitoring: this.isMonitoring,
//             lastCheckTime: this.lastCheckTime,
//             config: {
//                 monitoringEnabled: this.config?.monitoring?.enabled || false,
//                 monitoringInterval: this.config?.monitoring?.interval || 0,
//                 offlineThreshold: this.config?.thresholds?.offlineTimeout || 0
//             },
//             lastCheck: new Date().toISOString()
//         };
//     }

//     /**
//      * Stop service and cleanup
//      */
//     async stop() {
//         this.stopMonitoring();
//         console.log('📊 Meter monitoring service stopped');
//     }
// }

// // Create singleton instance
// const meterMonitoringService = new MeterMonitoringService();

// module.exports = meterMonitoringService;