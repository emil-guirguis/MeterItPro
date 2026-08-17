/**
 * Framework version utility
 * 
 * This provides a default implementation that can be overridden by client applications.
 * The version follows Tesla-style format: Year.Week.Build
 */

/**
 * Get the application version
 * This is a default implementation that should be overridden by the client app
 * @returns {string} Version string
 */
export function getAppVersion(): string {
  // Try to get version from environment (injected at build time)
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_APP_VERSION) {
    return (import.meta as any).env.VITE_APP_VERSION;
  }
  
  // Fallback for development
  return 'dev';
}

/**
 * Format version for display
 * @param {string} version - Version string
 * @returns {string} Formatted version
 */
export function formatVersion(version: string): string {
  if (version === 'dev') {
    return 'Development';
  }
  return `v${version}`;
}
