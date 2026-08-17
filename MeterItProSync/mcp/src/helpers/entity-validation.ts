/**
 * Entity Validation Helpers
 * 
 * Provides reusable validation functions for checking entity existence and integrity.
 * Used across sync operations to ensure referential integrity.
 */

import { Pool } from 'pg';

/**
 * Validate that an entity exists in the database
 * 
 * Generic validation function that checks if an entity with the given ID exists
 * in the specified table.
 * 
 * @param pool - Connection pool to the database
 * @param tableName - Name of the table to check
 * @param entityId - ID of the entity to validate
 * @returns true if entity exists, false otherwise
 */
export async function validateEntityExists(
  pool: Pool,
  tableName: string,
  entityId: number
): Promise<boolean> {
  try {
    const result = await pool.query(
      `SELECT 1 FROM ${tableName} WHERE ${tableName}_id = $1 LIMIT 1`,
      [entityId]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error(`Error validating entity in ${tableName} with ID ${entityId}:`, error);
    return false;
  }
}

/**
 * Validate multiple entities exist in the database
 * 
 * Checks if all entities with the given IDs exist in the specified table.
 * 
 * @param pool - Connection pool to the database
 * @param tableName - Name of the table to check
 * @param entityIds - Array of entity IDs to validate
 * @returns Array of booleans indicating which entities exist
 */
export async function validateEntitiesExist(
  pool: Pool,
  tableName: string,
  entityIds: number[]
): Promise<boolean[]> {
  try {
    const result = await pool.query(
      `SELECT ${tableName}_id AS id FROM ${tableName} WHERE ${tableName}_id = ANY($1::int[])`,
      [entityIds]
    );
    
    const existingIds = new Set(result.rows.map((row: any) => row.id));
    return entityIds.map((id) => existingIds.has(id));
  } catch (error) {
    console.error(`Error validating entities in ${tableName}:`, error);
    return entityIds.map(() => false);
  }
}

/**
 * Validate that all entities in a list exist
 * 
 * @param pool - Connection pool to the database
 * @param tableName - Name of the table to check
 * @param entityIds - Array of entity IDs to validate
 * @returns true if all entities exist, false otherwise
 */
export async function validateAllEntitiesExist(
  pool: Pool,
  tableName: string,
  entityIds: number[]
): Promise<boolean> {
  const results = await validateEntitiesExist(pool, tableName, entityIds);
  return results.every((exists) => exists);
}

/**
 * Get count of entities in a table
 * 
 * @param pool - Connection pool to the database
 * @param tableName - Name of the table
 * @returns Count of entities in the table
 */
export async function getEntityCount(pool: Pool, tableName: string): Promise<number> {
  try {
    const result = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    console.error(`Error getting count from ${tableName}:`, error);
    return 0;
  }
}

/**
 * Get count of entities matching a condition
 * 
 * @param pool - Connection pool to the database
 * @param tableName - Name of the table
 * @param whereClause - WHERE clause condition (without WHERE keyword)
 * @param params - Parameters for the WHERE clause
 * @returns Count of matching entities
 */
export async function getEntityCountWhere(
  pool: Pool,
  tableName: string,
  whereClause: string,
  params: any[] = []
): Promise<number> {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM ${tableName} WHERE ${whereClause}`,
      params
    );
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    console.error(`Error getting count from ${tableName} with condition:`, error);
    return 0;
  }
}
