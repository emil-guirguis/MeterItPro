// /**
//  * MeterStatusLog Model with Schema Definition
//  * 
//  * Auto-generated from database schema
//  * Single source of truth for MeterStatusLog entity
//  */

// const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
// const { defineSchema, field, relationship, FieldTypes, RelationshipTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

// class MeterStatusLog extends BaseModel {
//     constructor(data = {}) {
//         super(data);
        
//         // Auto-initialize all fields from schema
//         MeterStatusLog.schema.initializeFromData(this, data);
//     }
    
//     /**
//      * @override
//      */
//     static get tableName() {
//         return 'meter_status_log';
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
//             entityName: 'MeterStatusLog',
//             tableName: 'meter_status_log',
//             description: 'MeterStatusLog entity',
            
//             // Form fields - user can edit these
//             formFields: {
//                 meterId: field({
//                     type: FieldTypes.NUMBER,
//                     default: 0,
//                     required: true,
//                     label: 'Meter Id',
//                     dbField: 'meter_id',
//                 }),
//                 oldStatus: field({
//                     type: FieldTypes.STRING,
//                     default: '',
//                     required: false,
//                     label: 'Old Status',
//                     dbField: 'old_status',
//                     maxLength: 50,
//                 }),
//                 newStatus: field({
//                     type: FieldTypes.STRING,
//                     default: '',
//                     required: true,
//                     label: 'New Status',
//                     dbField: 'new_status',
//                     maxLength: 50,
//                 }),
//                 reason: field({
//                     type: FieldTypes.STRING,
//                     default: '',
//                     required: false,
//                     label: 'Reason',
//                     dbField: 'reason',
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

// module.exports = MeterStatusLog;
