/**
 * AI-Powered Meter Insights - Query Parser Service
 * Converts natural language queries to structured parameters using LLM
 */

import { ParsedQuery } from './types';
import { InvalidQueryError, AIServiceUnavailableError, toAIServiceError } from './errors';
import { getAIServiceConfig } from './config';

/**
 * QueryParser service for converting natural language to structured queries
 */
export class QueryParser {
  private openaiApiKey: string;
  private maxRetries: number;
  private retryBackoffMs: number;

  constructor() {
    const config = getAIServiceConfig();
    this.openaiApiKey = config.openaiApiKey;
    this.maxRetries = config.maxRetries;
    this.retryBackoffMs = config.retryBackoffMs;
  }

  /**
   * Parses a natural language query into structured parameters
   */
  async parseQuery(query: string, queryType: 'search' | 'report'): Promise<ParsedQuery> {
    if (!query || query.trim().length === 0) {
      throw new InvalidQueryError('Query cannot be empty');
    }

    if (query.length > 1000) {
      throw new InvalidQueryError('Query cannot exceed 1000 characters');
    }

    try {
      // Try to parse with LLM first
      const parsed = await this.parseWithLLM(query, queryType);
      return parsed;
    } catch (error) {
      // Fall back to keyword matching if LLM fails
      console.warn('LLM parsing failed, falling back to keyword matching', error);
      return this.parseWithKeywordMatching(query, queryType);
    }
  }

  /**
   * Parses a query using OpenAI GPT-4
   */
  private async parseWithLLM(query: string, queryType: 'search' | 'report'): Promise<ParsedQuery> {
    const prompt = this.buildPrompt(query, queryType);

    try {
      const response = await this.callOpenAI(prompt);
      const parsed = this.extractJSON(response);
      return this.validateAndNormalizeParsedQuery(parsed);
    } catch (error) {
      throw toAIServiceError(error);
    }
  }

  /**
   * Builds a prompt for the LLM
   */
  private buildPrompt(query: string, queryType: 'search' | 'report'): string {
    const examples = queryType === 'search' 
      ? this.getSearchExamples()
      : this.getReportExamples();

    return `You are a query parser for a meter reading system. Parse the following natural language query into structured parameters.

Query Type: ${queryType}

Examples:
${examples}

User Query: "${query}"

Return a JSON object with the following structure:
{
  "type": "${queryType}",
  "scope": "device" | "meter" | "location" | "all",
  "filters": {
    "locations": ["location1", "location2"],
    "deviceTypes": ["meter", "sensor"],
    "consumptionRange": { "min": 0, "max": 1000 },
    "status": ["active"],
    "timeRange": { "start": "2024-01-01", "end": "2024-12-31" }
  },
  "metrics": ["top_consumers", "anomalies"],
  "groupBy": "device_type",
  "confidence": 0.95,
  "suggestions": ["Did you mean...?"]
}

Only include fields that are relevant to the query. Set confidence to 0-1 based on how well you understood the query.`;
  }

  /**
   * Gets search query examples
   */
  private getSearchExamples(): string {
    return `
1. Query: "Find high consumption devices in building A"
   Result: {
     "type": "search",
     "scope": "device",
     "filters": {
       "locations": ["building A"],
       "consumptionRange": { "min": 500, "max": 999999 }
     },
     "confidence": 0.9
   }

2. Query: "Show me meters with over 1000 kWh this month"
   Result: {
     "type": "search",
     "scope": "meter",
     "filters": {
       "consumptionRange": { "min": 1000, "max": 999999 },
       "timeRange": { "start": "2024-01-01", "end": "2024-01-31" }
     },
     "confidence": 0.85
   }

3. Query: "Inactive sensors in floor 2"
   Result: {
     "type": "search",
     "scope": "device",
     "filters": {
       "locations": ["floor 2"],
       "deviceTypes": ["sensor"],
       "status": ["inactive"]
     },
     "confidence": 0.92
   }`;
  }

  /**
   * Gets report query examples
   */
  private getReportExamples(): string {
    return `
1. Query: "Generate a report of top 10 consuming devices this month"
   Result: {
     "type": "report",
     "scope": "device",
     "filters": {
       "timeRange": { "start": "2024-01-01", "end": "2024-01-31" }
     },
     "metrics": ["top_consumers"],
     "groupBy": "device",
     "confidence": 0.95
   }

2. Query: "Create a PDF report showing consumption trends by location for Q4"
   Result: {
     "type": "report",
     "scope": "location",
     "filters": {
       "timeRange": { "start": "2024-10-01", "end": "2024-12-31" }
     },
     "metrics": ["trends"],
     "groupBy": "location",
     "confidence": 0.9
   }

3. Query: "Report on anomalies detected in the last 7 days"
   Result: {
     "type": "report",
     "scope": "all",
     "filters": {
       "timeRange": { "start": "2024-01-24", "end": "2024-01-31" }
     },
     "metrics": ["anomalies"],
     "confidence": 0.88
   }`;
  }

  /**
   * Calls OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a query parser. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new AIServiceUnavailableError('Invalid OpenAI API key');
      }
      if (response.status === 429) {
        throw new AIServiceUnavailableError('OpenAI rate limit exceeded');
      }
      if (response.status >= 500) {
        throw new AIServiceUnavailableError('OpenAI service error');
      }
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Extracts JSON from LLM response
   */
  private extractJSON(response: string): any {
    // Try to find JSON in the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new InvalidQueryError('Could not parse query response');
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      throw new InvalidQueryError('Invalid JSON in query response');
    }
  }

  /**
   * Validates and normalizes a parsed query
   */
  private validateAndNormalizeParsedQuery(parsed: any): ParsedQuery {
    // Ensure required fields exist
    if (!parsed.type || !parsed.scope) {
      throw new InvalidQueryError('Missing required fields in parsed query');
    }

    // Normalize confidence
    const confidence = Math.max(0, Math.min(1, parsed.confidence || 0.5));

    // Normalize filters
    const filters = {
      locations: Array.isArray(parsed.filters?.locations) ? parsed.filters.locations : undefined,
      deviceTypes: Array.isArray(parsed.filters?.deviceTypes) ? parsed.filters.deviceTypes : undefined,
      consumptionRange: parsed.filters?.consumptionRange ? {
        min: Math.max(0, parsed.filters.consumptionRange.min || 0),
        max: Math.max(0, parsed.filters.consumptionRange.max || 999999),
      } : undefined,
      status: Array.isArray(parsed.filters?.status) ? parsed.filters.status : undefined,
      timeRange: parsed.filters?.timeRange ? {
        start: parsed.filters.timeRange.start,
        end: parsed.filters.timeRange.end,
      } : undefined,
    };

    // Remove undefined fields
    Object.keys(filters).forEach((key) => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters];
      }
    });

    return {
      type: parsed.type,
      scope: parsed.scope,
      filters,
      metrics: Array.isArray(parsed.metrics) ? parsed.metrics : undefined,
      groupBy: parsed.groupBy,
      confidence,
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : undefined,
    };
  }

  /**
   * Parses a query using keyword matching (fallback)
   */
  private parseWithKeywordMatching(query: string, queryType: 'search' | 'report'): ParsedQuery {
    const lowerQuery = query.toLowerCase();

    // Extract locations
    const locations = this.extractLocations(lowerQuery);

    // Extract device types
    const deviceTypes = this.extractDeviceTypes(lowerQuery);

    // Extract consumption range
    const consumptionRange = this.extractConsumptionRange(lowerQuery);

    // Extract status
    const status = this.extractStatus(lowerQuery);

    // Extract time range
    const timeRange = this.extractTimeRange(lowerQuery);

    // Determine scope
    const scope = this.determineScope(lowerQuery, deviceTypes);

    // Extract metrics for reports
    const metrics = queryType === 'report' ? this.extractMetrics(lowerQuery) : undefined;

    // Determine groupBy for reports
    const groupBy = queryType === 'report' ? this.determineGroupBy(lowerQuery) : undefined;

    return {
      type: queryType,
      scope,
      filters: {
        locations: locations.length > 0 ? locations : undefined,
        deviceTypes: deviceTypes.length > 0 ? deviceTypes : undefined,
        consumptionRange,
        status: status.length > 0 ? status : undefined,
        timeRange,
      },
      confidence: 0.6, // Lower confidence for keyword matching
      suggestions: ['Consider using more specific terms for better results'],
    };
  }

  /**
   * Extracts location references from query
   */
  private extractLocations(query: string): string[] {
    const locations: string[] = [];
    const locationPatterns = [
      /building\s+([a-z0-9]+)/gi,
      /floor\s+([0-9]+)/gi,
      /room\s+([a-z0-9]+)/gi,
      /zone\s+([a-z0-9]+)/gi,
      /area\s+([a-z0-9]+)/gi,
    ];

    locationPatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(query)) !== null) {
        locations.push(match[1]);
      }
    });

    return locations;
  }

  /**
   * Extracts device types from query
   */
  private extractDeviceTypes(query: string): string[] {
    const deviceTypes: string[] = [];
    const typeKeywords = ['meter', 'sensor', 'pump', 'valve', 'switch', 'controller'];

    typeKeywords.forEach((type) => {
      if (query.includes(type)) {
        deviceTypes.push(type);
      }
    });

    return deviceTypes;
  }

  /**
   * Extracts consumption range from query
   */
  private extractConsumptionRange(query: string): { min: number; max: number } | undefined {
    // Look for patterns like "over 500", "under 1000", "between 100 and 500"
    const overPattern = /over\s+(\d+)/i;
    const underPattern = /under\s+(\d+)/i;
    const betweenPattern = /between\s+(\d+)\s+and\s+(\d+)/i;
    const highPattern = /high\s+consumption/i;
    const lowPattern = /low\s+consumption/i;

    let min = 0;
    let max = 999999;

    const overMatch = overPattern.exec(query);
    if (overMatch) {
      min = parseInt(overMatch[1], 10);
    }

    const underMatch = underPattern.exec(query);
    if (underMatch) {
      max = parseInt(underMatch[1], 10);
    }

    const betweenMatch = betweenPattern.exec(query);
    if (betweenMatch) {
      min = parseInt(betweenMatch[1], 10);
      max = parseInt(betweenMatch[2], 10);
    }

    if (highPattern.test(query)) {
      min = 500; // Arbitrary threshold
    }

    if (lowPattern.test(query)) {
      max = 200; // Arbitrary threshold
    }

    if (min > 0 || max < 999999) {
      return { min, max };
    }

    return undefined;
  }

  /**
   * Extracts status from query
   */
  private extractStatus(query: string): string[] {
    const status: string[] = [];
    const statusKeywords = ['active', 'inactive', 'error', 'offline', 'online'];

    statusKeywords.forEach((s) => {
      if (query.includes(s)) {
        status.push(s);
      }
    });

    return status;
  }

  /**
   * Extracts time range from query
   */
  private extractTimeRange(query: string): { start: string; end: string } | undefined {
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = null;

    // Today
    if (/today|this\s+day/.test(query)) {
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
    }

    // This week
    if (/this\s+week|last\s+7\s+days/.test(query)) {
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      end = new Date(now);
    }

    // This month
    if (/this\s+month|last\s+30\s+days/.test(query)) {
      start = new Date(now);
      start.setMonth(now.getMonth());
      start.setDate(1);
      end = new Date(now);
    }

    // Last month
    if (/last\s+month/.test(query)) {
      start = new Date(now);
      start.setMonth(now.getMonth() - 1);
      start.setDate(1);
      end = new Date(now);
      end.setDate(0);
    }

    // This year / Q4, etc.
    if (/this\s+year|last\s+year/.test(query)) {
      start = new Date(now);
      start.setMonth(0);
      start.setDate(1);
      end = new Date(now);
    }

    // Q1, Q2, Q3, Q4
    const quarterMatch = /q([1-4])/i.exec(query);
    if (quarterMatch) {
      const quarter = parseInt(quarterMatch[1], 10);
      start = new Date(now);
      start.setMonth((quarter - 1) * 3);
      start.setDate(1);
      end = new Date(now);
      end.setMonth(quarter * 3);
      end.setDate(0);
    }

    if (start && end) {
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      };
    }

    return undefined;
  }

  /**
   * Determines the scope of the query
   */
  private determineScope(query: string, deviceTypes: string[]): 'device' | 'meter' | 'location' | 'all' {
    if (query.includes('location') || query.includes('building') || query.includes('floor')) {
      return 'location';
    }

    if (query.includes('meter')) {
      return 'meter';
    }

    if (deviceTypes.length > 0) {
      return 'device';
    }

    return 'all';
  }

  /**
   * Extracts metrics for reports
   */
  private extractMetrics(query: string): string[] {
    const metrics: string[] = [];
    const metricKeywords = ['top_consumers', 'anomalies', 'trends', 'consumption', 'usage'];

    metricKeywords.forEach((metric) => {
      if (query.includes(metric.replace('_', ' '))) {
        metrics.push(metric);
      }
    });

    return metrics;
  }

  /**
   * Determines groupBy for reports
   */
  private determineGroupBy(query: string): string | undefined {
    if (query.includes('by location')) return 'location';
    if (query.includes('by device')) return 'device';
    if (query.includes('by type')) return 'type';
    if (query.includes('by building')) return 'building';
    if (query.includes('by floor')) return 'floor';

    return undefined;
  }
}
