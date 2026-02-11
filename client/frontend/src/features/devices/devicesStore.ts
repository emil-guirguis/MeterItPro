/**
 * Devices Store - READ-ONLY
 * 
 * Combines API service and state management for devices.
 * Handles device data fetching only - devices are read-only and managed externally.
 * CREATE, UPDATE, DELETE operations have been removed.
 */

import type { Device } from './deviceConfig';
import { createEntityStore, createEntityHook } from '../../store/slices/createEntitySlice';
import { withTokenRefresh } from '../../store/middleware/apiMiddleware';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// ============================================================================
// API SERVICE (Internal) - READ-ONLY
// ============================================================================

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

interface DeviceListResponse {
  items: Device[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

class DeviceAPI {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getAll(params: any = {}): Promise<{ items: Device[]; total: number; hasMore: boolean }> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    // Flatten filters into query parameters
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]: [string, any]) => {
        // Skip empty, null, or undefined values
        if (value !== '' && value !== null && value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    // Add search parameter if provided
    if (params.search) {
      queryParams.append('search', params.search);
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/device?${queryString}` : '/device';
    
    const response = await this.request<ApiResponse<DeviceListResponse>>(endpoint);
    return {
      items: response.data.items,
      total: response.data.total,
      hasMore: false,
    };
  }

  async getById(id: string | number): Promise<Device> {
    const response = await this.request<ApiResponse<Device>>(`/device/${id}`);
    return response.data;
  }

  // NOTE: CREATE, UPDATE, DELETE methods removed - devices are read-only
}

const api = new DeviceAPI();

// ============================================================================
// STORE CONFIGURATION - READ-ONLY
// ============================================================================

const devicesService = {
  async getAll(params: any = {}): Promise<{ items: Device[]; total: number; hasMore: boolean }> {
    return withTokenRefresh(async () => {
      return await api.getAll(params);
    });
  },

  async getById(id: string | number): Promise<Device> {
    return withTokenRefresh(async () => {
      return await api.getById(id);
    });
  },

  // NOTE: CREATE, UPDATE, DELETE methods removed - devices are read-only
  async create(): Promise<Device> {
    throw new Error('Device creation is not allowed - devices are read-only');
  },

  async update(): Promise<Device> {
    throw new Error('Device updates are not allowed - devices are read-only');
  },

  async delete(): Promise<void> {
    throw new Error('Device deletion is not allowed - devices are read-only');
  },
};

export const useDeviceStore = createEntityStore(devicesService, {
  name: 'device',
  cache: {
    ttl: 10 * 60 * 1000, // 10 minutes
    maxAge: 60 * 60 * 1000, // 1 hour
  },
});

export const useDevice = createEntityHook(useDeviceStore);

// ============================================================================
// ENHANCED HOOK
// ============================================================================

export const useDevicesEnhanced = () => {
  const device = useDevice();
  const items = Array.isArray(device.items) ? device.items : [];

  return {
    ...device,
    items,

    // Computed values
    devicesByType: (type: string) =>
      items.filter(d => d.type.toLowerCase().includes(type.toLowerCase())),

    devicesByManufacturer: (manufacturer: string) =>
      items.filter(d => d.manufacturer.toLowerCase().includes(manufacturer.toLowerCase())),

    devicesByModel: (model: string) =>
      items.filter(d => d.model_number?.toLowerCase().includes(model.toLowerCase())),

    // Statistics
    totalDevices: items.length,
  };
};
