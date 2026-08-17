export { formatSqlForDebug } from './worker-logger.js';

/** Shared logger interface — satisfied structurally by winston or any compatible logger. */
export interface Logger {
  info(msg: string, ...args: any[]): void;
  error(msg: string, ...args: any[]): void;
  warn(msg: string, ...args: any[]): void;
  debug(msg: string, ...args: any[]): void;
}
