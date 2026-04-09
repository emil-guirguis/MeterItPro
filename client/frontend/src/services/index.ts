// Export all services from this file
export { default as authService } from './authService';
export { apiClient } from './apiClient';
export { meterReadingService } from './meterReadingService';
export { mcpService } from './mcpService';
export { dashboardService } from './dashboardService';

// Note: contactService, deviceService, locationService, meterService, and userService
// have been moved to their respective feature folders:
// - client/frontend/src/features/contacts/contactsStore.ts
// - client/frontend/src/features/devices/devicesStore.ts
// - client/frontend/src/features/locations/locationsStore.ts
// - client/frontend/src/features/meters/meterService.ts
// - client/frontend/src/features/users/userService.ts
