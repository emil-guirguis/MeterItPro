/**
 * PostgreSQL Database Connection Module
 */

const { Pool } = require('pg');
require('dotenv').config();

class PostgresDB {
    constructor() {
        this.pool = null;
        this.isConnected = false;
    }

    /**
     * Initialize PostgreSQL connection pool
     */
    async connect() {
        try {
            const host = process.env.POSTGRES_CLIENT_HOST || process.env.POSTGRES_HOST;
            const port = process.env.POSTGRES_CLIENT_PORT || process.env.POSTGRES_PORT || '5432';
            const database = process.env.POSTGRES_CLIENT_DB || process.env.POSTGRES_DB;
            const user = process.env.POSTGRES_CLIENT_USER || process.env.POSTGRES_USER;
            const password = process.env.POSTGRES_CLIENT_PASSWORD || process.env.POSTGRES_PASSWORD;

            console.log('=== DATABASE CONNECTION CONFIG ===');
            console.log('Host:', host);
            console.log('Port:', port);
            console.log('Database:', database);
            console.log('User:', user);
            console.log('Password length:', password?.length);
            console.log('==================================');

            this.pool = new Pool({
                host: host,
                port: parseInt(port, 10),
                database: database,
                user: user,
                password: password,
                ssl: { rejectUnauthorized: false },
                max: 20, // Maximum number of clients in the pool
                idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
                connectionTimeoutMillis: 30000, // Return an error after 30 seconds if connection could not be established
                statement_timeout: 30000, // Statement timeout
                query_timeout: 30000, // Query timeout
            });

            // Test the connection
            const client = await this.pool.connect();
            const result = await client.query('SELECT NOW()');
            client.release();

            this.isConnected = true;
            const displayHost = process.env.POSTGRES_CLIENT_HOST || process.env.POSTGRES_HOST;
            const displayPort = process.env.POSTGRES_CLIENT_PORT || process.env.POSTGRES_PORT;
            const displayDb = process.env.POSTGRES_CLIENT_DB || process.env.POSTGRES_DB;
            console.log(`✅ Connected to PostgreSQL -> db: ${displayDb} host: ${displayHost}:${displayPort}`);
            console.log(`Database connection established at: ${result.rows[0].now}`);

            return this.pool;
        } catch (error) {
            const err = /** @type {Error} */ (error);
            console.error('❌ PostgreSQL connection error:', err.message);
            this.isConnected = false;
            throw error;
        }
    }

    /**
     * Get a client from the connection pool
     */
    async getClient() {
        if (!this.pool) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return await this.pool.connect();
    }

    /**
     * Execute a query with parameters
     */
    async query(text, params = []) {
        // Log all queries to console with parameters substituted
        const sqlWithParams = this._interpolateParams(text, params);
        console.log(`█ SQL: ${sqlWithParams}`);
        console.log(`  Params: ${JSON.stringify(params, null, 2)}`);
        
        if (!this.pool) {
            throw new Error('Database not connected. Call connect() first.');
        }

        const client = await this.pool.connect();
        try {
            const startTime = Date.now();
            const result = await client.query(text, params);
            const duration = Date.now() - startTime;

            console.log(`✅ QUERY SUCCESS: Rows affected: ${result.rowCount} Duration: ${duration}ms`);
            return result;
        } catch (error) {
            const err = /** @type {any} */ (error);
            console.error(`❌ DATABASE QUERY ERROR Code:, ${err.code}  Message: ${err.message} Detail: ${err.detail} 
                          Hint: ${err.hint} Full Error: ${JSON.stringify(err, null, 2)}`);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Interpolate parameters into SQL query for display purposes
     */
    _interpolateParams(sql, params) {
        if (!params || params.length === 0) {
            return sql;
        }

        let result = sql;
        params.forEach((param, index) => {
            const placeholder = `$${index + 1}`;
            let value;

            if (param === null) {
                value = 'NULL';
            } else if (typeof param === 'string') {
                value = `'${param.replace(/'/g, "''")}'`;
            } else if (typeof param === 'boolean') {
                value = param ? 'true' : 'false';
            } else if (typeof param === 'object') {
                value = `'${JSON.stringify(param).replace(/'/g, "''")}'`;
            } else {
                value = String(param);
            }

            result = result.replace(placeholder, value);
        });

        return result;
    }

    /**
     * Execute a transaction
     */
    async transaction(callback) {
        console.log('='.repeat(120));
        console.log('🔄 [TRANSACTION] Starting transaction...');
        const client = await this.getClient();
        try {
            await client.query('BEGIN');
            console.log('🔄 [TRANSACTION] BEGIN executed');
            const result = await callback(client);
            console.log('🔄 [TRANSACTION] Callback completed, committing...');
            await client.query('COMMIT');
            console.log('✅ [TRANSACTION] COMMIT executed successfully');
            return result;
        } catch (error) {
            console.error('❌ [TRANSACTION] Error occurred, rolling back:', error instanceof Error ? error.message : error);
            await client.query('ROLLBACK');
            console.log('🔄 [TRANSACTION] ROLLBACK executed');
            throw error;
        } finally {
            client.release();
            console.log('🔄 [TRANSACTION] Client released');
        }
        console.log('='.repeat(120));
    }

    /**
     * Close all connections
     */
    async disconnect() {
        if (this.pool) {
            await this.pool.end();
            this.isConnected = false;
            console.log('✅ PostgreSQL connections closed');
        }
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            connected: this.isConnected,
            totalCount: this.pool?.totalCount || 0,
            idleCount: this.pool?.idleCount || 0,
            waitingCount: this.pool?.waitingCount || 0
        };
    }

    /**
     * Health check for the database
     */
    async healthCheck() {
        try {
            const result = await this.query('SELECT 1 as health_check');
            return {
                status: 'healthy',
                connected: this.isConnected,
                timestamp: new Date().toISOString(),
                response_time: 'fast'
            };
        } catch (error) {
            const err = /** @type {Error} */ (error);
            return {
                status: 'unhealthy',
                connected: false,
                error: err.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// Create a singleton instance
const db = new PostgresDB();

module.exports = db;