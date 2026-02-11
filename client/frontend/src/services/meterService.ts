import apiClient from './apiClient';
import type { AxiosResponse } from 'axios';

/**
 * Meter interface for API responses
 */
export interface Meter {
  id: string | number;
  name: string;
  identifier: string;
  type?: 'physical' | 'virtual';
  [key: string]: any; // Additional fields from API
}

/**
 * Virtual Meter Configuration interface
 */
export interface VirtualMeterConfig {
  meterId: string | number;
  selectedMeterIds: (string | number)[];
  selectedMeterElementIds: (string | number)[];
}

/**
 * Filter options for getMeterElements
 */
export interface MeterElementFilters {
  type?: string;
  excludeIds?: string;
  searchQuery?: string;
}

/**
 * API response wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retry wrapper for transient failures
 */
const withRetry = async <T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> => {
  // Check if retries are disabled (for testing)
  const retriesDisabled = (globalThis as any).__DISABLE_RETRIES__ === true;
  const maxRetries = retriesDisabled ? 0 : config.maxRetries;

  let lastError: Error | null = null;
  let delay = config.delayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable (network error or 5xx)
      const isRetryable =
        !isAxiosError(error) ||
        !error.response ||
        (error.response.status >= 500 && error.response.status < 600) ||
        error.code === 'ECONNABORTED' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ECONNREFUSED';

      if (!isRetryable || attempt === maxRetries) {
        break;
      }

      await sleep(delay);
      delay *= config.backoffMultiplier;
    }
  }

  throw lastError || new Error('Unknown error occurred');
};

/**
 * Type guard for axios errors
 */
const isAxiosError = (error: any): error is any => {
  return error && error.response !== undefined;
};

/**
 * Extract error message from API response or error object
 */
const getErrorMessage = (error: any): string => {
  if (isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'API request failed';
  }
  return error?.message || 'An unknown error occurred';
};

class MeterService {
  /**
   * Get available meter elements with optional filtering
   * @param filters - Optional filters for type, excludeIds, searchQuery
   * @returns Promise<Meter[]> - Array of available meters
   * @throws Error with descriptive message on failure
   */
  async getMeterElements(filters?: MeterElementFilters): Promise<Meter[]> {
    return withRetry(async () => {
      try {
        const params: Record<string, any> = {};

        if (filters?.type) {
          params.type = filters.type;
        }
        if (filters?.excludeIds) {
          params.excludeIds = filters.excludeIds;
        }
        if (filters?.searchQuery) {
          params.searchQuery = filters.searchQuery;
        }

        const response: AxiosResponse<ApiResponse<Meter[]>> = await apiClient.get('/meters/elements', {
          params,
        });

        if (!response.data.data) {
          throw new Error('Invalid response format: missing data field');
        }

        // Validate that all meters have required fields
        const validMeters = response.data.data.filter((meter) => {
          if (!meter.id || !meter.name) {
            console.warn('Meter missing required fields:', meter);
            return false;
          }
          return true;
        });

        return validMeters;
      } catch (error) {
        const message = getErrorMessage(error);
        throw new Error(`Failed to load available meters: ${message}`);
      }
    });
  }

  /**
   * Get virtual meter configuration (previously selected meters)
   * @param meterId - The virtual meter ID
   * @returns Promise<VirtualMeterConfig> - Configuration with selected meters
   * @throws Error with descriptive message on failure
   */
  async getVirtualMeterConfig(meterId: string | number): Promise<VirtualMeterConfig> {
    return withRetry(async () => {
      try {
        if (!meterId) {
          throw new Error('Meter ID is required');
        }

        const response = await apiClient.get(`/meters/${meterId}/virtual-config`);
        const body = response.data;

        if (!body.success) {
          throw new Error(body.message || 'Failed to fetch virtual meter config');
        }

        // Backend returns { success, meterId, selectedMeters }
        const selectedMeters: Meter[] = body.selectedMeters || [];
        const selectedMeterIds = selectedMeters.map((m: Meter) => m.id);

        return {
          meterId: body.meterId,
          selectedMeterIds,
          selectedMeterElementIds: [],
        };
      } catch (error) {
        const message = getErrorMessage(error);
        throw new Error(`Failed to load virtual meter configuration: ${message}`);
      }
    });
  }

  /**
   * Save virtual meter configuration
   * @param meterId - The virtual meter ID
   * @param config - Configuration with selected meter IDs and element IDs
   * @returns Promise<VirtualMeterConfig> - Saved configuration
   * @throws Error with descriptive message on failure
   */
  async saveVirtualMeterConfig(meterId: string | number, config: VirtualMeterConfig): Promise<VirtualMeterConfig> {
    return withRetry(async () => {
      try {
        if (!meterId) {
          throw new Error('Meter ID is required');
        }

        if (!config || !Array.isArray(config.selectedMeterIds) || !Array.isArray(config.selectedMeterElementIds)) {
          throw new Error('Invalid configuration: selectedMeterIds and selectedMeterElementIds must be arrays');
        }

        const payload = {
          selectedMeterIds: config.selectedMeterIds,
          selectedMeterElementIds: config.selectedMeterElementIds,
        };

        const response: AxiosResponse<ApiResponse<VirtualMeterConfig>> = await apiClient.post(
          `/meters/${meterId}/virtual-config`,
          payload
        );

        if (!response.data.data) {
          throw new Error('Invalid response format: missing data field');
        }

        return response.data.data;
      } catch (error) {
        const message = getErrorMessage(error);
        throw new Error(`Failed to save virtual meter configuration: ${message}`);
      }
    });
  }
}

// Export singleton instance
export const meterService = new MeterService();
export default meterService;
