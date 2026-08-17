// Export all services from this file
export { default as authService } from './authService';
export { apiClient } from './apiClient';
export { meterReadingService } from './meterReadingService';
export { mcpService } from './mcpService';
export { dashboardService } from './dashboardService';

// Note: contactService, deviceService, locationService, meterService, and userService
// have been moved to their respective feature folders:
// - MeterItPro/frontend/src/features/contacts/contactsStore.ts
// - MeterItPro/frontend/src/features/devices/devicesStore.ts
// - MeterItPro/frontend/src/features/locations/locationsStore.ts
// - MeterItPro/frontend/src/features/meters/meterService.ts
// - MeterItPro/frontend/src/features/users/userService.ts
