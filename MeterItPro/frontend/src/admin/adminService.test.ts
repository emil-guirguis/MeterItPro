import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../utils/tokenStorage', () => ({
  tokenStorage: {
    getToken: vi.fn(() => 'mock-token'),
  },
}));

import {
  listClients,
  getTenant,
  createTenant,
  updateTenant,
  listCosts,
  createCost,
  updateCost,
  deleteCost,
  listDeviceCatalog,
  createDevice,
  updateDevice,
  deleteDevice,
  listEquipment,
  addEquipment,
  updateEquipment,
  removeEquipment,
  listTenantCosts,
  createTenantCost,
  updateTenantCost,
  removeTenantCost,
  listTenantDocuments,
  createTenantDocument,
  updateTenantDocument,
  removeTenantDocument,
  downloadTenantDocument,
  impersonateTenant,
  type ClientTenant,
  type Cost,
  type DeviceCatalog,
  type TenantEquipment,
  type TenantCost,
  type TenantDocument,
} from './adminService';

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockOk(data: any) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(data),
  });
}

function mockFail(status = 500, message = 'Server error') {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: () => Promise.resolve({ message }),
  });
}

const TENANT: ClientTenant = {
  tenant_id: 1,
  name: 'Acme Corp',
  url: 'https://acme.com',
  contact_email: 'contact@acme.com',
  active: true,
  created_at: '2024-01-01T00:00:00Z',
};

const COST: Cost = {
  cost_id: 1,
  name: 'Setup Fee',
  quantity: 1,
  rate: 500,
  active: true,
  modified_by_users_id: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const DEVICE: DeviceCatalog = {
  device_id: 1,
  manufacturer: 'Acme',
  model_number: 'M100',
  description: 'Smart meter',
  type: 'meter',
  number_of_elements: 2,
  default_price: 300,
};

const EQUIPMENT: TenantEquipment = {
  tenant_device_id: 1,
  tenant_id: 1,
  device_id: 1,
  quantity: 2,
  price: 600,
  manufacturer: 'Acme',
  model_number: 'M100',
  description: 'Smart meter',
  type: 'meter',
};

const TENANT_COST: TenantCost = {
  tenant_cost_id: 1,
  tenant_id: 1,
  description: 'Monthly subscription',
  cost_type: 'subscription',
  amount: 100,
  billing_cycle: 'monthly',
  effective_date: null,
  notes: null,
  active: true,
  created_at: '2024-01-01T00:00:00Z',
};

const DOCUMENT: TenantDocument = {
  tenant_document_id: 1,
  tenant_id: 1,
  description: 'Contract',
  file_name: 'contract.pdf',
  file_type: 'application/pdf',
  file_size: 1024,
  created_at: '2024-01-01T00:00:00Z',
};

describe('adminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── listClients ────────────────────────────────────────────────────────────

  describe('listClients', () => {
    it('returns client list', async () => {
      mockOk({ data: { items: [TENANT] } });
      const result = await listClients();
      expect(result).toEqual([TENANT]);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/clients'),
        expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer mock-token' }) })
      );
    });

    it('throws on failure', async () => {
      mockFail();
      await expect(listClients()).rejects.toThrow('Failed to fetch clients');
    });

    it('returns empty array when data.items is null', async () => {
      mockOk({ data: {} });
      const result = await listClients();
      expect(result).toEqual([]);
    });
  });

  // ── getTenant ──────────────────────────────────────────────────────────────

  describe('getTenant', () => {
    it('returns single tenant', async () => {
      mockOk({ data: TENANT });
      const result = await getTenant(1);
      expect(result.tenant_id).toBe(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/clients/1'),
        expect.any(Object)
      );
    });

    it('throws on failure', async () => {
      mockFail(404, 'Not found');
      await expect(getTenant(999)).rejects.toThrow('Failed to fetch tenant');
    });
  });

  // ── createTenant ───────────────────────────────────────────────────────────

  describe('createTenant', () => {
    it('sends POST and returns new tenant', async () => {
      mockOk({ data: TENANT });
      const result = await createTenant({ name: 'Acme Corp' });
      expect(result).toEqual(TENANT);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/clients'),
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'Acme Corp' }) })
      );
    });

    it('throws with server message on failure', async () => {
      mockFail(400, 'Name is required');
      await expect(createTenant({})).rejects.toThrow('Name is required');
    });
  });

  // ── updateTenant ───────────────────────────────────────────────────────────

  describe('updateTenant', () => {
    it('sends PUT and returns updated tenant', async () => {
      const updated = { ...TENANT, name: 'Updated Corp' };
      mockOk({ data: updated });
      const result = await updateTenant(1, { name: 'Updated Corp' });
      expect(result.name).toBe('Updated Corp');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/clients/1'),
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  // ── listCosts ──────────────────────────────────────────────────────────────

  describe('listCosts', () => {
    it('returns cost list', async () => {
      mockOk({ data: { items: [COST] } });
      const result = await listCosts();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Setup Fee');
    });

    it('throws on failure', async () => {
      mockFail();
      await expect(listCosts()).rejects.toThrow('Failed to fetch costs');
    });
  });

  // ── createCost ─────────────────────────────────────────────────────────────

  describe('createCost', () => {
    it('sends POST and returns new cost', async () => {
      mockOk({ data: COST });
      const { cost_id, created_at, updated_at, ...payload } = COST;
      const result = await createCost(payload);
      expect(result.cost_id).toBe(1);
    });

    it('throws with server message on failure', async () => {
      mockFail(400, 'Name is required');
      const { cost_id, created_at, updated_at, ...payload } = COST;
      await expect(createCost(payload)).rejects.toThrow('Name is required');
    });
  });

  // ── updateCost ─────────────────────────────────────────────────────────────

  describe('updateCost', () => {
    it('sends PUT to correct URL', async () => {
      mockOk({ data: COST });
      const { cost_id, created_at, updated_at, ...payload } = COST;
      await updateCost(1, payload);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/costs/1'),
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  // ── deleteCost ─────────────────────────────────────────────────────────────

  describe('deleteCost', () => {
    it('sends DELETE request', async () => {
      mockOk({});
      await deleteCost(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/costs/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('throws on failure', async () => {
      mockFail();
      await expect(deleteCost(1)).rejects.toThrow('Failed to delete cost');
    });
  });

  // ── listDeviceCatalog ──────────────────────────────────────────────────────

  describe('listDeviceCatalog', () => {
    it('returns device list', async () => {
      mockOk({ data: { items: [DEVICE] } });
      const result = await listDeviceCatalog();
      expect(result).toHaveLength(1);
      expect(result[0].manufacturer).toBe('Acme');
    });
  });

  // ── createDevice ───────────────────────────────────────────────────────────

  describe('createDevice', () => {
    it('sends POST and returns device', async () => {
      mockOk({ data: DEVICE });
      const result = await createDevice({ manufacturer: 'Acme', model_number: 'M100', type: 'meter' });
      expect(result.device_id).toBe(1);
    });
  });

  // ── updateDevice ───────────────────────────────────────────────────────────

  describe('updateDevice', () => {
    it('sends PUT to correct device URL', async () => {
      mockOk({ data: DEVICE });
      await updateDevice(1, { manufacturer: 'NewCo' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/devices/1'),
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  // ── deleteDevice ───────────────────────────────────────────────────────────

  describe('deleteDevice', () => {
    it('sends DELETE for device', async () => {
      mockOk({});
      await deleteDevice(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/devices/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('throws on failure', async () => {
      mockFail();
      await expect(deleteDevice(1)).rejects.toThrow('Failed to delete device');
    });
  });

  // ── listEquipment ──────────────────────────────────────────────────────────

  describe('listEquipment', () => {
    it('returns equipment for tenant', async () => {
      mockOk({ data: { items: [EQUIPMENT] } });
      const result = await listEquipment(1);
      expect(result).toHaveLength(1);
      expect(result[0].tenant_device_id).toBe(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/clients/1/equipment'),
        expect.any(Object)
      );
    });
  });

  // ── addEquipment ───────────────────────────────────────────────────────────

  describe('addEquipment', () => {
    it('sends POST with device_id, quantity, price', async () => {
      mockOk({ data: EQUIPMENT });
      await addEquipment(1, 2, 3, 600);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/clients/1/equipment'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ device_id: 2, quantity: 3, price: 600 }),
        })
      );
    });
  });

  // ── updateEquipment ────────────────────────────────────────────────────────

  describe('updateEquipment', () => {
    it('sends PUT to equipment URL', async () => {
      mockOk({ data: EQUIPMENT });
      await updateEquipment(1, 10, 5, 1000);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/clients/1/equipment/10'),
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  // ── removeEquipment ────────────────────────────────────────────────────────

  describe('removeEquipment', () => {
    it('sends DELETE to equipment URL', async () => {
      mockOk({});
      await removeEquipment(1, 10);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/clients/1/equipment/10'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('throws on failure', async () => {
      mockFail();
      await expect(removeEquipment(1, 10)).rejects.toThrow('Failed to remove equipment');
    });
  });

  // ── listTenantCosts ────────────────────────────────────────────────────────

  describe('listTenantCosts', () => {
    it('returns costs for tenant', async () => {
      mockOk({ data: { items: [TENANT_COST] } });
      const result = await listTenantCosts(1);
      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('Monthly subscription');
    });
  });

  // ── createTenantCost ───────────────────────────────────────────────────────

  describe('createTenantCost', () => {
    it('sends POST and returns cost', async () => {
      mockOk({ data: TENANT_COST });
      const result = await createTenantCost(1, { description: 'Monthly', amount: 100 });
      expect(result.tenant_cost_id).toBe(1);
    });

    it('throws with server message on failure', async () => {
      mockFail(400, 'Description is required');
      await expect(createTenantCost(1, {})).rejects.toThrow('Description is required');
    });
  });

  // ── updateTenantCost ───────────────────────────────────────────────────────

  describe('updateTenantCost', () => {
    it('sends PUT to correct URL', async () => {
      mockOk({ data: TENANT_COST });
      await updateTenantCost(1, 5, { description: 'Updated', amount: 200 });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/clients/1/costs/5'),
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  // ── removeTenantCost ───────────────────────────────────────────────────────

  describe('removeTenantCost', () => {
    it('sends DELETE request', async () => {
      mockOk({});
      await removeTenantCost(1, 5);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/clients/1/costs/5'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  // ── listTenantDocuments ────────────────────────────────────────────────────

  describe('listTenantDocuments', () => {
    it('returns document list for tenant', async () => {
      mockOk({ data: { items: [DOCUMENT] } });
      const result = await listTenantDocuments(1);
      expect(result).toHaveLength(1);
      expect(result[0].file_name).toBe('contract.pdf');
    });
  });

  // ── createTenantDocument ───────────────────────────────────────────────────

  describe('createTenantDocument', () => {
    it('sends POST with file data', async () => {
      mockOk({ data: DOCUMENT });
      await createTenantDocument(1, {
        description: 'Contract',
        file_name: 'contract.pdf',
        file_type: 'application/pdf',
        file_size: 1024,
        file_data: 'base64==',
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/clients/1/documents'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  // ── updateTenantDocument ───────────────────────────────────────────────────

  describe('updateTenantDocument', () => {
    it('sends PUT with description only', async () => {
      mockOk({ data: DOCUMENT });
      await updateTenantDocument(1, 3, 'New description');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/clients/1/documents/3'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ description: 'New description' }),
        })
      );
    });
  });

  // ── removeTenantDocument ───────────────────────────────────────────────────

  describe('removeTenantDocument', () => {
    it('sends DELETE request', async () => {
      mockOk({});
      await removeTenantDocument(1, 3);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/clients/1/documents/3'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('throws on failure', async () => {
      mockFail();
      await expect(removeTenantDocument(1, 3)).rejects.toThrow('Failed to delete document');
    });
  });

  // ── downloadTenantDocument ─────────────────────────────────────────────────

  describe('downloadTenantDocument', () => {
    it('returns file data', async () => {
      mockOk({ data: { file_name: 'test.pdf', file_type: 'application/pdf', file_data: 'base64==' } });
      const result = await downloadTenantDocument(1, 3);
      expect(result.file_name).toBe('test.pdf');
      expect(result.file_data).toBe('base64==');
    });

    it('throws on failure', async () => {
      mockFail();
      await expect(downloadTenantDocument(1, 3)).rejects.toThrow('Failed to download document');
    });
  });

  // ── impersonateTenant ──────────────────────────────────────────────────────

  describe('impersonateTenant', () => {
    it('sends POST and returns token data', async () => {
      mockOk({ data: { token: 'jwt-token', expiresIn: 28800, tenantName: 'Acme Corp' } });
      const result = await impersonateTenant(1);
      expect(result.token).toBe('jwt-token');
      expect(result.tenantName).toBe('Acme Corp');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/impersonate/1'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('throws on failure', async () => {
      mockFail(404, 'Tenant not found');
      await expect(impersonateTenant(999)).rejects.toThrow('Failed to impersonate tenant');
    });

    it('sends auth header', async () => {
      mockOk({ data: { token: 'jwt', expiresIn: 100, tenantName: 'X' } });
      await impersonateTenant(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer mock-token' }),
        })
      );
    });
  });
});
