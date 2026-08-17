/**
 * Controller-related type definitions
 */

/**
 * Controller configuration
 * @typedef {Object} ControllerConfig
 * @property {Object} service - Service instance for business logic
 * @property {Object} [logger] - Logger instance
 * @property {Object} [validation] - Validation schemas
 * @property {Array<string>} [searchFields] - Fields to search in
 */

/**
 * Controller method context
 * @typedef {Object} ControllerContext
 * @property {import('./request').ExtendedRequest} req - Express request
 * @property {import('express').Response} res - Express response
 * @property {Function} next - Express next function
 * @property {import('../../shared/types/common').AuthContext} [auth] - Authentication context
 */

/**
 * List operation options
 * @typedef {Object} ListOptions
 * @property {number} [page] - Page number
 * @property {number} [pageSize] - Items per page
 * @property {string} [search] - Search query
 * @property {Object} [filters] - Filter conditions
 * @property {string} [sortBy] - Field to sort by
 * @property {string} [sortOrder] - Sort order
 * @property {Array<string>} [searchFields] - Fields to search in
 */

/**
 * Create operation options
 * @typedef {Object} CreateOptions
 * @property {Object} data - Data to create
 * @property {Object} [auth] - Authentication context
 * @property {Object} [transaction] - Database transaction
 */

/**
 * Update operation options
 * @typedef {Object} UpdateOptions
 * @property {string|number} id - Item ID
 * @property {Object} data - Data to update
 * @property {Object} [auth] - Authentication context
 * @property {Object} [transaction] - Database transaction
 */

/**
 * Delete operation options
 * @typedef {Object} DeleteOptions
 * @property {string|number} id - Item ID
 * @property {Object} [auth] - Authentication context
 * @property {Object} [transaction] - Database transaction
 * @property {boolean} [soft=false] - Soft delete (mark as deleted)
 */

module.exports = {
  // Export types for JSDoc usage
};
