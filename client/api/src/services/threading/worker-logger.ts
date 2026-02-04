import winston from 'winston';

/**
 * Create a logger specifically for worker threads
 * This logger is configured to work properly in worker thread context
 */
export function createWorkerLogger(): winston.Logger {
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        const threadId = process.pid; // In worker thread context
        let logMessage = `${timestamp} [WORKER-${threadId}] ${level.toUpperCase()}: ${message}`;
        
        if (Object.keys(meta).length > 0) {
          logMessage += ` ${JSON.stringify(meta)}`;
        }
        
        if (stack) {
          logMessage += `\n${stack}`;
        }
        
        return logMessage;
      })
    ),
    transports: [
      new winston.transports.Console({
        handleExceptions: true,
        handleRejections: true
      })
    ],
    exitOnError: false
  });

  // Add file transport if in production
  if (process.env.NODE_ENV === 'production') {
    logger.add(new winston.transports.File({
      filename: 'logs/worker-error.log',
      level: 'error',
      handleExceptions: true,
      handleRejections: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }));

    logger.add(new winston.transports.File({
      filename: 'logs/worker-combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }));
  }

  return logger;
}