/**
 * Device-Registers service - handles device-register association operations
 */

import { DeviceRegisterEntity } from '../../entities';
import { SyncDatabase } from '../../types';

export class DeviceRegistersService {
  constructor(private readonly syncDatabase: SyncDatabase) {}

  /**
   * Get all device-register associations
   */
  async getDeviceRegisters(): Promise<DeviceRegisterEntity[]> {
    return this.syncDatabase.getDeviceRegisters();
  }

  /**
   * Upsert a device-register association (insert or update)
   */
  async upsertDeviceRegister(deviceRegister: DeviceRegisterEntity): Promise<void> {
    return this.syncDatabase.upsertDeviceRegister(deviceRegister);
  }

  /**
   * Delete a device-register association
   */
  async deleteDeviceRegister(deviceId: number, registerId: number): Promise<void> {
    return this.syncDatabase.deleteDeviceRegister(deviceId, registerId);
  }
}
