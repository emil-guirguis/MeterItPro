import { createTheme } from '@mui/material/styles';

/**
 * Google Material theme for MUI
 * Uses Google's official color palette for a clean, professional look
 *
 * ── Design system changes applied (Apr 2026) ──────────────────
 * • MuiTableHead fontSize: '0.8125rem' → '0.6875rem' (11px) — approved in design system review
 */
export const muiTheme = createTheme({
  palette: {
    primary: {
      main: '#1a73e8',
      light: '#4a90d9',
      dark: '#1557b0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#34a853',
      light: '#5dbf71',
      dark: '#1e7e34',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ea4335',
      light: '#ef6f65',
      dark: '#b31412',
    },
    warning: {
      main: '#fbbc04',
      light: '#fcc934',
      dark: '#e37400',
    },
    info: {
      main: '#1a73e8',
    },
    success: {
      main: '#34a853',
    },
    background: {
      default: '#f1f3f4',
      paper: '#ffffff',
    },
    text: {
      primary: '#202124',
      secondary: '#5f6368',
      disabled: '#9aa0a6',
    },
    divider: '#e0e0e0',
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 500, letterSpacing: '-0.5px' },
    h2: { fontWeight: 500, letterSpacing: '-0.25px' },
    h3: { fontWeight: 500 },
    h4: { fontWeight: 500 },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 },
    subtitle1: { fontWeight: 500, color: '#5f6368' },
    subtitle2: { fontWeight: 500, color: '#5f6368' },
    body1: { fontSize: '0.9375rem' },
    body2: { fontSize: '0.875rem', color: '#5f6368' },
    button: { textTransform: 'none', fontWeight: 500 },
    caption: { color: '#9aa0a6' },
  },
  components: {
    // ── AppBar ────────────────────────────────────────────────
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: '#1a73e8',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
        },
      },
    },
    // ── Card ─────────────────────────────────────────────────
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid #e0e0e0',
          borderRadius: 12,
          transition: 'box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          },
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          paddingBottom: 8,
        },
        title: {
          fontSize: '1rem',
          fontWeight: 500,
          color: '#202124',
        },
        subheader: {
          fontSize: '0.8125rem',
          color: '#5f6368',
        },
      },
    },
    // ── Paper ─────────────────────────────────────────────────
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid #e0e0e0',
          borderRadius: 8,
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
        },
        elevation2: {
          boxShadow: '0 2px 6px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)',
        },
      },
    },
    // ── Button ────────────────────────────────────────────────
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '6px 16px',
          fontWeight: 500,
          letterSpacing: '0.01em',
        },
        containedPrimary: {
          backgroundColor: '#1a73e8',
          '&:hover': { backgroundColor: '#1557b0' },
        },
        outlinedPrimary: {
          borderColor: '#1a73e8',
          color: '#1a73e8',
          '&:hover': {
            backgroundColor: 'rgba(26,115,232,0.06)',
            borderColor: '#1557b0',
          },
        },
        textPrimary: {
          color: '#1a73e8',
          '&:hover': { backgroundColor: 'rgba(26,115,232,0.06)' },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)' },
        },
      },
    },
    // ── Chip ─────────────────────────────────────────────────
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          fontSize: '0.8125rem',
        },
        colorPrimary: {
          backgroundColor: 'rgba(26,115,232,0.12)',
          color: '#1557b0',
        },
        colorSuccess: {
          backgroundColor: 'rgba(52,168,83,0.12)',
          color: '#1e7e34',
        },
        colorError: {
          backgroundColor: 'rgba(234,67,53,0.12)',
          color: '#b31412',
        },
        colorWarning: {
          backgroundColor: 'rgba(251,188,4,0.15)',
          color: '#7c5c00',
        },
      },
    },
    // ── Table ─────────────────────────────────────────────────
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#f8f9fa',
            color: '#5f6368',
            fontWeight: 600,
            fontSize: '0.6875rem',   // ← 11px (was 0.8125rem / 13px) — design system Apr 2026
            letterSpacing: '0.04em',  // ← tightened from 0.02em to match smaller size
            textTransform: 'uppercase',
            borderBottom: '1px solid #e0e0e0',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(26,115,232,0.04)',
          },
          '&:last-child td': {
            borderBottom: 0,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          padding: '10px 16px',
          borderBottom: '1px solid #f0f0f0',
          color: '#202124',
        },
      },
    },
    // ── Drawer / Sidebar ──────────────────────────────────────
    MuiDrawer: {
      styleOverrides: {
        paper: {
          border: 'none',
          boxShadow: '2px 0 8px rgba(0,0,0,0.08)',
        },
      },
    },
    // ── List ─────────────────────────────────────────────────
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '1px 8px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(26,115,232,0.12)',
            color: '#1a73e8',
            '&:hover': { backgroundColor: 'rgba(26,115,232,0.18)' },
          },
          '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
        },
      },
    },
    // ── Alert ─────────────────────────────────────────────────
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize: '0.875rem',
        },
        standardSuccess: {
          backgroundColor: 'rgba(52,168,83,0.1)',
          color: '#1e7e34',
        },
        standardError: {
          backgroundColor: 'rgba(234,67,53,0.1)',
          color: '#b31412',
        },
        standardWarning: {
          backgroundColor: 'rgba(251,188,4,0.12)',
          color: '#7c5c00',
        },
        standardInfo: {
          backgroundColor: 'rgba(26,115,232,0.1)',
          color: '#1557b0',
        },
      },
    },
    // ── Tooltip ───────────────────────────────────────────────
    MuiTooltip: {
      defaultProps: { arrow: true },
      styleOverrides: {
        tooltip: {
          backgroundColor: '#202124',
          fontSize: '0.75rem',
          borderRadius: 6,
          padding: '5px 10px',
        },
        arrow: {
          color: '#202124',
        },
      },
    },
    // ── Dialog ────────────────────────────────────────────────
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: 'none',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.125rem',
          fontWeight: 500,
          color: '#202124',
          paddingBottom: 8,
        },
      },
    },
    // ── Input / Form ─────────────────────────────────────────
    MuiTextField: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: {
          margin: '0 !important',
          '& .MuiOutlinedInput-root': {
            minHeight: '48px',
            borderRadius: 8,
            backgroundColor: '#ffffff !important',
            '& input': {
              backgroundColor: '#ffffff !important',
              color: '#202124 !important',
              WebkitTextFillColor: '#202124 !important',
            },
            '& input::placeholder': {
              color: '#9aa0a6 !important',
              opacity: 1,
            },
            '& fieldset': { borderColor: '#e0e0e0' },
            '&:hover fieldset': { borderColor: '#1a73e8' },
            '&.Mui-focused fieldset': { borderColor: '#1a73e8' },
          },
          '& .MuiInputLabel-root': {
            color: '#5f6368',
            '&.Mui-focused': { color: '#1a73e8' },
          },
          '& input[type="date"]::-webkit-calendar-picker-indicator': {
            cursor: 'pointer',
            filter: 'invert(0.6)',
          },
          '& input[type="time"]::-webkit-calendar-picker-indicator': {
            cursor: 'pointer',
            filter: 'invert(0.6)',
          },
        },
      },
    },
    MuiFormControl: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: { margin: '0 !important' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#ffffff !important',
          '& input': {
            backgroundColor: '#ffffff !important',
            color: '#202124 !important',
            WebkitTextFillColor: '#202124 !important',
          },
          '& input::placeholder': {
            color: '#9aa0a6 !important',
            opacity: 1,
          },
          '& input:-webkit-autofill': {
            WebkitBoxShadow: '0 0 0 1000px #ffffff inset !important',
            WebkitTextFillColor: '#202124 !important',
          },
          '& input:-webkit-autofill:focus': {
            WebkitBoxShadow: '0 0 0 1000px #ffffff inset !important',
            WebkitTextFillColor: '#202124 !important',
          },
        },
      },
    },
    // ── Select ────────────────────────────────────────────────
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    // ── Tabs ─────────────────────────────────────────────────
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          minHeight: 48,
          color: '#5f6368',
          '&.Mui-selected': { color: '#1a73e8' },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#1a73e8',
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    // ── Badge ─────────────────────────────────────────────────
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontSize: '0.6875rem',
          fontWeight: 600,
          minWidth: 18,
          height: 18,
          padding: '0 4px',
        },
      },
    },
    // ── Divider ───────────────────────────────────────────────
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: '#e0e0e0' },
      },
    },
  },
});
