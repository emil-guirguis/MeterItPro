import { EventEmitter } from 'events';
import { ThreadManagerConfig, MessagePriority } from './types.js';
import { HealthMonitorConfig } from './HealthMonitor.js';
import { RestartManagerConfig } from './RestartManager.js';
import { ErrorHandlerConfig } from './ErrorHandler.js';
import { MessageQueueConfig } from './MessageQueue.js';

/**
 * Complete threading system configuration
 */
export interface ThreadingSystemConfig {
  threadManager: ThreadManagerConfig;
  healthMonitor: HealthMonitorConfig;
  restartManager: RestartManagerConfig;
  errorHandler: ErrorHandlerConfig;
  messageQueue: MessageQueueConfig;
  worker: WorkerConfig;
}

/**
 * Worker-specific configuration
 */
export interface WorkerConfig {
  maxMemoryMB: number;
  gcInterval: number;
  enableProfiling: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  moduleConfig: {
    database: DatabaseWorkerConfig;
  };
}

/**
 * Database configuration for worker
 */
export interface DatabaseWorkerConfig {
  connectionString: string;
  poolSize: number;
  timeout: number;
  retryAttempts: number;
  batchSize: number;
  flushInterval: number;
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Configuration change event
 */
export interface ConfigChangeEvent {
  section: keyof ThreadingSystemConfig;
  oldValue: any;
  newValue: any;
  timestamp: Date;
  source: 'api' | 'file' | 'environment' | 'default';
}

/**
 * ConfigurationManager handles dynamic configuration updates for the threading system
 */
export class ConfigurationManager extends EventEmitter {
  private config: ThreadingSystemConfig;
  private configHistory: ConfigChangeEvent[] = [];
  private maxHistorySize = 100;
  private configValidators: Map<keyof ThreadingSystemConfig, (config: any) => ConfigValidationResult> = new Map();

  constructor(initialConfig?: Partial<ThreadingSystemConfig>) {
    super();
    
    // Initialize with default configuration
    this.config = this.getDefaultConfig();
    
    // Apply initial configuration if provided
    if (initialConfig) {
      this.updateConfig(initialConfig, 'default');
    }

    this.setupValidators();
  }

  /**
   * Get current configuration
   */
  public getConfig(): ThreadingSystemConfig {
    return JSON.parse(JSON.stringify(this.config)); // Deep clone
  }

  /**
   * Get configuration for specific section
   */
  public getSectionConfig<K extends keyof ThreadingSystemConfig>(section: K): ThreadingSystemConfig[K] {
    return JSON.parse(JSON.stringify(this.config[section])); // Deep clone
  }

  /**
   * Update entire configuration
   */
  public updateConfig(
    newConfig: Partial<ThreadingSystemConfig>, 
    source: 'api' | 'file' | 'environment' | 'default' = 'api'
  ): ConfigValidationResult {
    const validationResult = this.validateConfig(newConfig);
    
    if (!validationResult.isValid) {
      this.emit('configValidationFailed', {
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        source
      });
      return validationResult;
    }

    // Apply configuration changes
    const oldConfig = this.getConfig();
    
    for (const [section, sectionConfig] of Object.entries(newConfig)) {
      if (sectionConfig !== undefined) {
        const sectionKey = section as keyof ThreadingSystemConfig;
        const oldSectionConfig = this.config[sectionKey];
        
        // Deep merge configuration
        this.config[sectionKey] = this.deepMerge(oldSectionConfig, sectionConfig);
        
        // Record change
        this.recordConfigChange(sectionKey, oldSectionConfig, this.config[sectionKey], source);
        
        // Emit section-specific change event
        this.emit('configSectionChanged', {
          section: sectionKey,
          oldValue: oldSectionConfig,
          newValue: this.config[sectionKey],
          source
        });
      }
    }

    this.emit('configUpdated', {
      oldConfig,
      newConfig: this.getConfig(),
      source,
      validationResult
    });

    return validationResult;
  }

  /**
   * Update specific configuration section
   */
  public updateSectionConfig<K extends keyof ThreadingSystemConfig>(
    section: K,
    sectionConfig: Partial<ThreadingSystemConfig[K]>,
    source: 'api' | 'file' | 'environment' | 'default' = 'api'
  ): ConfigValidationResult {
    const partialConfig = { [section]: sectionConfig } as Partial<ThreadingSystemConfig>;
    return this.updateConfig(partialConfig, source);
  }

  /**
   * Validate configuration
   */
  public validateConfig(config: Partial<ThreadingSystemConfig>): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const [section, sectionConfig] of Object.entries(config)) {
      if (sectionConfig !== undefined) {
        const sectionKey = section as keyof ThreadingSystemConfig;
        const validator = this.configValidators.get(sectionKey);
        
        if (validator) {
          const sectionResult = validator(sectionConfig);
          errors.push(...sectionResult.errors);
          warnings.push(...sectionResult.warnings);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Reset configuration to defaults
   */
  public resetToDefaults(): void {
    const oldConfig = this.getConfig();
    this.config = this.getDefaultConfig();
    
    this.emit('configReset', {
      oldConfig,
      newConfig: this.getConfig()
    });
  }

  /**
   * Get configuration change history
   */
  public getConfigHistory(): ConfigChangeEvent[] {
    return [...this.configHistory];
  }

  /**
   * Clear configuration history
   */
  public clearConfigHistory(): void {
    this.configHistory = [];
    this.emit('configHistoryCleared');
  }

  /**
   * Export configuration to JSON
   */
  public exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  public importConfig(configJson: string, source: 'api' | 'file' = 'file'): ConfigValidationResult {
    try {
      const importedConfig = JSON.parse(configJson) as Partial<ThreadingSystemConfig>;
      return this.updateConfig(importedConfig, source);
    } catch (error) {
      const validationResult: ConfigValidationResult = {
        isValid: false,
        errors: [`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      };
      
      this.emit('configImportFailed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source
      });
      
      return validationResult;
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): ThreadingSystemConfig {
    return {
      threadManager: {
        maxRestartAttempts: 5,
        restartDelay: 1000,
        healthCheckInterval: 30000,
        messageTimeout: 10000
      },
      healthMonitor: {
        healthCheckInterval: 30000,
        healthCheckTimeout: 5000,
        maxMissedHealthChecks: 3,
        enableMemoryMonitoring: true,
        memoryThresholdMB: 512
      },
      restartManager: {
        maxRestartAttempts: 5,
        initialRestartDelay: 1000,
        maxRestartDelay: 60000,
        backoffMultiplier: 2,
        resetCounterAfter: 300000,
        enableCircuitBreaker: true,
        circuitBreakerThreshold: 3,
        circuitBreakerResetTime: 300000
      },
      errorHandler: {
        maxErrorHistory: 1000,
        errorReportingInterval: 60000,
        enableErrorAggregation: true,
        aggregationWindow: 300000,
        retryDelays: {
          worker_startup: [1000, 2000, 5000, 10000],
          worker_runtime: [500, 1000, 2000],
          communication: [100, 500, 1000, 2000],
          memory: [5000, 10000],
          timeout: [1000, 2000, 5000],
          configuration: [0],
          external_service: [1000, 5000, 15000, 30000],
          unknown: [1000, 2000, 5000]
        },
        maxRecoveryAttempts: {
          worker_startup: 5,
          worker_runtime: 3,
          communication: 5,
          memory: 2,
          timeout: 3,
          configuration: 1,
          external_service: 5,
          unknown: 3
        },
        severityThresholds: {
          worker_startup: 'high' as any,
          worker_runtime: 'medium' as any,
          communication: 'medium' as any,
          memory: 'high' as any,
          timeout: 'medium' as any,
          configuration: 'high' as any,
          external_service: 'medium' as any,
          unknown: 'medium' as any
        }
      },
      messageQueue: {
        maxSize: 1000,
        maxSizePerPriority: {
          [MessagePriority.CRITICAL]: 100,
          [MessagePriority.HIGH]: 200,
          [MessagePriority.NORMAL]: 500,
          [MessagePriority.LOW]: 200
        },
        enableBackpressure: true,
        backpressureThreshold: 0.8,
        processingDelay: 10,
        batchSize: 5,
        enableBatching: false
      },
      worker: {
        maxMemoryMB: 512,
        gcInterval: 60000,
        enableProfiling: false,
        logLevel: 'info',
        moduleConfig: {
          database: {
            connectionString: 'mongodb://localhost:27017/mcp-data',
            poolSize: 10,
            timeout: 10000,
            retryAttempts: 3,
            batchSize: 100,
            flushInterval: 5000
          }
        }
      }
    };
  }

  /**
   * Setup configuration validators
   */
  private setupValidators(): void {
    // Thread Manager validator
    this.configValidators.set('threadManager', (config: Partial<ThreadManagerConfig>) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (config.maxRestartAttempts !== undefined && config.maxRestartAttempts < 1) {
        errors.push('maxRestartAttempts must be at least 1');
      }
      if (config.restartDelay !== undefined && config.restartDelay < 0) {
        errors.push('restartDelay must be non-negative');
      }
      if (config.healthCheckInterval !== undefined && config.healthCheckInterval < 1000) {
        warnings.push('healthCheckInterval less than 1000ms may cause high CPU usage');
      }
      if (config.messageTimeout !== undefined && config.messageTimeout < 1000) {
        warnings.push('messageTimeout less than 1000ms may cause frequent timeouts');
      }

      return { isValid: errors.length === 0, errors, warnings };
    });

    // Health Monitor validator
    this.configValidators.set('healthMonitor', (config: Partial<HealthMonitorConfig>) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (config.healthCheckInterval !== undefined && config.healthCheckInterval < 1000) {
        warnings.push('healthCheckInterval less than 1000ms may cause high CPU usage');
      }
      if (config.healthCheckTimeout !== undefined && config.healthCheckTimeout < 100) {
        errors.push('healthCheckTimeout must be at least 100ms');
      }
      if (config.maxMissedHealthChecks !== undefined && config.maxMissedHealthChecks < 1) {
        errors.push('maxMissedHealthChecks must be at least 1');
      }
      if (config.memoryThresholdMB !== undefined && config.memoryThresholdMB < 64) {
        warnings.push('memoryThresholdMB less than 64MB may cause frequent restarts');
      }

      return { isValid: errors.length === 0, errors, warnings };
    });

    // Add more validators for other sections...
    // (Abbreviated for brevity, but would include validators for all sections)
  }

  /**
   * Record configuration change in history
   */
  private recordConfigChange(
    section: keyof ThreadingSystemConfig,
    oldValue: any,
    newValue: any,
    source: 'api' | 'file' | 'environment' | 'default'
  ): void {
    const changeEvent: ConfigChangeEvent = {
      section,
      oldValue: JSON.parse(JSON.stringify(oldValue)),
      newValue: JSON.parse(JSON.stringify(newValue)),
      timestamp: new Date(),
      source
    };

    this.configHistory.push(changeEvent);

    // Maintain history size limit
    if (this.configHistory.length > this.maxHistorySize) {
      this.configHistory = this.configHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Deep merge two objects
   */
  private deepMerge(target: any, source: any): any {
    if (source === null || source === undefined) {
      return target;
    }

    if (typeof source !== 'object' || Array.isArray(source)) {
      return source;
    }

    const result = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && !Array.isArray(source[key]) && source[key] !== null) {
          result[key] = this.deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }

    return result;
  }
}