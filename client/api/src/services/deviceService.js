/**
 * Device Service for PostgreSQL
 * Uses DeviceWithSchema model
 */

const Device = require('../models/DeviceWithSchema');

class DeviceService {
  /**
   * Validate device input data
   */
  static validateDeviceInput(deviceData, isUpdate = false) {
    const errors = [];

    // Validate manufacturer field
    if (!isUpdate || deviceData.hasOwnProperty('manufacturer')) {
      if (!deviceData.manufacturer) {
        errors.push('Device manufacturer is required');
      } else if (typeof deviceData.manufacturer !== 'string') {
        errors.push('Device manufacturer must be a string');
      } else if (deviceData.manufacturer.trim().length === 0) {
        errors.push('Device manufacturer cannot be empty');
      } else if (deviceData.manufacturer.length > 255) {
        errors.push('Device manufacturer cannot exceed 255 characters');
      }
    }

    // Validate type field
    if (!isUpdate || deviceData.hasOwnProperty('type')) {
      if (!deviceData.type) {
        errors.push('Device type is required');
      } else if (typeof deviceData.type !== 'string') {
        errors.push('Device type must be a string');
      } else if (deviceData.type.trim().length === 0) {
        errors.push('Device type cannot be empty');
      } else if (deviceData.type.length > 255) {
        errors.push('Device type cannot exceed 255 characters');
      }
    }

    // Validate model_number field
    if (!isUpdate || deviceData.hasOwnProperty('modelNumber') || deviceData.hasOwnProperty('model_number')) {
      const modelNumber = deviceData.modelNumber || deviceData.model_number;
      if (modelNumber && typeof modelNumber !== 'string') {
        errors.push('Device model number must be a string');
      } else if (modelNumber && modelNumber.length > 255) {
        errors.push('Device model number cannot exceed 255 characters');
      }
    }

    // Validate description field (optional)
    if (deviceData.hasOwnProperty('description') && deviceData.description !== null) {
      if (typeof deviceData.description !== 'string') {
        errors.push('Device description must be a string');
      }
    }

    return errors;
  }

  /**
   * Create validation error with specific error code
   */
  static createValidationError(errors) {
    const error = /** @type {Error & {code: string, details: string[]}} */ (new Error(`Validation failed: ${errors.join(', ')}`));
    error.code = 'VALIDATION_ERROR';
    error.details = errors;
    return error;
  }

  /**
   * Create database error with specific error code
   */
  static createDatabaseError(originalError, operation) {
    /** @type {Error & {code: string, originalError: any}} */
    let error;

    if (originalError && typeof originalError === 'object' && 'code' in originalError && originalError.code === '23505') {
      // Unique constraint violation
      error = /** @type {Error & {code: string, originalError: any}} */ (new Error('Device manufacturer already exists'));
      error.code = 'DUPLICATE_NAME';
    } else if (originalError && typeof originalError === 'object' && 'code' in originalError && originalError.code === '23503') {
      // Foreign key constraint violation
      error = /** @type {Error & {code: string, originalError: any}} */ (new Error('Cannot delete device: it is referenced by other records'));
      error.code = 'FOREIGN_KEY_VIOLATION';
    } else if (originalError && typeof originalError === 'object' && 'code' in originalError && originalError.code === '22001') {
      // String data too long
      error = /** @type {Error & {code: string, originalError: any}} */ (new Error('Input data exceeds maximum length'));
      error.code = 'DATA_TOO_LONG';
    } else {
      // Generic database error
      error = /** @type {Error & {code: string, originalError: any}} */ (new Error(`Database error during ${operation}`));
      error.code = 'DATABASE_ERROR';
    }

    error.originalError = originalError;
    return error;
  }

  /**
   * Get all devices
   */
  static async getAllDevices(tenantId = null) {
    try {
      const result = await Device.findAll({
        orderBy: 'manufacturer ASC',
        tenantId
      });
      return result.rows;
    } catch (error) {
      console.error('Error fetching devices:', error);
      throw this.createDatabaseError(error, 'device retrieval');
    }
  }

  /**
   * Get device by ID
   */
  static async getDeviceById(id) {
    // Validate ID
    if (!id) {
      throw this.createValidationError(['Device ID is required']);
    }

    try {
      const device = await Device.findById(id);
      return device;
    } catch (error) {
      console.error('Error fetching device by ID:', error);
      throw this.createDatabaseError(error, 'device retrieval');
    }
  }

  /**
   * Create new device
   */
  static async createDevice(deviceData) {
    // Validate input data
    const validationErrors = this.validateDeviceInput(deviceData);
    if (validationErrors.length > 0) {
      throw this.createValidationError(validationErrors);
    }

    try {
      const device = new Device(deviceData);
      await device.save();
      return device;
    } catch (error) {
      console.error('Error creating device:', error);
      throw this.createDatabaseError(error, 'device creation');
    }
  }

  /**
   * Update device
   */
  static async updateDevice(id, updateData) {
    // Validate ID
    if (!id) {
      throw this.createValidationError(['Device ID is required']);
    }

    // Validate input data for update
    const validationErrors = this.validateDeviceInput(updateData, true);
    if (validationErrors.length > 0) {
      throw this.createValidationError(validationErrors);
    }

    try {
      const device = await Device.findById(id);
      if (!device) {
        return null;
      }

      await device.update(updateData);
      return device;
    } catch (error) {
      console.error('Error updating device:', error);
      if (error && typeof error === 'object' && 'code' in error && error.code === 'VALIDATION_ERROR') {
        throw error;
      }
      throw this.createDatabaseError(error, 'device update');
    }
  }

  /**
   * Delete device
   */
  static async deleteDevice(id) {
    // Validate ID
    if (!id) {
      throw this.createValidationError(['Device ID is required']);
    }

    try {
      const device = await Device.findById(id);
      if (!device) {
        return false;
      }
      
      await device.delete();
      return true;
    } catch (error) {
      console.error('Error deleting device:', error);
      throw this.createDatabaseError(error, 'device deletion');
    }
  }
}

module.exports = DeviceService;
