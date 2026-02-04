/**
 * Enhanced structured logger for worker threads with correlation support
 */

const fs = require('fs');
const path = require('path');

class StructuredLogger {
  constructor(label = 'worker') {
    this.label = label;
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.workerId = process.env.WORKER_ID || `worker_${process.pid}`;
    this.threadId = process.pid || 'unknown';
    this.correlationId = null;
    this.logIdCounter = 0;
    
    // Ensure logs directory exists
    this.logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
    
    this.logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      verbose: 4
    };
  }

  shouldLog(level) {
    return this.logLevels[level] <= this.logLevels[this.logLevel];
  }

  setCorrelationId(correlationId) {
    this.correlationId = correlationId;
  }

  clearCorrelationId() {
    this.correlationId = null;
  }

  generateLogId() {
    return `log_${++this.logIdCounter}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  }

  createLogEntry(level, message, context = 'worker', metadata = {}, error = null) {
    return {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      context,
      correlationId: this.correlationId,
      workerId: this.workerId,
      threadId: this.threadId,
      metadata: metadata || {},
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    };
  }

  formatConsoleMessage(logEntry) {
    let message = `${logEntry.timestamp} [${logEntry.level}] [${logEntry.context}]`;
    
    if (logEntry.correlationId) {
      message += ` [${logEntry.correlationId}]`;
    }
    
    message += ` [W:${logEntry.workerId}] [T:${logEntry.threadId}]: ${logEntry.message}`;
    
    if (Object.keys(logEntry.metadata).length > 0) {
      message += ` ${JSON.stringify(logEntry.metadata)}`;
    }
    
    if (logEntry.error) {
      message += `\nError: ${logEntry.error.name}: ${logEntry.error.message}`;
      if (logEntry.error.stack) {
        message += `\nStack: ${logEntry.error.stack}`;
      }
    }
    
    return message;
  }

  formatJsonMessage(logEntry) {
    return JSON.stringify(logEntry);
  }

  writeToFile(filename, message) {
    try {
      const filePath = path.join(this.logsDir, filename);
      fs.appendFileSync(filePath, message + '\n');
    } catch (error) {
      // Fallback to console if file write fails
      console.error('Failed to write to log file:', error);
    }
  }

  log(level, message, context = 'worker', metadata = {}, error = null) {
    if (!this.shouldLog(level)) return;
    
    const logEntry = this.createLogEntry(level, message, context, metadata, error);
    
    // Console output (formatted)
    const consoleMessage = this.formatConsoleMessage(logEntry);
    
    switch (level) {
      case 'error':
        console.error(consoleMessage);
        break;
      case 'warn':
        console.warn(consoleMessage);
        break;
      default:
        console.log(consoleMessage);
    }
    
    // File output (JSON)
    const jsonMessage = this.formatJsonMessage(logEntry);
    
    if (level === 'error') {
      this.writeToFile('worker-error.log', jsonMessage);
    }
    
    this.writeToFile('worker-combined.log', jsonMessage);
    
    return logEntry;
  }

  error(message, context = 'worker', metadata = {}, error = null) {
    return this.log('error', message, context, metadata, error);
  }

  warn(message, context = 'worker', metadata = {}) {
    return this.log('warn', message, context, metadata);
  }

  info(message, context = 'worker', metadata = {}) {
    return this.log('info', message, context, metadata);
  }

  debug(message, context = 'worker', metadata = {}) {
    return this.log('debug', message, context, metadata);
  }

  verbose(message, context = 'worker', metadata = {}) {
    return this.log('verbose', message, context, metadata);
  }

  // Correlation context methods
  withCorrelation(correlationId, fn) {
    const previousId = this.correlationId;
    this.setCorrelationId(correlationId);
    
    try {
      return fn();
    } finally {
      this.correlationId = previousId;
    }
  }

  async withCorrelationAsync(correlationId, fn) {
    const previousId = this.correlationId;
    this.setCorrelationId(correlationId);
    
    try {
      return await fn();
    } finally {
      this.correlationId = previousId;
    }
  }

  // Performance logging
  time(label, correlationId = null) {
    const startTime = process.hrtime.bigint();
    const logCorrelationId = correlationId || this.correlationId;
    
    this.debug(`Timer started: ${label}`, 'performance', { 
      timerLabel: label,
      correlationId: logCorrelationId 
    });
    
    return {
      end: () => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        
        this.info(`Timer ended: ${label}`, 'performance', { 
          timerLabel: label,
          duration: `${duration.toFixed(2)}ms`,
          correlationId: logCorrelationId 
        });
        
        return duration;
      }
    };
  }
}

function createLogger(label = 'worker') {
  return new StructuredLogger(label);
}

// Legacy compatibility
function createWorkerLogger() {
  return createLogger('worker');
}

module.exports = { 
  createLogger, 
  createWorkerLogger,
  StructuredLogger 
};