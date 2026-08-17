/**
 * Utility functions for calculating element-specific register numbers
 * 
 * Element-specific register calculation:
 * - Element A (position 0): uses base register number as-is (e.g., 1100)
 * - Element B (position 1): prepends "1" to base (e.g., 1100 becomes 11100)
 * - Element C (position 2): prepends "2" to base (e.g., 1100 becomes 21100)
 * - Element D (position 3): prepends "3" to base (e.g., 1100 becomes 31100)
 * - And so on for elements E-Z
 */

/**
 * Calculates the element-specific register number based on the base register and element letter
 * 
 * @param baseRegister - The base register number from the register table
 * @param element - The element letter (A-Z)
 * @returns The calculated element-specific register number
 * 
 * @example
 * calculateElementRegisterNumber(1100, 'A') // returns 1100
 * calculateElementRegisterNumber(1100, 'B') // returns 11100
 * calculateElementRegisterNumber(1100, 'C') // returns 21100
 * calculateElementRegisterNumber(1100, 'D') // returns 31100
 */
export function calculateElementRegisterNumber(baseRegister: number, element: string): number {
  // Validate inputs
  if (!element || element.length === 0) {
    throw new Error('Element must be a non-empty string');
  }

  if (baseRegister < 0) {
    throw new Error('Base register must be non-negative');
  }

  // Get the first character and convert to uppercase
  const elementChar = element.charAt(0).toUpperCase();

  // Calculate element position (A=0, B=1, C=2, etc.)
  const elementPosition = elementChar.charCodeAt(0) - 'A'.charCodeAt(0);

  // Validate element is A-Z
  if (elementPosition < 0 || elementPosition > 25) {
    throw new Error(`Element must be a letter A-Z, got: ${element}`);
  }

  // Element A (position 0) returns base register as-is
  if (elementPosition === 0) {
    return baseRegister;
  }

  // For other elements, prepend the position number to the base register
  // e.g., position 1 (B) prepends "1", position 2 (C) prepends "2", etc.
  return parseInt(`${elementPosition}${baseRegister}`);
}

/**
 * Validates if a given element letter is valid (A-Z)
 * 
 * @param element - The element letter to validate
 * @returns true if valid, false otherwise
 */
export function isValidElement(element: string): boolean {
  if (!element || element.length === 0) {
    return false;
  }

  const elementChar = element.charAt(0).toUpperCase();
  const elementPosition = elementChar.charCodeAt(0) - 'A'.charCodeAt(0);

  return elementPosition >= 0 && elementPosition <= 25;
}

/**
 * Gets the element position (0-25) for a given element letter
 * 
 * @param element - The element letter (A-Z)
 * @returns The position (0 for A, 1 for B, etc.)
 * @throws Error if element is not A-Z
 */
export function getElementPosition(element: string): number {
  if (!isValidElement(element)) {
    throw new Error(`Element must be a letter A-Z, got: ${element}`);
  }

  const elementChar = element.charAt(0).toUpperCase();
  return elementChar.charCodeAt(0) - 'A'.charCodeAt(0);
}
