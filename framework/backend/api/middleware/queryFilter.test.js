/**
 * Query Filter Middleware Tests
 * 
 * Tests for query filtering and tenant_id injection
 * **Feature: tenant-isolation-api-framework, Property 3: Query Filtering Consistency**
 * **Feature: tenant-isolation-api-framework, Property 4: Insert Tenant ID Injection**
 * **Feature: tenant-isolation-api-framework, Property 5: Update and Delete Tenant Filtering**
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
 */

const {
  queryFilter,
  optionalQueryFilter,
  detectQueryType,
  filterSelectQuery,
  filterInsertQuery,
  filterUpdateQuery,
  filterDeleteQuery,
  applyTenantFilter
} = require('./queryFilter');

describe('Query Filter Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Mock request object
    req = {
      auth: {
        user: {
          id: 'user-123',
          email: 'user@example.com'
        }
      },
      context: {
        tenant: {
          id: 'tenant-abc-123'
        }
      }
    };

    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Mock next function
    next = jest.fn();
  });

  describe('queryFilter middleware', () => {
    test('should reject request without tenant context', () => {
      req.context = {};

      queryFilter(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Tenant context required for database operations'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request with null tenant_id', () => {
      req.context = {
        tenant: {
          id: null
        }
      };

      queryFilter(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request with empty tenant_id', () => {
      req.context = {
        tenant: {
          id: ''
        }
      };

      queryFilter(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('should accept request with valid tenant context', () => {
      queryFilter(req, res, next);

      expect(req.context.tenantId).toBe('tenant-abc-123');
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should preserve existing context properties', () => {
      req.context = {
        tenant: {
          id: 'tenant-abc-123'
        },
        existingProp: 'value'
      };

      queryFilter(req, res, next);

      expect(req.context.existingProp).toBe('value');
      expect(req.context.tenantId).toBe('tenant-abc-123');
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
        req.context = {
          tenant: {
            id: tenantId
          }
        };
        next.mockClear();
        res.status.mockClear();

        queryFilter(req, res, next);

        expect(req.context.tenantId).toBe(tenantId);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });
    });
  });

  describe('optionalQueryFilter middleware', () => {
    test('should pass through without tenant context', () => {
      req.context = {};

      optionalQueryFilter(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.context.tenantId).toBeUndefined();
    });

    test('should pass through with null tenant_id', () => {
      req.context = {
        tenant: {
          id: null
        }
      };

      optionalQueryFilter(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.context.tenantId).toBeUndefined();
    });

    test('should attach tenant_id if present', () => {
      optionalQueryFilter(req, res, next);

      expect(req.context.tenantId).toBe('tenant-abc-123');
      expect(next).toHaveBeenCalled();
    });

    test('should always call next even on error', () => {
      // Simulate an error by making context a non-object
      Object.defineProperty(req, 'context', {
        get() {
          throw new Error('Simulated error');
        }
      });

      optionalQueryFilter(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('detectQueryType', () => {
    test('should detect SELECT queries', () => {
      expect(detectQueryType('SELECT * FROM users')).toBe('SELECT');
      expect(detectQueryType('select * from users')).toBe('SELECT');
      expect(detectQueryType('  SELECT * FROM users')).toBe('SELECT');
    });

    test('should detect INSERT queries', () => {
      expect(detectQueryType('INSERT INTO users (name) VALUES (?)')).toBe('INSERT');
      expect(detectQueryType('insert into users (name) values (?)')).toBe('INSERT');
      expect(detectQueryType('  INSERT INTO users (name) VALUES (?)')).toBe('INSERT');
    });

    test('should detect UPDATE queries', () => {
      expect(detectQueryType('UPDATE users SET name = ? WHERE users_id = ?')).toBe('UPDATE');
      expect(detectQueryType('update users set name = ? where users_id = ?')).toBe('UPDATE');
      expect(detectQueryType('  UPDATE users SET name = ? WHERE users_id = ?')).toBe('UPDATE');
    });

    test('should detect DELETE queries', () => {
      expect(detectQueryType('DELETE FROM users WHERE users_id = ?')).toBe('DELETE');
      expect(detectQueryType('delete from users where users_id = ?')).toBe('DELETE');
      expect(detectQueryType('  DELETE FROM users WHERE users_id = ?')).toBe('DELETE');
    });

    test('should return UNKNOWN for unsupported queries', () => {
      expect(detectQueryType('CREATE TABLE users (users_id INT)')).toBe('UNKNOWN');
      expect(detectQueryType('DROP TABLE users')).toBe('UNKNOWN');
      expect(detectQueryType('')).toBe('UNKNOWN');
      expect(detectQueryType(null)).toBe('UNKNOWN');
      expect(detectQueryType(undefined)).toBe('UNKNOWN');
    });
  });

  describe('filterSelectQuery', () => {
    test('should add WHERE clause when none exists', () => {
      const query = 'SELECT * FROM users';
      const result = filterSelectQuery(query, 'tenant-123');

      expect(result.query).toContain('WHERE tenant_id = ?');
      expect(result.params).toEqual(['tenant-123']);
    });

    test('should append AND when WHERE clause exists', () => {
      const query = 'SELECT * FROM users WHERE email = ?';
      const result = filterSelectQuery(query, 'tenant-123');

      expect(result.query).toContain('AND tenant_id = ?');
      expect(result.params).toEqual(['tenant-123']);
    });

    test('should handle queries with ORDER BY', () => {
      const query = 'SELECT * FROM users ORDER BY name';
      const result = filterSelectQuery(query, 'tenant-123');

      expect(result.query).toContain('WHERE tenant_id = ?');
      expect(result.query).toContain('ORDER BY name');
      expect(result.params).toEqual(['tenant-123']);
    });

    test('should handle queries with GROUP BY', () => {
      const query = 'SELECT COUNT(*) FROM users GROUP BY role';
      const result = filterSelectQuery(query, 'tenant-123');

      expect(result.query).toContain('WHERE tenant_id = ?');
      expect(result.query).toContain('GROUP BY role');
      expect(result.params).toEqual(['tenant-123']);
    });

    test('should handle queries with LIMIT', () => {
      const query = 'SELECT * FROM users LIMIT 10';
      const result = filterSelectQuery(query, 'tenant-123');

      expect(result.query).toContain('WHERE tenant_id = ?');
      expect(result.query).toContain('LIMIT 10');
      expect(result.params).toEqual(['tenant-123']);
    });

    test('should handle complex queries with WHERE, ORDER BY, and LIMIT', () => {
      const query = 'SELECT * FROM users WHERE active = ? ORDER BY name LIMIT 10';
      const result = filterSelectQuery(query, 'tenant-123');

      expect(result.query).toContain('AND tenant_id = ?');
      expect(result.query).toContain('ORDER BY name');
      expect(result.query).toContain('LIMIT 10');
      expect(result.params).toEqual(['tenant-123']);
    });
  });

  describe('filterInsertQuery', () => {
    test('should add tenant_id to column list and values', () => {
      const query = 'INSERT INTO users (name, email) VALUES (?, ?)';
      const result = filterInsertQuery(query, 'tenant-123');

      expect(result.query).toContain('tenant_id)');
      expect(result.query).toContain('?, ?)');
      expect(result.params).toEqual(['tenant-123']);
    });

    test('should handle INSERT with multiple columns', () => {
      const query = 'INSERT INTO users (id, name, email, active) VALUES (?, ?, ?, ?)';
      const result = filterInsertQuery(query, 'tenant-123');

      expect(result.query).toContain('tenant_id)');
      expect(result.params).toEqual(['tenant-123']);
    });

    test('should throw error for invalid INSERT query without VALUES', () => {
      const query = 'INSERT INTO users (name) SELECT name FROM other_users';

      expect(() => {
        filterInsertQuery(query, 'tenant-123');
      }).toThrow('Invalid INSERT query: VALUES clause not found');
    });

    test('should throw error for INSERT query without column list', () => {
      const query = 'INSERT INTO users VALUES (?, ?)';

      expect(() => {
        filterInsertQuery(query, 'tenant-123');
      }).toThrow('Invalid INSERT query: column list not found');
    });
  });

  describe('filterUpdateQuery', () => {
    test('should add WHERE clause when none exists', () => {
      const query = 'UPDATE users SET name = ?';
      const result = filterUpdateQuery(query, 'tenant-123');

      expect(result.query).toContain('WHERE tenant_id = ?');
      expect(result.params).toEqual(['tenant-123']);
    });

    test('should append AND when WHERE clause exists', () => {
      const query = 'UPDATE users SET name = ? WHERE users_id = ?';
      const result = filterUpdateQuery(query, 'tenant-123');

      expect(result.query).toContain('AND tenant_id = ?');
      expect(result.params).toEqual(['tenant-123']);
    });

    test('should handle UPDATE with LIMIT', () => {
      const query = 'UPDATE users SET active = ? LIMIT 10';
      const result = filterUpdateQuery(query, 'tenant-123');

      expect(result.query).toContain('WHERE tenant_id = ?');
      expect(result.query).toContain('LIMIT 10');
      expect(result.params).toEqual(['tenant-123']);
    });

    test('should handle UPDATE with WHERE and LIMIT', () => {
      const query = 'UPDATE users SET active = ? WHERE role = ? LIMIT 10';
      const result = filterUpdateQuery(query, 'tenant-123');

      expect(result.query).toContain('AND tenant_id = ?');
      expect(result.query).toContain('LIMIT 10');
      expect(result.params).toEqual(['tenant-123']);
    });
  });

  describe('filterDeleteQuery', () => {
    test('should add WHERE clause when none exists', () => {
      const query = 'DELETE FROM users';
      const result = filterDeleteQuery(query, 'tenant-123');

      expect(result.query).toContain('WHERE tenant_id = ?');
      expect(result.params).toEqual(['tenant-123']);
    });

    test('should append AND when WHERE clause exists', () => {
      const query = 'DELETE FROM users WHERE users_id = ?';
      const result = filterDeleteQuery(query, 'tenant-123');

      expect(result.query).toContain('AND tenant_id = ?');
      expect(result.params).toEqual(['tenant-123']);
    });

    test('should handle DELETE with LIMIT', () => {
      const query = 'DELETE FROM users LIMIT 10';
      const result = filterDeleteQuery(query, 'tenant-123');

      expect(result.query).toContain('WHERE tenant_id = ?');
      expect(result.query).toContain('LIMIT 10');
      expect(result.params).toEqual(['tenant-123']);
    });

    test('should handle DELETE with WHERE and LIMIT', () => {
      const query = 'DELETE FROM users WHERE role = ? LIMIT 10';
      const result = filterDeleteQuery(query, 'tenant-123');

      expect(result.query).toContain('AND tenant_id = ?');
      expect(result.query).toContain('LIMIT 10');
      expect(result.params).toEqual(['tenant-123']);
    });
  });

  describe('applyTenantFilter', () => {
    test('should apply SELECT filter', () => {
      const query = 'SELECT * FROM users';
      const result = applyTenantFilter(query, 'tenant-123');

      expect(result.query).toContain('WHERE tenant_id = ?');
      expect(result.params).toEqual(['tenant-123']);
    });

    test('should apply INSERT filter', () => {
      const query = 'INSERT INTO users (name) VALUES (?)';
      const result = applyTenantFilter(query, 'tenant-123');

      expect(result.query).toContain('tenant_id)');
      expect(result.params).toEqual(['tenant-123']);
    });

    test('should apply UPDATE filter', () => {
      const query = 'UPDATE users SET name = ? WHERE users_id = ?';
      const result = applyTenantFilter(query, 'tenant-123');

      expect(result.query).toContain('AND tenant_id = ?');
      expect(result.params).toEqual(['tenant-123']);
    });

    test('should apply DELETE filter', () => {
      const query = 'DELETE FROM users WHERE users_id = ?';
      const result = applyTenantFilter(query, 'tenant-123');

      expect(result.query).toContain('AND tenant_id = ?');
      expect(result.params).toEqual(['tenant-123']);
    });

    test('should throw error for invalid query', () => {
      expect(() => {
        applyTenantFilter(null, 'tenant-123');
      }).toThrow('Query must be a non-empty string');
    });

    test('should throw error for invalid tenant_id', () => {
      expect(() => {
        applyTenantFilter('SELECT * FROM users', null);
      }).toThrow('Tenant ID must be a non-empty string');
    });

    test('should throw error for unsupported query type', () => {
      expect(() => {
        applyTenantFilter('CREATE TABLE users (id INT)', 'tenant-123');
      }).toThrow('Unsupported query type');
    });
  });

  describe('Property 3: Query Filtering Consistency', () => {
    /**
     * Property: For any database query executed through the API framework,
     * the system SHALL automatically apply a WHERE clause filtering by tenant_id,
     * ensuring only tenant-specific data is returned.
     * 
     * **Validates: Requirements 2.1, 2.2, 2.3**
     */
    test('should filter all SELECT queries with tenant_id', () => {
      const selectQueries = [
        'SELECT * FROM users',
        'SELECT users_id, name FROM users WHERE active = ?',
        'SELECT * FROM users ORDER BY name',
        'SELECT COUNT(*) FROM users GROUP BY role',
        'SELECT * FROM users LIMIT 10'
      ];

      selectQueries.forEach(query => {
        const result = filterSelectQuery(query, 'tenant-123');
        expect(result.query).toContain('tenant_id = ?');
        expect(result.params).toContain('tenant-123');
      });
    });

    test('should filter all UPDATE queries with tenant_id', () => {
      const updateQueries = [
        'UPDATE users SET name = ?',
        'UPDATE users SET active = ? WHERE v = ?',
        'UPDATE users SET role = ? WHERE department = ?'
      ];

      updateQueries.forEach(query => {
        const result = filterUpdateQuery(query, 'tenant-123');
        expect(result.query).toContain('tenant_id = ?');
        expect(result.params).toContain('tenant-123');
      });
    });

    test('should filter all DELETE queries with tenant_id', () => {
      const deleteQueries = [
        'DELETE FROM users',
        'DELETE FROM users WHERE users_id = ?',
        'DELETE FROM users WHERE role = ?'
      ];

      deleteQueries.forEach(query => {
        const result = filterDeleteQuery(query, 'tenant-123');
        expect(result.query).toContain('tenant_id = ?');
        expect(result.params).toContain('tenant-123');
      });
    });
  });

  describe('Property 4: Insert Tenant ID Injection', () => {
    /**
     * Property: For any INSERT query executed through the API framework,
     * the system SHALL automatically include the tenant_id value in the INSERT clause.
     * 
     * **Validates: Requirements 2.4**
     */
    test('should inject tenant_id into all INSERT queries', () => {
      const insertQueries = [
        'INSERT INTO users (name) VALUES (?)',
        'INSERT INTO users (id, name, email) VALUES (?, ?, ?)',
        'INSERT INTO devices (name, location) VALUES (?, ?)'
      ];

      insertQueries.forEach(query => {
        const result = filterInsertQuery(query, 'tenant-123');
        expect(result.query).toContain('tenant_id)');
        expect(result.params).toContain('tenant-123');
      });
    });

    test('should maintain correct parameter order for INSERT', () => {
      const query = 'INSERT INTO users (name, email) VALUES (?, ?)';
      const result = filterInsertQuery(query, 'tenant-123');

      // The tenant_id parameter should be added at the end
      expect(result.params).toEqual(['tenant-123']);
      expect(result.query).toMatch(/VALUES\s*\(\s*\?,\s*\?,\s*\?\s*\)/);
    });
  });

  describe('Property 5: Update and Delete Tenant Filtering', () => {
    /**
     * Property: For any UPDATE or DELETE query executed through the API framework,
     * the system SHALL apply a WHERE clause filtering by tenant_id to ensure only
     * the tenant's own records are modified or deleted.
     * 
     * **Validates: Requirements 2.5**
     */
    test('should filter UPDATE queries to only affect tenant records', () => {
      const updateQueries = [
        'UPDATE users SET name = ?',
        'UPDATE users SET active = ? WHERE v = ?',
        'UPDATE devices SET status = ? WHERE location = ?'
      ];

      updateQueries.forEach(query => {
        const result = filterUpdateQuery(query, 'tenant-123');
        expect(result.query).toContain('tenant_id = ?');
        expect(result.params).toContain('tenant-123');
      });
    });

    test('should filter DELETE queries to only affect tenant records', () => {
      const deleteQueries = [
        'DELETE FROM users',
        'DELETE FROM users WHERE users_id = ?',
        'DELETE FROM devices WHERE location = ?'
      ];

      deleteQueries.forEach(query => {
        const result = filterDeleteQuery(query, 'tenant-123');
        expect(result.query).toContain('tenant_id = ?');
        expect(result.params).toContain('tenant-123');
      });
    });

    test('should prevent accidental deletion of all records', () => {
      const query = 'DELETE FROM users';
      const result = filterDeleteQuery(query, 'tenant-123');

      // Should add WHERE clause to prevent deletion of all records
      expect(result.query).toContain('WHERE tenant_id = ?');
      expect(result.params).toEqual(['tenant-123']);
    });

    test('should prevent accidental update of all records', () => {
      const query = 'UPDATE users SET active = ?';
      const result = filterUpdateQuery(query, 'tenant-123');

      // Should add WHERE clause to prevent update of all records
      expect(result.query).toContain('WHERE tenant_id = ?');
      expect(result.params).toEqual(['tenant-123']);
    });
  });
});
