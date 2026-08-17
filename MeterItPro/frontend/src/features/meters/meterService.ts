// RegisterMap TypeScript type
export type RegisterMap = {
  id?: string;
  meter_id?: string;
  [key: string]: any;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface MeterMapTemplate {
  id: number;
  name: string;
  createdAt: string;
  manufacturer: string;
  model: string;  
  description: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

class MeterService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
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
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Fetch all meter map templates from the database
   */
  async getMeterMapTemplates(): Promise<MeterMapTemplate[]> {
    const response = await this.request<ApiResponse<MeterMapTemplate[]>>('/meters/maps/templates');
    return response.data;
  }
}

export const meterService = new MeterService();
export default meterService;