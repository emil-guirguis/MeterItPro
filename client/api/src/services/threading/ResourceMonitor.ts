import { EventEmitter } from 'events';
import { ThreadManager } from './ThreadManager.js';

/**
 * Memory usage information
 */
export interface MemoryUsage {
  rss: number;          // Resident Set Size
  heapUsed: number;     // Used heap memory
  heapTotal: number;    // Total heap memory
  external: number;     // External memory (C++ objects)
  arrayBuffers: number; // ArrayBuffer memory
}

/**
 * Memory usage statistics
 */
export interface MemoryStats {
  current: MemoryUsage;
  peak: MemoryUsage;
  average: MemoryUsage;
  samples: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  growthRate: number; // MB per minute
}

/**
 * Resource limits configuration
 */
export interface ResourceLimits {
  maxMemoryMB: number;
  memoryWarningThresholdMB: number;
  maxHeapMB: number;
  heapWarningThresholdMB: number;
  enableAutoRestart: boolean;
  restartGracePeriodMs: number;
  enableGarbageCollection: boolean;
  gcInterval: number;
}

/**
 * Resource monitoring configuration
 */
export interface ResourceMonitorConfig {
  monitoringInterval: number;
  historySize: number;
  enableTrendAnalysis: boolean;
  trendAnalysisWindow: number;
  alertThresholds: {
    memoryGrowthRateMBPerMin: number;
    heapGrowthRateMBPerMin: number;
    consecutiveWarnings: number;
  };
  limits: ResourceLimits;
}

/**
 * Memory alert information
 */
export interface MemoryAlert {
  type: 'warning' | 'critical' | 'limit_exceeded';
  metric: 'rss' | 'heap' | 'growth_rate';
  currentValue: number;
  threshold: number;
  timestamp: Date;
  recommendation: string;
}

/**
 * ResourceMonitor handles memory usage monitoring and resource management
 */
export class ResourceMonitor extends EventEmitter {
  private threadManager: ThreadManager;
  private config: ResourceMonitorConfig;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private gcInterval: NodeJS.Timeout | null = null;
  
  // Memory tracking
  private memoryHistory: MemoryUsage[] = [];
  private peakMemory: MemoryUsage;
  private lastMemoryCheck: Date | null = null;
  private consecutiveWarnings = 0;
  private isMonitoring = false;

  constructor(threadManager: ThreadManager, config: Partial<ResourceMonitorConfig> = {}) {
    super();
    
    this.threadManager = threadManager;
    
    // Default configuration
    this.config = {
      monitoringInterval: 10000, // 10 seconds
      historySize: 100,
      enableTrendAnalysis: true,
      trendAnalysisWindow: 10, // Last 10 samples
      alertThresholds: {
        memoryGrowthRateMBPerMin: 10, // 10MB per minute
        heapGrowthRateMBPerMin: 5,    // 5MB per minute
        consecutiveWarnings: 3
      },
      limits: {
        maxMemoryMB: 512,
        memoryWarningThresholdMB: 400,
        maxHeapMB: 256,
        heapWarningThresholdMB: 200,
        enableAutoRestart: true,
        restartGracePeriodMs: 30000, // 30 seconds
        enableGarbageCollection: true,
        gcInterval: 60000 // 1 minute
      },
      ...config
    };

    // Initialize peak memory tracking
    this.peakMemory = {
      rss: 0,
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      arrayBuffers: 0
    };

    this.setupThreadManagerEvents();
  }

  /**
   * Start resource monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    
    // Start memory monitoring
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, this.config.monitoringInterval);

    // Start garbage collection if enabled
    if (this.config.limits.enableGarbageCollection) {
      this.gcInterval = setInterval(() => {
        this.triggerGarbageCollection();
      }, this.config.limits.gcInterval);
    }

    this.emit('monitoringStarted');
  }

  /**
   * Stop resource monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.gcInterval) {
      clearInterval(this.gcInterval);
      this.gcInterval = null;
    }

    this.emit('monitoringStopped');
  }

  /**
   * Get current memory usage from worker thread
   */
  public async getCurrentMemoryUsage(): Promise<MemoryUsage | null> {
    if (!this.threadManager.isWorkerRunning()) {
      return null;
    }

    try {
      const response = await this.threadManager.sendMessage({
        type: 'status',
        payload: { includeMemory: true }
      });

      if (response.type === 'status' && response.payload?.memoryUsage) {
        return response.payload.memoryUsage;
      }
    } catch (error) {
      this.emit('memoryCheckError', { error: error instanceof Error ? error.message : 'Unknown error' });
    }

    return null;
  }

  /**
   * Get memory statistics
   */
  public getMemoryStats(): MemoryStats {
    if (this.memoryHistory.length === 0) {
      const emptyUsage: MemoryUsage = {
        rss: 0,
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        arrayBuffers: 0
      };
      
      return {
        current: emptyUsage,
        peak: this.peakMemory,
        average: emptyUsage,
        samples: 0,
        trend: 'stable',
        growthRate: 0
      };
    }

    const current = this.memoryHistory[this.memoryHistory.length - 1];
    const average = this.calculateAverageMemory();
    const trend = this.analyzeTrend();
    const growthRate = this.calculateGrowthRate();

    return {
      current,
      peak: this.peakMemory,
      average,
      samples: this.memoryHistory.length,
      trend,
      growthRate
    };
  }

  /**
   * Check if memory usage is within limits
   */
  public isMemoryWithinLimits(): boolean {
    if (this.memoryHistory.length === 0) {
      return true;
    }

    const current = this.memoryHistory[this.memoryHistory.length - 1];
    const rssMB = current.rss / (1024 * 1024);
    const heapMB = current.heapUsed / (1024 * 1024);

    return rssMB <= this.config.limits.maxMemoryMB && 
           heapMB <= this.config.limits.maxHeapMB;
  }

  /**
   * Force garbage collection in worker thread
   */
  public async forceGarbageCollection(): Promise<boolean> {
    if (!this.threadManager.isWorkerRunning()) {
      return false;
    }

    try {
      const response = await this.threadManager.sendMessage({
        type: 'gc',
        payload: { force: true }
      });

      const success = response.type === 'success';
      
      if (success) {
        this.emit('garbageCollectionTriggered', { forced: true });
      }

      return success;
    } catch (error) {
      this.emit('garbageCollectionError', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  /**
   * Update resource monitor configuration
   */
  public updateConfig(newConfig: Partial<ResourceMonitorConfig>): void {
    const wasMonitoring = this.isMonitoring;
    
    if (wasMonitoring) {
      this.stopMonitoring();
    }

    this.config = { ...this.config, ...newConfig };

    if (wasMonitoring) {
      this.startMonitoring();
    }

    this.emit('configUpdated', this.config);
  }

  /**
   * Get resource limits
   */
  public getResourceLimits(): ResourceLimits {
    return { ...this.config.limits };
  }

  /**
   * Update resource limits
   */
  public updateResourceLimits(limits: Partial<ResourceLimits>): void {
    this.config.limits = { ...this.config.limits, ...limits };
    this.emit('limitsUpdated', this.config.limits);
  }

  /**
   * Clear memory history
   */
  public clearMemoryHistory(): void {
    this.memoryHistory = [];
    this.peakMemory = {
      rss: 0,
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      arrayBuffers: 0
    };
    this.consecutiveWarnings = 0;
    this.emit('historyCleared');
  }

  /**
   * Check memory usage and enforce limits
   */
  private async checkMemoryUsage(): Promise<void> {
    const memoryUsage = await this.getCurrentMemoryUsage();
    
    if (!memoryUsage) {
      return;
    }

    // Add to history
    this.addToMemoryHistory(memoryUsage);
    
    // Update peak memory
    this.updatePeakMemory(memoryUsage);
    
    // Check for alerts
    this.checkMemoryAlerts(memoryUsage);
    
    // Enforce limits
    await this.enforceMemoryLimits(memoryUsage);
    
    this.lastMemoryCheck = new Date();
    
    this.emit('memoryChecked', {
      usage: memoryUsage,
      timestamp: this.lastMemoryCheck
    });
  }

  /**
   * Add memory usage to history
   */
  private addToMemoryHistory(usage: MemoryUsage): void {
    this.memoryHistory.push(usage);
    
    // Maintain history size
    if (this.memoryHistory.length > this.config.historySize) {
      this.memoryHistory = this.memoryHistory.slice(-this.config.historySize);
    }
  }

  /**
   * Update peak memory tracking
   */
  private updatePeakMemory(usage: MemoryUsage): void {
    if (usage.rss > this.peakMemory.rss) {
      this.peakMemory.rss = usage.rss;
    }
    if (usage.heapUsed > this.peakMemory.heapUsed) {
      this.peakMemory.heapUsed = usage.heapUsed;
    }
    if (usage.heapTotal > this.peakMemory.heapTotal) {
      this.peakMemory.heapTotal = usage.heapTotal;
    }
    if (usage.external > this.peakMemory.external) {
      this.peakMemory.external = usage.external;
    }
    if (usage.arrayBuffers > this.peakMemory.arrayBuffers) {
      this.peakMemory.arrayBuffers = usage.arrayBuffers;
    }
  }

  /**
   * Check for memory alerts
   */
  private checkMemoryAlerts(usage: MemoryUsage): void {
    const rssMB = usage.rss / (1024 * 1024);
    const heapMB = usage.heapUsed / (1024 * 1024);
    
    const alerts: MemoryAlert[] = [];

    // Check RSS memory warnings
    if (rssMB >= this.config.limits.memoryWarningThresholdMB) {
      alerts.push({
        type: rssMB >= this.config.limits.maxMemoryMB ? 'critical' : 'warning',
        metric: 'rss',
        currentValue: rssMB,
        threshold: rssMB >= this.config.limits.maxMemoryMB 
          ? this.config.limits.maxMemoryMB 
          : this.config.limits.memoryWarningThresholdMB,
        timestamp: new Date(),
        recommendation: rssMB >= this.config.limits.maxMemoryMB
          ? 'Immediate restart required - memory limit exceeded'
          : 'Consider triggering garbage collection or reducing workload'
      });
    }

    // Check heap memory warnings
    if (heapMB >= this.config.limits.heapWarningThresholdMB) {
      alerts.push({
        type: heapMB >= this.config.limits.maxHeapMB ? 'critical' : 'warning',
        metric: 'heap',
        currentValue: heapMB,
        threshold: heapMB >= this.config.limits.maxHeapMB 
          ? this.config.limits.maxHeapMB 
          : this.config.limits.heapWarningThresholdMB,
        timestamp: new Date(),
        recommendation: heapMB >= this.config.limits.maxHeapMB
          ? 'Immediate action required - heap limit exceeded'
          : 'Monitor heap usage and consider garbage collection'
      });
    }

    // Check growth rate if trend analysis is enabled
    if (this.config.enableTrendAnalysis) {
      const growthRate = this.calculateGrowthRate();
      if (growthRate > this.config.alertThresholds.memoryGrowthRateMBPerMin) {
        alerts.push({
          type: 'warning',
          metric: 'growth_rate',
          currentValue: growthRate,
          threshold: this.config.alertThresholds.memoryGrowthRateMBPerMin,
          timestamp: new Date(),
          recommendation: 'Memory usage is growing rapidly - investigate potential memory leaks'
        });
      }
    }

    // Emit alerts
    alerts.forEach(alert => {
      this.emit('memoryAlert', alert);
      
      if (alert.type === 'warning') {
        this.consecutiveWarnings++;
      } else {
        this.consecutiveWarnings = 0;
      }
    });

    // Check for consecutive warnings
    if (this.consecutiveWarnings >= this.config.alertThresholds.consecutiveWarnings) {
      this.emit('consecutiveMemoryWarnings', {
        count: this.consecutiveWarnings,
        threshold: this.config.alertThresholds.consecutiveWarnings
      });
    }
  }

  /**
   * Enforce memory limits
   */
  private async enforceMemoryLimits(usage: MemoryUsage): Promise<void> {
    const rssMB = usage.rss / (1024 * 1024);
    const heapMB = usage.heapUsed / (1024 * 1024);

    // Check if limits are exceeded
    const rssExceeded = rssMB > this.config.limits.maxMemoryMB;
    const heapExceeded = heapMB > this.config.limits.maxHeapMB;

    if (rssExceeded || heapExceeded) {
      this.emit('memoryLimitExceeded', {
        rss: { current: rssMB, limit: this.config.limits.maxMemoryMB, exceeded: rssExceeded },
        heap: { current: heapMB, limit: this.config.limits.maxHeapMB, exceeded: heapExceeded }
      });

      if (this.config.limits.enableAutoRestart) {
        // Give a grace period before restart
        setTimeout(async () => {
          const currentUsage = await this.getCurrentMemoryUsage();
          if (currentUsage) {
            const currentRssMB = currentUsage.rss / (1024 * 1024);
            const currentHeapMB = currentUsage.heapUsed / (1024 * 1024);
            
            // Check if still exceeding limits after grace period
            if (currentRssMB > this.config.limits.maxMemoryMB || 
                currentHeapMB > this.config.limits.maxHeapMB) {
              
              this.emit('autoRestartTriggered', {
                reason: 'Memory limit exceeded',
                rss: currentRssMB,
                heap: currentHeapMB,
                limits: this.config.limits
              });
            }
          }
        }, this.config.limits.restartGracePeriodMs);
      }
    }
  }

  /**
   * Calculate average memory usage
   */
  private calculateAverageMemory(): MemoryUsage {
    if (this.memoryHistory.length === 0) {
      return {
        rss: 0,
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        arrayBuffers: 0
      };
    }

    const sum = this.memoryHistory.reduce((acc, usage) => ({
      rss: acc.rss + usage.rss,
      heapUsed: acc.heapUsed + usage.heapUsed,
      heapTotal: acc.heapTotal + usage.heapTotal,
      external: acc.external + usage.external,
      arrayBuffers: acc.arrayBuffers + usage.arrayBuffers
    }), {
      rss: 0,
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      arrayBuffers: 0
    });

    const count = this.memoryHistory.length;
    
    return {
      rss: sum.rss / count,
      heapUsed: sum.heapUsed / count,
      heapTotal: sum.heapTotal / count,
      external: sum.external / count,
      arrayBuffers: sum.arrayBuffers / count
    };
  }

  /**
   * Analyze memory usage trend
   */
  private analyzeTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (!this.config.enableTrendAnalysis || 
        this.memoryHistory.length < this.config.trendAnalysisWindow) {
      return 'stable';
    }

    const recentSamples = this.memoryHistory.slice(-this.config.trendAnalysisWindow);
    const firstHalf = recentSamples.slice(0, Math.floor(recentSamples.length / 2));
    const secondHalf = recentSamples.slice(Math.floor(recentSamples.length / 2));

    const firstAvg = firstHalf.reduce((sum, usage) => sum + usage.rss, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, usage) => sum + usage.rss, 0) / secondHalf.length;

    const threshold = 1024 * 1024; // 1MB threshold
    
    if (secondAvg > firstAvg + threshold) {
      return 'increasing';
    } else if (secondAvg < firstAvg - threshold) {
      return 'decreasing';
    } else {
      return 'stable';
    }
  }

  /**
   * Calculate memory growth rate (MB per minute)
   */
  private calculateGrowthRate(): number {
    if (this.memoryHistory.length < 2) {
      return 0;
    }

    const recent = this.memoryHistory.slice(-Math.min(10, this.memoryHistory.length));
    const timeSpanMs = (recent.length - 1) * this.config.monitoringInterval;
    const timeSpanMin = timeSpanMs / (1000 * 60);

    if (timeSpanMin === 0) {
      return 0;
    }

    const startMemory = recent[0].rss / (1024 * 1024);
    const endMemory = recent[recent.length - 1].rss / (1024 * 1024);
    
    return (endMemory - startMemory) / timeSpanMin;
  }

  /**
   * Trigger garbage collection
   */
  private async triggerGarbageCollection(): Promise<void> {
    if (this.threadManager.isWorkerRunning()) {
      try {
        await this.forceGarbageCollection();
      } catch (error) {
        // Ignore errors in automatic GC
      }
    }
  }

  /**
   * Setup event handlers for ThreadManager
   */
  private setupThreadManagerEvents(): void {
    this.threadManager.on('workerStarted', () => {
      // Reset monitoring state when worker starts
      this.clearMemoryHistory();
    });

    this.threadManager.on('workerStopped', () => {
      // Keep history but stop active monitoring
      this.lastMemoryCheck = null;
    });
  }
}