/**
 * Material Design 3 Theme Configuration
 * Creates MUI theme with Material Design 3 tokens
 */

import { createTheme, type ThemeOptions } from '@mui/material/styles';
import { lightColorTokens, darkColorTokens } from './colors';
import { typographyScales, fontFamily } from './typography';
import { elevationShadows } from './elevation';

/**
 * Create Material Design 3 theme for light mode
 */
export const createLightTheme = (): ReturnType<typeof createTheme> => {
  const themeOptions: ThemeOptions = {
    palette: {
      mode: 'light',
      primary: {
        main: lightColorTokens.primary,
        light: lightColorTokens.primaryContainer,
        dark: '#4F378B',
        contrastText: lightColorTokens.onPrimary,
      },
      secondary: {
        main: lightColorTokens.secondary,
        light: lightColorTokens.secondaryContainer,
        dark: '#4A4458',
        contrastText: lightColorTokens.onSecondary,
      },
      error: {
        main: lightColorTokens.error,
        light: lightColorTokens.errorContainer,
        dark: '#8C1D18',
        contrastText: lightColorTokens.onError,
      },
      warning: {
        main: lightColorTokens.warning,
        light: lightColorTokens.warningContainer,
        dark: '#BF360C',
        contrastText: lightColorTokens.onWarning,
      },
      info: {
        main: lightColorTokens.info,
        light: lightColorTokens.infoContainer,
        dark: '#0277BD',
        contrastText: lightColorTokens.onInfo,
      },
      success: {
        main: lightColorTokens.success,
        light: lightColorTokens.successContainer,
        dark: '#1B5E20',
        contrastText: lightColorTokens.onSuccess,
      },
      background: {
        default: lightColorTokens.background,
        paper: lightColorTokens.surface,
      },
      divider: lightColorTokens.outline,
    },
    typography: {
      fontFamily,
      displayLarge: typographyScales.displayLarge,
      displayMedium: typographyScales.displayMedium,
      displaySmall: typographyScales.displaySmall,
      headlineLarge: typographyScales.headlineLarge,
      headlineMedium: typographyScales.headlineMedium,
      headlineSmall: typographyScales.headlineSmall,
      titleLarge: typographyScales.titleLarge,
      titleMedium: typographyScales.titleMedium,
      titleSmall: typographyScales.titleSmall,
      bodyLarge: typographyScales.bodyLarge,
      bodyMedium: typographyScales.bodyMedium,
      bodySmall: typographyScales.bodySmall,
      labelLarge: typographyScales.labelLarge,
      labelMedium: typographyScales.labelMedium,
      labelSmall: typographyScales.labelSmall,
    } as any,
    shape: {
      borderRadius: 12,
    },
    shadows: [
      'none',
      elevationShadows.level1,
      elevationShadows.level2,
      elevationShadows.level3,
      elevationShadows.level4,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
    ],
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: 24,
            padding: '10px 24px',
            transition: 'all 200ms ease-in-out',
          },
          contained: {
            boxShadow: elevationShadows.level1,
            '&:hover': {
              boxShadow: elevationShadows.level2,
            },
          },
          outlined: {
            borderColor: lightColorTokens.outline,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: elevationShadows.level1,
            padding: 16,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 28,
            boxShadow: elevationShadows.level3,
          },
        },
      },
    },
  };

  return createTheme(themeOptions);
};

/**
 * Create Material Design 3 theme for dark mode
 */
export const createDarkTheme = (): ReturnType<typeof createTheme> => {
  const themeOptions: ThemeOptions = {
    palette: {
      mode: 'dark',
      primary: {
        main: darkColorTokens.primary,
        light: darkColorTokens.primaryContainer,
        dark: '#371E55',
        contrastText: darkColorTokens.onPrimary,
      },
      secondary: {
        main: darkColorTokens.secondary,
        light: darkColorTokens.secondaryContainer,
        dark: '#332D41',
        contrastText: darkColorTokens.onSecondary,
      },
      error: {
        main: darkColorTokens.error,
        light: darkColorTokens.errorContainer,
        dark: '#601410',
        contrastText: darkColorTokens.onError,
      },
      warning: {
        main: darkColorTokens.warning,
        light: darkColorTokens.warningContainer,
        dark: '#E65100',
        contrastText: darkColorTokens.onWarning,
      },
      info: {
        main: darkColorTokens.info,
        light: darkColorTokens.infoContainer,
        dark: '#003DA5',
        contrastText: darkColorTokens.onInfo,
      },
      success: {
        main: darkColorTokens.success,
        light: darkColorTokens.successContainer,
        dark: '#1B5E20',
        contrastText: darkColorTokens.onSuccess,
      },
      background: {
        default: darkColorTokens.background,
        paper: darkColorTokens.surface,
      },
      divider: darkColorTokens.outline,
    },
    typography: {
      fontFamily,
      displayLarge: typographyScales.displayLarge,
      displayMedium: typographyScales.displayMedium,
      displaySmall: typographyScales.displaySmall,
      headlineLarge: typographyScales.headlineLarge,
      headlineMedium: typographyScales.headlineMedium,
      headlineSmall: typographyScales.headlineSmall,
      titleLarge: typographyScales.titleLarge,
      titleMedium: typographyScales.titleMedium,
      titleSmall: typographyScales.titleSmall,
      bodyLarge: typographyScales.bodyLarge,
      bodyMedium: typographyScales.bodyMedium,
      bodySmall: typographyScales.bodySmall,
      labelLarge: typographyScales.labelLarge,
      labelMedium: typographyScales.labelMedium,
      labelSmall: typographyScales.labelSmall,
    } as any,
    shape: {
      borderRadius: 12,
    },
    shadows: [
      'none',
      elevationShadows.level1,
      elevationShadows.level2,
      elevationShadows.level3,
      elevationShadows.level4,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
      elevationShadows.level5,
    ],
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: 24,
            padding: '10px 24px',
            transition: 'all 200ms ease-in-out',
          },
          contained: {
            boxShadow: elevationShadows.level1,
            '&:hover': {
              boxShadow: elevationShadows.level2,
            },
          },
          outlined: {
            borderColor: darkColorTokens.outline,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: elevationShadows.level1,
            padding: 16,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 28,
            boxShadow: elevationShadows.level3,
          },
        },
      },
    },
  };

  return createTheme(themeOptions);
};

// Export pre-configured themes
export const lightTheme = createLightTheme();
export const darkTheme = createDarkTheme();

/**
 * Create Material Design 3 theme with optional mode
 */
export const createMaterialDesign3Theme = (mode: 'light' | 'dark' = 'light') => {
  return mode === 'light' ? createLightTheme() : createDarkTheme();
};
