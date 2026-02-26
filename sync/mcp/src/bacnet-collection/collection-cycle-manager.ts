/**
 * Orchestrates a single collection cycle
 */

import { CollectionCycleResult, CollectionError, PendingReading, TimeoutEvent, TimeoutMetrics } from './types.js';
import { cacheManager } from '../cache/cache-manager.js';
import { BACnetClient, BatchReadRequest } from './bacnet-client.js';
import { ReadingBatcher } from './reading-batcher.js';
import { BatchSizeManager, BatchSizeConfig } from './batch-size-manager.js';


export class CollectionCycleManager {
  private logger: any;
  private batchSizeManager: BatchSizeManager;
  private timeoutEvents: TimeoutEvent[] = [];
  private tenantId: number | null = null;


  constructor(logger?: any, batchSizeConfig?: BatchSizeConfig) {
    this.logger = logger || console;
    this.batchSizeManager = new BatchSizeManager(batchSizeConfig, this.logger);
    const tenantCache = cacheManager.getTenantCache().getTenant();
    this.tenantId = tenantCache?.tenant_id || null;
  }

  /**
   * Generate a simple cycle ID
   */
  private generateCycleId(): string {
    return `cycle-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Record a timeout event for metrics tracking
   */
  private recordTimeoutEvent(
    meterId: string,
    registerCount: number,
    batchSize: number,
    timeoutMs: number,
    recoveryMethod: 'sequential' | 'reduced_batch' | 'offline',
    success: boolean
  ): void {
    const event: TimeoutEvent = {
      meterId,
      timestamp: new Date(),
      registerCount,
      batchSize,
      timeoutMs,
      recoveryMethod,
      success,
    };

    this.timeoutEvents.push(event);
    this.logger.warn(
      `⏱️  Timeout event recorded for meter ${meterId}: ${registerCount} registers, batch size ${batchSize}, recovery method: ${recoveryMethod}, success: ${success}`
    );
  }

  /**
   * Calculate timeout metrics from collected events
   */
  private calculateTimeoutMetrics(): TimeoutMetrics {
    const timeoutsByMeter: Record<string, number> = {};
    let totalRecoveryTime = 0;

    // Count timeouts per meter and calculate average recovery time
    for (const event of this.timeoutEvents) {
      if (!timeoutsByMeter[event.meterId]) {
        timeoutsByMeter[event.meterId] = 0;
      }
      timeoutsByMeter[event.meterId]++;
      totalRecoveryTime += event.timeoutMs;
    }

    const averageTimeoutRecoveryMs =
      this.timeoutEvents.length > 0 ? totalRecoveryTime / this.timeoutEvents.length : 0;

    return {
      totalTimeouts: this.timeoutEvents.length,
      timeoutsByMeter,
      averageTimeoutRecoveryMs,
      lastTimeoutTime: this.timeoutEvents.length > 0 ? this.timeoutEvents[this.timeoutEvents.length - 1].timestamp : undefined,
      timeoutEvents: [...this.timeoutEvents],
    };
  }

  /**
   * Clear timeout events for the next cycle
   */
  private clearTimeoutEvents(): void {
    this.timeoutEvents = [];
  }

  /**
   * Execute a complete collection cycle
   * 
   * Iterates through all meters in the cache, connects to each via BACnet,
   * reads all configured data points, and persists readings to the database.
   * 
   * If the cache is empty, it will be loaded from the database before processing.
   * After the cycle completes, the cache is cleared to ensure fresh data on next cycle.
   */
async executeCycle(
  bacnetClient: BACnetClient,
  database: any,
  readTimeoutMs: number = 15000  // ← change from 3000 to 15000 (15 seconds)
): Promise<CollectionCycleResult> {
    const cycleId = this.generateCycleId();
    const meterCache = cacheManager.getMeterCache();
    const startTime = new Date();
    const errors: CollectionError[] = [];
    let metersProcessed = 0;
    let readingsCollected = 0;
    let success = true;

    // Clear timeout events from previous cycle
    this.clearTimeoutEvents();

    this.logger.info(`Starting collection cycle ${cycleId}`);

    try {
      // Load cache from database if it's empty
      if (!meterCache.isValid()) {
        this.logger.info('Cache is empty or invalid, loading from database');
        try {
          await meterCache.reload(database);
          this.logger.info(`Loaded ${meterCache.getMeters().length} meters into cache`);
        } catch (reloadError) {
          const errorMsg = reloadError instanceof Error ? reloadError.message : String(reloadError);
          this.logger.error(`Failed to load meter cache from database: ${errorMsg}`);
          errors.push({
            meterId: 'system',
            operation: 'connect',
            error: `Cache reload failed: ${errorMsg}`,
            timestamp: new Date(),
          });
          success = false;
        }
      }

      // Also ensure device register cache is valid
      const deviceRegisterCache = cacheManager.getDeviceRegisterCache();
      if (!deviceRegisterCache.isValid()) {
        this.logger.info('Device register cache is empty or invalid, loading from database');
        try {
          await deviceRegisterCache.reload(database);
          this.logger.info('Device register cache reloaded');
        } catch (reloadError) {
          const errorMsg = reloadError instanceof Error ? reloadError.message : String(reloadError);
          this.logger.error(`Failed to load device register cache from database: ${errorMsg}`);
          errors.push({
            meterId: 'system',
            operation: 'connect',
            error: `Device register cache reload failed: ${errorMsg}`,
            timestamp: new Date(),
          });
          success = false;
        }
      }

      // Get all meters from cache
      const meters = meterCache.getMeters();

      // 🔴 BREAKPOINT: Log meters from cache
      this.logger.info(`\n${'='.repeat(80)}`);
      this.logger.info(`🔴 BREAKPOINT: executeCycle - Meters from cache`);
      this.logger.info(`   Total meters in cache: ${meters.length}`);
      meters.forEach((meter: any, idx: number) => {
        this.logger.info(`   Meter ${idx + 1}: id=${meter.meter_id}, element=${meter.element}, meter_element_id=${meter.meter_element_id}, name=${meter.name}`);
      });
      this.logger.info(`${'='.repeat(80)}\n`);

      if (meters.length === 0) {
        this.logger.warn('No meters in cache for collection cycle');
        return {
          cycleId,
          startTime,
          endTime: new Date(),
          metersProcessed: 0,
          readingsCollected: 0,
          errors,
          success: success && errors.length === 0,
          timeoutMetrics: this.calculateTimeoutMetrics(),
        };
      }

      // Process each meter
      for (const meter of meters) {
        try {
          // Create a batcher for this meter's readings
          const batcher = new ReadingBatcher(this.logger);

          // Attempt to read all data points from this meter
          const meterReadings = await this.readMeterDataPoints(
            meter,
            bacnetClient,
            readTimeoutMs,
            errors
          );

          // Add readings to batcher
          for (const reading of meterReadings) {
            batcher.addReading(reading);
          }

          // Flush readings to database
          if (batcher.getPendingCount() > 0) {
            try {
              const insertionResult = await batcher.flushBatch(database);
              readingsCollected += insertionResult.insertedCount;

              // Mark inserted readings as pending
              if (insertionResult.insertedReadingIds && insertionResult.insertedReadingIds.length > 0) {
                await database.markReadingsAsPending(insertionResult.insertedReadingIds);
              }

              this.logger.info(
                `Meter ${meter.meter_id}: inserted ${insertionResult.insertedCount} readings (${insertionResult.skippedCount} skipped, ${insertionResult.failedCount} failed)`
              );
            } catch (writeError) {
              const errorMsg = writeError instanceof Error ? writeError.message : String(writeError);
              this.logger.error(
                `Failed to write readings for meter ${meter.meter_id}: ${errorMsg}`
              );
              errors.push({
                meterId: meter.meter_id,
                operation: 'write',
                error: errorMsg,
                timestamp: new Date(),
              });
              success = false;
            }
          }

          metersProcessed++;
        } catch (meterError) {
          const errorMsg = meterError instanceof Error ? meterError.message : String(meterError);
          this.logger.error(`Error processing meter ${meter.meter_id}: ${errorMsg}`);
          errors.push({
            meterId: meter.meter_id,
            operation: 'connect',
            error: errorMsg,
            timestamp: new Date(),
          });
          success = false;
          // Continue to next meter
        }
      }

      const endTime = new Date();
      const result: CollectionCycleResult = {
        cycleId,
        startTime,
        endTime,
        metersProcessed,
        readingsCollected,
        errors,
        success: success && errors.length === 0,
        timeoutMetrics: this.calculateTimeoutMetrics(),
      };

      // Log failures to database
      for (const error of errors) {
        try {
          await database.logReadingFailure(
            error.meterId,
            error.operation,
            error.error
          );
        } catch (logError) {
          this.logger.warn(`Failed to log error to database: ${logError}`);
        }
      }

      this.logger.info(
        `Collection cycle ${cycleId} completed: ` +
        `${metersProcessed} meters, ${readingsCollected} readings, ${errors.length} errors, ` +
        `${result.timeoutMetrics?.totalTimeouts || 0} timeouts`
      );

      return result;
    } catch (cycleError) {
      const errorMsg = cycleError instanceof Error ? cycleError.message : String(cycleError);
      this.logger.error(`Collection cycle ${cycleId} failed: ${errorMsg}`);

      return {
        cycleId,
        startTime,
        endTime: new Date(),
        metersProcessed,
        readingsCollected,
        errors,
        success: false,
        timeoutMetrics: this.calculateTimeoutMetrics(),
      };
    } finally {
      // Note: Caches are NOT cleared here. Both meter and device register caches
      // persist across cycles for performance. They are reloaded at startup and
      // can be manually refreshed if needed.
    }
  }

  /**
   * Read all data points from a meter with adaptive batch sizing
   * 
   * First checks if the meter is online via connectivity check.
   * If offline, skips the meter and records offline status.
   * If online, gets all configured registers for the device from the register cache,
   * then reads registers using adaptive batch sizing:
   * - Starts with batch size from BatchSizeManager
   * - On timeout, reduces batch size and retries
   * - On complete failure, attempts sequential fallback
   * - Records metrics for monitoring
   */
  /**
   * Read all data points from a meter with adaptive batch sizing
   * 
   * For DENT PowerScout 48 HD:
   * - Elements A–P use instance blocks of 10000 each
   * - Element A: 0–9999
   * - Element B: 10000–19999
   * - Element C: 20000–29999
   * - ... up to Element P: 150000–159999
   * - The relative register number from the DB is added to the element's base offset
   */
  private async readMeterDataPoints(
    meter: any,
    bacnetClient: BACnetClient,
    readTimeoutMs: number,
    errors: CollectionError[]
  ): Promise<PendingReading[]> {
    const readings: PendingReading[] = [];

    try {
      // ────────────────────────────────────────────────────────────────
      // 🔴 BREAKPOINT: Full meter context
      // ────────────────────────────────────────────────────────────────
      this.logger.info(`\n${'='.repeat(100)}`);
      this.logger.info(`🔴 readMeterDataPoints START ── Meter ID: ${meter.meter_id}`);
      this.logger.info(`   Element: ${meter.element} | Meter Element ID: ${meter.meter_element_id}`);
      this.logger.info(`   Device ID: ${meter.device_id} | IP: ${meter.ip}:${meter.port || 47808}`);
      this.logger.info(`   Full meter:`, JSON.stringify(meter, null, 2));
      this.logger.info(`${'='.repeat(100)}\n`);

      // Check connectivity
      this.logger.info(`Checking connectivity → ${meter.ip}:${meter.port || 47808}`);
      const isOnline = await bacnetClient.checkConnectivity(meter.ip, meter.port || 47808);

      if (!isOnline) {
        this.logger.warn(`Meter ${meter.meter_id} (${meter.element}) is OFFLINE → skipping`);
        errors.push({
          meterId: String(meter.meter_id),
          operation: 'connectivity',
          error: `Offline/unreachable at ${meter.ip}:${meter.port || 47808}`,
          timestamp: new Date(),
        });
        this.recordTimeoutEvent(
          String(meter.meter_id),
          0,
          0,
          readTimeoutMs,
          'offline',
          false
        );
        return readings;
      }

      this.logger.info(`Meter ${meter.meter_id} (${meter.element}) is ONLINE → proceeding`);

      // ── Circuit breaker check ──────────────────────────────────────────
      if (this.batchSizeManager.isCircuitOpen(meter.meter_id)) {
        const state = this.batchSizeManager.getMeterState(meter.meter_id);
        const openedAt = state?.circuitOpenedAt;
        const elapsedMin = openedAt
          ? Math.round((Date.now() - openedAt.getTime()) / 60000)
          : 0;
        this.logger.warn(
          `🔌 Circuit breaker OPEN for meter ${meter.meter_id} (${meter.element}) — ` +
          `skipping register reads (open for ${elapsedMin} min, ` +
          `${state?.consecutiveCycleFailures} consecutive failed cycles)`
        );
        errors.push({
          meterId: String(meter.meter_id),
          operation: 'read',
          error: `Circuit breaker open: ${state?.consecutiveCycleFailures} consecutive failed cycles`,
          timestamp: new Date(),
        });
        return readings;
      }
      // ──────────────────────────────────────────────────────────────────

      // Load registers for this device
      const deviceRegisters = cacheManager.getDeviceRegisterCache().getDeviceRegisters(Number(meter.device_id));

      if (deviceRegisters.length === 0) {
        this.logger.warn(`No registers found for device ${meter.device_id} (meter ${meter.meter_id}, element ${meter.element})`);
        errors.push({
          meterId: String(meter.meter_id),
          operation: 'read',
          error: `No registers configured for device ${meter.device_id}`,
          timestamp: new Date(),
        });
        return readings;
      }

      this.logger.info(`Loaded ${deviceRegisters.length} registers for device ${meter.device_id}`);

      // ────────────────────────────────────────────────────────────────
      // Calculate element base offset for PowerScout 48 HD
      // ────────────────────────────────────────────────────────────────
      const elementLetter = meter.element.trim().toUpperCase();
      if (!/^[A-P]$/.test(elementLetter)) {
        const msg = `Invalid element letter for PowerScout 48HD: "${elementLetter}" (must be A–P)`;
        this.logger.error(msg);
        errors.push({
          meterId: String(meter.meter_id),
          operation: 'read',
          error: msg,
          timestamp: new Date(),
        });
        return readings;
      }

      const elementIndex = elementLetter.charCodeAt(0) - 'A'.charCodeAt(0) + 1; // A=1, B=2, ..., P=16
      const baseOffset = (elementIndex - 1) * 10000;

      this.logger.info(`\n${'─'.repeat(80)}`);
      this.logger.info(`Element ${elementLetter} calculation`);
      this.logger.info(`   Letter → Index: ${elementLetter} → ${elementIndex}`);
      this.logger.info(`   Base offset: ${baseOffset}  (range: ${baseOffset} – ${baseOffset + 9999})`);
      this.logger.info(`${'─'.repeat(80)}\n`);

      // ────────────────────────────────────────────────────────────────
      // Build actual BACnet read requests with correct instances
      // ────────────────────────────────────────────────────────────────
      const batchRequests: BatchReadRequest[] = deviceRegisters
        .map((register: any, idx: number) => {
          const relative = Number(register.register);
          if (isNaN(relative)) {
            this.logger.error(`Invalid register number at index ${idx} - field: ${register.field_name} - value: ${register.register}`);
            return undefined;
          }

          const fullInstance = baseOffset + relative;

          return {
            objectType: 'analogInput', // adjust if some are AV/BV etc.
            objectInstance: fullInstance,
            propertyId: 'presentValue',
            fieldName: register.field_name,
          } as BatchReadRequest;
        })
        .filter((req): req is BatchReadRequest => req !== undefined);

      // ────────────────────────────────────────────────────────────────
      // Log EVERY request clearly
      // ────────────────────────────────────────────────────────────────
      this.logger.info(`\n${'='.repeat(100)}`);
      this.logger.info(`🔴 BACnet Read Targets for Meter ${meter.meter_id} - Element ${elementLetter}`);
      this.logger.info(`   Total requests: ${batchRequests.length}`);
      this.logger.info(`   Element base: ${baseOffset}`);
      batchRequests.forEach((req, idx) => {
        const reg = deviceRegisters[idx];
        this.logger.info(
          `  ${String(idx + 1).padStart(3)}. ${reg.field_name.padEnd(24)} ` +
          `← AI:${String(req.objectInstance).padEnd(8)} presentValue ` +
          `(relative: ${reg.register})`
        );
      });
      this.logger.info(`${'='.repeat(100)}\n`);

      // ────────────────────────────────────────────────────────────────
      // Perform the adaptive batch read
      // ────────────────────────────────────────────────────────────────
      const batchResults = await this.performBatchReadWithAdaptiveSizing(
        meter,
        bacnetClient,
        batchRequests,
        deviceRegisters,
        readTimeoutMs
      );

      // ────────────────────────────────────────────────────────────────
      // Process results with detailed logging
      // ────────────────────────────────────────────────────────────────
      // ────────────────────────────────────────────────────────────────
      // Process results with detailed logging
      // ────────────────────────────────────────────────────────────────
      batchResults.forEach((result: any, index: number) => {
        const register = deviceRegisters[index];
        const instance = batchRequests[index]?.objectInstance;

        // Log first 5 + any failures
        if (index < 5 || !result?.success) {
          this.logger.info(`\n${'─'.repeat(80)}`);
          this.logger.info(`Result #${index + 1}  AI:${instance}  ${register.field_name}`);
          this.logger.info(`   Success: ${result?.success ?? false}`);
          this.logger.info(`   Value:   ${JSON.stringify(result?.value)}`);
          this.logger.info(`   Error:   ${result?.error ?? 'none'}`);
          this.logger.info(`${'─'.repeat(80)}\n`);
        }

        if (result?.success && result.value !== undefined && result.value !== null) {
          let readValue = result.value;
          let numericValue: number | null = null;

          // ── PASTE YOUR ORIGINAL VALUE EXTRACTION LOGIC HERE ──
          if (typeof readValue === 'number') {
            numericValue = readValue;
          } else if (Array.isArray(readValue)) {
            if (readValue.length > 0 && typeof readValue[0] === 'object') {
              const firstObj = readValue[0];
              if (typeof firstObj.value === 'number') {
                numericValue = firstObj.value;
              } else if (typeof firstObj._value === 'number') {
                numericValue = firstObj._value;
              } else {
                for (const val of Object.values(firstObj)) {
                  if (typeof val === 'number' && !isNaN(val)) {
                    numericValue = val;
                    break;
                  }
                }
              }
            }
          } else if (typeof readValue === 'object' && readValue !== null) {
            if (typeof readValue.value === 'number') {
              numericValue = readValue.value;
            } else if (typeof readValue._value === 'number') {
              numericValue = readValue._value;
            } else if (typeof readValue.realValue === 'number') {
              numericValue = readValue.realValue;
            } else {
              for (const val of Object.values(readValue)) {
                if (typeof val === 'number' && !isNaN(val)) {
                  numericValue = val;
                  break;
                }
              }
            }
          } else if (typeof readValue === 'string') {
            const parsed = parseFloat(readValue);
            if (!isNaN(parsed)) {
              numericValue = parsed;
            }
          }
          // ── END OF ORIGINAL PARSING ──

          if (numericValue !== null && !isNaN(numericValue)) {
            readings.push({
              meter_id: Number(meter.meter_id),
              meter_element_id: Number(meter.meter_element_id),
              field_name: register.field_name,
              value: numericValue,
              register: register.register,
              element: meter.element,
              created_at: new Date(),
            });

            this.logger.info(
              `SUCCESS → ${register.field_name.padEnd(24)} ` +
              `AI:${instance} = ${numericValue}`
            );
          } else {
            this.logger.warn(
              `Could not parse numeric value for ${register.field_name} (AI:${instance}): ` +
              JSON.stringify(result.value)
            );
            // Optionally push an error here if you want to record bad parses
          }
        } else {
          this.logger.warn(
            `READ FAILED → ${register.field_name} (AI:${instance}): ${result?.error ?? 'no result'}`
          );
        }
      });

    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`readMeterDataPoints crashed for meter ${meter.meter_id} (${meter.element}): ${msg}`);
      errors.push({
        meterId: String(meter.meter_id),
        operation: 'read',
        error: msg,
        timestamp: new Date(),
      });
    }

    // ── Circuit breaker: record cycle outcome ──────────────────────────
    if (readings.length > 0) {
      this.batchSizeManager.recordMeterCycleSuccess(meter.meter_id);
    } else {
      this.batchSizeManager.recordMeterCycleFailure(meter.meter_id);
    }
    // ──────────────────────────────────────────────────────────────────

    return readings;
  }

  /**
   * Perform batch read with adaptive sizing and timeout handling
   * 
   * Implements the following strategy:
   * 1. Get current batch size from BatchSizeManager
   * 2. Split registers into batches of that size
   * 3. Read each batch with timeout handling
   * 4. On timeout, reduce batch size and retry
   * 5. On complete failure, attempt sequential fallback
   * 6. Record success/timeout for metrics
   */
  private async performBatchReadWithAdaptiveSizing(
    meter: any,
    bacnetClient: BACnetClient,
    allRequests: BatchReadRequest[],
    deviceRegisters: any[],
    readTimeoutMs: number
  ): Promise<any[]> {
    const allResults: any[] = new Array(allRequests.length).fill(null);
    const port = meter.port || 47808;
    const MAX_RETRIES_PER_BATCH = 5; // Prevent infinite retry loops

    // Get initial batch size from manager
    let currentBatchSize = this.batchSizeManager.getBatchSize(meter.meter_id, allRequests.length);
    const isReadingAllAtOnce = currentBatchSize === allRequests.length;
    this.logger.info(
      `📦 Starting batch read for meter ${meter.meter_id}: ${isReadingAllAtOnce ? '✅ Reading ALL' : '⚠️ Reading in chunks'} ${allRequests.length} registers in batch size ${currentBatchSize}`
    );

    // Process all registers in batches
    let batchIndex = 0;
    let retryCount = 0;

    for (let i = 0; i < allRequests.length; i += currentBatchSize) {
      const batchEnd = Math.min(i + currentBatchSize, allRequests.length);
      const batchRequests = allRequests.slice(i, batchEnd);
      const batchNumber = batchIndex + 1;

      this.logger.info(
        `📋 Batch ${batchNumber}: Reading registers ${i + 1}-${batchEnd} (batch size: ${batchRequests.length})`
      );

      try {
        // Attempt batch read with timeout
        const batchResults = await bacnetClient.readPropertyMultiple(
          meter.ip,
          port,
          batchRequests,
          readTimeoutMs
        );

        // Check if any results indicate timeout
        const hasTimeoutError = batchResults.some((r: any) =>
          r?.error && (r.error.includes('timeout') || r.error.includes('ERR_TIMEOUT'))
        );

        if (hasTimeoutError) {
          // Batch read timed out - force sequential fallback to get at least some data
          this.logger.warn(
            `⏱️  Batch ${batchNumber} timed out for meter ${meter.meter_id}, forcing sequential fallback`
          );

          // Record timeout event
          this.recordTimeoutEvent(
            String(meter.meter_id),
            batchRequests.length,
            currentBatchSize,
            readTimeoutMs,
            'reduced_batch',
            false
          );

          this.batchSizeManager.recordTimeout(meter.meter_id);

          // Force sequential fallback immediately on timeout
          const sequentialResults: any[] = [];
          for (const request of batchRequests) {
            try {
              const result = await bacnetClient.readProperty(
                meter.ip,
                port,
                request.objectType,
                request.objectInstance,
                request.propertyId,
                readTimeoutMs
              );
              sequentialResults.push(result);
            } catch (seqError) {
              this.logger.warn(
                `Sequential read failed for ${request.objectType}:${request.objectInstance}.${request.propertyId}: ${seqError}`
              );
              sequentialResults.push({
                success: false,
                error: String(seqError),
              });
            }
          }

          // Store sequential results
          sequentialResults.forEach((result: any, index: number) => {
            allResults[i + index] = result;
          });

          // Record sequential recovery success
          const successCount = sequentialResults.filter((r: any) => r?.success).length;
          this.recordTimeoutEvent(
            String(meter.meter_id),
            batchRequests.length,
            currentBatchSize,
            readTimeoutMs,
            'sequential',
            successCount > 0
          );

          this.logger.info(
            `Sequential fallback for batch ${batchNumber}: ${successCount}/${batchRequests.length} succeeded`
          );
        } else {
          // Store successful results
          batchResults.forEach((result: any, index: number) => {
            allResults[i + index] = result;
          });

          // Record success for metrics
          this.batchSizeManager.recordSuccess(meter.meter_id);
          retryCount = 0; // Reset retry count on success
          this.logger.info(`✅ Batch ${batchNumber} completed successfully for meter ${meter.meter_id}`);
        }

      } catch (batchError) {
        // Batch read threw an error (real timeout or exception) - force sequential fallback
        const errorMsg = batchError instanceof Error ? batchError.message : String(batchError);
        this.logger.error(
          `🔴 Batch ${batchNumber} threw error for meter ${meter.meter_id}: ${errorMsg}, forcing sequential fallback`
        );

        // Record timeout event
        this.recordTimeoutEvent(
          String(meter.meter_id),
          batchRequests.length,
          currentBatchSize,
          readTimeoutMs,
          'reduced_batch',
          false
        );

        this.batchSizeManager.recordTimeout(meter.meter_id);

        // Attempt sequential fallback - read properties one at a time
        const sequentialResults: any[] = [];
        for (const request of batchRequests) {
          try {
            const result = await bacnetClient.readProperty(
              meter.ip,
              port,
              request.objectType,
              request.objectInstance,
              request.propertyId,
              readTimeoutMs
            );
            sequentialResults.push(result);
          } catch (seqError) {
            this.logger.warn(
              `Sequential read failed for ${request.objectType}:${request.objectInstance}.${request.propertyId}: ${seqError}`
            );
            sequentialResults.push({
              success: false,
              error: String(seqError),
            });
          }
        }

        // Store sequential results
        sequentialResults.forEach((result: any, index: number) => {
          allResults[i + index] = result;
        });

        // Record timeout event with sequential recovery method
        const successCount = sequentialResults.filter((r: any) => r?.success).length;
        this.recordTimeoutEvent(
          String(meter.meter_id),
          batchRequests.length,
          currentBatchSize,
          readTimeoutMs,
          'sequential',
          successCount > 0
        );

        this.logger.info(
          `Sequential fallback for batch ${batchNumber}: ${successCount}/${batchRequests.length} succeeded`
        );
      }

      batchIndex++;
    }

    // Log final status
    const successCount = allResults.filter((r: any) => r && r.success).length;
    const failureCount = allResults.filter((r: any) => r && !r.success).length;
    this.logger.info(
      `📊 Batch read completed for meter ${meter.meter_id}: ${successCount} succeeded, ${failureCount} failed`
    );

    return allResults;
  }

}
