import { EventEmitter } from 'events';
import { ThreadManager } from './ThreadManager.js';
import { HealthMonitor } from './HealthMonitor.js';
import { ResourceMonitor } from './ResourceMonitor.js';
import { 
  ThreadManagerConfig, 
  WorkerMessage, 
  WorkerResponse, 
  EnhancedWorkerMessage,
  MessagePriority 
} from './types.js';

/**
 * Thread pool configuration
 */
export interface ThreadPoolConfig {
  minThreads: number;
  maxThreads: number;
  idleTimeout: number;
  loadBalancingStrategy: 'round_robin' | 'least_loaded' | 'random' | 'priority_based';
  healthCheckInterval: number;
  autoScaling: {
    enabled: boolean;
    scaleUpThreshold: number;    // Queue size threshold to scale up
    scaleDownThreshold: number;  // Idle time threshold to scale down
    scaleUpCooldown: number;     // Cooldown period after scaling up
    scaleDownCooldown: number;   // Cooldown period after scaling down
    maxScaleUpRate: number;      // Max threads to add at once
    maxScaleDownRate: number;    // Max threads to remove at once
  };
  resourceLimits: {
    maxMemoryPerThreadMB: number;
    maxTotalMemoryMB: number;
    maxCpuUsagePercent: number;
  };
}

/**
 * Thread pool worker information
 */
export interface PoolWorker {
  id: string;
  threadManager: ThreadManager;
  healthMonitor: HealthMonitor;
  resourceMonitor: ResourceMonitor;
  status: 'starting' | 'idle' | 'busy' | 'stopping' | 'error';
  createdAt: Date;
  lastUsed: Date;
  messageCount: number;
  errorCount: number;
  currentLoad: number; // 0-1 scale
}

/**
 * Thread pool statistics
 */
export interface ThreadPoolStats {
  totalThreads: number;
  activeThreads: number;
  idleThreads: number;
  busyThreads: number;
  errorThreads: number;
  totalMessages: number;
  averageResponseTime: number;
  queueSize: number;
  loadDistribution: Record<string, number>;
  resourceUsage: {
    totalMemoryMB: number;
    averageMemoryMB: number;
    peakMemoryMB: number;
    cpuUsagePercent: number;
  };
}

/**
 * Load balancing result
 */
interface LoadBalancingResult {
  worker: PoolWorker | null;
  reason: string;
}

/**
 * ThreadPool manages multiple worker threads for improved scalability and load distribution
 */
export class ThreadPool extends EventEmitter {
  private config: ThreadPoolConfig;
  private workers: Map<string, PoolWorker> = new Map();
  private messageQueue: Array<{ message: EnhancedWorkerMessage; resolve: Function; reject: Function }> = [];
  private workerIdCounter = 0;
  private isStarted = false;
  
  // Auto-scaling state
  private lastScaleUp = 0;
  private lastScaleDown = 0;
  private scalingInterval: NodeJS.Timeout | null = null;
  
  // Statistics
  private stats = {
    totalMessages: 0,
    responseTimes: [] as number[],
    peakMemoryMB: 0
  };

  constructor(config: Partial<ThreadPoolConfig> = {}) {
    super();
    
    // Default configuration
    this.config = {
      minThreads: 1,
      maxThreads: 4,
      idleTimeout: 300000, // 5 minutes
      loadBalancingStrategy: 'least_loaded',
      healthCheckInterval: 30000,
      autoScaling: {
        enabled: true,
        scaleUpThreshold: 5,     // Scale up when queue has 5+ messages
        scaleDownThreshold: 180000, // Scale down after 3 minutes idle
        scaleUpCooldown: 60000,  // 1 minute cooldown
        scaleDownCooldown: 300000, // 5 minutes cooldown
        maxScaleUpRate: 2,       // Add max 2 threads at once
        maxScaleDownRate: 1      // Remove max 1 thread at once
      },
      resourceLimits: {
        maxMemoryPerThreadMB: 512,
        maxTotalMemoryMB: 2048,
        maxCpuUsagePercent: 80
      },
      ...config
    };
  }

  /**
   * Start the thread pool
   */
  public async start(): Promise<void> {
    if (this.isStarted) {
      return;
    }

    this.isStarted = true;
    
    // Start with minimum number of threads
    for (let i = 0; i < this.config.minThreads; i++) {
      await this.createWorker();
    }
    
    // Start auto-scaling if enabled
    if (this.config.autoScaling.enabled) {
      this.startAutoScaling();
    }
    
    this.emit('poolStarted', {
      initialThreads: this.workers.size,
      minThreads: this.config.minThreads,
      maxThreads: this.config.maxThreads
    });
  }

  /**
   * Stop the thread pool
   */
  public async stop(graceful: boolean = true): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    this.isStarted = false;
    
    // Stop auto-scaling
    if (this.scalingInterval) {
      clearInterval(this.scalingInterval);
      this.scalingInterval = null;
    }
    
    // Stop all workers
    const stopPromises = Array.from(this.workers.values()).map(worker => 
      this.stopWorker(worker.id, graceful)
    );
    
    await Promise.all(stopPromises);
    
    // Clear message queue
    this.messageQueue.forEach(({ reject }) => {
      reject(new Error('Thread pool stopped'));
    });
    this.messageQueue = [];
    
    this.emit('poolStopped', { graceful });
  }

  /**
   * Send message to worker thread using load balancing
   */
  public async sendMessage(message: EnhancedWorkerMessage): Promise<WorkerResponse> {
    if (!this.isStarted) {
      throw new Error('Thread pool is not started');
    }

    return new Promise((resolve, reject) => {
      // Add to queue
      this.messageQueue.push({ message, resolve, reject });
      
      // Process queue
      this.processMessageQueue();
    });
  }

  /**
   * Get thread pool statistics
   */
  public getStats(): ThreadPoolStats {
    const workers = Array.from(this.workers.values());
    
    const statusCounts = workers.reduce((acc, worker) => {
      acc[worker.status] = (acc[worker.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const loadDistribution = workers.reduce((acc, worker) => {
      acc[worker.id] = worker.currentLoad;
      return acc;
    }, {} as Record<string, number>);

    const averageResponseTime = this.stats.responseTimes.length > 0
      ? this.stats.responseTimes.reduce((sum, time) => sum + time, 0) / this.stats.responseTimes.length
      : 0;

    // Calculate resource usage (would need actual implementation)
    const totalMemoryMB = 0; // Placeholder
    const averageMemoryMB = workers.length > 0 ? totalMemoryMB / workers.length : 0;

    return {
      totalThreads: workers.length,
      activeThreads: statusCounts['idle'] + statusCounts['busy'] || 0,
      idleThreads: statusCounts['idle'] || 0,
      busyThreads: statusCounts['busy'] || 0,
      errorThreads: statusCounts['error'] || 0,
      totalMessages: this.stats.totalMessages,
      averageResponseTime,
      queueSize: this.messageQueue.length,
      loadDistribution,
      resourceUsage: {
        totalMemoryMB,
        averageMemoryMB,
        peakMemoryMB: this.stats.peakMemoryMB,
        cpuUsagePercent: 0 // Placeholder
      }
    };
  }

  /**
   * Get worker information
   */
  public getWorkers(): PoolWorker[] {
    return Array.from(this.workers.values());
  }

  /**
   * Scale up the thread pool
   */
  public async scaleUp(count: number = 1): Promise<number> {
    if (!this.isStarted) {
      throw new Error('Thread pool is not started');
    }

    const currentCount = this.workers.size;
    const maxAllowed = Math.min(count, this.config.maxThreads - currentCount);
    
    if (maxAllowed <= 0) {
      return 0;
    }

    const createdWorkers = [];
    for (let i = 0; i < maxAllowed; i++) {
      try {
        const worker = await this.createWorker();
        createdWorkers.push(worker);
      } catch (error) {
        console.error('Failed to create worker during scale up:', error);
        break;
      }
    }

    if (createdWorkers.length > 0) {
      this.lastScaleUp = Date.now();
      this.emit('poolScaledUp', {
        addedWorkers: createdWorkers.length,
        totalWorkers: this.workers.size,
        requestedCount: count
      });
    }

    return createdWorkers.length;
  }

  /**
   * Scale down the thread pool
   */
  public async scaleDown(count: number = 1): Promise<number> {
    if (!this.isStarted) {
      throw new Error('Thread pool is not started');
    }

    const currentCount = this.workers.size;
    const minRequired = this.config.minThreads;
    const maxAllowed = Math.min(count, currentCount - minRequired);
    
    if (maxAllowed <= 0) {
      return 0;
    }

    // Find idle workers to remove
    const idleWorkers = Array.from(this.workers.values())
      .filter(worker => worker.status === 'idle')
      .sort((a, b) => a.lastUsed.getTime() - b.lastUsed.getTime()) // Oldest first
      .slice(0, maxAllowed);

    const removedWorkers = [];
    for (const worker of idleWorkers) {
      try {
        await this.stopWorker(worker.id);
        removedWorkers.push(worker);
      } catch (error) {
        console.error('Failed to stop worker during scale down:', error);
        break;
      }
    }

    if (removedWorkers.length > 0) {
      this.lastScaleDown = Date.now();
      this.emit('poolScaledDown', {
        removedWorkers: removedWorkers.length,
        totalWorkers: this.workers.size,
        requestedCount: count
      });
    }

    return removedWorkers.length;
  }

  /**
   * Update thread pool configuration
   */
  public updateConfig(newConfig: Partial<ThreadPoolConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  /**
   * Create a new worker thread
   */
  private async createWorker(): Promise<PoolWorker> {
    const workerId = `worker_${++this.workerIdCounter}_${Date.now()}`;
    
    // Create thread manager with pool-specific config
    const threadConfig: ThreadManagerConfig = {
      maxRestartAttempts: 3,
      restartDelay: 1000,
      healthCheckInterval: this.config.healthCheckInterval,
      messageTimeout: 10000
    };
    
    const threadManager = new ThreadManager(threadConfig);
    const healthMonitor = new HealthMonitor(threadManager);
    const resourceMonitor = new ResourceMonitor(threadManager, {
      limits: {
        maxMemoryMB: this.config.resourceLimits.maxMemoryPerThreadMB,
        memoryWarningThresholdMB: this.config.resourceLimits.maxMemoryPerThreadMB * 0.8,
        maxHeapMB: this.config.resourceLimits.maxMemoryPerThreadMB * 0.6,
        heapWarningThresholdMB: this.config.resourceLimits.maxMemoryPerThreadMB * 0.5,
        enableAutoRestart: false, // Pool manages restarts
        restartGracePeriodMs: 30000,
        enableGarbageCollection: true,
        gcInterval: 60000
      }
    });
    
    const worker: PoolWorker = {
      id: workerId,
      threadManager,
      healthMonitor,
      resourceMonitor,
      status: 'starting',
      createdAt: new Date(),
      lastUsed: new Date(),
      messageCount: 0,
      errorCount: 0,
      currentLoad: 0
    };
    
    // Setup worker event handlers
    this.setupWorkerEventHandlers(worker);
    
    // Start the worker
    try {
      const started = await threadManager.startWorker();
      if (started) {
        worker.status = 'idle';
        healthMonitor.startMonitoring();
        resourceMonitor.startMonitoring();
        
        this.workers.set(workerId, worker);
        
        this.emit('workerCreated', {
          workerId,
          totalWorkers: this.workers.size
        });
        
        return worker;
      } else {
        throw new Error('Failed to start worker thread');
      }
    } catch (error) {
      worker.status = 'error';
      throw error;
    }
  }

  /**
   * Stop a worker thread
   */
  private async stopWorker(workerId: string, graceful: boolean = true): Promise<void> {
    const worker = this.workers.get(workerId);
    if (!worker) {
      return;
    }

    worker.status = 'stopping';
    
    try {
      // Stop monitoring
      worker.healthMonitor.stopMonitoring();
      worker.resourceMonitor.stopMonitoring();
      
      // Stop thread manager
      await worker.threadManager.stopWorker();
      
      this.workers.delete(workerId);
      
      this.emit('workerStopped', {
        workerId,
        graceful,
        totalWorkers: this.workers.size
      });
    } catch (error) {
      worker.status = 'error';
      this.emit('workerError', {
        workerId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Process message queue using load balancing
   */
  private async processMessageQueue(): Promise<void> {
    while (this.messageQueue.length > 0 && this.isStarted) {
      const queueItem = this.messageQueue.shift();
      if (!queueItem) break;
      
      const { message, resolve, reject } = queueItem;
      
      try {
        const balancingResult = this.selectWorker(message);
        
        if (!balancingResult.worker) {
          // No available worker, put message back in queue
          this.messageQueue.unshift(queueItem);
          break;
        }
        
        const worker = balancingResult.worker;
        worker.status = 'busy';
        worker.lastUsed = new Date();
        worker.messageCount++;
        worker.currentLoad = Math.min(1, worker.currentLoad + 0.1);
        
        const startTime = Date.now();
        
        try {
          const response = await worker.threadManager.sendMessage(message);
          const responseTime = Date.now() - startTime;
          
          // Update statistics
          this.stats.totalMessages++;
          this.stats.responseTimes.push(responseTime);
          if (this.stats.responseTimes.length > 100) {
            this.stats.responseTimes = this.stats.responseTimes.slice(-100);
          }
          
          worker.status = 'idle';
          worker.currentLoad = Math.max(0, worker.currentLoad - 0.1);
          
          resolve(response);
        } catch (error) {
          worker.status = 'idle';
          worker.errorCount++;
          worker.currentLoad = Math.max(0, worker.currentLoad - 0.1);
          
          reject(error);
        }
      } catch (error) {
        reject(error);
      }
    }
  }

  /**
   * Select worker using load balancing strategy
   */
  private selectWorker(message: EnhancedWorkerMessage): LoadBalancingResult {
    const availableWorkers = Array.from(this.workers.values())
      .filter(worker => worker.status === 'idle');
    
    if (availableWorkers.length === 0) {
      return { worker: null, reason: 'No available workers' };
    }

    let selectedWorker: PoolWorker;
    
    switch (this.config.loadBalancingStrategy) {
      case 'round_robin':
        // Simple round-robin (would need to track last used index)
        selectedWorker = availableWorkers[0];
        break;
        
      case 'least_loaded':
        selectedWorker = availableWorkers.reduce((least, current) => 
          current.currentLoad < least.currentLoad ? current : least
        );
        break;
        
      case 'random':
        selectedWorker = availableWorkers[Math.floor(Math.random() * availableWorkers.length)];
        break;
        
      case 'priority_based':
        // For high priority messages, prefer workers with lower error counts
        if (message.priority === MessagePriority.HIGH || message.priority === MessagePriority.CRITICAL) {
          selectedWorker = availableWorkers.reduce((best, current) => 
            current.errorCount < best.errorCount ? current : best
          );
        } else {
          selectedWorker = availableWorkers[0];
        }
        break;
        
      default:
        selectedWorker = availableWorkers[0];
    }

    return { 
      worker: selectedWorker, 
      reason: `Selected using ${this.config.loadBalancingStrategy} strategy` 
    };
  }

  /**
   * Start auto-scaling monitoring
   */
  private startAutoScaling(): void {
    this.scalingInterval = setInterval(() => {
      this.checkAutoScaling();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Check if auto-scaling is needed
   */
  private checkAutoScaling(): void {
    if (!this.config.autoScaling.enabled || !this.isStarted) {
      return;
    }

    const now = Date.now();
    const queueSize = this.messageQueue.length;
    const currentWorkers = this.workers.size;
    
    // Check for scale up
    if (queueSize >= this.config.autoScaling.scaleUpThreshold &&
        currentWorkers < this.config.maxThreads &&
        now - this.lastScaleUp > this.config.autoScaling.scaleUpCooldown) {
      
      const scaleUpCount = Math.min(
        this.config.autoScaling.maxScaleUpRate,
        this.config.maxThreads - currentWorkers
      );
      
      this.scaleUp(scaleUpCount).catch(error => {
        this.emit('autoScalingError', { 
          action: 'scale_up', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      });
    }
    
    // Check for scale down
    if (currentWorkers > this.config.minThreads &&
        now - this.lastScaleDown > this.config.autoScaling.scaleDownCooldown) {
      
      const idleWorkers = Array.from(this.workers.values())
        .filter(worker => 
          worker.status === 'idle' && 
          now - worker.lastUsed.getTime() > this.config.autoScaling.scaleDownThreshold
        );
      
      if (idleWorkers.length > 0) {
        const scaleDownCount = Math.min(
          this.config.autoScaling.maxScaleDownRate,
          idleWorkers.length,
          currentWorkers - this.config.minThreads
        );
        
        this.scaleDown(scaleDownCount).catch(error => {
          this.emit('autoScalingError', { 
            action: 'scale_down', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        });
      }
    }
  }

  /**
   * Setup event handlers for a worker
   */
  private setupWorkerEventHandlers(worker: PoolWorker): void {
    worker.threadManager.on('workerError', (error) => {
      worker.status = 'error';
      worker.errorCount++;
      
      this.emit('workerError', {
        workerId: worker.id,
        error: error.message
      });
    });

    worker.resourceMonitor.on('memoryLimitExceeded', (data) => {
      this.emit('workerMemoryExceeded', {
        workerId: worker.id,
        memoryData: data
      });
    });

    worker.resourceMonitor.on('autoRestartTriggered', (data) => {
      // Handle worker restart due to resource limits
      this.handleWorkerRestart(worker, data.reason);
    });
  }

  /**
   * Handle worker restart
   */
  private async handleWorkerRestart(worker: PoolWorker, reason: string): Promise<void> {
    try {
      this.emit('workerRestarting', {
        workerId: worker.id,
        reason
      });
      
      // Stop the current worker
      await this.stopWorker(worker.id, false);
      
      // Create a new worker to replace it
      await this.createWorker();
      
    } catch (error) {
      this.emit('workerRestartFailed', {
        workerId: worker.id,
        reason,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}