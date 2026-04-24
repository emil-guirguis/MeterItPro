import { formatSqlForDebug } from './worker-logger.js';
import type { Logger } from './logger';
export { formatSqlForDebug } from './worker-logger.js';

export interface Queryable {
  query(text: string, params?: any[]): Promise<{ rows: any[]; rowCount: number | null }>;
}

const consoleLogger: Logger = {
  info:  (msg, ...args) => console.log(msg, ...args),
  error: (msg, ...args) => console.error(msg, ...args),
  warn:  (msg, ...args) => console.warn(msg, ...args),
  debug: (msg, ...args) => console.log(msg, ...args),
};

export async function execQuery(
  pool: Queryable,
  query: string,
  params?: any[],
  logMessage?: string,
  logger: Logger = consoleLogger
): Promise<{ rows: any[]; rowCount: number | null }> {
  const label = logMessage ? `[execQuery] ${logMessage}` : '[execQuery]';
  try {
    logger.info(`${label} Executing:\n${formatSqlForDebug(query, params || [])}`);
    const result = await pool.query(query, params);
    logger.info(`${label} Rows: ${result.rows.length}`);
    return result;
  } catch (error) {
    logger.error(`${label} Failed: ${error}`);
    throw error;
  }
}
