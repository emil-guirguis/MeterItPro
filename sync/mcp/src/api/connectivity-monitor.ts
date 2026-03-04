/**
 * Connectivity Monitor
 * 
 * Monitors Client System connectivity and provides status for offline operation handling.
 * Automatically detects when connectivity is restored and triggers sync resumption.
 */

import { ClientSystemApiClient } from './client-system-api.js';
import { EventEmitter } from 'events';

export interface ConnectivityStatus {
  isConnected: boolean;
  lastCheckTime: Date;
  lastSuccessfulConnection?: Date;
  lastFailedConnection?: Date;
  consecutiveFailures: number;
  uptime: number; // seconds
  downtime: number; // seconds
}

export class ConnectivityMonitor extends EventEmitter {
  private apiClient: ClientSystemApiClient;
  private checkIntervalMs: number;
  private intervalId?: NodeJS.Timeout;
  private isInitialCheck: boolean = true;

  private status: ConnectivityStatus;
  private lastStateChangeTime: Date;

  constructor(apiClient: ClientSystemApiClient, checkIntervalMs: number = 60000) {
    super();
    this.apiClient = apiClient;
    this.checkIntervalMs = checkIntervalMs;

    this.status = {
      isConnected: false,
      lastCheckTime: new Date(),
      consecutiveFailures: 0,
      uptime: 0,
      downtime: 0,
    };

    this.lastStateChangeTime = new Date();
  }

  /**
   * Start monitoring connectivity
   */
  start(): void {
    if (this.intervalId) {
      console.log('Connectivity monitor already running');
      return;
    }

    console.log(`Starting connectivity monitor (check interval: ${this.checkIntervalMs}ms)`);

    // Perform initial check
    this.checkConnectivity();

    // Schedule periodic checks
    this.intervalId = setInterval(() => {
      this.checkConnectivity();
    }, this.checkIntervalMs);
  }

  /**
   * Stop monitoring connectivity
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      console.log('Connectivity monitor stopped');
    }
  }

  /**
   * Check connectivity to Client System
   */
  private async checkConnectivity(): Promise<void> {
    const previousState = this.status.isConnected;
    
    try {
      console.log('🔄 [ConnectivityMonitor] Checking connectivity...');
      const isConnected = await this.apiClient.testConnection();
      console.log(`✓ [ConnectivityMonitor] Connection test result: ${isConnected}`);
      
      this.status.lastCheckTime = new Date();
      this.status.isConnected = isConnected;
      console.log(`📊 [ConnectivityMonitor] Updated status.isConnected to: ${isConnected}`);

      if (isConnected) {
        this.status.lastSuccessfulConnection = new Date();
        this.status.consecutiveFailures = 0;

        // State changed from offline to online — skip 'connected' event on initial check
        // to avoid triggering a redundant upload alongside the explicit startup upload
        if (!previousState && !this.isInitialCheck) {
          console.log('✓ Client System connectivity restored');
          this.handleStateChange(true);
          this.emit('connected');
        }
      } else {
        this.status.lastFailedConnection = new Date();
        this.status.consecutiveFailures++;

        // State changed from online to offline
        if (previousState) {
          console.log('✗ Client System connectivity lost');
          this.handleStateChange(false);
          this.emit('disconnected');
        }
      }
    } catch (error) {
      console.error('❌ [ConnectivityMonitor] Error during connectivity check:', error);
      this.status.lastCheckTime = new Date();
      this.status.isConnected = false;
      this.status.lastFailedConnection = new Date();
      this.status.consecutiveFailures++;

      // State changed from online to offline
      if (previousState) {
        console.log('✗ Client System connectivity lost');
        this.handleStateChange(false);
        this.emit('disconnected');
      }
    } finally {
      this.isInitialCheck = false;
    }

    // Update uptime/downtime
    this.updateTimers();
  }

  /**
   * Handle connectivity state change
   */
  private handleStateChange(isConnected: boolean): void {
    this.lastStateChangeTime = new Date();
    
    if (isConnected) {
      this.emit('state-change', { isConnected: true, timestamp: new Date() });
    } else {
      this.emit('state-change', { isConnected: false, timestamp: new Date() });
    }
  }

  /**
   * Update uptime and downtime counters
   */
  private updateTimers(): void {
    const now = new Date();
    const elapsedSeconds = Math.floor(
      (now.getTime() - this.lastStateChangeTime.getTime()) / 1000
    );

    if (this.status.isConnected) {
      this.status.uptime = elapsedSeconds;
      this.status.downtime = 0;
    } else {
      this.status.downtime = elapsedSeconds;
      this.status.uptime = 0;
    }
  }

  /**
   * Get current connectivity status
   */
  getStatus(): ConnectivityStatus {
    this.updateTimers();
    return { ...this.status };
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.status.isConnected;
  }

  /**
   * Get the internal status object (for SyncManager to use)
   */
  getInternalStatus(): ConnectivityStatus {
    return { ...this.status };
  }

  /**
   * Force an immediate connectivity check
   */
  async forceCheck(): Promise<boolean> {
    await this.checkConnectivity();
    return this.status.isConnected;
  }
}
