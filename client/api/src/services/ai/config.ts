/**
 * AI-Powered Meter Insights - Configuration
 * Loads and validates configuration for AI services
 */

import { AIServiceConfig } from './types';

/**
 * Loads AI service configuration from environment variables
 */
export function loadAIServiceConfig(): AIServiceConfig {
  const config: AIServiceConfig = {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    databaseUrl: process.env.DATABASE_URL || '',
    searchTimeoutMs: parseInt(process.env.AI_SEARCH_TIMEOUT_MS || '2000', 10),
    reportTimeoutMs: parseInt(process.env.AI_REPORT_TIMEOUT_MS || '30000', 10),
    cacheSearchTtlMs: parseInt(process.env.AI_CACHE_SEARCH_TTL_MS || '300000', 10), // 5 minutes
    cacheInsightsTtlMs: parseInt(process.env.AI_CACHE_INSIGHTS_TTL_MS || '1800000', 10), // 30 minutes
    reportRetentionDays: parseInt(process.env.AI_REPORT_RETENTION_DAYS || '30', 10),
    maxRetries: parseInt(process.env.AI_MAX_RETRIES || '3', 10),
    retryBackoffMs: parseInt(process.env.AI_RETRY_BACKOFF_MS || '1000', 10),
  };

  validateConfig(config);
  return config;
}

/**
 * Validates AI service configuration
 */
function validateConfig(config: AIServiceConfig): void {
  const errors: string[] = [];

  if (!config.openaiApiKey) {
    errors.push('OPENAI_API_KEY environment variable is required');
  }

  if (!config.databaseUrl) {
    errors.push('DATABASE_URL environment variable is required');
  }

  if (config.searchTimeoutMs <= 0) {
    errors.push('AI_SEARCH_TIMEOUT_MS must be greater than 0');
  }

  if (config.reportTimeoutMs <= 0) {
    errors.push('AI_REPORT_TIMEOUT_MS must be greater than 0');
  }

  if (config.cacheSearchTtlMs <= 0) {
    errors.push('AI_CACHE_SEARCH_TTL_MS must be greater than 0');
  }

  if (config.cacheInsightsTtlMs <= 0) {
    errors.push('AI_CACHE_INSIGHTS_TTL_MS must be greater than 0');
  }

  if (config.reportRetentionDays <= 0) {
    errors.push('AI_REPORT_RETENTION_DAYS must be greater than 0');
  }

  if (config.maxRetries < 0) {
    errors.push('AI_MAX_RETRIES must be >= 0');
  }

  if (config.retryBackoffMs < 0) {
    errors.push('AI_RETRY_BACKOFF_MS must be >= 0');
  }

  if (errors.length > 0) {
    throw new Error(`AI Service Configuration Error:\n${errors.join('\n')}`);
  }
}

/**
 * Gets the singleton AI service configuration
 */
let configInstance: AIServiceConfig | null = null;

export function getAIServiceConfig(): AIServiceConfig {
  if (!configInstance) {
    configInstance = loadAIServiceConfig();
  }
  return configInstance;
}

/**
 * Resets the configuration (useful for testing)
 */
export function resetAIServiceConfig(): void {
  configInstance = null;
}
