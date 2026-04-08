import { Pool, QueryResult } from 'pg';
/**
 * Execute a SQL query with console logging
 * @param pool - PostgreSQL connection pool
 * @param query - SQL query string
 * @param params - Optional query parameters (array)
 * @param logMessage - Optional message for logging
 * @returns Query result
 */
export declare function execQuery(pool: Pool, query: string, params?: any[], logMessage?: string): Promise<QueryResult>;
