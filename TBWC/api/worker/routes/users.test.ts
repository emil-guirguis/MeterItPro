import { describe, it, expect, vi, beforeEach } from 'vitest';

// Controllable auth: flip `currentUser.is_admin` to exercise the admin gate.
let currentUser: any = { id: 'admin', is_admin: true };

vi.mock('../middleware', () => ({
  authenticateToken: (c: any, next: any) => {
    if (!currentUser) return c.json({ success: false, message: 'Access token required' }, 401);
    c.set('user', currentUser);
    c.set('userId', currentUser.id);
    return next();
  },
  requireAdmin: (c: any, next: any) =>
    currentUser?.is_admin ? next() : c.json({ success: false, message: 'Admin access required' }, 403),
}));

const mockFindAll = vi.fn();
const mockFindById = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockRemove = vi.fn();

vi.mock('../crud', () => ({
  findAll: (...a: any[]) => mockFindAll(...a),
  findById: (...a: any[]) => mockFindById(...a),
  create: (...a: any[]) => mockCreate(...a),
  update: (...a: any[]) => mockUpdate(...a),
  remove: (...a: any[]) => mockRemove(...a),
}));

import usersApp from './users';

const ENV = {} as any;
const req = (path: string, init?: RequestInit) => usersApp.request(path, init, ENV);
const json = (method: string, body: any) => ({
  method, body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
});

beforeEach(() => {
  vi.clearAllMocks();
  currentUser = { id: 'admin', is_admin: true };
});

describe('admin gate', () => {
  it('403 when the caller is not an admin', async () => {
    currentUser = { id: 'u2', is_admin: false };
    const res = await req('/');
    expect(res.status).toBe(403);
    expect(mockFindAll).not.toHaveBeenCalled();
  });
});

describe('GET /users', () => {
  it('returns the framework list envelope {data:{items,total}}', async () => {
    mockFindAll.mockResolvedValue({ rows: [{ id: '1' }], pagination: { total: 1 } });
    const res = await req('/');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, data: { items: [{ id: '1' }], total: 1 } });
  });

  it('forwards paging/search/sort query params to findAll', async () => {
    mockFindAll.mockResolvedValue({ rows: [], pagination: { total: 0 } });
    await req('/?page=2&limit=50&search=acme&sortBy=email&sortOrder=asc');
    expect(mockFindAll).toHaveBeenCalledWith(ENV, expect.objectContaining({
      table: 'users', primaryKey: 'id', page: 2, limit: 50,
      search: 'acme', sortBy: 'email', sortOrder: 'asc',
    }));
  });

  it('defaults page/limit when omitted', async () => {
    mockFindAll.mockResolvedValue({ rows: [], pagination: { total: 0 } });
    await req('/');
    expect(mockFindAll).toHaveBeenCalledWith(ENV, expect.objectContaining({ page: 1, limit: 25 }));
  });
});

describe('GET /users/:id', () => {
  it('returns the row when found', async () => {
    mockFindById.mockResolvedValue({ id: '9' });
    const res = await req('/9');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, data: { id: '9' } });
  });

  it('404 when not found', async () => {
    mockFindById.mockResolvedValue(null);
    const res = await req('/nope');
    expect(res.status).toBe(404);
  });
});

describe('POST /users', () => {
  it('creates and returns 201', async () => {
    mockCreate.mockResolvedValue({ id: 'new', first_name: 'A' });
    const res = await req('/', json('POST', { first_name: 'A' }));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ success: true, data: { id: 'new', first_name: 'A' } });
  });

  it('normalizes an empty qb_sales_rep_id to null before insert', async () => {
    mockCreate.mockResolvedValue({ id: 'new' });
    await req('/', json('POST', { first_name: 'A', qb_sales_rep_id: '' }));
    expect(mockCreate).toHaveBeenCalledWith(ENV, 'users',
      expect.objectContaining({ qb_sales_rep_id: null }));
  });

  it('leaves a real qb_sales_rep_id untouched', async () => {
    mockCreate.mockResolvedValue({ id: 'new' });
    await req('/', json('POST', { qb_sales_rep_id: 42 }));
    expect(mockCreate).toHaveBeenCalledWith(ENV, 'users',
      expect.objectContaining({ qb_sales_rep_id: 42 }));
  });
});

describe('PUT /users/:id', () => {
  it('updates and returns the row', async () => {
    mockUpdate.mockResolvedValue({ id: '9', first_name: 'B' });
    const res = await req('/9', json('PUT', { first_name: 'B' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, data: { id: '9', first_name: 'B' } });
  });

  it('404 when the row is missing or nothing changed', async () => {
    mockUpdate.mockResolvedValue(null);
    const res = await req('/9', json('PUT', { first_name: 'B' }));
    expect(res.status).toBe(404);
  });

  it('normalizes qb_sales_rep_id on update too', async () => {
    mockUpdate.mockResolvedValue({ id: '9' });
    await req('/9', json('PUT', { qb_sales_rep_id: '' }));
    expect(mockUpdate).toHaveBeenCalledWith(ENV, 'users', 'id', '9',
      expect.objectContaining({ qb_sales_rep_id: null }));
  });
});

describe('DELETE /users/:id', () => {
  it('deletes and returns the removed row', async () => {
    mockRemove.mockResolvedValue({ id: '9' });
    const res = await req('/9', { method: 'DELETE' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, data: { id: '9' } });
  });

  it('404 when nothing was deleted', async () => {
    mockRemove.mockResolvedValue(null);
    const res = await req('/9', { method: 'DELETE' });
    expect(res.status).toBe(404);
  });
});
