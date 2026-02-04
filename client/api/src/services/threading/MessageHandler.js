/**
 * MessageHandler manages bidirectional communication between main thread and worker
 * Handles message serialization, deserialization, and correlation
 */

const { EventEmitter } = require('events');

class MessageHandler extends EventEmitter {
  constructor(messageTimeout = 10000) {
    super();
    this.pendingMessages = new Map();
    this.messageIdCounter = 0;
    this.messageTimeout = messageTimeout;
  }

  /**
   * Send a message and wait for response
   */
  async sendMessage(message, postMessage) {
    return new Promise((resolve, reject) => {
      const requestId = this.generateMessageId();
      const messageWithId = { ...message, requestId };
      
      // For MessagePort, we don't need to serialize - it handles structured cloning
      const messageToSend = messageWithId;
      
      // Store pending message
      const pendingMessage = {
        message: messageWithId,
        resolve,
        reject,
        timestamp: new Date()
      };
      
      this.pendingMessages.set(requestId, pendingMessage);
      
      // Set timeout for message
      const timeoutId = setTimeout(() => {
        if (this.pendingMessages.has(requestId)) {
          this.pendingMessages.delete(requestId);
          reject(new Error(`Message timeout after ${this.messageTimeout}ms`));
        }
      }, this.messageTimeout);
      
      // Override resolve to clear timeout
      const originalResolve = pendingMessage.resolve;
      pendingMessage.resolve = (response) => {
        clearTimeout(timeoutId);
        originalResolve(response);
      };
      
      const originalReject = pendingMessage.reject;
      pendingMessage.reject = (error) => {
        clearTimeout(timeoutId);
        originalReject(error);
      };
      
      // Send message
      try {
        postMessage(messageToSend);
      } catch (error) {
        this.pendingMessages.delete(requestId);
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Handle incoming message from worker
   */
  handleIncomingMessage(data) {
    try {
      // For MessagePort, data is already deserialized
      const response = data;
      
      const { requestId } = response;
      
      if (requestId && this.pendingMessages.has(requestId)) {
        // This is a response to a pending request
        const pendingMessage = this.pendingMessages.get(requestId);
        this.pendingMessages.delete(requestId);
        
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
  sendFireAndForgetMessage(message, postMessage) {
    const messageWithId = { ...message, requestId: this.generateMessageId() };
    
    try {
      postMessage(messageWithId);
    } catch (error) {
      this.emit('messageError', error);
    }
  }

  /**
   * Clear all pending messages (typically called on worker shutdown)
   */
  clearPendingMessages(reason = 'Worker stopped') {
    for (const [id, pendingMessage] of this.pendingMessages) {
      pendingMessage.reject(new Error(reason));
    }
    this.pendingMessages.clear();
  }

  /**
   * Get count of pending messages
   */
  getPendingMessageCount() {
    return this.pendingMessages.size;
  }

  /**
   * Get pending message statistics
   */
  getPendingMessageStats() {
    const count = this.pendingMessages.size;
    
    if (count === 0) {
      return { count: 0, oldestTimestamp: null, averageAge: 0 };
    }
    
    const now = new Date();
    let totalAge = 0;
    let oldestTimestamp = null;
    
    for (const pendingMessage of this.pendingMessages.values()) {
      const age = now.getTime() - pendingMessage.timestamp.getTime();
      totalAge += age;
      
      if (!oldestTimestamp || pendingMessage.timestamp < oldestTimestamp) {
        oldestTimestamp = pendingMessage.timestamp;
      }
    }
    
    return {
      count,
      oldestTimestamp,
      averageAge: totalAge / count
    };
  }

  /**
   * Serialize message for transmission
   */
  serializeMessage(message) {
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
  deserializeMessage(data) {
    try {
      if (typeof data === 'string') {
        return JSON.parse(data);
      }
      // If it's already an object, return as-is
      if (typeof data === 'object' && data !== null) {
        return data;
      }
      throw new Error('Invalid message format');
    } catch (error) {
      throw new Error(`Failed to deserialize message: ${error}`);
    }
  }

  /**
   * Generate unique message ID
   */
  generateMessageId() {
    return `msg_${++this.messageIdCounter}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Cleanup expired messages
   */
  cleanupExpiredMessages() {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [id, pendingMessage] of this.pendingMessages) {
      const age = now.getTime() - pendingMessage.timestamp.getTime();
      
      if (age > this.messageTimeout) {
        this.pendingMessages.delete(id);
        pendingMessage.reject(new Error('Message expired'));
        cleanedCount++;
      }
    }
    
    return cleanedCount;
  }
}

module.exports = { MessageHandler };