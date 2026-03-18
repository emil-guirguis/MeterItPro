/**
 * Batches readings for efficient database insertion
 */

import { PendingReading, ValidationResult, ValidationError, BatchInsertionResult } from './types.js';
import { syncPool, calculateKwhForReadings } from '../data-sync/data-sync.js';
import { cacheManager } from '../cache/cache-manager.js';

export class ReadingBatcher {
  private readings: PendingReading[] = [];
  private validationErrors: ValidationError[] = [];
  private logger: any;
  private insertionMetrics: BatchInsertionResult | null = null;
  private tenantId: number | null = null;
  private cycleTimestamp: Date;

  constructor(logger?: any, cycleTimestamp?: Date) {
    this.logger = logger || console;
    this.cycleTimestamp = cycleTimestamp || new Date();
    const tenantCache = cacheManager.getTenantCache().getTenant();
    this.tenantId = tenantCache?.tenant_id || null;
  }

  /**
   * Add a reading to the batch queue
   */
  addReading(reading: PendingReading): void {
    this.logger.debug(`   Adding reading to batch: meter_id=${reading.meter_id}, field_name=${reading.field_name}, value=${reading.value}`);
    this.readings.push(reading);
  }

  /**
   * Validate all pending readings
   * Checks for:
   * - meter_id is not null
   * - timestamp is valid Date and not in future
   * - value is valid number (not null, NaN, or non-numeric)
   * - data_point (field_name) is not empty
   */
  validateReadings(): ValidationResult {
    this.validationErrors = [];
    let validCount = 0;
    let invalidCount = 0;
    let skippedCount = 0;

    // Log all readings before validation
    this.logger.info(`\n📋 [VALIDATION] Inspecting ${this.readings.length} readings before validation:`);
    for (let i = 0; i < Math.min(3, this.readings.length); i++) {
      const r = this.readings[i];
      this.logger.info(`   Reading ${i}:`);
      this.logger.info(`     meter_id: ${r.meter_id} (type: ${typeof r.meter_id})`);
      this.logger.info(`     meter_element_id: ${r.meter_element_id} (type: ${typeof r.meter_element_id})`);
      this.logger.info(`     value: ${r.value} (type: ${typeof r.value})`);
      this.logger.info(`     field_name: "${r.field_name}" (type: ${typeof r.field_name})`);
      this.logger.info(`     Full object: ${JSON.stringify(r)}`);
    }

    for (let i = 0; i < this.readings.length; i++) {
      const reading = this.readings[i];
      const errors: string[] = [];

      // Check meter_id is not null (should be a number)
      if (reading.meter_id === null || reading.meter_id === undefined) {
        errors.push('meter_id is null or undefined');
      }

      // Check timestamp is valid Date and not in future
      if (!(reading.created_at instanceof Date) || isNaN(reading.created_at.getTime())) {
        errors.push(`timestamp is not a valid Date (got: ${typeof reading.created_at} = ${reading.created_at})`);
      } else if (reading.created_at > new Date()) {
        errors.push('timestamp is in the future');
      }

      // Check value is valid number (not null, NaN, or non-numeric)
      if (reading.value === null || reading.value === undefined) {
        errors.push('value is null or undefined');
      } else if (typeof reading.value !== 'number' || isNaN(reading.value)) {
        errors.push(`value is not a valid number or is NaN (got: ${typeof reading.value} = ${reading.value})`);
      }

      // Check field_name is not empty
      if (!reading.field_name || reading.field_name.trim() === '') {
        errors.push(`data_point (field_name) is empty or null (got: "${reading.field_name}")`);
      }

      if (errors.length > 0) {
        invalidCount++;
        this.validationErrors.push({
          readingIndex: i,
          reading,
          errors,
        });
      } else {
        validCount++;
      }
    }

    return {
      valid: validCount,
      invalid: invalidCount,
      skipped: skippedCount,
      errors: this.validationErrors,
    };
  }

  /**
   * Get validation errors from the last validation run
   */
  getValidationErrors(): ValidationError[] {
    return this.validationErrors;
  }

  /**
   * Flush all queued readings to the database in batches
   * Validates readings before insertion and skips invalid ones
   * Splits large batches into groups of 100 for optimal performance
   * Implements retry logic with exponential backoff
   */
  async flushBatch(database: any): Promise<BatchInsertionResult> {
    const startTime = new Date();
    const startTimeMs = startTime.getTime();

    this.logger.info(`\n📊 [BATCH INSERT] Starting batch insertion process`);
    this.logger.info(`   Total readings in queue: ${this.readings.length}`);

    if (this.readings.length === 0) {
      this.logger.info(`   ✓ Queue is empty, nothing to insert`);
      return {
        success: true,
        totalReadings: 0,
        insertedCount: 0,
        failedCount: 0,
        skippedCount: 0,
        timestamp: startTime,
        errors: [],
        retryAttempts: 0,
      };
    }

    // Validate all readings first
    this.logger.info(`\n📋 [BATCH INSERT] Validating ${this.readings.length} readings...`);
    const validationResult = this.validateReadings();
    const skippedCount = validationResult.invalid;

    this.logger.info(`   ✓ Validation complete:`);
    this.logger.info(`     - Valid readings: ${validationResult.valid}`);
    this.logger.info(`     - Invalid readings: ${validationResult.invalid}`);

    // Log validation errors
    if (validationResult.errors.length > 0) {
      this.logger.warn(
        `   ⚠️  Validation failed for ${validationResult.errors.length} readings. Skipping invalid readings.`
      );
      // Show first few errors in detail
      const errorsToShow = Math.min(10, validationResult.errors.length);
      this.logger.warn(`   First ${errorsToShow} validation errors:`);
      for (let i = 0; i < errorsToShow; i++) {
        const error = validationResult.errors[i];
        this.logger.warn(`     [Index ${error.readingIndex}]`);
        this.logger.warn(`       Errors: ${error.errors.join(' | ')}`);
        this.logger.warn(`       meter_id: ${error.reading.meter_id} (${typeof error.reading.meter_id})`);
        this.logger.warn(`       created_at: ${error.reading.created_at} (${typeof error.reading.created_at})`);
        this.logger.warn(`       value: ${error.reading.value} (${typeof error.reading.value})`);
        this.logger.warn(`       field_name: "${error.reading.field_name}"`);
      }
      if (validationResult.errors.length > errorsToShow) {
        this.logger.warn(`   ... and ${validationResult.errors.length - errorsToShow} more validation errors`);
      }
    }

    // Filter out invalid readings
    const invalidIndices = new Set(validationResult.errors.map((e) => e.readingIndex));
    const validReadings = this.readings.filter((_, index) => !invalidIndices.has(index));

    if (validReadings.length === 0) {
      this.logger.warn(`\n❌ [BATCH INSERT] No valid readings to insert after validation`);
      this.readings = [];
      return {
        success: true,
        totalReadings: this.readings.length,
        insertedCount: 0,
        failedCount: 0,
        skippedCount,
        timestamp: startTime,
        errors: validationResult.errors.map((e) => e.errors.join(', ')),
        retryAttempts: 0,
      };
    }

    // Split readings into batches of 100
    const BATCH_SIZE = 100;
    const batches: PendingReading[][] = [];
    for (let i = 0; i < validReadings.length; i += BATCH_SIZE) {
      batches.push(validReadings.slice(i, i + BATCH_SIZE));
    }

    this.logger.info(`\n📦 [BATCH INSERT] Split into ${batches.length} batch(es) of max ${BATCH_SIZE} readings`);

    let totalInserted = 0;
    let totalFailed = 0;
    const allErrors: string[] = [];
    let totalRetryAttempts = 0;
    const insertedReadingIds: string[] = [];

    // Use the global syncPool directly
    if (!syncPool) {
      throw new Error('Global syncPool is not initialized. Call initializePools() first.');
    }

    // Execute each batch with retry logic
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      let retryCount = 0;
      let batchSuccess = false;

      this.logger.info(`\n🔄 [BATCH INSERT] Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} readings)`);

      while (retryCount < 3 && !batchSuccess) {
        let client;
        try {
          // Get client from global pool
          this.logger.debug(`   Acquiring database connection...`);
          client = await syncPool.connect();
          this.logger.debug(`   ✓ Connection acquired`);

          // Begin transaction
          this.logger.debug(`   Starting transaction...`);
          await client.query('BEGIN');
          this.logger.debug(`   ✓ Transaction started`);

          // Build batch INSERT statements by pivoting readings
          // Group readings by meter_id + meter_element_id
          // Each field_name becomes a column with its value
          // Use unified cycle timestamp for all readings in this collection cycle

          const groupedReadings = new Map<string, any>();
          const allFieldNames = new Set<string>();

          batch.forEach((reading) => {
            // Create a unique key for the meter
            const key = `${reading.meter_id}-${reading.meter_element_id}`;

            if (!groupedReadings.has(key)) {
              groupedReadings.set(key, {
                meter_id: reading.meter_id,
                meter_element_id: reading.meter_element_id,
                created_at: this.cycleTimestamp,
              });
            }

            // Add the specific field value to this unique object
            const entry = groupedReadings.get(key);
            entry[reading.field_name] = reading.value;
            allFieldNames.add(reading.field_name);
          });

          // Add system columns to field names
          allFieldNames.add('is_synchronized');
          allFieldNames.add('retry_count');

          // Define column order: tenant_id first, then core fields, then all register fields, then system fields
          const coreColumns = ['tenant_id', 'meter_id', 'meter_element_id', 'created_at'];
          const registerColumns = Array.from(allFieldNames).filter(
            (col) => !coreColumns.includes(col) && col !== 'is_synchronized' && col !== 'retry_count'
          ).sort();
          const systemColumns = ['is_synchronized', 'retry_count'];
          const allColumns = [...coreColumns, ...registerColumns, ...systemColumns];

          const tableName = 'meter_reading';
          let insertedCount = 0;

          this.logger.debug(`   Building and executing INSERT statements for ${groupedReadings.size} unique meter records...`);
          this.logger.debug(`   Total columns: ${allColumns.length} (${allColumns.join(', ')})`);

          // Build and execute INSERT statements for each meter
          for (const row of groupedReadings.values()) {
            const rowValues: any[] = [];
            const placeholders: string[] = [];
            
            // Build values in column order
            allColumns.forEach((col, idx) => {
              if (col === 'tenant_id') {
                rowValues.push(this.tenantId);
              } else if (col === 'is_synchronized') {
                rowValues.push(false);
              } else if (col === 'retry_count') {
                rowValues.push(0);
              } else {
                rowValues.push(row[col] ?? null);
              }
              placeholders.push(`$${idx + 1}`);
            });
            
            const insertQuery = `INSERT INTO ${tableName} (${allColumns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING meter_reading_id`;
            
            this.logger.debug(`   Generated INSERT for meter ${row.meter_id}: ${allColumns.length} columns`);
            this.logger.info(`   📝 INSERT statement: ${insertQuery}`);
            this.logger.info(`   📊 Values (${rowValues.length}): ${JSON.stringify(rowValues)}`);

            // Execute each INSERT statement with its own values
            const insertStartTime = Date.now();
            const result = await client.query(insertQuery, rowValues);
            const insertDuration = Date.now() - insertStartTime;
            
            this.logger.info(`   ✓ INSERT executed in ${insertDuration}ms, rows affected: ${result.rowCount}`);
            insertedCount += result.rowCount || 0;
            
            // Capture the returned reading IDs
            if (result.rows && result.rows.length > 0) {
              result.rows.forEach((row: any) => {
                if (row.meter_reading_id) {
                  insertedReadingIds.push(row.meter_reading_id);
                }
              });
            }
          }
          
          this.logger.info(`   ✓ All ${groupedReadings.size} INSERT statement(s) completed successfully`);

          // Commit transaction
          this.logger.debug(`   Committing transaction...`);
          const commitStartTime = Date.now();
          await client.query('COMMIT');
          const commitDuration = Date.now() - commitStartTime;
          this.logger.debug(`   ✓ Transaction committed in ${commitDuration}ms`);

          totalInserted += batch.length;
          batchSuccess = true;
          this.logger.info(
            `   ✅ Successfully inserted batch ${batchIndex + 1}/${batches.length} (${batch.length} readings)`
          );
        } catch (error) {
          // Rollback transaction on error
          if (client) {
            try {
              this.logger.warn(`   Rolling back transaction due to error...`);
              await client.query('ROLLBACK');
              this.logger.debug(`   ✓ Transaction rolled back`);
            } catch (rollbackError) {
              this.logger.error('   ❌ Error rolling back transaction:', rollbackError);
            }
          }

          retryCount++;
          totalRetryAttempts++;
          const errorMessage = error instanceof Error ? error.message : String(error);

          if (retryCount < 3) {
            // Wait before retry: 1 second for retry 2, 2 seconds for retry 3
            const waitTime = retryCount * 1000;
            this.logger.warn(
              `   ⚠️  Batch ${batchIndex + 1} failed (attempt ${retryCount}/3). Error: ${errorMessage}`
            );
            this.logger.warn(`   Retrying in ${waitTime}ms...`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
          } else {
            this.logger.error(
              `   ❌ Batch ${batchIndex + 1} failed after 3 attempts. Error: ${errorMessage}`
            );
            totalFailed += batch.length;
            allErrors.push(`Batch ${batchIndex + 1}: ${errorMessage}`);
          }
        } finally {
          // Release client back to pool
          if (client) {
            this.logger.debug(`   Releasing database connection...`);
            client.release();
            this.logger.debug(`   ✓ Connection released`);
          }
        }
      }
    }

    // Calculate kWh for all successfully inserted readings
    if (insertedReadingIds.length > 0) {
      try {
        await calculateKwhForReadings(syncPool, insertedReadingIds);
      } catch (error) {
        // Non-fatal: log but don't fail the batch — readings are still saved
        this.logger.error('❌ [KWH] kWh calculation step failed:', error);
      }
    }

    // Clear the batch only after successful insertion
    // If there were any failures, maintain cache state for retry on next cycle
    if (totalFailed === 0) {
      this.logger.info(`\n✅ [BATCH INSERT] All batches inserted successfully, clearing cache`);
      this.readings = [];
    } else {
      this.logger.warn(
        `\n⚠️  [BATCH INSERT] ${totalFailed} readings failed to insert. Maintaining cache state for retry on next cycle.`
      );
      // Keep all readings for retry since we can't easily determine which specific ones failed
      this.logger.debug(`   Keeping ${this.readings.length} readings in cache for retry`);
    }

    const totalDuration = Date.now() - startTimeMs;

    this.insertionMetrics = {
      success: totalFailed === 0,
      totalReadings: totalInserted + totalFailed + skippedCount,
      insertedCount: totalInserted,
      failedCount: totalFailed,
      skippedCount,
      timestamp: startTime,
      errors: allErrors.length > 0 ? allErrors : undefined,
      retryAttempts: totalRetryAttempts,
      insertedReadingIds,
    };

    // Log final summary
    this.logger.info(`\n📊 [BATCH INSERT] Final Summary:`);
    this.logger.info(`   Total duration: ${totalDuration}ms`);
    this.logger.info(`   Total readings processed: ${this.insertionMetrics.totalReadings}`);
    this.logger.info(`   Successfully inserted: ${totalInserted}`);
    this.logger.info(`   Failed: ${totalFailed}`);
    this.logger.info(`   Skipped (invalid): ${skippedCount}`);
    this.logger.info(`   Total retry attempts: ${totalRetryAttempts}`);
    this.logger.info(`   Overall success: ${this.insertionMetrics.success ? '✅ YES' : '❌ NO'}`);

    if (allErrors.length > 0) {
      this.logger.error(`   Errors encountered:`);
      allErrors.forEach((err) => {
        this.logger.error(`     - ${err}`);
      });
    }

    return this.insertionMetrics;
  }

  /**
   * Get count of pending readings
   */
  getPendingCount(): number {
    return this.readings.length;
  }

  /**
   * Get insertion metrics from the last flush operation
   */
  getInsertionMetrics(): BatchInsertionResult | null {
    return this.insertionMetrics;
  }
}
