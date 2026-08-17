/**
 * Dashboard Formatters
 * 
 * Utility functions for formatting numbers, currency, percentages, and other values
 * for display in dashboard components
 */

/**
 * Format a number with thousands separator and optional decimal places
 * 
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 0)
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted number string
 */
export function formatNumber(
  value: number | null | undefined,
  decimals: number = 0,
  locale: string = 'en-US'
): string {
  if (value === null || value === undefined) {
    return '-';
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Format a number as currency
 * 
 * @param value - Number to format
 * @param currency - Currency code (default: 'USD')
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number | null | undefined,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  if (value === null || value === undefined) {
    return '-';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(value);
}

/**
 * Format a number as percentage
 * 
 * @param value - Number to format (0-1 or 0-100 depending on isDecimal)
 * @param decimals - Number of decimal places (default: 1)
 * @param isDecimal - Whether value is in decimal form (0-1) or percentage form (0-100)
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number | null | undefined,
  decimals: number = 1,
  isDecimal: boolean = true,
  locale: string = 'en-US'
): string {
  if (value === null || value === undefined) {
    return '-';
  }

  // Convert decimal to percentage if needed
  const percentValue = isDecimal ? value * 100 : value;

  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(isDecimal ? value : percentValue / 100);
}

/**
 * Format a number with a unit suffix (K, M, B, etc.)
 * 
 * @param value - Number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted number with unit suffix
 */
export function formatCompact(value: number | null | undefined, decimals: number = 1): string {
  if (value === null || value === undefined) {
    return '-';
  }

  const absValue = Math.abs(value);

  if (absValue >= 1e9) {
    return (value / 1e9).toFixed(decimals) + 'B';
  }
  if (absValue >= 1e6) {
    return (value / 1e6).toFixed(decimals) + 'M';
  }
  if (absValue >= 1e3) {
    return (value / 1e3).toFixed(decimals) + 'K';
  }

  return value.toFixed(decimals);
}

/**
 * Format a date string or Date object
 * 
 * @param date - Date to format
 * @param format - Format type ('short', 'long', 'full', 'time')
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | null | undefined,
  format: 'short' | 'long' | 'full' | 'time' = 'short',
  locale: string = 'en-US'
): string {
  if (!date) {
    return '-';
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '-';
  }

  const optionsMap: Record<string, Intl.DateTimeFormatOptions> = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    full: { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
    time: { hour: '2-digit', minute: '2-digit', second: '2-digit' }
  };

  const options = optionsMap[format] || optionsMap.short;

  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

/**
 * Format a time duration in milliseconds to a human-readable string
 * 
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || ms < 0) {
    return '-';
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }

  return `${seconds}s`;
}

/**
 * Format bytes to human-readable size
 * 
 * @param bytes - Size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted size string
 */
export function formatBytes(bytes: number | null | undefined, decimals: number = 2): string {
  if (bytes === null || bytes === undefined || bytes === 0) {
    return '0 B';
  }

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Format a value with a custom formatter function
 * 
 * @param value - Value to format
 * @param formatter - Custom formatter function
 * @param fallback - Fallback value if formatter fails
 * @returns Formatted value
 */
export function formatCustom<T>(
  value: T | null | undefined,
  formatter: (value: T) => string,
  fallback: string = '-'
): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  try {
    return formatter(value);
  } catch {
    return fallback;
  }
}

/**
 * Format a number with a prefix and suffix
 * 
 * @param value - Number to format
 * @param prefix - Prefix string
 * @param suffix - Suffix string
 * @param decimals - Number of decimal places
 * @returns Formatted string with prefix and suffix
 */
export function formatWithAffixes(
  value: number | null | undefined,
  prefix: string = '',
  suffix: string = '',
  decimals: number = 0
): string {
  if (value === null || value === undefined) {
    return '-';
  }

  const formatted = formatNumber(value, decimals);
  return `${prefix}${formatted}${suffix}`;
}

/**
 * Format a value as a trend indicator (up/down arrow with percentage)
 * 
 * @param current - Current value
 * @param previous - Previous value
 * @param decimals - Number of decimal places (default: 1)
 * @returns Trend string with arrow and percentage
 */
export function formatTrend(
  current: number | null | undefined,
  previous: number | null | undefined,
  decimals: number = 1
): string {
  if (current === null || current === undefined || previous === null || previous === undefined) {
    return '-';
  }

  if (previous === 0) {
    return current > 0 ? '↑ ∞' : current < 0 ? '↓ ∞' : '→ 0%';
  }

  const change = ((current - previous) / Math.abs(previous)) * 100;
  const arrow = change > 0 ? '↑' : change < 0 ? '↓' : '→';
  const percentage = Math.abs(change).toFixed(decimals);

  return `${arrow} ${percentage}%`;
}
