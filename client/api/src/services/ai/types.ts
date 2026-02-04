/**
 * AI-Powered Meter Insights - Type Definitions
 * Defines all request/response types and interfaces for AI services
 */

// ============================================================================
// Search Types
// ============================================================================

export interface SearchRequest {
  query: string;           // Natural language query
  tenantId: string;        // Multi-tenant isolation
  limit?: number;          // Result limit (default: 20)
  offset?: number;         // Pagination offset
}

export interface SearchResult {
  id: string;
  name: string;
  type: 'device' | 'meter';
  location: string;
  currentConsumption: number;
  unit: string;
  status: 'active' | 'inactive' | 'error';
  relevanceScore: number;
  lastReading: {
    value: number;
    timestamp: string;
  };
}

export interface SearchResponse {
  success: boolean;
  data: {
    results: SearchResult[];
    total: number;
    clarifications?: string[];  // Suggestions for ambiguous queries
    executionTime: number;      // ms
  };
}

// ============================================================================
// Insights Types
// ============================================================================

export interface InsightsRequest {
  tenantId: string;
  period?: 'today' | 'week' | 'month' | 'year';  // default: 'month'
  forceRefresh?: boolean;
}

export interface Anomaly {
  deviceId: string;
  deviceName: string;
  type: 'spike' | 'drop' | 'pattern_change' | 'threshold_exceeded';
  severity: 'low' | 'medium' | 'high';
  explanation: string;
  recommendation: string;
  detectedAt: string;
}

export interface Trend {
  deviceId: string;
  deviceName: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  percentChange: number;
  period: string;
}

export interface InsightsResponse {
  success: boolean;
  data: {
    topConsumers: Array<{
      deviceId: string;
      deviceName: string;
      consumption: number;
      unit: string;
      percentOfTotal: number;
    }>;
    anomalies: Anomaly[];
    trends: Trend[];
    recommendations: string[];
    lastUpdated: string;
    dataPeriod: {
      start: string;
      end: string;
    };
    dataQuality: 'sufficient' | 'insufficient';
  };
}

// ============================================================================
// Report Types
// ============================================================================

export interface ReportRequest {
  query: string;           // Natural language report request
  tenantId: string;
  format: 'pdf' | 'excel';
  includeCharts?: boolean;
  includeRecommendations?: boolean;
}

export interface ReportResponse {
  success: boolean;
  data: {
    reportId: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    createdAt: string;
    estimatedCompletionTime?: number;  // seconds
  };
}

export interface ReportMetadata {
  id: string;
  tenantId: string;
  userId: string;
  query: string;
  format: 'pdf' | 'excel';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  fileSize?: number;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
  expiresAt: string;  // 30 days from creation
}

// ============================================================================
// Query Parser Types
// ============================================================================

export interface ParsedQuery {
  type: 'search' | 'report';
  scope: 'device' | 'meter' | 'location' | 'all';
  filters: {
    locations?: string[];
    deviceTypes?: string[];
    consumptionRange?: { min: number; max: number };
    status?: string[];
    timeRange?: { start: string; end: string };
  };
  metrics?: string[];  // For reports
  groupBy?: string;    // For reports
  confidence: number;  // 0-1
  suggestions?: string[];  // For ambiguous queries
}

// ============================================================================
// Embeddings Types
// ============================================================================

export interface DeviceEmbedding {
  id: string;
  deviceId: string;
  tenantId: string;
  embedding: number[];  // 1536 dimensions for OpenAI
  metadata: string;  // Concatenated device name, type, location
  createdAt: string;
  updatedAt: string;
}

export interface EmbeddingSearchResult {
  deviceId: string;
  similarity: number;
  metadata: string;
}

// ============================================================================
// Anomaly Detection Types
// ============================================================================

export interface BaselineData {
  deviceId: string;
  tenantId: string;
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  dataPoints: number;
  calculatedAt: string;
  updatedAt: string;
}

export interface AnomalyDetectionResult {
  anomalies: Anomaly[];
  baselineData: Map<string, BaselineData>;
}

// ============================================================================
// Trend Analysis Types
// ============================================================================

export interface TrendAnalysisResult {
  deviceId: string;
  deviceName: string;
  direction: 'increasing' | 'decreasing' | 'stable';
  percentChange: number;
  slope: number;
  rSquared: number;  // R-squared value for trend fit
  period: string;
}

// ============================================================================
// Error Types
// ============================================================================

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export type ErrorCode = 
  | 'INVALID_QUERY'
  | 'INSUFFICIENT_DATA'
  | 'PERMISSION_DENIED'
  | 'AI_SERVICE_UNAVAILABLE'
  | 'TIMEOUT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR';

// ============================================================================
// Cache Types
// ============================================================================

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;  // milliseconds
}

// ============================================================================
// Data Models
// ============================================================================

export interface Device {
  id: string;
  tenantId: string;
  name: string;
  type: string;  // meter, sensor, pump, etc.
  location: string;
  locationHierarchy: string[];  // [building, floor, room]
  status: 'active' | 'inactive' | 'error';
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Meter {
  id: string;
  tenantId: string;
  deviceId: string;
  name: string;
  unit: string;  // kWh, m³, etc.
  type: string;  // electricity, water, gas, etc.
  createdAt: string;
  updatedAt: string;
}

export interface Reading {
  id: string;
  tenantId: string;
  meterId: string;
  value: number;
  timestamp: string;
  quality: 'good' | 'estimated' | 'invalid';
  createdAt: string;
}

export interface Report {
  id: string;
  tenantId: string;
  userId: string;
  query: string;
  format: 'pdf' | 'excel';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  fileUrl?: string;
  fileSize?: number;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
  expiresAt: string;  // 30 days from creation
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface AIServiceConfig {
  openaiApiKey: string;
  redisUrl: string;
  databaseUrl: string;
  searchTimeoutMs: number;
  reportTimeoutMs: number;
  cacheSearchTtlMs: number;
  cacheInsightsTtlMs: number;
  reportRetentionDays: number;
  maxRetries: number;
  retryBackoffMs: number;
}

// ============================================================================
// Request Context Types
// ============================================================================

export interface AIRequestContext {
  tenantId: string;
  userId: string;
  requestId: string;
  timestamp: string;
}
