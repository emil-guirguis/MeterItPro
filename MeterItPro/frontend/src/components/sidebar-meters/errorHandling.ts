import type { Meter } from './types';

/**
 * Error Handling and Validation Module
 * Handles tenant validation, error messages, and user feedback
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class TenantAccessError extends Error {
  constructor(message: string = 'You do not have access to this meter.') {
    super(message);
    this.name = 'TenantAccessError';
  }
}

/**
 * Validate that a meter belongs to the current tenant
 * @param meter - The meter to validate
 * @param tenantId - The current tenant ID
 * @throws TenantAccessError if meter does not belong to tenant
 */
export function validateMeterBelongsToTenant(meter: Meter, tenantId: string): void {
  if (meter.tenantId !== tenantId) {
    throw new TenantAccessError(
      `Meter ${meter.id} does not belong to tenant ${tenantId}`
    );
  }
}

/**
 * Validate tenant ID format
 * @param tenantId - The tenant ID to validate
 * @throws ValidationError if tenant ID is invalid
 */
export function validateTenantId(tenantId: string | number): void {
  if (!tenantId || (typeof tenantId === 'string' && tenantId.trim() === '')) {
    throw new ValidationError('Tenant ID is required');
  }
}

/**
 * Validate user ID format
 * @param userId - The user ID to validate
 * @throws ValidationError if user ID is invalid
 */
export function validateUserId(userId: string | number): void {
  if (!userId || (typeof userId === 'string' && userId.trim() === '')) {
    throw new ValidationError('User ID is required');
  }
}

/**
 * Validate meter ID format
 * @param meterId - The meter ID to validate
 * @throws ValidationError if meter ID is invalid
 */
export function validateMeterId(meterId: string | number): void {
  if (!meterId || (typeof meterId === 'string' && meterId.trim() === '')) {
    throw new ValidationError('Meter ID is required');
  }
}

/**
 * Get user-friendly error message
 * @param error - The error to convert
 * @returns User-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof TenantAccessError) {
    return 'You do not have access to this meter.';
  }
  if (error instanceof ValidationError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred. Please refresh the page.';
}

/**
 * Error messages for different scenarios
 */
export const ERROR_MESSAGES = {
  METER_LOAD_FAILURE: 'Failed to load meters. Please try again.',
  FAVORITE_OPERATION_FAILURE: 'Failed to update favorite. Please try again.',
  READINGS_LOAD_FAILURE: 'Failed to load readings. Please try again.',
  TENANT_VALIDATION_FAILURE: 'Tenant validation failed. Please refresh the page.',
  CROSS_TENANT_ACCESS: 'You do not have access to this meter.',
  NETWORK_ERROR: 'Network error occurred. Please check your connection.',
  UNEXPECTED_ERROR: 'An unexpected error occurred. Please refresh the page.',
};

/**
 * Handle API errors and return appropriate message
 * @param error - The error from API
 * @returns Error message to display to user
 */
export function handleApiError(error: unknown): string {
  if (error instanceof TenantAccessError) {
    return ERROR_MESSAGES.CROSS_TENANT_ACCESS;
  }
  if (error instanceof ValidationError) {
    return ERROR_MESSAGES.TENANT_VALIDATION_FAILURE;
  }
  if (error instanceof Error) {
    if (error.message.includes('401') || error.message.includes('403')) {
      return ERROR_MESSAGES.CROSS_TENANT_ACCESS;
    }
    if (error.message.includes('Network')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    return error.message;
  }
  return ERROR_MESSAGES.UNEXPECTED_ERROR;
}
