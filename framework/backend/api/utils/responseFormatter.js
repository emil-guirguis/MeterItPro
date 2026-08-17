/**
 * Response formatting utilities
 * Standardized response formatting for API endpoints
 */

/**
 * Format success response
 * @param {*} data - Response data
 * @param {string} [message] - Optional success message
 * @param {Object} [meta] - Additional metadata
 * @returns {import('../types/response').ApiResponse}
 */
function formatSuccess(data, message, meta = {}) {
  return {
    success: true,
    data,
    message,
    ...meta,
    timestamp: new Date().toISOString()
  };
}

/**
 * Format paginated response
 * @param {Array} data - Response data array
 * @param {Object} pagination - Pagination metadata
 * @param {string} [message] - Optional message
 * @returns {import('../types/response').PaginatedApiResponse}
 */
function formatPaginated(data, pagination, message) {
  return {
    success: true,
    data,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: pagination.total,
      totalPages: pagination.totalPages,
      hasMore: pagination.hasMore
    },
    message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Format error response
 * @param {string} error - Error message
 * @param {number} [statusCode=500] - HTTP status code
 * @param {Array<string>} [details] - Additional error details
 * @returns {import('../types/response').ErrorResponse}
 */
function formatError(error, statusCode = 500, details = []) {
  return {
    success: false,
    error,
    statusCode,
    details: details.length > 0 ? details : undefined,
    timestamp: new Date().toISOString()
  };
}

/**
 * Format validation error response
 * @param {Array<string>} errors - Validation error messages
 * @returns {import('../types/response').ErrorResponse}
 */
function formatValidationError(errors) {
  return {
    success: false,
    error: 'Validation failed',
    statusCode: 400,
    details: errors,
    timestamp: new Date().toISOString()
  };
}

/**
 * Format created response
 * @param {*} data - Created resource data
 * @param {string} [message] - Optional success message
 * @returns {import('../types/response').ApiResponse}
 */
function formatCreated(data, message = 'Resource created successfully') {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Format updated response
 * @param {*} data - Updated resource data
 * @param {string} [message] - Optional success message
 * @returns {import('../types/response').ApiResponse}
 */
function formatUpdated(data, message = 'Resource updated successfully') {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Format deleted response
 * @param {string|number} id - Deleted resource ID
 * @param {string} [message] - Optional success message
 * @returns {import('../types/response').ApiResponse}
 */
function formatDeleted(id, message = 'Resource deleted successfully') {
  return {
    success: true,
    data: { id },
    message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Format not found response
 * @param {string} [resource='Resource'] - Resource name
 * @returns {import('../types/response').ErrorResponse}
 */
function formatNotFound(resource = 'Resource') {
  return {
    success: false,
    error: `${resource} not found`,
    statusCode: 404,
    timestamp: new Date().toISOString()
  };
}

/**
 * Format unauthorized response
 * @param {string} [message='Authentication required'] - Error message
 * @returns {import('../types/response').ErrorResponse}
 */
function formatUnauthorized(message = 'Authentication required') {
  return {
    success: false,
    error: message,
    statusCode: 401,
    timestamp: new Date().toISOString()
  };
}

/**
 * Format forbidden response
 * @param {string} [message='Insufficient permissions'] - Error message
 * @returns {import('../types/response').ErrorResponse}
 */
function formatForbidden(message = 'Insufficient permissions') {
  return {
    success: false,
    error: message,
    statusCode: 403,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  formatSuccess,
  formatPaginated,
  formatError,
  formatValidationError,
  formatCreated,
  formatUpdated,
  formatDeleted,
  formatNotFound,
  formatUnauthorized,
  formatForbidden
};
