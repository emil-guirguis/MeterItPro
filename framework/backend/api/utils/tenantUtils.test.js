/**
 * Tenant Utilities Tests
 * 
 * Tests for tenant context access and verification functions
 * **Feature: tenant-isolation-api-framework, Property 6: Tenant Context Availability**
 * **Validates: Requirements 3.1, 3.2, 3.3**
 */

const {
  getTenantId,
  getTenantContext,
  verifyTenantOwnership,
  injectTenantFilter
} = require('./tenantUtils');

describe('Tenant Utilities', () => {
  let req;

  beforeEach(() => {
    req = {
      auth: {
        user: {
          id: 'user-123',
          email: 'user@example.com'
        }
      },
      context: {}
    };
  });

  describe('getTenantId', () => {
    test('should return tenant ID when context is valid', () => {
      const tenantId = 'tenant-abc-123';
      req.context.tenant = { id: tenantId };

      const result = getTenantId(req);

      expect(result).toBe(tenantId);
    });

    test('should return null when context is missing', () => {
      req.context = null;

      const result = getTenantId(req);

      expect(result).toBeNull();
    });

    test('should return null when tenant is missing from context', () => {
      req.context = {};

      const result = getTenantId(req);

      expect(result).toBeNull();
    });

    test('should return null when tenant_id is null', () => {
      req.context.tenant = { id: null };

      const result = getTenantId(req);

      expect(result).toBeNull();
    });

    test('should return null when tenant_id is empty string', () => {
      req.context.tenant = { id: '' };

      const result = getTenantId(req);

      expect(result).toBeNull();
    });

    test('should return null when tenant_id is whitespace only', () => {
      req.context.tenant = { id: '   ' };

      const result = getTenantId(req);

      expect(result).toBeNull();
    });

    test('should return null when tenant_id is not a string', () => {
      req.context.tenant = { id: 12345 };

      const result = getTenantId(req);

      expect(result).toBeNull();
    });

    test('should handle various valid tenant ID formats', () => {
      const validIds = [
        'tenant-123',
        'abc123def456',
        'TENANT_ABC',
        'tenant.example.com',
        'a'
      ];

      validIds.forEach(id => {
        req.context.tenant = { id };
        const result = getTenantId(req);
        expect(result).toBe(id);
      });
    });

    test('should handle error gracefully', () => {
      // Create a request that will throw an error when accessing context
      const badReq = {};
      Object.defineProperty(badReq, 'context', {
        get() {
          throw new Error('Simulated error');
        }
      });

      const result = getTenantId(badReq);

      expect(result).toBeNull();
    });
  });

  describe('getTenantContext', () => {
    test('should return full tenant context when valid', () => {
      const tenantId = 'tenant-abc-123';
      req.context.tenant = { id: tenantId, metadata: 'test' };

      const result = getTenantContext(req);

      expect(result).toBeDefined();
      expect(result.id).toBe(tenantId);
      expect(result.metadata).toBe('test');
    });

    test('should return null when context is missing', () => {
      req.context = null;

      const result = getTenantContext(req);

      expect(result).toBeNull();
    });

    test('should return null when tenant is missing from context', () => {
      req.context = {};

      const result = getTenantContext(req);

      expect(result).toBeNull();
    });

    test('should return null when tenant_id is null', () => {
      req.context.tenant = { id: null };

      const result = getTenantContext(req);

      expect(result).toBeNull();
    });

    test('should return null when tenant_id is empty string', () => {
      req.context.tenant = { id: '' };

      const result = getTenantContext(req);

      expect(result).toBeNull();
    });

    test('should return null when tenant_id is whitespace only', () => {
      req.context.tenant = { id: '   ' };

      const result = getTenantContext(req);

      expect(result).toBeNull();
    });

    test('should preserve additional tenant metadata', () => {
      const tenantId = 'tenant-abc-123';
      req.context.tenant = {
        id: tenantId,
        name: 'Test Tenant',
        plan: 'premium'
      };

      const result = getTenantContext(req);

      expect(result.id).toBe(tenantId);
      expect(result.name).toBe('Test Tenant');
      expect(result.plan).toBe('premium');
    });

    test('should handle error gracefully', () => {
      const badReq = {};
      Object.defineProperty(badReq, 'context', {
        get() {
          throw new Error('Simulated error');
        }
      });

      const result = getTenantContext(badReq);

      expect(result).toBeNull();
    });
  });

  describe('verifyTenantOwnership', () => {
    let mockModel;

    beforeEach(() => {
      mockModel = {
        findOne: jest.fn()
      };
      req.context.tenant = { id: 'tenant-123' };
    });

    test('should return true when resource belongs to tenant', async () => {
      mockModel.findOne.mockResolvedValue({ id: 'resource-1', tenant_id: 'tenant-123' });

      const result = await verifyTenantOwnership(req, 'resource-1', mockModel);

      expect(result).toBe(true);
      expect(mockModel.findOne).toHaveBeenCalledWith({
        where: {
          id: 'resource-1',
          tenant_id: 'tenant-123'
        }
      });
    });

    test('should return false when resource does not belong to tenant', async () => {
      mockModel.findOne.mockResolvedValue(null);

      const result = await verifyTenantOwnership(req, 'resource-1', mockModel);

      expect(result).toBe(false);
    });

    test('should return false when tenant context is missing', async () => {
      req.context = {};

      const result = await verifyTenantOwnership(req, 'resource-1', mockModel);

      expect(result).toBe(false);
      expect(mockModel.findOne).not.toHaveBeenCalled();
    });

    test('should return false when model is not provided', async () => {
      const result = await verifyTenantOwnership(req, 'resource-1', null);

      expect(result).toBe(false);
    });

    test('should return false on database error', async () => {
      mockModel.findOne.mockRejectedValue(new Error('Database error'));

      const result = await verifyTenantOwnership(req, 'resource-1', mockModel);

      expect(result).toBe(false);
    });

    test('should handle numeric resource IDs', async () => {
      mockModel.findOne.mockResolvedValue({ id: 123, tenant_id: 'tenant-123' });

      const result = await verifyTenantOwnership(req, 123, mockModel);

      expect(result).toBe(true);
      expect(mockModel.findOne).toHaveBeenCalledWith({
        where: {
          id: 123,
          tenant_id: 'tenant-123'
        }
      });
    });
  });

  describe('injectTenantFilter', () => {
    const tenantId = 'tenant-123';

    describe('SELECT queries', () => {
      test('should add WHERE clause to simple SELECT', () => {
        const query = 'SELECT * FROM users';

        const result = injectTenantFilter(query, tenantId);

        expect(result.query).toContain('WHERE tenant_id = ?');
        expect(result.params).toEqual([tenantId]);
      });

      test('should append AND to existing WHERE clause', () => {
        const query = 'SELECT * FROM users WHERE email = ?';

        const result = injectTenantFilter(query, tenantId);

        expect(result.query).toContain('AND tenant_id = ?');
        expect(result.params).toEqual([tenantId]);
      });

      test('should handle SELECT with ORDER BY', () => {
        const query = 'SELECT * FROM users WHERE email = ? ORDER BY created_at DESC';

        const result = injectTenantFilter(query, tenantId);

        expect(result.query).toContain('AND tenant_id = ?');
        expect(result.query).toContain('ORDER BY created_at DESC');
        expect(result.params).toEqual([tenantId]);
      });

      test('should handle SELECT with LIMIT', () => {
        const query = 'SELECT * FROM users LIMIT 10';

        const result = injectTenantFilter(query, tenantId);

        expect(result.query).toContain('WHERE tenant_id = ?');
        expect(result.query).toContain('LIMIT 10');
        expect(result.params).toEqual([tenantId]);
      });

      test('should handle SELECT with GROUP BY', () => {
        const query = 'SELECT COUNT(*) FROM users GROUP BY department';

        const result = injectTenantFilter(query, tenantId);

        expect(result.query).toContain('WHERE tenant_id = ?');
        expect(result.query).toContain('GROUP BY department');
        expect(result.params).toEqual([tenantId]);
      });

      test('should handle complex SELECT with multiple clauses', () => {
        const query = 'SELECT * FROM users WHERE status = ? GROUP BY department ORDER BY name LIMIT 20';

        const result = injectTenantFilter(query, tenantId);

        expect(result.query).toContain('AND tenant_id = ?');
        expect(result.query).toContain('GROUP BY department');
        expect(result.query).toContain('ORDER BY name');
        expect(result.query).toContain('LIMIT 20');
        expect(result.params).toEqual([tenantId]);
      });
    });

    describe('INSERT queries', () => {
      test('should add tenant_id to INSERT query', () => {
        const query = 'INSERT INTO users (name, email) VALUES (?, ?)';

        const result = injectTenantFilter(query, tenantId);

        expect(result.query).toContain('tenant_id');
        expect(result.query).toContain('VALUES');
        expect(result.params).toEqual([tenantId]);
      });

      test('should handle INSERT with multiple columns', () => {
        const query = 'INSERT INTO users (id, name, email, status) VALUES (?, ?, ?, ?)';

        const result = injectTenantFilter(query, tenantId);

        expect(result.query).toContain('tenant_id');
        expect(result.params).toEqual([tenantId]);
      });

      test('should throw error for invalid INSERT query', () => {
        const query = 'INSERT INTO users (name, email)';

        expect(() => injectTenantFilter(query, tenantId)).toThrow();
      });
    });

    describe('UPDATE queries', () => {
      test('should add WHERE clause to UPDATE query', () => {
        const query = 'UPDATE users SET name = ? WHERE users_id = ?';

        const result = injectTenantFilter(query, tenantId);

        expect(result.query).toContain('AND tenant_id = ?');
        expect(result.params).toEqual([tenantId]);
      });

      test('should add WHERE clause to UPDATE without WHERE', () => {
        const query = 'UPDATE users SET status = ?';

        const result = injectTenantFilter(query, tenantId);

        expect(result.query).toContain('WHERE tenant_id = ?');
        expect(result.params).toEqual([tenantId]);
      });

      test('should handle UPDATE with LIMIT', () => {
        const query = 'UPDATE users SET status = ? WHERE users_id = ? LIMIT 1';

        const result = injectTenantFilter(query, tenantId);

        expect(result.query).toContain('AND tenant_id = ?');
        expect(result.query).toContain('LIMIT 1');
        expect(result.params).toEqual([tenantId]);
      });
    });

    describe('DELETE queries', () => {
      test('should add WHERE clause to DELETE query', () => {
        const query = 'DELETE FROM users WHERE users_id = ?';

        const result = injectTenantFilter(query, tenantId);

        expect(result.query).toContain('AND tenant_id = ?');
        expect(result.params).toEqual([tenantId]);
      });

      test('should add WHERE clause to DELETE without WHERE', () => {
        const query = 'DELETE FROM users';

        const result = injectTenantFilter(query, tenantId);

        expect(result.query).toContain('WHERE tenant_id = ?');
        expect(result.params).toEqual([tenantId]);
      });

      test('should handle DELETE with LIMIT', () => {
        const query = 'DELETE FROM users WHERE status = ? LIMIT 10';

        const result = injectTenantFilter(query, tenantId);

        expect(result.query).toContain('AND tenant_id = ?');
        expect(result.query).toContain('LIMIT 10');
        expect(result.params).toEqual([tenantId]);
      });
    });

    describe('Error handling', () => {
      test('should throw error for null query', () => {
        expect(() => injectTenantFilter(null, tenantId)).toThrow();
      });

      test('should throw error for empty query', () => {
        expect(() => injectTenantFilter('', tenantId)).toThrow();
      });

      test('should throw error for null tenant ID', () => {
        expect(() => injectTenantFilter('SELECT * FROM users', null)).toThrow();
      });

      test('should throw error for empty tenant ID', () => {
        expect(() => injectTenantFilter('SELECT * FROM users', '')).toThrow();
      });

      test('should throw error for unsupported query type', () => {
        expect(() => injectTenantFilter('TRUNCATE TABLE users', tenantId)).toThrow();
      });

      test('should throw error for non-string query', () => {
        expect(() => injectTenantFilter(123, tenantId)).toThrow();
      });

      test('should throw error for non-string tenant ID', () => {
        expect(() => injectTenantFilter('SELECT * FROM users', 123)).toThrow();
      });
    });

    describe('Case insensitivity', () => {
      test('should handle lowercase select', () => {
        const query = 'select * from users';

        const result = injectTenantFilter(query, tenantId);

        expect(result.query).toContain('WHERE tenant_id = ?');
        expect(result.params).toEqual([tenantId]);
      });

      test('should handle mixed case insert', () => {
        const query = 'InSeRt INTO users (name) VALUES (?)';

        const result = injectTenantFilter(query, tenantId);

        expect(result.query).toContain('tenant_id');
        expect(result.params).toEqual([tenantId]);
      });

      test('should handle uppercase update', () => {
        const query = 'UPDATE users SET name = ? WHERE users_id = ?';

        const result = injectTenantFilter(query, tenantId);

        expect(result.query).toContain('AND tenant_id = ?');
        expect(result.params).toEqual([tenantId]);
      });
    });
  });

  describe('Property 6: Tenant Context Availability', () => {
    /**
     * Property: For any route handler execution, the system SHALL provide
     * getTenantId() and getTenantContext() methods that allow consistent access
     * to tenant context
     * 
     * **Validates: Requirements 3.1, 3.2, 3.3**
     */
    test('should provide consistent tenant context access for any valid request', () => {
      const validTenantIds = [
        'tenant-1',
        'tenant-abc-123-def',
        'org-prod-001',
        'customer_123',
        'a'
      ];

      validTenantIds.forEach(tenantId => {
        req.context.tenant = { id: tenantId };

        // Property: getTenantId must return the tenant ID
        const id = getTenantId(req);
        expect(id).toBe(tenantId);

        // Property: getTenantContext must return the full context
        const context = getTenantContext(req);
        expect(context).toBeDefined();
        expect(context.id).toBe(tenantId);
      });
    });

    test('should return null for any request without valid tenant context', () => {
      const invalidScenarios = [
        { context: null },
        { context: {} },
        { context: { tenant: null } },
        { context: { tenant: { id: null } } },
        { context: { tenant: { id: '' } } },
        { context: { tenant: { id: '   ' } } }
      ];

      invalidScenarios.forEach(scenario => {
        req.context = scenario.context;

        // Property: getTenantId must return null
        const id = getTenantId(req);
        expect(id).toBeNull();

        // Property: getTenantContext must return null
        const context = getTenantContext(req);
        expect(context).toBeNull();
      });
    });
  });
});
