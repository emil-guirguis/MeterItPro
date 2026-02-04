// /**
//  * EmailTemplates Model with Schema Definition
//  * 
//  * Auto-generated from database schema
//  * Single source of truth for EmailTemplates entity
//  */

// const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
// const { defineSchema, field, relationship, FieldTypes, RelationshipTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

// class EmailTemplates extends BaseModel {
//     constructor(data = {}) {
//         super(data);
        
//         // Auto-initialize all fields from schema
//         EmailTemplates.schema.initializeFromData(this, data);
//     }
    
//     /**
//      * @override
//      */
//     static get tableName() {
//         return 'email_templates';
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
//             entityName: 'EmailTemplates',
//             tableName: 'email_templates',
//             description: 'EmailTemplates entity',
            
//             // Form fields - user can edit these
//             formFields: {
//                 name: field({
//                     type: FieldTypes.STRING,
//                     default: '',
//                     required: true,
//                     label: 'Name',
//                     dbField: 'name',
//                     maxLength: 255,
//                 }),
//                 subject: field({
//                     type: FieldTypes.STRING,
//                     default: '',
//                     required: true,
//                     label: 'Subject',
//                     dbField: 'subject',
//                     maxLength: 500,
//                 }),
//                 content: field({
//                     type: FieldTypes.STRING,
//                     default: '',
//                     required: true,
//                     label: 'Content',
//                     dbField: 'content',
//                 }),
//                 category: field({
//                     type: FieldTypes.STRING,
//                     default: '',
//                     required: true,
//                     label: 'Category',
//                     dbField: 'category',
//                     maxLength: 50,
//                 }),
//                 variables: field({
//                     type: FieldTypes.OBJECT,
//                     default: null,
//                     required: false,
//                     label: 'Variables',
//                     dbField: 'variables',
//                 }),
//                 isdefault: field({
//                     type: FieldTypes.BOOLEAN,
//                     default: false,
//                     required: false,
//                     label: 'Isdefault',
//                     dbField: 'isdefault',
//                 }),
//                 isactive: field({
//                     type: FieldTypes.BOOLEAN,
//                     default: true,
//                     required: false,
//                     label: 'Isactive',
//                     dbField: 'isactive',
//                 }),
//                 usagecount: field({
//                     type: FieldTypes.NUMBER,
//                     default: 0,
//                     required: false,
//                     label: 'Usagecount',
//                     dbField: 'usagecount',
//                 }),
//                 lastused: field({
//                     type: FieldTypes.DATE,
//                     default: '',
//                     required: false,
//                     label: 'Lastused',
//                     dbField: 'lastused',
//                 }),
//                 createdby: field({
//                     type: FieldTypes.NUMBER,
//                     default: 0,
//                     required: false,
//                     label: 'Createdby',
//                     dbField: 'createdby',
//                 })
//             },
            
//             // Entity fields - read-only, system-managed
//             entityFields: {
//                 id: field({
//                     name: 'email_template_id',
//                     type: FieldTypes.NUMBER,
//                     default: null,
//                     readOnly: true,
//                     label: 'Id',
//                     dbField: 'email_template_id',
//                 }),
//                 createdat: field({
//                     type: FieldTypes.DATE,
//                     default: null,
//                     readOnly: true,
//                     label: 'Createdat',
//                     dbField: 'createdat',
//                 }),
//                 updatedat: field({
//                     type: FieldTypes.DATE,
//                     default: null,
//                     readOnly: true,
//                     label: 'Updatedat',
//                     dbField: 'updatedat',
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
//                 emailLogs: relationship({
//                     type: RelationshipTypes.HAS_MANY,
//                     model: 'EmailLogs',
//                     foreignKey: 'template_id',
//                     autoLoad: false,
//                 }),
//             },
            
//             validation: {},
//         });
//     }
// }

// module.exports = EmailTemplates;
