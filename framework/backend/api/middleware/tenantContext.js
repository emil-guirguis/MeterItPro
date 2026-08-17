/**
 * Tenant Context Middleware
 * Extracts tenant_id from JWT token and stores it in request context
 * Ensures tenant_id is available throughout the request lifecycle
 */

const { logger } = require('../../shared/utils/logging');
const {
  logTenantContextEstablished,
  logTenantIsolationViolation
} = require('../utils/tenantIsolationLogging');

/**
 * Extract tenant_id from authenticated request and store in context
 * Must be used after authentication middleware
 * @param {import('../types/request').ExtendedRequest} req - Express request
 * @param {*} res - Express response
 * @param {Function} next - Express next function
 */
function tenantContext(req, res, next) {
  try {
    // Check if request is authenticated
    if (!req.auth || !req.auth.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }

    // Extract tenant_id from user record (support both camelCase and snake_case)
    let tenantId = req.auth.user.tenantId || req.auth.user.tenant_id;
    
    // Convert to string if it's a number
    if (typeof tenantId === 'number') {
      tenantId = String(tenantId);
    }

    // Validate tenant_id format (should be a non-empty string)
    if (typeof tenantId !== 'string' || tenantId.trim() === '') {
      // Check if tenant_id is completely missing vs invalid format
      if (tenantId === undefined || tenantId === null) {
        logger.warn('Missing tenant_id for user:', {
          userId: req.auth.user.users_id,
          email: req.auth.user.email,
          timestamp: new Date().toISOString()
        });

        // Log tenant isolation violation
        logTenantIsolationViolation({
          violationType: 'MISSING_TENANT_CONTEXT',
          userId: req.auth.user.users_id,
          userTenantId: 'unknown',
          message: 'Missing tenant_id in user record',
          path: req.path,
          method: req.method,
          ip: req.ip,
          additionalContext: {}
        });

        return res.status(401).json({
          success: false,
          error: 'Tenant context not found',
          timestamp: new Date().toISOString()
        });
      }




      return res.status(400).json({
        success: false,
        error: 'Invalid tenant context',
        timestamp: new Date().toISOString()
      });
    }

    // Store tenant context in request
    req.context = {
      ...req.context,
      tenant: {
        id: tenantId
      }
    };


    next();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Tenant context middleware error:', err);

    return res.status(500).json({
      success: false,
      error: 'Tenant context processing failed',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Optional tenant context - attach tenant_id if present, but don't require it
 * Useful for routes that may be called with or without authentication
 * @param {import('../types/request').ExtendedRequest} req - Express request
 * @param {*} res - Express response
 * @param {Function} next - Express next function
 */
function optionalTenantContext(req, res, next) {
  try {
    // Only process if request is authenticated
    if (!req.auth || !req.auth.user) {
      return next();
    }

    // Extract tenant_id from user record (support both camelCase and snake_case)
    let tenantId = req.auth.user.tenantId || req.auth.user.tenant_id;
    
    // Convert to string if it's a number
    if (typeof tenantId === 'number') {
      tenantId = String(tenantId);
    }

    // Only attach if tenant_id exists and is valid
    if (tenantId && typeof tenantId === 'string' && tenantId.trim() !== '') {
      req.context = {
        ...req.context,
        tenant: {
          id: tenantId
        }
      };

      logger.debug('Optional tenant context established:', {
        userId: req.auth.user.users_id,
        tenantId,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.debug('Optional tenant context middleware error:', message);
    // Silently fail for optional tenant context
  }

  next();
}

module.exports = {
  tenantContext,
  optionalTenantContext
};
