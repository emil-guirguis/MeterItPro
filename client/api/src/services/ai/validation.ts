/**
 * AI-Powered Meter Insights - Validation Schemas
 * Defines Joi validation schemas for all API inputs
 */

import Joi from 'joi';

// ============================================================================
// Search Validation
// ============================================================================

export const searchRequestSchema = Joi.object({
  query: Joi.string()
    .required()
    .min(1)
    .max(500)
    .trim()
    .messages({
      'string.empty': 'Search query cannot be empty',
      'string.max': 'Search query cannot exceed 500 characters',
    }),
  tenantId: Joi.string()
    .required()
    .uuid()
    .messages({
      'string.guid': 'Invalid tenant ID format',
    }),
  limit: Joi.number()
    .optional()
    .integer()
    .min(1)
    .max(100)
    .default(20),
  offset: Joi.number()
    .optional()
    .integer()
    .min(0)
    .default(0),
});

// ============================================================================
// Insights Validation
// ============================================================================

export const insightsRequestSchema = Joi.object({
  tenantId: Joi.string()
    .required()
    .uuid()
    .messages({
      'string.guid': 'Invalid tenant ID format',
    }),
  period: Joi.string()
    .optional()
    .valid('today', 'week', 'month', 'year')
    .default('month'),
  forceRefresh: Joi.boolean()
    .optional()
    .default(false),
});

// ============================================================================
// Report Validation
// ============================================================================

export const reportRequestSchema = Joi.object({
  query: Joi.string()
    .required()
    .min(1)
    .max(1000)
    .trim()
    .messages({
      'string.empty': 'Report query cannot be empty',
      'string.max': 'Report query cannot exceed 1000 characters',
    }),
  tenantId: Joi.string()
    .required()
    .uuid()
    .messages({
      'string.guid': 'Invalid tenant ID format',
    }),
  format: Joi.string()
    .required()
    .valid('pdf', 'excel')
    .messages({
      'any.only': 'Report format must be either "pdf" or "excel"',
    }),
  includeCharts: Joi.boolean()
    .optional()
    .default(true),
  includeRecommendations: Joi.boolean()
    .optional()
    .default(true),
});

export const reportIdSchema = Joi.object({
  id: Joi.string()
    .required()
    .uuid()
    .messages({
      'string.guid': 'Invalid report ID format',
    }),
});

export const reportListSchema = Joi.object({
  limit: Joi.number()
    .optional()
    .integer()
    .min(1)
    .max(100)
    .default(20),
  offset: Joi.number()
    .optional()
    .integer()
    .min(0)
    .default(0),
  status: Joi.string()
    .optional()
    .valid('queued', 'processing', 'completed', 'failed'),
});

// ============================================================================
// Query Parser Validation
// ============================================================================

export const parsedQuerySchema = Joi.object({
  type: Joi.string()
    .required()
    .valid('search', 'report'),
  scope: Joi.string()
    .required()
    .valid('device', 'meter', 'location', 'all'),
  filters: Joi.object({
    locations: Joi.array().items(Joi.string()).optional(),
    deviceTypes: Joi.array().items(Joi.string()).optional(),
    consumptionRange: Joi.object({
      min: Joi.number().required(),
      max: Joi.number().required(),
    }).optional(),
    status: Joi.array().items(Joi.string()).optional(),
    timeRange: Joi.object({
      start: Joi.string().isoDate().required(),
      end: Joi.string().isoDate().required(),
    }).optional(),
  }).required(),
  metrics: Joi.array().items(Joi.string()).optional(),
  groupBy: Joi.string().optional(),
  confidence: Joi.number().required().min(0).max(1),
  suggestions: Joi.array().items(Joi.string()).optional(),
});

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validates a search request
 */
export function validateSearchRequest(data: any) {
  return searchRequestSchema.validate(data, { abortEarly: false });
}

/**
 * Validates an insights request
 */
export function validateInsightsRequest(data: any) {
  return insightsRequestSchema.validate(data, { abortEarly: false });
}

/**
 * Validates a report request
 */
export function validateReportRequest(data: any) {
  return reportRequestSchema.validate(data, { abortEarly: false });
}

/**
 * Validates a report ID
 */
export function validateReportId(data: any) {
  return reportIdSchema.validate(data, { abortEarly: false });
}

/**
 * Validates report list query parameters
 */
export function validateReportList(data: any) {
  return reportListSchema.validate(data, { abortEarly: false });
}

/**
 * Validates a parsed query
 */
export function validateParsedQuery(data: any) {
  return parsedQuerySchema.validate(data, { abortEarly: false });
}

/**
 * Formats validation errors for API response
 */
export function formatValidationErrors(error: Joi.ValidationError): Record<string, string> {
  const errors: Record<string, string> = {};
  error.details.forEach((detail) => {
    const path = detail.path.join('.');
    errors[path] = detail.message;
  });
  return errors;
}
