/**
 * Validation middleware
 * Request validation using Joi schemas
 */

const { createValidationMiddleware } = require('../../shared/utils/validation');

/**
 * Create validation middleware from schema
 * This is a re-export of the shared validation utility
 * with API-specific enhancements
 */
const validate = createValidationMiddleware;

/**
 * Validate request body
 * @param {Object} schema - Joi schema
 * @returns {Function} Express middleware
 */
function validateBody(schema) {
  return createValidationMiddleware({ body: schema });
}

/**
 * Validate query parameters
 * @param {Object} schema - Joi schema
 * @returns {Function} Express middleware
 */
function validateQuery(schema) {
  return createValidationMiddleware({ query: schema });
}

/**
 * Validate route parameters
 * @param {Object} schema - Joi schema
 * @returns {Function} Express middleware
 */
function validateParams(schema) {
  return createValidationMiddleware({ params: schema });
}

/**
 * Validate all request parts
 * @param {Object} schemas - Schemas object with body, query, params
 * @returns {Function} Express middleware
 */
function validateAll(schemas) {
  return createValidationMiddleware(schemas);
}

module.exports = {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  validateAll
};
