/**
 * SQL query formatting utilities for debugging
 */

/**
 * Format SQL query with parameters substituted for easy debugging
 * Replaces $1, $2, etc. with actual parameter values and formats with line breaks
 *
 * @param sql - SQL query string with $1, $2, etc. placeholders
 * @param params - Array of parameter values
 * @returns Formatted SQL string with parameters substituted and keywords on new lines
 */
export function formatSqlForDebug(sql: string, params: any[]): string {
  let paramIndex = 1;
  let formattedSql = sql;

  // Replace $1, $2, etc. with actual parameter values
  params.forEach((param) => {
    const placeholder = `$${paramIndex}`;
    let value: string;

    if (param === null || param === undefined) {
      value = 'NULL';
    } else if (typeof param === 'string') {
      value = `'${param.replace(/'/g, "''")}'`;
    } else if (param instanceof Date) {
      value = `'${param.toISOString()}'`;
    } else {
      value = String(param);
    }

    formattedSql = formattedSql.replace(placeholder, value);
    paramIndex++;
  });

  // Format for readability - add line breaks before major SQL keywords
  formattedSql = formattedSql
    .replace(/\bFROM\b/gi, '\nFROM')
    .replace(/\bJOIN\b/gi, '\nJOIN')
    .replace(/\bWHERE\b/gi, '\nWHERE')
    .replace(/\bGROUP BY\b/gi, '\nGROUP BY')
    .replace(/\bORDER BY\b/gi, '\nORDER BY')
    .replace(/\bLIMIT\b/gi, '\nLIMIT')
    .replace(/\bOFFSET\b/gi, '\nOFFSET')
    .replace(/\bAND\b/gi, '\n  AND')
    .replace(/\bON\b/gi, '\n  ON');

  return formattedSql;
}
