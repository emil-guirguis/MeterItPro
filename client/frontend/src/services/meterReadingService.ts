import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { DetailedMeterReading, MeterReadingStats } from '../types/entities';

// API base URL - this would typically come from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

class MeterReadingService {
  private apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Add request interceptor to include auth token
    this.apiClient.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  // Get all meter readings with filtering and pagination
  async getMeterReadings(params?: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    meterId?: string;
    quality?: 'good' | 'estimated' | 'questionable';
  }): Promise<{
    items: DetailedMeterReading[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
  }> {
    try {
      const response: AxiosResponse<{ success: boolean; data: any }> = await this.apiClient.get('/meterreadings', { params });
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Failed to fetch meter readings';
        throw new Error(message);
      }
      throw new Error('Network error occurred');
    }
  }

  // Get latest readings for dashboard
  async getLatestReadings(): Promise<DetailedMeterReading[]> {
    try {
      const response: AxiosResponse<{ success: boolean; data: DetailedMeterReading[] }> = await this.apiClient.get('/meterreadings/latest');
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Failed to fetch latest readings';
        throw new Error(message);
      }
      throw new Error('Network error occurred');
    }
  }

  // Get meter reading by ID
  async getMeterReading(id: string): Promise<DetailedMeterReading> {
    try {
      const response: AxiosResponse<{ success: boolean; data: DetailedMeterReading }> = await this.apiClient.get(`/meterreadings/${id}`);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Failed to fetch meter reading';
        throw new Error(message);
      }
      throw new Error('Network error occurred');
    }
  }

  // Get readings by meter ID
  async getReadingsByMeterId(meterId: string, params?: {
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<DetailedMeterReading[]> {
    try {
      const response: AxiosResponse<{ success: boolean; data: DetailedMeterReading[] }> = await this.apiClient.get(`/meterreadings/meter/${meterId}`, { params });
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Failed to fetch meter readings';
        throw new Error(message);
      }
      throw new Error('Network error occurred');
    }
  }

  // Get last meter reading for a specific meter element
  async getLastMeterReading(tenantId: string, meterId: string, meterElementId: string): Promise<any> {
    try {
      const response: AxiosResponse<{ success: boolean; data: any }> = await this.apiClient.get(
        `/meterreadings/last`,
        {
          params: {
            tenantId,
            meterId,
            meterElementId
          }
        }
      );
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Failed to fetch last meter reading';
        throw new Error(message);
      }
      throw new Error('Network error occurred');
    }
  }

  // Get summed last reading for a virtual meter (sums latest kwh from all components)
  async getVirtualMeterLastReading(tenantId: string, meterId: string): Promise<any> {
    try {
      const response: AxiosResponse<{ success: boolean; data: any }> = await this.apiClient.get(
        `/meterreadings/virtual-last`,
        { params: { tenantId, meterId } }
      );
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Failed to fetch virtual meter reading';
        throw new Error(message);
      }
      throw new Error('Network error occurred');
    }
  }

  // Get aggregated consumption data for graph display
  async getConsumptionData(meterId: string, meterElementId: string, timePeriod: string, startDate: string, endDate: string, tzOffset: number): Promise<{ label_key: string | number; calculated_kwh: number }[]> {
    try {
      const response: AxiosResponse<{ success: boolean; data: any[] }> = await this.apiClient.get('/meterreadings/consumption', {
        params: { meterId, meterElementId, timePeriod, startDate, endDate, tzOffset },
      });
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Failed to fetch consumption data';
        throw new Error(message);
      }
      throw new Error('Network error occurred');
    }
  }

  // Get aggregated demand data for graph display
  async getDemandData(meterId: string, meterElementId: string, timePeriod: string, startDate: string, endDate: string, tzOffset: number): Promise<{ label_key: string | number; power: number }[]> {
    try {
      const response: AxiosResponse<{ success: boolean; data: any[] }> = await this.apiClient.get('/meterreadings/demand', {
        params: { meterId, meterElementId, timePeriod, startDate, endDate, tzOffset },
      });
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Failed to fetch demand data';
        throw new Error(message);
      }
      throw new Error('Network error occurred');
    }
  }

  // Get per-component latest kWh for a virtual meter
  async getVirtualComponentsLast(meterId: string): Promise<{ select_meter_element_id: number; kwh: number }[]> {
    try {
      const response: AxiosResponse<{ success: boolean; data: any[] }> = await this.apiClient.get('/meterreadings/virtual-components-last', {
        params: { meterId },
      });
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Failed to fetch virtual component readings';
        throw new Error(message);
      }
      throw new Error('Network error occurred');
    }
  }

  // Get aggregated consumption summed across all meter_virtual components
  async getVirtualConsumptionData(meterId: string, timePeriod: string, startDate: string, endDate: string, tzOffset: number, excludeIds?: number[], operationOverrides?: Map<number, '+' | '-'>): Promise<{ label_key: string | number; calculated_kwh: number }[]> {
    try {
      const params: any = { meterId, timePeriod, startDate, endDate, tzOffset };
      if (excludeIds && excludeIds.length > 0) params.excludeIds = excludeIds.join(',');
      if (operationOverrides && operationOverrides.size > 0) {
        params.overrides = Array.from(operationOverrides.entries()).map(([id, op]) => `${id}:${op}`).join(',');
      }
      const response: AxiosResponse<{ success: boolean; data: any[] }> = await this.apiClient.get('/meterreadings/virtual-consumption', { params });
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Failed to fetch virtual consumption data';
        throw new Error(message);
      }
      throw new Error('Network error occurred');
    }
  }

  // Get aggregated demand summed across all meter_virtual components
  async getVirtualDemandData(meterId: string, timePeriod: string, startDate: string, endDate: string, tzOffset: number, excludeIds?: number[], operationOverrides?: Map<number, '+' | '-'>): Promise<{ label_key: string | number; power: number }[]> {
    try {
      const params: any = { meterId, timePeriod, startDate, endDate, tzOffset };
      if (excludeIds && excludeIds.length > 0) params.excludeIds = excludeIds.join(',');
      if (operationOverrides && operationOverrides.size > 0) {
        params.overrides = Array.from(operationOverrides.entries()).map(([id, op]) => `${id}:${op}`).join(',');
      }
      const response: AxiosResponse<{ success: boolean; data: any[] }> = await this.apiClient.get('/meterreadings/virtual-demand', { params });
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Failed to fetch virtual demand data';
        throw new Error(message);
      }
      throw new Error('Network error occurred');
    }
  }

  // Get meter statistics
  async getMeterStats(): Promise<MeterReadingStats> {
    try {
      const response: AxiosResponse<{ success: boolean; data: MeterReadingStats }> = await this.apiClient.get('/meterreadings/stats/summary');
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Failed to fetch meter statistics';
        throw new Error(message);
      }
      throw new Error('Network error occurred');
    }
  }
}

// Export singleton instance
export const meterReadingService = new MeterReadingService();
export default meterReadingService;