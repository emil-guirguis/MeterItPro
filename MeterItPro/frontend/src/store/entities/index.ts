// Entity Stores Index

// Export all entity stores
export * from '../../features/users/usersStore';
export * from '../../features/locations/locationsStore';
export * from '../../features/contacts/contactsStore';
export * from '../../features/meters/metersStore';
export * from './settingsStore';

// Export CRUD patterns
export * from '../patterns/crudOperations';

// Create a centralized entity manager
import { useUsersStore, useUsersEnhanced } from '../../features/users/usersStore';
import { useLocationsStore, useLocationsEnhanced } from '../../features/locations/locationsStore';
import { useContactsStore, useContactsEnhanced } from '../../features/contacts/contactsStore';
import { useMetersStore, useMetersEnhanced } from '../../features/meters/metersStore';
import { useSettingsStore, useSettingsEnhanced } from './settingsStore';
import { clearCache } from '../middleware/apiMiddleware';

// Entity manager for global operations
export const entityManager = {
  // Store references
  stores: {
    users: useUsersStore,
    locations: useLocationsStore,
    contacts: useContactsStore,
    meters: useMetersStore,
    settings: useSettingsStore,
  },

  // Enhanced hooks
  hooks: {
    users: useUsersEnhanced,
    locations: useLocationsEnhanced,
    contacts: useContactsEnhanced,
    meters: useMetersEnhanced,
    settings: useSettingsEnhanced,
  },

  // Global operations
  clearAllCaches: () => {
    clearCache();
  },

  resetAllStores: () => {
    useUsersStore.getState().reset();
    useLocationsStore.getState().reset();
    useContactsStore.getState().reset();
    useMetersStore.getState().reset();
    useSettingsStore.getState().reset();
  },

  // Bulk operations across entities
  refreshAll: async () => {
    const promises = [
      useUsersStore.getState().fetchItems(),
      useLocationsStore.getState().fetchItems(),
      useContactsStore.getState().fetchItems(),
      useMetersStore.getState().fetchItems(),
      useSettingsStore.getState().fetchSettings(),
    ];

    try {
      await Promise.all(promises);
    } catch (error) {
      console.error('Error refreshing all stores:', error);
      throw error;
    }
  },

  // Get loading state across all entities
  getGlobalLoadingState: () => {
    const usersLoading = useUsersStore.getState().loading || useUsersStore.getState().list.loading;
    const locationsLoading = useLocationsStore.getState().loading || useLocationsStore.getState().list.loading;
    const contactsLoading = useContactsStore.getState().loading || useContactsStore.getState().list.loading;
    const metersLoading = useMetersStore.getState().loading || useMetersStore.getState().list.loading;
    const settingsLoading = useSettingsStore.getState().loading;

    return {
      isLoading: usersLoading || locationsLoading || contactsLoading || metersLoading || settingsLoading,
      users: usersLoading,
      locations: locationsLoading,
      contacts: contactsLoading,
      meters: metersLoading,
      settings: settingsLoading,
    };
  },

  // Get error state across all entities
  getGlobalErrorState: () => {
    const usersError = useUsersStore.getState().error || useUsersStore.getState().list.error;
    const locationsError = useLocationsStore.getState().error || useLocationsStore.getState().list.error;
    const contactsError = useContactsStore.getState().error || useContactsStore.getState().list.error;
    const metersError = useMetersStore.getState().error || useMetersStore.getState().list.error;
    const settingsError = useSettingsStore.getState().error;

    return {
      hasError: !!(usersError || locationsError || contactsError || metersError || settingsError),
      users: usersError,
      locations: locationsError,
      contacts: contactsError,
      meters: metersError,
      settings: settingsError,
    };
  },

  // Statistics across all entities
  getGlobalStats: () => {
    const usersState = useUsersStore.getState();
    const locationsState = useLocationsStore.getState();
    const contactsState = useContactsStore.getState();
    const metersState = useMetersStore.getState();
    const settingsState = useSettingsStore.getState();

    return {
      totalUsers: usersState.total,
      totalLocations: locationsState.total,
      totalContacts: contactsState.total,
      totalMeters: metersState.total,
      activeUsers: usersState.items.filter(u => u.active).length,
      activeLocations: locationsState.items.filter((b: any) => b.active).length,
      activeContacts: contactsState.items.filter((c: any) => c.active).length,
      activeMeters: metersState.items.filter((m: any) => m.active).length,
      lastUpdated: Math.max(
        usersState.lastFetch || 0,
        locationsState.lastFetch || 0,
        contactsState.lastFetch || 0,
        metersState.lastFetch || 0,
        settingsState.lastFetch || 0
      ),
    };
  },
};

// Hook for global entity state
export const useEntityManager = () => {
  const usersState = useUsersStore();
  const locationsState = useLocationsStore();
  const contactsState = useContactsStore();
  const metersState = useMetersStore();
  const settingsState = useSettingsStore();

  return {
    // Individual states
    users: usersState,
    locations: locationsState,
    contacts: contactsState,
    meters: metersState,
    settings: settingsState,

    // Global operations
    ...entityManager,

    // Computed global state
    globalLoading: entityManager.getGlobalLoadingState(),
    globalError: entityManager.getGlobalErrorState(),
    globalStats: entityManager.getGlobalStats(),
  };
};

// Entity type registry for dynamic operations
export const entityRegistry = {
  users: {
    store: useUsersStore,
    hook: useUsersEnhanced,
    name: 'User',
    pluralName: 'Users',
  },
  locations: {
    store: useLocationsStore,
    hook: useLocationsEnhanced,
    name: 'Location',
    pluralName: 'Locations',
  },
  contacts: {
    store: useContactsStore,
    hook: useContactsEnhanced,
    name: 'Contact',
    pluralName: 'Contacts',
  },
  meters: {
    store: useMetersStore,
    hook: useMetersEnhanced,
    name: 'Meter',
    pluralName: 'Meters',
  },
} as const;

export type EntityType = keyof typeof entityRegistry;

// Generic entity operations that work with any registered entity
export const createGenericEntityOperations = <T extends EntityType>(entityType: T) => {
  const config = entityRegistry[entityType];

  return {
    getStore: () => config.store,
    useHook: config.hook,
    getName: () => config.name,
    getPluralName: () => config.pluralName,

    // Generic operations
    fetchAll: () => config.store.getState().fetchItems(),
    create: (data: any) => config.store.getState().createItem(data),
    update: (id: string, data: any) => config.store.getState().updateItemById(id, data),
    delete: (id: string) => config.store.getState().deleteItem(id),
    reset: () => config.store.getState().reset(),
  };
};
