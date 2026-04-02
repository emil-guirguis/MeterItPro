/**
 * Tests for generic CRUD SQL helpers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the db module directly
vi.mock('./db', () => ({
  query: vi.fn(),
  transaction: vi.fn(),
}));

import { query } from './db';
import { findAll, findById, create, update, remove } from './crud';
import type { Env } from './db';

const mockQuery = vi.mocked(query);

const TEST_ENV: Env = {
  JWT_SECRET: 'test',
  HYPERDRIVE: { connectionString: 'postgresql://test:test@localhost/test' },
};

describe('findAll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return paginated results with default options', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: '5' }] } as any)
      .mockResolvedValueOnce({
        rows: [
          { meter_id: 1, name: 'Meter A' },
          { meter_id: 2, name: 'Meter B' },
        ],
      } as any);

    const result = await findAll(TEST_ENV, {
      table: 'meter',
      primaryKey: 'meter_id',
      tenantId: 1,
    });

    expect(result.pagination.total).toBe(5);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.pageSize).toBe(25);
    expect(result.pagination.totalPages).toBe(1);
    expect(result.rows).toHaveLength(2);
  });

  it('should apply search filter across specified fields', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: '1' }] } as any)
      .mockResolvedValueOnce({ rows: [{ meter_id: 1, name: 'Test Meter' }] } as any);

    await findAll(TEST_ENV, {
      table: 'meter',
      primaryKey: 'meter_id',
      tenantId: 1,
      search: 'test',
      searchFields: ['name', 'serial_number'],
    });

    const countCall = mockQuery.mock.calls[0];
    expect(countCall[1]).toContain('LOWER(meter.name) LIKE LOWER');
    expect(countCall[2]).toContain('%test%');
  });

  it('should apply pagination offset correctly', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: '100' }] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);

    const result = await findAll(TEST_ENV, {
      table: 'meter',
      primaryKey: 'meter_id',
      tenantId: 1,
      page: 3,
      limit: 10,
    });

    expect(result.pagination.page).toBe(3);
    expect(result.pagination.pageSize).toBe(10);
    expect(result.pagination.totalPages).toBe(10);

    // Verify data query uses correct offset (page 3, limit 10 => offset 20)
    const dataCall = mockQuery.mock.calls[1];
    expect(dataCall[2]).toContain(10); // limit
    expect(dataCall[2]).toContain(20); // offset
  });

  it('should apply sortBy and sortOrder', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: '5' }] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);

    await findAll(TEST_ENV, {
      table: 'meter',
      primaryKey: 'meter_id',
      tenantId: 1,
      sortBy: 'createdAt',
      sortOrder: 'ASC',
    });

    const dataCall = mockQuery.mock.calls[1];
    expect(dataCall[1]).toContain('meter.created_at ASC');
  });

  it('should handle additional where conditions', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: '2' }] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);

    await findAll(TEST_ENV, {
      table: 'meter',
      primaryKey: 'meter_id',
      tenantId: 1,
      where: { active: true },
    });

    const countCall = mockQuery.mock.calls[0];
    expect(countCall[1]).toContain('meter.active =');
    expect(countCall[2]).toContain(true);
  });

  it('should handle null where conditions with IS NULL', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: '0' }] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);

    await findAll(TEST_ENV, {
      table: 'meter',
      primaryKey: 'meter_id',
      where: { device_id: null },
    });

    const countCall = mockQuery.mock.calls[0];
    expect(countCall[1]).toContain('IS NULL');
  });

  it('should include joins when specified', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: '1' }] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);

    await findAll(TEST_ENV, {
      table: 'meter',
      primaryKey: 'meter_id',
      tenantId: 1,
      joins: 'LEFT JOIN device d ON meter.device_id = d.device_id',
      selectFields: 'meter.*, d.manufacturer',
    });

    const dataCall = mockQuery.mock.calls[1];
    expect(dataCall[1]).toContain('LEFT JOIN device d');
    expect(dataCall[1]).toContain('meter.*, d.manufacturer');
  });
});

describe('findById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a record by primary key', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ meter_id: 1, name: 'Test Meter', tenant_id: 1 }],
    } as any);

    const result = await findById(TEST_ENV, 'meter', 'meter_id', 1, 1);

    expect(result).toEqual({ meter_id: 1, name: 'Test Meter', tenant_id: 1 });
    expect(mockQuery.mock.calls[0][1]).toContain('meter_id = $1');
    expect(mockQuery.mock.calls[0][1]).toContain('tenant_id = $2');
  });

  it('should return null when record is not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);

    const result = await findById(TEST_ENV, 'meter', 'meter_id', 999, 1);
    expect(result).toBeNull();
  });

  it('should work without tenantId', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ register_id: 5, name: 'kWh' }],
    } as any);

    const result = await findById(TEST_ENV, 'register', 'register_id', 5);

    expect(result).toEqual({ register_id: 5, name: 'kWh' });
    expect(mockQuery.mock.calls[0][1]).not.toContain('tenant_id');
  });
});

describe('create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should insert a record and return it', async () => {
    const newMeter = { name: 'New Meter', serial_number: 'SN001', tenant_id: 1 };
    mockQuery.mockResolvedValueOnce({
      rows: [{ meter_id: 10, ...newMeter }],
    } as any);

    const result = await create(TEST_ENV, 'meter', newMeter);

    expect(result.meter_id).toBe(10);
    expect(result.name).toBe('New Meter');
    const sql = mockQuery.mock.calls[0][1];
    expect(sql).toContain('INSERT INTO meter');
    expect(sql).toContain('RETURNING *');
  });

  it('should skip undefined values', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ meter_id: 11, name: 'Test' }],
    } as any);

    await create(TEST_ENV, 'meter', {
      name: 'Test',
      serial_number: undefined,
      tenant_id: 1,
    });

    const sql = mockQuery.mock.calls[0][1];
    expect(sql).not.toContain('serial_number');
  });
});

describe('update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update a record and return it', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ meter_id: 1, name: 'Updated Meter' }],
    } as any);

    const result = await update(TEST_ENV, 'meter', 'meter_id', 1, {
      name: 'Updated Meter',
    });

    expect(result.name).toBe('Updated Meter');
    const sql = mockQuery.mock.calls[0][1];
    expect(sql).toContain('UPDATE meter SET');
    expect(sql).toContain('updated_at = NOW()');
    expect(sql).toContain('RETURNING *');
  });

  it('should return null when no keys to update', async () => {
    const result = await update(TEST_ENV, 'meter', 'meter_id', 1, {});
    expect(result).toBeNull();
  });

  it('should exclude primaryKey, updated_at, and created_at from SET clause', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ meter_id: 1, name: 'Test' }],
    } as any);

    await update(TEST_ENV, 'meter', 'meter_id', 1, {
      meter_id: 1,
      name: 'Test',
      updated_at: '2024-01-01',
      created_at: '2024-01-01',
    });

    const sql = mockQuery.mock.calls[0][1];
    // Only 'name' should be in the SET clause
    expect(sql).toMatch(/SET name = \$1/);
    // meter_id should only appear in WHERE, not in SET
    expect(sql).toMatch(/SET name = \$1, updated_at = NOW\(\) WHERE meter_id/);
    expect(sql).not.toMatch(/SET.*meter_id =.*WHERE/);
  });
});

describe('remove', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete a record and return it', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ meter_id: 1, name: 'Deleted Meter' }],
    } as any);

    const result = await remove(TEST_ENV, 'meter', 'meter_id', 1);

    expect(result.meter_id).toBe(1);
    const sql = mockQuery.mock.calls[0][1];
    expect(sql).toContain('DELETE FROM meter');
    expect(sql).toContain('RETURNING *');
  });

  it('should return null when record does not exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);

    const result = await remove(TEST_ENV, 'meter', 'meter_id', 999);
    expect(result).toBeNull();
  });
});
