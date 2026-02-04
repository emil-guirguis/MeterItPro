/**
 * Threading types and interfaces for MCP server threading
 */

export interface ThreadManagerConfig {
  maxRestartAttempts: number;
  restartDelay: number;
  healthCheckInterval: number;
  messageTimeout: number;
}

export interface WorkerMessage {
  type: 'start' | 'stop' | 'status' | 'config' | 'data' | 'ping' | 'restart' | 'health-check' | 'gc' | 'cleanup';
  payload?: any;
  requestId?: string;
  timestamp?: string;
}

export interface WorkerResponse {
  type: 'success' | 'error' | 'status' | 'data' | 'pong' | 'health-status' | 'ready';
  payload?: any;
  requestId?: string;
  error?: string;
  timestamp?: string;
}

export interface ThreadStatus {
  isRunning: boolean;
  startTime: Date | null;
  lastHealthCheck: Date | null;
  restartCount: number;
  errorCount: number;
  memoryUsage?: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
}

export interface PendingMessage {
  message: WorkerMessage;
  resolve: (response: WorkerResponse) => void;
  reject: (error: Error) => void;
  timestamp: Date;
}

/**
 * Message priority levels
 */
export enum MessagePriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

/**
 * Enhanced message with priority and correlation
 */
export interface EnhancedWorkerMessage extends WorkerMessage {
  priority?: MessagePriority;
  correlationId?: string;
  timeout?: number;
  retryCount?: number;
  maxRetries?: number;
}

/**
 * Enhanced response with timing information
 */
export interface EnhancedWorkerResponse extends WorkerResponse {
  correlationId?: string;
  processingTime?: number;
  queueTime?: number;
}