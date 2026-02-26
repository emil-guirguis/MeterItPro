/**
 * Manages adaptive batch sizing for BACnet meter reads
 * 
 * Tracks batch sizes per meter and adjusts them based on timeout events.
 * When a batch read times out, the batch size is reduced by 50%.
 * When a batch read succeeds, the batch size is maintained.
 * 
 * This allows the system to automatically optimize batch sizes for different
 * meters based on their response characteristics.
 */

export interface BatchSizeConfig {
  initialBatchSize?: number | 'all'; // Starting batch size (default: 'all')
  minBatchSize?: number;              // Minimum batch size before sequential (default: 1)
  reductionFactor?: number;           // Factor to reduce batch size on timeout (default: 0.5)
  circuitBreakerThreshold?: number;   // Consecutive failed cycles before opening circuit (default: 5)
  circuitCooldownMs?: number;         // Cooldown period in ms before retrying (default: 15 minutes)
}

export interface MeterBatchState {
  meterId: number;
  currentBatchSize: number;
  totalRegisters: number;
  lastSuccessfulBatchSize?: number;
  consecutiveTimeouts: number;
  consecutiveSuccesses: number;
  consecutiveCycleFailures: number;
  circuitOpen: boolean;
  circuitOpenedAt?: Date;
  lastUpdated: Date;
}

export class BatchSizeManager {
  private meterStates: Map<number, MeterBatchState> = new Map();
  private readonly initialBatchSize: number | 'all';
  private readonly minBatchSize: number;
  private readonly reductionFactor: number;
  private readonly circuitBreakerThreshold: number;
  private readonly circuitCooldownMs: number;
  private logger: any;

  constructor(config: BatchSizeConfig = {}, logger?: any) {
    this.initialBatchSize = config.initialBatchSize ?? 'all';
    this.minBatchSize = config.minBatchSize ?? 1;
    this.reductionFactor = config.reductionFactor ?? 0.5;
    this.circuitBreakerThreshold = config.circuitBreakerThreshold ?? 5;
    this.circuitCooldownMs = config.circuitCooldownMs ?? 15 * 60 * 1000;
    this.logger = logger || console;

    // Validate configuration
    if (this.minBatchSize < 1) {
      throw new Error('minBatchSize must be at least 1');
    }
    if (this.reductionFactor <= 0 || this.reductionFactor >= 1) {
      throw new Error('reductionFactor must be between 0 and 1 (exclusive)');
    }
  }

  /**
   * Get the batch size for a meter
   * 
   * If the meter hasn't been seen before, initializes it with a small batch size.
   * Starts with max 5 registers per batch to avoid timeouts, then grows on success.
   */
  getBatchSize(meterId: number, totalRegisters: number): number {
    let state = this.meterStates.get(meterId);

    if (!state) {
      // Initialize new meter state with small batch size (max 5)
      const initialSize = Math.min(5, totalRegisters);

      state = {
        meterId,
        currentBatchSize: Math.max(initialSize, this.minBatchSize),
        totalRegisters,
        consecutiveTimeouts: 0,
        consecutiveSuccesses: 0,
        consecutiveCycleFailures: 0,
        circuitOpen: false,
        lastUpdated: new Date(),
      };

      this.meterStates.set(meterId, state);
      this.logger.info(
        `Initialized batch size for meter ${meterId}: ${state.currentBatchSize} (total registers: ${totalRegisters})`
      );
    }

    return state.currentBatchSize;
  }

  /**
   * Record a successful batch read
   * 
   * Maintains the current batch size and increments the consecutive success counter.
   * Could be extended in the future to gradually increase batch size.
   */
  recordSuccess(meterId: number): void {
    const state = this.meterStates.get(meterId);

    if (!state) {
      this.logger.warn(`Attempted to record success for unknown meter ${meterId}`);
      return;
    }

    state.lastSuccessfulBatchSize = state.currentBatchSize;
    state.consecutiveSuccesses++;
    state.consecutiveTimeouts = 0;
    state.lastUpdated = new Date();

    this.logger.debug(
      `Batch read successful for meter ${meterId}: batch size ${state.currentBatchSize}, consecutive successes: ${state.consecutiveSuccesses}`
    );
  }

  /**
   * Record a batch read timeout
   * 
   * Reduces the batch size by the configured reduction factor (default 50%).
   * If the new batch size would be less than minBatchSize, sets it to minBatchSize.
   * Increments the consecutive timeout counter.
   */
  recordTimeout(meterId: number): void {
    const state = this.meterStates.get(meterId);

    if (!state) {
      this.logger.warn(`Attempted to record timeout for unknown meter ${meterId}`);
      return;
    }

    const previousBatchSize = state.currentBatchSize;
    const newBatchSize = Math.max(
      Math.floor(state.currentBatchSize * this.reductionFactor),
      this.minBatchSize
    );

    state.currentBatchSize = newBatchSize;
    state.consecutiveTimeouts++;
    state.consecutiveSuccesses = 0;
    state.lastUpdated = new Date();

    this.logger.info(
      `Batch read timeout for meter ${meterId}: reduced batch size from ${previousBatchSize} to ${newBatchSize}, consecutive timeouts: ${state.consecutiveTimeouts}`
    );
  }

  /**
   * Get the current state for a meter
   */
  getMeterState(meterId: number): MeterBatchState | undefined {
    return this.meterStates.get(meterId);
  }

  /**
   * Get all meter states
   */
  getAllMeterStates(): MeterBatchState[] {
    return Array.from(this.meterStates.values());
  }

  /**
   * Clear state for a specific meter
   */
  clearMeterState(meterId: number): void {
    this.meterStates.delete(meterId);
    this.logger.debug(`Cleared batch size state for meter ${meterId}`);
  }

  /**
   * Clear all meter states
   */
  clearAllStates(): void {
    this.meterStates.clear();
    this.logger.debug('Cleared all batch size states');
  }

  /**
   * Get meters that have experienced timeouts
   */
  getMetersWithTimeouts(): number[] {
    return Array.from(this.meterStates.values())
      .filter((state) => state.consecutiveTimeouts > 0)
      .map((state) => state.meterId);
  }

  /**
   * Get meters that are at minimum batch size (may need sequential fallback)
   */
  getMetersAtMinBatchSize(): number[] {
    return Array.from(this.meterStates.values())
      .filter((state) => state.currentBatchSize === this.minBatchSize)
      .map((state) => state.meterId);
  }

  /**
   * Check if the circuit breaker is open for a meter.
   * If the cooldown period has elapsed, the circuit is automatically closed to allow a retry.
   */
  isCircuitOpen(meterId: number): boolean {
    const state = this.meterStates.get(meterId);
    if (!state || !state.circuitOpen) return false;

    // Check if cooldown has elapsed — if so, allow one retry
    if (state.circuitOpenedAt) {
      const elapsed = Date.now() - state.circuitOpenedAt.getTime();
      if (elapsed >= this.circuitCooldownMs) {
        state.circuitOpen = false;
        state.circuitOpenedAt = undefined;
        const cooldownMinutes = Math.round(this.circuitCooldownMs / 60000);
        this.logger.info(
          `🔌 Circuit breaker for meter ${meterId} cooldown (${cooldownMinutes} min) elapsed — allowing retry`
        );
        return false;
      }
    }

    return true;
  }

  /**
   * Record that a full collection cycle produced at least one reading for a meter.
   * Resets consecutive failure counter and closes the circuit.
   */
  recordMeterCycleSuccess(meterId: number): void {
    const state = this.meterStates.get(meterId);
    if (!state) return;

    if (state.consecutiveCycleFailures > 0 || state.circuitOpen) {
      this.logger.info(
        `✅ Meter ${meterId} produced readings — resetting circuit breaker ` +
        `(was at ${state.consecutiveCycleFailures} consecutive failed cycles)`
      );
    }

    state.consecutiveCycleFailures = 0;
    state.circuitOpen = false;
    state.circuitOpenedAt = undefined;
    state.lastUpdated = new Date();
  }

  /**
   * Record that a full collection cycle produced zero readings for a meter.
   * Opens the circuit breaker after the configured threshold is reached.
   */
  recordMeterCycleFailure(meterId: number): void {
    const state = this.meterStates.get(meterId);
    if (!state) return;

    state.consecutiveCycleFailures++;
    state.lastUpdated = new Date();

    if (state.consecutiveCycleFailures >= this.circuitBreakerThreshold) {
      if (!state.circuitOpen) {
        state.circuitOpen = true;
        state.circuitOpenedAt = new Date();
        const cooldownMinutes = Math.round(this.circuitCooldownMs / 60000);
        this.logger.warn(
          `🔌 Circuit breaker OPENED for meter ${meterId} after ` +
          `${state.consecutiveCycleFailures} consecutive failed cycles. ` +
          `Skipping for ${cooldownMinutes} minutes.`
        );
      }
    } else {
      this.logger.warn(
        `⚠️  Meter ${meterId} cycle produced no readings ` +
        `(${state.consecutiveCycleFailures}/${this.circuitBreakerThreshold} before circuit opens)`
      );
    }
  }

  /**
   * Get summary statistics for all meters
   */
  getSummary(): {
    totalMeters: number;
    metersWithTimeouts: number;
    metersAtMinBatchSize: number;
    averageBatchSize: number;
    averageConsecutiveTimeouts: number;
  } {
    const states = Array.from(this.meterStates.values());

    if (states.length === 0) {
      return {
        totalMeters: 0,
        metersWithTimeouts: 0,
        metersAtMinBatchSize: 0,
        averageBatchSize: 0,
        averageConsecutiveTimeouts: 0,
      };
    }

    const metersWithTimeouts = states.filter((s) => s.consecutiveTimeouts > 0).length;
    const metersAtMinBatchSize = states.filter((s) => s.currentBatchSize === this.minBatchSize).length;
    const averageBatchSize = states.reduce((sum, s) => sum + s.currentBatchSize, 0) / states.length;
    const averageConsecutiveTimeouts =
      states.reduce((sum, s) => sum + s.consecutiveTimeouts, 0) / states.length;

    return {
      totalMeters: states.length,
      metersWithTimeouts,
      metersAtMinBatchSize,
      averageBatchSize,
      averageConsecutiveTimeouts,
    };
  }
}
