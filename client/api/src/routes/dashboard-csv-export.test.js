// /**
//  * Property-Based and Unit Tests for CSV Export Functionality
//  * 
//  * Tests for the CSV export endpoint and CSV generation logic.
//  * Includes property-based tests to verify round-trip consistency.
//  */

// const fc = require('fast-check');

// /**
//  * Helper function to parse CSV content back into data
//  * This is used for round-trip testing
//  */
// function parseCSV(csvContent) {
//   const lines = csvContent.split('\n');
  
//   // Find the empty line that separates metadata from headers
//   let headerLineIndex = -1;
//   for (let i = 0; i < lines.length; i++) {
//     if (lines[i].trim() === '') {
//       headerLineIndex = i + 1;
//       break;
//     }
//   }
  
//   if (headerLineIndex < 0 || headerLineIndex >= lines.length) {
//     return [];
//   }
  
//   // Parse header
//   const headerLine = lines[headerLineIndex];
//   const headers = parseCSVLine(headerLine);
  
//   // Parse data rows
//   const dataRows = [];
//   for (let i = headerLineIndex + 1; i < lines.length; i++) {
//     const line = lines[i].trim();
//     if (line) {
//       const values = parseCSVLine(line);
//       const row = {};
//       headers.forEach((header, idx) => {
//         // Convert header back to snake_case
//         const snakeCase = header
//           .split(' ')
//           .map(word => word.toLowerCase())
//           .join('_');
//         row[snakeCase] = values[idx] || '';
//       });
//       dataRows.push(row);
//     }
//   }
  
//   return dataRows;
// }

// /**
//  * Parse a single CSV line, handling quoted values
//  */
// function parseCSVLine(line) {
//   const values = [];
//   let current = '';
//   let inQuotes = false;
  
//   for (let i = 0; i < line.length; i++) {
//     const char = line[i];
//     const nextChar = line[i + 1];
    
//     if (char === '"') {
//       if (inQuotes && nextChar === '"') {
//         // Escaped quote
//         current += '"';
//         i++; // Skip next quote
//       } else {
//         // Toggle quote state
//         inQuotes = !inQuotes;
//       }
//     } else if (char === ',' && !inQuotes) {
//       // End of field
//       values.push(current);
//       current = '';
//     } else {
//       current += char;
//     }
//   }
  
//   // Add last field
//   values.push(current);
  
//   return values;
// }

// /**
//  * Helper function to escape CSV values (same as in dashboard.js)
//  */
// function escapeCSV(value) {
//   if (value === null || value === undefined) {
//     return '';
//   }
//   const stringValue = String(value);
//   if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
//     return `"${stringValue.replace(/"/g, '""')}"`;
//   }
//   return stringValue;
// }

// /**
//  * Helper function to generate CSV content (extracted from dashboard.js)
//  */
// function generateCSV(rows, columns, card, timeFrame) {
//   // Build header row
//   const headers = columns.map(col => {
//     // Convert snake_case to Title Case
//     return col
//       .split('_')
//       .map(word => word.charAt(0).toUpperCase() + word.slice(1))
//       .join(' ');
//   });

//   // Build metadata section
//   const metadata = [
//     ['Meter Reading Export'],
//     ['Card Name', card.card_name],
//     ['Meter Element ID', card.meter_element_id],
//     ['Time Frame', `${timeFrame.start.toISOString()} to ${timeFrame.end.toISOString()}`],
//     ['Export Date', new Date().toISOString()],
//     ['Total Records', rows.length],
//     []
//   ];

//   // Build data rows
//   const dataRows = rows.map(row => {
//     return columns.map(col => escapeCSV(row[col]));
//   });

//   // Combine all sections
//   const allRows = [
//     ...metadata.map(row => row.map(escapeCSV).join(',')),
//     headers.join(','),
//     ...dataRows.map(row => row.join(','))
//   ];

//   return allRows.join('\n');
// }

// describe('CSV Export - Property-Based Tests', () => {
//   /**
//    * Property 7: CSV Export Round-Trip
//    * 
//    * For any set of meter readings, exporting to CSV and parsing the CSV 
//    * should produce equivalent data with all columns and values preserved.
//    * 
//    * Validates: Requirements 10.2, 10.3, 10.7
//    */
//   describe('Property 7: CSV Export Round-Trip', () => {
//     it('should preserve data through CSV export and parse cycle', () => {
//       // Feature: database-driven-dashboard, Property 7: CSV Export Round-Trip
      
//       const property = fc.property(
//         // Generate arbitrary meter reading data
//         fc.array(
//           fc.record({
//             id: fc.integer({ min: 1, max: 1000000 }),
//             created_at: fc.date().map(d => d.toISOString()),
//             active_energy: fc.integer({ min: 0, max: 10000 }),
//             power: fc.integer({ min: 0, max: 500 }),
//             voltage: fc.integer({ min: 200, max: 250 })
//           }),
//           { minLength: 0, maxLength: 50 }
//         ),
//         (meterReadings) => {
//           // Setup test data
//           const columns = ['id', 'created_at', 'active_energy', 'power', 'voltage'];
//           const card = {
//             card_name: 'Test Card',
//             meter_element_id: 1
//           };
//           const timeFrame = {
//             start: new Date('2024-01-01'),
//             end: new Date('2024-01-31')
//           };

//           // Export to CSV
//           const csvContent = generateCSV(meterReadings, columns, card, timeFrame);

//           // Parse CSV back
//           const parsedData = parseCSV(csvContent);

//           // Verify round-trip consistency
//           expect(parsedData.length).toBe(meterReadings.length);

//           // Verify each row's data is preserved
//           parsedData.forEach((parsedRow, idx) => {
//             const originalRow = meterReadings[idx];
            
//             // Check that all columns are present
//             columns.forEach(col => {
//               expect(parsedRow).toHaveProperty(col);
//             });

//             // Check that values match (allowing for string conversion)
//             columns.forEach(col => {
//               const originalValue = originalRow[col] !== null && originalRow[col] !== undefined 
//                 ? String(originalRow[col]) 
//                 : '';
//               const parsedValue = parsedRow[col] || '';
//               expect(parsedValue).toBe(originalValue);
//             });
//           });
//         }
//       );

//       fc.assert(property, { numRuns: 50 });
//     });

//     it('should handle special characters in CSV export', () => {
//       // Feature: database-driven-dashboard, Property 7: CSV Export Round-Trip
      
//       const property = fc.property(
//         fc.array(
//           fc.record({
//             id: fc.integer({ min: 1, max: 1000 }),
//             created_at: fc.date().map(d => d.toISOString()),
//             // Generate strings with special characters
//             description: fc.string({ minLength: 0, maxLength: 30 }),
//             value: fc.integer({ min: 0, max: 1000 })
//           }),
//           { minLength: 1, maxLength: 30 }
//         ),
//         (meterReadings) => {
//           const columns = ['id', 'created_at', 'description', 'value'];
//           const card = {
//             card_name: 'Test Card',
//             meter_element_id: 1
//           };
//           const timeFrame = {
//             start: new Date('2024-01-01'),
//             end: new Date('2024-01-31')
//           };

//           // Export to CSV
//           const csvContent = generateCSV(meterReadings, columns, card, timeFrame);

//           // Verify CSV is valid (can be parsed)
//           expect(() => parseCSV(csvContent)).not.toThrow();

//           // Parse and verify
//           const parsedData = parseCSV(csvContent);
//           expect(parsedData.length).toBe(meterReadings.length);
//         }
//       );

//       fc.assert(property, { numRuns: 30 });
//     });

//     it('should preserve numeric values in CSV export', () => {
//       // Feature: database-driven-dashboard, Property 7: CSV Export Round-Trip
      
//       const property = fc.property(
//         fc.array(
//           fc.record({
//             id: fc.integer({ min: 1, max: 1000000 }),
//             created_at: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
//             // Use integer values to avoid float precision issues
//             energy_value: fc.integer({ min: 0, max: 99999 }),
//             power_value: fc.integer({ min: 0, max: 9999 })
//           }),
//           { minLength: 1, maxLength: 30 }
//         ),
//         (meterReadings) => {
//           const columns = ['id', 'created_at', 'energy_value', 'power_value'];
//           const card = {
//             card_name: 'Precision Test',
//             meter_element_id: 1
//           };
//           const timeFrame = {
//             start: new Date('2024-01-01'),
//             end: new Date('2024-01-31')
//           };

//           // Export to CSV
//           const csvContent = generateCSV(meterReadings, columns, card, timeFrame);

//           // Parse back
//           const parsedData = parseCSV(csvContent);

//           // Verify numeric values are preserved as strings
//           parsedData.forEach((parsedRow, idx) => {
//             const originalRow = meterReadings[idx];
            
//             // Numeric values should match when converted to strings
//             expect(String(parsedRow.energy_value)).toBe(String(originalRow.energy_value));
//             expect(String(parsedRow.power_value)).toBe(String(originalRow.power_value));
//           });
//         }
//       );

//       fc.assert(property, { numRuns: 30 });
//     });
//   });
// });

// describe('CSV Export - Unit Tests', () => {
//   describe('CSV Generation', () => {
//     it('should generate CSV with header row', () => {
//       const rows = [
//         { id: 1, created_at: '2024-01-31T23:59:00Z', active_energy: 1250.50, power: 45.25 }
//       ];
//       const columns = ['id', 'created_at', 'active_energy', 'power'];
//       const card = { card_name: 'Test Card', meter_element_id: 1 };
//       const timeFrame = {
//         start: new Date('2024-01-01'),
//         end: new Date('2024-01-31')
//       };

//       const csv = generateCSV(rows, columns, card, timeFrame);

//       expect(csv).toContain('Id,Created At,Active Energy,Power');
//     });

//     it('should include metadata in CSV', () => {
//       const rows = [];
//       const columns = ['id', 'created_at'];
//       const card = { card_name: 'Test Card', meter_element_id: 5 };
//       const timeFrame = {
//         start: new Date('2024-01-01'),
//         end: new Date('2024-01-31')
//       };

//       const csv = generateCSV(rows, columns, card, timeFrame);

//       expect(csv).toContain('Meter Reading Export');
//       expect(csv).toContain('Card Name,Test Card');
//       expect(csv).toContain('Meter Element ID,5');
//       expect(csv).toContain('Time Frame');
//       expect(csv).toContain('Export Date');
//       expect(csv).toContain('Total Records,0');
//     });

//     it('should escape special characters in CSV', () => {
//       const rows = [
//         { id: 1, created_at: '2024-01-31T23:59:00Z', description: 'Test, with comma' },
//         { id: 2, created_at: '2024-01-30T23:59:00Z', description: 'Test "with" quotes' },
//         { id: 3, created_at: '2024-01-29T23:59:00Z', description: 'Test\nwith\nnewlines' }
//       ];
//       const columns = ['id', 'created_at', 'description'];
//       const card = { card_name: 'Test Card', meter_element_id: 1 };
//       const timeFrame = {
//         start: new Date('2024-01-01'),
//         end: new Date('2024-01-31')
//       };

//       const csv = generateCSV(rows, columns, card, timeFrame);

//       // Verify special characters are properly escaped
//       expect(csv).toContain('"Test, with comma"');
//       expect(csv).toContain('"Test ""with"" quotes"');
//       expect(csv).toContain('"Test\nwith\nnewlines"');
//     });

//     it('should handle empty rows', () => {
//       const rows = [];
//       const columns = ['id', 'created_at', 'value'];
//       const card = { card_name: 'Empty Card', meter_element_id: 1 };
//       const timeFrame = {
//         start: new Date('2024-01-01'),
//         end: new Date('2024-01-31')
//       };

//       const csv = generateCSV(rows, columns, card, timeFrame);

//       expect(csv).toContain('Total Records,0');
//       expect(csv).toContain('Id,Created At,Value');
//     });

//     it('should handle null and undefined values', () => {
//       const rows = [
//         { id: 1, created_at: '2024-01-31T23:59:00Z', value: null },
//         { id: 2, created_at: '2024-01-30T23:59:00Z', value: undefined },
//         { id: 3, created_at: '2024-01-29T23:59:00Z', value: 0 }
//       ];
//       const columns = ['id', 'created_at', 'value'];
//       const card = { card_name: 'Test Card', meter_element_id: 1 };
//       const timeFrame = {
//         start: new Date('2024-01-01'),
//         end: new Date('2024-01-31')
//       };

//       const csv = generateCSV(rows, columns, card, timeFrame);

//       // Parse and verify
//       const lines = csv.split('\n');
//       const dataLines = lines.slice(8); // Skip metadata and header
      
//       // Null and undefined should be empty strings
//       expect(dataLines[0]).toContain('1,2024-01-31T23:59:00Z,');
//       expect(dataLines[1]).toContain('2,2024-01-30T23:59:00Z,');
//       expect(dataLines[2]).toContain('3,2024-01-29T23:59:00Z,0');
//     });

//     it('should convert snake_case column names to Title Case', () => {
//       const rows = [{ id: 1, active_energy: 100, power_factor: 0.95 }];
//       const columns = ['id', 'active_energy', 'power_factor'];
//       const card = { card_name: 'Test', meter_element_id: 1 };
//       const timeFrame = {
//         start: new Date('2024-01-01'),
//         end: new Date('2024-01-31')
//       };

//       const csv = generateCSV(rows, columns, card, timeFrame);

//       expect(csv).toContain('Id,Active Energy,Power Factor');
//     });

//     it('should include all data rows in CSV', () => {
//       const rows = [
//         { id: 1, value: 100 },
//         { id: 2, value: 200 },
//         { id: 3, value: 300 }
//       ];
//       const columns = ['id', 'value'];
//       const card = { card_name: 'Test', meter_element_id: 1 };
//       const timeFrame = {
//         start: new Date('2024-01-01'),
//         end: new Date('2024-01-31')
//       };

//       const csv = generateCSV(rows, columns, card, timeFrame);

//       expect(csv).toContain('1,100');
//       expect(csv).toContain('2,200');
//       expect(csv).toContain('3,300');
//       expect(csv).toContain('Total Records,3');
//     });

//     it('should handle card names with special characters', () => {
//       const rows = [];
//       const columns = ['id'];
//       const card = { card_name: 'Card "with" special, chars', meter_element_id: 1 };
//       const timeFrame = {
//         start: new Date('2024-01-01'),
//         end: new Date('2024-01-31')
//       };

//       const csv = generateCSV(rows, columns, card, timeFrame);

//       // Card name should be properly escaped in metadata
//       expect(csv).toContain('Card Name,"Card ""with"" special, chars"');
//     });
//   });

//   describe('CSV Parsing', () => {
//     it('should parse simple CSV data', () => {
//       const csvContent = `Meter Reading Export
// Card Name,Test Card
// Meter Element ID,1
// Time Frame,2024-01-01T00:00:00.000Z to 2024-01-31T00:00:00.000Z
// Export Date,2024-01-31T12:00:00.000Z
// Total Records,2

// Id,Created At,Value
// 1,2024-01-31T23:59:00Z,100
// 2,2024-01-30T23:59:00Z,200`;

//       const parsed = parseCSV(csvContent);

//       expect(parsed).toHaveLength(2);
//       expect(parsed[0].id).toBe('1');
//       expect(parsed[0].value).toBe('100');
//       expect(parsed[1].id).toBe('2');
//       expect(parsed[1].value).toBe('200');
//     });

//     it('should handle quoted values in CSV', () => {
//       const csvContent = `Meter Reading Export
// Card Name,Test Card
// Meter Element ID,1
// Time Frame,2024-01-01T00:00:00.000Z to 2024-01-31T00:00:00.000Z
// Export Date,2024-01-31T12:00:00.000Z
// Total Records,1

// Id,Description
// 1,"Value with, comma"`;

//       const parsed = parseCSV(csvContent);

//       expect(parsed).toHaveLength(1);
//       expect(parsed[0].description).toBe('Value with, comma');
//     });

//     it('should handle escaped quotes in CSV', () => {
//       const csvContent = `Meter Reading Export
// Card Name,Test Card
// Meter Element ID,1
// Time Frame,2024-01-01T00:00:00.000Z to 2024-01-31T00:00:00.000Z
// Export Date,2024-01-31T12:00:00.000Z
// Total Records,1

// Id,Description
// 1,"Value with ""quotes"""`;

//       const parsed = parseCSV(csvContent);

//       expect(parsed).toHaveLength(1);
//       expect(parsed[0].description).toBe('Value with "quotes"');
//     });
//   });
// });
