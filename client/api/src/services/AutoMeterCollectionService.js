/**
 * Automated Meter Collection Service
 * Automatically collects meter data at regular intervals and saves to database
 */

const db = require('../config/database');

class AutoMeterCollectionService {
    constructor() {
        this.isCollecting = false;
        this.collectionInterval = null;
        this.statsInterval = null;
        this.config = null;
        this.lastCollectionTime = null;
        this.collectionStats = {
            totalAttempts: 0,
            successfulReads: 0,
            failedReads: 0,
            lastError: ''
        };
        
        this.threadingService = null;
    }

    /**
     * Initialize auto meter collection service (threaded mode only)
     */
    async initialize(config = null, threadingService = null) {
        try {
            this.config = config || this.getDefaultConfig();
            this.threadingService = threadingService;
            
            if (!this.threadingService) {
                throw new Error('Threading service is required for auto meter collection');
            }
            
            console.log('✅ Auto meter collection service initialized successfully (threaded mode)');
            console.log(`📊 Collection interval: ${this.config.collection.interval}ms (${this.config.collection.interval / 1000}s)`);
            
            return { success: true };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('❌ Failed to initialize auto meter collection service:', errorMessage);
            return { success: false, error: errorMessage };
        }
    }

    /**
     * Get default configuration
     */
    getDefaultConfig() {
        const meterCollectionBatchSize = process.env.METER_COLLECTION_BATCH_SIZE;
        const meterCollectionTimeout = process.env.METER_COLLECTION_TIMEOUT;
        const meterCollectionRetries = process.env.METER_COLLECTION_RETRIES;
        const defaultMeterIp = process.env.DEFAULT_METER_IP;
        const defaultMeterPort = process.env.DEFAULT_METER_PORT;
        const batchInsertEnabled = process.env.BATCH_INSERT_ENABLED;
        const maxBatchSize = process.env.MAX_BATCH_SIZE;
        const logSuccessfulReads = process.env.LOG_SUCCESSFUL_READS;
        const logFailedReads = process.env.LOG_FAILED_READS;
        const logStatsInterval = process.env.LOG_STATS_INTERVAL;

        return {
            collection: {
                enabled: true,
                interval: 30000,
                batchSize: meterCollectionBatchSize ? parseInt(meterCollectionBatchSize, 10) : 10,
                timeout: meterCollectionTimeout ? parseInt(meterCollectionTimeout, 10) : 10000,
                retryAttempts: meterCollectionRetries ? parseInt(meterCollectionRetries, 10) : 2
            },
            meters: {
                defaultIP: defaultMeterIp || '10.10.10.22',
                defaultPort: defaultMeterPort ? parseInt(defaultMeterPort, 10) : 502,
                registers: {
                    voltage: { address: 5, count: 1, scale: 200, unit: 'V' },
                    current: { address: 6, count: 1, scale: 100, unit: 'A' },
                    power: { address: 7, count: 1, scale: 1, unit: 'W' },
                    energy: { address: 8, count: 1, scale: 1, unit: 'Wh' },
                    frequency: { address: 0, count: 1, scale: 10, unit: 'Hz' },
                    powerFactor: { address: 9, count: 1, scale: 1000, unit: 'pf' },
                    phaseAVoltage: { address: 12, count: 1, scale: 10, unit: 'V' },
                    phaseBVoltage: { address: 14, count: 1, scale: 10, unit: 'V' },
                    phaseCVoltage: { address: 16, count: 1, scale: 10, unit: 'V' },
                    phaseACurrent: { address: 18, count: 1, scale: 100, unit: 'A' },
                    phaseBCurrent: { address: 20, count: 1, scale: 100, unit: 'A' },
                    phaseCCurrent: { address: 22, count: 1, scale: 100, unit: 'A' },
                    totalActiveEnergyWh: { address: 40, count: 2, scale: 1, unit: 'Wh' },
                    totalReactiveEnergyVARh: { address: 42, count: 2, scale: 1, unit: 'VARh' },
                    totalApparentEnergyVAh: { address: 44, count: 2, scale: 1, unit: 'VAh' }
                }
            },
            database: {
                batchInsert: batchInsertEnabled !== 'false',
                maxBatchSize: maxBatchSize ? parseInt(maxBatchSize, 10) : 100
            },
            logging: {
                logSuccessfulReads: logSuccessfulReads === 'true',
                logFailedReads: logFailedReads !== 'false',
                logInterval: logStatsInterval ? parseInt(logStatsInterval, 10) : 300000
            }
        };
    }

    /**
     * Start automatic meter data collection
     */
    startCollection() {
        if (this.isCollecting) {
            console.log('⚠️ Auto meter collection is already running');
            return { success: false, message: 'Collection already running' };
        }

        if (!this.config || !this.config.collection.enabled) {
            console.log('📊 Auto meter collection is disabled in configuration');
            return { success: false, message: 'Collection disabled in config' };
        }

        this.isCollecting = true;
        this.lastCollectionTime = new Date();
        
        this.collectionInterval = setInterval(async () => {
            await this.performCollection();
        }, this.config.collection.interval);

        if (this.config.logging.logInterval > 0) {
            this.statsInterval = setInterval(() => {
                this.logCollectionStats();
            }, this.config.logging.logInterval);
        }

        console.log(`🔄 Started auto meter collection (interval: ${this.config.collection.interval}ms)`);
        console.log(`📊 Will collect data from meters every ${this.config.collection.interval / 1000} seconds`);
        
        setTimeout(() => this.performCollection(), 5000);
        
        return { success: true, message: 'Collection started successfully' };
    }

    /**
     * Stop automatic meter data collection
     */
    stopCollection() {
        if (this.collectionInterval) {
            clearInterval(this.collectionInterval);
            this.collectionInterval = null;
        }
        
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
            this.statsInterval = null;
        }
        
        this.isCollecting = false;
        console.log('🔄 Stopped auto meter collection');
        
        return { success: true, message: 'Collection stopped successfully' };
    }

    /**
     * Perform meter data collection
     */
    async performCollection() {
        const startTime = Date.now();
        console.log('🔄 Starting meter data collection cycle...');
        
        try {
            const meters = await this.getAllMeters();
            
            if (!meters || meters.length === 0) {
                console.log('📊 No active meters found for collection');
                return;
            }

            console.log(`📊 Found ${meters.length} active meters for collection`);
            
            let successCount = 0;
            let failureCount = 0;
            const readings = [];
            
            const batchSize = this.config && this.config.collection ? this.config.collection.batchSize : 10;
            
            for (let i = 0; i < meters.length; i += batchSize) {
                const batch = meters.slice(i, i + batchSize);
                
                const batchPromises = batch.map(meter => 
                    this.collectMeterData(meter).catch(error => {
                        const meterIdStr = meter && typeof meter === 'object' && 'meterid' in meter ? meter.meterid : 'unknown';
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        console.error(`❌ Failed to collect data from meter ${meterIdStr}:`, errorMessage);
                        return null;
                    })
                );
                
                const batchResults = await Promise.all(batchPromises);
                
                for (const result of batchResults) {
                    if (result && result.success && result.reading) {
                        readings.push(result.reading);
                        successCount++;
                        
                        if (this.config && this.config.logging && this.config.logging.logSuccessfulReads) {
                            console.log(`✅ Collected data from meter ${result.reading.meterid}`);
                        }
                    } else {
                        failureCount++;
                    }
                }
                
                if (i + batchSize < meters.length) {
                    await this.delay(500);
                }
            }
            
            if (readings.length > 0) {
                await this.saveReadings(readings);
            }
            
            this.collectionStats.totalAttempts += meters.length;
            this.collectionStats.successfulReads += successCount;
            this.collectionStats.failedReads += failureCount;
            this.lastCollectionTime = new Date();
            
            const duration = Date.now() - startTime;
            console.log(`🔄 Collection cycle completed: ${successCount}/${meters.length} successful (${duration}ms)`);
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('❌ Error during meter collection cycle:', errorMessage);
            this.collectionStats.lastError = errorMessage;
        }
    }

    /**
     * Collect data from a single meter using threaded MCP system
     */
    async collectMeterData(meter) {
        try {
            if (!this.threadingService) {
                throw new Error('Threading service not available');
            }

            const meterConfig = this.getMeterConfig(meter);
            
            console.log(`📊 Collecting data from meter ${meter.meterid} at ${meterConfig.ip}:${meterConfig.port}`);
            
            const message = {
                type: 'collectMeterData',
                payload: {
                    meter: {
                        meterid: meter.meterid,
                        name: meter.name,
                        type: meter.type
                    },
                    config: meterConfig,
                    registers: this.config && this.config.meters ? this.config.meters.registers : {}
                },
                priority: 'normal',
                timeout: this.config && this.config.collection ? this.config.collection.timeout : 10000
            };
            
            const result = await this.threadingService.sendMessage(message);
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to collect meter data via threading system');
            }
            
            console.log(`📈 Data collected from meter ${meter.meterid}:`, JSON.stringify(result.data, null, 2));
            
            const reading = await this.createMeterReading(meter, result.data, meterConfig);
            
            console.log(`💾 Meter reading prepared for ${meter.meterid}:`, {
                meterid: reading.meterid,
                reading_value: reading.reading_value,
                voltage: reading.voltage,
                current: reading.current,
                power: reading.power,
                energy: reading.energy,
                frequency: reading.frequency,
                power_factor: reading.power_factor,
                timestamp: reading.timestamp
            });
            
            return {
                success: true,
                reading,
                meter: meter.meterid
            };
            
        } catch (error) {
            if (this.config && this.config.logging && this.config.logging.logFailedReads) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`❌ Failed to collect data from meter ${meter.meterid}:`, errorMessage);
            }
            
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                success: false,
                error: errorMessage,
                meter: meter.meterid
            };
        }
    }

    /**
     * Get meter configuration (IP, port, etc.)
     */
    getMeterConfig(meter) {
        return {
            ip: this.config && this.config.meters ? this.config.meters.defaultIP : '10.10.10.22',
            port: this.config && this.config.meters ? this.config.meters.defaultPort : 502,
        };
    }

    /**
     * Create a meter reading record from collected data
     */
    async createMeterReading(meter, data, meterConfig) {
        const timestamp = new Date();
        
        const voltage = data.voltage || data.phaseAVoltage || 0;
        const current = data.current || data.phaseACurrent || 0;
        const power = data.power || 0;
        const energy = data.energy || data.totalActiveEnergyWh || 0;
        const frequency = data.frequency || 0;
        const powerFactor = data.powerFactor || 0;
        
        const reading = {
            meterid: meter.meterid,
            timestamp: timestamp,
            reading_value: energy,
            unit_of_measurement: 'Wh',
            data_quality: 'good',
            source: 'modbus_auto_collection',
            quality: 'good',
            device_ip: meterConfig.ip,
            deviceip: meterConfig.ip,
            port: meterConfig.port,
            voltage: voltage,
            current: current,
            power: power,
            energy: energy,
            frequency: frequency,
            power_factor: powerFactor,
            powerfactor: powerFactor,
            phase_a_voltage: data.phaseAVoltage || null,
            phase_b_voltage: data.phaseBVoltage || null,
            phase_c_voltage: data.phaseCVoltage || null,
            phase_a_current: data.phaseACurrent || null,
            phase_b_current: data.phaseBCurrent || null,
            phase_c_current: data.phaseCCurrent || null,
            total_active_energy_wh: data.totalActiveEnergyWh || null,
            total_reactive_energy_varh: data.totalReactiveEnergyVARh || null,
            total_apparent_energy_vah: data.totalApparentEnergyVAh || null,
            v: voltage,
            a: current,
            kw: power / 1000,
            kwh: energy / 1000,
            status: 'active'
        };
        
        return reading;
    }

    /**
     * Save readings to database
     */
    async saveReadings(readings) {
        try {
            console.log(`💾 Saving ${readings.length} meter readings to database...`);
            
            if (this.config && this.config.database && this.config.database.batchInsert && readings.length > 1) {
                await this.batchInsertReadings(readings);
            } else {
                for (const reading of readings) {
                    await this.insertSingleReading(reading);
                }
            }
            
            console.log(`✅ Successfully saved ${readings.length} meter readings to database`);
            
            readings.forEach(reading => {
                console.log(`💾 ✅ Saved reading for meter ${reading.meterid}: ${reading.reading_value} ${reading.unit_of_measurement} at ${reading.timestamp}`);
            });
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('❌ Failed to save meter readings:', errorMessage);
            throw error;
        }
    }

    /**
     * Batch insert readings for better performance
     */
    async batchInsertReadings(readings) {
        if (readings.length === 0) return;
        
        const columns = Object.keys(readings[0]);
        const placeholders = readings.map((_reading, index) => {
            const start = index * columns.length;
            return `(${columns.map((_col, colIndex) => `$${start + colIndex + 1}`).join(', ')})`;
        }).join(', ');
        
        const values = readings.flatMap(reading => columns.map(col => reading[col]));
        
        const query = `
            INSERT INTO meterreadings (${columns.join(', ')})
            VALUES ${placeholders}
        `;
        
        console.log(`💾 Executing batch insert for ${readings.length} readings...`);
        await db.query(query, values);
        console.log(`✅ Batch insert completed successfully`);
    }

    /**
     * Insert a single reading using direct database query
     */
    async insertSingleReading(reading) {
        const query = `
            INSERT INTO meterreadings (
                meterid, timestamp, deviceip, source, quality,
                voltage, current, power, energy, frequency, powerfactor,
                device_ip, port, power_factor,
                phase_a_voltage, phase_b_voltage, phase_c_voltage,
                phase_a_current, phase_b_current, phase_c_current,
                total_active_energy_wh, total_reactive_energy_varh, total_apparent_energy_vah,
                v, a, kw, kwh, data_quality, unit_of_measurement, status, createdat
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
                $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
            )
            RETURNING id
        `;

        const values = [
            reading.meterid,
            reading.timestamp || new Date(),
            reading.device_ip,
            reading.source || 'modbus_auto_collection',
            reading.quality || 'good',
            reading.voltage,
            reading.current,
            reading.power,
            reading.energy,
            reading.frequency,
            reading.power_factor,
            reading.device_ip,
            reading.port,
            reading.power_factor,
            reading.phase_a_voltage,
            reading.phase_b_voltage,
            reading.phase_c_voltage,
            reading.phase_a_current,
            reading.phase_b_current,
            reading.phase_c_current,
            reading.total_active_energy_wh,
            reading.total_reactive_energy_varh,
            reading.total_apparent_energy_vah,
            reading.v,
            reading.a,
            reading.kw,
            reading.kwh,
            reading.data_quality || 'good',
            reading.unit_of_measurement || 'Wh',
            reading.status || 'active',
            new Date()
        ];

        const result = await db.query(query, values);
        if (result.rows && result.rows.length > 0 && result.rows[0] && 'id' in result.rows[0]) {
            console.log(`💾 ✅ Inserted reading for meter ${reading.meterid} with ID: ${result.rows[0].id}`);
        }
        return result.rows && result.rows.length > 0 ? result.rows[0] : null;
    }

    /**
     * Get active meters for collection
     */
    async getAllMeters() {
        const query = `
            SELECT 
                id, meterid, name, type, status,
                location_building, location_floor, location_room,
                last_reading_date, installation_date
            FROM meters 
            WHERE status = 'active'
            ORDER BY meterid
        `;

        try {
            const result = await db.query(query);
            return result.rows || [];
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Error fetching active meters:', errorMessage);
            return [];
        }
    }

    /**
     * Log collection statistics
     */
    logCollectionStats() {
        const stats = this.getCollectionStats();
        const successRate = stats.totalAttempts > 0 
            ? ((stats.successfulReads / stats.totalAttempts) * 100).toFixed(1)
            : 0;
            
        console.log(`📊 Collection Stats: ${stats.successfulReads}/${stats.totalAttempts} successful (${successRate}%), Last: ${stats.lastCollectionTime}`);
        
        if (stats.lastError) {
            console.log(`❌ Last Error: ${stats.lastError}`);
        }
    }

    /**
     * Get collection statistics
     */
    getCollectionStats() {
        return {
            isCollecting: this.isCollecting,
            interval: this.config && this.config.collection ? this.config.collection.interval : 0,
            lastCollectionTime: this.lastCollectionTime,
            totalAttempts: this.collectionStats.totalAttempts,
            successfulReads: this.collectionStats.successfulReads,
            failedReads: this.collectionStats.failedReads,
            successRate: this.collectionStats.totalAttempts > 0 
                ? (this.collectionStats.successfulReads / this.collectionStats.totalAttempts * 100).toFixed(1)
                : 0,
            lastError: this.collectionStats.lastError
        };
    }

    /**
     * Update collection interval
     */
    updateInterval(newInterval) {
        if (newInterval < 5000) {
            throw new Error('Collection interval must be at least 5 seconds');
        }
        
        const wasCollecting = this.isCollecting;
        
        if (wasCollecting) {
            this.stopCollection();
        }
        
        if (this.config && this.config.collection) {
            this.config.collection.interval = newInterval;
        }
        
        if (wasCollecting) {
            this.startCollection();
        }
        
        console.log(`🔄 Collection interval updated to ${newInterval}ms (${newInterval / 1000}s)`);
        
        return { success: true, newInterval };
    }

    /**
     * Utility methods
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get service health status
     */
    async getHealthStatus() {
        const stats = this.getCollectionStats();
        
        return {
            isHealthy: true,
            isCollecting: this.isCollecting,
            config: {
                enabled: this.config && this.config.collection ? this.config.collection.enabled : false,
                interval: this.config && this.config.collection ? this.config.collection.interval : 0,
                batchSize: this.config && this.config.collection ? this.config.collection.batchSize : 0
            },
            threadingService: {
                available: !!this.threadingService,
                status: this.threadingService ? 'connected' : 'not_available'
            },
            statistics: stats,
            lastCheck: new Date().toISOString()
        };
    }

    /**
     * Stop service and cleanup
     */
    async stop() {
        this.stopCollection();
        console.log('🔄 Auto meter collection service stopped');
    }
}

// Create singleton instance
const autoMeterCollectionService = new AutoMeterCollectionService();

module.exports = autoMeterCollectionService;
