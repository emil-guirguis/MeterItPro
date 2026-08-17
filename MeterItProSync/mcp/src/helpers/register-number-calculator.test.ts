import { describe, it, expect } from 'vitest';
import {
  calculateElementRegisterNumber,
  isValidElement,
  getElementPosition,
} from './register-number-calculator';

describe('Register Number Calculator', () => {
  describe('calculateElementRegisterNumber', () => {
    describe('Element A (base case)', () => {
      it('should return base register for element A', () => {
        expect(calculateElementRegisterNumber(1100, 'A')).toBe(1100);
      });

      it('should return base register for lowercase element a', () => {
        expect(calculateElementRegisterNumber(1100, 'a')).toBe(1100);
      });

      it('should handle zero base register for element A', () => {
        expect(calculateElementRegisterNumber(0, 'A')).toBe(0);
      });

      it('should handle large base register for element A', () => {
        expect(calculateElementRegisterNumber(999999, 'A')).toBe(999999);
      });
    });

    describe('Element B (prepend 1)', () => {
      it('should prepend 1 to base register for element B', () => {
        expect(calculateElementRegisterNumber(1100, 'B')).toBe(11100);
      });

      it('should prepend 1 for lowercase element b', () => {
        expect(calculateElementRegisterNumber(1100, 'b')).toBe(11100);
      });

      it('should handle small base register for element B', () => {
        expect(calculateElementRegisterNumber(1, 'B')).toBe(11);
      });

      it('should handle zero base register for element B', () => {
        expect(calculateElementRegisterNumber(0, 'B')).toBe(10);
      });
    });

    describe('Element C (prepend 2)', () => {
      it('should prepend 2 to base register for element C', () => {
        expect(calculateElementRegisterNumber(1100, 'C')).toBe(21100);
      });

      it('should prepend 2 for lowercase element c', () => {
        expect(calculateElementRegisterNumber(1100, 'c')).toBe(21100);
      });

      it('should handle small base register for element C', () => {
        expect(calculateElementRegisterNumber(1, 'C')).toBe(21);
      });
    });

    describe('Element D (prepend 3)', () => {
      it('should prepend 3 to base register for element D', () => {
        expect(calculateElementRegisterNumber(1100, 'D')).toBe(31100);
      });

      it('should prepend 3 for lowercase element d', () => {
        expect(calculateElementRegisterNumber(1100, 'd')).toBe(31100);
      });
    });

    describe('All elements A-Z', () => {
      const baseRegister = 1000;
      const expectedResults: Record<string, number> = {
        A: 1000,
        B: 11000,
        C: 21000,
        D: 31000,
        E: 41000,
        F: 51000,
        G: 61000,
        H: 71000,
        I: 81000,
        J: 91000,
        K: 101000,
        L: 111000,
        M: 121000,
        N: 131000,
        O: 141000,
        P: 151000,
        Q: 161000,
        R: 171000,
        S: 181000,
        T: 191000,
        U: 201000,
        V: 211000,
        W: 221000,
        X: 231000,
        Y: 241000,
        Z: 251000,
      };

      Object.entries(expectedResults).forEach(([element, expected]) => {
        it(`should calculate correct register number for element ${element}`, () => {
          expect(calculateElementRegisterNumber(baseRegister, element)).toBe(expected);
        });
      });
    });

    describe('Error handling', () => {
      it('should throw error for empty element string', () => {
        expect(() => calculateElementRegisterNumber(1100, '')).toThrow(
          'Element must be a non-empty string'
        );
      });

      it('should throw error for invalid element (number)', () => {
        expect(() => calculateElementRegisterNumber(1100, '1')).toThrow(
          'Element must be a letter A-Z'
        );
      });

      it('should throw error for invalid element (special character)', () => {
        expect(() => calculateElementRegisterNumber(1100, '@')).toThrow(
          'Element must be a letter A-Z'
        );
      });

      it('should throw error for negative base register', () => {
        expect(() => calculateElementRegisterNumber(-1, 'A')).toThrow(
          'Base register must be non-negative'
        );
      });

      it('should throw error for element beyond Z', () => {
        expect(() => calculateElementRegisterNumber(1100, '[')).toThrow(
          'Element must be a letter A-Z'
        );
      });
    });

    describe('Edge cases', () => {
      it('should handle multi-character element string (uses first char)', () => {
        expect(calculateElementRegisterNumber(1100, 'ABC')).toBe(1100);
      });

      it('should handle very large base register', () => {
        expect(calculateElementRegisterNumber(999999999, 'B')).toBe(1999999999);
      });

      it('should handle base register with leading zeros in string form', () => {
        // JavaScript will parse "0100" as 100
        expect(calculateElementRegisterNumber(100, 'B')).toBe(1100);
      });
    });
  });

  describe('isValidElement', () => {
    describe('Valid elements', () => {
      it('should return true for uppercase A', () => {
        expect(isValidElement('A')).toBe(true);
      });

      it('should return true for lowercase a', () => {
        expect(isValidElement('a')).toBe(true);
      });

      it('should return true for all uppercase letters A-Z', () => {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        letters.forEach((letter) => {
          expect(isValidElement(letter)).toBe(true);
        });
      });

      it('should return true for all lowercase letters a-z', () => {
        const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
        letters.forEach((letter) => {
          expect(isValidElement(letter)).toBe(true);
        });
      });

      it('should return true for multi-character string starting with letter', () => {
        expect(isValidElement('ABC')).toBe(true);
      });
    });

    describe('Invalid elements', () => {
      it('should return false for empty string', () => {
        expect(isValidElement('')).toBe(false);
      });

      it('should return false for number', () => {
        expect(isValidElement('1')).toBe(false);
      });

      it('should return false for special character', () => {
        expect(isValidElement('@')).toBe(false);
      });

      it('should return false for character beyond Z', () => {
        expect(isValidElement('[')).toBe(false);
      });

      it('should return false for character before A', () => {
        expect(isValidElement('@')).toBe(false);
      });
    });
  });

  describe('getElementPosition', () => {
    describe('Valid elements', () => {
      it('should return 0 for element A', () => {
        expect(getElementPosition('A')).toBe(0);
      });

      it('should return 0 for lowercase a', () => {
        expect(getElementPosition('a')).toBe(0);
      });

      it('should return 1 for element B', () => {
        expect(getElementPosition('B')).toBe(1);
      });

      it('should return 25 for element Z', () => {
        expect(getElementPosition('Z')).toBe(25);
      });

      it('should return correct position for all letters A-Z', () => {
        for (let i = 0; i < 26; i++) {
          const letter = String.fromCharCode('A'.charCodeAt(0) + i);
          expect(getElementPosition(letter)).toBe(i);
        }
      });

      it('should return correct position for multi-character string', () => {
        expect(getElementPosition('ABC')).toBe(0); // Uses first character
      });
    });

    describe('Error handling', () => {
      it('should throw error for empty string', () => {
        expect(() => getElementPosition('')).toThrow(
          'Element must be a letter A-Z'
        );
      });

      it('should throw error for number', () => {
        expect(() => getElementPosition('1')).toThrow(
          'Element must be a letter A-Z'
        );
      });

      it('should throw error for special character', () => {
        expect(() => getElementPosition('@')).toThrow(
          'Element must be a letter A-Z'
        );
      });
    });
  });

  describe('Integration tests', () => {
    it('should calculate consistent register numbers for same element', () => {
      const baseRegister = 5000;
      const element = 'C';
      const result1 = calculateElementRegisterNumber(baseRegister, element);
      const result2 = calculateElementRegisterNumber(baseRegister, element);
      expect(result1).toBe(result2);
    });

    it('should produce different register numbers for different elements', () => {
      const baseRegister = 1000;
      const resultA = calculateElementRegisterNumber(baseRegister, 'A');
      const resultB = calculateElementRegisterNumber(baseRegister, 'B');
      const resultC = calculateElementRegisterNumber(baseRegister, 'C');

      expect(resultA).not.toBe(resultB);
      expect(resultB).not.toBe(resultC);
      expect(resultA).not.toBe(resultC);
    });

    it('should produce different register numbers for different base registers', () => {
      const element = 'B';
      const result1 = calculateElementRegisterNumber(1000, element);
      const result2 = calculateElementRegisterNumber(2000, element);

      expect(result1).not.toBe(result2);
      expect(result1).toBe(11000);
      expect(result2).toBe(12000);
    });

    it('should handle case-insensitive element input', () => {
      const baseRegister = 1100;
      const resultUpper = calculateElementRegisterNumber(baseRegister, 'B');
      const resultLower = calculateElementRegisterNumber(baseRegister, 'b');
      const resultMixed = calculateElementRegisterNumber(baseRegister, 'B');

      expect(resultUpper).toBe(resultLower);
      expect(resultLower).toBe(resultMixed);
    });
  });
});
