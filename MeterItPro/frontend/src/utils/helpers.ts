/**
 * Utility helper functions
 */

/**
 * Format a date to a readable string
 * @param date - Date object, string, or undefined
 * @returns Formatted date string or 'N/A' if date is undefined
 */
export const formatDate = (date: Date | string | undefined): string => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
