/**
 * Consistent error logging with SQL display
 */

export function logError(context: string, error: any): void {
  if (error.sql) {
    console.error(`${context}:`, error.message);
    console.error('SQL:', error.sql);
    console.error('Params:', error.sqlParams);
  } else {
    console.error(`${context}:`, error);
  }
}
