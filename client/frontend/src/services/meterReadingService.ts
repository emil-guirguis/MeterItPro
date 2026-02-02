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