/**
 * Meter Reading Mapper
 * 
 * Generates field mappings from MeterReadingsWithSchema
 * Eliminates duplication between schema and route handlers
 */

let MeterReadings = null;

/**
 * Get all expected fields from the schema
 * @returns {Array<string>} Array of field names
 */
function getExpectedFields() {
  // Lazy load the model to avoid circular dependencies
  if (!MeterReadings) {
    try {
      MeterReadings = require('../models/MeterReadingsWithSchema');
    } catch (error) {
      console.error('[meterReadingMapper] Failed to load MeterReadingsWithSchema:', error);
      return [];
    }
  }
  
  const schema = MeterReadings.schema;
  console.log('[meterReadingMapper] Schema:', schema);
  
  if (!schema) {
    console.warn('[meterReadingMapper] No schema found!');
    return [];
  }
  
  const fields = [];
  
  // Add form fields
  if (schema.formFields) {
    console.log('[meterReadingMapper] Form fields:', Object.keys(schema.formFields));
    fields.push(...Object.keys(schema.formFields));
  }
  
  // Add entity fields
  if (schema.entityFields) {
    console.log('[meterReadingMapper] Entity fields:', Object.keys(schema.entityFields));
    fields.push(...Object.keys(schema.entityFields));
  }
  
  console.log('[meterReadingMapper] All expected fields:', fields);
  
  return fields;
}

/**
 * Map database row to frontend reading object
 * Uses schema definition to ensure consistency
 * 
 * @param {Object} pg - Database row
 * @returns {Object} Frontend reading object
 */
function toFrontendReading(pg) {
  const expectedFields = getExpectedFields();
  
  console.log('[meterReadingMapper] Expected fields:', expectedFields);
  console.log('[meterReadingMapper] Input row keys:', Object.keys(pg));
  console.log('[meterReadingMapper] Input row:', JSON.stringify(pg, null, 2));
  
  const base = {};
  
  // Map all fields from database row
  expectedFields.forEach((key) => {
    base[key] = pg[key] ?? null;
  });
  
  console.log('[meterReadingMapper] Output object:', JSON.stringify(base, null, 2));
  
  return base;
}

module.exports = {
  getExpectedFields,
  toFrontendReading,
};
