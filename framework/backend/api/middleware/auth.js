/**
 * Authentication middleware
 * Handles JWT token validation and user authentication
 */

const jwt = require('jsonwebtoken');
const { logger } = require('../../shared/utils/logging');

/**
 * Verify JWT token and attach user to request
 * @param {import('../types/request').ExtendedRequest} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {Function} next - Express next function
 */
function requireAuth(req, res, next) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret);

    // Extract user data from token
    // Handle both formats: { user: {...} } and flat structure
    const userData = decoded.user || decoded;
    
    // Ensure tenant_id is available at user level
    // Check both decoded.tenant_id and decoded.user.tenant_id
    const tenantId = decoded.user?.tenant_id || decoded.tenant_id;
    
    // Attach auth context to request
    req.auth = {
      user: {
        ...userData,
        // Ensure tenant_id is always available at user level
        tenant_id: tenantId || userData.tenant_id
      },
      token
    };

    // Attach to context as well
    req.context = {
      ...req.context,
      auth: req.auth
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        timestamp: new Date().toISOString()
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Optional authentication - attach user if token present, but don't require it
 * @param {import('../types/request').ExtendedRequest} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {Function} next - Express next function
 */
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret);

    // Extract user data from token
    const userData = decoded.user || decoded;
    
    // Ensure tenant_id is available at user level
    const tenantId = decoded.user?.tenant_id || decoded.tenant_id;

    req.auth = {
      user: {
        ...userData,
        // Ensure tenant_id is always available at user level
        tenant_id: tenantId || userData.tenant_id
      },
      token
    };

    req.context = {
      ...req.context,
      auth: req.auth
    };
  } catch (error) {
    // Silently fail for optional auth
    logger.debug('Optional auth failed:', error.message);
  }

  next();
}

/**
 * Check if user has required permissions
 * @param {Array<string>} requiredPermissions - Required permissions
 * @returns {Function} Express middleware
 */
function requirePermissions(requiredPermissions) {
  return (req, res, next) => {
    if (!req.auth || !req.auth.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }

    const userPermissions = req.auth.user.permissions || [];
    const hasPermission = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        details: [`Required permissions: ${requiredPermissions.join(', ')}`],
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
}

/**
 * Check if user has any of the required roles
 * @param {Array<string>} requiredRoles - Required roles
 * @returns {Function} Express middleware
 */
function requireRoles(requiredRoles) {
  return (req, res, next) => {
    if (!req.auth || !req.auth.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }

    const userRoles = req.auth.user.roles || [];
    const hasRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        details: [`Required roles: ${requiredRoles.join(', ')}`],
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
}

/**
 * Generate JWT token
 * Automatically includes tenant_id from user record if present
 * @param {Object} payload - Token payload
 * @param {Object} [options] - Token options
 * @returns {string} JWT token
 */
function generateToken(payload, options = {}) {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const defaultOptions = {
    expiresIn: '24h',
    ...options
  };

  // Ensure tenant_id is included in the payload if it exists in user data
  let tokenPayload = payload;
  
  // If payload has a user object, ensure tenant_id is included
  if (payload.user && payload.user.tenant_id) {
    tokenPayload = {
      ...payload,
      user: {
        ...payload.user,
        tenant_id: payload.user.tenant_id
      }
    };
  } else if (payload.tenant_id) {
    // If tenant_id is at root level, keep it
    tokenPayload = {
      ...payload,
      tenant_id: payload.tenant_id
    };
  }

  return jwt.sign(tokenPayload, secret, defaultOptions);
}

module.exports = {
  requireAuth,
  optionalAuth,
  requirePermissions,
  requireRoles,
  generateToken
};
