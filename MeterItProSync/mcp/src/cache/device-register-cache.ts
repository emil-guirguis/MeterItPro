/**
 * In-memory cache of device_register mappings
 * Loaded at MCP server startup for fast lookups during meter collection
 * 
 */

export interface CachedDeviceRegister {
  device_id: number;
  register_id: number;
  register: number;
  field_name: string;
  unit: string;
}

export class DeviceRegisterCache {
  private deviceRegisters: Map<any, CachedDeviceRegister[]> = new Map();
  private valid: boolean = false;

  /**
   * Load all device_register mappings from database at startup
   * 
   * Queries the device_register table and joins with register table to get all needed data.
   * Populates the in-memory cache for fast lookups during meter collection.
   */
  async initialize(syncDatabase: any): Promise<void> {
    try {
      console.log('📦 [DeviceRegisterCache] Initializing device_register cache...');

      this.deviceRegisters.clear();
      this.valid = false;

      // Load all device_register mappings with register details
      console.log('📦 [DeviceRegisterCache] Loading device_register mappings from database...');
      const deviceRegisters = await syncDatabase.getDeviceRegisters();
      console.log(`📋 [DeviceRegisterCache] Raw device_registers from DB (${deviceRegisters.length} total): ${JSON.stringify(deviceRegisters)}`);

      if (deviceRegisters.length === 0) {
        console.warn('⚠️  [DeviceRegisterCache] WARNING: No device_register mappings found in database!');
      }

      // Process each device_register mapping
      let deviceCounts: Record<number, number> = {};
      for (const row of deviceRegisters) {
        // Ensure device_id is a number
        const deviceId = Number(row.device_id);

        const cached: CachedDeviceRegister = {
          device_id: deviceId,
          register_id: row.register_id,
          register: row.register,
          field_name: row.field_name,
          unit: row.unit,
        };

        if (!this.deviceRegisters.has(deviceId)) {
          this.deviceRegisters.set(deviceId, []);
        }
        this.deviceRegisters.get(deviceId)!.push(cached);

        // Track count per device
        deviceCounts[deviceId] = (deviceCounts[deviceId] || 0) + 1;
      }

      console.log(`📊 [DeviceRegisterCache] Register count per device:`, JSON.stringify(deviceCounts, null, 2));

      console.log(`✅ [DeviceRegisterCache] Loaded ${this.deviceRegisters.size} devices with ${deviceRegisters.length} total device_register mappings into memory`);

      // Show all devices and their register counts
      const allDevices = Array.from(this.deviceRegisters.entries())
        .map(([deviceId, regs]) => `Device ${deviceId}: ${regs.length} registers`)
        .join(', ');
      console.log(`📊 [DeviceRegisterCache] All devices in cache: ${allDevices}`);

      // Verify map is populated
      console.log(`🔍 [DeviceRegisterCache] Verification - Map size: ${this.deviceRegisters.size}, Total entries: ${Array.from(this.deviceRegisters.values()).reduce((sum, arr) => sum + arr.length, 0)}`);

      this.valid = true;
      console.log('✅ [DeviceRegisterCache] Cache is now VALID and ready for use');
    } catch (error) {
      console.error('❌ [DeviceRegisterCache] Failed to initialize:', error);
      this.valid = false;
      throw error;
    }
  }

  /**
   * Get all registers for a device from cache
   */
  getDeviceRegisters(deviceId: number): CachedDeviceRegister[] {
    deviceId = Number(deviceId);
    const cachedArray = this.deviceRegisters.get(Number(deviceId));
    // Create a copy to prevent external mutations from affecting the returned array
    const result = cachedArray ? [...cachedArray] : [];
    const allDeviceIds = Array.from(this.deviceRegisters.keys());
    console.log(`🔍 [DeviceRegisterCache] getDeviceRegisters(${deviceId}): Found ${result.length} registers`);
    console.log(`   Available devices in cache: [${allDeviceIds.join(', ')}]`);
    if (result.length === 0 && allDeviceIds.length > 0) {
      console.warn(`   ⚠️  Device ${deviceId} NOT found in cache! Available: [${allDeviceIds.join(', ')}]`);
    }
    return result;
  }

  /**
   * Check if cache is valid
   */
  isValid(): boolean {
    return this.valid;
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.deviceRegisters.clear();
    this.valid = false;
  }

  /**
   * Reload cache from database
   */
  async reload(syncDatabase: any): Promise<void> {
    await this.initialize(syncDatabase);
  }
}
