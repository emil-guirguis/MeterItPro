/**
 * Query Filter Middleware
 * Automatically applies tenant_id filters to all database queries
 * Intercepts SELECT, INSERT, UPDATE, and DELETE queries
 */

const { logger } = require('../../shared/utils/logging');
const { getTenantId } = require('../utils/tenantUtils');
const {
  logQueryExecutionFailure,
  logQueryFilterApplication,
  logAuditTrail
} = require('../utils/tenantIsolationLogging');

/**
 * Query filter middleware
 * Intercepts database queries and applies tenant_id filters
 * Must be used after tenant context middleware
 * @param {import('../types/request').ExtendedRequest} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {Function} next - Express next function
 */
function queryFilter(req, res, next) {
  try {
    // Get tenant ID from request context
    const tenantId = getTenantId(req);

    // If no tenant context, reject the request
    if (!tenantId) {
      logger.warn('Query filter middleware: No tenant context found', {
        userId: req.auth?.user?.users_id,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });

      // Log query execution failure
      logQueryExecutionFailure({
        userId: req.auth?.user?.users_id,
        query: 'unknown',
        operation: 'UNKNOWN',
        path: req.path,
        method: req.method,
        ip: req.ip,
        reason: 'missing_tenant_context'
      });

      // Log audit trail for denied query
      logAuditTrail({
        userId: req.auth?.user?.users_id,
        userTenantId: 'unknown',
        action: 'QUERY_EXECUTION',
        resourceType: 'database',
        resourceId: 'unknown',
        resourceTenantId: 'unknown',
        status: 'DENIED',
        path: req.path,
        method: req.method,
        ip: req.ip,
        additionalContext: {
          reason: 'missing_tenant_context'
        }
      });

      return res.status(401).json({
        success: false,
        error: 'Tenant context required for database operations',
        timestamp: new Date().toISOString()
      });
    }

    // Store tenant ID in request for use in query interception
    req.context = {
      ...req.context,
      tenantId
    };

    // Log successful query filter setup (debug level)
    logger.debug('Query filter middleware initialized:', {
      userId: req.auth?.user?.users_id,
      tenantId,
      timestamp: new Date().toISOString()
    });

    next();
  } catch (error) {
    logger.error('Query filter middleware error:', error);

    // Log query execution failure
    logQueryExecutionFailure({
      userId: req.auth?.user?.users_id,
      query: 'unknown',
      operation: 'UNKNOWN',
      path: req.path,
      method: req.method,
      ip: req.ip,
      reason: 'middleware_error',
      additionalContext: {
        errorMessage: error.message
      }
    });

    return res.status(500).json({
      success: false,
      error: 'Query filter processing failed',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Optional query filter - attach tenant ID if present, but don't require it
 * Useful for routes that may be called with or without authentication
 * @param {import('../types/request').ExtendedRequest} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {Function} next - Express next function
 */
function optionalQueryFilter(req, res, next) {
  try {
    // Get tenant ID from request context
    const tenantId = getTenantId(req);

    // Only attach if tenant ID exists
    if (tenantId) {
      req.context = {
        ...req.context,
        tenantId
      };

      logger.debug('Optional query filter middleware initialized:', {
        userId: req.auth?.user?.users_id,
        tenantId,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.debug('Optional query filter middleware error:', error.message);
    // Silently fail for optional query filter
  }

  next();
}

/**
 * Detect query type from SQL string
 * @param {string} query - SQL query string
 * @returns {string} Query type: 'SELECT', 'INSERT', 'UPDATE', 'DELETE', or 'UNKNOWN'
 */
function detectQueryType(query) {
  if (!query || typeof query !== 'string') {
    return 'UNKNOWN';
  }

  const trimmedQuery = query.trim().toUpperCase();

  if (trimmedQuery.startsWith('SELECT')) {
    return 'SELECT';
  } else if (trimmedQuery.startsWith('INSERT')) {
    return 'INSERT';
  } else if (trimmedQuery.startsWith('UPDATE')) {
    return 'UPDATE';
  } else if (trimmedQuery.startsWith('DELETE')) {
    return 'DELETE';
  }

  return 'UNKNOWN';
}

/**
 * Apply tenant_id filter to SELECT query
 * @param {string} query - SELECT query
 * @param {string} tenantId - Tenant ID
 * @returns {Object} Modified query and parameters
 */
function filterSelectQuery(query, tenantId) {
  // Find the position to insert the filter
  // Look for ORDER BY, GROUP BY, LIMIT, or end of query
  const whereIndex = query.toUpperCase().lastIndexOf('WHERE');
  const groupByIndex = query.toUpperCase().lastIndexOf('GROUP BY');
  const orderByIndex = query.toUpperCase().lastIndexOf('ORDER BY');
  const limitIndex = query.toUpperCase().lastIndexOf('LIMIT');

  // Determine insertion position (before ORDER BY, GROUP BY, or LIMIT)
  let insertPosition = query.length;
  if (limitIndex !== -1) {
    insertPosition = limitIndex;
  } else if (orderByIndex !== -1) {
    insertPosition = orderByIndex;
  } else if (groupByIndex !== -1) {
    insertPosition = groupByIndex;
  }

  if (whereIndex !== -1 && whereIndex < insertPosition) {
    // WHERE clause exists, append with AND
    const beforeInsert = query.substring(0, insertPosition);
    const afterInsert = query.substring(insertPosition);
    const modifiedQuery = `${beforeInsert} AND tenant_id = ? ${afterInsert}`;

    logger.debug('SELECT query filtered with AND:', {
      originalQuery: query,
      modifiedQuery,
      tenantId,
      timestamp: new Date().toISOString()
    });

    return {
      query: modifiedQuery,
      params: [tenantId]
    };
  } else {
    // No WHERE clause, add one
    const beforeInsert = query.substring(0, insertPosition);
    const afterInsert = query.substring(insertPosition);
    const modifiedQuery = `${beforeInsert} WHERE tenant_id = ? ${afterInsert}`;

    logger.debug('SELECT query filtered with WHERE:', {
      originalQuery: query,
      modifiedQuery,
      tenantId,
      timestamp: new Date().toISOString()
    });

    return {
      query: modifiedQuery,
      params: [tenantId]
    };
  }
}

/**
 * Apply tenant_id injection to INSERT query
 * @param {string} query - INSERT query
 * @param {string} tenantId - Tenant ID
 * @returns {Object} Modified query and parameters
 */
function filterInsertQuery(query, tenantId) {
  try {
    // Find the VALUES clause
    const valuesIndex = query.toUpperCase().indexOf('VALUES');

    if (valuesIndex === -1) {
      logger.warn('INSERT query does not contain VALUES clause:', {
        query,
        timestamp: new Date().toISOString()
      });
      throw new Error('Invalid INSERT query: VALUES clause not found');
    }

    // Extract the part before VALUES
    const beforeValues = query.substring(0, valuesIndex);

    // Find the column list (between parentheses after INSERT INTO table_name)
    const columnListMatch = beforeValues.match(/\([^)]+\)/);
    if (!columnListMatch) {
      logger.warn('INSERT query does not contain column list:', {
        query,
        timestamp: new Date().toISOString()
      });
      throw new Error('Invalid INSERT query: column list not found');
    }

    const columnList = columnListMatch[0];
    const beforeColumnList = beforeValues.substring(0, beforeValues.indexOf(columnList));
    const afterColumnList = beforeValues.substring(beforeValues.indexOf(columnList) + columnList.length);

    // Add tenant_id to column list
    const newColumnList = columnList.slice(0, -1) + ', tenant_id)';
    const beforeValuesModified = beforeColumnList + newColumnList + afterColumnList;

    // Find the VALUES part and add tenant_id value
    const valuesClause = query.substring(valuesIndex);
    const valuesMatch = valuesClause.match(/VALUES\s*\([^)]+\)/i);

    if (!valuesMatch) {
      logger.warn('INSERT query VALUES clause format not recognized:', {
        query,
        timestamp: new Date().toISOString()
      });
      throw new Error('Invalid INSERT query: VALUES clause format not recognized');
    }

    const valuesList = valuesMatch[0];
    const newValuesList = valuesList.slice(0, -1) + ', ?)';
    const afterValuesModified = valuesClause.replace(valuesMatch[0], newValuesList);

    const modifiedQuery = beforeValuesModified + afterValuesModified;

    logger.debug('INSERT query filtered with tenant_id injection:', {
      originalQuery: query,
      modifiedQuery,
      tenantId,
      timestamp: new Date().toISOString()
    });

    return {
      query: modifiedQuery,
      params: [tenantId]
    };
  } catch (error) {
    logger.error('Error filtering INSERT query:', error);
    throw error;
  }
}

/**
 * Apply tenant_id filter to UPDATE query
 * @param {string} query - UPDATE query
 * @param {string} tenantId - Tenant ID
 * @returns {Object} Modified query and parameters
 */
function filterUpdateQuery(query, tenantId) {
  // Check if query already has WHERE clause
  const whereIndex = query.toUpperCase().lastIndexOf('WHERE');
  const orderByIndex = query.toUpperCase().lastIndexOf('ORDER BY');
  const limitIndex = query.toUpperCase().lastIndexOf('LIMIT');

  // Find the position to insert the filter
  let insertPosition = query.length;
  if (limitIndex !== -1) {
    insertPosition = limitIndex;
  } else if (orderByIndex !== -1) {
    insertPosition = orderByIndex;
  }

  if (whereIndex !== -1 && whereIndex < insertPosition) {
    // WHERE clause exists, append with AND
    const beforeInsert = query.substring(0, insertPosition);
    const afterInsert = query.substring(insertPosition);
    const modifiedQuery = `${beforeInsert} AND tenant_id = ? ${afterInsert}`;

    logger.debug('UPDATE query filtered with AND:', {
      originalQuery: query,
      modifiedQuery,
      tenantId,
      timestamp: new Date().toISOString()
    });

    return {
      query: modifiedQuery,
      params: [tenantId]
    };
  } else {
    // No WHERE clause, add one
    const beforeInsert = query.substring(0, insertPosition);
    const afterInsert = query.substring(insertPosition);
    const modifiedQuery = `${beforeInsert} WHERE tenant_id = ? ${afterInsert}`;

    logger.debug('UPDATE query filtered with WHERE:', {
      originalQuery: query,
      modifiedQuery,
      tenantId,
      timestamp: new Date().toISOString()
    });

    return {
      query: modifiedQuery,
      params: [tenantId]
    };
  }
}

/**
 * Apply tenant_id filter to DELETE query
 * @param {string} query - DELETE query
 * @param {string} tenantId - Tenant ID
 * @returns {Object} Modified query and parameters
 */
function filterDeleteQuery(query, tenantId) {
  // Check if query already has WHERE clause
  const whereIndex = query.toUpperCase().lastIndexOf('WHERE');
  const orderByIndex = query.toUpperCase().lastIndexOf('ORDER BY');
  const limitIndex = query.toUpperCase().lastIndexOf('LIMIT');

  // Find the position to insert the filter
  let insertPosition = query.length;
  if (limitIndex !== -1) {
    insertPosition = limitIndex;
  } else if (orderByIndex !== -1) {
    insertPosition = orderByIndex;
  }

  if (whereIndex !== -1 && whereIndex < insertPosition) {
    // WHERE clause exists, append with AND
    const beforeInsert = query.substring(0, insertPosition);
    const afterInsert = query.substring(insertPosition);
    const modifiedQuery = `${beforeInsert} AND tenant_id = ? ${afterInsert}`;

    logger.debug('DELETE query filtered with AND:', {
      originalQuery: query,
      modifiedQuery,
      tenantId,
      timestamp: new Date().toISOString()
    });

    return {
      query: modifiedQuery,
      params: [tenantId]
    };
  } else {
    // No WHERE clause, add one
    const beforeInsert = query.substring(0, insertPosition);
    const afterInsert = query.substring(insertPosition);
    const modifiedQuery = `${beforeInsert} WHERE tenant_id = ? ${afterInsert}`;

    logger.debug('DELETE query filtered with WHERE:', {
      originalQuery: query,
      modifiedQuery,
      tenantId,
      timestamp: new Date().toISOString()
    });

    return {
      query: modifiedQuery,
      params: [tenantId]
    };
  }
}

/**
 * Apply tenant_id filter to a query based on its type
 * @param {string} query - SQL query string
 * @param {string} tenantId - Tenant ID
 * @param {Object} context - Request context for logging
 * @returns {Object} Modified query and parameters
 */
function applyTenantFilter(query, tenantId, context = {}) {
  try {
    if (!query || typeof query !== 'string') {
      throw new Error('Query must be a non-empty string');
    }

    if (!tenantId || typeof tenantId !== 'string') {
      throw new Error('Tenant ID must be a non-empty string');
    }

    const queryType = detectQueryType(query);

    let result;
    switch (queryType) {
      case 'SELECT':
        result = filterSelectQuery(query, tenantId);
        break;
      case 'INSERT':
        result = filterInsertQuery(query, tenantId);
        break;
      case 'UPDATE':
        result = filterUpdateQuery(query, tenantId);
        break;
      case 'DELETE':
        result = filterDeleteQuery(query, tenantId);
        break;
      default:
        logger.warn('Unsupported query type detected:', {
          queryType,
          query,
          timestamp: new Date().toISOString()
        });
        throw new Error(`Unsupported query type: ${queryType}`);
    }

    // Log successful query filter application
    logQueryFilterApplication({
      userId: context.userId,
      tenantId,
      operation: queryType,
      table: context.table || 'unknown',
      success: true
    });

    return result;
  } catch (error) {
    logger.error('Error applying tenant filter:', error);

    // Log failed query filter application
    logQueryFilterApplication({
      userId: context.userId,
      tenantId,
      operation: detectQueryType(query),
      table: context.table || 'unknown',
      success: false,
      reason: error.message
    });

    throw error;
  }
}

module.exports = {
  queryFilter,
  optionalQueryFilter,
  detectQueryType,
  filterSelectQuery,
  filterInsertQuery,
  filterUpdateQuery,
  filterDeleteQuery,
  applyTenantFilter
};
