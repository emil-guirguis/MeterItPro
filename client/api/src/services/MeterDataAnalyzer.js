// /**
//  * Meter Data Analyzer Service
//  * Analyzes meter data for trigger detection and anomaly identification
//  */

// const db = require('../config/database');
// const notificationScheduler = require('./NotificationScheduler');

// class MeterDataAnalyzer {
//     constructor() {
//         this.isMonitoring = false;
//         this.monitoringInterval = null;
//         this.config = null;
//     }

//     /**
//      * Initialize meter data analyzer
//      */
//     async initialize(config = null) {
//         //emilmodbus
//         // try {
//         //     this.config = config || this.getDefaultConfig();
            
//         //     console.log('✅ Meter data analyzer initialized successfully');
//         //     return { success: true };
//         // } catch (error) {
//         //     console.error('❌ Failed to initialize meter data analyzer:', error.message);
//         //     return { success: false, error: error.message };
//         // }
//     }

//     /**
//      * Get default analyzer configuration
//      */
//     getDefaultConfig() {
//         return {
//             monitoring: {
//                 enabled: (process.env.METER_MONITORING_ENABLED ?? 'true') !== 'false',
//                 interval: parseInt(process.env.METER_MONITORING_INTERVAL ?? '300000') || 300000, // 5 minutes
//                 batchSize: parseInt(process.env.METER_MONITORING_BATCH_SIZE ?? '100') || 100
//             },
//             thresholds: {
//                 offlineTimeout: parseInt(process.env.METER_OFFLINE_THRESHOLD ?? '300000') || 300000, // 5 minutes
//                 highUsage: parseFloat(process.env.HIGH_USAGE_THRESHOLD ?? '1000') || 1000, // kWh
//                 usageSpike: parseFloat(process.env.USAGE_SPIKE_THRESHOLD ?? '2.0') || 2.0, // 200% of average
//                 lowUsage: parseFloat(process.env.LOW_USAGE_THRESHOLD ?? '0.1') || 0.1, // kWh
//                 communicationGap: parseInt(process.env.COMMUNICATION_GAP_THRESHOLD ?? '3600000') || 3600000 // 1 hour
//             },
//             analysis: {
//                 historicalDays: parseInt(process.env.HISTORICAL_ANALYSIS_DAYS ?? '30') || 30,
//                 baselineReadings: parseInt(process.env.BASELINE_READINGS ?? '10') || 10,
//                 anomalyDetectionEnabled: (process.env.ANOMALY_DETECTION_ENABLED ?? 'true') !== 'false'
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
//         this.monitoringInterval = setInterval(async () => {
//             await this.analyzeAllMeters();
//         }, this.config.monitoring.interval);

//         console.log(`📊 Started meter data monitoring (interval: ${this.config.monitoring.interval}ms)`);
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
//         console.log('📊 Stopped meter data monitoring');
//     }

//     /**
//      * Analyze all meters for triggers and anomalies
//      */
//     async analyzeAllMeters() {
//         try {
//             console.log('🔍 Analyzing meter data for triggers...');

//             // Get all active meters
//             const meters = await this.getAllMeters();
            
//             if (meters.length === 0) {
//                 console.log('📊 No active meters found for analysis');
//                 return;
//             }

//             let triggersDetected = 0;
//             const batchSize = this.config.monitoring.batchSize;

//             // Process meters in batches
//             for (let i = 0; i < meters.length; i += batchSize) {
//                 const batch = meters.slice(i, i + batchSize);
                
//                 for (const meter of batch) {
//                     try {
//                         const triggers = await this.analyzeMeter(meter);
                        
//                         if (triggers.length > 0) {
//                             triggersDetected += triggers.length;
//                             await this.processTriggers(meter, triggers);
//                         }
//                     } catch (error) {
//                         const errorMessage = error instanceof Error ? error.message : String(error);
//                         console.error(`❌ Error analyzing meter ${meter.id}:`, errorMessage);
//                     }
//                 }

//                 // Small delay between batches to prevent overwhelming the database
//                 if (i + batchSize < meters.length) {
//                     await this.delay(100);
//                 }
//             }

//             if (triggersDetected > 0) {
//                 console.log(`🚨 Analysis completed: ${triggersDetected} triggers detected across ${meters.length} meters`);
//             } else {
//                 console.log(`✅ Analysis completed: No triggers detected across ${meters.length} meters`);
//             }

//         } catch (error) {
//             const errorMessage = error instanceof Error ? error.message : String(error);
//             console.error('❌ Error during meter analysis:', errorMessage);
//         }
//     }

//     /**
//      * Analyze individual meter for triggers
//      */
//     async analyzeMeter(meter) {
//         const triggers = [];

//         try {
//             // Check for communication issues
//             const communicationTrigger = await this.checkCommunicationStatus(meter);
//             if (communicationTrigger) {
//                 triggers.push(communicationTrigger);
//             }

//             // Check for usage anomalies
//             const usageTriggers = await this.checkUsageAnomalies(meter);
//             triggers.push(...usageTriggers);

//             // Check for maintenance due
//             const maintenanceTrigger = await this.checkMaintenanceDue(meter);
//             if (maintenanceTrigger) {
//                 triggers.push(maintenanceTrigger);
//             }

//         } catch (error) {
//             const errorMessage = error instanceof Error ? error.message : String(error);
//             console.error(`Error analyzing meter ${meter?.id}:`, errorMessage);
//         }

//         return triggers;
//     }

//     /**
//      * Check meter communication status
//      */
//     async checkCommunicationStatus(meter) {
//         try {
//             // Get latest reading
//             const latestReading = await this.getLatestReading(meter.id);
            
//             if (!latestReading) {
//                 return {
//                     type: 'no_readings',
//                     severity: 'high',
//                     message: 'No readings found for meter',
//                     data: { meter_id: meter.id }
//                 };
//             }

//             const now = new Date();
//             const lastReading = new Date(latestReading.reading_date);
//             const timeSinceLastReading = now.getTime() - lastReading.getTime();

//             // Check if meter is offline
//             if (timeSinceLastReading > this.config.thresholds.offlineTimeout) {
//                 return {
//                     type: 'communication_timeout',
//                     severity: 'high',
//                     message: `Meter offline for ${this.formatDuration(timeSinceLastReading)}`,
//                     data: {
//                         meter_id: meter.id,
//                         last_communication: lastReading,
//                         offline_duration: timeSinceLastReading,
//                         error_code: 'COMM_TIMEOUT',
//                         error_description: `Communication timeout - meter not responding for ${this.formatDuration(timeSinceLastReading)}`
//                     }
//                 };
//             }

//             // Check for communication gaps
//             const communicationGaps = await this.checkCommunicationGaps(meter.id);
//             if (communicationGaps.length > 0) {
//                 return {
//                     type: 'communication_gaps',
//                     severity: 'medium',
//                     message: `${communicationGaps.length} communication gaps detected`,
//                     data: {
//                         meter_id: meter.id,
//                         gaps: communicationGaps
//                     }
//                 };
//             }

//         } catch (error) {
//             const errorMessage = error instanceof Error ? error.message : String(error);
//             console.error(`Error checking communication for meter ${meter.id}:`, errorMessage);
//         }

//         return null;
//     }

//     /**
//      * Check for usage anomalies
//      */
//     async checkUsageAnomalies(meter) {
//         const triggers = [];

//         try {
//             // Get recent readings for analysis
//             const recentReadings = await this.getRecentReadings(meter.id, this.config.analysis.historicalDays);
            
//             if (recentReadings.length < this.config.analysis.baselineReadings) {
//                 return triggers; // Not enough data for analysis
//             }

//             // Calculate usage statistics
//             const usageStats = this.calculateUsageStatistics(recentReadings);
//             const latestReading = recentReadings[0];

//             // Check for high usage
//             if (latestReading && latestReading.reading_value > this.config.thresholds.highUsage) {
//                 triggers.push({
//                     type: 'high_usage',
//                     severity: 'medium',
//                     message: `High usage detected: ${latestReading.reading_value} kWh`,
//                     data: {
//                         meter_id: meter.id,
//                         current_usage: latestReading.reading_value,
//                         threshold: this.config.thresholds.highUsage,
//                         average_usage: usageStats.average
//                     }
//                 });
//             }

//             // Check for usage spikes
//             if (latestReading && usageStats.average > 0 && latestReading.reading_value > (usageStats.average * this.config.thresholds.usageSpike)) {
//                 triggers.push({
//                     type: 'usage_spike',
//                     severity: 'high',
//                     message: `Usage spike detected: ${(latestReading.reading_value / usageStats.average * 100).toFixed(0)}% of average`,
//                     data: {
//                         meter_id: meter.id,
//                         current_usage: latestReading.reading_value,
//                         average_usage: usageStats.average,
//                         spike_ratio: latestReading.reading_value / usageStats.average
//                     }
//                 });
//             }

//             // Check for unusually low usage
//             if (latestReading && latestReading.reading_value < this.config.thresholds.lowUsage && usageStats.average > this.config.thresholds.lowUsage * 2) {
//                 triggers.push({
//                     type: 'low_usage',
//                     severity: 'medium',
//                     message: `Unusually low usage detected: ${latestReading.reading_value} kWh`,
//                     data: {
//                         meter_id: meter.id,
//                         current_usage: latestReading.reading_value,
//                         average_usage: usageStats.average,
//                         threshold: this.config.thresholds.lowUsage
//                     }
//                 });
//             }

//             // Anomaly detection using statistical methods
//             if (this.config.analysis.anomalyDetectionEnabled) {
//                 const anomalies = this.detectStatisticalAnomalies(recentReadings, usageStats);
//                 triggers.push(...anomalies);
//             }

//         } catch (error) {
//             const errorMessage = error instanceof Error ? error.message : String(error);
//             console.error(`Error checking usage anomalies for meter ${meter.id}:`, errorMessage);
//         }

//         return triggers;
//     }

//     /**
//      * Check if maintenance is due
//      */
//     async checkMaintenanceDue(meter) {
//         try {
//             if (!meter.next_maintenance) {
//                 return null; // No maintenance scheduled
//             }

//             const now = new Date();
//             const maintenanceDate = new Date(meter.next_maintenance);
//             const daysUntilMaintenance = Math.ceil((maintenanceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

//             // Check if maintenance is due within threshold
//             if (daysUntilMaintenance <= 7 && daysUntilMaintenance >= 0) {
//                 return {
//                     type: 'maintenance_due',
//                     severity: 'medium',
//                     message: `Maintenance due in ${daysUntilMaintenance} days`,
//                     data: {
//                         meter_id: meter.id,
//                         due_date: maintenanceDate,
//                         days_until_due: daysUntilMaintenance,
//                         maintenance_type: meter.maintenance_interval || 'Routine Maintenance'
//                     }
//                 };
//             }

//             // Check if maintenance is overdue
//             if (daysUntilMaintenance < 0) {
//                 return {
//                     type: 'maintenance_overdue',
//                     severity: 'high',
//                     message: `Maintenance overdue by ${Math.abs(daysUntilMaintenance)} days`,
//                     data: {
//                         meter_id: meter.id,
//                         due_date: maintenanceDate,
//                         days_overdue: Math.abs(daysUntilMaintenance),
//                         maintenance_type: meter.maintenance_interval || 'Routine Maintenance'
//                     }
//                 };
//             }

//         } catch (error) {
//             const errorMessage = error instanceof Error ? error.message : String(error);
//             console.error(`Error checking maintenance for meter ${meter.id}:`, errorMessage);
//         }

//         return null;
//     }

//     /**
//      * Process detected triggers
//      */
//     async processTriggers(meter, triggers) {
//         for (const trigger of triggers) {
//             try {
//                 console.log(`🚨 Trigger detected for meter ${meter.id}: ${trigger.type} - ${trigger.message}`);

//                 // Log the trigger
//                 await this.logTrigger(meter, trigger);

//                 // Send notifications based on trigger type
//                 switch (trigger.type) {
//                     case 'communication_timeout':
//                     case 'no_readings':
//                         await this.handleCommunicationError(meter, trigger);
//                         break;
                    
//                     case 'usage_spike':
//                     case 'high_usage':
//                         await this.handleUsageAnomaly(meter, trigger);
//                         break;
                    
//                     case 'maintenance_due':
//                     case 'maintenance_overdue':
//                         await this.handleMaintenanceDue(meter, trigger);
//                         break;
                    
//                     default:
//                         console.log(`📝 Trigger logged: ${trigger.type} for meter ${meter.id}`);
//                 }

//             } catch (error) {
//                 const errorMessage = error instanceof Error ? error.message : String(error);
//                 console.error(`❌ Error processing trigger ${trigger.type} for meter ${meter.id}:`, errorMessage);
//             }
//         }
//     }

//     /**
//      * Handle communication error triggers
//      */
//     async handleCommunicationError(meter, trigger) {
//         // Prepare meter data for notification
//         const meterData = {
//             meter_id: meter.id,
//             location_id: meter.location_id,
//             location_name: meter.location_name,
//             location: meter.location,
//             meter_type: meter.meter_type,
//             last_communication: trigger.data.last_communication,
//             error_code: trigger.data.error_code,
//             error_description: trigger.data.error_description
//         };

//         // Send error notification
//         await notificationScheduler.sendMeterErrorNotification(meterData);
//     }

//     /**
//      * Handle usage anomaly triggers
//      */
//     async handleUsageAnomaly(meter, trigger) {
//         // For now, just log usage anomalies
//         // In the future, could send specific usage alert notifications
//         console.log(`📊 Usage anomaly for meter ${meter.id}: ${trigger.message}`);
//     }

//     /**
//      * Handle maintenance due triggers
//      */
//     async handleMaintenanceDue(meter, trigger) {
//         // Maintenance reminders are handled by the scheduled job
//         // This just logs the trigger for tracking
//         console.log(`🔧 Maintenance trigger for meter ${meter.id}: ${trigger.message}`);
//     }

//     /**
//      * Database query methods
//      */
//     /**
//      * Get all active meters
//      * @returns {Promise<Array<{id: number, location_id: number, location_name: string, location: string, meter_type: string, next_maintenance: string, maintenance_interval: string, last_maintenance: string}>>}
//      */
//     async getAllMeters() {
//         const query = `
//             SELECT 
//                 m.id,
//                 m.location_id,
//                 b.name as location_name,
//                 m.location,
//                 m.meter_type,
//                 m.next_maintenance,
//                 m.maintenance_interval,
//                 m.last_maintenance
//             FROM meter m
//             LEFT JOIN locations b ON m.location_id = b.id
//             WHERE m.is_active = true
//             ORDER BY m.id
//         `;

//         try {
//             const result = await db.query(query);
//             return /** @type {any[]} */ (result.rows);
//         } catch (error) {
//             const errorMessage = error instanceof Error ? error.message : String(error);
//             console.error('Error fetching active meters:', errorMessage);
//             return [];
//         }
//     }

//     /**
//      * Get latest reading
//      * @param {number} meterId
//      * @returns {Promise<{reading_value: number, reading_date: string} | null>}
//      */
//     async getLatestReading(meterId) {
//         const query = `
//             SELECT reading_value, reading_date
//             FROM meter_reading
//             WHERE meter_id = $1
//             ORDER BY reading_date DESC
//             LIMIT 1
//         `;

//         try {
//             const result = await db.query(query, [meterId]);
//             return /** @type {any} */ (result.rows[0]) || null;
//         } catch (error) {
//             const errorMessage = error instanceof Error ? error.message : String(error);
//             console.error(`Error fetching latest reading for meter ${meterId}:`, errorMessage);
//             return null;
//         }
//     }

//     /**
//      * Get recent readings
//      * @param {number} meterId
//      * @param {number} days
//      * @returns {Promise<Array<{reading_value: number, reading_date: string}>>}
//      */
//     async getRecentReadings(meterId, days) {
//         const query = `
//             SELECT reading_value, reading_date
//             FROM meter_reading
//             WHERE meter_id = $1 
//                 AND reading_date >= CURRENT_DATE - INTERVAL '${days} days'
//             ORDER BY reading_date DESC
//             LIMIT 100
//         `;

//         try {
//             const result = await db.query(query, [meterId]);
//             return /** @type {any[]} */ (result.rows);
//         } catch (error) {
//             const errorMessage = error instanceof Error ? error.message : String(error);
//             console.error(`Error fetching recent readings for meter ${meterId}:`, errorMessage);
//             return [];
//         }
//     }

//     async checkCommunicationGaps(meterId) {
//         // This is a simplified implementation
//         // In a real system, you'd analyze the time gaps between readings
//         return [];
//     }

//     async logTrigger(meter, trigger) {
//         const query = `
//             INSERT INTO meter_triggers (meter_id, location_id, trigger_type, severity, message, trigger_data, created_at)
//             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
//         `;

//         try {
//             await db.query(query, [
//                 meter.id,
//                 meter.location_id,
//                 trigger.type,
//                 trigger.severity,
//                 trigger.message,
//                 JSON.stringify(trigger.data)
//             ]);
//         } catch (error) {
//             const errorMessage = error instanceof Error ? error.message : String(error);
//             console.error('Error logging trigger:', errorMessage);
//         }
//     }

//     /**
//      * Statistical analysis methods
//      */
//     /**
//      * Calculate usage statistics
//      * @param {Array<{reading_value: number, reading_date: string}>} readings
//      * @returns {{average: number, median: number, stdDev: number, min: number, max: number}}
//      */
//     calculateUsageStatistics(readings) {
//         if (readings.length === 0) {
//             return { average: 0, median: 0, stdDev: 0, min: 0, max: 0 };
//         }

//         const values = readings.map(r => Number(r.reading_value));
//         const sum = values.reduce((a, b) => a + b, 0);
//         const average = sum / values.length;

//         const sortedValues = [...values].sort((a, b) => a - b);
//         const median = sortedValues.length % 2 === 0
//             ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
//             : sortedValues[Math.floor(sortedValues.length / 2)];

//         const variance = values.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / values.length;
//         const stdDev = Math.sqrt(variance);

//         return {
//             average,
//             median,
//             stdDev,
//             min: Math.min(...values),
//             max: Math.max(...values)
//         };
//     }

//     /**
//      * Detect statistical anomalies
//      * @param {Array<{reading_value: number, reading_date: string}>} readings
//      * @param {{average: number, median: number, stdDev: number, min: number, max: number}} stats
//      * @returns {Array}
//      */
//     detectStatisticalAnomalies(readings, stats) {
//         const anomalies = [];
//         const threshold = 2; // Standard deviations

//         for (const reading of readings.slice(0, 5)) { // Check last 5 readings
//             const value = Number(reading.reading_value);
//             const zScore = Math.abs((value - stats.average) / stats.stdDev);

//             if (zScore > threshold) {
//                 anomalies.push({
//                     type: 'statistical_anomaly',
//                     severity: 'medium',
//                     message: `Statistical anomaly detected (z-score: ${zScore.toFixed(2)})`,
//                     data: {
//                         reading_value: value,
//                         z_score: zScore,
//                         average: stats.average,
//                         std_dev: stats.stdDev
//                     }
//                 });
//             }
//         }

//         return anomalies;
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
//      * Get analyzer health status
//      */
//     async getHealthStatus() {
//         return {
//             isHealthy: true,
//             isMonitoring: this.isMonitoring,
//             config: {
//                 monitoringEnabled: this.config?.monitoring?.enabled || false,
//                 monitoringInterval: this.config?.monitoring?.interval || 0,
//                 anomalyDetectionEnabled: this.config?.analysis?.anomalyDetectionEnabled || false
//             },
//             lastCheck: new Date().toISOString()
//         };
//     }

//     /**
//      * Stop analyzer and cleanup
//      */
//     async stop() {
//         this.stopMonitoring();
//         console.log('📊 Meter data analyzer stopped');
//     }
// }

// // Create singleton instance
// const meterDataAnalyzer = new MeterDataAnalyzer();

// module.exports = meterDataAnalyzer;