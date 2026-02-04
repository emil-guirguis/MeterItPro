/**
 * AI-Powered Meter Insights - Query Parser Tests
 * Unit tests for query parsing functionality
 */

import { QueryParser } from './QueryParser';
import { InvalidQueryError } from './errors';
import { resetAIServiceConfig } from './config';

describe('QueryParser', () => {
  let parser: QueryParser;

  beforeEach(() => {
    resetAIServiceConfig();
    parser = new QueryParser();
  });

  describe('parseQuery - Search Queries', () => {
    it('should parse a simple search query with keyword matching', async () => {
      const result = await parser.parseQuery('Find high consumption devices in building A', 'search');

      expect(result.type).toBe('search');
      expect(result.scope).toBe('device');
      expect(result.filters.locations).toContain('A');
      expect(result.filters.consumptionRange?.min).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should extract location references', async () => {
      const result = await parser.parseQuery('Show meters in floor 2', 'search');

      expect(result.filters.locations).toContain('2');
      expect(result.scope).toBe('meter');
    });

    it('should extract consumption ranges', async () => {
      const result = await parser.parseQuery('Devices with over 500 kWh', 'search');

      expect(result.filters.consumptionRange?.min).toBe(500);
    });

    it('should extract device types', async () => {
      const result = await parser.parseQuery('Find all sensors', 'search');

      expect(result.filters.deviceTypes).toContain('sensor');
    });

    it('should extract status filters', async () => {
      const result = await parser.parseQuery('Show inactive meters', 'search');

      expect(result.filters.status).toContain('inactive');
    });

    it('should handle ambiguous queries', async () => {
      const result = await parser.parseQuery('devices', 'search');

      expect(result.type).toBe('search');
      expect(result.confidence).toBeLessThan(1);
    });

    it('should reject empty queries', async () => {
      await expect(parser.parseQuery('', 'search')).rejects.toThrow(InvalidQueryError);
    });

    it('should reject queries exceeding max length', async () => {
      const longQuery = 'a'.repeat(1001);
      await expect(parser.parseQuery(longQuery, 'search')).rejects.toThrow(InvalidQueryError);
    });
  });

  describe('parseQuery - Report Queries', () => {
    it('should parse a report query', async () => {
      const result = await parser.parseQuery('Generate a report of top 10 consuming devices', 'report');

      expect(result.type).toBe('report');
      expect(result.metrics).toBeDefined();
    });

    it('should extract time periods for reports', async () => {
      const result = await parser.parseQuery('Report for this month', 'report');

      expect(result.filters.timeRange).toBeDefined();
      expect(result.filters.timeRange?.start).toBeDefined();
      expect(result.filters.timeRange?.end).toBeDefined();
    });

    it('should determine groupBy for reports', async () => {
      const result = await parser.parseQuery('Report grouped by location', 'report');

      expect(result.groupBy).toBe('location');
    });
  });

  describe('Temporal Reference Interpretation', () => {
    it('should interpret "today"', async () => {
      const result = await parser.parseQuery('Devices used today', 'search');

      expect(result.filters.timeRange).toBeDefined();
      const today = new Date().toISOString().split('T')[0];
      expect(result.filters.timeRange?.start).toBe(today);
    });

    it('should interpret "this week"', async () => {
      const result = await parser.parseQuery('Data from this week', 'search');

      expect(result.filters.timeRange).toBeDefined();
    });

    it('should interpret "this month"', async () => {
      const result = await parser.parseQuery('Report for this month', 'search');

      expect(result.filters.timeRange).toBeDefined();
    });

    it('should interpret "last month"', async () => {
      const result = await parser.parseQuery('Last month data', 'search');

      expect(result.filters.timeRange).toBeDefined();
    });

    it('should interpret quarters', async () => {
      const result = await parser.parseQuery('Q4 report', 'search');

      expect(result.filters.timeRange).toBeDefined();
    });
  });

  describe('Location Hierarchy Matching', () => {
    it('should extract building references', async () => {
      const result = await parser.parseQuery('Building A devices', 'search');

      expect(result.filters.locations).toContain('A');
    });

    it('should extract floor references', async () => {
      const result = await parser.parseQuery('Floor 3 meters', 'search');

      expect(result.filters.locations).toContain('3');
    });

    it('should extract room references', async () => {
      const result = await parser.parseQuery('Room 101 sensors', 'search');

      expect(result.filters.locations).toContain('101');
    });

    it('should handle multiple location references', async () => {
      const result = await parser.parseQuery('Building A floor 2 room 201', 'search');

      expect(result.filters.locations?.length).toBeGreaterThan(0);
    });
  });

  describe('Consumption Range Filtering', () => {
    it('should parse "over X" consumption', async () => {
      const result = await parser.parseQuery('Over 1000 kWh', 'search');

      expect(result.filters.consumptionRange?.min).toBe(1000);
    });

    it('should parse "under X" consumption', async () => {
      const result = await parser.parseQuery('Under 500 kWh', 'search');

      expect(result.filters.consumptionRange?.max).toBe(500);
    });

    it('should parse "between X and Y" consumption', async () => {
      const result = await parser.parseQuery('Between 100 and 500 kWh', 'search');

      expect(result.filters.consumptionRange?.min).toBe(100);
      expect(result.filters.consumptionRange?.max).toBe(500);
    });

    it('should parse "high consumption"', async () => {
      const result = await parser.parseQuery('High consumption devices', 'search');

      expect(result.filters.consumptionRange?.min).toBeGreaterThan(0);
    });

    it('should parse "low consumption"', async () => {
      const result = await parser.parseQuery('Low consumption devices', 'search');

      expect(result.filters.consumptionRange?.max).toBeLessThan(999999);
    });
  });

  describe('Query Validation', () => {
    it('should validate parsed query structure', async () => {
      const result = await parser.parseQuery('Find devices', 'search');

      expect(result.type).toBeDefined();
      expect(result.scope).toBeDefined();
      expect(result.filters).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should normalize confidence to 0-1 range', async () => {
      const result = await parser.parseQuery('Find devices', 'search');

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle missing optional fields', async () => {
      const result = await parser.parseQuery('devices', 'search');

      expect(result.type).toBe('search');
      expect(result.scope).toBeDefined();
    });
  });

  describe('Scope Determination', () => {
    it('should determine device scope', async () => {
      const result = await parser.parseQuery('Find sensors', 'search');

      expect(result.scope).toBe('device');
    });

    it('should determine meter scope', async () => {
      const result = await parser.parseQuery('Show meters', 'search');

      expect(result.scope).toBe('meter');
    });

    it('should determine location scope', async () => {
      const result = await parser.parseQuery('Devices in building A', 'search');

      expect(result.scope).toBe('location');
    });

    it('should default to all scope', async () => {
      const result = await parser.parseQuery('Show everything', 'search');

      expect(result.scope).toBe('all');
    });
  });

  describe('Error Handling', () => {
    it('should throw InvalidQueryError for empty query', async () => {
      await expect(parser.parseQuery('', 'search')).rejects.toThrow(InvalidQueryError);
    });

    it('should throw InvalidQueryError for whitespace-only query', async () => {
      await expect(parser.parseQuery('   ', 'search')).rejects.toThrow(InvalidQueryError);
    });

    it('should throw InvalidQueryError for oversized query', async () => {
      const longQuery = 'a'.repeat(1001);
      await expect(parser.parseQuery(longQuery, 'search')).rejects.toThrow(InvalidQueryError);
    });
  });
});
