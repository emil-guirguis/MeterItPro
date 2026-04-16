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
 * A meter-level selection in a virtual meter
 */
export interface MeterSelection {
  selectionType: 'meter';
  id: string;
  meter_id: number;
  meter_name: string;
  identifier: string;
  operation: '+' | '-';
}

/**
 * An element-level selection in a virtual meter
 */
export interface ElementSelection {
  selectionType: 'element';
  id: string;
  meter_id: number;
  meter_name: string;
  identifier: string;
  meter_element_id: number;
  element_name: string;
  element: string;
  operation: '+' | '-';
}

export type SelectedItem = MeterSelection | ElementSelection;

/**
 * Format a selected item's display label the same way favorites do:
 *   element → "Meter Name (kWh) Element Name"
 *   meter   → "Meter Name"
 */
export function formatItemLabel(item: SelectedItem): string {
  if (item.selectionType === 'element') {
    const tag = item.element?.trim() || '?';
    return `${item.meter_name} (${tag}) ${item.element_name}`;
  }
  return item.meter_name;
}

/**
 * A meter element (register/channel on a physical meter)
 */
export interface MeterElement {
  meter_element_id: number;
  meter_id: number;
  name: string;
  element: string;
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
   * Get all elements (registers/channels) for a specific meter
   */
  async getElementsForMeter(meterId: string | number): Promise<MeterElement[]> {
    return withRetry(async () => {
      try {
        const response = await apiClient.get(`/meters/${meterId}/elements`);
        const body = response.data;
        if (!body.success) throw new Error(body.message || 'Failed to fetch elements');
        return body.data || [];
      } catch (error) {
        const message = getErrorMessage(error);
        throw new Error(`Failed to load meter elements: ${message}`);
      }
    });
  }

  /**
   * Get virtual meter configuration (previously selected meters/elements)
   */
  async getVirtualMeterConfig(meterId: string | number): Promise<SelectedItem[]> {
    return withRetry(async () => {
      try {
        if (!meterId) throw new Error('Meter ID is required');

        const response = await apiClient.get(`/meters/${meterId}/virtual-config`);
        const body = response.data;

        if (!body.success) {
          throw new Error(body.message || 'Failed to fetch virtual meter config');
        }

        // Backend returns { success, meterId, selectedItems }
        const raw: any[] = body.selectedItems || [];
        return raw.map((item, index) => {
          // First item is always '+'; fall back to '+' for old rows that pre-date the column.
          const operation: '+' | '-' = index === 0 ? '+' : (item.operation === '-' ? '-' : '+');
          if (item.selectionType === 'element') {
            return {
              selectionType: 'element',
              id: `element-${item.meter_element_id}`,
              meter_id: item.meter_id,
              meter_name: item.meter_name,
              identifier: item.identifier,
              meter_element_id: item.meter_element_id,
              element_name: item.element_name,
              element: item.element,
              operation,
            } as ElementSelection;
          }
          return {
            selectionType: 'meter',
            id: `meter-${item.meter_id}`,
            meter_id: item.meter_id,
            meter_name: item.meter_name,
            identifier: item.identifier,
            operation,
          } as MeterSelection;
        });
      } catch (error) {
        const message = getErrorMessage(error);
        throw new Error(`Failed to load virtual meter configuration: ${message}`);
      }
    });
  }

  /**
   * Save virtual meter configuration from an array of SelectedItem
   */
  async saveVirtualMeterConfig(meterId: string | number, selectedItems: SelectedItem[]): Promise<void> {
    return withRetry(async () => {
      try {
        if (!meterId) throw new Error('Meter ID is required');

        // meter-level selection: element_id = meter_id (convention)
        // element-level selection: element_id = meter_element_id
        const selectedMeterIds = selectedItems.map((item) => item.meter_id);
        const selectedMeterElementIds = selectedItems.map((item) =>
          item.selectionType === 'element' ? item.meter_element_id : item.meter_id
        );
        const operations = selectedItems.map((item, i) => (i === 0 ? '+' : (item.operation ?? '+')));

        await apiClient.post(`/meters/${meterId}/virtual-config`, {
          selectedMeterIds,
          selectedMeterElementIds,
          operations,
        });
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
