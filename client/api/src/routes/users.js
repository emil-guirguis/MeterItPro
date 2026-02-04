// @ts-nocheck
const express = require('express');
const User = require('../models/UserWithSchema');
const PermissionsService = require('../services/PermissionsService');
const { requirePermission } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
// Note: authenticateToken is now applied globally in server.js

// Get all users with filtering and pagination
router.get('/', requirePermission('user:read'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      search
    } = req.query;

    // Build where clause for User using framework filter processing
    let where = {};
    if (search) where.name = search; // Assuming search by name
    
    // Use framework method to process filters from query parameters
    const filters = User.processFilters(req.query);
    where = { ...where, ...filters };

    // Build options for findAll
    const options = {
      where,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      tenantId: req.user?.tenantId // Automatic tenant filtering
    };

    // Get users
    const result = await User.findAll(options);

    res.json({
      success: true,
      data: {
        items: result.rows,
        total: result.pagination.total,
        page: parseInt(page),
        pageSize: parseInt(limit),
        totalPages: result.pagination.totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// Get single user by ID
router.get('/:id', requirePermission('user:read'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
});

// Create user
router.post('/', requirePermission('user:create'), async (req, res) => {
  try {
    // CRITICAL: Always set tenant_id from authenticated user
    // This is required for the foreign key constraint on tenant_id
    const tenantId = req.user?.tenant_id || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'User must have a valid tenant_id to create users'
      });
    }
    
    const userData = { 
      ...req.body,
      tenant_id: tenantId
    };
    
    // Auto-generate permissions based on role if not explicitly provided
    if (!userData.permissions || (Array.isArray(userData.permissions) && userData.permissions.length === 0)) {
      const role = userData.role || 'Viewer';
      const permissionsObj = PermissionsService.getPermissionsByRole(role);
      
      // Validate the generated permissions
      if (!PermissionsService.validatePermissionsObject(permissionsObj)) {
        return res.status(500).json({
          success: false,
          message: 'Failed to generate valid permissions for role'
        });
      }
      
      // Store as JSON string
      userData.permissions = JSON.stringify(permissionsObj);
    } else if (typeof userData.permissions === 'object' && !Array.isArray(userData.permissions)) {
      // If permissions is provided as nested object, validate and store as JSON string
      if (!PermissionsService.validatePermissionsObject(userData.permissions)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid permissions object structure'
        });
      }
      userData.permissions = JSON.stringify(userData.permissions);
    }
    
    const user = new User(userData);
    await user.save();
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create user',
      error: error.message,
      detail: error.detail,
      code: error.code
    });
  }
});

// Update user
router.put('/:id', requirePermission('user:update'), asyncHandler(async (req, res) => {
  // Find the user first
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // CRITICAL: Protect tenant_id from being changed
  // Validate that the user belongs to the authenticated user's tenant
  const userTenantId = req.user?.tenant_id || req.user?.tenantId;
  if (user.tenant_id !== userTenantId) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to update this user'
    });
  }

  // Remove password and tenant_id from update data
  // - password: use separate endpoint for password changes
  // - tenant_id: cannot be changed
  const updateData = { ...req.body };
  delete updateData.password;
  delete updateData.tenant_id;
  delete updateData.tenantId;
  
  // Remove read-only fields that shouldn't be updated
  delete updateData.password_reset_token;
  delete updateData.password_reset_expires_at;
  delete updateData.passwordHash;
  delete updateData.createdAt;
  delete updateData.updatedAt;
  delete updateData.lastLogin;
  delete updateData.passwordChangedAt;
  delete updateData.failedLoginAttempts;
  delete updateData.lockedUntil;
  
  // Handle permissions serialization if provided
  if (updateData.permissions !== undefined && updateData.permissions !== null) {
    // Skip empty permissions (don't update if empty)
    if (typeof updateData.permissions === 'object' && !Array.isArray(updateData.permissions)) {
      // If permissions is a nested object, validate and store as JSON string
      if (Object.keys(updateData.permissions).length === 0) {
        // Empty object - skip updating permissions
        delete updateData.permissions;
      } else if (!PermissionsService.validatePermissionsObject(updateData.permissions)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid permissions object structure'
        });
      } else {
        updateData.permissions = JSON.stringify(updateData.permissions);
      }
    } else if (Array.isArray(updateData.permissions)) {
      // If permissions is a flat array
      if (updateData.permissions.length === 0) {
        // Empty array - skip updating permissions
        delete updateData.permissions;
      } else {
        const nestedObj = PermissionsService.toNestedObject(updateData.permissions);
        if (!PermissionsService.validatePermissionsObject(nestedObj)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid permissions array format'
          });
        }
        updateData.permissions = JSON.stringify(nestedObj);
      }
    } else if (typeof updateData.permissions === 'string') {
      // If permissions is already a JSON string, validate it
      try {
        const parsed = JSON.parse(updateData.permissions);
        
        // If it's a flat array, convert to nested object first
        if (Array.isArray(parsed)) {
          const nestedObj = PermissionsService.toNestedObject(parsed);
          if (!PermissionsService.validatePermissionsObject(nestedObj)) {
            return res.status(400).json({
              success: false,
              message: 'Invalid permissions array format'
            });
          }
          updateData.permissions = JSON.stringify(nestedObj);
        } else if (!PermissionsService.validatePermissionsObject(parsed)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid permissions JSON format'
          });
        }
        // Keep as JSON string (already converted if needed)
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Permissions must be valid JSON'
        });
      }
    }
  }
  
  // Update the user using instance method
  try {
    await user.update(updateData);
  } catch (error) {
    console.error('[USER UPDATE] Validation error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message,
        details: error.details || error.invalidFields
      });
    }
    throw error;
  }
  
  res.json({ success: true, data: user });
}));

// Change user password
router.put('/:id/password', requirePermission('user:update'), async (req, res) => {
  try {
    const { password, currentPassword } = req.body;
    const userId = req.params.id;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If user is changing their own password, verify current password
    if (req.user.id === userId && currentPassword) {
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
    }

    // Update password using the updatePassword method
    await user.updatePassword(password);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

// Admin reset user password
// POST /api/users/:id/reset-password
// Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9
router.post('/:id/reset-password', requirePermission('user:update'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const adminId = req.user?.id;

    // Validate user ID
    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid user ID is required'
      });
    }

    // Get target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Import required services
    const TokenService = require('../services/TokenService');
    const EmailService = require('../services/EmailService');
    const AuthLoggingService = require('../services/AuthLoggingService');

    // Generate reset token with 24-hour expiration (Requirement 3.2, 3.3)
    const { token, token_hash, expires_at } = TokenService.generateResetToken();

    // Store token in database (Requirement 3.2)
    await TokenService.storeResetToken(userId, token_hash, expires_at);

    // Send email with reset link (Requirement 3.5, 3.6, 3.7, 3.8)
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    try {
      // @ts-ignore - email is dynamically set by schema initialization
      await EmailService.sendEmail({
        to: targetUser.email,
        subject: 'Password Reset Request from Administrator',
        html: `
          <h2>Password Reset Request</h2>
          <p>An administrator has requested a password reset for your account.</p>
          <p><a href="${resetLink}">Click here to reset your password</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not request this, please contact your administrator.</p>
        `
      });
      console.log('[AUTH] Admin password reset email sent to:', targetUser.email);
    } catch (emailError) {
      console.error('[AUTH] Failed to send admin password reset email:', emailError);
      // Don't fail the request, just log the error
    }

    // Log the admin password reset event (Requirement 3.9)
    try {
      await AuthLoggingService.logEvent({
        userId,
        eventType: 'password_reset_admin',
        status: 'success',
        details: { 
          admin_id: adminId,
          email: targetUser.email
        }
      });
    } catch (logError) {
      console.error('[AUTH] Failed to log admin password reset:', logError);
    }

    res.json({
      success: true,
      message: 'Password reset link has been sent to the user'
    });
  } catch (error) {
    console.error('Admin reset password error:', error);
    // @ts-ignore - error is unknown type
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: 'Failed to process admin password reset',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// Delete user
router.delete('/:id', requirePermission('user:delete'), async (req, res) => {
  try {
    // Find the user first
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Delete the user using instance method
    await user.delete();
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

module.exports = router;