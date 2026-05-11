import { tokenStorage } from '../utils/tokenStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

function authHeaders(): HeadersInit {
  const token = tokenStorage.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface ClientTenant {
  tenant_id: number;
  name: string;
  url: string | null;
  contact_email: string | null;
  active: boolean;
  created_at: string;
}

export interface Tenant extends ClientTenant {
  timezone: string | null;
  currency: string | null;
  language: string | null;
  date_format: string | null;
  time_format: string | null;
  default_page_size: number | null;
  street: string | null;
  street2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  meter_reading_batch_count: number;
  updated_at: string;
}

export async function listClients(): Promise<ClientTenant[]> {
  const res = await fetch(`${API_BASE_URL}/admin/clients`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch clients');
  const json = await res.json();
  return json.data?.items ?? [];
}

export async function getTenant(id: number): Promise<Tenant> {
  const res = await fetch(`${API_BASE_URL}/admin/clients/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch tenant');
  const json = await res.json() as { data: Tenant };
  return json.data;
}

export async function createTenant(data: Partial<Tenant>): Promise<Tenant> {
  const res = await fetch(`${API_BASE_URL}/admin/clients`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json() as { data?: Tenant; message?: string };
  if (!res.ok) throw new Error(json.message || 'Failed to create tenant');
  return json.data!;
}

export async function updateTenant(id: number, data: Partial<Tenant>): Promise<Tenant> {
  const res = await fetch(`${API_BASE_URL}/admin/clients/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json() as { data?: Tenant; message?: string };
  if (!res.ok) throw new Error(json.message || 'Failed to update tenant');
  return json.data!;
}

// ── Costs ─────────────────────────────────────────────────────────────────────

export interface Cost {
  cost_id: number;
  name: string;
  quantity: number;
  rate: number;
  active: boolean;
  modified_by_users_id: number | null;
  created_at: string;
  updated_at: string;
}

export async function listCosts(): Promise<Cost[]> {
  const res = await fetch(`${API_BASE_URL}/admin/costs`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch costs');
  const json = await res.json();
  return json.data?.items ?? [];
}

export async function createCost(data: Omit<Cost, 'cost_id' | 'created_at' | 'updated_at'>): Promise<Cost> {
  const res = await fetch(`${API_BASE_URL}/admin/costs`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  const json = await res.json() as { data?: Cost; message?: string };
  if (!res.ok) throw new Error(json.message || 'Failed to create cost');
  return json.data!;
}

export async function updateCost(id: number, data: Omit<Cost, 'cost_id' | 'created_at' | 'updated_at'>): Promise<Cost> {
  const res = await fetch(`${API_BASE_URL}/admin/costs/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  const json = await res.json() as { data?: Cost; message?: string };
  if (!res.ok) throw new Error(json.message || 'Failed to update cost');
  return json.data!;
}

export async function deleteCost(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/admin/costs/${id}`, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to delete cost');
}

// ── Device catalog ────────────────────────────────────────────────────────────

export interface DeviceCatalog {
  device_id: number;
  manufacturer: string;
  model_number: string;
  description: string;
  type: string;
  number_of_elements: number;
  default_price: number;
}

export async function listDeviceCatalog(): Promise<DeviceCatalog[]> {
  const res = await fetch(`${API_BASE_URL}/admin/devices`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch device catalog');
  const json = await res.json() as { data: { items: DeviceCatalog[] } };
  return json.data?.items ?? [];
}

export async function createDevice(data: Partial<DeviceCatalog>): Promise<DeviceCatalog> {
  const res = await fetch(`${API_BASE_URL}/admin/devices`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
  });
  const json = await res.json() as { data?: DeviceCatalog; message?: string };
  if (!res.ok) throw new Error(json.message || 'Failed to create device');
  return json.data!;
}

export async function updateDevice(deviceId: number, data: Partial<DeviceCatalog>): Promise<DeviceCatalog> {
  const res = await fetch(`${API_BASE_URL}/admin/devices/${deviceId}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(data),
  });
  const json = await res.json() as { data?: DeviceCatalog; message?: string };
  if (!res.ok) throw new Error(json.message || 'Failed to update device');
  return json.data!;
}

export async function deleteDevice(deviceId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/admin/devices/${deviceId}`, {
    method: 'DELETE', headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete device');
}

// ── Tenant equipment ──────────────────────────────────────────────────────────

export interface TenantEquipment {
  tenant_device_id: number;
  tenant_id: number;
  device_id: number;
  quantity: number;
  price: number;
  manufacturer: string;
  model_number: string;
  description: string;
  type: string;
}

export async function listEquipment(tenantId: number): Promise<TenantEquipment[]> {
  const res = await fetch(`${API_BASE_URL}/admin/clients/${tenantId}/equipment`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch equipment');
  const json = await res.json() as { data: { items: TenantEquipment[] } };
  return json.data?.items ?? [];
}

export async function addEquipment(tenantId: number, deviceId: number, quantity: number, price: number): Promise<TenantEquipment> {
  const res = await fetch(`${API_BASE_URL}/admin/clients/${tenantId}/equipment`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify({ device_id: deviceId, quantity, price }),
  });
  const json = await res.json() as { data?: TenantEquipment; message?: string };
  if (!res.ok) throw new Error(json.message || 'Failed to add equipment');
  return json.data!;
}

export async function updateEquipment(tenantId: number, equipmentId: number, quantity: number, price: number): Promise<TenantEquipment> {
  const res = await fetch(`${API_BASE_URL}/admin/clients/${tenantId}/equipment/${equipmentId}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify({ quantity, price }),
  });
  const json = await res.json() as { data?: TenantEquipment; message?: string };
  if (!res.ok) throw new Error(json.message || 'Failed to update equipment');
  return json.data!;
}

export async function removeEquipment(tenantId: number, equipmentId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/admin/clients/${tenantId}/equipment/${equipmentId}`, {
    method: 'DELETE', headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to remove equipment');
}

// ── Tenant costs ──────────────────────────────────────────────────────────────

export interface TenantCost {
  tenant_cost_id: number;
  tenant_id: number;
  description: string;
  cost_type: string;
  amount: number;
  billing_cycle: string;
  effective_date: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
}

export async function listTenantCosts(tenantId: number): Promise<TenantCost[]> {
  const res = await fetch(`${API_BASE_URL}/admin/clients/${tenantId}/costs`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch costs');
  const json = await res.json() as { data: { items: TenantCost[] } };
  return json.data?.items ?? [];
}

export async function createTenantCost(tenantId: number, data: Partial<TenantCost>): Promise<TenantCost> {
  const res = await fetch(`${API_BASE_URL}/admin/clients/${tenantId}/costs`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
  });
  const json = await res.json() as { data?: TenantCost; message?: string };
  if (!res.ok) throw new Error(json.message || 'Failed to create cost');
  return json.data!;
}

export async function updateTenantCost(tenantId: number, costId: number, data: Partial<TenantCost>): Promise<TenantCost> {
  const res = await fetch(`${API_BASE_URL}/admin/clients/${tenantId}/costs/${costId}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(data),
  });
  const json = await res.json() as { data?: TenantCost; message?: string };
  if (!res.ok) throw new Error(json.message || 'Failed to update cost');
  return json.data!;
}

export async function removeTenantCost(tenantId: number, costId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/admin/clients/${tenantId}/costs/${costId}`, {
    method: 'DELETE', headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete cost');
}

// ── Tenant documents ──────────────────────────────────────────────────────────

export interface TenantDocument {
  tenant_document_id: number;
  tenant_id: number;
  description: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export async function listTenantDocuments(tenantId: number): Promise<TenantDocument[]> {
  const res = await fetch(`${API_BASE_URL}/admin/clients/${tenantId}/documents`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch documents');
  const json = await res.json() as { data: { items: TenantDocument[] } };
  return json.data?.items ?? [];
}

export async function createTenantDocument(tenantId: number, data: { description: string; file_name: string; file_type: string; file_size: number; file_data: string }): Promise<TenantDocument> {
  const res = await fetch(`${API_BASE_URL}/admin/clients/${tenantId}/documents`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
  });
  const json = await res.json() as { data?: TenantDocument; message?: string };
  if (!res.ok) throw new Error(json.message || 'Failed to create document');
  return json.data!;
}

export async function updateTenantDocument(tenantId: number, docId: number, description: string): Promise<TenantDocument> {
  const res = await fetch(`${API_BASE_URL}/admin/clients/${tenantId}/documents/${docId}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify({ description }),
  });
  const json = await res.json() as { data?: TenantDocument; message?: string };
  if (!res.ok) throw new Error(json.message || 'Failed to update document');
  return json.data!;
}

export async function removeTenantDocument(tenantId: number, docId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/admin/clients/${tenantId}/documents/${docId}`, {
    method: 'DELETE', headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete document');
}

export async function downloadTenantDocument(tenantId: number, docId: number): Promise<{ file_name: string; file_type: string; file_data: string }> {
  const res = await fetch(`${API_BASE_URL}/admin/clients/${tenantId}/documents/${docId}/download`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to download document');
  const json = await res.json() as { data: { file_name: string; file_type: string; file_data: string } };
  return json.data;
}

export async function impersonateTenant(tenantId: number): Promise<{ token: string; expiresIn: number; tenantName: string }> {
  const res = await fetch(`${API_BASE_URL}/admin/impersonate/${tenantId}`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to impersonate tenant');
  const json = await res.json();
  return json.data;
}
