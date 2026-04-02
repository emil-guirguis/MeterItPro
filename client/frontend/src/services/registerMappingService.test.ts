/**
 * Unit tests for RegisterMappingService
 * 
 * Tests:
 * - Property 1: Register Name Mapping Accuracy
 * - Property 2: Fallback for Missing Registers
 * - Property 3: Cache Consistency
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerMappingService } from './registerMappingService';
import * as fc from 'fast-check';

// Mock the apiClient
vi.mock('./apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from './apiClient';

describe('RegisterMappingService', () => {
  beforeEach(() => {
    registerMappingService.reset();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with empty mappings', () => {
      expect(registerMappingService.isInitialized()).toBe(false);
      expect(registerMappingService.getAllMappings().size).toBe(0);
    });

    it('should fetch and cache registers on initialization', async () => {
      const mockRegisters = [
        {
          register_id: 1,
          name: 'Active Energy',
          register: 40,
          unit: 'kWh',
          field_name: 'active_energy',
        },
        {
          register_id: 2,
          name: 'Power Phase A',
          register: 50,
          unit: 'kW',
          field_name: 'power_phase_a',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockRegisters,
      });

      await registerMappingService.initialize();

      expect(registerMappingService.isInitialized()).toBe(true);
      expect(registerMappingService.getAllMappings().size).toBe(2);
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('API Error'));

      await registerMappingService.initialize();

      expect(registerMappingService.isInitialized()).toBe(true);
      expect(registerMappingService.getAllMappings().size).toBe(0);
    });

    it('should not reinitialize if already initialized', async () => {
      const mockRegisters = [
        {
          register_id: 1,
          name: 'Active Energy',
          register: 40,
          unit: 'kWh',
          field_name: 'active_energy',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockRegisters,
      });

      await registerMappingService.initialize();
      const callCount1 = vi.mocked(apiClient.get).mock.calls.length;

      await registerMappingService.initialize();
      const callCount2 = vi.mocked(apiClient.get).mock.calls.length;

      expect(callCount1).toBe(callCount2);
    });
  });

  describe('Property 1: Register Name Mapping Accuracy', () => {
    beforeEach(async () => {
      const mockRegisters = [
        {
          register_id: 1,
          name: 'Active Energy',
          register: 40,
          unit: 'kWh',
          field_name: 'active_energy',
        },
        {
          register_id: 2,
          name: 'Power Phase A',
          register: 50,
          unit: 'kW',
          field_name: 'power_phase_a',
        },
        {
          register_id: 3,
          name: 'Voltage A-N',
          register: 60,
          unit: 'V',
          field_name: 'voltage_a_n',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockRegisters,
      });

      await registerMappingService.initialize();
    });

    it('should return correct register name for existing field', () => {
      expect(registerMappingService.getRegisterName('active_energy')).toBe('Active Energy');
      expect(registerMappingService.getRegisterName('power_phase_a')).toBe('Power Phase A');
      expect(registerMappingService.getRegisterName('voltage_a_n')).toBe('Voltage A-N');
    });

    it('should return correct unit for existing field', () => {
      expect(registerMappingService.getRegisterUnit('active_energy')).toBe('kWh');
      expect(registerMappingService.getRegisterUnit('power_phase_a')).toBe('kW');
      expect(registerMappingService.getRegisterUnit('voltage_a_n')).toBe('V');
    });

    it('should correctly identify existing registers', () => {
      expect(registerMappingService.hasRegister('active_energy')).toBe(true);
      expect(registerMappingService.hasRegister('power_phase_a')).toBe(true);
      expect(registerMappingService.hasRegister('voltage_a_n')).toBe(true);
    });

    // Property-based test: For any field name in register table, mapping should be accurate
    it('should maintain accurate mappings for all registered fields (property test)', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('active_energy', 'power_phase_a', 'voltage_a_n'),
          (fieldName) => {
            const name = registerMappingService.getRegisterName(fieldName);
            const unit = registerMappingService.getRegisterUnit(fieldName);
            const hasRegister = registerMappingService.hasRegister(fieldName);

            // All registered fields should have non-empty names and units
            expect(hasRegister).toBe(true);
            expect(name).toBeTruthy();
            expect(name.length).toBeGreaterThan(0);
            expect(unit).toBeTruthy();
            expect(unit.length).toBeGreaterThan(0);
          }
        )
      );
    });
  });

  describe('Property 2: Fallback for Missing Registers', () => {
    beforeEach(async () => {
      const mockRegisters = [
        {
          register_id: 1,
          name: 'Active Energy',
          register: 40,
          unit: 'kWh',
          field_name: 'active_energy',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockRegisters,
      });

      await registerMappingService.initialize();
    });

    it('should format field name as fallback for missing registers', () => {
      expect(registerMappingService.getRegisterName('unknown_field')).toBe('Unknown Field');
      expect(registerMappingService.getRegisterName('power_phase_b')).toBe('Power Phase B');
      expect(registerMappingService.getRegisterName('voltage_b_n')).toBe('Voltage B N');
    });

    it('should return empty string as fallback for missing register units', () => {
      expect(registerMappingService.getRegisterUnit('unknown_field')).toBe('');
      expect(registerMappingService.getRegisterUnit('power_phase_b')).toBe('');
    });

    it('should correctly identify missing registers', () => {
      expect(registerMappingService.hasRegister('unknown_field')).toBe(false);
      expect(registerMappingService.hasRegister('power_phase_b')).toBe(false);
    });

    // Property-based test: For any field name not in table, fallback should be readable
    it('should provide readable fallback for missing registers (property test)', () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-z_]+$/),
          (fieldName) => {
            // Skip if it's a registered field
            if (registerMappingService.hasRegister(fieldName)) {
              return true;
            }

            const name = registerMappingService.getRegisterName(fieldName);
            const unit = registerMappingService.getRegisterUnit(fieldName);

            // Fallback name should be readable (title case)
            expect(name).toBeTruthy();
            expect(name.length).toBeGreaterThan(0);
            // Should not contain underscores (formatted)
            expect(name).not.toContain('_');
            // Unit should be empty for missing registers
            expect(unit).toBe('');
          }
        )
      );
    });
  });

  describe('Property 3: Cache Consistency', () => {
    it('should maintain consistent cache across multiple calls', async () => {
      const mockRegisters = [
        {
          register_id: 1,
          name: 'Active Energy',
          register: 40,
          unit: 'kWh',
          field_name: 'active_energy',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockRegisters,
      });

      await registerMappingService.initialize();

      // Call multiple times and verify consistency
      const name1 = registerMappingService.getRegisterName('active_energy');
      const name2 = registerMappingService.getRegisterName('active_energy');
      const name3 = registerMappingService.getRegisterName('active_energy');

      expect(name1).toBe(name2);
      expect(name2).toBe(name3);
      expect(name1).toBe('Active Energy');
    });

    it('should return same mapping object for same field', async () => {
      const mockRegisters = [
        {
          register_id: 1,
          name: 'Active Energy',
          register: 40,
          unit: 'kWh',
          field_name: 'active_energy',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockRegisters,
      });

      await registerMappingService.initialize();

      const mappings1 = registerMappingService.getAllMappings();
      const mappings2 = registerMappingService.getAllMappings();

      expect(mappings1.size).toBe(mappings2.size);
      expect(mappings1.get('active_energy')).toEqual(mappings2.get('active_energy'));
    });

    // Property-based test: For any cached mapping, value should match database
    it('should maintain cache consistency for all mappings (property test)', async () => {
      const mockRegisters = [
        {
          register_id: 1,
          name: 'Active Energy',
          register: 40,
          unit: 'kWh',
          field_name: 'active_energy',
        },
        {
          register_id: 2,
          name: 'Power Phase A',
          register: 50,
          unit: 'kW',
          field_name: 'power_phase_a',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockRegisters,
      });

      await registerMappingService.initialize();

      fc.assert(
        fc.property(
          fc.constantFrom(...mockRegisters),
          (register) => {
            const name = registerMappingService.getRegisterName(register.field_name);
            const unit = registerMappingService.getRegisterUnit(register.field_name);

            // Cached values should match database values
            expect(name).toBe(register.name);
            expect(unit).toBe(register.unit);
          }
        )
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty field names', async () => {
      const mockRegisters = [];

      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockRegisters,
      });

      await registerMappingService.initialize();

      expect(registerMappingService.getRegisterName('')).toBe('');
      expect(registerMappingService.getRegisterUnit('')).toBe('');
      expect(registerMappingService.hasRegister('')).toBe(false);
    });

    it('should handle special characters in field names', async () => {
      const mockRegisters = [];

      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockRegisters,
      });

      await registerMappingService.initialize();

      const name = registerMappingService.getRegisterName('field-with-dashes');
      expect(name).toBeTruthy();
      expect(name.length).toBeGreaterThan(0);
    });

    it('should handle very long field names', async () => {
      const mockRegisters = [];

      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockRegisters,
      });

      await registerMappingService.initialize();

      const longFieldName = 'very_long_field_name_with_many_underscores_and_words';
      const name = registerMappingService.getRegisterName(longFieldName);
      expect(name).toBeTruthy();
      expect(name.length).toBeGreaterThan(0);
      expect(name).not.toContain('_');
    });
  });
});
