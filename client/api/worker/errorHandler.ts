/**
 * Consistent error logging with SQL display
 */

import { formatSqlForDebug } from './db';

export function logError(context: string, error: any): void {
  if (error.sql) {
    console.error(`${context}:`, error.message);
    console.error('[SQL]', formatSqlForDebug(error.sql, error.sqlParams || []));
  } else {
    console.error(`${context}:`, error);
  }
}
