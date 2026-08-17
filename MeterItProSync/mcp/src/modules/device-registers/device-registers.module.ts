/**
 * Device-Registers module - bundles device-register-related services
 */

import { DeviceRegistersService } from './device-registers.service';

export class DeviceRegistersModule {
  static forRoot(syncDatabase: any): { service: DeviceRegistersService } {
    return {
      service: new DeviceRegistersService(syncDatabase),
    };
  }
}

export { DeviceRegistersService };
