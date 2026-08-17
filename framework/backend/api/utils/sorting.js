/**
 * Sorting utilities
 * Helper functions for query sorting
 */

/**
 * Build sort order from query parameters
 * @param {string} [sortBy] - Field to sort by
 * @param {string} [sortOrder='asc'] - Sort order (asc/desc)
 * @param {Object} [options] - Sort options
 * @returns {Array} Sequelize ORDER clause
 */
function buildSortOrder(sortBy, sortOrder = 'asc', options = {}) {
  const {
    allowedFields = [],
    fieldMappings = {},
    defaultSort = [['createdAt', 'DESC']]
  } = options;

  // Return default if no sort specified
  if (!sortBy) {
    return defaultSort;
  }

  // Check if field is allowed
  if (allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
    return defaultSort;
  }

  // Map field name if mapping exists
  const fieldName = fieldMappings[sortBy] || sortBy;

  // Validate sort order
  const order = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  return [[fieldName, order]];
}

/**
 * Parse multiple sort parameters
 * Supports format: ?sort=field1:asc,field2:desc
 * @param {string} sortParam - Sort parameter string
 * @param {Object} [options] - Sort options
 * @returns {Array} Sequelize ORDER clause
 */
function parseMultiSort(sortParam, options = {}) {
  const {
    allowedFields = [],
    fieldMappings = {},
    defaultSort = [['createdAt', 'DESC']]
  } = options;

  if (!sortParam) {
    return defaultSort;
  }

  const sorts = sortParam.split(',').map(s => s.trim());
  const orderClauses = [];

  sorts.forEach(sort => {
    const [field, order = 'asc'] = sort.split(':');
    
    // Check if field is allowed
    if (allowedFields.length > 0 && !allowedFields.includes(field)) {
      return;
    }

    // Map field name
    const fieldName = fieldMappings[field] || field;
    const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    orderClauses.push([fieldName, sortOrder]);
  });

  return orderClauses.length > 0 ? orderClauses : defaultSort;
}

/**
 * Extract sort parameters from request query
 * @param {Object} query - Request query object
 * @param {Object} [options] - Sort options
 * @returns {Array} Sequelize ORDER clause
 */
function extractSortParams(query, options = {}) {
  const { sortBy, sortOrder, sort } = query;

  // Check for multi-sort format first
  if (sort) {
    return parseMultiSort(sort, options);
  }

  // Fall back to single sort
  return buildSortOrder(sortBy, sortOrder, options);
}

/**
 * Validate sort parameters
 * @param {string} sortBy - Field to sort by
 * @param {string} sortOrder - Sort order
 * @param {Array<string>} allowedFields - Allowed sort fields
 * @returns {Object} Validation result
 */
function validateSortParams(sortBy, sortOrder, allowedFields = []) {
  const errors = [];

  if (sortBy && allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
    errors.push(`Invalid sort field: ${sortBy}. Allowed fields: ${allowedFields.join(', ')}`);
  }

  if (sortOrder && !['asc', 'desc'].includes(sortOrder.toLowerCase())) {
    errors.push('Sort order must be "asc" or "desc"');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Build sort order for nested associations
 * @param {string} association - Association name
 * @param {string} field - Field to sort by
 * @param {string} [order='ASC'] - Sort order
 * @returns {Array} Sequelize ORDER clause for associations
 */
function buildAssociationSort(association, field, order = 'ASC') {
  return [[{ model: association }, field, order.toUpperCase()]];
}

/**
 * Combine multiple sort orders
 * @param {Array<Array>} sortOrders - Array of sort order arrays
 * @returns {Array} Combined sort order
 */
function combineSortOrders(...sortOrders) {
  return sortOrders.flat();
}

module.exports = {
  buildSortOrder,
  parseMultiSort,
  extractSortParams,
  validateSortParams,
  buildAssociationSort,
  combineSortOrders
};
