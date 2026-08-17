/**
 * Tenants module - bundles tenant-related services
 */

import { TenantsService } from './tenants.service';

export class TenantsModule {
  static forRoot(syncDatabase: any): { service: TenantsService } {
    return {
      service: new TenantsService(syncDatabase),
    };
  }
}

export { TenantsService };
