import { EventEmitter } from 'events';
import { WorkerMessage, WorkerResponse, PendingMessage } from './types.js';

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

/**
 * Enhanced pending message with additional metadata
 */
export interface EnhancedPendingMessage extends PendingMessage {
  priority: MessagePriority;
  correlationId?: string;
  timeout: number;
  retryCount: number;
  maxRetries: number;
  queuedAt: Date;
  sentAt?: Date;
}

/**
 * Message statistics
 */
export interface MessageStats {
  totalSent: number;
  totalReceived: number;
  totalTimeouts: number;
  totalRetries: number;
  averageResponseTime: number;
  pendingCount: number;
  oldestPendingAge: number;
  messagesByPriority: Record<MessagePriority, number>;
}

/**
 * MessageHandler manages bidirectional communication between main thread and worker
 * Handles message serialization, deserialization, and correlation with advanced features
 */
export class MessageHandler extends EventEmitter {
  private pendingMessages: Map<string, EnhancedPendingMessage> = new Map();
  private messageIdCounter = 0;
  private defaultTimeout: number;
  private messageStats: {
    sent: number;
    received: number;
    timeouts: number;
    retries: number;
    responseTimes: number[];
    messagesByPriority: Record<MessagePriority, number>;
  };

  constructor(messageTimeout: number = 10000) {
    super();
    this.defaultTimeout = messageTimeout;
    this.messageStats = {
      sent: 0,
      received: 0,
      timeouts: 0,
      retries: 0,
      responseTimes: [],
      messagesByPriority: {
        [MessagePriority.LOW]: 0,
        [MessagePriority.NORMAL]: 0,
        [MessagePriority.HIGH]: 0,
        [MessagePriority.CRITICAL]: 0
      }
    };
  }

  /**
   * Send a message and wait for response with enhanced features
   */
  public async sendMessage(
    message: EnhancedWorkerMessage, 
    postMessage: (msg: any) => void
  ): Promise<EnhancedWorkerResponse> {
    const requestId = this.generateMessageId();
    const correlationId = message.correlationId || this.generateCorrelationId();
    const priority = message.priority || MessagePriority.NORMAL;
    const timeout = message.timeout || this.defaultTimeout;
    const maxRetries = message.maxRetries || 0;
    
    const enhancedMessage: EnhancedWorkerMessage = {
      ...message,
      requestId,
      correlationId,
      priority,
      timeout,
      retryCount: message.retryCount || 0,
      maxRetries
    };

    return this.sendMessageWithRetry(enhancedMessage, postMessage, 0);
  }

  /**
   * Send message with retry logic
   */
  private async sendMessageWithRetry(
    message: EnhancedWorkerMessage,
    postMessage: (msg: any) => void,
    currentRetry: number
  ): Promise<EnhancedWorkerResponse> {
    return new Promise((resolve, reject) => {
      const requestId = message.requestId!;
      const queuedAt = new Date();
      
      // Store pending message
      const pendingMessage: EnhancedPendingMessage = {
        message,
        resolve: (response: WorkerResponse) => {
          const enhancedResponse = response as EnhancedWorkerResponse;
          const responseTime = Date.now() - queuedAt.getTime();
          
          // Add timing information
          enhancedResponse.processingTime = responseTime;
          enhancedResponse.queueTime = pendingMessage.sentAt 
            ? pendingMessage.sentAt.getTime() - queuedAt.getTime() 
            : 0;
          
          // Update statistics
          this.messageStats.received++;
          this.messageStats.responseTimes.push(responseTime);
          
          // Keep only last 100 response times for average calculation
          if (this.messageStats.responseTimes.length > 100) {
            this.messageStats.responseTimes = this.messageStats.responseTimes.slice(-100);
          }
          
          resolve(enhancedResponse);
        },
        reject,
        timestamp: queuedAt,
        priority: message.priority!,
        correlationId: message.correlationId,
        timeout: message.timeout!,
        retryCount: currentRetry,
        maxRetries: message.maxRetries!,
        queuedAt,
        sentAt: undefined
      };
      
      this.pendingMessages.set(requestId, pendingMessage);
      
      // Set timeout for message
      const timeoutId = setTimeout(() => {
        if (this.pendingMessages.has(requestId)) {
          this.pendingMessages.delete(requestId);
          this.messageStats.timeouts++;
          
          // Attempt retry if retries are available
          if (currentRetry < message.maxRetries!) {
            this.messageStats.retries++;
            this.emit('messageRetry', {
              requestId,
              correlationId: message.correlationId,
              attempt: currentRetry + 1,
              maxRetries: message.maxRetries
            });
            
            // Retry with exponential backoff
            const retryDelay = Math.min(1000 * Math.pow(2, currentRetry), 10000);
            setTimeout(() => {
              this.sendMessageWithRetry(message, postMessage, currentRetry + 1)
                .then(resolve)
                .catch(reject);
            }, retryDelay);
          } else {
            reject(new Error(`Message timeout after ${message.timeout}ms (${currentRetry + 1} attempts)`));
          }
        }
      }, message.timeout!);
      
      // Override reject to clear timeout
      const originalReject = pendingMessage.reject;
      pendingMessage.reject = (error: Error) => {
        clearTimeout(timeoutId);
        originalReject(error);
      };
      
      // Send message
      try {
        const serializedMessage = this.serializeMessage(message);
        pendingMessage.sentAt = new Date();
        postMessage(serializedMessage);
        
        // Update statistics
        this.messageStats.sent++;
        this.messageStats.messagesByPriority[message.priority!]++;
        
        this.emit('messageSent', {
          requestId,
          correlationId: message.correlationId,
          priority: message.priority,
          type: message.type
        });
      } catch (error) {
        this.pendingMessages.delete(requestId);
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Handle incoming message from worker with enhanced correlation
   */
  public handleIncomingMessage(data: any): void {
    try {
      const response = this.deserializeMessage(data) as EnhancedWorkerResponse;
      
      const { requestId, correlationId } = response;
      
      if (requestId && this.pendingMessages.has(requestId)) {
        // This is a response to a pending request
        const pendingMessage = this.pendingMessages.get(requestId)!;
        this.pendingMessages.delete(requestId);
        
        // Add correlation ID to response if available
        if (correlationId) {
          response.correlationId = correlationId;
        }
        
        this.emit('messageReceived', {
          requestId,
          correlationId,
          type: response.type,
          processingTime: response.processingTime
        });
        
        if (response.type === 'error') {
          pendingMessage.reject(new Error(response.error || 'Unknown worker error'));
        } else {
          pendingMessage.resolve(response);
        }
      } else {
        // This is an unsolicited message (like health updates, events)
        this.emit('unsolicitedMessage', response);
      }
    } catch (error) {
      this.emit('messageError', error);
    }
  }

  /**
   * Send a fire-and-forget message (no response expected)
   */
  public sendFireAndForgetMessage(
    message: EnhancedWorkerMessage, 
    postMessage: (msg: any) => void
  ): void {
    const requestId = this.generateMessageId();
    const correlationId = message.correlationId || this.generateCorrelationId();
    const priority = message.priority || MessagePriority.NORMAL;
    
    const messageWithId: EnhancedWorkerMessage = { 
      ...message, 
      requestId,
      correlationId,
      priority
    };
    
    const serializedMessage = this.serializeMessage(messageWithId);
    
    try {
      postMessage(serializedMessage);
      
      // Update statistics
      this.messageStats.sent++;
      this.messageStats.messagesByPriority[priority]++;
      
      this.emit('fireAndForgetSent', {
        requestId,
        correlationId,
        priority,
        type: message.type
      });
    } catch (error) {
      this.emit('messageError', error);
    }
  }

  /**
   * Send message with specific correlation ID for request tracking
   */
  public async sendCorrelatedMessage(
    message: WorkerMessage,
    correlationId: string,
    postMessage: (msg: any) => void,
    timeout?: number
  ): Promise<EnhancedWorkerResponse> {
    const enhancedMessage: EnhancedWorkerMessage = {
      ...message,
      correlationId,
      timeout: timeout || this.defaultTimeout
    };
    
    return this.sendMessage(enhancedMessage, postMessage);
  }

  /**
   * Send high priority message (processed first)
   */
  public async sendHighPriorityMessage(
    message: WorkerMessage,
    postMessage: (msg: any) => void,
    timeout?: number
  ): Promise<EnhancedWorkerResponse> {
    const enhancedMessage: EnhancedWorkerMessage = {
      ...message,
      priority: MessagePriority.HIGH,
      timeout: timeout || this.defaultTimeout
    };
    
    return this.sendMessage(enhancedMessage, postMessage);
  }

  /**
   * Send critical message with maximum priority and retries
   */
  public async sendCriticalMessage(
    message: WorkerMessage,
    postMessage: (msg: any) => void,
    maxRetries: number = 3
  ): Promise<EnhancedWorkerResponse> {
    const enhancedMessage: EnhancedWorkerMessage = {
      ...message,
      priority: MessagePriority.CRITICAL,
      timeout: this.defaultTimeout * 2, // Double timeout for critical messages
      maxRetries
    };
    
    return this.sendMessage(enhancedMessage, postMessage);
  }

  /**
   * Clear all pending messages (typically called on worker shutdown)
   */
  public clearPendingMessages(reason: string = 'Worker stopped'): void {
    for (const [id, pendingMessage] of this.pendingMessages) {
      pendingMessage.reject(new Error(reason));
    }
    this.pendingMessages.clear();
  }

  /**
   * Get count of pending messages
   */
  public getPendingMessageCount(): number {
    return this.pendingMessages.size;
  }

  /**
   * Get comprehensive message statistics
   */
  public getMessageStats(): MessageStats {
    const pendingCount = this.pendingMessages.size;
    let oldestPendingAge = 0;
    
    if (pendingCount > 0) {
      const now = Date.now();
      const oldestMessage = Array.from(this.pendingMessages.values())
        .reduce((oldest, current) => 
          current.queuedAt < oldest.queuedAt ? current : oldest
        );
      oldestPendingAge = now - oldestMessage.queuedAt.getTime();
    }
    
    const averageResponseTime = this.messageStats.responseTimes.length > 0
      ? this.messageStats.responseTimes.reduce((sum, time) => sum + time, 0) / this.messageStats.responseTimes.length
      : 0;
    
    return {
      totalSent: this.messageStats.sent,
      totalReceived: this.messageStats.received,
      totalTimeouts: this.messageStats.timeouts,
      totalRetries: this.messageStats.retries,
      averageResponseTime,
      pendingCount,
      oldestPendingAge,
      messagesByPriority: { ...this.messageStats.messagesByPriority }
    };
  }

  /**
   * Get pending message statistics (legacy method for compatibility)
   */
  public getPendingMessageStats(): {
    count: number;
    oldestTimestamp: Date | null;
    averageAge: number;
  } {
    const count = this.pendingMessages.size;
    
    if (count === 0) {
      return { count: 0, oldestTimestamp: null, averageAge: 0 };
    }
    
    const now = new Date();
    let totalAge = 0;
    let oldestTimestamp: Date | null = null;
    
    for (const pendingMessage of this.pendingMessages.values()) {
      const age = now.getTime() - pendingMessage.queuedAt.getTime();
      totalAge += age;
      
      if (!oldestTimestamp || pendingMessage.queuedAt < oldestTimestamp) {
        oldestTimestamp = pendingMessage.queuedAt;
      }
    }
    
    return {
      count,
      oldestTimestamp,
      averageAge: totalAge / count
    };
  }

  /**
   * Get messages by correlation ID
   */
  public getMessagesByCorrelationId(correlationId: string): EnhancedPendingMessage[] {
    return Array.from(this.pendingMessages.values())
      .filter(msg => msg.correlationId === correlationId);
  }

  /**
   * Cancel message by request ID
   */
  public cancelMessage(requestId: string, reason: string = 'Cancelled'): boolean {
    const pendingMessage = this.pendingMessages.get(requestId);
    if (pendingMessage) {
      this.pendingMessages.delete(requestId);
      pendingMessage.reject(new Error(reason));
      
      this.emit('messageCancelled', {
        requestId,
        correlationId: pendingMessage.correlationId,
        reason
      });
      
      return true;
    }
    return false;
  }

  /**
   * Cancel all messages with specific correlation ID
   */
  public cancelCorrelatedMessages(correlationId: string, reason: string = 'Cancelled'): number {
    let cancelledCount = 0;
    
    for (const [requestId, pendingMessage] of this.pendingMessages) {
      if (pendingMessage.correlationId === correlationId) {
        this.pendingMessages.delete(requestId);
        pendingMessage.reject(new Error(reason));
        cancelledCount++;
      }
    }
    
    if (cancelledCount > 0) {
      this.emit('correlatedMessagesCancelled', {
        correlationId,
        count: cancelledCount,
        reason
      });
    }
    
    return cancelledCount;
  }

  /**
   * Reset message statistics
   */
  public resetStats(): void {
    this.messageStats = {
      sent: 0,
      received: 0,
      timeouts: 0,
      retries: 0,
      responseTimes: [],
      messagesByPriority: {
        [MessagePriority.LOW]: 0,
        [MessagePriority.NORMAL]: 0,
        [MessagePriority.HIGH]: 0,
        [MessagePriority.CRITICAL]: 0
      }
    };
    
    this.emit('statsReset');
  }

  /**
   * Serialize message for transmission
   */
  private serializeMessage(message: WorkerMessage): string {
    try {
      return JSON.stringify({
        ...message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw new Error(`Failed to serialize message: ${error}`);
    }
  }

  /**
   * Deserialize message from transmission
   */
  private deserializeMessage(data: any): WorkerMessage | WorkerResponse {
    try {
      if (typeof data === 'string') {
        return JSON.parse(data);
      }
      return data;
    } catch (error) {
      throw new Error(`Failed to deserialize message: ${error}`);
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${++this.messageIdCounter}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Generate unique correlation ID for request tracking
   */
  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Cleanup expired messages with enhanced logic
   */
  public cleanupExpiredMessages(): number {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [requestId, pendingMessage] of this.pendingMessages) {
      const age = now.getTime() - pendingMessage.queuedAt.getTime();
      
      if (age > pendingMessage.timeout) {
        this.pendingMessages.delete(requestId);
        pendingMessage.reject(new Error('Message expired'));
        cleanedCount++;
        
        this.emit('messageExpired', {
          requestId,
          correlationId: pendingMessage.correlationId,
          age,
          timeout: pendingMessage.timeout
        });
      }
    }
    
    if (cleanedCount > 0) {
      this.messageStats.timeouts += cleanedCount;
    }
    
    return cleanedCount;
  }

  /**
   * Set default timeout for messages
   */
  public setDefaultTimeout(timeout: number): void {
    this.defaultTimeout = timeout;
    this.emit('defaultTimeoutChanged', timeout);
  }

  /**
   * Get default timeout
   */
  public getDefaultTimeout(): number {
    return this.defaultTimeout;
  }
}