// /**
//  * MeterUsageAlerts Model with Schema Definition
//  * 
//  * Auto-generated from database schema
//  * Single source of truth for MeterUsageAlerts entity
//  */

// const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
// const { defineSchema, field, relationship, FieldTypes, RelationshipTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

// class MeterUsageAlerts extends BaseModel {
//     constructor(data = {}) {
//         super(data);
        
//         // Auto-initialize all fields from schema
//         MeterUsageAlerts.schema.initializeFromData(this, data);
//     }
    
//     /**
//      * @override
//      */
//     static get tableName() {
//         return 'meter_usage_alerts';
//     }
    
//     /**
//      * @override
//      */
//     static get primaryKey() {
//         return 'id';
//     }

//     // ===== SCHEMA DEFINITION (Single Source of Truth) =====
    
//     /**
//      * @override
//      */
//     static get schema() {
//         return defineSchema({
//             entityName: 'MeterUsageAlerts',
//             tableName: 'meter_usage_alerts',
//             description: 'MeterUsageAlerts entity',
            
//             // Form fields - user can edit these
//             formFields: {
//                 meterId: field({
//                     type: FieldTypes.NUMBER,
//                     default: 0,
//                     required: true,
//                     label: 'Meter Id',
//                     dbField: 'meter_id',
//                 }),
//                 alertType: field({
//                     type: FieldTypes.STRING,
//                     default: '',
//                     required: true,
//                     label: 'Alert Type',
//                     dbField: 'alert_type',
//                     maxLength: 50,
//                 }),
//                 alertData: field({
//                     type: FieldTypes.OBJECT,
//                     default: null,
//                     required: false,
//                     label: 'Alert Data',
//                     dbField: 'alert_data',
//                 }),
//                 resolved: field({
//                     type: FieldTypes.BOOLEAN,
//                     default: false,
//                     required: false,
//                     label: 'Resolved',
//                     dbField: 'resolved',
//                 }),
//                 resolvedAt: field({
//                     type: FieldTypes.DATE,
//                     default: '',
//                     required: false,
//                     label: 'Resolved At',
//                     dbField: 'resolved_at',
//                 })
//             },
            
//             // Entity fields - read-only, system-managed
//             entityFields: {
//                 id: field({
//                     name: 'id',
//                     type: FieldTypes.NUMBER,
//                     default: null,
//                     readOnly: true,
//                     label: 'Id',
//                     dbField: 'id',
//                 }),
//                 createdAt: field({
//                     type: FieldTypes.DATE,
//                     default: null,
//                     readOnly: true,
//                     label: 'Created At',
//                     dbField: 'created_at',
//                 }),
//                 updatedAt: field({
//                     type: FieldTypes.DATE,
//                     default: null,
//                     readOnly: true,
//                     label: 'Updated At',
//                     dbField: 'updated_at',
//                 }),
//                 tenantId: field({
//                     type: FieldTypes.NUMBER,
//                     default: null,
//                     readOnly: true,
//                     label: 'Tenant ID',
//                     dbField: 'tenant_id',
//                 })
//             },
            
//             // Relationships
//             relationships: {
//                 meter: relationship({
//                     type: RelationshipTypes.BELONGS_TO,
//                     model: 'Meter',
//                     foreignKey: 'meter_id',
//                     autoLoad: false,
//                 }),
//             },
            
//             validation: {},
//         });
//     }
// }

// module.exports = MeterUsageAlerts;
