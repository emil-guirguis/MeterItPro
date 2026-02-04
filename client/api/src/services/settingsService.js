const db = require('../config/database');

class SettingsService {
  /**
   * Get company settings from PostgreSQL filtered by tenant ID
   * @param {number} tenantId - The tenant ID from the authenticated user
   */
  static async getCompanySettings(tenantId) {
    try {
      if (!tenantId) {
        throw new Error('Tenant ID is required');
      }

      const result = await db.query('SELECT * FROM tenant WHERE tenant_id = $1', [tenantId]);

      if (result.rows.length === 0) {
        throw new Error('Tenant record not found. Please contact support.');
      }

      return this.formatSettings(result.rows[0]);
    } catch (error) {
      console.error('Error fetching company settings:', error);
      throw error;
    }
  }

  /**
   * Update company settings filtered by tenant ID
   * @param {number} tenantId - The tenant ID from the authenticated user
   * @param {object} updateData - The data to update
   */
  static async updateCompanySettings(tenantId, updateData) {
    try {
      if (!tenantId) {
        throw new Error('Tenant ID is required');
      }

      const existingResult = await db.query('SELECT tenant_id FROM tenant WHERE tenant_id = $1', [tenantId]);

      if (existingResult.rows.length === 0) {
        throw new Error('Tenant record not found. Please contact support.');
      }

      // @ts-ignore - rows is an array of objects with tenant_id property
      const settingsId = existingResult.rows[0].tenant_id;
      return await this.updateSettings(settingsId, updateData);
    } catch (err) {
      console.error('Error updating company settings:', err);
      throw err;
    }
  }

  /**
   * Update existing settings record
   */
  static async updateSettings(settingsId, updateData) {
    try {
      const fields = Object.keys(updateData);
      const values = Object.values(updateData);
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

      const query = `
        UPDATE tenant 
        SET ${setClause}
        WHERE tenant_id = $1
        RETURNING *
      `;

      const result = await db.query(query, [settingsId, ...values]);
      return this.formatSettings(result.rows[0]);
    } catch (error) {
      console.error('Error updating company settings:', error);
      throw error;
    }
  }

  /**
   * Format settings for frontend compatibility
   */
  static formatSettings(dbRow) {
    if (!dbRow) return null;

    return {
      id: dbRow.tenant_id,
      name: dbRow.name,
      url: dbRow.url,
      address: {
        street: dbRow.street,
        street2: dbRow.street2,
        city: dbRow.city,
        state: dbRow.state,
        zipCode: dbRow.zip,
        country: dbRow.country
      },
      systemConfig: {
        timezone: 'America/New_York',
        currency: 'USD',
        businessHours: {}
      },
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }

  /**
   * Convert frontend format back to database format
   */
  static formatForDatabase(frontendData) {
    const dbData = {};

    if (frontendData.name !== undefined) dbData.name = frontendData.name;
    if (frontendData.url !== undefined) dbData.url = frontendData.url;

    if (frontendData.address) {
      if (frontendData.address.street !== undefined) dbData.street = frontendData.address.street;
      if (frontendData.address.street2 !== undefined) dbData.street2 = frontendData.address.street2;
      if (frontendData.address.city !== undefined) dbData.city = frontendData.address.city;
      if (frontendData.address.state !== undefined) dbData.state = frontendData.address.state;
      if (frontendData.address.zipCode !== undefined) dbData.zip = frontendData.address.zipCode;
      if (frontendData.address.country !== undefined) dbData.country = frontendData.address.country;
    }

    return dbData;
  }
}

module.exports = SettingsService;
