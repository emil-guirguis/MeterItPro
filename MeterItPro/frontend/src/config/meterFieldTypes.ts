/**
 * Meter Field Types - Shared between Backend and Frontend
 * 
 * TypeScript version for frontend use
 * Mirrors the backend field configuration
 */

/**
 * Meter configuration object
 */
export interface MeterConfig {
  readingInterval: number;
  units: string;
  multiplier: number;
  registers?: number[];
  communicationProtocol?: string;
  baudRate?: number;
  ipAddress?: string;
  port?: number;
}

/**
 * Meter reading object
 */
export interface MeterReading {
  value: number;
  timestamp: Date;
  unit: string;
  quality: 'good' | 'estimated' | 'questionable';
}

/**
 * Register map field
 */
export interface RegisterMapField {
  name: string;
  register: number;
  absoluteAddress: number;
  description: string;
  units?: string;
  functionality?: string;
  dataType: 'uint16' | 'uint32' | 'int16' | 'int32' | 'float32' | 'string';
  readWrite: 'R' | 'W' | 'R/W';
  bacnetObject?: string;
  bacnetObjectType?: string;
  bacnetObjectName?: string;
  systemElement?: string;
  valueRange?: string;
  publicNotes?: string;
  models?: string;
}

/**
 * Register map
 */
export interface RegisterMap {
  description?: string;
  fields: RegisterMapField[];
}

/**
 * Meter type - Main entity
 */
export type Meter = {
  meterId: number;
  name: string;
  serial_number: string;
  device: string;
  model: string;
  device_id: number;
  ip: string;
  portNumber: number;
  type: 'electric' | 'gas' | 'water' | 'steam' | 'other';
  locationId?: string;
  locationName?: string;
  location?: string;
  configuration: MeterConfig;
  lastReading?: MeterReading;
  status: 'active' | 'inactive' | 'maintenance';
  installDate: Date;
  description?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  updatedBy?: {
    id: string;
    name: string;
    email: string;
  };
};

/**
 * Create meter request type for form submission
 */
export interface CreateMeterRequest {
  meterId: string;
  name?: string;
  device: string;
  model: string;
  device_id: string;
  ip: string;
  serial_number: string;
  portNumber: number;
  location?: string;
  description?: string;
  type?: 'electric' | 'gas' | 'water' | 'steam' | 'other';
}

/**
 * Update meter request type
 */
export interface UpdateMeterRequest extends Partial<CreateMeterRequest> {
  status?: 'active' | 'inactive' | 'maintenance';
}

/**
 * Meter enum values
 */
export const MeterEnums = {
  type: ['electric', 'gas', 'water', 'steam', 'other'] as const,
  status: ['active', 'inactive', 'maintenance'] as const,
  dataType: ['uint16', 'uint32', 'int16', 'int32', 'float32', 'string'] as const,
  readWrite: ['R', 'W', 'R/W'] as const,
  quality: ['good', 'estimated', 'questionable'] as const,
};

/**
 * Field validation rules
 */
export const MeterFieldValidation = {
  meterId: { maxLength: 50 },
  name: { minLength: 3, maxLength: 100 },
  serial_number: { maxLength: 200 },
  device: { maxLength: 100 },
  model: { maxLength: 100 },
  ip: { pattern: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/ },
  portNumber: { min: 1, max: 65535 },
  location: { maxLength: 200 },
  description: { maxLength: 500 },
  notes: { maxLength: 500 },
};
