import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { Meter, MeterElement, MeterReading } from '../components/sidebar-meters/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

class MetersService {
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

  /**
   * Get all meters for a specific tenant
   * @param tenantId - The tenant ID
   * @returns Promise<Meter[]> - Array of meters
   */
  async getMetersForTenant(tenantId: string): Promise<Meter[]> {
    try {
      const response: AxiosResponse<{ success: boolean; data: Meter[] }> = await this.apiClient.get(
        `/dashboard/meters`,
        { params: { tenantId } }
      );
      return response.data.data || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Failed to fetch meters';
        throw new Error(message);
      }
      throw new Error('Network error occurred');
    }
  }

  /**
   * Get all meter elements for a specific meter
   * @param meterId - The meter ID
   * @returns Promise<MeterElement[]> - Array of meter elements
   */
  async getMeterElements(meterId: string): Promise<MeterElement[]> {
    try {
      const response: AxiosResponse<{ success: boolean; data: MeterElement[] }> = await this.apiClient.get(
        `/dashboard/meters/${meterId}/elements`
      );
      return response.data.data || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Failed to fetch meter elements';
        throw new Error(message);
      }
      throw new Error('Network error occurred');
    }
  }

  /**
   * Get meter readings for a specific meter
   * @param meterId - The meter ID
   * @param limit - Optional limit on number of readings
   * @returns Promise<MeterReading[]> - Array of meter readings sorted by created_date descending
   */
  async getMeterReadings(meterId: string, limit?: number): Promise<MeterReading[]> {
    try {
      const params: { [key: string]: any } = {};
      if (limit) {
        params.limit = limit;
      }
      
      const response: AxiosResponse<{ success: boolean; data: MeterReading[] }> = await this.apiClient.get(
        `/dashboard/meters/${meterId}/readings`,
        { params }
      );
      
      const readings = response.data.data || [];
      // Sort by created_date descending (newest first)
      return readings.sort((a, b) => {
        const dateA = new Date(a.createdDate).getTime();
        const dateB = new Date(b.createdDate).getTime();
        return dateB - dateA;
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Failed to fetch meter readings';
        throw new Error(message);
      }
      throw new Error('Network error occurred');
    }
  }

  /**
   * Get meter readings for a specific meter element
   * @param meterId - The meter ID
   * @param elementId - The meter element ID
   * @param limit - Optional limit on number of readings
   * @returns Promise<MeterReading[]> - Array of meter readings sorted by created_date descending
   */
  async getMeterElementReadings(meterId: string, elementId: string, limit?: number): Promise<MeterReading[]> {
    try {
      const params: { [key: string]: any } = {};
      if (limit) {
        params.limit = limit;
      }
      
      const response: AxiosResponse<{ success: boolean; data: MeterReading[] }> = await this.apiClient.get(
        `/dashboard/meters/${meterId}/elements/${elementId}/readings`,
        { params }
      );
      
      const readings = response.data.data || [];
      // Sort by created_date descending (newest first)
      return readings.sort((a, b) => {
        const dateA = new Date(a.createdDate).getTime();
        const dateB = new Date(b.createdDate).getTime();
        return dateB - dateA;
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || 'Failed to fetch meter element readings';
        throw new Error(message);
      }
      throw new Error('Network error occurred');
    }
  }
}

// Export singleton instance
export const metersService = new MetersService();
export default metersService;
