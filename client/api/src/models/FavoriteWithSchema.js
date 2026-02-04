/**
 * Favorite Model with Schema
 * Represents the favorite table structure with validation schema
 */

const Joi = require('joi');

/**
 * Favorite Schema Definition
 * Defines the structure and validation rules for favorite records
 */
const favoriteSchema = Joi.object({
  favorite_id: Joi.number().integer().positive().optional(),
  tenant_id: Joi.number().integer().required().description('Tenant ID'),
  users_id: Joi.number().integer().required().description('User ID'),
  table_name: Joi.string().required().description('Module table name'),
  id1: Joi.number().integer().required().description('Meter ID'),
  id2: Joi.number().integer().default(0).description('Meter Element ID'),
});

/**
 * Favorite Model
 * Provides methods for interacting with the favorite table
 */
class Favorite {
  constructor(db) {
    this.db = db;
    this.tableName = 'public.favorite';
    this.schema = favoriteSchema;
  }

  /**
   * Get all favorites for a user in a tenant
   * @param {number} tenantId - The tenant ID
   * @param {number} userId - The user ID
   * @returns {Promise<Array>} Array of favorite records
   */
  async getFavoritesByUser(tenantId, userId) {
    let query = `
      SELECT * FROM ${this.tableName}
      WHERE tenant_id = $1 AND users_id = $2
    `;
    const params = [tenantId, userId];

    query += ` ORDER BY favorite_id DESC`;

    const result = await this.db.query(query, params);
    return result.rows;
  }

  /**
   * Get a specific favorite
   * @param {number} tenantId - The tenant ID
   * @param {number} userId - The user ID
   * @param {string} tableName - The entity table name
   * @param {number} meterId - The meter ID (id1)
   * @param {number} meterElementId - The meter element ID (id2)
   * @returns {Promise<Object|null>} Favorite record or null if not found
   */
  async getFavorite(tenantId, userId, tableName, meterId, meterElementId = 0) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE tenant_id = $1 AND users_id = $2 AND table_name = $3 AND id1 = $4 AND id2 = $5
    `;
    const result = await this.db.query(query, [tenantId, userId, tableName, meterId, meterElementId]);
    return result.rows[0] || null;
  }

  /**
   * Create a new favorite
   * @param {Object} data - Favorite data { tenantId, usersId, tableName, id1, id2 }
   * @returns {Promise<Object>} Created favorite record
   */
  async createFavorite(data) {
    // Validate input
    const { error, value } = this.schema.validate(data);
    if (error) {
      throw new Error(`Validation error: ${error.message}`);
    }

    const { tenant_id, users_id, table_name, id1, id2 = 0 } = value;

    // Check if already exists
    const existing = await this.getFavorite(tenant_id, users_id, table_name, id1, id2);
    if (existing) {
      throw new Error('Favorite already exists');
    }

    const query = `
      INSERT INTO ${this.tableName} (tenant_id, users_id, table_name, id1, id2)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await this.db.query(query, [tenant_id, users_id, table_name, id1, id2]);
    return result.rows[0];
  }

  /**
   * Delete a favorite
   * @param {number} tenantId - The tenant ID
   * @param {number} userId - The user ID
   * @param {string} tableName - The entity table name
   * @param {number} meterId - The meter ID (id1)
   * @param {number} meterElementId - The meter element ID (id2)
   * @returns {Promise<Object|null>} Deleted favorite record or null if not found
   */
  async deleteFavorite(tenantId, userId, tableName, meterId, meterElementId = 0) {
    const query = `
      DELETE FROM ${this.tableName}
      WHERE tenant_id = $1 AND users_id = $2 AND table_name = $3 AND id1 = $4 AND id2 = $5
      RETURNING *
    `;
    const result = await this.db.query(query, [tenantId, userId, tableName, meterId, meterElementId]);
    return result.rows[0] || null;
  }

  /**
   * Check if a favorite exists
   * @param {number} tenantId - The tenant ID
   * @param {number} userId - The user ID
   * @param {string} tableName - The entity table name
   * @param {number} meterId - The meter ID (id1)
   * @param {number} meterElementId - The meter element ID (id2)
   * @returns {Promise<boolean>} True if favorite exists
   */
  async isFavorited(tenantId, userId, tableName, meterId, meterElementId = 0) {
    const favorite = await this.getFavorite(tenantId, userId, tableName, meterId, meterElementId);
    return !!favorite;
  }
}

module.exports = Favorite;
