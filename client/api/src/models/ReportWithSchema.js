/**
 * Report Model with Schema Definition
 * 
 * Single source of truth for Report entity schema.
 * Frontend will fetch this schema via API instead of duplicating it.
 */

const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
const { defineSchema, field, tab, section, FieldTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

class Report extends BaseModel {
    constructor(data = {}) {
        super(data);
        Report.schema.initializeFromData(this, data);
    }

    get report_id() {
        return this.id;
    }

    set report_id(value) {
        this.id = value;
    }

    static get tableName() {
        return 'report';
    }

    static get primaryKey() {
        return 'report_id';
    }

    static get schema() {
        const schemaDefinition = {
            entityName: 'Report',
            tableName: 'report',
            description: 'Scheduled report configuration for automated email delivery',
            formMaxWidth: '600px',

            formTabs: [
                tab({
                    name: 'Basic Info',
                    order: 1,
                    sections: [
                        section({
                            name: 'Report Details',
                            order: 1,
                            flex: 1,
                            fields: [
                                field({
                                    name: 'name',
                                    order: 1,
                                    type: FieldTypes.STRING,
                                    default: '',
                                    required: true,
                                    label: 'Report Name',
                                    dbField: 'name',
                                    minLength: 1,
                                    maxLength: 255,
                                    placeholder: 'Monthly Usage Report',
                                    filterable: ['main'],
                                    showOn: ['list', 'form'],
                                }),
                                field({
                                    name: 'type',
                                    order: 2,
                                    type: FieldTypes.SELECT,
                                    default: 'meter_readings',
                                    required: true,
                                    label: 'Report Type',
                                    dbField: 'type',
                                    enumValues: ['meter_readings', 'usage_summary', 'daily_summary'],
                                    enumLabels: {
                                        'meter_readings': 'Meter Readings',
                                        'usage_summary': 'Usage Summary',
                                        'daily_summary': 'Daily Summary'
                                    },
                                    filterable: ['true'],
                                    showOn: ['list', 'form'],
                                }),
                                field({
                                    name: 'enabled',
                                    order: 3,
                                    type: FieldTypes.BOOLEAN,
                                    default: true,
                                    required: false,
                                    label: 'Enabled',
                                    dbField: 'enabled',
                                    filterable: ['true'],
                                    showOn: ['list', 'form'],
                                }),
                            ],
                        }),
                    ],
                }),
                tab({
                    name: 'Schedule',
                    order: 2,
                    sections: [
                        section({
                            name: 'Execution Schedule',
                            order: 1,
                            flex: 1,
                            fields: [
                                field({
                                    name: 'schedule',
                                    order: 1,
                                    type: FieldTypes.STRING,
                                    default: '0 9 * * *',
                                    required: true,
                                    label: 'Schedule',
                                    dbField: 'schedule',
                                    placeholder: '0 9 * * * (Daily at 9 AM)',
                                    helpText: 'Cron format: minute hour day month day-of-week. Examples: 0 9 * * * (Daily at 9 AM), 0 9 * * 1 (Weekly on Monday)',
                                    showOn: ['form'],
                                    // Mark as custom field for frontend rendering
                                    customField: true,
                                }),
                            ],
                        }),
                    ],
                }),
                tab({
                    name: 'Recipients',
                    order: 3,
                    sections: [
                        section({
                            name: 'Email Recipients',
                            order: 1,
                            flex: 1,
                            fields: [
                                field({
                                    name: 'recipients',
                                    order: 1,
                                    type: FieldTypes.STRING,
                                    default: [],
                                    required: true,
                                    label: 'Email Recipients',
                                    dbField: 'recipients',
                                    placeholder: 'user@example.com',
                                    helpText: 'Add email addresses to receive the report',
                                    showOn: ['form'],
                                    // Mark as custom field for frontend rendering
                                    customField: true,
                                    // Transform array to array for form display (no transformation needed)
                                    fromApi: (value) => {
                                        if (Array.isArray(value)) {
                                            return value;
                                        }
                                        return [];
                                    },
                                    // Keep as array for API
                                    toApi: (value) => {
                                        if (Array.isArray(value)) {
                                            return value;
                                        }
                                        return [];
                                    },
                                }),
                            ],
                        }),
                    ],
                }),
                tab({
                    name: 'Configuration',
                    order: 4,
                    sections: [
                        section({
                            name: 'Type-Specific Settings',
                            order: 1,
                            flex: 1,
                            fields: [
                                field({
                                    name: 'config',
                                    order: 1,
                                    type: FieldTypes.STRING,
                                    default: {},
                                    required: false,
                                    label: 'Configuration',
                                    dbField: 'config',
                                    placeholder: 'Type-specific configuration',
                                    helpText: 'Configuration options specific to the selected report type',
                                    showOn: ['form'],
                                    // Mark as custom field for frontend rendering
                                    customField: true,
                                    // Transform JSON for form display
                                    fromApi: (value) => {
                                        if (typeof value === 'string') {
                                            try {
                                                return JSON.parse(value);
                                            } catch (e) {
                                                return {};
                                            }
                                        }
                                        return value || {};
                                    },
                                    // Keep as object for API
                                    toApi: (value) => {
                                        if (typeof value === 'object') {
                                            return value;
                                        }
                                        return {};
                                    },
                                }),
                            ],
                        }),
                    ],
                }),
                tab({
                    name: 'Meters & Elements',
                    order: 5,
                    sections: [
                        section({
                            name: 'Select Meters and Elements',
                            order: 1,
                            flex: 1,
                            fields: [
                                field({
                                    name: 'meter_ids',
                                    order: 1,
                                    type: FieldTypes.CUSTOM,
                                    label: 'Meters and Elements',
                                    required: false,
                                    default: [],
                                    showOn: ['form'],
                                    customField: true,
                                }),
                                field({
                                    name: 'element_ids',
                                    order: 2,
                                    type: FieldTypes.CUSTOM,
                                    label: 'Selected Elements',
                                    required: false,
                                    default: [],
                                    showOn: ['form'],
                                    customField: true,
                                }),
                            ],
                        }),
                    ],
                }),
                tab({
                    name: 'Registers',
                    order: 6,
                    sections: [
                        section({
                            name: 'Select Registers',
                            order: 1,
                            flex: 1,
                            fields: [
                                field({
                                    name: 'register_ids',
                                    order: 1,
                                    type: FieldTypes.CUSTOM,
                                    label: 'Registers',
                                    required: false,
                                    default: [],
                                    showOn: ['form'],
                                    customField: true,
                                }),
                            ],
                        }),
                    ],
                }),
                tab({
                    name: 'Formatting',
                    order: 7,
                    sections: [
                        section({
                            name: 'Output Format',
                            order: 1,
                            flex: 1,
                            fields: [
                                field({
                                    name: 'html_format',
                                    order: 1,
                                    type: FieldTypes.BOOLEAN,
                                    label: 'Enable HTML Formatting',
                                    required: false,
                                    default: false,
                                    showOn: ['form'],
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        };

        return defineSchema(schemaDefinition);
    }
}

module.exports = Report;
