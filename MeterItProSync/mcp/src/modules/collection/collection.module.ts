/**
 * Collection module - bundles collection-related services
 */

import { CollectionService } from './collection.service';
import { CollectionCycleManagerService } from './collection-cycle-manager.service';

export class CollectionModule {
  static forRoot(syncDatabase: any): {
    collectionService: CollectionService;
    collectionCycleManagerService: CollectionCycleManagerService;
  } {
    return {
      collectionService: new CollectionService(syncDatabase),
      collectionCycleManagerService: new CollectionCycleManagerService(syncDatabase),
    };
  }
}

export { CollectionService, CollectionCycleManagerService };
