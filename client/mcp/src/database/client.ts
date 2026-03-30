import pg from 'pg';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

export class DatabaseClient {
  private pool: pg.Pool | null = null;

  private getPool(): pg.Pool {
    if (!this.pool) {
      this.pool = new Pool({
        host: config.database.host,
        port: config.database.port,
        database: config.database.database,
        user: config.database.user,
        password: config.database.password,
        ssl: false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 30000,
        statement_timeout: 30000,
        query_timeout: 30000,
      });

      this.pool.on('error', (err) => {
        logger.error('Unexpected database error', { error: err.message });
      });
    }
    return this.pool;
  }

  async query<T extends pg.QueryResultRow = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.getPool().query<T>(text, params);
      const duration = Date.now() - start;
      logger.debug('Executed query', { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      logger.error('Database query error', { text, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.pool) await this.pool.end();
    logger.info('Database connection pool closed');
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      logger.info('Database connection test successful');
      return true;
    } catch (error) {
      logger.error('Database connection test failed', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }
}

export const db = new DatabaseClient();
