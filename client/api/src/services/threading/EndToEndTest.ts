import { ThreadingService } from './ThreadingService.js';
import { LoggingService } from './LoggingService.js';
import { ThreadingSystemConfig } from './ConfigurationManager.js';

/**
 * Test scenario configuration
 */
export interface TestScenario {
  name: string;
  description: string;
  timeout: number;
  steps: TestStep[];
}

/**
 * Individual test step
 */
export interface TestStep {
  name: string;
  action: () => Promise<void>;
  validation: () => Promise<boolean>;
  timeout?: number;
}

/**
 * Test results
 */
export interface TestResults {
  scenario: string;
  passed: boolean;
  duration: number;
  steps: Array<{
    name: string;
    passed: boolean;
    duration: number;
    error?: string;
  }>;
  error?: string;
}

/**
 * EndToEndTest performs comprehensive system testing
 */
export class EndToEndTest {
  private threadingService: ThreadingService;
  private loggingService: LoggingService;
  private testResults: TestResults[] = [];

  constructor() {
    // Initialize logging service
    this.loggingService = new LoggingService({
      level: 2, // INFO level
      enableConsole: true,
      enableFile: false
    });

    // Initialize threading service with test configuration
    const testConfig: Partial<ThreadingSystemConfig> = {
      threadManager: {
        maxRestartAttempts: 3,
        restartDelay: 1000,
        healthCheckInterval: 5000,
        messageTimeout: 5000
      },
      healthMonitor: {
        healthCheckInterval: 5000,
        healthCheckTimeout: 2000,
        maxMissedHealthChecks: 2,
        enableMemoryMonitoring: true,
        memoryThresholdMB: 256
      },
      worker: {
        maxMemoryMB: 256,
        gcInterval: 60000,
        enableProfiling: false,
        logLevel: 'info',
        moduleConfig: {
          modbus: {
            host: 'localhost',
            port: 502,
            timeout: 3000,
            retryAttempts: 2,
            retryDelay: 500,
            unitId: 1,
            registers: {
              start: 0,
              count: 5,
              interval: 2000
            }
          },
          database: {
            connectionString: 'mongodb://localhost:27017/test-mcp',
            poolSize: 5,
            timeout: 5000,
            retryAttempts: 2,
            batchSize: 10,
            flushInterval: 1000
          }
        }
      }
    };

    this.threadingService = new ThreadingService(testConfig, this.loggingService.getWinstonLogger());
  }

  /**
   * Run all end-to-end tests
   */
  public async runAllTests(): Promise<TestResults[]> {
    this.loggingService.info('Starting end-to-end system tests', 'e2e-test');
    
    const scenarios = this.getTestScenarios();
    this.testResults = [];

    for (const scenario of scenarios) {
      try {
        const result = await this.runScenario(scenario);
        this.testResults.push(result);
        
        if (result.passed) {
          this.loggingService.info(`✅ Scenario passed: ${scenario.name}`, 'e2e-test', {
            duration: result.duration
          });
        } else {
          this.loggingService.error(`❌ Scenario failed: ${scenario.name}`, 'e2e-test', {
            duration: result.duration,
            error: result.error
          });
        }
      } catch (error) {
        this.loggingService.error(`💥 Scenario crashed: ${scenario.name}`, 'e2e-test', {}, error as Error);
        
        this.testResults.push({
          scenario: scenario.name,
          passed: false,
          duration: 0,
          steps: [],
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Wait between scenarios
      await this.sleep(1000);
    }

    this.printTestSummary();
    return this.testResults;
  }

  /**
   * Run a specific test scenario
   */
  public async runScenario(scenario: TestScenario): Promise<TestResults> {
    const startTime = Date.now();
    const stepResults: TestResults['steps'] = [];
    
    this.loggingService.info(`🧪 Running scenario: ${scenario.name}`, 'e2e-test');

    try {
      for (const step of scenario.steps) {
        const stepStartTime = Date.now();
        let stepPassed = false;
        let stepError: string | undefined;

        try {
          // Execute step action
          await this.executeWithTimeout(step.action, step.timeout || 10000);
          
          // Validate step result
          stepPassed = await this.executeWithTimeout(step.validation, 5000);
          
          if (!stepPassed) {
            stepError = 'Validation failed';
          }
        } catch (error) {
          stepPassed = false;
          stepError = error instanceof Error ? error.message : 'Unknown error';
        }

        const stepDuration = Date.now() - stepStartTime;
        
        stepResults.push({
          name: step.name,
          passed: stepPassed,
          duration: stepDuration,
          error: stepError
        });

        if (!stepPassed) {
          this.loggingService.warn(`❌ Step failed: ${step.name}`, 'e2e-test', {
            error: stepError,
            duration: stepDuration
          });
          break; // Stop on first failure
        } else {
          this.loggingService.debug(`✅ Step passed: ${step.name}`, 'e2e-test', {
            duration: stepDuration
          });
        }
      }

      const duration = Date.now() - startTime;
      const allStepsPassed = stepResults.every(step => step.passed);

      return {
        scenario: scenario.name,
        passed: allStepsPassed,
        duration,
        steps: stepResults
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        scenario: scenario.name,
        passed: false,
        duration,
        steps: stepResults,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get all test scenarios
   */
  private getTestScenarios(): TestScenario[] {
    return [
      this.getBasicLifecycleScenario(),
      this.getMessageCommunicationScenario(),
      this.getHealthMonitoringScenario(),
      this.getErrorRecoveryScenario(),
      this.getResourceManagementScenario(),
      this.getConfigurationScenario(),
      this.getLoadTestingScenario()
    ];
  }

  /**
   * Basic lifecycle test scenario
   */
  private getBasicLifecycleScenario(): TestScenario {
    return {
      name: 'Basic Lifecycle',
      description: 'Test basic start/stop functionality',
      timeout: 30000,
      steps: [
        {
          name: 'Start threading service',
          action: async () => {
            const result = await this.threadingService.start();
            if (!result.success) {
              throw new Error(result.error || 'Failed to start service');
            }
          },
          validation: async () => {
            const status = await this.threadingService.getStatus();
            return status.worker.isRunning;
          }
        },
        {
          name: 'Verify worker thread is healthy',
          action: async () => {
            await this.sleep(2000); // Wait for health check
          },
          validation: async () => {
            const health = await this.threadingService.getHealthStatus();
            return health.isHealthy;
          }
        },
        {
          name: 'Stop threading service',
          action: async () => {
            await this.threadingService.stop();
          },
          validation: async () => {
            const status = await this.threadingService.getStatus();
            return !status.worker.isRunning;
          }
        }
      ]
    };
  }

  /**
   * Message communication test scenario
   */
  private getMessageCommunicationScenario(): TestScenario {
    return {
      name: 'Message Communication',
      description: 'Test message sending and receiving',
      timeout: 45000,
      steps: [
        {
          name: 'Start threading service',
          action: async () => {
            const result = await this.threadingService.start();
            if (!result.success) {
              throw new Error(result.error || 'Failed to start service');
            }
            await this.sleep(2000); // Wait for startup
          },
          validation: async () => {
            const status = await this.threadingService.getStatus();
            return status.worker.isRunning;
          }
        },
        {
          name: 'Send status message',
          action: async () => {
            await this.threadingService.sendMessage({
              type: 'status',
              priority: 'normal'
            });
          },
          validation: async () => true // If no error thrown, it's valid
        },
        {
          name: 'Send ping message',
          action: async () => {
            await this.threadingService.sendMessage({
              type: 'ping',
              priority: 'high'
            });
          },
          validation: async () => true
        },
        {
          name: 'Send multiple messages',
          action: async () => {
            const promises: Promise<any>[] = [];
            for (let i = 0; i < 5; i++) {
              promises.push(this.threadingService.sendMessage({
                type: 'status',
                priority: 'normal',
                correlationId: `test_${i}`
              }));
            }
            await Promise.all(promises);
          },
          validation: async () => true
        },
        {
          name: 'Stop threading service',
          action: async () => {
            await this.threadingService.stop();
          },
          validation: async () => {
            const status = await this.threadingService.getStatus();
            return !status.worker.isRunning;
          }
        }
      ]
    };
  }

  /**
   * Health monitoring test scenario
   */
  private getHealthMonitoringScenario(): TestScenario {
    return {
      name: 'Health Monitoring',
      description: 'Test health monitoring and recovery',
      timeout: 60000,
      steps: [
        {
          name: 'Start threading service',
          action: async () => {
            const result = await this.threadingService.start();
            if (!result.success) {
              throw new Error(result.error || 'Failed to start service');
            }
          },
          validation: async () => {
            const status = await this.threadingService.getStatus();
            return status.worker.isRunning;
          }
        },
        {
          name: 'Wait for health checks',
          action: async () => {
            await this.sleep(8000); // Wait for multiple health checks
          },
          validation: async () => {
            const health = await this.threadingService.getHealthStatus();
            return health.isHealthy && health.lastCheck !== null;
          }
        },
        {
          name: 'Perform manual health check',
          action: async () => {
            await this.threadingService.performHealthCheck();
          },
          validation: async () => {
            const result = await this.threadingService.performHealthCheck();
            return result.isHealthy;
          }
        },
        {
          name: 'Stop threading service',
          action: async () => {
            await this.threadingService.stop();
          },
          validation: async () => {
            const status = await this.threadingService.getStatus();
            return !status.worker.isRunning;
          }
        }
      ]
    };
  }

  /**
   * Error recovery test scenario
   */
  private getErrorRecoveryScenario(): TestScenario {
    return {
      name: 'Error Recovery',
      description: 'Test error handling and recovery',
      timeout: 90000,
      steps: [
        {
          name: 'Start threading service',
          action: async () => {
            const result = await this.threadingService.start();
            if (!result.success) {
              throw new Error(result.error || 'Failed to start service');
            }
            await this.sleep(2000);
          },
          validation: async () => {
            const status = await this.threadingService.getStatus();
            return status.worker.isRunning;
          }
        },
        {
          name: 'Send invalid message',
          action: async () => {
            try {
              await this.threadingService.sendMessage({
                type: 'invalid_type' as any,
                priority: 'normal'
              });
            } catch (error) {
              // Expected to fail
            }
          },
          validation: async () => {
            // Worker should still be running after error
            const status = await this.threadingService.getStatus();
            return status.worker.isRunning;
          }
        },
        {
          name: 'Restart worker',
          action: async () => {
            await this.threadingService.restartWorker('Test restart');
          },
          validation: async () => {
            await this.sleep(3000); // Wait for restart
            const status = await this.threadingService.getStatus();
            return status.worker.isRunning;
          }
        },
        {
          name: 'Stop threading service',
          action: async () => {
            await this.threadingService.stop();
          },
          validation: async () => {
            const status = await this.threadingService.getStatus();
            return !status.worker.isRunning;
          }
        }
      ]
    };
  }

  /**
   * Resource management test scenario
   */
  private getResourceManagementScenario(): TestScenario {
    return {
      name: 'Resource Management',
      description: 'Test memory monitoring and cleanup',
      timeout: 60000,
      steps: [
        {
          name: 'Start threading service',
          action: async () => {
            const result = await this.threadingService.start();
            if (!result.success) {
              throw new Error(result.error || 'Failed to start service');
            }
            await this.sleep(2000);
          },
          validation: async () => {
            const status = await this.threadingService.getStatus();
            return status.worker.isRunning;
          }
        },
        {
          name: 'Check memory usage',
          action: async () => {
            await this.sleep(3000); // Wait for memory data
          },
          validation: async () => {
            const health = await this.threadingService.getHealthStatus();
            return health.memory !== undefined;
          }
        },
        {
          name: 'Trigger garbage collection',
          action: async () => {
            await this.threadingService.sendMessage({
              type: 'gc',
              priority: 'normal'
            });
          },
          validation: async () => true
        },
        {
          name: 'Stop threading service',
          action: async () => {
            await this.threadingService.stop();
          },
          validation: async () => {
            const status = await this.threadingService.getStatus();
            return !status.worker.isRunning;
          }
        }
      ]
    };
  }

  /**
   * Configuration test scenario
   */
  private getConfigurationScenario(): TestScenario {
    return {
      name: 'Configuration Management',
      description: 'Test dynamic configuration updates',
      timeout: 45000,
      steps: [
        {
          name: 'Start threading service',
          action: async () => {
            const result = await this.threadingService.start();
            if (!result.success) {
              throw new Error(result.error || 'Failed to start service');
            }
          },
          validation: async () => {
            const status = await this.threadingService.getStatus();
            return status.worker.isRunning;
          }
        },
        {
          name: 'Get current configuration',
          action: async () => {
            await this.threadingService.getConfig();
          },
          validation: async () => {
            const config = await this.threadingService.getConfig();
            return config !== null;
          }
        },
        {
          name: 'Update configuration',
          action: async () => {
            await this.threadingService.updateConfig({
              healthMonitor: {
                healthCheckInterval: 10000,
                healthCheckTimeout: 5000,
                maxMissedHealthChecks: 3,
                enableMemoryMonitoring: true,
                memoryThresholdMB: 512
              }
            });
          },
          validation: async () => {
            const config = await this.threadingService.getConfig();
            return config.healthMonitor.healthCheckInterval === 10000;
          }
        },
        {
          name: 'Stop threading service',
          action: async () => {
            await this.threadingService.stop();
          },
          validation: async () => {
            const status = await this.threadingService.getStatus();
            return !status.worker.isRunning;
          }
        }
      ]
    };
  }

  /**
   * Load testing scenario
   */
  private getLoadTestingScenario(): TestScenario {
    return {
      name: 'Load Testing',
      description: 'Test system under load',
      timeout: 120000,
      steps: [
        {
          name: 'Start threading service',
          action: async () => {
            const result = await this.threadingService.start();
            if (!result.success) {
              throw new Error(result.error || 'Failed to start service');
            }
            await this.sleep(2000);
          },
          validation: async () => {
            const status = await this.threadingService.getStatus();
            return status.worker.isRunning;
          }
        },
        {
          name: 'Send burst of messages',
          action: async () => {
            const promises: Promise<any>[] = [];
            for (let i = 0; i < 20; i++) {
              promises.push(this.threadingService.sendMessage({
                type: 'status',
                priority: i % 2 === 0 ? 'normal' : 'high',
                correlationId: `load_test_${i}`
              }));
            }
            await Promise.all(promises);
          },
          validation: async () => {
            // System should still be responsive
            const status = await this.threadingService.getStatus();
            return status.worker.isRunning;
          },
          timeout: 30000
        },
        {
          name: 'Verify system stability',
          action: async () => {
            await this.sleep(5000); // Wait for system to settle
          },
          validation: async () => {
            const health = await this.threadingService.getHealthStatus();
            return health.isHealthy;
          }
        },
        {
          name: 'Stop threading service',
          action: async () => {
            await this.threadingService.stop();
          },
          validation: async () => {
            const status = await this.threadingService.getStatus();
            return !status.worker.isRunning;
          }
        }
      ]
    };
  }

  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      })
    ]);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Print test summary
   */
  private printTestSummary(): void {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);
    
    this.loggingService.info('📊 End-to-End Test Summary', 'e2e-test', {
      totalTests,
      passedTests,
      failedTests,
      successRate: `${Math.round((passedTests / totalTests) * 100)}%`,
      totalDuration: `${totalDuration}ms`
    });

    // Log failed tests
    const failedTestResults = this.testResults.filter(r => !r.passed);
    if (failedTestResults.length > 0) {
      this.loggingService.error('❌ Failed Tests:', 'e2e-test');
      failedTestResults.forEach(result => {
        this.loggingService.error(`  - ${result.scenario}: ${result.error}`, 'e2e-test');
      });
    }
  }

  /**
   * Get test results
   */
  public getTestResults(): TestResults[] {
    return [...this.testResults];
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    try {
      await this.threadingService.stop();
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Run end-to-end tests (can be called directly)
 */
export async function runEndToEndTests(): Promise<TestResults[]> {
  const tester = new EndToEndTest();
  
  try {
    const results = await tester.runAllTests();
    return results;
  } finally {
    await tester.cleanup();
  }
}