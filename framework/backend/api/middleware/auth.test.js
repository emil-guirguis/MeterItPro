/**
 * Authentication Middleware Tests
 * 
 * Tests for JWT token generation and tenant_id extraction
 * **Feature: tenant-isolation-api-framework, Property 1: Tenant ID Extraction on Login**
 * **Validates: Requirements 1.1, 1.2**
 */

const jwt = require('jsonwebtoken');
const { requireAuth, optionalAuth, generateToken } = require('./auth');

// Mock the logger
jest.mock('../../shared/utils/logging', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Authentication Middleware', () => {
  let req, res, next;
  const JWT_SECRET = 'test-secret-key';

  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;

    // Mock request object
    req = {
      headers: {},
      auth: null,
      context: {}
    };

    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Mock next function
    next = jest.fn();
  });

  describe('generateToken', () => {
    test('should generate token with tenant_id from user object', () => {
      const payload = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          tenant_id: 'tenant-456'
        }
      };

      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify token contains tenant_id
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.user.tenant_id).toBe('tenant-456');
    });

    test('should generate token with tenant_id at root level', () => {
      const payload = {
        id: 'user-123',
        email: 'user@example.com',
        tenant_id: 'tenant-456'
      };

      const token = generateToken(payload);

      expect(token).toBeDefined();
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.tenant_id).toBe('tenant-456');
    });

    test('should generate token without tenant_id if not provided', () => {
      const payload = {
        user: {
          id: 'user-123',
          email: 'user@example.com'
        }
      };

      const token = generateToken(payload);

      expect(token).toBeDefined();
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.user).toBeDefined();
      expect(decoded.user.id).toBe('user-123');
    });

    test('should respect custom expiration options', () => {
      const payload = {
        user: {
          id: 'user-123',
          tenant_id: 'tenant-456'
        }
      };

      const token = generateToken(payload, { expiresIn: '1h' });

      expect(token).toBeDefined();
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.user.tenant_id).toBe('tenant-456');
    });
  });

  describe('requireAuth middleware', () => {
    test('should reject request without authorization header', () => {
      req.headers.authorization = undefined;

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Authentication required'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request with invalid authorization header format', () => {
      req.headers.authorization = 'InvalidFormat token';

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Authentication required'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should extract tenant_id from valid JWT token with user object', () => {
      const payload = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          tenant_id: 'tenant-456'
        }
      };

      const token = generateToken(payload);
      req.headers.authorization = `Bearer ${token}`;

      requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.auth).toBeDefined();
      expect(req.auth.user.tenant_id).toBe('tenant-456');
      expect(req.auth.user.id).toBe('user-123');
      expect(req.context.auth).toBeDefined();
      expect(req.context.auth.user.tenant_id).toBe('tenant-456');
    });

    test('should extract tenant_id from valid JWT token with root-level tenant_id', () => {
      const payload = {
        id: 'user-123',
        email: 'user@example.com',
        tenant_id: 'tenant-456'
      };

      const token = generateToken(payload);
      req.headers.authorization = `Bearer ${token}`;

      requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.auth.user.tenant_id).toBe('tenant-456');
    });

    test('should handle token without tenant_id gracefully', () => {
      const payload = {
        user: {
          id: 'user-123',
          email: 'user@example.com'
        }
      };

      const token = generateToken(payload);
      req.headers.authorization = `Bearer ${token}`;

      requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.auth.user).toBeDefined();
      expect(req.auth.user.id).toBe('user-123');
    });

    test('should reject invalid JWT token', () => {
      req.headers.authorization = 'Bearer invalid.token.here';

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid token'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should attach token to auth context', () => {
      const payload = {
        user: {
          id: 'user-123',
          tenant_id: 'tenant-456'
        }
      };

      const token = generateToken(payload);
      req.headers.authorization = `Bearer ${token}`;

      requireAuth(req, res, next);

      expect(req.auth.token).toBe(token);
      expect(req.context.auth.token).toBe(token);
    });
  });

  describe('optionalAuth middleware', () => {
    test('should proceed without authentication if no header present', () => {
      req.headers.authorization = undefined;

      optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.auth).toBeNull();
    });

    test('should extract tenant_id if valid token present', () => {
      const payload = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          tenant_id: 'tenant-456'
        }
      };

      const token = generateToken(payload);
      req.headers.authorization = `Bearer ${token}`;

      optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.auth).toBeDefined();
      expect(req.auth.user.tenant_id).toBe('tenant-456');
    });

    test('should proceed silently if token is invalid', () => {
      req.headers.authorization = 'Bearer invalid.token.here';

      optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.auth).toBeUndefined();
    });
  });
});
