/**
 * Meters module - bundles meter-related services
 */

import { MetersService } from './meters.service';

export class MetersModule {
  static forRoot(syncDatabase: any): { service: MetersService } {
    return {
      service: new MetersService(syncDatabase),
    };
  }
}

export { MetersService };
