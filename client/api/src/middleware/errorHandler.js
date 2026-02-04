/**
 * Centralized Error Handler Middleware
 * 
 * Wraps route handlers to catch errors and format them consistently
 * Extracts database error details and returns them to the client
 */

/**
 * Wrap a route handler to catch and format errors
 * 
 * @param {Function} handler - Express route handler
 * @returns {Function} Wrapped handler with error handling
 */
function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      handleError(error, req, res);
    }
  };
}

/**
 * Format and send error response
 * 
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function handleError(error, req, res) {
  // Log error with full context
  console.error('\n' + '!'.repeat(100));
  console.error('ERROR HANDLER - Caught Exception');
  console.error('!'.repeat(100));
  console.error('Error message:', error.message);
  console.error('Error name:', error.name);
  console.error('Error code:', error.code);
  console.error('Error detail:', error.detail);
  console.error('Error hint:', error.hint);
  console.error('Error stack:', error.stack);
  console.error('Full error:', JSON.stringify(error, null, 2));
  console.error('!'.repeat(100) + '\n');

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.errors ? Object.values(error.errors).map(e => e.message) : [error.message]
    });
  }

  // Handle foreign key errors
  if (error.name === 'ForeignKeyError' || error.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Foreign key constraint violation',
      error: error.message,
      detail: error.detail,
      code: error.code,
      errorType: 'ForeignKeyError'
    });
  }

  // Handle not null errors
  if (error.name === 'NotNullError' || error.code === '23502') {
    return res.status(400).json({
      success: false,
      message: 'Required field missing',
      error: error.message,
      detail: error.detail,
      code: error.code,
      errorType: 'NotNullError'
    });
  }

  // Handle unique constraint errors
  if (error.code === '23505') {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry',
      error: error.message,
      detail: error.detail,
      code: error.code,
      errorType: 'UniqueConstraintError'
    });
  }

  // Handle undefined column errors
  if (error.code === '42703') {
    return res.status(400).json({
      success: false,
      message: 'Invalid column',
      error: error.message,
      detail: error.detail,
      code: error.code,
      errorType: 'UndefinedColumnError'
    });
  }

  // Handle undefined table errors
  if (error.code === '42P01') {
    return res.status(400).json({
      success: false,
      message: 'Invalid table',
      error: error.message,
      detail: error.detail,
      code: error.code,
      errorType: 'UndefinedTableError'
    });
  }

  // Handle type conversion errors
  if (error.code === '22P02') {
    return res.status(400).json({
      success: false,
      message: 'Invalid data type',
      error: error.message,
      detail: error.detail,
      code: error.code,
      errorType: 'TypeConversionError'
    });
  }

  // Handle check constraint errors
  if (error.code === '23514') {
    return res.status(400).json({
      success: false,
      message: 'Check constraint violation',
      error: error.message,
      detail: error.detail,
      code: error.code,
      errorType: 'CheckConstraintError'
    });
  }

  // Handle connection errors
  if (error.code === '08000' || error.code === '08003' || error.code === '08006') {
    return res.status(503).json({
      success: false,
      message: 'Database connection error',
      error: error.message,
      detail: error.detail,
      code: error.code,
      errorType: 'ConnectionError'
    });
  }

  // Default error response with full details
  res.status(500).json({
    success: false,
    message: 'Failed to process request',
    error: error.message,
    detail: error.detail,
    code: error.code,
    context: error.context,
    hint: error.hint
  });
}

module.exports = {
  asyncHandler,
  handleError
};
