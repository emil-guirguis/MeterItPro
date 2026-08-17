/**
 * Debug Console Utilities
 * 
 * Add these to window for easy access in browser console:
 * - window.debugSchemas() - Show all schemas in memory
 * - window.debugLocations() - Show all locations in auth context
 */

import { logSchemasInMemory } from '@meterit/framework-frontend/components/form/utils/schemaLoader';

export function setupDebugConsole() {
  // Make debug functions available globally
  (window as any).debugSchemas = () => {
    console.log('=== SCHEMA DEBUG ===');
    logSchemasInMemory();
  };

  (window as any).debugLocations = () => {
    console.log('=== LOCATIONS DEBUG ===');
    const authState = localStorage.getItem('auth_state');
    if (authState) {
      try {
        const state = JSON.parse(authState);
        console.log('Auth State:', state);
      } catch (e) {
        console.log('Could not parse auth state');
      }
    }
    console.log('Check AuthContext in React DevTools for live locations');
  };

  (window as any).debugAll = () => {
    console.log('=== FULL DEBUG ===');
    (window as any).debugSchemas();
    (window as any).debugLocations();
  };

  console.log('✅ Debug console ready. Use:');
  console.log('  window.debugSchemas() - Show schemas in memory');
  console.log('  window.debugLocations() - Show locations in auth context');
  console.log('  window.debugAll() - Show everything');
}
