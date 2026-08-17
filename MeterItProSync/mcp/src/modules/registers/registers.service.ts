/**
 * Registers service - handles register-related operations
 */

import { RegisterEntity } from '../../entities';
import { SyncDatabase } from '../../types';

export class RegistersService {
  constructor(private readonly syncDatabase: SyncDatabase) {}

  /**
   * Get all registers
   */
  async getRegisters(): Promise<RegisterEntity[]> {
    return this.syncDatabase.getRegisters();
  }

  /**
   * Upsert a register (insert or update)
   */
  async upsertRegister(register: RegisterEntity): Promise<void> {
    return this.syncDatabase.upsertRegister(register);
  }

  /**
   * Delete a register
   */
  async deleteRegister(registerId: number): Promise<void> {
    return this.syncDatabase.deleteRegister(registerId);
  }
}
