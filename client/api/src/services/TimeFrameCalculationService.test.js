// /**
//  * Tests for TimeFrameCalculationService
//  */

// const TimeFrameCalculationService = require('./TimeFrameCalculationService');
// const db = require('../config/database');

// // Mock the database module
// jest.mock('../config/database');

// describe('TimeFrameCalculationService', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   describe('validateTimeFrameType', () => {
//     it('should accept valid time frame types', () => {
//       const validTypes = ['custom', 'last_month', 'this_month_to_date', 'since_installation'];

//       validTypes.forEach(type => {
//         expect(() => TimeFrameCalculationService.validateTimeFrameType(type)).not.toThrow();
//       });
//     });

//     it('should reject invalid time frame types', () => {
//       expect(() => TimeFrameCalculationService.validateTimeFrameType('invalid')).toThrow(
//         'Invalid time frame type: invalid'
//       );
//       expect(() => TimeFrameCalculationService.validateTimeFrameType('next_month')).toThrow();
//       expect(() => TimeFrameCalculationService.validateTimeFrameType('')).toThrow();
//     });
//   });

//   describe('calculateCustomTimeFrame', () => {
//     it('should calculate custom time frame with valid dates', () => {
//       const startDate = new Date('2024-01-01');
//       const endDate = new Date('2024-01-31');

//       const result = TimeFrameCalculationService.calculateCustomTimeFrame({
//         customStartDate: startDate,
//         customEndDate: endDate
//       });

//       expect(result.start).toEqual(startDate);
//       expect(result.end).toEqual(endDate);
//       expect(result.type).toBe('custom');
//     });

//     it('should accept string dates and convert them', () => {
//       const result = TimeFrameCalculationService.calculateCustomTimeFrame({
//         customStartDate: '2024-01-01',
//         customEndDate: '2024-01-31'
//       });

//       expect(result.start).toEqual(new Date('2024-01-01'));
//       expect(result.end).toEqual(new Date('2024-01-31'));
//     });

//     it('should throw error if start date is missing', () => {
//       expect(() =>
//         TimeFrameCalculationService.calculateCustomTimeFrame({
//           customEndDate: new Date('2024-01-31')
//         })
//       ).toThrow('customStartDate is required for custom time frame');
//     });

//     it('should throw error if end date is missing', () => {
//       expect(() =>
//         TimeFrameCalculationService.calculateCustomTimeFrame({
//           customStartDate: new Date('2024-01-01')
//         })
//       ).toThrow('customEndDate is required for custom time frame');
//     });

//     it('should throw error if start date is invalid', () => {
//       expect(() =>
//         TimeFrameCalculationService.calculateCustomTimeFrame({
//           customStartDate: 'invalid-date',
//           customEndDate: new Date('2024-01-31')
//         })
//       ).toThrow('Invalid start date');
//     });

//     it('should throw error if end date is invalid', () => {
//       expect(() =>
//         TimeFrameCalculationService.calculateCustomTimeFrame({
//           customStartDate: new Date('2024-01-01'),
//           customEndDate: 'invalid-date'
//         })
//       ).toThrow('Invalid end date');
//     });

//     it('should throw error if start date is after end date', () => {
//       expect(() =>
//         TimeFrameCalculationService.calculateCustomTimeFrame({
//           customStartDate: new Date('2024-01-31'),
//           customEndDate: new Date('2024-01-01')
//         })
//       ).toThrow('Start date must be before end date');
//     });

//     it('should throw error if start date equals end date', () => {
//       const sameDate = new Date('2024-01-15');
//       expect(() =>
//         TimeFrameCalculationService.calculateCustomTimeFrame({
//           customStartDate: sameDate,
//           customEndDate: sameDate
//         })
//       ).toThrow('Start date must be before end date');
//     });
//   });

//   describe('calculateLastMonth', () => {
//     it('should calculate last month correctly', () => {
//       const result = TimeFrameCalculationService.calculateLastMonth();

//       // Verify it returns a valid time frame
//       expect(result.start).toBeDefined();
//       expect(result.end).toBeDefined();
//       expect(result.type).toBe('last_month');
      
//       // Verify start is before end
//       expect(result.start.getTime()).toBeLessThan(result.end.getTime());
      
//       // Verify start is first day of month
//       expect(result.start.getDate()).toBe(1);
      
//       // Verify end is last day of month
//       expect(result.end.getDate()).toBeGreaterThanOrEqual(28);
//     });

//     it('should handle month boundaries correctly', () => {
//       const result = TimeFrameCalculationService.calculateLastMonth();

//       // Start and end should be in the same month
//       expect(result.start.getMonth()).toBe(result.end.getMonth());
      
//       // Start should be first day
//       expect(result.start.getDate()).toBe(1);
      
//       // End should be last day (28-31)
//       expect(result.end.getDate()).toBeGreaterThanOrEqual(28);
//     });

//     it('should handle year boundaries correctly', () => {
//       const result = TimeFrameCalculationService.calculateLastMonth();

//       // Start and end should be in the same year
//       expect(result.start.getFullYear()).toBe(result.end.getFullYear());
//     });

//     it('should set end time to end of day', () => {
//       const result = TimeFrameCalculationService.calculateLastMonth();

//       expect(result.end.getHours()).toBe(23);
//       expect(result.end.getMinutes()).toBe(59);
//       expect(result.end.getSeconds()).toBe(59);
//       expect(result.end.getMilliseconds()).toBe(999);
//     });
//   });

//   describe('calculateThisMonthToDate', () => {
//     it('should calculate this month to date correctly', () => {
//       const result = TimeFrameCalculationService.calculateThisMonthToDate();

//       expect(result.start).toBeDefined();
//       expect(result.end).toBeDefined();
//       expect(result.type).toBe('this_month_to_date');
      
//       // Start should be first day of month
//       expect(result.start.getDate()).toBe(1);
      
//       // End should be today or later
//       expect(result.end.getTime()).toBeGreaterThanOrEqual(result.start.getTime());
//     });

//     it('should start from first day of month', () => {
//       const result = TimeFrameCalculationService.calculateThisMonthToDate();

//       expect(result.start.getDate()).toBe(1);
//     });

//     it('should include current time as end date', () => {
//       const result = TimeFrameCalculationService.calculateThisMonthToDate();
//       const now = new Date();

//       // End date should be close to now (within a few seconds)
//       const timeDiff = Math.abs(result.end.getTime() - now.getTime());
//       expect(timeDiff).toBeLessThan(5000); // Within 5 seconds
//     });
//   });

//   describe('calculateSinceInstallation', () => {
//     it('should query earliest meter reading and return time frame', async () => {
//       const earliestDate = new Date('2023-06-01');
//       db.query.mockResolvedValueOnce({
//         rows: [{ earliest_reading: earliestDate }]
//       });

//       const result = await TimeFrameCalculationService.calculateSinceInstallation({
//         meterElementId: 5,
//         tenantId: 1
//       });

//       expect(result.start).toEqual(earliestDate);
//       expect(result.end).toBeDefined();
//       expect(result.type).toBe('since_installation');

//       // Verify database query
//       expect(db.query).toHaveBeenCalledWith(
//         expect.stringContaining('MIN(created_at)'),
//         [5, 1]
//       );
//     });

//     it('should throw error if meterElementId is missing', async () => {
//       await expect(
//         TimeFrameCalculationService.calculateSinceInstallation({
//           tenantId: 1
//         })
//       ).rejects.toThrow('meterElementId is required for since_installation time frame');
//     });

//     it('should throw error if tenantId is missing', async () => {
//       await expect(
//         TimeFrameCalculationService.calculateSinceInstallation({
//           meterElementId: 5
//         })
//       ).rejects.toThrow('tenantId is required for since_installation time frame');
//     });

//     it('should throw error if no meter readings found', async () => {
//       db.query.mockResolvedValueOnce({
//         rows: [{ earliest_reading: null }]
//       });

//       await expect(
//         TimeFrameCalculationService.calculateSinceInstallation({
//           meterElementId: 5,
//           tenantId: 1
//         })
//       ).rejects.toThrow('No meter readings found for this meter element');
//     });

//     it('should throw error if query returns empty rows', async () => {
//       db.query.mockResolvedValueOnce({
//         rows: []
//       });

//       await expect(
//         TimeFrameCalculationService.calculateSinceInstallation({
//           meterElementId: 5,
//           tenantId: 1
//         })
//       ).rejects.toThrow('No meter readings found for this meter element');
//     });

//     it('should handle database errors gracefully', async () => {
//       db.query.mockRejectedValueOnce(new Error('Database connection failed'));

//       await expect(
//         TimeFrameCalculationService.calculateSinceInstallation({
//           meterElementId: 5,
//           tenantId: 1
//         })
//       ).rejects.toThrow('Database connection failed');
//     });
//   });

//   describe('calculateTimeFrame', () => {
//     it('should dispatch to correct calculation method for custom', () => {
//       const spy = jest.spyOn(TimeFrameCalculationService, 'calculateCustomTimeFrame');

//       TimeFrameCalculationService.calculateTimeFrame('custom', {
//         customStartDate: new Date('2024-01-01'),
//         customEndDate: new Date('2024-01-31')
//       });

//       expect(spy).toHaveBeenCalled();
//       spy.mockRestore();
//     });

//     it('should dispatch to correct calculation method for last_month', () => {
//       const spy = jest.spyOn(TimeFrameCalculationService, 'calculateLastMonth');

//       TimeFrameCalculationService.calculateTimeFrame('last_month');

//       expect(spy).toHaveBeenCalled();
//       spy.mockRestore();
//     });

//     it('should dispatch to correct calculation method for this_month_to_date', () => {
//       const spy = jest.spyOn(TimeFrameCalculationService, 'calculateThisMonthToDate');

//       TimeFrameCalculationService.calculateTimeFrame('this_month_to_date');

//       expect(spy).toHaveBeenCalled();
//       spy.mockRestore();
//     });

//     it('should dispatch to correct calculation method for since_installation', async () => {
//       db.query.mockResolvedValueOnce({
//         rows: [{ earliest_reading: new Date('2023-06-01') }]
//       });

//       const spy = jest.spyOn(TimeFrameCalculationService, 'calculateSinceInstallation');

//       await TimeFrameCalculationService.calculateTimeFrame('since_installation', {
//         meterElementId: 5,
//         tenantId: 1
//       });

//       expect(spy).toHaveBeenCalled();
//       spy.mockRestore();
//     });

//     it('should throw error for invalid time frame type', async () => {
//       await expect(
//         TimeFrameCalculationService.calculateTimeFrame('invalid_type')
//       ).rejects.toThrow('Invalid time frame type: invalid_type');
//     });
//   });

//   describe('validateDateRange', () => {
//     it('should accept valid date ranges', () => {
//       expect(() =>
//         TimeFrameCalculationService.validateDateRange(
//           new Date('2024-01-01'),
//           new Date('2024-01-31')
//         )
//       ).not.toThrow();
//     });

//     it('should accept string dates', () => {
//       expect(() =>
//         TimeFrameCalculationService.validateDateRange('2024-01-01', '2024-01-31')
//       ).not.toThrow();
//     });

//     it('should throw error if start date is invalid', () => {
//       expect(() =>
//         TimeFrameCalculationService.validateDateRange('invalid', new Date('2024-01-31'))
//       ).toThrow('Invalid start date');
//     });

//     it('should throw error if end date is invalid', () => {
//       expect(() =>
//         TimeFrameCalculationService.validateDateRange(new Date('2024-01-01'), 'invalid')
//       ).toThrow('Invalid end date');
//     });

//     it('should throw error if start date is after end date', () => {
//       expect(() =>
//         TimeFrameCalculationService.validateDateRange(
//           new Date('2024-01-31'),
//           new Date('2024-01-01')
//         )
//       ).toThrow('Start date must be before end date');
//     });

//     it('should throw error if dates are equal', () => {
//       const sameDate = new Date('2024-01-15');
//       expect(() =>
//         TimeFrameCalculationService.validateDateRange(sameDate, sameDate)
//       ).toThrow('Start date must be before end date');
//     });
//   });

//   describe('formatForSQL', () => {
//     it('should format time frame for SQL queries', () => {
//       const timeFrame = {
//         start: new Date('2024-01-01T00:00:00Z'),
//         end: new Date('2024-01-31T23:59:59Z'),
//         type: 'custom'
//       };

//       const result = TimeFrameCalculationService.formatForSQL(timeFrame);

//       expect(result.start).toBe('2024-01-01T00:00:00.000Z');
//       expect(result.end).toBe('2024-01-31T23:59:59.000Z');
//       expect(result.type).toBe('custom');
//     });
//   });

//   describe('getTimeFrameDescription', () => {
//     it('should generate description for last_month', () => {
//       const timeFrame = {
//         start: new Date('2024-01-01'),
//         end: new Date('2024-01-31')
//       };

//       const description = TimeFrameCalculationService.getTimeFrameDescription('last_month', timeFrame);

//       expect(description).toContain('Last Month');
//       expect(description).toContain('2024'); // Year should be present
//     });

//     it('should generate description for this_month_to_date', () => {
//       const timeFrame = {
//         start: new Date('2024-02-01'),
//         end: new Date('2024-02-15')
//       };

//       const description = TimeFrameCalculationService.getTimeFrameDescription('this_month_to_date', timeFrame);

//       expect(description).toContain('This Month to Date');
//     });

//     it('should generate description for since_installation', () => {
//       const timeFrame = {
//         start: new Date('2023-06-01'),
//         end: new Date('2024-02-15')
//       };

//       const description = TimeFrameCalculationService.getTimeFrameDescription('since_installation', timeFrame);

//       expect(description).toContain('Since Installation');
//     });

//     it('should generate description for custom', () => {
//       const timeFrame = {
//         start: new Date('2024-01-15'),
//         end: new Date('2024-02-15')
//       };

//       const description = TimeFrameCalculationService.getTimeFrameDescription('custom', timeFrame);

//       expect(description).toContain('Custom Range');
//     });
//   });
// });
