import { describe, it, expect, vi, beforeEach } from 'vitest';

// Capture every execQuery call so we can assert on the generated SQL + params.
const calls: { sql: string; params: any[] }[] = [];
let responses: any[] = [];

vi.mock('./db', () => ({
  execQuery: vi.fn((_env: any, sql: string, params: any[] = []) => {
    calls.push({ sql, params });
    return Promise.resolve(responses.shift() ?? { rows: [], rowCount: 0 });
  }),
}));

import {
  findAll, findById, create, update, remove, checkDeleteRestrictions,
} from './crud';

const ENV = {} as any;

beforeEach(() => {
  calls.length = 0;
  responses = [];
});

describe('crud.findAll', () => {
  it('paginates: count query then data query with LIMIT/OFFSET', async () => {
    responses = [{ rows: [{ total: '42' }] }, { rows: [{ id: 1 }] }];
    const res = await findAll(ENV, { table: 'users', primaryKey: 'id', page: 3, limit: 10 });

    expect(calls[0].sql).toMatch(/SELECT COUNT\(\*\) as total FROM "users"/);
    // page 3, limit 10 -> LIMIT 10 OFFSET 20
    expect(calls[1].params.slice(-2)).toEqual([10, 20]);
    expect(res.pagination).toEqual({ total: 42, page: 3, pageSize: 10, totalPages: 5 });
    expect(res.rows).toEqual([{ id: 1 }]);
  });

  it('defaults order to primary key DESC when no sort given', async () => {
    responses = [{ rows: [{ total: '0' }] }, { rows: [] }];
    await findAll(ENV, { table: 'orders', primaryKey: 'order_id' });
    expect(calls[1].sql).toContain('ORDER BY "orders".order_id DESC');
  });

  it('builds a case-insensitive OR search across searchFields on one param', async () => {
    responses = [{ rows: [{ total: '0' }] }, { rows: [] }];
    await findAll(ENV, {
      table: 'users', primaryKey: 'id', search: 'acme',
      searchFields: ['first_name', 'email'],
    });
    expect(calls[1].sql).toContain('LOWER("users".first_name) LIKE LOWER($1)');
    expect(calls[1].sql).toContain('OR LOWER("users".email) LIKE LOWER($1)');
    expect(calls[1].params[0]).toBe('%acme%');
  });

  it('translates sortBy camelCase to snake_case and clamps sortOrder', async () => {
    responses = [{ rows: [{ total: '0' }] }, { rows: [] }];
    await findAll(ENV, { table: 'users', primaryKey: 'id', sortBy: 'firstName', sortOrder: 'asc' });
    expect(calls[1].sql).toContain('ORDER BY "users".first_name ASC');
  });

  it('filters tenant_id when tenantId provided', async () => {
    responses = [{ rows: [{ total: '0' }] }, { rows: [] }];
    await findAll(ENV, { table: 'meter', primaryKey: 'meter_id', tenantId: 7 });
    expect(calls[0].sql).toContain('"meter".tenant_id = $1');
    expect(calls[0].params[0]).toBe(7);
  });

  it('emits IS NULL for a null where value (no param bound)', async () => {
    responses = [{ rows: [{ total: '0' }] }, { rows: [] }];
    await findAll(ENV, { table: 'users', primaryKey: 'id', where: { deleted_at: null } });
    expect(calls[0].sql).toContain('"users".deleted_at IS NULL');
    expect(calls[0].params).toEqual([]);
  });

  it('rejects an injection attempt in the table name', async () => {
    await expect(
      findAll(ENV, { table: 'users; DROP TABLE users', primaryKey: 'id' })
    ).rejects.toThrow(/Invalid table/);
  });

  it('rejects an injection attempt in a search field', async () => {
    await expect(
      findAll(ENV, { table: 'users', primaryKey: 'id', search: 'x', searchFields: ['email OR 1=1'] })
    ).rejects.toThrow(/Invalid searchField/);
  });
});

describe('crud.findById', () => {
  it('selects by primary key and returns the row', async () => {
    responses = [{ rows: [{ id: 5 }] }];
    const row = await findById(ENV, 'users', 'id', 5);
    expect(calls[0].sql).toBe('SELECT "users".* FROM "users" WHERE id = $1');
    expect(row).toEqual({ id: 5 });
  });

  it('returns null when not found', async () => {
    responses = [{ rows: [] }];
    expect(await findById(ENV, 'users', 'id', 99)).toBeNull();
  });

  it('adds a tenant_id predicate when tenantId is passed', async () => {
    responses = [{ rows: [] }];
    await findById(ENV, 'meter', 'meter_id', 1, 7);
    expect(calls[0].sql).toContain('AND tenant_id = $2');
    expect(calls[0].params).toEqual([1, 7]);
  });
});

describe('crud.create', () => {
  it('inserts only defined columns and returns the row', async () => {
    responses = [{ rows: [{ id: 1, name: 'A' }] }];
    const row = await create(ENV, 'users', { name: 'A', email: undefined });
    expect(calls[0].sql).toBe('INSERT INTO "users" (name) VALUES ($1) RETURNING *');
    expect(calls[0].params).toEqual(['A']);
    expect(row).toEqual({ id: 1, name: 'A' });
  });

  it('rejects an injected column name', async () => {
    await expect(create(ENV, 'users', { 'name); DROP': 'x' })).rejects.toThrow(/Invalid column/);
  });
});

describe('crud.update', () => {
  it('sets defined columns, excluding PK, and binds id last', async () => {
    responses = [{ rows: [{ id: 5, name: 'B' }] }];
    const row = await update(ENV, 'users', 'id', 5, { name: 'B', id: 999 });
    expect(calls[0].sql).toBe('UPDATE "users" SET name = $1 WHERE id = $2 RETURNING *');
    expect(calls[0].params).toEqual(['B', 5]);
    expect(row).toEqual({ id: 5, name: 'B' });
  });

  it('never writes denylisted columns (tenant_id/created_at/updated_at)', async () => {
    responses = [{ rows: [{ id: 5 }] }];
    await update(ENV, 'users', 'id', 5, { name: 'B', tenant_id: 9, created_at: 'x', updated_at: 'y' });
    expect(calls[0].sql).toBe('UPDATE "users" SET name = $1 WHERE id = $2 RETURNING *');
  });

  it('returns null without querying when there is nothing to update', async () => {
    const row = await update(ENV, 'users', 'id', 5, { id: 5, tenant_id: 9 });
    expect(row).toBeNull();
    expect(calls).toHaveLength(0);
  });
});

describe('crud.remove', () => {
  it('deletes by primary key and returns the removed row', async () => {
    responses = [{ rows: [{ id: 5 }] }];
    const row = await remove(ENV, 'users', 'id', 5);
    expect(calls[0].sql).toBe('DELETE FROM "users" WHERE id = $1 RETURNING *');
    expect(row).toEqual({ id: 5 });
  });

  it('returns null when nothing was deleted', async () => {
    responses = [{ rows: [] }];
    expect(await remove(ENV, 'users', 'id', 99)).toBeNull();
  });
});

describe('crud.checkDeleteRestrictions', () => {
  it('returns null when no children reference the row', async () => {
    responses = [{ rows: [{ count: 0 }] }];
    const v = await checkDeleteRestrictions(
      ENV, { deleteRestrictions: [{ table: 'quote', fk: 'user_id' }] }, 1
    );
    expect(v).toBeNull();
  });

  it('returns a violation with a pluralized message when children exist', async () => {
    responses = [{ rows: [{ count: 3 }] }];
    const v = await checkDeleteRestrictions(
      ENV, { deleteRestrictions: [{ table: 'quote_line', fk: 'user_id' }] }, 1
    );
    expect(v).toMatchObject({ table: 'quote_line', count: 3 });
    expect(v!.message).toContain('3 quote lines');
  });

  it('uses the singular form for exactly one child', async () => {
    responses = [{ rows: [{ count: 1 }] }];
    const v = await checkDeleteRestrictions(
      ENV, { deleteRestrictions: [{ table: 'quote', fk: 'user_id', label: 'quote' }] }, 1
    );
    expect(v!.message).toContain('1 quote ');
    expect(v!.message).not.toContain('1 quotes');
  });

  it('honors a custom override message', async () => {
    responses = [{ rows: [{ count: 2 }] }];
    const v = await checkDeleteRestrictions(
      ENV, { deleteRestrictions: [{ table: 'quote', fk: 'user_id', message: 'nope' }] }, 1
    );
    expect(v!.message).toBe('nope');
  });

  it('returns null when the schema has no restrictions', async () => {
    expect(await checkDeleteRestrictions(ENV, {}, 1)).toBeNull();
    expect(calls).toHaveLength(0);
  });
});
