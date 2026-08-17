/**
 * Authenticated API Example
 * Demonstrates authentication, authorization, and permission handling
 */

const express = require('express');
const { BaseRouter, BaseController, BaseService } = require('../base');
const {
  requireAuth,
  optionalAuth,
  requirePermissions,
  requireRoles,
  validateBody,
  generateToken
} = require('../middleware');
const Joi = require('joi');

// Example: User Management API with Role-Based Access Control

/**
 * User Service with authentication logic
 */
class UserService extends BaseService {
  constructor(model) {
    super({
      model,
      searchFields: ['email', 'firstName', 'lastName'],
      defaultOrder: [['createdAt', 'DESC']]
    });
  }

  /**
   * Authenticate user with email and password
   */
  async authenticate(email, password) {
    try {
      const result = await this.findOne({ email });
      
      if (!result.success) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      const user = result.data;

      // Verify password (assuming bcrypt is used)
      const bcrypt = require('bcrypt');
      const isValid = await bcrypt.compare(password, user.password);

      if (!isValid) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Generate JWT token
      const token = generateToken({
        user: {
          users_id: user.users_id,
          email: user.email,
          roles: user.roles || [],
          permissions: user.permissions || []
        }
      });

      return {
        success: true,
        data: {
          user: {
            users_id: user.users_id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            roles: user.roles,
            permissions: user.permissions
          },
          token
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Register new user
   */
  async register(userData) {
    try {
      // Hash password
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user with default role
      const result = await this.create({
        ...userData,
        password: hashedPassword,
        roles: ['user'],
        permissions: ['read:own']
      });

      if (!result.success) {
        return result;
      }

      // Generate token
      const user = result.data;
      const token = generateToken({
        user: {
          users_id: user.users_id,
          email: user.email,
          roles: user.roles,
          permissions: user.permissions
        }
      });

      return {
        success: true,
        data: {
          user: {
            users_id: user.users_id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            roles: user.roles
          },
          token
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update user roles (admin only)
   */
  async updateRoles(userId, roles) {
    return this.update(userId, { roles });
  }

  /**
   * Get current user profile
   */
  async getProfile(userId) {
    return this.findById(userId);
  }
}

/**
 * User Controller with authentication endpoints
 */
class UserController extends BaseController {
  constructor(service) {
    super({
      service,
      searchFields: ['email', 'firstName', 'lastName']
    });

    // Bind custom methods
    this.login = this.login.bind(this);
    this.register = this.register.bind(this);
    this.getProfile = this.getProfile.bind(this);
    this.updateRoles = this.updateRoles.bind(this);
  }

  /**
   * Login endpoint
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await this.service.authenticate(email, password);

      if (!result.success) {
        return this.sendError(res, result.error, 401);
      }

      this.sendSuccess(res, result.data, { message: 'Login successful' });
    } catch (error) {
      this.sendError(res, error.message, 500);
    }
  }

  /**
   * Register endpoint
   */
  async register(req, res) {
    try {
      const result = await this.service.register(req.body);

      if (!result.success) {
        return this.sendError(res, result.error, 400);
      }

      this.sendSuccess(res, result.data, {
        statusCode: 201,
        message: 'Registration successful'
      });
    } catch (error) {
      this.sendError(res, error.message, 500);
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.auth.user.id;
      const result = await this.service.getProfile(userId);

      if (!result.success) {
        return this.sendError(res, result.error, 404);
      }

      this.sendSuccess(res, result.data);
    } catch (error) {
      this.sendError(res, error.message, 500);
    }
  }

  /**
   * Update user roles (admin only)
   */
  async updateRoles(req, res) {
    try {
      const { id } = req.params;
      const { roles } = req.body;

      const result = await this.service.updateRoles(id, roles);

      if (!result.success) {
        return this.sendError(res, result.error, 400);
      }

      this.sendSuccess(res, result.data, { message: 'Roles updated successfully' });
    } catch (error) {
      this.sendError(res, error.message, 500);
    }
  }
}

/**
 * Validation schemas
 */
const userSchemas = {
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required()
  }),

  updateRoles: Joi.object({
    roles: Joi.array().items(Joi.string()).required()
  })
};

/**
 * User Router with authentication and authorization
 */
class UserRouter extends BaseRouter {
  constructor(controller) {
    super({
      basePath: '/api/users',
      requireAuth: false // We'll add auth per route
    });

    this.controller = controller;
    this.setupRoutes();
  }

  setupRoutes() {
    // Public routes (no authentication required)
    this.post('/login', this.controller.login, [
      validateBody(userSchemas.login)
    ]);

    this.post('/register', this.controller.register, [
      validateBody(userSchemas.register)
    ]);

    // Protected routes (authentication required)
    this.get('/profile', this.controller.getProfile, [requireAuth]);

    // Admin-only routes (authentication + admin role required)
    this.get('/', this.controller.list, [
      requireAuth,
      requireRoles(['admin'])
    ]);

    this.get('/:id', this.controller.get, [
      requireAuth,
      requireRoles(['admin'])
    ]);

    this.put('/:id/roles', this.controller.updateRoles, [
      requireAuth,
      requireRoles(['admin']),
      validateBody(userSchemas.updateRoles)
    ]);

    this.delete('/:id', this.controller.delete, [
      requireAuth,
      requireRoles(['admin'])
    ]);

    // Permission-based routes
    this.put('/:id', this.controller.update, [
      requireAuth,
      requirePermissions(['write:users'])
    ]);
  }
}

/**
 * Initialize and export
 */
function createUserRouter(UserModel) {
  const service = new UserService(UserModel);
  const controller = new UserController(service);
  const router = new UserRouter(controller);
  
  return router;
}

module.exports = {
  UserService,
  UserController,
  UserRouter,
  createUserRouter
};

/**
 * API Endpoints Created:
 * 
 * Public (No Auth):
 * POST   /api/users/login           - Login user
 * POST   /api/users/register        - Register new user
 * 
 * Protected (Auth Required):
 * GET    /api/users/profile         - Get current user profile
 * 
 * Admin Only (Auth + Admin Role):
 * GET    /api/users                 - List all users
 * GET    /api/users/:id             - Get user by ID
 * PUT    /api/users/:id/roles       - Update user roles
 * DELETE /api/users/:id             - Delete user
 * 
 * Permission-Based (Auth + Specific Permission):
 * PUT    /api/users/:id             - Update user (requires 'write:users' permission)
 * 
 * Usage Example:
 * 
 * // Login
 * POST /api/users/login
 * {
 *   "email": "user@example.com",
 *   "password": "password123"
 * }
 * 
 * // Response
 * {
 *   "success": true,
 *   "data": {
 *     "user": { ... },
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *   }
 * }
 * 
 * // Use token in subsequent requests
 * GET /api/users/profile
 * Headers: { "Authorization": "Bearer <token>" }
 */
