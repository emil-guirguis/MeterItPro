export interface Meter {
  id: string | number;
  name: string;
  identifier: string;
  type?: 'physical' | 'virtual';
  meterId?: string;
  device?: string; // From device table
  model?: string; // From device table
  device_id?: string; // For backend compatibility
  ip?: string;
  serial_number?: string;
  portNumber?: number;
  location?: string;
  description?: string;
  meterType?: 'electric' | 'gas' | 'water' | 'steam' | 'other';
  status?: 'operational' | 'maintenance' | 'offline';
  installDate?: Date;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  createdAt?: string;
  updatedAt?: string;
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
}

/**
 * Configuration for a virtual meter that combines multiple physical meters
 */
export interface VirtualMeterConfig {
  meterId: string | number;
  selectedMeterIds: (string | number)[];
  selectedMeterElementIds: (string | number)[];
}

