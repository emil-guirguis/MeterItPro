/**
 * Logger Utility for BaseModel
 * 
 * Provides structured logging for database operations and errors.
 * Includes query context for debugging and troubleshooting.
 */

/**
 * Log levels
 */
const LogLevel = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

/**
 * Format log message with timestamp and context
 * 
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 * @returns {string} Formatted log message
 */
function formatLogMessage(level, message, context = {}) {
  const timestamp = new Date().toISOString();
  const contextStr = Object.keys(context).length > 0 
    ? `\n  Context: ${JSON.stringify(context, null, 2)}`
    : '';
  
  return `[${timestamp}] [${level}] ${message}${contextStr}`;
}

/**
 * Log an error with query context
 * 
 * @param {string} message - Error message
 * @param {Error} error - Error object
 * @param {Object} context - Additional context (query, params, model, operation)
 */
function logError(message, error, context = {}) {
  const logContext = {
    ...context,
    errorMessage: error.message,
    errorCode: /** @type {any} */ (error).code || 'UNKNOWN',
    errorStack: error.stack
  };
  
  console.error(formatLogMessage(LogLevel.ERROR, message, logContext));
}

/**
 * Log a warning
 * 
 * @param {string} message - Warning message
 * @param {Object} context - Additional context
 */
function logWarn(message, context = {}) {
  console.warn(formatLogMessage(LogLevel.WARN, message, context));
}

/**
 * Log an info message
 * 
 * @param {string} message - Info message
 * @param {Object} context - Additional context
 */
function logInfo(message, context = {}) {
  console.log(formatLogMessage(LogLevel.INFO, message, context));
}

/**
 * Log a debug message
 * Only logs if DEBUG environment variable is set
 * 
 * @param {string} message - Debug message
 * @param {Object} context - Additional context
 */
function logDebug(message, context = {}) {
  if (process.env.DEBUG) {
    console.log(formatLogMessage(LogLevel.DEBUG, message, context));
  }
}

/**
 * Log a database query for debugging
 * 
 * @param {string} operation - Operation name (create, findById, etc.)
 * @param {string} model - Model name
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 */
function logQuery(operation, model, sql, params = []) {
  // Only log SQL queries if DEBUG_SQL is explicitly enabled
  // This prevents excessive logging in development which slows down requests
  const forceLog = process.env.DEBUG_SQL === 'true';
  
  if (forceLog) {
    console.log(`${operation.toUpperCase()} on ${model} - ${sql}`);
    if (params.length > 0) {
      console.log('Params:', JSON.stringify(params, null, 2));
    } 
  }
}

/**
 * Log a database error with full context
 * 
 * @param {string} operation - Operation name
 * @param {string} model - Model name
 * @param {Error} error - Error object
 * @param {string} sql - SQL query that failed
 * @param {Array} params - Query parameters
 */
function logDatabaseError(operation, model, error, sql = '', params = []) {
  const context = {
    operation,
    model,
    errorCode: /** @type {any} */ (error).code || 'UNKNOWN'
  };
  
  if (sql) {
    context.sql = sql;
    context.params = params;
  }
  
  logError(`Database error during ${operation} on ${model}`, error, context);
}

/**
 * Log a validation error
 * 
 * @param {string} model - Model name
 * @param {string} field - Field name
 * @param {string} message - Validation message
 * @param {*} value - Invalid value
 */
function logValidationError(model, field, message, value = undefined) {
  const context = {
    model,
    field,
    value: value !== undefined ? value : 'undefined'
  };
  
  logWarn(`Validation error: ${message}`, context);
}

module.exports = {
  LogLevel,
  logError,
  logWarn,
  logInfo,
  logDebug,
  logQuery,
  logDatabaseError,
  logValidationError
};
