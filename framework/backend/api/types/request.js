/**
 * Request-related type definitions
 */

/**
 * Extended Express Request with custom properties
 * @typedef {Object} ExtendedRequest
 * @extends {import('express').Request}
 * @property {import('../../shared/types/common').RequestContext} context - Request context
 * @property {import('../../shared/types/common').AuthContext} [auth] - Authentication context
 * @property {Object} [validatedBody] - Validated request body
 * @property {Object} [validatedQuery] - Validated query parameters
 * @property {Object} [validatedParams] - Validated route parameters
 */

/**
 * Query parameters for list endpoints
 * @typedef {Object} ListQueryParams
 * @property {number} [page=1] - Page number
 * @property {number} [pageSize=10] - Items per page
 * @property {string} [search] - Search query
 * @property {string} [sortBy] - Field to sort by
 * @property {string} [sortOrder='asc'] - Sort order (asc/desc)
 * @property {Object} [filters] - Additional filters
 */

/**
 * Route parameter definition
 * @typedef {Object} RouteParam
 * @property {string} name - Parameter name
 * @property {string} type - Parameter type (string, number, uuid)
 * @property {boolean} [required=true] - Whether parameter is required
 * @property {Function} [validator] - Custom validation function
 */

module.exports = {
  // Export types for JSDoc usage
};
