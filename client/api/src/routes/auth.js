const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/UserWithSchema');
const { authenticateToken } = require('../middleware/auth');
const PermissionsService = require('../services/PermissionsService');

const router = express.Router();

// Generate JWT token
const generateToken = (userId, tenant_id) => {
  return jwt.sign({ userId, tenant_id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  });
};

// Generate refresh token
const generateRefreshToken = (userId, tenant_id) => {
  return jwt.sign({ userId, tenant_id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });
};

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, rememberMe } = req.body;

    // Explicit validation for password field
    if (!password || typeof password !== 'string' || password.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
        errors: [{ field: 'password', message: 'Password is required' }]
      });
    }

    // Find user by email
    console.log('\n' + '='.repeat(120));
    console.log('[AUTH LOGIN] Step 1: Finding user by email:', email);

    // DEBUG: Check database directly
    const db = require('../config/database');
    const dbCheck = await db.query('SELECT users_id, email, name, role, tenant_id, active FROM users WHERE email = $1', [email]);
    console.log('[AUTH LOGIN] DATABASE CHECK - Raw query result:', dbCheck.rows);

    const user = await User.findByEmail(email);

    if (!user) {
      console.log('[AUTH LOGIN] ✗ User not found');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('[AUTH LOGIN] ✓ User found');
    console.log('[AUTH LOGIN] User object keys:', Object.keys(user));
    console.log('[AUTH LOGIN] User object:', {
      // @ts-ignore - properties are dynamically set by schema initialization
      id: user.id,
      // @ts-ignore
      email: user.email,
      // @ts-ignore
      name: user.name,
      // @ts-ignore
      role: user.role,
      // @ts-ignore
      tenant_id: user.tenant_id,
      // @ts-ignore
      active: user.active,
      // @ts-ignore
      passwordHash: user.passwordHash ? '***HASH***' : 'MISSING'
    });

    // Check password
    console.log('[AUTH LOGIN] Step 2: Validating password');
    const isPasswordValid = await user.comparePassword(password);
    console.log('[AUTH LOGIN] Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      // Improved error logging to include user email when password hash is missing
      // @ts-ignore - passwordHash is dynamically set by schema initialization
      if (!user.passwordHash) {
        // @ts-ignore - id is dynamically set by schema initialization
        console.error(`[AUTH LOGIN] ✗ Authentication failed: User ${email} (ID: ${user.id}) has no password hash`);
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    console.log('[AUTH LOGIN] Step 3: Checking if user is active');
    // @ts-ignore - status is dynamically set by schema initialization
    if (!user.active) {
      console.log('[AUTH LOGIN] ✗ User is inactive');
      return res.status(401).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    console.log('[AUTH LOGIN] ✓ User is active');
    console.log('[AUTH LOGIN] Step 4: Preparing token generation');
    // @ts-ignore - properties are dynamically set by schema initialization
    console.log('[AUTH LOGIN] User ID:', user.user_id);
    // @ts-ignore
    console.log('[AUTH LOGIN] User tenant_id:', user.tenant_id);
    // @ts-ignore
    console.log('[AUTH LOGIN] User tenant_id type:', typeof user.tenant_id);
    // @ts-ignore
    console.log('[AUTH LOGIN] User tenant_id is null?', user.tenant_id === null);
    // @ts-ignore
    console.log('[AUTH LOGIN] User tenant_id is undefined?', user.tenant_id === undefined);

    // Update last login - DISABLED due to column name mismatch
    // TODO: Fix lastLogin field mapping to correct database column
    // await user.updateLastLogin();

    // Generate tokens
    // @ts-ignore - properties are dynamically set by schema initialization
    const logMsg = `[AUTH LOGIN] Step 5: userId=${user.id}, tenant_id=${user.tenant_id}`;
    console.log(logMsg);
    
    // @ts-ignore - id and tenant_id are dynamically set by schema initialization
    const token = generateToken(user.id, user.tenant_id);
    // @ts-ignore - id and tenant_id are dynamically set by schema initialization
    const refreshToken = generateRefreshToken(user.id, user.tenant_id);

    console.log('[AUTH LOGIN] Token generated');
    const decoded = jwt.decode(token);
    console.log('[AUTH LOGIN] Decoded token:', decoded);

    // Calculate expiration time
    const expiresIn = rememberMe ? 7 * 24 * 60 * 60 : 60 * 60; // 7 days or 1 hour

    // Get user's tenant information
    let tenant = null;
    try {
      // @ts-ignore - id is dynamically set by schema initialization
      const userId = user.id;
      const tenantResult = await require('../config/database').query(
        'SELECT * FROM tenant WHERE tenant_id = (SELECT tenant_id FROM users WHERE users_id = $1)',
        [userId]
      );
      if (tenantResult.rows.length > 0) {
        // Cast database row to object type
        const tenantRow = /** @type {Record<string, any>} */ (tenantResult.rows[0]);
        tenant = {
          tenant_id: tenantRow.tenant_id,
          name: tenantRow.name,
          url: tenantRow.url,
          street: tenantRow.street,
          street2: tenantRow.street2,
          city: tenantRow.city,
          state: tenantRow.state,
          zip: tenantRow.zip,
          country: tenantRow.country,
          active: tenantRow.active,
          created_at: tenantRow.created_at,
          updated_at: tenantRow.updated_at,
        };
      }
    } catch (err) {
      console.error('Error fetching tenant:', err);
    }

    // Derive permissions from role using PermissionsService
    // @ts-ignore - role is dynamically set by schema initialization
    const userRole = (user.role || 'viewer').toLowerCase();
    const permissionsObj = PermissionsService.getPermissionsByRole(userRole);
    let permissions = permissionsObj;

    // If user has permissions in database, use those instead (keep as nested object)
    // @ts-ignore - permissions is dynamically set by schema initialization
    if (user.permissions && typeof user.permissions === 'object' && !Array.isArray(user.permissions)) {
      // Use nested object format as-is: { module: { action: true } }
      permissions = user.permissions;
    }

    const responseData = {
      success: true,
      data: {
        user: {
          // @ts-ignore - properties are dynamically set by schema initialization
          users_id: user.id,
          // @ts-ignore
          email: user.email,
          // @ts-ignore
          name: user.name,
          // @ts-ignore
          role: user.role,
          permissions: permissions,
          // @ts-ignore
          status: user.active ? 'active' : 'inactive',
          // @ts-ignore - tenant_id is dynamically set by schema initialization
          client: user.tenant_id
        },
        tenant: tenant,
        token,
        refreshToken,
        expiresIn
      }
    };

    console.log('[AUTH DEBUG] Login response:', {
      userId: responseData.data.user.users_id,
      email: responseData.data.user.email,
      client: responseData.data.user.client,
      hasToken: !!responseData.data.token,
      permissionsCount: Object.keys(responseData.data.user.permissions || {}).length,
      permissions: responseData.data.user.permissionss
    });

    res.json(responseData);
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('Login error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Refresh token
router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { refreshToken } = req.body;

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (tokenError) {
      if (tokenError instanceof Error) {
        if (tokenError.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Refresh token expired'
          });
        }
        
        if (tokenError.name === 'JsonWebTokenError') {
          return res.status(401).json({
            success: false,
            message: 'Invalid refresh token'
          });
        }
      }
      throw tokenError;
    }

    // Validate that userId exists in token
    if (!decoded.userId) {
      console.error('[REFRESH] Token missing userId field');
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token - missing user ID'
      });
    }

    // Look up user by decoded.userId
    let user;
    try {
      user = await User.findById(decoded.userId);
    } catch (userLookupError) {
      console.error('[REFRESH] Error looking up user:', userLookupError);
      const errorMsg = userLookupError instanceof Error ? userLookupError.message : 'Unknown error';
      return res.status(500).json({
        success: false,
        message: 'Failed to refresh token',
        detail: `User lookup failed: ${errorMsg}`
      });
    }

    if (!user || !user.active) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens with consistent parameter naming
    // Ensure userId is passed as first parameter, tenant_id as second
    const newToken = generateToken(user.id, user.tenant_id || decoded.tenant_id);
    const newRefreshToken = generateRefreshToken(user.id, user.tenant_id || decoded.tenant_id);

    // Derive permissions from role using PermissionsService
    const userRole = (user.role || 'viewer').toLowerCase();
    const permissionsObj = PermissionsService.getPermissionsByRole(userRole);
    let permissions = permissionsObj;

    // If user has permissions in database, use those instead (keep as nested object)
    if (user.permissions && typeof user.permissions === 'object' && !Array.isArray(user.permissions)) {
      // Use nested object format as-is: { module: { action: true } }
      permissions = user.permissions;
    }

    res.json({
      success: true,
      data: {
        user: {
          users_id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: permissions,
          active: user.active,
          // @ts-ignore - tenant_id is dynamically set by schema initialization
          client: user.tenant_id
        },
        token: newToken,
        refreshToken: newRefreshToken,
        expiresIn: 60 * 60 // 1 hour
      }
    });
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('Refresh token error:', err);
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({
      success: false,
      message: 'Refresh token error',
      detail: process.env.NODE_ENV === 'development' ? errorMsg : undefined
    });
  }
});

// Verify token
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    // Derive permissions from role using PermissionsService
    const userRole = (req.user.role || 'viewer').toLowerCase();
    const permissionsObj = PermissionsService.getPermissionsByRole(userRole);
    let permissions = permissionsObj;

    // If user has permissions in database, use those instead (keep as nested object)
    if (req.user.permissions && typeof req.user.permissions === 'object' && !Array.isArray(req.user.permissions)) {
      // Use nested object format as-is: { module: { action: true } }
      permissions = req.user.permissions;
    }

    // Map user object to include client field and permissions
    // Ensure users_id is set from id field (schema maps users_id to id)
    const userResponse = {
      ...req.user,
      users_id: req.user.id,
      permissions: permissions,
      // @ts-ignore - tenant_id is dynamically set by schema initialization
      client: req.user.tenant_id
    };

    res.json({
      success: true,
      data: {
        user: userResponse
      }
    });
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('Token verification error:', err);
    res.status(500).json({
      success: false,
      message: 'Token verification failed'
    });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a more sophisticated setup, you might want to blacklist the token
    // For now, we'll just return success
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('Logout error:', err);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

router.post('/signup', [
  // Signup - Create new tenant and admin user
  body('user.email').isEmail().normalizeEmail(),
  body('user.password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('user.name').notEmpty().trim().withMessage('Name is required'),
  body('company.name').notEmpty().trim().withMessage('Company name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { company, user, payment } = req.body;
    const db = require('../config/database');

    // Use a transaction to ensure both tenant and user are created together
    try {
      const result = await db.transaction(async (client) => {
        // Create tenant with company information
        const { randomUUID } = require('crypto');
        const apiKey = randomUUID();
        const tenantResult = await client.query(
          `INSERT INTO tenant (name, url, street, street2, city, state, zip, country, active, api_key) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
           RETURNING tenant_id`,
          [
            company.name,
            company.url || null,
            company.street || null,
            company.street2 || null,
            company.city || null,
            company.state || null,
            company.zip || null,
            company.country || 'US',
            true,
            apiKey
          ]
        );

        const tenantId = tenantResult.rows[0].tenant_id;
        console.log('[SIGNUP] Created tenant:', tenantId);

        // Hash password
        const passwordHash = await User.hashPassword(user.password);

        // Get admin permissions from PermissionsService
        const adminPermissionsObj = PermissionsService.getPermissionsByRole('admin');

        // Create admin user with tenant_id
        const newUser = await User.create({
          email: user.email,
          name: user.name,
          passwordHash,
          role: 'admin',
          permissions: adminPermissionsObj,
          active: true,
          tenant_id: tenantId,
          phone: user.phone || null
        });

        console.log('[SIGNUP] Created user:', newUser.id);

        return { tenantId, user: newUser };
      });

      // Log payment information (for future processing)
      console.log('[SIGNUP] Payment method:', payment?.method);
      console.log('[SIGNUP] Plan type:', payment?.planType);

      res.json({
        success: true,
        message: 'Account created successfully',
        data: {
          tenantId: result.tenantId,
          userId: result.user.id
        }
      });
    } catch (err) {
      const error = /** @type {Error} */ (err);
      console.error('[SIGNUP] Transaction error:', error);
      
      // Check for duplicate email
      if (error.message && error.message.includes('duplicate key')) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to create account',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('Signup error:', err);
    res.status(500).json({
      success: false,
      message: 'Signup failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Bootstrap - Create first admin user (only works if no users exist)
router.post('/bootstrap', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 4 }).withMessage('Password must be at least 4 characters'),
  body('name').notEmpty().trim().withMessage('Name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if any users exist
    const existingUsers = await User.findAll({ limit: 1 });
    if (existingUsers && existingUsers.rows && existingUsers.rows.length > 0) {
      return res.status(403).json({
        success: false,
        message: 'Bootstrap is only available when no users exist'
      });
    }

    const { email, password, name } = req.body;

    // Hash password
    const passwordHash = await User.hashPassword(password);

    // Get admin permissions from PermissionsService
    const adminPermissionsObj = PermissionsService.getPermissionsByRole('admin');

    // Create or get default tenant
    const db = require('../config/database');
    let tenantId = null;

    try {
      // Check if a default tenant exists
      const tenantResult = await db.query('SELECT tenant_id FROM tenant LIMIT 1');
      if (tenantResult.rows && tenantResult.rows.length > 0) {
        const tenantRow = /** @type {Record<string, any>} */ (tenantResult.rows[0]);
        tenantId = tenantRow.tenant_id;
        console.log('[BOOTSTRAP] Using existing tenant:', tenantId);
      } else {
        // Create a default tenant
        const { randomUUID } = require('crypto');
        const apiKey = randomUUID();

        const createTenantResult = await db.query(
          'INSERT INTO tenant (name, active, api_key) VALUES ($1, $2, $3) RETURNING tenant_id',
          ['Default Tenant', true, apiKey]
        );
        const createdTenantRow = /** @type {Record<string, any>} */ (createTenantResult.rows[0]);
        tenantId = createdTenantRow.tenant_id;
        console.log('[BOOTSTRAP] Created default tenant:', tenantId);
      }
    } catch (err) {
      const error = /** @type {Error} */ (err);
      console.error('[BOOTSTRAP] Error managing tenant:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create or find tenant',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    // Create admin user with tenant_id
    const user = await User.create({
      email,
      name,
      passwordHash,
      role: 'admin',
      permissions: adminPermissionsObj,
      active: true,
      tenant_id: tenantId
    });

    // Generate tokens
    const token = generateToken(user.id, user.tenant_id);
    const refreshToken = generateRefreshToken(user.id, user.tenant_id);

    res.json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        user: {
          users_id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: adminPermissionsObj,
          status: 'active'
        },
        token,
        refreshToken,
        expiresIn: 60 * 60
      }
    });
  } catch (error) {
    const err = /** @type {Error} */ (error);
    console.error('Bootstrap error:', err);
    res.status(500).json({
      success: false,
      message: 'Bootstrap failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;