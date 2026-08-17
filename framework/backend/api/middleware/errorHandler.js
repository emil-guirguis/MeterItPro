/**
 * Error handling middleware
 * Centralized error handling for API routes
 */

const { logError } = require('../../shared/utils/logging');

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(message, statusCode = 500, details = []) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Not Found error handler
 * Catches 404 errors for undefined routes
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {Function} next - Express next function
 */
function notFoundHandler(req, res, next) {
  const error = new ApiError(
    `Route not found: ${req.method} ${req.path}`,
    404
  );
  next(error);
}

/**
 * Global error handler
 * Catches all errors and formats response
 * @param {Error} err - Error object
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, next) {
  // Log error
  logError(err, {
    method: req.method,
    url: req.url,
    body: req.body,
    query: req.query,
    params: req.params,
    requestId: req.context?.requestId
  });

  // Determine status code
  let statusCode = err.statusCode || 500;
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
  } else if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
  }

  // Format error response
  const errorResponse = {
    success: false,
    error: err.message || 'Internal server error',
    statusCode,
    timestamp: new Date().toISOString()
  };

  // Add details in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = err.details || [];
  } else if (err.details && err.details.length > 0) {
    errorResponse.details = err.details;
  }

  // Add request ID if available
  if (req.context?.requestId) {
    errorResponse.requestId = req.context.requestId;
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create custom error
 * @param {string} message - Error message
 * @param {number} [statusCode=500] - HTTP status code
 * @param {Array<string>} [details] - Additional error details
 * @returns {ApiError}
 */
function createError(message, statusCode = 500, details = []) {
  return new ApiError(message, statusCode, details);
}

module.exports = {
  ApiError,
  notFoundHandler,
  errorHandler,
  asyncHandler,
  createError
};
