/**
 * Material Design 3 Typography Scales
 * Defines font sizes, weights, and line heights per MD3 specifications
 */

export interface TypographyVariant {
  fontSize: string;
  fontWeight: number;
  lineHeight: string;
  letterSpacing: string;
}

export const typographyScales = {
  // Display Scale
  displayLarge: {
    fontSize: '57px',
    fontWeight: 400,
    lineHeight: '64px',
    letterSpacing: '0px',
  } as TypographyVariant,

  displayMedium: {
    fontSize: '45px',
    fontWeight: 400,
    lineHeight: '52px',
    letterSpacing: '0px',
  } as TypographyVariant,

  displaySmall: {
    fontSize: '36px',
    fontWeight: 400,
    lineHeight: '44px',
    letterSpacing: '0px',
  } as TypographyVariant,

  // Headline Scale
  headlineLarge: {
    fontSize: '32px',
    fontWeight: 400,
    lineHeight: '40px',
    letterSpacing: '0px',
  } as TypographyVariant,

  headlineMedium: {
    fontSize: '28px',
    fontWeight: 400,
    lineHeight: '36px',
    letterSpacing: '0px',
  } as TypographyVariant,

  headlineSmall: {
    fontSize: '24px',
    fontWeight: 400,
    lineHeight: '32px',
    letterSpacing: '0px',
  } as TypographyVariant,

  // Title Scale
  titleLarge: {
    fontSize: '22px',
    fontWeight: 500,
    lineHeight: '28px',
    letterSpacing: '0px',
  } as TypographyVariant,

  titleMedium: {
    fontSize: '16px',
    fontWeight: 500,
    lineHeight: '24px',
    letterSpacing: '0.15px',
  } as TypographyVariant,

  titleSmall: {
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: '20px',
    letterSpacing: '0.1px',
  } as TypographyVariant,

  // Body Scale
  bodyLarge: {
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: '24px',
    letterSpacing: '0.5px',
  } as TypographyVariant,

  bodyMedium: {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: '20px',
    letterSpacing: '0.25px',
  } as TypographyVariant,

  bodySmall: {
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: '16px',
    letterSpacing: '0.4px',
  } as TypographyVariant,

  // Label Scale
  labelLarge: {
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: '20px',
    letterSpacing: '0.1px',
  } as TypographyVariant,

  labelMedium: {
    fontSize: '12px',
    fontWeight: 500,
    lineHeight: '16px',
    letterSpacing: '0.5px',
  } as TypographyVariant,

  labelSmall: {
    fontSize: '11px',
    fontWeight: 500,
    lineHeight: '16px',
    letterSpacing: '0.5px',
  } as TypographyVariant,
};

export const fontFamily = '"Roboto", "Helvetica", "Arial", sans-serif';
