/**
 * Response-related type definitions
 */

/**
 * Standard API response structure
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Whether the operation was successful
 * @property {*} [data] - Response data (present on success)
 * @property {string} [message] - Optional success message
 * @property {string} [error] - Error message (present on failure)
 * @property {Array<string>} [details] - Additional error details
 * @property {string} timestamp - ISO timestamp of response
 */

/**
 * Paginated API response structure
 * @typedef {Object} PaginatedApiResponse
 * @property {boolean} success - Whether the operation was successful
 * @property {Array} data - Array of items
 * @property {Object} pagination - Pagination metadata
 * @property {number} pagination.page - Current page number
 * @property {number} pagination.pageSize - Items per page
 * @property {number} pagination.total - Total number of items
 * @property {number} pagination.totalPages - Total number of pages
 * @property {boolean} pagination.hasMore - Whether there are more pages
 * @property {string} timestamp - ISO timestamp of response
 */

/**
 * Error response structure
 * @typedef {Object} ErrorResponse
 * @property {boolean} success - Always false for errors
 * @property {string} error - Error message
 * @property {Array<string>} [details] - Additional error details
 * @property {string} [code] - Error code
 * @property {number} statusCode - HTTP status code
 * @property {string} timestamp - ISO timestamp of response
 */

/**
 * Response formatting options
 * @typedef {Object} ResponseOptions
 * @property {number} [statusCode=200] - HTTP status code
 * @property {string} [message] - Optional message
 * @property {Object} [meta] - Additional metadata
 */

module.exports = {
  // Export types for JSDoc usage
};
