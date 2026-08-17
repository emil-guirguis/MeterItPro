/**
 * Sync module - bundles sync-related services
 */

import { SyncService } from './sync.service';
import { SyncManagerService } from './sync-manager.service';

export class SyncModule {
  static forRoot(syncDatabase: any): { syncService: SyncService; syncManagerService: SyncManagerService } {
    return {
      syncService: new SyncService(syncDatabase),
      syncManagerService: new SyncManagerService(syncDatabase),
    };
  }
}

export { SyncService, SyncManagerService };
