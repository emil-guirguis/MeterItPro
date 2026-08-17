/**
 * Router-related type definitions
 */

/**
 * Router configuration
 * @typedef {Object} RouterConfig
 * @property {string} basePath - Base path for all routes
 * @property {boolean} [requireAuth=true] - Whether authentication is required by default
 * @property {Array<Function>} [middleware] - Global middleware for all routes
 * @property {Object} [validation] - Default validation schemas
 * @property {Object} [permissions] - Default permission requirements
 */

/**
 * Route definition
 * @typedef {Object} RouteDefinition
 * @property {string} method - HTTP method (GET, POST, PUT, DELETE, PATCH)
 * @property {string} path - Route path
 * @property {Function} handler - Route handler function
 * @property {Array<Function>} [middleware] - Route-specific middleware
 * @property {Object} [validation] - Validation schema
 * @property {boolean} [requireAuth] - Override default auth requirement
 * @property {Array<string>} [permissions] - Required permissions
 * @property {string} [description] - Route description for documentation
 */

/**
 * CRUD route options
 * @typedef {Object} CrudRouteOptions
 * @property {boolean} [list=true] - Enable list/index route
 * @property {boolean} [get=true] - Enable get/show route
 * @property {boolean} [create=true] - Enable create route
 * @property {boolean} [update=true] - Enable update route
 * @property {boolean} [delete=true] - Enable delete route
 * @property {Object} [validation] - Validation schemas for each operation
 * @property {Array<string>} [searchFields] - Fields to search in
 * @property {string} [idParam='id'] - ID parameter name
 */

module.exports = {
  // Export types for JSDoc usage
};
