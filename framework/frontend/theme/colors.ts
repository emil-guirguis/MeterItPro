/**
 * Material Design 3 Color Tokens
 * Defines semantic color values for light and dark themes
 */

export const lightColorTokens = {
  // Primary Colors
  primary: '#6750A4',
  onPrimary: '#FFFFFF',
  primaryContainer: '#EADDFF',
  onPrimaryContainer: '#21005E',

  // Secondary Colors
  secondary: '#625B71',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#E8DEF8',
  onSecondaryContainer: '#1E192B',

  // Tertiary Colors
  tertiary: '#7D5260',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#FFD8E4',
  onTertiaryContainer: '#31111D',

  // Error Colors
  error: '#B3261E',
  onError: '#FFFFFF',
  errorContainer: '#F9DEDC',
  onErrorContainer: '#410E0B',

  // Warning Colors
  warning: '#F57C00',
  onWarning: '#FFFFFF',
  warningContainer: '#FFE0B2',
  onWarningContainer: '#E65100',

  // Info Colors
  info: '#0288D1',
  onInfo: '#FFFFFF',
  infoContainer: '#B3E5FC',
  onInfoContainer: '#01579B',

  // Success Colors
  success: '#2E7D32',
  onSuccess: '#FFFFFF',
  successContainer: '#C8E6C9',
  onSuccessContainer: '#1B5E20',

  // Neutral Colors
  background: '#FFFBFE',
  surface: '#FFFBFE',
  surfaceVariant: '#E7E0EC',
  outline: '#79747E',
  outlineVariant: '#C4C7C5',
};

export const darkColorTokens = {
  // Primary Colors
  primary: '#D0BCFF',
  onPrimary: '#371E55',
  primaryContainer: '#4F378B',
  onPrimaryContainer: '#EADDFF',

  // Secondary Colors
  secondary: '#CCC7DB',
  onSecondary: '#332D41',
  secondaryContainer: '#4A4458',
  onSecondaryContainer: '#E8DEF8',

  // Tertiary Colors
  tertiary: '#F4B1D3',
  onTertiary: '#492532',
  tertiaryContainer: '#633B48',
  onTertiaryContainer: '#FFD8E4',

  // Error Colors
  error: '#F2B8B5',
  onError: '#601410',
  errorContainer: '#8C1D18',
  onErrorContainer: '#F9DEDC',

  // Warning Colors
  warning: '#FFB74D',
  onWarning: '#E65100',
  warningContainer: '#BF360C',
  onWarningContainer: '#FFE0B2',

  // Info Colors
  info: '#81D4FA',
  onInfo: '#003DA5',
  infoContainer: '#0277BD',
  onInfoContainer: '#B3E5FC',

  // Success Colors
  success: '#A5D6A7',
  onSuccess: '#1B5E20',
  successContainer: '#2E7D32',
  onSuccessContainer: '#C8E6C9',

  // Neutral Colors
  background: '#1C1B1F',
  surface: '#1C1B1F',
  surfaceVariant: '#49454E',
  outline: '#938F99',
  outlineVariant: '#49454E',
};

export interface ColorTokens {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  warning: string;
  onWarning: string;
  warningContainer: string;
  onWarningContainer: string;
  info: string;
  onInfo: string;
  infoContainer: string;
  onInfoContainer: string;
  success: string;
  onSuccess: string;
  successContainer: string;
  onSuccessContainer: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  outline: string;
  outlineVariant: string;
}
