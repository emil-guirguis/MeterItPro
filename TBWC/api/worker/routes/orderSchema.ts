// ===== ORDER schema (tbwc-site public."order") =====
// Served at GET /api/schema/order. PK is `id` (bigint identity).
import {
  defineSchema,
  field,
  tab,
  section,
  FieldTypes,
} from '@meterit/framework-backend/api/base/SchemaDefinition';

export const orderSchema = defineSchema({
  entityName: 'Order',
  tableName: 'order',
  idFieldName: 'id',
  description: 'TBWC build order (tbwc-site public.order)',
  formMaxWidth: '900px',
  customListColumns: {},

  formTabs: [
    tab({
      name: 'Order',
      order: 1,
      sections: [
        section({
          name: 'Details',
          order: 1,
          fields: [
            field({ name: 'customer', order: 1, type: FieldTypes.STRING, default: '', required: false, label: 'Customer', dbField: 'customer', maxLength: 300, showOn: ['list', 'form'] }),
            field({ name: 'job_name', order: 2, type: FieldTypes.STRING, default: '', required: false, label: 'Job Name', dbField: 'job_name', maxLength: 300, showOn: ['list', 'form'] }),
            field({ name: 'tbwc_number', order: 3, type: FieldTypes.STRING, default: '', required: false, label: 'TBWC #', dbField: 'tbwc_number', maxLength: 100, showOn: ['list', 'form'] }),
            field({ name: 'po_number', order: 4, type: FieldTypes.STRING, default: '', required: false, label: 'PO #', dbField: 'po_number', maxLength: 100, showOn: ['list', 'form'] }),
            field({ name: 'inv_stat', order: 5, type: FieldTypes.STRING, default: '', required: false, label: 'Invoice Status', dbField: 'inv_stat', maxLength: 100, showOn: ['list', 'form'] }),
            field({ name: 'rep', order: 6, type: FieldTypes.STRING, default: '', required: false, label: 'Rep', dbField: 'rep', maxLength: 200, showOn: ['list', 'form'] }),
            field({ name: 'trade_ally', order: 7, type: FieldTypes.STRING, default: '', required: false, label: 'Trade Ally', dbField: 'trade_ally', maxLength: 200, showOn: ['form'] }),
            field({ name: 'su', order: 8, type: FieldTypes.STRING, default: '', required: false, label: 'SU', dbField: 'su', maxLength: 100, showOn: ['form'] }),
            field({ name: 'exp', order: 9, type: FieldTypes.STRING, default: '', required: false, label: 'Exp', dbField: 'exp', maxLength: 100, showOn: ['form'] }),
            field({ name: 'jay', order: 10, type: FieldTypes.STRING, default: '', required: false, label: 'Jay', dbField: 'jay', maxLength: 100, showOn: ['form'] }),
          ],
        }),
        section({
          name: 'Dates',
          order: 2,
          fields: [
            field({ name: 'received_date', order: 1, type: FieldTypes.DATE, default: null, required: false, label: "Rec'd", dbField: 'received_date', showOn: ['list', 'form'] }),
            field({ name: 'ship_nlt', order: 2, type: FieldTypes.STRING, default: '', required: false, label: 'Ship NLT', dbField: 'ship_nlt', maxLength: 100, showOn: ['form'] }),
            field({ name: 'shipment_date', order: 3, type: FieldTypes.STRING, default: '', required: false, label: 'Ship Status', dbField: 'shipment_date', maxLength: 100, showOn: ['form'] }),
          ],
        }),
      ],
    }),
    tab({
      name: 'Financials',
      order: 2,
      sections: [
        section({
          name: 'Amounts',
          order: 1,
          fields: [
            field({ name: 'dnc', order: 1, type: FieldTypes.CURRENCY, default: null, required: false, label: 'DNC', dbField: 'dnc', showOn: ['form'] }),
            field({ name: 'sold_for', order: 2, type: FieldTypes.CURRENCY, default: null, required: false, label: 'Sold For', dbField: 'sold_for', showOn: ['form'] }),
            field({ name: 'comm_15', order: 3, type: FieldTypes.CURRENCY, default: null, required: false, label: 'Comm 15%', dbField: 'comm_15', showOn: ['form'] }),
            field({ name: 'ovg_75_25', order: 4, type: FieldTypes.CURRENCY, default: null, required: false, label: 'OVG 75/25', dbField: 'ovg_75_25', showOn: ['form'] }),
            field({ name: 'proj_adm', order: 5, type: FieldTypes.CURRENCY, default: null, required: false, label: 'Proj Adm', dbField: 'proj_adm', showOn: ['form'] }),
            field({ name: 'comm_total', order: 6, type: FieldTypes.CURRENCY, default: null, required: false, label: 'Comm Total', dbField: 'comm_total', showOn: ['form'] }),
          ],
        }),
      ],
    }),
    tab({
      name: 'Notes',
      order: 3,
      sections: [
        section({
          name: 'Notes',
          order: 1,
          fields: [
            field({ name: 'build_notes', order: 1, type: FieldTypes.STRING, default: '', required: false, label: 'Build Notes', dbField: 'build_notes', maxLength: 5000, showOn: ['form'] }),
            field({ name: 'notes', order: 2, type: FieldTypes.STRING, default: '', required: false, label: 'Notes', dbField: 'notes', maxLength: 5000, showOn: ['form'] }),
          ],
        }),
      ],
    }),
  ],

  entityFields: {
    id: field({ name: 'id', type: FieldTypes.NUMBER, default: null, readOnly: true, label: 'ID', dbField: 'id' }),
    rep_id: field({ name: 'rep_id', type: FieldTypes.STRING, default: null, readOnly: true, label: 'Rep ID', dbField: 'rep_id' }),
  },
  validation: {},
});
