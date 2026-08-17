import { createEntityStore, createEntityHook } from '../store/slices/createEntitySlice';
import { withTokenRefresh } from '../store/middleware/apiMiddleware';
import type { ListParams } from '../types/entities';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface SupportDevice {
  id: string;
  device_id: number;
  manufacturer: string;
  model_number: string;
  description: string;
  type: string;
  number_of_elements: number;
  default_price: number;
  active: boolean;
}

class SupportDeviceAPI {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({})) as any;
      throw new Error(err.message || `HTTP ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  private normalize(d: any): SupportDevice {
    return { ...d, id: String(d.device_id) };
  }

  async getAll(_params?: ListParams): Promise<{ items: SupportDevice[]; total: number; hasMore: boolean }> {
    const res = await this.request<any>('/support/devices');
    const items = (res.data?.items ?? []).map((d: any) => this.normalize(d));
    return { items, total: items.length, hasMore: false };
  }

  async getById(id: string): Promise<SupportDevice> {
    const res = await this.request<any>('/support/devices');
    const items = (res.data?.items ?? []).map((d: any) => this.normalize(d));
    const found = items.find((d: SupportDevice) => d.id === id);
    if (!found) throw new Error('Device not found');
    return found;
  }

  async create(data: Partial<SupportDevice>): Promise<SupportDevice> {
    const res = await this.request<any>('/support/devices', { method: 'POST', body: JSON.stringify(data) });
    return this.normalize(res.data);
  }

  async update(id: string, data: Partial<SupportDevice>): Promise<SupportDevice> {
    const res = await this.request<any>(`/support/devices/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return this.normalize(res.data);
  }

  async deactivate(id: string): Promise<SupportDevice> {
    const res = await this.request<any>(`/support/devices/${id}/deactivate`, { method: 'PATCH' });
    return this.normalize(res.data);
  }

  async activate(id: string): Promise<SupportDevice> {
    const res = await this.request<any>(`/support/devices/${id}/activate`, { method: 'PATCH' });
    return this.normalize(res.data);
  }

  async delete(_id: string): Promise<void> {
    throw new Error('Devices cannot be deleted — use deactivate instead');
  }
}

const api = new SupportDeviceAPI();

const supportDevicesService = {
  async getAll(params?: ListParams) { return withTokenRefresh(() => api.getAll(params)); },
  async getById(id: string)        { return withTokenRefresh(() => api.getById(id)); },
  async create(data: Partial<SupportDevice>) { return withTokenRefresh(() => api.create(data)); },
  async update(id: string, data: Partial<SupportDevice>) { return withTokenRefresh(() => api.update(id, data)); },
  async delete(_id: string): Promise<void> { throw new Error('Delete not supported'); },
};

export const useSupportDevicesStore = createEntityStore(supportDevicesService, {
  name: 'device',
  cache: { ttl: 5 * 60 * 1000, maxAge: 30 * 60 * 1000 },
});

export const useSupportDevices = createEntityHook(useSupportDevicesStore);
export const useSupportDevicesEnhanced = () => useSupportDevices();

export const supportDeviceAPI = api;
