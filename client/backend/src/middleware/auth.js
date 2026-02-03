const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/UserWithSchema');
const db = require('../config/database');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (tokenError) {
      if (tokenError instanceof Error) {
        if (tokenError.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Token expired'
          });
        }
        
        if (tokenError.name === 'JsonWebTokenError') {
          return res.status(401).json({
            success: false,
            message: 'Invalid token'
          });
        }
      }
      throw tokenError;
    }
    
    // Validate that userId exists in token
    if (!decoded.userId) {
      console.error('[AUTH] Token missing userId field');
      return res.status(401).json({
        success: false,
        message: 'Invalid token - missing user ID'
      });
    }
    
    // Query user directly from database to avoid schema initialization overhead
    let user;
    try {
      const result = await db.query(
        `SELECT users_id, name, email, phone, role, active, tenant_id, permissions, passwordhash 
         FROM users WHERE users_id = $1`,
        [decoded.userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token - user not found'
        });
      }
      
      user = result.rows[0];
    } catch (userLookupError) {
      console.error('[AUTH] Error looking up user:', userLookupError);
      const errorMsg = userLookupError instanceof Error ? userLookupError.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: 'Failed to verify user',
        detail: `User lookup failed: ${errorMsg}`
      });
    }

    // Check if user is active (status is a boolean field)
    if (!user.active) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    // Remove password hash before attaching to request
    delete user.passwordhash;
    
    // CRITICAL: Set global tenant context for automatic filtering
    global.currentTenantId = user.tenant_id;
    
    // Derive permissions from role using PermissionsService
    const PermissionsService = require('../services/PermissionsService');
    const userRole = (user.role || 'viewer').toLowerCase();
    const permissionsObj = PermissionsService.getPermissionsByRole(userRole);
    let permissions = PermissionsService.toFlatArray(permissionsObj);
    
    // If user has permissions in database, use those instead
    if (user.permissions && typeof user.permissions === 'object' && !Array.isArray(user.permissions)) {
      try {
        permissions = PermissionsService.toFlatArray(user.permissions);
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'Unknown error';
        console.warn('[AUTH MIDDLEWARE] Failed to convert permissions, using role-based:', errorMsg);
      }
    }
    
    user.permissions = permissions;
    
    req.user = user;
    req.auth = { user: user };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error instanceof Error ? error.message : error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      detail: errorMsg
    });
  }
};

// Check if user has required permission
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admin users bypass permission checks
    if (req.user.role === 'admin') {
      return next();
    }

    const rawPerms = req.user.permissions;
    const perms = Array.isArray(rawPerms)
      ? rawPerms
      : (typeof rawPerms === 'string' ? [rawPerms] : []);

    if (!perms.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRoles = Array.isArray(roles) ? roles : [roles];
    if (!userRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient role permissions'
      });
    }

    next();
  };
};

// API Key hashing utilities
const hashApiKey = async (apiKey) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(apiKey, salt);
};

const verifyApiKey = async (apiKey, hashedApiKey) => {
  return bcrypt.compare(apiKey, hashedApiKey);
};

// Get site ID from API key
const getSiteIdFromApiKey = async (apiKey) => {
  try {
    const result = await db.query(
      'SELECT tenant_id FROM tenant WHERE api_key = $1 AND active = true',
      [apiKey]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    // @ts-ignore - rows is an array of objects with tenant_id property
    return result.rows[0].tenant_id;
  } catch (error) {
    console.error('Error getting site ID from API key:', error);
    return null;
  }
};

// Authenticate Sync server using API key
const authenticateSyncServer = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      console.error('❌ [Auth] No API key provided in X-API-Key header');
      return res.status(401).json({
        success: false,
        message: 'API key required'
      });
    }

    console.log(`🔑 [Auth] Authenticating sync server with API key: ${apiKey.substring(0, 8)}...`);

    // Get tenant ID from API key
    const result = await db.query(
      'SELECT tenant_id FROM tenant WHERE api_key = $1 AND active = true',
      [apiKey]
    );
    
    if (result.rows.length === 0) {
      console.error('❌ [Auth] Invalid API key or tenant not active');
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    // @ts-ignore - rows is an array of objects with tenant_id property
    const tenantId = result.rows[0].tenant_id;
    console.log(`✅ [Auth] Sync server authenticated for tenant ${tenantId}`);

    // Attach tenant ID to request
    req.tenantId = tenantId;
    req.siteId = tenantId; // For backward compatibility
    next();
  } catch (error) {
    console.error('❌ [Auth] Sync authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

module.exports = {
  authenticateToken,
  requirePermission,
  requireRole,
  authenticateSyncServer,
  hashApiKey,
  verifyApiKey,
  getSiteIdFromApiKey
};