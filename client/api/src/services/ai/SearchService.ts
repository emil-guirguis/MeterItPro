/**
 * AI-Powered Meter Insights - Search Service
 * Implements natural language search for devices and meters
 */

import { SearchRequest, SearchResult, ParsedQuery, Device, Meter, Reading } from './types';
import { InvalidQueryError, InsufficientDataError, PermissionDeniedError } from './errors';
import { QueryParser } from './QueryParser';
import { EmbeddingsService } from './EmbeddingsService';
import { getCache, hashSearchQuery, generateCacheKey } from './cache';
import { getAIServiceConfig } from './config';

/**
 * SearchService for natural language device/meter search
 */
export class SearchService {
  private queryParser: QueryParser;
  private embeddingsService: EmbeddingsService;
  private cache = getCache();
  private searchTimeoutMs: number;
  private cacheSearchTtlMs: number;

  constructor() {
    const config = getAIServiceConfig();
    this.queryParser = new QueryParser();
    this.embeddingsService = new EmbeddingsService();
    this.searchTimeoutMs = config.searchTimeoutMs;
    this.cacheSearchTtlMs = config.cacheSearchTtlMs;
  }

  /**
   * Performs a natural language search
   */
  async search(
    request: SearchRequest,
    devices: Device[],
    meters: Meter[],
    readings: Map<string, Reading[]>
  ): Promise<{ results: SearchResult[]; clarifications?: string[]; executionTime: number }> {
    const startTime = Date.now();

    // Check cache first
    const cacheKey = hashSearchQuery(request.tenantId, request.query);
    const cached = this.cache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Parse the query
      const parsed = await this.queryParser.parseQuery(request.query, 'search');

      // Filter devices based on parsed query
      let filteredDevices = this.filterDevices(devices, parsed, request.tenantId);

      // Apply location hierarchy matching
      if (parsed.filters.locations && parsed.filters.locations.length > 0) {
        filteredDevices = this.matchLocationHierarchy(filteredDevices, parsed.filters.locations);
      }

      // Apply consumption range filtering
      if (parsed.filters.consumptionRange) {
        filteredDevices = this.filterByConsumption(
          filteredDevices,
          parsed.filters.consumptionRange,
          readings
        );
      }

      // Apply status filtering
      if (parsed.filters.status && parsed.filters.status.length > 0) {
        filteredDevices = filteredDevices.filter((d) =>
          parsed.filters.status?.includes(d.status)
        );
      }

      // Generate search results
      const results = await this.generateSearchResults(
        filteredDevices,
        readings,
        request.limit || 20,
        request.offset || 0
      );

      const executionTime = Date.now() - startTime;

      const response = {
        results,
        clarifications: parsed.suggestions,
        executionTime,
      };

      // Cache the results
      this.cache.set(cacheKey, response, this.cacheSearchTtlMs);

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Filters devices based on parsed query
   */
  private filterDevices(devices: Device[], parsed: ParsedQuery, tenantId: string): Device[] {
    let filtered = devices.filter((d) => d.tenantId === tenantId);

    // Filter by device type
    if (parsed.filters.deviceTypes && parsed.filters.deviceTypes.length > 0) {
      filtered = filtered.filter((d) =>
        parsed.filters.deviceTypes?.some((type) =>
          d.type.toLowerCase().includes(type.toLowerCase())
        )
      );
    }

    return filtered;
  }

  /**
   * Matches devices against location hierarchy
   */
  private matchLocationHierarchy(devices: Device[], locations: string[]): Device[] {
    return devices.filter((device) => {
      const hierarchy = device.locationHierarchy || [];
      const location = device.location || '';

      return locations.some((loc) => {
        const locLower = loc.toLowerCase();
        return (
          location.toLowerCase().includes(locLower) ||
          hierarchy.some((h) => h.toLowerCase().includes(locLower))
        );
      });
    });
  }

  /**
   * Filters devices by consumption range
   */
  private filterByConsumption(
    devices: Device[],
    range: { min: number; max: number },
    readings: Map<string, Reading[]>
  ): Device[] {
    return devices.filter((device) => {
      const deviceReadings = readings.get(device.id) || [];
      if (deviceReadings.length === 0) {
        return false;
      }

      // Calculate total consumption
      const totalConsumption = deviceReadings.reduce((sum, r) => sum + r.value, 0);
      return totalConsumption >= range.min && totalConsumption <= range.max;
    });
  }

  /**
   * Generates search results with device details
   */
  private async generateSearchResults(
    devices: Device[],
    readings: Map<string, Reading[]>,
    limit: number,
    offset: number
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    for (let i = offset; i < Math.min(offset + limit, devices.length); i++) {
      const device = devices[i];
      const deviceReadings = readings.get(device.id) || [];

      if (deviceReadings.length === 0) {
        continue;
      }

      // Get latest reading
      const latestReading = deviceReadings[deviceReadings.length - 1];
      const totalConsumption = deviceReadings.reduce((sum, r) => sum + r.value, 0);

      results.push({
        id: device.id,
        name: device.name,
        type: 'device',
        location: device.location,
        currentConsumption: latestReading.value,
        unit: 'kWh', // TODO: Get from meter metadata
        status: device.status,
        relevanceScore: 0.9, // TODO: Calculate based on query match
        lastReading: {
          value: latestReading.value,
          timestamp: latestReading.timestamp,
        },
      });
    }

    return results;
  }

  /**
   * Clears search cache for a tenant
   */
  clearTenantCache(tenantId: string): void {
    // In a real implementation, this would clear all cache entries for the tenant
    // For now, we just clear the entire cache
    this.cache.clear();
  }

  /**
   * Gets cache statistics
   */
  getCacheStats(): { size: number; ttlMs: number } {
    return {
      size: this.cache.size(),
      ttlMs: this.cacheSearchTtlMs,
    };
  }
}
