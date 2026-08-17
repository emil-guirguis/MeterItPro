/**
 * Tenant Isolation Logging Utilities
 * 
 * Provides specialized logging for tenant isolation events and violations.
 * Logs cross-tenant access attempts, query execution failures, and audit trails.
 */

const { logWarn, logError, logInfo } = require('../../shared/utils/logging');

/**
 * Log a cross-tenant access attempt
 * Records when a user attempts to access another tenant's data
 * 
 * @param {Object} options - Logging options
 * @param {string} options.userId - ID of the user attempting access
 * @param {string} options.userTenantId - Tenant ID of the user
 * @param {string|number} options.resourceId - ID of the resource being accessed
 * @param {string} options.resourceTenantId - Tenant ID of the resource
 * @param {string} options.resourceType - Type of resource (e.g., 'user', 'meter', 'reading')
 * @param {string} options.operation - Operation attempted (e.g., 'READ', 'UPDATE', 'DELETE')
 * @param {string} options.path - Request path
 * @param {string} options.method - HTTP method
 * @param {string} options.ip - Client IP address
 * @param {Object} options.additionalContext - Additional context to log
 */
function logCrossTenantAccessAttempt(options) {
  const {
    userId,
    userTenantId,
    resourceId,
    resourceTenantId,
    resourceType = 'unknown',
    operation = 'UNKNOWN',
    path = 'unknown',
    method = 'UNKNOWN',
    ip = 'unknown',
    additionalContext = {}
  } = options;

  const context = {
    severity: 'SECURITY_VIOLATION',
    violationType: 'CROSS_TENANT_ACCESS',
    userId,
    userTenantId,
    resourceId,
    resourceTenantId,
    resourceType,
    operation,
    path,
    method,
    ip,
    timestamp: new Date().toISOString(),
    ...additionalContext
  };

  logWarn(
    `SECURITY: Cross-tenant access attempt detected - User ${userId} (tenant ${userTenantId}) attempted to access ${resourceType} ${resourceId} (tenant ${resourceTenantId})`,
    context
  );
}

/**
 * Log a query execution failure due to missing tenant context
 * Records when a query is attempted without valid tenant context
 * 
 * @param {Object} options - Logging options
 * @param {string} options.userId - ID of the user (if available)
 * @param {string} options.query - SQL query that was attempted
 * @param {string} options.operation - Operation type (SELECT, INSERT, UPDATE, DELETE)
 * @param {string} options.path - Request path
 * @param {string} options.method - HTTP method
 * @param {string} options.ip - Client IP address
 * @param {string} options.reason - Reason for failure (e.g., 'missing_tenant_id', 'invalid_tenant_id')
 * @param {Object} options.additionalContext - Additional context to log
 */
function logQueryExecutionFailure(options) {
  const {
    userId = 'unknown',
    query = 'unknown',
    operation = 'UNKNOWN',
    path = 'unknown',
    method = 'UNKNOWN',
    ip = 'unknown',
    reason = 'unknown',
    additionalContext = {}
  } = options;

  const context = {
    severity: 'SECURITY_VIOLATION',
    violationType: 'QUERY_EXECUTION_FAILURE',
    userId,
    operation,
    reason,
    path,
    method,
    ip,
    timestamp: new Date().toISOString(),
    ...additionalContext
  };

  // Don't log the full query in production to avoid exposing sensitive data
  if (process.env.NODE_ENV !== 'production') {
    context.query = query;
  }

  logError(
    `SECURITY: Query execution prevented - ${operation} operation failed due to ${reason}`,
    new Error(`Query execution prevented: ${reason}`),
    context
  );
}

/**
 * Log a tenant isolation violation
 * Generic logging for any tenant isolation violation
 * 
 * @param {Object} options - Logging options
 * @param {string} options.violationType - Type of violation (e.g., 'CROSS_TENANT_ACCESS', 'MISSING_TENANT_CONTEXT')
 * @param {string} options.userId - ID of the user
 * @param {string} options.userTenantId - Tenant ID of the user
 * @param {string} options.message - Violation message
 * @param {string} options.path - Request path
 * @param {string} options.method - HTTP method
 * @param {string} options.ip - Client IP address
 * @param {Object} options.additionalContext - Additional context to log
 */
function logTenantIsolationViolation(options) {
  const {
    violationType = 'UNKNOWN',
    userId = 'unknown',
    userTenantId = 'unknown',
    message = 'Tenant isolation violation detected',
    path = 'unknown',
    method = 'UNKNOWN',
    ip = 'unknown',
    additionalContext = {}
  } = options;

  const context = {
    severity: 'SECURITY_VIOLATION',
    violationType,
    userId,
    userTenantId,
    path,
    method,
    ip,
    timestamp: new Date().toISOString(),
    ...additionalContext
  };

  logWarn(`SECURITY: ${message}`, context);
}

/**
 * Log a successful tenant context establishment
 * Records when tenant context is successfully extracted and established
 * 
 * @param {Object} options - Logging options
 * @param {string} options.userId - ID of the user
 * @param {string} options.tenantId - Tenant ID
 * @param {string} options.path - Request path
 * @param {string} options.method - HTTP method
 * @param {Object} options.additionalContext - Additional context to log
 */
function logTenantContextEstablished(options) {
  const {
    userId,
    tenantId,
    path = 'unknown',
    method = 'UNKNOWN',
    additionalContext = {}
  } = options;

  const context = {
    userId,
    tenantId,
    path,
    method,
    timestamp: new Date().toISOString(),
    ...additionalContext
  };

  logInfo(
    `Tenant context established - User ${userId} authenticated for tenant ${tenantId}`,
    context
  );
}

/**
 * Log a tenant ownership verification
 * Records when tenant ownership is verified or fails
 * 
 * @param {Object} options - Logging options
 * @param {string} options.userId - ID of the user
 * @param {string} options.userTenantId - Tenant ID of the user
 * @param {string|number} options.resourceId - ID of the resource
 * @param {string} options.resourceType - Type of resource
 * @param {boolean} options.isOwned - Whether the resource is owned by the tenant
 * @param {string} options.path - Request path
 * @param {string} options.method - HTTP method
 * @param {Object} options.additionalContext - Additional context to log
 */
function logTenantOwnershipVerification(options) {
  const {
    userId,
    userTenantId,
    resourceId,
    resourceType = 'unknown',
    isOwned,
    path = 'unknown',
    method = 'UNKNOWN',
    additionalContext = {}
  } = options;

  const context = {
    userId,
    userTenantId,
    resourceId,
    resourceType,
    isOwned,
    path,
    method,
    timestamp: new Date().toISOString(),
    ...additionalContext
  };

  if (isOwned) {
    logInfo(
      `Tenant ownership verified - User ${userId} (tenant ${userTenantId}) owns ${resourceType} ${resourceId}`,
      context
    );
  } else {
    logWarn(
      `SECURITY: Tenant ownership verification failed - User ${userId} (tenant ${userTenantId}) does not own ${resourceType} ${resourceId}`,
      context
    );
  }
}

/**
 * Log a query filter application
 * Records when tenant_id filter is applied to a query
 * 
 * @param {Object} options - Logging options
 * @param {string} options.userId - ID of the user
 * @param {string} options.tenantId - Tenant ID
 * @param {string} options.operation - Operation type (SELECT, INSERT, UPDATE, DELETE)
 * @param {string} options.table - Database table name
 * @param {boolean} options.success - Whether filter was applied successfully
 * @param {string} options.reason - Reason if failed
 * @param {Object} options.additionalContext - Additional context to log
 */
function logQueryFilterApplication(options) {
  const {
    userId,
    tenantId,
    operation = 'UNKNOWN',
    table = 'unknown',
    success = true,
    reason = null,
    additionalContext = {}
  } = options;

  const context = {
    userId,
    tenantId,
    operation,
    table,
    success,
    timestamp: new Date().toISOString(),
    ...additionalContext
  };

  if (success) {
    logInfo(
      `Query filter applied - ${operation} on ${table} for tenant ${tenantId}`,
      context
    );
  } else {
    context.reason = reason;
    logError(
      `Query filter application failed - ${operation} on ${table} for tenant ${tenantId}`,
      new Error(`Query filter failed: ${reason}`),
      context
    );
  }
}

/**
 * Log an audit trail entry for tenant isolation
 * Creates a comprehensive audit record for compliance and investigation
 * 
 * @param {Object} options - Logging options
 * @param {string} options.userId - ID of the user
 * @param {string} options.userTenantId - Tenant ID of the user
 * @param {string} options.action - Action performed (e.g., 'CREATE', 'READ', 'UPDATE', 'DELETE')
 * @param {string} options.resourceType - Type of resource affected
 * @param {string|number} options.resourceId - ID of the resource
 * @param {string} options.resourceTenantId - Tenant ID of the resource
 * @param {string} options.status - Status of the action (e.g., 'SUCCESS', 'DENIED', 'FAILED')
 * @param {string} options.path - Request path
 * @param {string} options.method - HTTP method
 * @param {string} options.ip - Client IP address
 * @param {Object} options.additionalContext - Additional context to log
 */
function logAuditTrail(options) {
  const {
    userId,
    userTenantId,
    action = 'UNKNOWN',
    resourceType = 'unknown',
    resourceId = 'unknown',
    resourceTenantId = 'unknown',
    status = 'UNKNOWN',
    path = 'unknown',
    method = 'UNKNOWN',
    ip = 'unknown',
    additionalContext = {}
  } = options;

  const context = {
    auditType: 'TENANT_ISOLATION_AUDIT',
    userId,
    userTenantId,
    action,
    resourceType,
    resourceId,
    resourceTenantId,
    status,
    path,
    method,
    ip,
    timestamp: new Date().toISOString(),
    ...additionalContext
  };

  // Determine log level based on status
  if (status === 'DENIED' || status === 'FAILED') {
    logWarn(`AUDIT: ${action} on ${resourceType} ${resourceId} - ${status}`, context);
  } else {
    logInfo(`AUDIT: ${action} on ${resourceType} ${resourceId} - ${status}`, context);
  }
}

module.exports = {
  logCrossTenantAccessAttempt,
  logQueryExecutionFailure,
  logTenantIsolationViolation,
  logTenantContextEstablished,
  logTenantOwnershipVerification,
  logQueryFilterApplication,
  logAuditTrail
};
