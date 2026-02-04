/**
 * AI-Powered Meter Insights - Response Formatting
 * Utilities for formatting API responses
 */

import {
  SearchResponse,
  SearchResult,
  InsightsResponse,
  ReportResponse,
  ReportMetadata,
  ErrorResponse,
  Anomaly,
  Trend,
} from './types';

/**
 * Formats a successful search response
 */
export function formatSearchResponse(
  results: SearchResult[],
  total: number,
  executionTime: number,
  clarifications?: string[]
): SearchResponse {
  return {
    success: true,
    data: {
      results,
      total,
      clarifications,
      executionTime,
    },
  };
}

/**
 * Formats a successful insights response
 */
export function formatInsightsResponse(
  topConsumers: Array<{
    deviceId: string;
    deviceName: string;
    consumption: number;
    unit: string;
    percentOfTotal: number;
  }>,
  anomalies: Anomaly[],
  trends: Trend[],
  recommendations: string[],
  dataPeriod: { start: string; end: string },
  dataQuality: 'sufficient' | 'insufficient'
): InsightsResponse {
  return {
    success: true,
    data: {
      topConsumers,
      anomalies,
      trends,
      recommendations,
      lastUpdated: new Date().toISOString(),
      dataPeriod,
      dataQuality,
    },
  };
}

/**
 * Formats a report generation response
 */
export function formatReportResponse(
  reportId: string,
  status: 'queued' | 'processing' | 'completed' | 'failed',
  estimatedCompletionTime?: number
): ReportResponse {
  return {
    success: true,
    data: {
      reportId,
      status,
      createdAt: new Date().toISOString(),
      estimatedCompletionTime,
    },
  };
}

/**
 * Formats report metadata
 */
export function formatReportMetadata(report: any): ReportMetadata {
  return {
    id: report.id,
    tenantId: report.tenantId,
    userId: report.userId,
    query: report.query,
    format: report.format,
    status: report.status,
    fileUrl: report.fileUrl,
    fileSize: report.fileSize,
    errorMessage: report.errorMessage,
    createdAt: report.createdAt,
    completedAt: report.completedAt,
    expiresAt: report.expiresAt,
  };
}

/**
 * Formats a paginated list response
 */
export function formatPaginatedResponse<T>(
  items: T[],
  total: number,
  limit: number,
  offset: number
) {
  return {
    success: true,
    data: {
      items,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit),
        currentPage: Math.floor(offset / limit) + 1,
      },
    },
  };
}

/**
 * Formats an error response
 */
export function formatErrorResponse(
  code: string,
  message: string,
  details?: Record<string, any>
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

/**
 * Formats a search result
 */
export function formatSearchResult(
  id: string,
  name: string,
  type: 'device' | 'meter',
  location: string,
  currentConsumption: number,
  unit: string,
  status: 'active' | 'inactive' | 'error',
  relevanceScore: number,
  lastReading: { value: number; timestamp: string }
): SearchResult {
  return {
    id,
    name,
    type,
    location,
    currentConsumption,
    unit,
    status,
    relevanceScore,
    lastReading,
  };
}

/**
 * Formats an anomaly
 */
export function formatAnomaly(
  deviceId: string,
  deviceName: string,
  type: 'spike' | 'drop' | 'pattern_change' | 'threshold_exceeded',
  severity: 'low' | 'medium' | 'high',
  explanation: string,
  recommendation: string,
  detectedAt: string
): Anomaly {
  return {
    deviceId,
    deviceName,
    type,
    severity,
    explanation,
    recommendation,
    detectedAt,
  };
}

/**
 * Formats a trend
 */
export function formatTrend(
  deviceId: string,
  deviceName: string,
  direction: 'increasing' | 'decreasing' | 'stable',
  percentChange: number,
  period: string
): Trend {
  return {
    deviceId,
    deviceName,
    direction,
    percentChange,
    period,
  };
}

/**
 * Formats a top consumer entry
 */
export function formatTopConsumer(
  deviceId: string,
  deviceName: string,
  consumption: number,
  unit: string,
  percentOfTotal: number
) {
  return {
    deviceId,
    deviceName,
    consumption,
    unit,
    percentOfTotal,
  };
}
