import { EventEmitter } from 'events';
import { ThreadManager } from './ThreadManager.js';
import { HealthMonitor } from './HealthMonitor.js';

/**
 * Restart manager configuration
 */
export interface RestartManagerConfig {
  maxRestartAttempts: number;
  initialRestartDelay: number;
  maxRestartDelay: number;
  backoffMultiplier: number;
  resetCounterAfter: number;
  enableCircuitBreaker: boolean;
  circuitBreakerThreshold: number;
  circuitBreakerResetTime: number;
}

/**
 * Restart attempt information
 */
export interface RestartAttempt {
  attemptNumber: number;
  timestamp: Date;
  reason: string;
  success: boolean;
  error?: string;
}

/**
 * Circuit breaker states
 */
export enum CircuitBreakerState {
  CLOSED = 'closed',     // Normal operation
  OPEN = 'open',         // Circuit breaker is open, blocking restarts
  HALF_OPEN = 'half_open' // Testing if service is back to normal
}

/**
 * RestartManager handles automatic restart logic with exponential backoff
 * Implements circuit breaker pattern to prevent excessive restart attempts
 */
export class RestartManager extends EventEmitter {
  private threadManager: ThreadManager;
  private healthMonitor: HealthMonitor;
  private config: RestartManagerConfig;
  
  private restartAttempts: RestartAttempt[] = [];
  private currentRestartCount = 0;
  private lastSuccessfulStart: Date | null = null;
  private restartTimeout: NodeJS.Timeout | null = null;
  private isRestarting = false;
  
  // Circuit breaker state
  private circuitBreakerState = CircuitBreakerState.CLOSED;
  private circuitBreakerOpenTime: Date | null = null;
  private consecutiveFailures = 0;

  constructor(
    threadManager: ThreadManager, 
    healthMonitor: HealthMonitor,
    config: Partial<RestartManagerConfig> = {}
  ) {
    super();
    
    this.threadManager = threadManager;
    this.healthMonitor = healthMonitor;
    
    // Default configuration
    this.config = {
      maxRestartAttempts: 5,
      initialRestartDelay: 1000,      // 1 second
      maxRestartDelay: 60000,         // 1 minute
      backoffMultiplier: 2,
      resetCounterAfter: 300000,      // 5 minutes
      enableCircuitBreaker: true,
      circuitBreakerThreshold: 3,     // 3 consecutive failures
      circuitBreakerResetTime: 300000, // 5 minutes
      ...config
    };

    this.setupEventHandlers();
  }

  /**
   * Start automatic restart management
   */
  public startManagement(): void {
    this.emit('managementStarted');
  }

  /**
   * Stop automatic restart management
   */
  public stopManagement(): void {
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    
    this.isRestarting = false;
    this.emit('managementStopped');
  }

  /**
   * Manually trigger a restart
   */
  public async triggerRestart(reason: string = 'Manual restart'): Promise<boolean> {
    if (this.isRestarting) {
      this.emit('restartSkipped', { reason: 'Already restarting' });
      return false;
    }

    if (!this.canRestart()) {
      this.emit('restartBlocked', { 
        reason: 'Circuit breaker is open or max attempts reached',
        circuitBreakerState: this.circuitBreakerState,
        currentRestartCount: this.currentRestartCount
      });
      return false;
    }

    return this.performRestart(reason);
  }

  /**
   * Get restart statistics
   */
  public getRestartStats(): {
    currentRestartCount: number;
    totalRestartAttempts: number;
    lastSuccessfulStart: Date | null;
    recentAttempts: RestartAttempt[];
    circuitBreakerState: CircuitBreakerState;
    canRestart: boolean;
  } {
    return {
      currentRestartCount: this.currentRestartCount,
      totalRestartAttempts: this.restartAttempts.length,
      lastSuccessfulStart: this.lastSuccessfulStart,
      recentAttempts: this.restartAttempts.slice(-10), // Last 10 attempts
      circuitBreakerState: this.circuitBreakerState,
      canRestart: this.canRestart()
    };
  }

  /**
   * Reset restart counter (typically called after successful operation period)
   */
  public resetRestartCounter(): void {
    this.currentRestartCount = 0;
    this.consecutiveFailures = 0;
    this.circuitBreakerState = CircuitBreakerState.CLOSED;
    this.circuitBreakerOpenTime = null;
    
    this.emit('restartCounterReset');
  }

  /**
   * Update restart manager configuration
   */
  public updateConfig(newConfig: Partial<RestartManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  /**
   * Check if restart is allowed
   */
  private canRestart(): boolean {
    // Check circuit breaker
    if (this.config.enableCircuitBreaker) {
      if (this.circuitBreakerState === CircuitBreakerState.OPEN) {
        // Check if circuit breaker should be reset
        if (this.circuitBreakerOpenTime && 
            Date.now() - this.circuitBreakerOpenTime.getTime() > this.config.circuitBreakerResetTime) {
          this.circuitBreakerState = CircuitBreakerState.HALF_OPEN;
          this.emit('circuitBreakerHalfOpen');
        } else {
          return false;
        }
      }
    }

    // Check max restart attempts
    return this.currentRestartCount < this.config.maxRestartAttempts;
  }

  /**
   * Perform the actual restart
   */
  private async performRestart(reason: string): Promise<boolean> {
    this.isRestarting = true;
    this.currentRestartCount++;
    
    const attemptNumber = this.currentRestartCount;
    const restartAttempt: RestartAttempt = {
      attemptNumber,
      timestamp: new Date(),
      reason,
      success: false
    };

    this.emit('restartAttemptStarted', {
      attemptNumber,
      reason,
      totalAttempts: this.config.maxRestartAttempts
    });

    try {
      // Stop the current worker if running
      if (this.threadManager.isWorkerRunning()) {
        await this.threadManager.stopWorker();
      }

      // Calculate delay with exponential backoff
      const delay = this.calculateRestartDelay(attemptNumber);
      
      if (delay > 0) {
        this.emit('restartDelayStarted', { delay, attemptNumber });
        await this.sleep(delay);
      }

      // Start the worker
      const success = await this.threadManager.startWorker();
      
      if (success) {
        restartAttempt.success = true;
        this.lastSuccessfulStart = new Date();
        this.consecutiveFailures = 0;
        
        // Close circuit breaker if it was half-open
        if (this.circuitBreakerState === CircuitBreakerState.HALF_OPEN) {
          this.circuitBreakerState = CircuitBreakerState.CLOSED;
          this.emit('circuitBreakerClosed');
        }

        this.emit('restartSuccess', {
          attemptNumber,
          reason,
          delay
        });

        // Schedule reset of restart counter after successful period
        this.scheduleRestartCounterReset();
        
        this.isRestarting = false;
        this.restartAttempts.push(restartAttempt);
        return true;
      } else {
        throw new Error('Worker failed to start');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      restartAttempt.error = errorMessage;
      this.consecutiveFailures++;

      this.emit('restartFailed', {
        attemptNumber,
        reason,
        error: errorMessage,
        remainingAttempts: this.config.maxRestartAttempts - attemptNumber
      });

      // Check circuit breaker
      if (this.config.enableCircuitBreaker && 
          this.consecutiveFailures >= this.config.circuitBreakerThreshold) {
        this.circuitBreakerState = CircuitBreakerState.OPEN;
        this.circuitBreakerOpenTime = new Date();
        this.emit('circuitBreakerOpened', {
          consecutiveFailures: this.consecutiveFailures,
          threshold: this.config.circuitBreakerThreshold
        });
      }

      this.isRestarting = false;
      this.restartAttempts.push(restartAttempt);
      return false;
    }
  }

  /**
   * Calculate restart delay with exponential backoff
   */
  private calculateRestartDelay(attemptNumber: number): number {
    const delay = this.config.initialRestartDelay * 
                  Math.pow(this.config.backoffMultiplier, attemptNumber - 1);
    
    return Math.min(delay, this.config.maxRestartDelay);
  }

  /**
   * Schedule reset of restart counter after successful operation period
   */
  private scheduleRestartCounterReset(): void {
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
    }

    this.restartTimeout = setTimeout(() => {
      if (this.threadManager.isWorkerRunning()) {
        this.resetRestartCounter();
      }
    }, this.config.resetCounterAfter);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Setup event handlers for ThreadManager and HealthMonitor
   */
  private setupEventHandlers(): void {
    // Handle worker exit
    this.threadManager.on('workerExit', (code) => {
      if (!this.isRestarting && code !== 0) {
        this.triggerRestart(`Worker exited with code ${code}`);
      }
    });

    // Handle worker errors
    this.threadManager.on('workerError', (error) => {
      if (!this.isRestarting) {
        this.triggerRestart(`Worker error: ${error.message}`);
      }
    });

    // Handle health monitor events
    this.healthMonitor.on('workerUnhealthy', (data) => {
      if (!this.isRestarting) {
        this.triggerRestart(`Worker unhealthy: ${data.reason}`);
      }
    });

    // Handle memory threshold exceeded
    this.healthMonitor.on('memoryThresholdExceeded', (data) => {
      if (!this.isRestarting) {
        this.triggerRestart(`Memory threshold exceeded: ${data.currentUsageMB}MB`);
      }
    });

    // Handle successful worker start
    this.threadManager.on('workerStarted', () => {
      if (this.currentRestartCount === 0) {
        this.lastSuccessfulStart = new Date();
      }
    });
  }
}