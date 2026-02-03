/**
 * Enhanced Authentication Routes
 * Includes password management, 2FA, and password reset functionality
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/UserWithSchema');
const { authenticateToken } = require('../middleware/auth');
const PasswordValidator = require('../services/PasswordValidator');
const TokenService = require('../services/TokenService');
const TwoFactorService = require('../services/TwoFactorService');
const AuthLoggingService = require('../services/AuthLoggingService');
const EmailService = require('../services/EmailService');
const db = require('../config/database');
const PermissionsService = require('../services/PermissionsService');

const router = express.Router();

// ===== TOKEN GENERATION UTILITIES =====

/**
 * Generate JWT token
 * @param {number} userId - User ID
 * @param {number} tenant_id - Tenant ID
 * @returns {string} JWT token
 */
const generateToken = (userId, tenant_id) => {
  return jwt.sign({ userId, tenant_id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  });
};

/**
 * Generate temporary 2FA session token
 * @param {number} userId - User ID
 * @param {number} tenant_id - Tenant ID
 * @returns {string} Temporary session token
 */
const generate2FASessionToken = (userId, tenant_id) => {
  return jwt.sign({ userId, tenant_id, is2FASession: true }, process.env.JWT_SECRET, {
    expiresIn: '10m' // 10 minute expiration for 2FA verification
  });
};

// ===== RATE LIMITING UTILITIES =====

/**
 * Check if a user has exceeded failed login attempts
 * @param {number} userId - User ID
 * @returns {Promise<Object>} { isLocked, lockedUntil }
 */
async function checkLoginLockout(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { isLocked: false, lockedUntil: null };
    }

    // @ts-ignore - locked_until is dynamically set by schema initialization
    const lockedUntil = user.locked_until;
    // Check if account is locked
    if (lockedUntil && new Date() < new Date(lockedUntil)) {
      return { isLocked: true, lockedUntil };
    }

    // Reset failed attempts if lockout has expired
    if (lockedUntil && new Date() >= new Date(lockedUntil)) {
      await user.update({
        failed_login_attempts: 0,
        locked_until: null
      });
    }

    return { isLocked: false, lockedUntil: null };
  } catch (error) {
    console.error('Error checking login lockout:', error);
    return { isLocked: false, lockedUntil: null };
  }
}

/**
 * Increment failed login attempts and lock account if needed
 * @param {number} userId - User ID
 * @returns {Promise<Object>} { attempts, isLocked, lockedUntil }
 */
async function incrementFailedLoginAttempts(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { attempts: 0, isLocked: false, lockedUntil: null };
    }

    // @ts-ignore - failed_login_attempts is dynamically set by schema initialization
    const newAttempts = (user.failed_login_attempts || 0) + 1;
    let lockedUntil = null;

    // Lock account after 5 failed attempts for 15 minutes
    if (newAttempts >= 5) {
      lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    }

    await user.update({
      failed_login_attempts: newAttempts,
      locked_until: lockedUntil
    });

    return { attempts: newAttempts, isLocked: !!lockedUntil, lockedUntil };
  } catch (error) {
    console.error('Error incrementing failed login attempts:', error);
    return { attempts: 0, isLocked: false, lockedUntil: null };
  }
}

/**
 * Reset failed login attempts
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
async function resetFailedLoginAttempts(userId) {
  try {
    const user = await User.findById(userId);
    if (user) {
      await user.update({
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: new Date()
      });
    }
  } catch (error) {
    console.error('Error resetting failed login attempts:', error);
  }
}

/**
 * Check if a user has 2FA enabled
 * @param {number} userId - User ID
 * @returns {Promise<Array>} Array of enabled 2FA methods
 */
async function get2FAMethods(userId) {
  try {
    const result = await db.query(
      `SELECT method_type FROM user_2fa_methods 
       WHERE user_id = $1 AND is_enabled = true`,
      [userId]
    );

    return result.rows ? result.rows.map(row => /** @type {any} */ (row).method_type) : [];
  } catch (error) {
    console.error('Error getting 2FA methods:', error);
    return [];
  }
}

/**
 * Check if an email has exceeded the rate limit for password reset requests
 * @param {string} email - Email address
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds (default 1 hour)
 * @returns {Promise<boolean>} True if under limit, false if exceeded
 */
async function checkPasswordResetRateLimit(email, maxRequests = 3, windowMs = 60 * 60 * 1000) {
  try {
    const oneHourAgo = new Date(Date.now() - windowMs);
    
    const result = await db.query(
      `SELECT COUNT(*) as count FROM auth_logs 
       WHERE event_type = 'password_reset_requested' 
       AND (details->>'email') = $1 
       AND created_at > $2`,
      [email, oneHourAgo]
    );

    const count = parseInt(/** @type {any} */ (result.rows[0]).count, 10);
    return count < maxRequests;
  } catch (error) {
    console.error('Error checking rate limit:', error);
    // On error, allow the request to proceed
    return true;
  }
}

// ===== PASSWORD MANAGEMENT =====

/**
 * POST /api/auth/signup
 * Create new tenant and admin user
 */
router.post('/signup', [
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

    // Use a transaction to ensure both tenant and user are created together
    try {
      const result = await db.transaction(async (client) => {
        // Create tenant with company information
        // Generate an API key for the tenant in Node to avoid depending on DB extensions
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
        // Note: Use an explicit INSERT here because the model treats passwordHash as a read-only entity field
        // and BaseModel.create will skip read-only fields (causing passwordhash to be omitted). Insert directly
        // to ensure the required `passwordhash` DB column is set.
        const permissionsValue = (typeof adminPermissionsObj === 'string')
          ? adminPermissionsObj
          : JSON.stringify(adminPermissionsObj || {});

        const createUserResult = await client.query(
          `INSERT INTO users (email, name, passwordhash, role, permissions, active, tenant_id, phone, permissions)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING users_id, email, name, role, tenant_id`,
          [
            user.email,
            user.name,
            passwordHash,
            'admin',
            permissionsValue,
            true,
            tenantId,
            user.phone || null,
            '{"user": {"read": true, "create": true, "delete": true, "update": true}, "meter": {"read": true, "create": true, "delete": true, "update": true}, "device": {"read": true, "create": true, "delete": true, "update": true}, "contact": {"read": true, "create": true, "delete": true, "update": true}, "building": {"read": true, "create": true, "delete": true, "update": true}, "location": {"read": true, "create": true, "delete": true, "update": true}, "settings": {"read": true, "update": true}, "template": {"read": true, "create": true, "delete": true, "update": true}, "equipment": {"read": true, "create": true, "delete": true, "update": true}}'
          ]
        );

        const createdUserRow = createUserResult.rows[0];
        console.log('[SIGNUP] Created user (direct SQL):', createdUserRow.users_id || createdUserRow.users_id);

        // Return a minimal user object compatible with previous expectations
        const createdUser = {
          id: createdUserRow.users_id || createdUserRow.users_id,
          email: createdUserRow.email,
          name: createdUserRow.name,
          role: createdUserRow.role,
          tenant_id: createdUserRow.tenant_id
        };

        return { tenantId, user: createdUser };
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

/**
 * POST /api/auth/login
 * Login with email and password, supporting 2FA
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 10.6
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
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

    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Find user by email (Requirement 9.1)
    const user = await User.findByEmail(email);

    if (!user) {
      // Log failed login attempt
      await AuthLoggingService.logEvent({
        eventType: 'login',
        status: 'failed',
        ipAddress,
        userAgent,
        details: { reason: 'user_not_found', email }
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // @ts-ignore - users_id is dynamically set by schema initialization
    const userId = user.users_id;

    // Check if account is locked (Requirement 9.5)
    const lockoutStatus = await checkLoginLockout(userId);
    if (lockoutStatus.isLocked) {
      await AuthLoggingService.logEvent({
        userId,
        eventType: 'login',
        status: 'failed',
        ipAddress,
        userAgent,
        details: { reason: 'account_locked', locked_until: lockoutStatus.lockedUntil }
      });

      return res.status(401).json({
        success: false,
        message: 'Account is locked. Please try again later.'
      });
    }

    // Verify password (Requirement 9.1)
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Increment failed login attempts
      const failureStatus = await incrementFailedLoginAttempts(userId);

      // Log failed login attempt (Requirement 10.6)
      await AuthLoggingService.logEvent({
        userId,
        eventType: 'login',
        status: 'failed',
        ipAddress,
        userAgent,
        details: { 
          reason: 'invalid_password',
          attempts: failureStatus.attempts,
          is_locked: failureStatus.isLocked
        }
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    // @ts-ignore - active is dynamically set by schema initialization
    if (!user.active) {
      await AuthLoggingService.logEvent({
        userId,
        eventType: 'login',
        status: 'failed',
        ipAddress,
        userAgent,
        details: { reason: 'user_inactive' }
      });

      return res.status(401).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    // Check if 2FA is enabled (Requirement 9.2, 9.3)
    const twoFAMethods = await get2FAMethods(userId);

    if (twoFAMethods && twoFAMethods.length > 0) {
      // 2FA is enabled - generate temporary session and return 2FA challenge (Requirement 9.4)
      // @ts-ignore - tenant_id is dynamically set by schema initialization
      const tempSessionToken = generate2FASessionToken(userId, user.tenant_id);

      // Log login attempt (before 2FA verification)
      await AuthLoggingService.logEvent({
        userId,
        eventType: 'login',
        status: 'pending_2fa',
        ipAddress,
        userAgent,
        details: { 
          reason: '2fa_required',
          methods: twoFAMethods
        }
      });

      return res.json({
        success: true,
        requires_2fa: true,
        session_token: tempSessionToken,
        available_methods: twoFAMethods,
        message: '2FA verification required'
      });
    }

    // 2FA is not enabled - create full session (Requirement 9.5)
    // @ts-ignore - tenant_id is dynamically set by schema initialization
    const token = generateToken(userId, user.tenant_id);

    // Reset failed login attempts on successful login
    await resetFailedLoginAttempts(userId);

    // Log successful login (Requirement 10.6)
    await AuthLoggingService.logEvent({
      userId,
      eventType: 'login',
      status: 'success',
      ipAddress,
      userAgent,
      details: { method: 'password' }
    });

    // Derive permissions from role
    // @ts-ignore - role is dynamically set by schema initialization
    const userRole = (user.role || 'viewer').toLowerCase();
    const permissionsObj = PermissionsService.getPermissionsByRole(userRole);
    let permissions = permissionsObj;

    // @ts-ignore - permissions is dynamically set by schema initialization
    if (user.permissions && typeof user.permissions === 'object' && !Array.isArray(user.permissions)) {
      // @ts-ignore - permissions is dynamically set by schema initialization
      permissions = user.permissions;
    }

    res.json({
      success: true,
      data: {
        user: {
          // @ts-ignore - properties are dynamically set by schema initialization
          users_id: user.users_id,
          // @ts-ignore
          email: user.email,
          // @ts-ignore
          name: user.name,
          // @ts-ignore
          role: user.role,
          permissions: permissions,
          // @ts-ignore
          status: user.active ? 'active' : 'inactive',
          // @ts-ignore
          client: user.tenant_id
        },
        token,
        expiresIn: 60 * 60 // 1 hour
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

/**
 * POST /api/auth/verify-2fa
 * Verify 2FA code and create full session
 * Requirements: 9.6, 9.7, 9.8, 9.9
 */
router.post('/verify-2fa', [
  body('session_token').notEmpty().withMessage('Session token is required'),
  body('code').notEmpty().withMessage('2FA code is required'),
  body('method').isIn(['totp', 'email_otp', 'sms_otp', 'backup_code']).withMessage('Invalid 2FA method')
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

    const { session_token, code, method } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    // Verify session token
    let decoded;
    try {
      decoded = jwt.verify(session_token, process.env.JWT_SECRET);
      if (!decoded.is2FASession) {
        return res.status(401).json({
          success: false,
          message: 'Invalid session token'
        });
      }
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        message: 'Session token expired or invalid'
      });
    }

    const userId = decoded.userId;
    const tenantId = decoded.tenant_id;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let isValid = false;
    let details = { method };

    // Verify 2FA code based on method (Requirement 9.7, 9.8)
    if (method === 'totp') {
      // Get TOTP secret from database
      const result = await db.query(
        `SELECT secret_key FROM user_2fa_methods 
         WHERE user_id = $1 AND method_type = 'totp' AND is_enabled = true`,
        [userId]
      );

      if (result.rows && result.rows.length > 0) {
        const secret = /** @type {any} */ (result.rows[0]).secret_key;
        isValid = TwoFactorService.verifyTOTPCode(secret, code);
      }
    } else if (method === 'email_otp') {
      // Verify email OTP
      const otpResult = await TwoFactorService.verifyEmailOTP(userId, code);
      isValid = otpResult.isValid;
      details.attempts_remaining = otpResult.attemptsRemaining;
      details.is_locked = otpResult.isLocked;
    } else if (method === 'sms_otp') {
      // Verify SMS OTP
      const otpResult = await TwoFactorService.verifySMSOTP(userId, code);
      isValid = otpResult.isValid;
      details.attempts_remaining = otpResult.attemptsRemaining;
      details.is_locked = otpResult.isLocked;
    } else if (method === 'backup_code') {
      // Verify backup code
      isValid = await TwoFactorService.verifyBackupCode(userId, code);
    }

    if (!isValid) {
      // Log failed 2FA verification
      await AuthLoggingService.logEvent({
        userId,
        eventType: 'login',
        status: 'failed',
        ipAddress,
        userAgent,
        details: { reason: 'invalid_2fa_code', ...details }
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid 2FA code',
        details: {
          attempts_remaining: details.attempts_remaining,
          is_locked: details.is_locked
        }
      });
    }

    // Create full session (Requirement 9.6)
    const token = generateToken(userId, tenantId);

    // Reset failed login attempts on successful 2FA verification
    await resetFailedLoginAttempts(userId);

    // Log successful login
    await AuthLoggingService.logEvent({
      userId,
      eventType: 'login',
      status: 'success',
      ipAddress,
      userAgent,
      details: { method: '2fa', verification_method: method }
    });

    // Derive permissions from role
    // @ts-ignore - role is dynamically set by schema initialization
    const userRole = (user.role || 'viewer').toLowerCase();
    const permissionsObj = PermissionsService.getPermissionsByRole(userRole);
    let permissions = permissionsObj;

    // @ts-ignore - permissions is dynamically set by schema initialization
    if (user.permissions && typeof user.permissions === 'object' && !Array.isArray(user.permissions)) {
      // @ts-ignore - permissions is dynamically set by schema initialization
      permissions = user.permissions;
    }

    res.json({
      success: true,
      data: {
        user: {
          // @ts-ignore - properties are dynamically set by schema initialization
          users_id: user.users_id,
          // @ts-ignore
          email: user.email,
          // @ts-ignore
          name: user.name,
          // @ts-ignore
          role: user.role,
          permissions: permissions,
          // @ts-ignore
          status: user.active ? 'active' : 'inactive',
          // @ts-ignore
          client: user.tenant_id
        },
        token,
        expiresIn: 60 * 60 // 1 hour
      }
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: '2FA verification failed',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// ===== PASSWORD MANAGEMENT =====

/**
 * POST /api/auth/change-password
 * Change user's password (requires current password)
 */
router.post('/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').notEmpty().withMessage('New password is required'),
  body('confirmPassword').notEmpty().withMessage('Password confirmation is required')
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

    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    // Verify passwords match
    if (newPassword !== confirmPassword) {
      await AuthLoggingService.logPasswordChange(userId, false, {
        details: { reason: 'passwords_do_not_match' }
      });

      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      await AuthLoggingService.logPasswordChange(userId, false, {
        details: { reason: 'invalid_current_password' }
      });

      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Validate new password
    const validation = PasswordValidator.validate(newPassword, user.email);
    if (!validation.isValid) {
      await AuthLoggingService.logPasswordChange(userId, false, {
        details: { reason: 'invalid_password', errors: validation.errors }
      });

      return res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements',
        errors: validation.errors
      });
    }

    // Check if new password is same as current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      await AuthLoggingService.logPasswordChange(userId, false, {
        details: { reason: 'same_as_current' }
      });

      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Hash new password
    const newPasswordHash = await User.hashPassword(newPassword);

    // Update password
    await user.update({
      passwordHash: newPasswordHash,
      password_changed_at: new Date()
    });

    // Log successful password change
    await AuthLoggingService.logPasswordChange(userId, true);

    res.json({
      success: true,
      message: 'Password changed successfully. Please log in again.'
    });
  } catch (error) {
    console.error('Change password error:', error);
    // @ts-ignore - error is unknown type
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// ===== PASSWORD RESET (FORGOT PASSWORD) =====

/**
 * POST /api/auth/forgot-password
 * Request password reset link (self-service)
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 10.8
 */
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
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

    const { email } = req.body;

    // Check rate limit (3 per hour per email)
    const isUnderLimit = await checkPasswordResetRateLimit(email, 3, 60 * 60 * 1000);
    if (!isUnderLimit) {
      // Don't reveal rate limit to user for security (Requirement 4.5)
      return res.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link'
      });
    }

    // Find user by email (Requirement 4.4)
    const user = await User.findByEmail(email);

    if (user) {
      // Generate reset token with 24-hour expiration (Requirement 4.6)
      const { token, token_hash, expires_at } = TokenService.generateResetToken();

      // Store token in database (Requirement 4.6)
      // @ts-ignore - users_id is dynamically set by schema initialization
      await TokenService.storeResetToken(user.users_id, token_hash, expires_at);

      // Send email with reset link (Requirement 4.7, 4.8)
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
      try {
        // @ts-ignore - email is dynamically set by schema initialization
        const userEmail = user.email;
        await EmailService.sendEmail({
          to: userEmail,
          subject: 'Password Reset Request',
          html: `
            <h2>Password Reset Request</h2>
            <p>You requested a password reset for your account.</p>
            <p><a href="${resetLink}">Click here to reset your password</a></p>
            <p>This link will expire in 24 hours.</p>
            <p>If you did not request this, please ignore this email.</p>
          `
        });
        console.log('[AUTH] Password reset email sent to:', email);
      } catch (emailError) {
        console.error('[AUTH] Failed to send password reset email:', emailError);
        // Don't fail the request, just log the error (Requirement 4.7)
      }

      // Log the request (Requirement 10.6)
      try {
        await AuthLoggingService.logEvent({
          // @ts-ignore - users_id is dynamically set by schema initialization
          userId: user.users_id,
          eventType: 'password_reset_requested',
          status: 'success',
          details: { email }
        });
      } catch (logError) {
        console.error('[AUTH] Failed to log password reset request:', logError);
      }
    }

    // Always return generic message for security (Requirement 4.5)
    res.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    // @ts-ignore - error is unknown type
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password using reset token
 * Requirements: 4.10, 4.11, 4.12, 4.13, 4.14, 4.15
 */
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').notEmpty().withMessage('New password is required'),
  body('confirmPassword').notEmpty().withMessage('Password confirmation is required')
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

    const { token, newPassword, confirmPassword } = req.body;

    // Verify passwords match (Requirement 4.12)
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Find token in database to get user ID (Requirement 4.11)
    const tokenResult = await db.query(
      `SELECT user_id, token_hash, expires_at, is_used 
       FROM password_reset_tokens 
       WHERE expires_at > CURRENT_TIMESTAMP 
       AND is_used = false
       ORDER BY created_at DESC 
       LIMIT 1`
    );

    if (!tokenResult.rows || tokenResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reset link has expired or is invalid'
      });
    }

    // @ts-ignore - rows is array of any
    const tokenRecord = tokenResult.rows[0];
    // @ts-ignore - user_id is dynamically set from database
    const userId = tokenRecord.user_id;

    // Verify token (Requirement 4.11)
    const isTokenValid = await TokenService.validateResetToken(token, userId);
    if (!isTokenValid) {
      await AuthLoggingService.logPasswordReset(userId, false, {
        details: { reason: 'invalid_token' }
      });

      return res.status(400).json({
        success: false,
        message: 'Reset link has expired or is invalid'
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate new password (Requirement 4.13)
    // @ts-ignore - email is dynamically set by schema initialization
    const validation = PasswordValidator.validate(newPassword, user.email);
    if (!validation.isValid) {
      await AuthLoggingService.logPasswordReset(userId, false, {
        details: { reason: 'invalid_password', errors: validation.errors }
      });

      return res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements',
        errors: validation.errors
      });
    }

    // Hash new password (Requirement 4.14)
    const newPasswordHash = await User.hashPassword(newPassword);

    // Update password (Requirement 4.14)
    await user.update({
      passwordHash: newPasswordHash,
      password_changed_at: new Date()
    });

    // Invalidate token (Requirement 4.15)
    await TokenService.invalidateResetToken(userId);

    // Log successful password reset (Requirement 4.15)
    await AuthLoggingService.logPasswordReset(userId, true);

    res.json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    // @ts-ignore - error is unknown type
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// ===== 2FA MANAGEMENT =====

/**
 * POST /api/auth/2fa/setup
 * Setup 2FA method - Generate setup data (TOTP secret + QR code, or phone verification)
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3
 */
router.post('/2fa/setup', authenticateToken, [
  body('method').isIn(['totp', 'email_otp', 'sms_otp']).withMessage('Invalid 2FA method'),
  body('phoneNumber').optional().isMobilePhone('any').withMessage('Invalid phone number')
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

    const { method, phoneNumber } = req.body;
    const userId = req.user.id;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let setupData = {};

    if (method === 'totp') {
      // Generate TOTP secret and QR code (Requirements 5.4, 5.5, 5.6)
      // @ts-ignore - email is dynamically set by schema initialization
      setupData = await TwoFactorService.generateTOTPSecret(user.email);
    } else if (method === 'email_otp') {
      // Email OTP doesn't need setup data (Requirements 6.1, 6.2, 6.3)
      setupData = { 
        message: 'Email OTP will be sent to your email during login',
        method: 'email_otp'
      };
    } else if (method === 'sms_otp') {
      // Validate phone number (Requirements 7.1, 7.2, 7.3)
      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required for SMS OTP'
        });
      }
      setupData = { 
        phone_number: phoneNumber, 
        message: 'SMS OTP will be sent to your phone during login',
        method: 'sms_otp'
      };
    }

    res.json({
      success: true,
      data: setupData
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    // @ts-ignore - error is unknown type
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup 2FA',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

/**
 * POST /api/auth/2fa/verify-setup
 * Verify 2FA setup and enable method
 * Requirements: 5.8, 5.9, 5.10, 5.11, 5.12, 5.13
 */
router.post('/2fa/verify-setup', authenticateToken, [
  body('method').isIn(['totp', 'email_otp', 'sms_otp']).withMessage('Invalid 2FA method'),
  body('code').notEmpty().withMessage('Verification code is required'),
  body('secret').optional(),
  body('phoneNumber').optional()
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

    const { method, code, secret, phoneNumber } = req.body;
    const userId = req.user.id;

    let isValid = false;

    // Validate code based on method (Requirements 5.8, 5.9, 5.10)
    if (method === 'totp') {
      // Verify TOTP code
      if (!secret) {
        return res.status(400).json({
          success: false,
          message: 'TOTP secret is required'
        });
      }
      isValid = TwoFactorService.verifyTOTPCode(secret, code);
    } else if (method === 'email_otp') {
      // Verify email OTP
      const otpResult = await TwoFactorService.verifyEmailOTP(userId, code);
      isValid = otpResult.isValid;
    } else if (method === 'sms_otp') {
      // Verify SMS OTP
      const otpResult = await TwoFactorService.verifySMSOTP(userId, code);
      isValid = otpResult.isValid;
    }

    if (!isValid) {
      await AuthLoggingService.log2FAEnable(userId, method, false, {
        details: { reason: 'invalid_code' }
      });

      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Store 2FA method in database (Requirements 5.11)
    try {
      await db.query(
        `INSERT INTO user_2fa_methods (user_id, method_type, secret_key, phone_number, is_enabled, created_at, updated_at)
         VALUES ($1, $2, $3, $4, true, NOW(), NOW())
         ON CONFLICT (user_id, method_type) DO UPDATE SET
         secret_key = EXCLUDED.secret_key,
         phone_number = EXCLUDED.phone_number,
         is_enabled = true,
         updated_at = NOW()`,
        [userId, method, method === 'totp' ? secret : null, method === 'sms_otp' ? phoneNumber : null]
      );
    } catch (dbError) {
      console.error('Error storing 2FA method:', dbError);
      await AuthLoggingService.log2FAEnable(userId, method, false, {
        details: { reason: 'database_error' }
      });

      return res.status(500).json({
        success: false,
        message: 'Failed to store 2FA method'
      });
    }

    // Generate backup codes for TOTP (Requirements 5.12, 5.13)
    let backupCodes = [];
    if (method === 'totp') {
      backupCodes = TwoFactorService.generateBackupCodes(10);
      try {
        await TwoFactorService.storeBackupCodes(userId, backupCodes);
      } catch (backupError) {
        console.error('Error storing backup codes:', backupError);
        // Don't fail the request, just log the error
      }
    }

    // Log 2FA enable (Requirements 5.11)
    await AuthLoggingService.log2FAEnable(userId, method, true);

    res.json({
      success: true,
      message: '2FA method enabled successfully',
      data: {
        backup_codes: method === 'totp' ? backupCodes.map(bc => bc.code) : undefined
      }
    });
  } catch (error) {
    console.error('2FA verify setup error:', error);
    // @ts-ignore - error is unknown type
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify 2FA setup',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

/**
 * GET /api/auth/2fa/methods
 * Get user's 2FA methods
 * Requirements: 8.1
 */
router.get('/2fa/methods', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all enabled 2FA methods for user (Requirement 8.1)
    const result = await db.query(
      `SELECT method_type, is_enabled, created_at FROM user_2fa_methods
       WHERE user_id = $1 AND is_enabled = true
       ORDER BY created_at DESC`,
      [userId]
    );

    const methods = result.rows ? result.rows.map(row => ({
      type: /** @type {any} */ (row).method_type,
      enabled: /** @type {any} */ (row).is_enabled,
      created_at: /** @type {any} */ (row).created_at
    })) : [];

    res.json({
      success: true,
      data: {
        methods
      }
    });
  } catch (error) {
    console.error('Get 2FA methods error:', error);
    // @ts-ignore - error is unknown type
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: 'Failed to get 2FA methods',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

/**
 * POST /api/auth/2fa/disable
 * Disable 2FA method
 * Requirements: 8.2, 8.3, 8.4
 */
router.post('/2fa/disable', authenticateToken, [
  body('method').isIn(['totp', 'email_otp', 'sms_otp']).withMessage('Invalid 2FA method'),
  body('password').notEmpty().withMessage('Password is required')
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

    const { method, password } = req.body;
    const userId = req.user.id;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password (Requirement 8.3)
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await AuthLoggingService.log2FADisable(userId, method, false, {
        details: { reason: 'invalid_password' }
      });

      return res.status(401).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Disable 2FA method (Requirement 8.2)
    const result = await db.query(
      `UPDATE user_2fa_methods SET is_enabled = false, updated_at = NOW()
       WHERE user_id = $1 AND method_type = $2
       RETURNING method_type`,
      [userId, method]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '2FA method not found'
      });
    }

    // If disabling TOTP, also delete backup codes
    if (method === 'totp') {
      await db.query(
        'DELETE FROM user_2fa_backup_codes WHERE user_id = $1',
        [userId]
      );
    }

    // Log 2FA disable (Requirement 8.4)
    await AuthLoggingService.log2FADisable(userId, method, true);

    res.json({
      success: true,
      message: '2FA method disabled successfully'
    });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    // @ts-ignore - error is unknown type
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: 'Failed to disable 2FA',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

/**
 * POST /api/auth/2fa/regenerate-backup-codes
 * Regenerate backup codes for TOTP
 * Requirements: 8.9
 */
router.post('/2fa/regenerate-backup-codes', authenticateToken, [
  body('password').notEmpty().withMessage('Password is required')
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

    const { password } = req.body;
    const userId = req.user.id;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password (Requirement 8.9)
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Check if user has TOTP enabled
    const totpResult = await db.query(
      `SELECT id FROM user_2fa_methods 
       WHERE user_id = $1 AND method_type = 'totp' AND is_enabled = true`,
      [userId]
    );

    if (!totpResult.rows || totpResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'TOTP 2FA is not enabled for this account'
      });
    }

    // Generate new backup codes (Requirement 8.9)
    const backupCodes = TwoFactorService.generateBackupCodes(10);

    // Invalidate old codes and store new ones (Requirement 8.9)
    try {
      await TwoFactorService.storeBackupCodes(userId, backupCodes);
    } catch (backupError) {
      console.error('Error storing backup codes:', backupError);
      return res.status(500).json({
        success: false,
        message: 'Failed to regenerate backup codes'
      });
    }

    res.json({
      success: true,
      message: 'Backup codes regenerated successfully',
      data: {
        backup_codes: backupCodes.map(bc => bc.code)
      }
    });
  } catch (error) {
    console.error('Regenerate backup codes error:', error);
    // @ts-ignore - error is unknown type
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate backup codes',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

/**
 * GET /api/auth/verify
 * Verify JWT token and return user information
 * Requirements: 10.1
 */
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

module.exports = router;
