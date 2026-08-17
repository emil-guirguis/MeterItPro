/**
 * Material Design 3 Spacing System
 * Defines 4px-based spacing scale for consistent layout
 */

export const spacingScale = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  11: '44px',
  12: '48px',
  13: '52px',
  14: '56px',
  15: '60px',
  16: '64px',
};

export const spacingAliases = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '28px',
  '4xl': '32px',
  '5xl': '36px',
  '6xl': '40px',
  '7xl': '44px',
  '8xl': '48px',
};

/**
 * Spacing utility function for MUI theme
 * Returns spacing value in pixels
 */
export const spacing = (multiplier: number): string => {
  return `${multiplier * 4}px`;
};
