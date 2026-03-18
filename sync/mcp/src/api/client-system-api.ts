/**
 * Client System API Client
 * 
 * Handles communication with the centralized Client System API.
 * Provides methods for authentication, batch uploads, and configuration downloads.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  MeterReadingEntity,
  ApiClientConfig,
  AuthResponse,
  BatchUploadRequest,
  BatchUploadResponse,
  ConfigDownloadResponse,
} from '../types/index.js';

export class ClientSystemApiClient {
  private client: AxiosInstance;
  private apiKey: string;
  private maxRetries: number;

  constructor(config: ApiClientConfig) {
    this.apiKey = config.apiKey;
    this.maxRetries = config.maxRetries || 5;

    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          const enhancedError = new Error('Client System unreachable');
          (enhancedError as any).code = error.code;
          (enhancedError as any).originalError = error;
          throw enhancedError;
        }
        throw error;
      }
    );
  }

  /**
   * Set or update the API key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.client.defaults.headers['X-API-Key'] = apiKey;
    console.log(`🔑 [ClientSystemApiClient] API key updated: ${apiKey.substring(0, 8)}...`);
  }

  /**
   * Test connectivity to Client System
   */
  async testConnection(): Promise<boolean> {
    try {
      const url = `${this.client.defaults.baseURL}/health`;
      console.log(`🔍 [ClientSystemApiClient] Testing connection to: ${url}`);
      console.log(`🔍 [ClientSystemApiClient] Full URL: ${url}`);
      console.log(`🔍 [ClientSystemApiClient] API Key: ${this.apiKey ? '***' : 'NOT SET'}`);
      
      // Use the health endpoint which is designed for connectivity testing
      const response = await this.client.get('/health', {
        timeout: 5000,
      });
      console.log(`✅ [ClientSystemApiClient] Connection successful - Status: ${response.status}`);
      return response.status === 200;
    } catch (error) {
      const axiosError = error as any;
      console.error(`❌ [ClientSystemApiClient] Connection failed:`, {
        message: error instanceof Error ? error.message : String(error),
        code: axiosError?.code,
        status: axiosError?.response?.status,
        statusText: axiosError?.response?.statusText,
        baseURL: this.client.defaults.baseURL,
        endpoint: '/health',
        fullURL: `${this.client.defaults.baseURL}/health`,
        responseData: axiosError?.response?.data,
      });
      return false;
    }
  }

  /**
   * Authenticate with Client System
   */
  async authenticate(): Promise<AuthResponse> {
    try {
      const response = await this.client.post<AuthResponse>('/sync/auth', {});
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return {
            success: false,
            message: 'Invalid API key',
          };
        }
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          throw new Error('Client System unreachable');
        }
      }
      throw error;
    }
  }

  /**
   * Upload batch of meter readings with retry logic
   */
  async uploadBatch(
    readings: MeterReadingEntity[],
    retryCount: number = 0
  ): Promise<BatchUploadResponse> {
    // Transform readings to API format - include all fields
    const request: BatchUploadRequest = {
      readings: readings.map((r) => ({
        meter_id: r.meter_id,
        meter_element_id: r.meter_element_id ?? null,
        created_at: r.created_at,
        active_energy: r.active_energy ?? null,
        active_energy_export: r.active_energy_export ?? null,
        apparent_energy: r.apparent_energy ?? null,
        apparent_energy_export: r.apparent_energy_export ?? null,
        apparent_power: r.apparent_power ?? null,
        apparent_power_phase_a: r.apparent_power_phase_a ?? null,
        apparent_power_phase_b: r.apparent_power_phase_b ?? null,
        apparent_power_phase_c: r.apparent_power_phase_c ?? null,
        current: r.current ?? null,
        current_line_a: r.current_line_a ?? null,
        current_line_b: r.current_line_b ?? null,
        current_line_c: r.current_line_c ?? null,
        frequency: r.frequency ?? null,
        maximum_demand_real: r.maximum_demand_real ?? null,
        power: r.power ?? null,
        power_factor: r.power_factor ?? null,
        power_factor_phase_a: r.power_factor_phase_a ?? null,
        power_factor_phase_b: r.power_factor_phase_b ?? null,
        power_factor_phase_c: r.power_factor_phase_c ?? null,
        power_phase_a: r.power_phase_a ?? null,
        power_phase_b: r.power_phase_b ?? null,
        power_phase_c: r.power_phase_c ?? null,
        reactive_energy: r.reactive_energy ?? null,
        reactive_energy_export: r.reactive_energy_export ?? null,
        reactive_power: r.reactive_power ?? null,
        reactive_power_phase_a: r.reactive_power_phase_a ?? null,
        reactive_power_phase_b: r.reactive_power_phase_b ?? null,
        reactive_power_phase_c: r.reactive_power_phase_c ?? null,
        voltage_a_b: r.voltage_a_b ?? null,
        voltage_a_n: r.voltage_a_n ?? null,
        voltage_b_c: r.voltage_b_c ?? null,
        voltage_b_n: r.voltage_b_n ?? null,
        voltage_c_a: r.voltage_c_a ?? null,
        voltage_c_n: r.voltage_c_n ?? null,
        voltage_p_n: r.voltage_p_n ?? null,
        voltage_p_p: r.voltage_p_p ?? null,
        voltage_thd: r.voltage_thd ?? null,
        voltage_thd_phase_a: r.voltage_thd_phase_a ?? null,
        voltage_thd_phase_b: r.voltage_thd_phase_b ?? null,
        voltage_thd_phase_c: r.voltage_thd_phase_c ?? null,
        calculated_kwh: r.calculated_kwh ?? null,
      })),
    };

    console.log(`📤 [ClientSystemApiClient] Uploading ${readings.length} readings`);
    console.log(`📤 [ClientSystemApiClient] Reading:`, JSON.stringify(request.readings[0], null, 2));
    console.log(`📤 [ClientSystemApiClient] API URL: ${this.client.defaults.baseURL}`);
    console.log(`📤 [ClientSystemApiClient] API Key: ${this.apiKey.substring(0, 8)}...`);

    try {
      const response = await this.client.post<BatchUploadResponse>(
        '/sync/readings/batch',
        request
      );
      console.log(`✅ [ClientSystemApiClient] Upload response:`, JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      // Handle retryable errors
      if (this.isRetryableError(error) && retryCount < this.maxRetries) {
        const delay = this.calculateBackoff(retryCount);
        await this.sleep(delay);
        return this.uploadBatch(readings, retryCount + 1);
      }

      // Handle non-retryable errors
      if (axios.isAxiosError(error)) {
        console.error(`❌ [ClientSystemApiClient] Axios error:`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });

        if (error.response?.status === 500 && error.response?.data?.errors?.length) {
          console.error(`❌ [ClientSystemApiClient] Insert errors from remote:`);
          for (const e of error.response.data.errors) {
            console.error(`   meter_id=${e.meter_id} code=${e.code} detail=${e.detail} message=${e.error}`);
          }
        }

        if (error.response?.status === 400) {
          return {
            success: false,
            recordsProcessed: 0,
            message: error.response.data?.message || 'Invalid data format',
          };
        }
        if (error.response?.status === 401) {
          return {
            success: false,
            recordsProcessed: 0,
            message: 'Authentication failed',
          };
        }
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          throw new Error('Client System unreachable');
        }
      }

      throw error;
    }
  }

  /**
   * Download configuration from Client System
   */
  async downloadConfig(): Promise<ConfigDownloadResponse> {
    try {
      const response = await this.client.get<ConfigDownloadResponse>('/sync/config');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Authentication failed');
        }
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          throw new Error('Client System unreachable');
        }
      }
      throw error;
    }
  }



  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (axios.isAxiosError(error)) {
      // Network errors are retryable
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return false; // These should be handled as offline
      }
      // 5xx server errors are retryable
      if (error.response && error.response.status >= 500) {
        return true;
      }
      // 429 rate limit is retryable
      if (error.response?.status === 429) {
        return true;
      }
    }
    return false;
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(retryCount: number): number {
    const baseDelay = 2000; // 2 seconds
    return Math.min(baseDelay * Math.pow(2, retryCount), 60000); // Max 60 seconds
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create API client from environment variables
 */
export function createApiClientFromEnv(): ClientSystemApiClient {
  const config: ApiClientConfig = {
    apiUrl: process.env.CLIENT_API_URL || 'http://localhost:3001/api',
    apiKey: process.env.CLIENT_API_KEY || '',
    timeout: parseInt(process.env.API_TIMEOUT || '30000', 10),
    maxRetries: parseInt(process.env.MAX_RETRIES || '5', 10),
  };

  return new ClientSystemApiClient(config);
}
