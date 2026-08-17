import { createEntityStore, createEntityHook, type EntityService } from '../store/slices/createEntitySlice';
import { withTokenRefresh } from '../store/middleware/apiMiddleware';
import type { ListParams } from '../types/entities';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface CostEntity {
  id: string;
  cost_id: number;
  name: string;
  quantity: number;
  rate: number;
  active: boolean;
  modified_by_users_id: number | null;
  created_at: string;
  updated_at: string;
}

class CostAPI {
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

  private normalize(c: any): CostEntity {
    return { ...c, id: String(c.cost_id) };
  }

  async getAll(_params?: ListParams): Promise<{ items: CostEntity[]; total: number; hasMore: boolean }> {
    const res = await this.request<any>('/admin/costs');
    const items = (res.data?.items ?? []).map((c: any) => this.normalize(c));
    return { items, total: items.length, hasMore: false };
  }

  async getById(id: string): Promise<CostEntity> {
    const res = await this.request<any>(`/admin/costs/${id}`);
    return this.normalize(res.data);
  }

  async create(data: Partial<CostEntity>): Promise<CostEntity> {
    const res = await this.request<any>('/admin/costs', { method: 'POST', body: JSON.stringify(data) });
    return this.normalize(res.data);
  }

  async update(id: string, data: Partial<CostEntity>): Promise<CostEntity> {
    const res = await this.request<any>(`/admin/costs/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return this.normalize(res.data);
  }

  async delete(id: string): Promise<void> {
    await this.request(`/admin/costs/${id}`, { method: 'DELETE' });
  }
}

const api = new CostAPI();

const costsService: EntityService<CostEntity> = {
  async getAll(params?: any) {
    return withTokenRefresh(() => api.getAll(params));
  },
  async getById(id: string) {
    return withTokenRefresh(() => api.getById(id));
  },
  async create(data: Partial<CostEntity>) {
    return withTokenRefresh(() => api.create(data));
  },
  async update(id: string, data: Partial<CostEntity>) {
    return withTokenRefresh(() => api.update(id, data));
  },
  async delete(id: string): Promise<void> {
    return withTokenRefresh(() => api.delete(id));
  },
};

export const useCostsStore = createEntityStore(costsService, {
  name: 'admin_cost',
  cache: { ttl: 5 * 60 * 1000, maxAge: 30 * 60 * 1000 },
});

export const useCosts = createEntityHook(useCostsStore);

export const useCostsEnhanced = () => useCosts();
