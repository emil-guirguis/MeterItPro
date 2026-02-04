/**
 * Tenant Context Middleware
 * 
 * Automatically injects tenant_id into all database operations
 * to ensure proper tenant isolation without manual intervention.
 */

// Store the current tenant context in a thread-local-like storage
const { AsyncLocalStorage } = require('async_hooks');
const tenantStorage = new AsyncLocalStorage();

/**
 * Middleware to set tenant context for the request
 * Must be used after authenticateToken middleware
 */
const setTenantContext = (req, res, next) => {
  try {
    // Check if user is authenticated first
    if (!req.user) {
      console.error('[TENANT CONTEXT] ✗ No authenticated user found - authenticateToken middleware may not have run');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Extract tenant_id from authenticated user
    // The user object should have tenant_id set by authenticateToken middleware
    const tenantId = req.user?.tenant_id;
    
    if (!tenantId) {
      console.error('[TENANT CONTEXT] ✗ No tenant_id found in authenticated user');
      console.error('[TENANT CONTEXT] User object:', {
        id: req.user?.id,
        email: req.user?.email,
        tenant_id: req.user?.tenant_id,
        keys: Object.keys(req.user || {})
      });
      return res.status(401).json({
        success: false,
        message: 'Tenant context required - user has no tenant_id'
      });
    }
    
    // Store tenant context in request object for this request
    req.tenantId = tenantId;
    
    // Also set global context (already done in authenticateToken, but ensure it's set)
    global.currentTenantId = tenantId;
    
    next();
  } catch (error) {
    console.error('[TENANT CONTEXT] Error setting tenant context:', error);
    res.status(500).json({
      success: false,
      message: 'Tenant context error',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get the current tenant ID from context
 * @returns {number|null} Current tenant ID or null if not set
 */
const getCurrentTenantId = () => {
  const context = tenantStorage.getStore();
  return context?.tenantId || null;
};

/**
 * Check if tenant context is available
 * @returns {boolean} True if tenant context is set
 */
const hasTenantContext = () => {
  return getCurrentTenantId() !== null;
};

module.exports = {
  setTenantContext,
  getCurrentTenantId,
  hasTenantContext
};