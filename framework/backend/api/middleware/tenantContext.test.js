/**
 * Tenant Context Middleware Tests
 * 
 * Tests for tenant context extraction and validation
 * **Feature: tenant-isolation-api-framework, Property 1: Tenant ID Extraction on Login**
 * **Validates: Requirements 1.1, 1.2**
 */

const { tenantContext, optionalTenantContext } = require('./tenantContext');

describe('Tenant Context Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Mock request object
    req = {
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

  describe('tenantContext middleware', () => {
    test('should reject request without authentication', () => {
      req.auth = null;

      tenantContext(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Authentication required'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request without user in auth', () => {
      req.auth = { token: 'some-token' };

      tenantContext(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Authentication required'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request without tenant_id in user', () => {
      req.auth = {
        user: {
          id: 'user-123',
          email: 'user@example.com'
        },
        token: 'some-token'
      };

      tenantContext(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Tenant context not found'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request with empty tenant_id', () => {
      req.auth = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          tenant_id: ''
        },
        token: 'some-token'
      };

      tenantContext(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid tenant context'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request with whitespace-only tenant_id', () => {
      req.auth = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          tenant_id: '   '
        },
        token: 'some-token'
      };

      tenantContext(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid tenant context'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request with non-string tenant_id', () => {
      req.auth = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          tenant_id: 12345
        },
        token: 'some-token'
      };

      tenantContext(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid tenant context'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should extract and store valid tenant_id', () => {
      const tenantId = 'tenant-abc-123';
      req.auth = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          tenant_id: tenantId
        },
        token: 'some-token'
      };

      tenantContext(req, res, next);

      expect(req.context.tenant).toBeDefined();
      expect(req.context.tenant.id).toBe(tenantId);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should preserve existing context properties', () => {
      const tenantId = 'tenant-abc-123';
      req.context = {
        existingProp: 'value'
      };
      req.auth = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          tenant_id: tenantId
        },
        token: 'some-token'
      };

      tenantContext(req, res, next);

      expect(req.context.existingProp).toBe('value');
      expect(req.context.tenant.id).toBe(tenantId);
      expect(next).toHaveBeenCalled();
    });

    test('should handle various valid tenant_id formats', () => {
      const validTenantIds = [
        'tenant-123',
        'abc123def456',
        'TENANT_ABC',
        'tenant.example.com',
        'a'
      ];

      validTenantIds.forEach(tenantId => {
        req.auth = {
          user: {
            id: 'user-123',
            email: 'user@example.com',
            tenant_id: tenantId
          },
          token: 'some-token'
        };
        req.context = {};
        next.mockClear();
        res.status.mockClear();

        tenantContext(req, res, next);

        expect(req.context.tenant.id).toBe(tenantId);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });
    });
  });

  describe('optionalTenantContext middleware', () => {
    test('should pass through without authentication', () => {
      req.auth = null;

      optionalTenantContext(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.context.tenant).toBeUndefined();
    });

    test('should pass through without user in auth', () => {
      req.auth = { token: 'some-token' };

      optionalTenantContext(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.context.tenant).toBeUndefined();
    });

    test('should pass through without tenant_id', () => {
      req.auth = {
        user: {
          id: 'user-123',
          email: 'user@example.com'
        },
        token: 'some-token'
      };

      optionalTenantContext(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.context.tenant).toBeUndefined();
    });

    test('should pass through with empty tenant_id', () => {
      req.auth = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          tenant_id: ''
        },
        token: 'some-token'
      };

      optionalTenantContext(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.context.tenant).toBeUndefined();
    });

    test('should extract and store valid tenant_id', () => {
      const tenantId = 'tenant-abc-123';
      req.auth = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          tenant_id: tenantId
        },
        token: 'some-token'
      };

      optionalTenantContext(req, res, next);

      expect(req.context.tenant).toBeDefined();
      expect(req.context.tenant.id).toBe(tenantId);
      expect(next).toHaveBeenCalled();
    });

    test('should always call next even on error', () => {
      req.auth = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          tenant_id: 'tenant-123'
        }
      };
      // Simulate an error by making context a non-object
      Object.defineProperty(req, 'context', {
        get() {
          throw new Error('Simulated error');
        }
      });

      optionalTenantContext(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('Property 1: Tenant ID Extraction on Login', () => {
    /**
     * Property: For any successful user login with a valid tenant_id,
     * the system SHALL extract the tenant_id and store it in the request context
     * 
     * **Validates: Requirements 1.1, 1.2**
     */
    test('should extract tenant_id for any valid authenticated user', () => {
      // Generate various valid tenant IDs
      const validTenantIds = [
        'tenant-1',
        'tenant-abc-123-def',
        'org-prod-001',
        'customer_123',
        'a'
      ];

      validTenantIds.forEach(tenantId => {
        req.auth = {
          user: {
            id: `user-${Math.random()}`,
            email: `user${Math.random()}@example.com`,
            tenant_id: tenantId
          },
          token: 'valid-token'
        };
        req.context = {};
        next.mockClear();
        res.status.mockClear();

        tenantContext(req, res, next);

        // Property: tenant_id must be extracted and stored
        expect(req.context.tenant).toBeDefined();
        expect(req.context.tenant.id).toBe(tenantId);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });
    });

    test('should reject any request without valid tenant_id', () => {
      const invalidScenarios = [
        { auth: null, expectedStatus: 401 },
        { auth: { user: null }, expectedStatus: 401 },
        { auth: { user: { id: 'user-1' } }, expectedStatus: 401 },
        { auth: { user: { id: 'user-1', tenant_id: '' } }, expectedStatus: 400 },
        { auth: { user: { id: 'user-1', tenant_id: '   ' } }, expectedStatus: 400 },
        { auth: { user: { id: 'user-1', tenant_id: null } }, expectedStatus: 400 }
      ];

      invalidScenarios.forEach(scenario => {
        req.auth = scenario.auth;
        req.context = {};
        next.mockClear();
        res.status.mockClear();

        tenantContext(req, res, next);

        expect(res.status).toHaveBeenCalledWith(scenario.expectedStatus);
        expect(next).not.toHaveBeenCalled();
      });
    });
  });
});
