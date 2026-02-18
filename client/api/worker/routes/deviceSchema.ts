// ===== DEVICE (from DeviceWithSchema.js) =====
// @ts-ignore - CommonJS module
const { defineSchema, field, tab, section, FieldTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

export const deviceSchema = defineSchema({
  entityName: 'Device',
  tableName: 'device',
  description: 'Device entity',
  formMaxWidth: '770px',
  defaultSort: 'manufacturer',

  customListColumns: {},

  formTabs: [
    tab({
      name: 'General',
      order: 1,
      sections: [
        section({
          name: '',
          order: 1,
          flex: 1,
          fields: [
            field({ name: 'manufacturer', order: 1, type: FieldTypes.STRING, default: '', required: true, readOnly: true, label: 'Manufacturer', dbField: 'manufacturer', maxLength: 255, placeholder: 'DENT Instruments', enumValues: ['DENT Instruments','Honeywell','Siemens', 'TBWC, Inc.',], showOn: ['list', 'form'], filertable: ['true'] }),
            field({ name: 'model_number', order: 2, type: FieldTypes.STRING, default: '', required: true, readOnly: true, label: 'Model Number', dbField: 'model_number', maxLength: 255, placeholder: 'Model', showOn: ['list', 'form'] }),
            field({ name: 'description', order: 3, type: FieldTypes.STRING, default: '', required: false, readOnly: true, label: 'Description', dbField: 'description', maxLength: 50, placeholder: 'Device description', showOn: ['list', 'form'], filertable: ['main'] }),
            field({ 
                name: 'type', 
                order: 4, 
                type: FieldTypes.STRING, 
                default: '', 
                required: true, 
                readOnly: true, label: 'Type', dbField: 'type', maxLength: 255, 
                enumValues: [  'Electric',  'Gas',  'Water',  'Steam',  'Other',], 
                placeholder: 'Electric', showOn: ['list', 'form'], filertable: ['true'] }),
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
            field({ name: 'registers', order: 1, type: FieldTypes.OBJECT, default: null, required: false, readOnly: true, label: 'Registers', showOn: ['form'] }),
          ],
        }),
      ],
    }),
  ],

  entityFields: {
    device_id: field({ name: 'device_id', order: 1, type: FieldTypes.NUMBER, default: null, readOnly: true, label: 'Id', dbField: 'device_id' }),
  },

  relationships: {},
  validation: {},
});
