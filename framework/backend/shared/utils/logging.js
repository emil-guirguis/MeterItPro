/**
 * Logging Utilities
 * 
 * Provides structured logging for the API framework
 * Wraps the logger module and provides additional utilities
 */

const {
  logError,
  logWarn,
  logInfo,
  logDebug,
  logQuery,
  logDatabaseError,
  logValidationError
} = require('./logger');

/**
 * Logger object for middleware compatibility
 * Provides methods for different log levels
 */
const logger = {
  error: logError,
  warn: logWarn,
  info: logInfo,
  debug: logDebug,
  query: logQuery,
  databaseError: logDatabaseError,
  validationError: logValidationError
};

/**
 * Generate a unique request ID
 * @returns {string} Unique request ID
 */
function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log a request
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
function logRequest(req, res, next) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  req.context = {
    ...req.context,
    requestId,
    startTime
  };

  res.setHeader('X-Request-ID', requestId);

  // Log request
  logInfo(`${req.method} ${req.path}`, {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logInfo(`${req.method} ${req.path} - ${res.statusCode}`, {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
}

module.exports = {
  logger,
  generateRequestId,
  logRequest,
  logError,
  logWarn,
  logInfo,
  logDebug,
  logQuery,
  logDatabaseError,
  logValidationError
};
