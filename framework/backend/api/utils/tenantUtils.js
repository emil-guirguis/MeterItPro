/**
 * Tenant Utilities
 * Helper functions for accessing and verifying tenant context in route handlers
 */

const { logger } = require('../../shared/utils/logging');
const {
  logCrossTenantAccessAttempt,
  logTenantOwnershipVerification,
  logAuditTrail
} = require('./tenantIsolationLogging');

/**
 * Get the current tenant ID from request context
 * @param {import('../types/request').ExtendedRequest} req - Express request
 * @returns {string|null} Tenant ID or null if not available
 */
function getTenantId(req) {
  try {
    if (!req.context || !req.context.tenant) {
      return null;
    }

    const tenantId = req.context.tenant.id;

    // Validate tenant_id is a non-empty string
    if (typeof tenantId === 'string' && tenantId.trim() !== '') {
      return tenantId;
    }

    return null;
  } catch (error) {
    logger.error('Error in getTenantId:', error);
    return null;
  }
}

/**
 * Get the full tenant context from request
 * @param {import('../types/request').ExtendedRequest} req - Express request
 * @returns {Object|null} Tenant context object or null if not available
 */
function getTenantContext(req) {
  try {
    if (!req.context || !req.context.tenant) {
      return null;
    }

    const tenantId = req.context.tenant.id;

    // Validate tenant_id exists
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
      return null;
    }

    return {
      id: tenantId,
      ...req.context.tenant
    };
  } catch (error) {
    logger.error('Error in getTenantContext:', error);
    return null;
  }
}

/**
 * Verify that a resource belongs to the current tenant
 * @param {import('../types/request').ExtendedRequest} req - Express request
 * @param {string|number} resourceId - Resource ID to verify
 * @param {Object} model - Sequelize model to query
 * @returns {Promise<boolean>} True if resource belongs to tenant, false otherwise
 */
async function verifyTenantOwnership(req, resourceId, model) {
  try {
    const tenantId = getTenantId(req);
    const userId = req.auth?.user?.id;
    const resourceType = model?.name || 'unknown';

    if (!tenantId) {
      logger.warn('verifyTenantOwnership called without valid tenant context');
      return false;
    }

    if (!model) {
      logger.error('verifyTenantOwnership called without model');
      return false;
    }

    // Query for resource with both ID and tenant_id
    const resource = await model.findOne({
      where: {
        id: resourceId,
        tenant_id: tenantId
      }
    });

    const isOwned = resource !== null;

    // Log tenant ownership verification
    logTenantOwnershipVerification({
      userId,
      userTenantId: tenantId,
      resourceId,
      resourceType,
      isOwned,
      path: req.path,
      method: req.method
    });

    if (!isOwned) {
      // Log cross-tenant access attempt
      logCrossTenantAccessAttempt({
        userId,
        userTenantId: tenantId,
        resourceId,
        resourceTenantId: 'unknown',
        resourceType,
        operation: 'VERIFY_OWNERSHIP',
        path: req.path,
        method: req.method,
        ip: req.ip
      });

      // Log audit trail for denied access
      logAuditTrail({
        userId,
        userTenantId: tenantId,
        action: 'VERIFY_OWNERSHIP',
        resourceType,
        resourceId,
        resourceTenantId: 'unknown',
        status: 'DENIED',
        path: req.path,
        method: req.method,
        ip: req.ip
      });
    }

    return isOwned;
  } catch (error) {
    logger.error('Error in verifyTenantOwnership:', error);
    return false;
  }
}

/**
 * Safely inject tenant_id filter into raw SQL queries
 * Handles SELECT, INSERT, UPDATE, and DELETE queries
 * @param {string} query - SQL query string
 * @param {string} tenantId - Tenant ID to inject
 * @returns {Object} Object containing modified query and parameters
 */
function injectTenantFilter(query, tenantId) {
  try {
    if (!query || typeof query !== 'string') {
      throw new Error('Query must be a non-empty string');
    }

    if (!tenantId || typeof tenantId !== 'string') {
      throw new Error('Tenant ID must be a non-empty string');
    }

    const trimmedQuery = query.trim();
    const upperQuery = trimmedQuery.toUpperCase();

    // Detect query type
    if (upperQuery.startsWith('SELECT')) {
      return injectSelectFilter(trimmedQuery, tenantId);
    } else if (upperQuery.startsWith('INSERT')) {
      return injectInsertFilter(trimmedQuery, tenantId);
    } else if (upperQuery.startsWith('UPDATE')) {
      return injectUpdateFilter(trimmedQuery, tenantId);
    } else if (upperQuery.startsWith('DELETE')) {
      return injectDeleteFilter(trimmedQuery, tenantId);
    } else {
      throw new Error('Unsupported query type. Only SELECT, INSERT, UPDATE, DELETE are supported');
    }
  } catch (error) {
    logger.error('Error in injectTenantFilter:', error);
    throw error;
  }
}

/**
 * Inject tenant_id filter into SELECT query
 * @private
 * @param {string} query - SELECT query
 * @param {string} tenantId - Tenant ID
 * @returns {Object} Modified query and parameters
 */
function injectSelectFilter(query, tenantId) {
  // Check if query already has WHERE clause
  const whereIndex = query.toUpperCase().lastIndexOf('WHERE');
  const groupByIndex = query.toUpperCase().lastIndexOf('GROUP BY');
  const orderByIndex = query.toUpperCase().lastIndexOf('ORDER BY');
  const limitIndex = query.toUpperCase().lastIndexOf('LIMIT');

  // Find the position to insert the filter
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
    return {
      query: modifiedQuery,
      params: [tenantId]
    };
  } else {
    // No WHERE clause, add one
    const beforeInsert = query.substring(0, insertPosition);
    const afterInsert = query.substring(insertPosition);
    const modifiedQuery = `${beforeInsert} WHERE tenant_id = ? ${afterInsert}`;
    return {
      query: modifiedQuery,
      params: [tenantId]
    };
  }
}

/**
 * Inject tenant_id into INSERT query
 * @private
 * @param {string} query - INSERT query
 * @param {string} tenantId - Tenant ID
 * @returns {Object} Modified query and parameters
 */
function injectInsertFilter(query, tenantId) {
  // Find the VALUES clause
  const valuesIndex = query.toUpperCase().indexOf('VALUES');

  if (valuesIndex === -1) {
    throw new Error('Invalid INSERT query: VALUES clause not found');
  }

  // Extract the part before VALUES
  const beforeValues = query.substring(0, valuesIndex);

  // Find the column list (between parentheses after INSERT INTO table_name)
  const columnListMatch = beforeValues.match(/\([^)]+\)/);
  if (!columnListMatch) {
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
    throw new Error('Invalid INSERT query: VALUES clause format not recognized');
  }

  const valuesList = valuesMatch[0];
  const newValuesList = valuesList.slice(0, -1) + ', ?)';
  const afterValuesModified = valuesClause.replace(valuesMatch[0], newValuesList);

  const modifiedQuery = beforeValuesModified + afterValuesModified;

  return {
    query: modifiedQuery,
    params: [tenantId]
  };
}

/**
 * Inject tenant_id filter into UPDATE query
 * @private
 * @param {string} query - UPDATE query
 * @param {string} tenantId - Tenant ID
 * @returns {Object} Modified query and parameters
 */
function injectUpdateFilter(query, tenantId) {
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
    return {
      query: modifiedQuery,
      params: [tenantId]
    };
  } else {
    // No WHERE clause, add one
    const beforeInsert = query.substring(0, insertPosition);
    const afterInsert = query.substring(insertPosition);
    const modifiedQuery = `${beforeInsert} WHERE tenant_id = ? ${afterInsert}`;
    return {
      query: modifiedQuery,
      params: [tenantId]
    };
  }
}

/**
 * Inject tenant_id filter into DELETE query
 * @private
 * @param {string} query - DELETE query
 * @param {string} tenantId - Tenant ID
 * @returns {Object} Modified query and parameters
 */
function injectDeleteFilter(query, tenantId) {
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
    return {
      query: modifiedQuery,
      params: [tenantId]
    };
  } else {
    // No WHERE clause, add one
    const beforeInsert = query.substring(0, insertPosition);
    const afterInsert = query.substring(insertPosition);
    const modifiedQuery = `${beforeInsert} WHERE tenant_id = ? ${afterInsert}`;
    return {
      query: modifiedQuery,
      params: [tenantId]
    };
  }
}

module.exports = {
  getTenantId,
  getTenantContext,
  verifyTenantOwnership,
  injectTenantFilter
};
