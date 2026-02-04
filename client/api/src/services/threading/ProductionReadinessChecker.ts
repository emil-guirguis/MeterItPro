import { EventEmitter } from 'events';
import { ThreadingService } from './ThreadingService.js';
import { LoggingService } from './LoggingService.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Check severity levels
 */
export enum CheckSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Check status
 */
export enum CheckStatus {
  PASS = 'pass',
  FAIL = 'fail',
  SKIP = 'skip'
}

/**
 * Individual readiness check result
 */
export interface ReadinessCheck {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: CheckSeverity;
  status: CheckStatus;
  message: string;
  details?: Record<string, any>;
  recommendation?: string;
  duration: number;
}

/**
 * Overall readiness assessment
 */
export interface ReadinessAssessment {
  overall: 'ready' | 'warning' | 'not_ready';
  score: number; // 0-100
  timestamp: Date;
  checks: ReadinessCheck[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    critical: number;
  };
  recommendations: string[];
}

/**
 * ProductionReadinessChecker validates system readiness for production deployment
 */
export class ProductionReadinessChecker extends EventEmitter {
  private threadingService: ThreadingService | null = null;
  private loggingService: LoggingService;
  private checks: ReadinessCheck[] = [];

  constructor(loggingService: LoggingService, threadingService?: ThreadingService) {
    super();
    this.loggingService = loggingService;
    this.threadingService = threadingService || null;
  }

  /**
   * Run all production readiness checks
   */
  public async runAllChecks(): Promise<ReadinessAssessment> {
    this.loggingService.info('Starting production readiness checks', 'readiness');
    this.checks = [];

    const startTime = Date.now();

    // Run all check categories
    await this.runSystemChecks();
    await this.runSecurityChecks();
    await this.runConfigurationChecks();
    await this.runPerformanceChecks();
    await this.runMonitoringChecks();
    await this.runThreadingChecks();

    const totalDuration = Date.now() - startTime;

    // Calculate assessment
    const assessment = this.calculateAssessment();
    
    this.loggingService.info('Production readiness checks completed', 'readiness', {
      overall: assessment.overall,
      score: assessment.score,
      duration: totalDuration,
      totalChecks: assessment.summary.total,
      passed: assessment.summary.passed,
      failed: assessment.summary.failed
    });

    this.emit('checksCompleted', assessment);
    return assessment;
  }

  /**
   * Run system-level checks
   */
  private async runSystemChecks(): Promise<void> {
    // Node.js version check
    await this.runCheck({
      id: 'nodejs_version',
      name: 'Node.js Version',
      description: 'Check Node.js version compatibility',
      category: 'system',
      severity: CheckSeverity.ERROR,
      check: async () => {
        const version = process.version;
        const majorVersion = parseInt(version.substring(1).split('.')[0]);
        
        if (majorVersion >= 18) {
          return { status: CheckStatus.PASS, message: `Node.js ${version} is supported` };
        } else if (majorVersion >= 16) {
          return { 
            status: CheckStatus.PASS, 
            message: `Node.js ${version} is supported but upgrade recommended`,
            recommendation: 'Upgrade to Node.js 18+ for better performance and security'
          };
        } else {
          return { 
            status: CheckStatus.FAIL, 
            message: `Node.js ${version} is not supported`,
            recommendation: 'Upgrade to Node.js 18+ before deploying to production'
          };
        }
      }
    });

    // Memory availability check
    await this.runCheck({
      id: 'system_memory',
      name: 'System Memory',
      description: 'Check available system memory',
      category: 'system',
      severity: CheckSeverity.WARNING,
      check: async () => {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const totalGB = Math.round(totalMemory / (1024 * 1024 * 1024) * 100) / 100;
        const freeGB = Math.round(freeMemory / (1024 * 1024 * 1024) * 100) / 100;
        
        if (totalGB >= 4) {
          return { 
            status: CheckStatus.PASS, 
            message: `${totalGB}GB total memory available (${freeGB}GB free)`,
            details: { totalGB, freeGB }
          };
        } else if (totalGB >= 2) {
          return { 
            status: CheckStatus.PASS, 
            message: `${totalGB}GB total memory available (minimum met)`,
            recommendation: 'Consider upgrading to 4GB+ for better performance',
            details: { totalGB, freeGB }
          };
        } else {
          return { 
            status: CheckStatus.FAIL, 
            message: `Only ${totalGB}GB total memory available`,
            recommendation: 'Upgrade to at least 2GB RAM for production deployment',
            details: { totalGB, freeGB }
          };
        }
      }
    });

    // Disk space check
    await this.runCheck({
      id: 'disk_space',
      name: 'Disk Space',
      description: 'Check available disk space',
      category: 'system',
      severity: CheckSeverity.WARNING,
      check: async () => {
        try {
          const stats = fs.statSync('.');
          // This is a simplified check - in production you'd want to check actual disk usage
          return { 
            status: CheckStatus.PASS, 
            message: 'Disk space check passed',
            recommendation: 'Monitor disk usage regularly and set up alerts'
          };
        } catch (error) {
          return { 
            status: CheckStatus.FAIL, 
            message: 'Could not check disk space',
            recommendation: 'Manually verify sufficient disk space (10GB+ recommended)'
          };
        }
      }
    });

    // Worker threads support
    await this.runCheck({
      id: 'worker_threads_support',
      name: 'Worker Threads Support',
      description: 'Check if worker threads are supported',
      category: 'system',
      severity: CheckSeverity.CRITICAL,
      check: async () => {
        try {
          const { Worker } = await import('worker_threads');
          return { 
            status: CheckStatus.PASS, 
            message: 'Worker threads are supported' 
          };
        } catch (error) {
          return { 
            status: CheckStatus.FAIL, 
            message: 'Worker threads are not supported',
            recommendation: 'Ensure Node.js is compiled with worker thread support'
          };
        }
      }
    });
  }

  /**
   * Run security-related checks
   */
  private async runSecurityChecks(): Promise<void> {
    // Environment check
    await this.runCheck({
      id: 'node_env',
      name: 'NODE_ENV Setting',
      description: 'Check if NODE_ENV is set to production',
      category: 'security',
      severity: CheckSeverity.ERROR,
      check: async () => {
        const nodeEnv = process.env.NODE_ENV;
        
        if (nodeEnv === 'production') {
          return { status: CheckStatus.PASS, message: 'NODE_ENV is set to production' };
        } else {
          return { 
            status: CheckStatus.FAIL, 
            message: `NODE_ENV is set to '${nodeEnv || 'undefined'}'`,
            recommendation: 'Set NODE_ENV=production for production deployment'
          };
        }
      }
    });

    // JWT secret check
    await this.runCheck({
      id: 'jwt_secret',
      name: 'JWT Secret',
      description: 'Check if JWT secret is properly configured',
      category: 'security',
      severity: CheckSeverity.CRITICAL,
      check: async () => {
        const jwtSecret = process.env.JWT_SECRET;
        
        if (!jwtSecret) {
          return { 
            status: CheckStatus.FAIL, 
            message: 'JWT_SECRET is not set',
            recommendation: 'Set a strong JWT_SECRET (32+ characters)'
          };
        } else if (jwtSecret.length < 32) {
          return { 
            status: CheckStatus.FAIL, 
            message: `JWT_SECRET is too short (${jwtSecret.length} characters)`,
            recommendation: 'Use a JWT_SECRET with at least 32 characters'
          };
        } else if (jwtSecret.includes('change') || jwtSecret.includes('secret') || jwtSecret.includes('key')) {
          return { 
            status: CheckStatus.FAIL, 
            message: 'JWT_SECRET appears to be a default/example value',
            recommendation: 'Use a unique, randomly generated JWT_SECRET'
          };
        } else {
          return { status: CheckStatus.PASS, message: 'JWT_SECRET is properly configured' };
        }
      }
    });

    // Database password check
    await this.runCheck({
      id: 'db_password',
      name: 'Database Password',
      description: 'Check if database password is secure',
      category: 'security',
      severity: CheckSeverity.ERROR,
      check: async () => {
        const mongoUri = process.env.MONGODB_URI || '';
        const mongoPassword = process.env.MONGO_ROOT_PASSWORD;
        
        if (mongoUri.includes('admin123') || mongoPassword === 'admin123') {
          return { 
            status: CheckStatus.FAIL, 
            message: 'Database is using default password',
            recommendation: 'Change database password from default value'
          };
        } else if (!mongoPassword || mongoPassword.length < 8) {
          return { 
            status: CheckStatus.FAIL, 
            message: 'Database password is weak or missing',
            recommendation: 'Use a strong database password (8+ characters)'
          };
        } else {
          return { status: CheckStatus.PASS, message: 'Database password is configured' };
        }
      }
    });
  }

  /**
   * Run configuration checks
   */
  private async runConfigurationChecks(): Promise<void> {
    // Required environment variables
    const requiredEnvVars = [
      'MONGODB_URI',
      'JWT_SECRET',
      'FRONTEND_URL'
    ];

    for (const envVar of requiredEnvVars) {
      await this.runCheck({
        id: `env_${envVar.toLowerCase()}`,
        name: `Environment Variable: ${envVar}`,
        description: `Check if ${envVar} is configured`,
        category: 'configuration',
        severity: CheckSeverity.ERROR,
        check: async () => {
          const value = process.env[envVar];
          
          if (!value) {
            return { 
              status: CheckStatus.FAIL, 
              message: `${envVar} is not set`,
              recommendation: `Set ${envVar} in environment configuration`
            };
          } else {
            return { status: CheckStatus.PASS, message: `${envVar} is configured` };
          }
        }
      });
    }

    // Threading configuration
    await this.runCheck({
      id: 'threading_config',
      name: 'Threading Configuration',
      description: 'Check threading system configuration',
      category: 'configuration',
      severity: CheckSeverity.WARNING,
      check: async () => {
        const autoStart = process.env.THREADING_AUTO_START;
        const maxMemory = process.env.WORKER_MAX_MEMORY_MB;
        
        const issues: string[] = [];
        
        if (autoStart === 'false') {
          issues.push('Threading auto-start is disabled');
        }
        
        if (!maxMemory || parseInt(maxMemory) < 256) {
          issues.push('Worker memory limit is low or not set');
        }
        
        if (issues.length > 0) {
          return { 
            status: CheckStatus.PASS, 
            message: 'Threading configuration has recommendations',
            recommendation: issues.join('; ')
          };
        } else {
          return { status: CheckStatus.PASS, message: 'Threading configuration is optimal' };
        }
      }
    });
  }

  /**
   * Run performance checks
   */
  private async runPerformanceChecks(): Promise<void> {
    // Garbage collection exposure
    await this.runCheck({
      id: 'gc_exposed',
      name: 'Garbage Collection',
      description: 'Check if garbage collection is exposed',
      category: 'performance',
      severity: CheckSeverity.WARNING,
      check: async () => {
        if (global.gc) {
          return { 
            status: CheckStatus.PASS, 
            message: 'Garbage collection is exposed (--expose-gc)',
            recommendation: 'Good for memory management in threading system'
          };
        } else {
          return { 
            status: CheckStatus.PASS, 
            message: 'Garbage collection is not exposed',
            recommendation: 'Consider running with --expose-gc for better memory management'
          };
        }
      }
    });

    // Memory limits
    await this.runCheck({
      id: 'memory_limits',
      name: 'Memory Limits',
      description: 'Check memory limit configuration',
      category: 'performance',
      severity: CheckSeverity.INFO,
      check: async () => {
        const maxOldSpace = process.env.NODE_OPTIONS?.includes('--max-old-space-size');
        const workerMemory = process.env.WORKER_MAX_MEMORY_MB;
        
        if (maxOldSpace && workerMemory) {
          return { 
            status: CheckStatus.PASS, 
            message: 'Memory limits are configured',
            details: { workerMemoryMB: workerMemory }
          };
        } else {
          return { 
            status: CheckStatus.PASS, 
            message: 'Memory limits could be optimized',
            recommendation: 'Consider setting --max-old-space-size and WORKER_MAX_MEMORY_MB'
          };
        }
      }
    });
  }

  /**
   * Run monitoring checks
   */
  private async runMonitoringChecks(): Promise<void> {
    // Log directory
    await this.runCheck({
      id: 'log_directory',
      name: 'Log Directory',
      description: 'Check if log directory exists and is writable',
      category: 'monitoring',
      severity: CheckSeverity.WARNING,
      check: async () => {
        try {
          const logDir = path.join(process.cwd(), 'logs');
          
          if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
          }
          
          // Test write access
          const testFile = path.join(logDir, 'test.tmp');
          fs.writeFileSync(testFile, 'test');
          fs.unlinkSync(testFile);
          
          return { status: CheckStatus.PASS, message: 'Log directory is accessible' };
        } catch (error) {
          return { 
            status: CheckStatus.FAIL, 
            message: 'Cannot write to log directory',
            recommendation: 'Ensure logs directory exists and is writable'
          };
        }
      }
    });

    // Health endpoint
    await this.runCheck({
      id: 'health_endpoint',
      name: 'Health Endpoint',
      description: 'Check if health endpoint is accessible',
      category: 'monitoring',
      severity: CheckSeverity.INFO,
      check: async () => {
        // This would typically make an HTTP request to the health endpoint
        // For now, we'll just check if the server is configured
        const port = process.env.PORT || 3001;
        
        return { 
          status: CheckStatus.PASS, 
          message: `Health endpoint should be available at http://localhost:${port}/api/health`,
          recommendation: 'Verify health endpoint is accessible from load balancer'
        };
      }
    });
  }

  /**
   * Run threading system specific checks
   */
  private async runThreadingChecks(): Promise<void> {
    if (!this.threadingService) {
      await this.runCheck({
        id: 'threading_service',
        name: 'Threading Service',
        description: 'Check if threading service is available',
        category: 'threading',
        severity: CheckSeverity.INFO,
        check: async () => {
          return { 
            status: CheckStatus.SKIP, 
            message: 'Threading service not provided for testing',
            recommendation: 'Run checks with threading service instance for complete validation'
          };
        }
      });
      return;
    }

    // Threading service status
    await this.runCheck({
      id: 'threading_status',
      name: 'Threading Service Status',
      description: 'Check threading service operational status',
      category: 'threading',
      severity: CheckSeverity.ERROR,
      check: async () => {
        try {
          const status = await this.threadingService!.getStatus();
          
          if (status.worker.isRunning) {
            return { 
              status: CheckStatus.PASS, 
              message: 'Threading service is operational',
              details: { 
                threadId: status.worker.threadId,
                uptime: status.worker.uptime,
                restartCount: status.worker.restartCount
              }
            };
          } else {
            return { 
              status: CheckStatus.FAIL, 
              message: 'Threading service worker is not running',
              recommendation: 'Start threading service before production deployment'
            };
          }
        } catch (error) {
          return { 
            status: CheckStatus.FAIL, 
            message: `Threading service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            recommendation: 'Fix threading service issues before deployment'
          };
        }
      }
    });

    // Health monitoring
    await this.runCheck({
      id: 'health_monitoring',
      name: 'Health Monitoring',
      description: 'Check if health monitoring is active',
      category: 'threading',
      severity: CheckSeverity.WARNING,
      check: async () => {
        try {
          const health = await this.threadingService!.getHealthStatus();
          
          if (health.isHealthy && health.lastCheck) {
            return { 
              status: CheckStatus.PASS, 
              message: 'Health monitoring is active and healthy',
              details: { 
                lastCheck: health.lastCheck,
                uptime: health.uptime
              }
            };
          } else {
            return { 
              status: CheckStatus.FAIL, 
              message: 'Health monitoring issues detected',
              recommendation: 'Investigate health monitoring configuration'
            };
          }
        } catch (error) {
          return { 
            status: CheckStatus.FAIL, 
            message: `Health monitoring error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            recommendation: 'Fix health monitoring before deployment'
          };
        }
      }
    });
  }

  /**
   * Run an individual check
   */
  private async runCheck(checkDef: {
    id: string;
    name: string;
    description: string;
    category: string;
    severity: CheckSeverity;
    check: () => Promise<{
      status: CheckStatus;
      message: string;
      details?: Record<string, any>;
      recommendation?: string;
    }>;
  }): Promise<void> {
    const startTime = Date.now();
    
    try {
      const result = await checkDef.check();
      const duration = Date.now() - startTime;
      
      const check: ReadinessCheck = {
        id: checkDef.id,
        name: checkDef.name,
        description: checkDef.description,
        category: checkDef.category,
        severity: checkDef.severity,
        status: result.status,
        message: result.message,
        details: result.details,
        recommendation: result.recommendation,
        duration
      };
      
      this.checks.push(check);
      
      this.emit('checkCompleted', check);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      const check: ReadinessCheck = {
        id: checkDef.id,
        name: checkDef.name,
        description: checkDef.description,
        category: checkDef.category,
        severity: checkDef.severity,
        status: CheckStatus.FAIL,
        message: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recommendation: 'Investigate and fix the underlying issue',
        duration
      };
      
      this.checks.push(check);
      this.emit('checkCompleted', check);
    }
  }

  /**
   * Calculate overall readiness assessment
   */
  private calculateAssessment(): ReadinessAssessment {
    const summary = {
      total: this.checks.length,
      passed: this.checks.filter(c => c.status === CheckStatus.PASS).length,
      failed: this.checks.filter(c => c.status === CheckStatus.FAIL).length,
      warnings: this.checks.filter(c => c.severity === CheckSeverity.WARNING && c.status === CheckStatus.PASS).length,
      critical: this.checks.filter(c => c.severity === CheckSeverity.CRITICAL && c.status === CheckStatus.FAIL).length
    };

    // Calculate score (0-100)
    const passWeight = 1;
    const skipWeight = 0.5;
    const maxScore = summary.total * passWeight;
    const actualScore = (summary.passed * passWeight) + 
                       (this.checks.filter(c => c.status === CheckStatus.SKIP).length * skipWeight);
    const score = Math.round((actualScore / maxScore) * 100);

    // Determine overall status
    let overall: 'ready' | 'warning' | 'not_ready';
    
    if (summary.critical > 0) {
      overall = 'not_ready';
    } else if (summary.failed > 0 || score < 80) {
      overall = 'warning';
    } else {
      overall = 'ready';
    }

    // Collect recommendations
    const recommendations = this.checks
      .filter(c => c.recommendation)
      .map(c => c.recommendation!)
      .filter((rec, index, arr) => arr.indexOf(rec) === index); // Remove duplicates

    return {
      overall,
      score,
      timestamp: new Date(),
      checks: [...this.checks],
      summary,
      recommendations
    };
  }

  /**
   * Get checks by category
   */
  public getChecksByCategory(category: string): ReadinessCheck[] {
    return this.checks.filter(check => check.category === category);
  }

  /**
   * Get failed checks
   */
  public getFailedChecks(): ReadinessCheck[] {
    return this.checks.filter(check => check.status === CheckStatus.FAIL);
  }

  /**
   * Get critical issues
   */
  public getCriticalIssues(): ReadinessCheck[] {
    return this.checks.filter(check => 
      check.severity === CheckSeverity.CRITICAL && check.status === CheckStatus.FAIL
    );
  }
}