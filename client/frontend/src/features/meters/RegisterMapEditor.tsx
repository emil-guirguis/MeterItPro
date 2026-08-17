import React from 'react';
// import type { RegisterMap, RegisterMapField } from './meterConfig';
// import { BaseList } from '@meterit/framework-frontend/components/list/BaseList';
// import type { ColumnDefinition } from '../../types/ui';
// import { meterService, type MeterMapTemplate } from './meterService';
// import './RegisterMapEditor.css';

// // Load complete PSHD Master Register List data
// const getDefaultCSVFields = (): RegisterMapField[] => {
//   // Convert CSV data into RegisterMapField objects
//   const csvData = [
//     // Key system and communication registers
//     { name: 'SunSpec Model ID LSW', register: 1001, absoluteAddress: 41002, description: 'SunSpec Model (SunS) 1', units: '', functionality: 'Factory', dataType: 'uint32' as const, readWrite: 'R' as const, systemElement: 'system', valueRange: 'Su (0x5375)', publicNotes: '', models: 'ALL' },
//     { name: 'SunSpec Device ID', register: 1003, absoluteAddress: 41004, description: 'Unique SunSpec Model Identifier (1)', units: '', functionality: 'Factory', dataType: 'uint16' as const, readWrite: 'R' as const, systemElement: 'system', valueRange: '1', publicNotes: '', models: 'ALL' },
//     { name: 'Dev Addr', register: 1069, absoluteAddress: 41070, description: 'Modbus Device Address', units: '', functionality: 'Factory', dataType: 'uint16' as const, readWrite: 'R/W' as const, bacnetObject: '1069', bacnetObjectType: 'PIV', bacnetObjectName: 'SERIAL ADDRESS', systemElement: 'system', valueRange: '1 - 245', publicNotes: '', models: 'ALL' },
    
//     // Network configuration
//     { name: 'DHCP/STATIC CONFIG', register: 1077, absoluteAddress: 41078, description: 'Enum for force IPV4 config method (0=static/1=DHCP)', units: '', functionality: 'Factory', dataType: 'uint16' as const, readWrite: 'R/W' as const, bacnetObject: '1077', bacnetObjectType: 'BV', bacnetObjectName: 'DHCP/STATIC CONFIG', systemElement: 'system', valueRange: '1', publicNotes: '', models: 'ALL' },
//     { name: 'IP ADDRESS 0', register: 1079, absoluteAddress: 41080, description: 'IP Address', units: '', functionality: 'Factory', dataType: 'string' as const, readWrite: 'R/W' as const, bacnetObject: '1079', bacnetObjectType: 'CSV', bacnetObjectName: 'IP Address', systemElement: 'system', valueRange: '2 Char', publicNotes: '', models: 'ALL' },
//     { name: 'NETMASK 0', register: 1087, absoluteAddress: 41088, description: 'Netmask', units: '', functionality: 'Factory', dataType: 'string' as const, readWrite: 'R/W' as const, bacnetObject: '1087', bacnetObjectType: 'CSV', bacnetObjectName: 'IP Netmask', systemElement: 'system', valueRange: '2 Char', publicNotes: '', models: 'ALL' },
//     { name: 'GATEWAY 0', register: 1095, absoluteAddress: 41096, description: 'Gateway', units: '', functionality: 'Factory', dataType: 'string' as const, readWrite: 'R/W' as const, bacnetObject: '1095', bacnetObjectType: 'CSV', bacnetObjectName: 'IP Gateway', systemElement: 'system', valueRange: '2 Char', publicNotes: '', models: 'ALL' },
    
//     // Serial communication
//     { name: 'SERIAL BAUD RATE MSW', register: 1131, absoluteAddress: 41132, description: 'Interface baud rate in bits per second', units: '', functionality: 'Factory', dataType: 'uint32' as const, readWrite: 'R/W' as const, bacnetObject: '1131', bacnetObjectType: 'PIV', bacnetObjectName: 'Serial Baudrate', systemElement: 'system', valueRange: '9600 - 115k', publicNotes: '', models: 'ALL' },
    
//     // Electrical measurements - Current
//     { name: 'Current Avg Element (MSW)', register: 1141, absoluteAddress: 41142, description: 'Current Avg Element', units: 'A', functionality: 'Metrology', dataType: 'float32' as const, readWrite: 'R' as const, bacnetObject: '1141', bacnetObjectType: 'AI', bacnetObjectName: 'Current Avg Element', systemElement: 'element', valueRange: '', publicNotes: 'Average current of enabled channels', models: 'ALL' },
//     { name: 'Current CH1 (MSW)', register: 1143, absoluteAddress: 41144, description: 'Current CH1 (A)', units: 'A', functionality: 'Metrology', dataType: 'float32' as const, readWrite: 'R' as const, bacnetObject: '1143', bacnetObjectType: 'AI', bacnetObjectName: 'Current CH1', systemElement: 'element', valueRange: '', publicNotes: 'RMS', models: 'ALL' },
//     { name: 'Current CH2 (MSW)', register: 1145, absoluteAddress: 41146, description: 'Current CH2 (B)', units: 'A', functionality: 'Metrology', dataType: 'float32' as const, readWrite: 'R' as const, bacnetObject: '1145', bacnetObjectType: 'AI', bacnetObjectName: 'Current CH2', systemElement: 'element', valueRange: '', publicNotes: 'RMS', models: 'ALL' },
//     { name: 'Current CH3 (MSW)', register: 1147, absoluteAddress: 41148, description: 'Current CH3 (C)', units: 'A', functionality: 'Metrology', dataType: 'float32' as const, readWrite: 'R' as const, bacnetObject: '1147', bacnetObjectType: 'AI', bacnetObjectName: 'Current CH3', systemElement: 'element', valueRange: '', publicNotes: 'RMS', models: 'ALL' },
    
//     // Electrical measurements - Voltage Line to Neutral
//     { name: 'Voltage L to N Avg Element (MSW)', register: 1149, absoluteAddress: 41150, description: 'Voltage L to N Avg Element', units: 'V', functionality: 'Metrology', dataType: 'float32' as const, readWrite: 'R' as const, bacnetObject: '1149', bacnetObjectType: 'AI', bacnetObjectName: 'Voltage L to N Avg Element', systemElement: 'element', valueRange: '', publicNotes: 'Voltage (AN+BN+CN)/3 (VREF is selected per element in Reg 2217)', models: 'ALL' },
//     { name: 'Voltage L1 to N (MSW)', register: 1151, absoluteAddress: 41152, description: 'Voltage L1 to N (AN)', units: 'V', functionality: 'Metrology', dataType: 'float32' as const, readWrite: 'R' as const, bacnetObject: '1151', bacnetObjectType: 'AI', bacnetObjectName: 'Voltage L1 to N', systemElement: 'element', valueRange: '', publicNotes: 'RMS (Vref selected by Reg 2217)', models: 'ALL' },
//     { name: 'Voltage L2 to N (MSW)', register: 1153, absoluteAddress: 41154, description: 'Voltage L2 to N (BN)', units: 'V', functionality: 'Metrology', dataType: 'float32' as const, readWrite: 'R' as const, bacnetObject: '1153', bacnetObjectType: 'AI', bacnetObjectName: 'Voltage L2 to N', systemElement: 'element', valueRange: '', publicNotes: 'RMS (Vref selected by Reg 2217)', models: 'ALL' },
//     { name: 'Voltage L3 to N (MSW)', register: 1155, absoluteAddress: 41156, description: 'Voltage L3 to N (CN)', units: 'V', functionality: 'Metrology', dataType: 'float32' as const, readWrite: 'R' as const, bacnetObject: '1155', bacnetObjectType: 'AI', bacnetObjectName: 'Voltage L3 to N', systemElement: 'element', valueRange: '', publicNotes: 'RMS (Vref selected by Reg 2217)', models: 'ALL' },
    
//     // Electrical measurements - Voltage Line to Line
//     { name: 'Voltage L to L Avg Element (MSW)', register: 1157, absoluteAddress: 41158, description: 'Voltage L to L Avg Element', units: 'V', functionality: 'Metrology', dataType: 'float32' as const, readWrite: 'R' as const, bacnetObject: '1157', bacnetObjectType: 'AI', bacnetObjectName: 'Voltage L to L Avg Element', systemElement: 'element', valueRange: '', publicNotes: '(AB+BC+CA)/3 (VREF is selected per element in Reg 2217)', models: 'ALL' },
//     { name: 'Voltage L1 to L2 (MSW)', register: 1159, absoluteAddress: 41160, description: 'Voltage L1 to L2 (AB)', units: 'V', functionality: 'Metrology', dataType: 'float32' as const, readWrite: 'R' as const, bacnetObject: '1159', bacnetObjectType: 'AI', bacnetObjectName: 'Voltage L1 to L2', systemElement: 'element', valueRange: '', publicNotes: 'AN-BN RMS (Vref selected by Reg 2217)', models: 'ALL' },
//     { name: 'Voltage L2 to L3 (MSW)', register: 1161, absoluteAddress: 41162, description: 'Voltage L2 to L3 (BC)', units: 'V', functionality: 'Metrology', dataType: 'float32' as const, readWrite: 'R' as const, bacnetObject: '1161', bacnetObjectType: 'AI', bacnetObjectName: 'Voltage L2 to L3', systemElement: 'element', valueRange: '', publicNotes: 'BN-CN RMS (Vref selected by Reg 2217)', models: 'ALL' },
//     { name: 'Voltage L3 to L1 (MSW)', register: 1163, absoluteAddress: 41164, description: 'Voltage L3 to L1 (CA)', units: 'V', functionality: 'Metrology', dataType: 'float32' as const, readWrite: 'R' as const, bacnetObject: '1163', bacnetObjectType: 'AI', bacnetObjectName: 'Voltage L3 to L1', systemElement: 'element', valueRange: '', publicNotes: 'CN-AN RMS (Vref selected by Reg 2217)', models: 'ALL' },
    
//     // Power measurements
//     { name: 'Line Frequency (MSW)', register: 1165, absoluteAddress: 41166, description: 'Line Frequency', units: 'Hz', functionality: 'Metrology', dataType: 'float32' as const, readWrite: 'R' as const, bacnetObject: '1165', bacnetObjectType: 'AI', bacnetObjectName: 'Line Frequency', systemElement: 'element', valueRange: '45 - 70', publicNotes: 'Can take up to 10 seconds to respond to abrupt change in service frequency', models: 'ALL' },
//     { name: 'Watt Sum Element (MSW)', register: 1167, absoluteAddress: 41168, description: 'Power Sum Element', units: 'kW', functionality: 'Metrology', dataType: 'float32' as const, readWrite: 'R' as const, bacnetObject: '1167', bacnetObjectType: 'AI', bacnetObjectName: 'Power Sum Element', systemElement: 'element', valueRange: '', publicNotes: 'Power_A+Power_B+Power_C', models: 'ALL' },
//     { name: 'Watt CH1 (MSW)', register: 1169, absoluteAddress: 41170, description: 'Power CH1 (A)', units: 'kW', functionality: 'Metrology', dataType: 'float32' as const, readWrite: 'R' as const, bacnetObject: '1169', bacnetObjectType: 'AI', bacnetObjectName: 'Power CH1', systemElement: 'element', valueRange: '', publicNotes: 'Signed Power', models: 'ALL' },
//     { name: 'Watt CH2 (MSW)', register: 1171, absoluteAddress: 41172, description: 'Power CH2 (B)', units: 'kW', functionality: 'Metrology', dataType: 'float32' as const, readWrite: 'R' as const, bacnetObject: '1171', bacnetObjectType: 'AI', bacnetObjectName: 'Power CH2', systemElement: 'element', valueRange: '', publicNotes: 'Signed Power', models: 'ALL' },
//     { name: 'Watt CH3 (MSW)', register: 1173, absoluteAddress: 41174, description: 'Power CH3 (C)', units: 'kW', functionality: 'Metrology', dataType: 'float32' as const, readWrite: 'R' as const, bacnetObject: '1173', bacnetObjectType: 'AI', bacnetObjectName: 'Power CH3', systemElement: 'element', valueRange: '', publicNotes: 'Signed Power', models: 'ALL' },
    
//     // VA measurements
//     { name: 'VA Sum Element (MSW)', register: 1175, absoluteAddress: 41176, description: 'VA Sum Element', units: 'kVA', functionality: 'Metrology', dataType: 'float32' as const, readWrite: 'R' as const, bacnetObject: '1175', bacnetObjectType: 'AI', bacnetObjectName: 'VA Sum Element', systemElement: 'element', valueRange: '', publicNotes: 'VA_A+VA_B+VA_C', models: 'ALL' },
//     { name: 'VA CH1 (MSW)', register: 1177, absoluteAddress: 41178, description: 'VA CH1 (A)', units: 'kVA', functionality: 'Metrology', dataType: 'float32' as const, readWrite: 'R' as const, bacnetObject: '1177', bacnetObjectType: 'AI', bacnetObjectName: 'VA CH1', systemElement: 'element', valueRange: '', publicNotes: 'Signed VA', models: 'ALL' },
//     { name: 'VA CH2 (MSW)', register: 1179, absoluteAddress: 41180, description: 'VA CH2 (B)', units: 'kVA', functionality: 'Metrology', dataType: 'float32' as const, readWrite: 'R' as const, bacnetObject: '1179', bacnetObjectType: 'AI', bacnetObjectName: 'VA CH2', systemElement: 'element', valueRange: '', publicNotes: 'Signed VA', models: 'ALL' },
//     { name: 'VA CH3 (MSW)', register: 1181, absoluteAddress: 41182, description: 'VA CH3 (C)', units: 'kVA', functionality: 'Metrology', dataType: 'float32' as const, readWrite: 'R' as const, bacnetObject: '1181', bacnetObjectType: 'AI', bacnetObjectName: 'VA CH3', systemElement: 'element', valueRange: '', publicNotes: 'Signed VA', models: 'ALL' },
    
//     // VAR measurements
//     { name: 'VAR Sum Element (MSW)', register: 1183, absoluteAddress: 41184, description: 'VAR Sum Element', units: 'kVAr', functionality: 'Metrology', dataType: 'float32' as const, readWrite: 'R' as const, bacnetObject: '1183', bacnetObjectType: 'AI', bacnetObjectName: 'VAR Sum Element', systemElement: 'element', valueRange: '', publicNotes: 'VAR_A+VAR_B+VAR_C', models: 'ALL' },
//     { name: 'VAR CH1 (MSW)', register: 1185, absoluteAddress: 41186, description: 'VAR CH1 (A)', units: 'kVAr', functionality: 'Metrology', dataType: 'float32' as const, readWrite: 'R' as const, bacnetObject: '1185', bacnetObjectType: 'AI', bacnetObjectName: 'VAR CH1', systemElement: 'element', valueRange: '', publicNotes: 'Signed VAR', models: 'ALL' },
//     { name: 'VAR CH2 (MSW)', register: 1187, absoluteAddress: 41188, description: 'VAR CH2 (B)', units: 'kVAr', functionality: 'Metrology', dataType: 'float32' as const, readWrite: 'R' as const, bacnetObject: '1187', bacnetObjectType: 'AI', bacnetObjectName: 'VAR CH2', systemElement: 'element', valueRange: '', publicNotes: 'Signed VAR', models: 'ALL' },
//     { name: 'VAR CH3 (MSW)', register: 1189, absoluteAddress: 41190, description: 'VAR CH3 (C)', units: 'kVAr', functionality: 'Metrology', dataType: 'float32' as const, readWrite: 'R' as const, bacnetObject: '1189', bacnetObjectType: 'AI', bacnetObjectName: 'VAR CH3', systemElement: 'element', valueRange: '', publicNotes: 'Signed VAR', models: 'ALL' },
//   ];

//   return csvData.map(item => ({
//     name: item.name,
//     register: item.register,
//     absoluteAddress: item.absoluteAddress,
//     description: item.description,
//     units: item.units || undefined,
//     functionality: item.functionality || undefined,
//     dataType: item.dataType,
//     readWrite: item.readWrite,
//     bacnetObject: item.bacnetObject || undefined,
//     bacnetObjectType: item.bacnetObjectType || undefined,
//     bacnetObjectName: item.bacnetObjectName || undefined,
//     systemElement: item.systemElement || undefined,
//     valueRange: item.valueRange || undefined,
//     publicNotes: item.publicNotes || undefined,
//     models: item.models || undefined,
//   }));
// };

// // Normalize possible legacy field shapes into current RegisterMapField
// const normalizeField = (f: any): RegisterMapField => {
//   const dataTypeMap: Record<string, RegisterMapField['dataType']> = {
//     u16: 'uint16',
//     u32: 'uint32',
//     float32: 'float32',
//     int16: 'int16',
//     int32: 'int32',
//     uint16: 'uint16',
//     uint32: 'uint32',
//     string: 'string',
//   };

//   const register: number = typeof f.register === 'number' ? f.register : (typeof f.address === 'number' ? f.address : 0);
//   const absoluteAddress: number = typeof f.absoluteAddress === 'number' ? f.absoluteAddress : (typeof f.absolute === 'number' ? f.absolute : 0);
//   const dataType = dataTypeMap[String(f.dataType || f.type || 'uint16')] || 'uint16';
//   const readWrite: RegisterMapField['readWrite'] = (f.readWrite === 'W' || f.readWrite === 'R' || f.readWrite === 'R/W') ? f.readWrite : 'R';

//   return {
//     name: String(f.name || ''),
//     register,
//     absoluteAddress,
//     description: String(f.description || ''),
//     units: f.units ? String(f.units) : undefined,
//     functionality: f.functionality ? String(f.functionality) : undefined,
//     dataType,
//     readWrite,
//     bacnetObject: f.bacnetObject ? String(f.bacnetObject) : undefined,
//     bacnetObjectType: f.bacnetObjectType ? String(f.bacnetObjectType) : undefined,
//     bacnetObjectName: f.bacnetObjectName ? String(f.bacnetObjectName) : undefined,
//     systemElement: f.systemElement ? String(f.systemElement) : undefined,
//     valueRange: f.valueRange ? String(f.valueRange) : undefined,
//     publicNotes: f.publicNotes ? String(f.publicNotes) : undefined,
//     models: f.models ? String(f.models) : undefined,
//   };
// };

// interface RegisterMapEditorProps {
//   value?: RegisterMap | null;
//   disabled?: boolean;
// }

// export const RegisterMapEditor: React.FC<RegisterMapEditorProps> = ({
//   value,
//   onChange,
//   disabled = false,
// }) => {
//   const [showEditor, setShowEditor] = useState(!!value?.fields?.length);
//   const [description, setDescription] = useState(value?.description || '');
//   const [fields, setFields] = useState<RegisterMapField[]>(() => {
//     // Auto-load CSV data if no existing fields
//     if (!value?.fields?.length) {
//       return getDefaultCSVFields();
//     }
//     return value.fields.map(normalizeField);
//   });
  
//   // Template dropdown state
//   const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
//   const [templates, setTemplates] = useState<MeterMapTemplate[]>([]);
//   const [loadingTemplates, setLoadingTemplates] = useState(false);

//   const updateRegisterMap = (newFields: RegisterMapField[], newDescription?: string) => {
//     const desc = newDescription !== undefined ? newDescription : description;
//     if (newFields.length === 0 && !desc.trim()) {
//       onChange(null);
//     } else {
//       onChange({
//         description: desc.trim() || undefined,
//         fields: newFields,
//       });
//     }
//   };

//   // Keep internal state in sync when parent value changes (e.g., editing a meter)
//   useEffect(() => {
//     setDescription(value?.description || '');
    
//     if (value?.fields?.length) {
//       // Use existing fields if available
//       setFields(value.fields.map(normalizeField));
//       setShowEditor(true);
//     } else {
//       // Auto-load CSV data for blank register maps
//       const defaultFields = getDefaultCSVFields();
//       setFields(defaultFields);
//       setShowEditor(true); // Always show editor when CSV data is loaded
//       // Update parent with default data
//       updateRegisterMap(defaultFields);
//     }
//   }, [value]);

//   const handleDescriptionChange = (newDescription: string) => {
//     setDescription(newDescription);
//     updateRegisterMap(fields, newDescription);
//   };

//   const handleAddField = () => {
//     const newField: RegisterMapField = {
//       name: '',
//       register: 0,
//       absoluteAddress: 0,
//       description: '',
//       units: '',
//       functionality: '',
//       dataType: 'uint16',
//       readWrite: 'R',
//       bacnetObject: '',
//       bacnetObjectType: '',
//       bacnetObjectName: '',
//       systemElement: '',
//       valueRange: '',
//       publicNotes: '',
//       models: 'ALL',
//     };
//     const newFields = [...fields, newField];
//     setFields(newFields);
//     updateRegisterMap(newFields);
//   };

//   const handleUpdateField = (index: number, updates: Partial<RegisterMapField>) => {
//     const newFields = fields.map((field, i) =>
//       i === index ? { ...field, ...updates } : field
//     );
//     setFields(newFields);
//     updateRegisterMap(newFields);
//   };

//   const handleRemoveField = (index: number) => {
//     const newFields = fields.filter((_, i) => i !== index);
//     setFields(newFields);
//     updateRegisterMap(newFields);
//   };

//   const handleLoadFromCSV = async () => {
//     // Show dropdown with available templates
//     if (!showTemplateDropdown) {
//       setLoadingTemplates(true);
//       try {
//         const templateList = await meterService.getMeterMapTemplates();
//         setTemplates(templateList);
//         setShowTemplateDropdown(true);
//       } catch (error) {
//         console.error('Failed to load meter map templates:', error);
//         // Fallback to default CSV data if API fails
//         const defaultFields: RegisterMapField[] = getDefaultCSVFields();
//         setFields(defaultFields);
//         setShowEditor(true);
//         updateRegisterMap(defaultFields);
//       } finally {
//         setLoadingTemplates(false);
//       }
//     } else {
//       setShowTemplateDropdown(false);
//     }
//   };

//   const handleTemplateSelect = (template: MeterMapTemplate) => {
//       setShowEditor(true);
//       setShowTemplateDropdown(false);
//     }
//   };

//   const handleLoadDefault = () => {
//     // Load default CSV data (fallback option)
//     const defaultFields: RegisterMapField[] = getDefaultCSVFields();

//   };

//   const handleClear = () => {

//   };

//     return (
//       <div className="register-map-editor register-map-editor--collapsed">
//         <div className="register-map-header">
//           <h4>Register Map</h4>
//           <div className="register-map-actions">
//             <button
//               type="button"
//               className="btn btn--secondary btn--small"
//               onClick={handleLoadFromCSV}
//               disabled={disabled || loadingTemplates}
//             >
//               {loadingTemplates ? 'Loading...' : 'Load Template'}
//             </button>
//             <button
//               type="button"
//               className="btn btn--primary btn--small"
//               onClick={() => setShowEditor(true)}
//               disabled={disabled}
//             >
//               Configure
//             </button>
//           </div>
//         </div>
        
//         {showTemplateDropdown && templates.length > 0 && (
//           <div className="template-dropdown">
//             <h5>Select Register Map Template:</h5>
//             <div className="template-list">
//               {templates.map((template) => (
//                 <div
//                   key={template.id}
//                   className="template-item"
//                   onClick={() => handleTemplateSelect(template)}
//                 >
//                   <div className="template-name">{template.name}</div>
//                   <div className="template-details">
//                     {template.manufacturer} - {template.model}
//                   </div>
//                   <div className="template-description">{template.description}</div>
//                 </div>
//               ))}
//               <div
//                 className="template-item template-item--default"
//                 onClick={handleLoadDefault}
//               >
//                 <div className="template-name">Default CSV Template</div>
//                 <div className="template-details">PSHD Master Register List</div>
//                 <div className="template-description">Load the default PSHD register mapping</div>
//               </div>
//             </div>
//           </div>
//         )}
        
//         <p className="register-map-description">
//           Configure Modbus register mapping for this meter
//         </p>
//       </div>
//     );
//   }

//   // DataList columns - matching all CSV fields
//   const columns: ColumnDefinition<RegisterMapField>[] = [
//     { key: 'name', label: 'Modbus Register Name', sortable: true },
//     { key: 'register', label: 'Modbus Register', sortable: true },
//     { key: 'absoluteAddress', label: 'Absolute Address', sortable: true },
//     { key: 'description', label: 'Item Description', sortable: false },
//     { key: 'units', label: 'Units', sortable: true },
//     { key: 'functionality', label: 'Functionality', sortable: false },
//     { key: 'dataType', label: 'Data Type', sortable: true },
//     { key: 'readWrite', label: 'R/W', sortable: true },
//     { key: 'bacnetObject', label: 'BACnet Object', sortable: false },
//     { key: 'bacnetObjectType', label: 'BACnet Object Type', sortable: false },
//     { key: 'bacnetObjectName', label: 'BACnet Object Name', sortable: false },
//     { key: 'systemElement', label: 'System or Element', sortable: false },
//     { key: 'valueRange', label: 'Value/Range', sortable: false },
//     { key: 'publicNotes', label: 'Public Notes', sortable: false },
//     { key: 'models', label: 'Models', sortable: false },
//   ];

//   return (
//     <div className="register-map-editor">
//       <div className="register-map-header">
//         <h4>Register Map Configuration</h4>
//         <div className="register-map-actions">
//           <button
//             type="button"
//             className="btn btn--secondary btn--small"
//             onClick={handleLoadFromCSV}
//             disabled={disabled || loadingTemplates}
//           >
//             {loadingTemplates ? 'Loading...' : 'Load Template'}
//           </button>
//           <button
//             type="button"
//             className="btn btn--secondary btn--small"
//             onClick={handleClear}
//             disabled={disabled}
//           >
//             Clear
//           </button>
//           <button
//             type="button"
//             className="btn btn--ghost btn--small"
//             onClick={() => setShowEditor(false)}
//             disabled={disabled}
//           >
//             Collapse
//           </button>
//         </div>
//       </div>
      
//       {showTemplateDropdown && templates.length > 0 && (
//         <div className="template-dropdown">
//           <h5>Select Register Map Template:</h5>
//           <div className="template-list">
//             {templates.map((template) => (
//               <div
//                 key={template.id}
//                 className="template-item"
//                 onClick={() => handleTemplateSelect(template)}
//               >
//                 <div className="template-name">{template.name}</div>
//                 <div className="template-details">
//                   {template.manufacturer} - {template.model}
//                 </div>
//                 <div className="template-description">{template.description}</div>
//               </div>
//             ))}
//             <div
//               className="template-item template-item--default"
//               onClick={handleLoadDefault}
//             >
//               <div className="template-name">Default CSV Template</div>
//               <div className="template-details">PSHD Master Register List</div>
//               <div className="template-description">Load the default PSHD register mapping</div>
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="form-group">
//         <label htmlFor="register-map-description">Description</label>
//         <input
//           type="text"
//           id="register-map-description"
//           value={description}
//           onChange={(e) => handleDescriptionChange(e.target.value)}
//           className="form-control"
//           placeholder="e.g., Schneider ION7650 Register Map"
//           disabled={disabled}
//         />
//       </div>

//       <div className="register-fields-table">
//         <BaseList
//           data={fields}
//           columns={columns}
//           loading={false}
//           onEdit={(field: RegisterMapField) => {
//             const index = fields.indexOf(field);
//             if (index >= 0) {
//               // Open inline editor for this field
//               const name = prompt('Field Name:', field.name);
//               if (name !== null) {
//                 handleUpdateField(index, { name });
//               }
//             }
//           }}
//           onDelete={(field: RegisterMapField) => {
//             const index = fields.indexOf(field);
//             if (index >= 0) {
//               handleRemoveField(index);
//             }
//           }}
//           emptyMessage="No register fields configured. Click 'Add Field' to start."
//         />
//       </div>

//       <div className="register-fields-actions">
//         <button
//           type="button"
//           className="btn btn--primary btn--small"
//           onClick={handleAddField}
//           disabled={disabled}
//         >
//           Add Field
//         </button>
//       </div>
//     </div>
//   );
// };

// export default RegisterMapEditor;

// Stub export for future use
export const RegisterMapEditor: React.FC<any> = () => null;