/**
 * Service-related type definitions
 */

/**
 * Service configuration
 * @typedef {Object} ServiceConfig
 * @property {Object} model - Sequelize model
 * @property {Object} [logger] - Logger instance
 * @property {Array<string>} [searchFields] - Fields to search in
 * @property {Object} [defaultIncludes] - Default associations to include
 * @property {Object} [defaultOrder] - Default sort order
 */

/**
 * Service operation result
 * @typedef {Object} ServiceResult
 * @property {boolean} success - Whether operation was successful
 * @property {*} [data] - Result data
 * @property {string} [error] - Error message if failed
 * @property {Object} [meta] - Additional metadata
 */

/**
 * List service result
 * @typedef {Object} ListServiceResult
 * @property {boolean} success - Whether operation was successful
 * @property {Array} data - Array of items
 * @property {Object} pagination - Pagination metadata
 * @property {number} pagination.page - Current page
 * @property {number} pagination.pageSize - Items per page
 * @property {number} pagination.total - Total items
 * @property {number} pagination.totalPages - Total pages
 * @property {boolean} pagination.hasMore - Has more pages
 */

/**
 * Find options for service methods
 * @typedef {Object} ServiceFindOptions
 * @property {Object} [where] - WHERE conditions
 * @property {Array} [include] - Associations to include
 * @property {Array} [order] - Sort order
 * @property {number} [limit] - Limit results
 * @property {number} [offset] - Offset results
 * @property {Array<string>} [attributes] - Attributes to select
 * @property {Object} [transaction] - Database transaction
 */

/**
 * Bulk operation options
 * @typedef {Object} BulkOperationOptions
 * @property {Array<string|number>} ids - Array of IDs
 * @property {Object} [data] - Data for bulk update
 * @property {Object} [transaction] - Database transaction
 * @property {boolean} [validate=true] - Validate before operation
 */

module.exports = {
  // Export types for JSDoc usage
};
