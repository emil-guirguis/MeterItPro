/**
 * Filtering utilities
 * Helper functions for query filtering
 */

const { Op } = require('sequelize');

/**
 * Build filter conditions from query parameters
 * @param {Object} filters - Filter object
 * @param {Object} [options] - Filter options
 * @returns {Object} Sequelize WHERE conditions
 */
function buildFilters(filters = {}, options = {}) {
  const { allowedFields = [], fieldMappings = {} } = options;
  const where = {};

  Object.entries(filters).forEach(([key, value]) => {
    // Skip if field not allowed
    if (allowedFields.length > 0 && !allowedFields.includes(key)) {
      return;
    }

    // Map field name if mapping exists
    const fieldName = fieldMappings[key] || key;

    // Skip empty values
    if (value === undefined || value === null || value === '') {
      return;
    }

    // Handle array values (IN operator)
    if (Array.isArray(value)) {
      where[fieldName] = { [Op.in]: value };
      return;
    }

    // Handle comma-separated values (IN operator)
    if (typeof value === 'string' && value.includes(',')) {
      where[fieldName] = { [Op.in]: value.split(',').map(v => v.trim()) };
      return;
    }

    // Handle range filters (e.g., min_price, max_price)
    if (key.startsWith('min_')) {
      const field = fieldMappings[key.substring(4)] || key.substring(4);
      where[field] = { ...where[field], [Op.gte]: value };
      return;
    }

    if (key.startsWith('max_')) {
      const field = fieldMappings[key.substring(4)] || key.substring(4);
      where[field] = { ...where[field], [Op.lte]: value };
      return;
    }

    // Handle boolean values
    if (value === 'true' || value === 'false') {
      where[fieldName] = value === 'true';
      return;
    }

    // Default: exact match
    where[fieldName] = value;
  });

  return where;
}

/**
 * Build search conditions
 * @param {string} search - Search query
 * @param {Array<string>} searchFields - Fields to search in
 * @returns {Object} Sequelize WHERE conditions
 */
function buildSearchConditions(search, searchFields = []) {
  if (!search || searchFields.length === 0) {
    return {};
  }

  return {
    [Op.or]: searchFields.map(field => ({
      [field]: {
        [Op.iLike]: `%${search}%`
      }
    }))
  };
}

/**
 * Combine filter and search conditions
 * @param {Object} filters - Filter conditions
 * @param {string} search - Search query
 * @param {Array<string>} searchFields - Fields to search in
 * @returns {Object} Combined WHERE conditions
 */
function combineConditions(filters, search, searchFields) {
  const filterConditions = buildFilters(filters);
  const searchConditions = buildSearchConditions(search, searchFields);

  if (Object.keys(searchConditions).length === 0) {
    return filterConditions;
  }

  return {
    [Op.and]: [
      filterConditions,
      searchConditions
    ]
  };
}

/**
 * Parse filter operators from query string
 * Supports operators like: eq, ne, gt, gte, lt, lte, like, in
 * Example: ?price[gte]=100&price[lte]=500
 * @param {Object} query - Query parameters
 * @returns {Object} Parsed filters with operators
 */
function parseFilterOperators(query) {
  const filters = {};
  const operatorMap = {
    eq: Op.eq,
    ne: Op.ne,
    gt: Op.gt,
    gte: Op.gte,
    lt: Op.lt,
    lte: Op.lte,
    like: Op.like,
    ilike: Op.iLike,
    in: Op.in,
    notIn: Op.notIn,
    between: Op.between
  };

  Object.entries(query).forEach(([key, value]) => {
    // Check for operator syntax: field[operator]
    const match = key.match(/^(.+)\[(.+)\]$/);
    
    if (match) {
      const [, field, operator] = match;
      const op = operatorMap[operator];

      if (op) {
        if (!filters[field]) {
          filters[field] = {};
        }

        // Handle special cases
        if (operator === 'in' || operator === 'notIn') {
          filters[field][op] = Array.isArray(value) ? value : value.split(',');
        } else if (operator === 'between') {
          filters[field][op] = Array.isArray(value) ? value : value.split(',');
        } else {
          filters[field][op] = value;
        }
      }
    } else {
      // No operator, use exact match
      filters[key] = value;
    }
  });

  return filters;
}

/**
 * Sanitize filter values
 * @param {Object} filters - Filter object
 * @returns {Object} Sanitized filters
 */
function sanitizeFilters(filters) {
  const sanitized = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (typeof value === 'string') {
      // Remove potentially dangerous characters
      sanitized[key] = value.replace(/[<>\"'&]/g, '');
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(v =>
        typeof v === 'string' ? v.replace(/[<>\"'&]/g, '') : v
      );
    } else {
      sanitized[key] = value;
    }
  });

  return sanitized;
}

module.exports = {
  buildFilters,
  buildSearchConditions,
  combineConditions,
  parseFilterOperators,
  sanitizeFilters
};
