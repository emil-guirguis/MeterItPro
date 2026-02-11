/**
 * Device Model with Schema Definition
 * 
 * Auto-generated from database schema
 * Single source of truth for Device entity
 */

const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
const { defineSchema, field, tab, section, relationship, FieldTypes, RelationshipTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');
const { DEVICE_MANUFACTURERS, DEVICE_TYPES } = require('../constants/enumerations.js');

class Device extends BaseModel {
    constructor(data = {}) {
        super(data);

        // Auto-initialize all fields from schema
        Device.schema.initializeFromData(this, data);
    }

    /**
     * @override
     */
    static get tableName() {
        return 'device';
    }

    /**
     * @override
     */
    static get primaryKey() {
        return 'device_id';
    }

    // ===== SCHEMA DEFINITION (Single Source of Truth) =====

    /**
     * @override
     */
    static get schema() {
        return defineSchema({
            entityName: 'Device',
            tableName: 'device',
            description: 'Device entity',
            formMaxWidth: '770px',


            customListColumns: {},

            // NEW: Hierarchical tab structure with embedded field definitions
            formTabs: [
                tab({
                    name: 'General',
                    order: 1,
                    sections: [
                        section({
                            name: '',
                            order: 1,
                            flex: 1,  // Takes remaining space
                            fields: [
                                field({
                                    name: 'manufacturer',
                                    order: 1,
                                    type: FieldTypes.STRING,
                                    default: '',
                                    required: true,
                                    readOnly: true,
                                    label: 'Manufacturer',
                                    dbField: 'manufacturer',
                                    maxLength: 255,
                                    placeholder: 'DENT Instruments',
                                    enumValues: DEVICE_MANUFACTURERS,
                                    showOn: ['list', 'form'],
                                    filertable: ['true'],
                                }),
                                field({
                                    name: 'model_number',
                                    order: 2,
                                    type: FieldTypes.STRING,
                                    default: '',
                                    required: true,
                                    readOnly: true,
                                    label: 'Model Number',
                                    dbField: 'model_number',
                                    maxLength: 255,
                                    placeholder: 'Model',
                                    showOn: ['list', 'form'],
                                }),
                                field({
                                    name: 'description',
                                    order: 3,
                                    type: FieldTypes.STRING,
                                    default: '',
                                    required: false,
                                    readOnly: true,
                                    label: 'Description',
                                    dbField: 'description',
                                    maxLength: 50,
                                    placeholder: 'Device description',
                                    showOn: ['list', 'form'],
                                    filertable: ['main'],
                                }),
                                field({
                                    name: 'type',
                                    order: 4,
                                    type: FieldTypes.STRING,
                                    default: '',
                                    required: true,
                                    readOnly: true,
                                    label: 'Type',
                                    dbField: 'type',
                                    maxLength: 255,
                                    enumValues: DEVICE_TYPES,
                                    placeholder: 'Electric',
                                    showOn: ['list', 'form'],
                                    filertable: ['true'],
                                }),
                            ],
                        }),
                    ],
                }),
                tab({
                    name: 'Registers',
                    order: 2,
                    sections: [
                        section({
                            name: '',
                            order: 1,
                            fields: [
                                field({
                                    name: 'registers',
                                    order: 1,
                                    type: FieldTypes.OBJECT,
                                    default: null,
                                    required: false,
                                    readOnly: true,
                                    label: 'Registers',
                                    showOn: ['form'],
                                }),
                            ],
                        }),
                    ],
                }),
            ],

            // Entity fields - read-only, system-managed
            entityFields: {
                device_id: field({
                    name: 'device_id',
                    order: 1,
                    type: FieldTypes.NUMBER,
                    default: null,
                    readOnly: true,
                    label: 'Id',
                    dbField: 'device_id',
                }),
            },

            // Relationships
            relationships: {
            },

            validation: {},
        });
    }
}

module.exports = Device;
