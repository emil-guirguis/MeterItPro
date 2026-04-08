/**
 * Execute a SQL query with console logging
 * @param pool - PostgreSQL connection pool
 * @param query - SQL query string
 * @param params - Optional query parameters (array)
 * @param logMessage - Optional message for logging
 * @returns Query result
 */
export async function execQuery(pool, query, params, logMessage) {
    try {
        logMessage = `[SQL]  ${logMessage}`;
        console.log(`\n📝 ${logMessage} Executing: `, query);
        if (params && params.length > 0) {
            console.log(`📋 ${logMessage} Parameters: `, JSON.stringify(params, null, 2));
        }
        const result = await pool.query(query, params);
        console.log(`📊 ${logMessage} Row: ${result.rows.length}`);
        if (result.rows.length > 0) {
            console.log(`📊 ${logMessage} Data: `, JSON.stringify(result.rows[0], null, 2));
        }
        return result;
    }
    catch (error) {
        console.error(`❌ ${logMessage} Failed:`, error);
        throw error;
    }
}
//# sourceMappingURL=sql-functions.js.map