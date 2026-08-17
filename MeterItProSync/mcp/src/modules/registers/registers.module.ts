/**
 * Registers module - bundles register-related services
 */

import { RegistersService } from './registers.service';

export class RegistersModule {
  static forRoot(syncDatabase: any): { service: RegistersService } {
    return {
      service: new RegistersService(syncDatabase),
    };
  }
}

export { RegistersService };
