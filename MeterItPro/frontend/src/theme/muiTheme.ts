import { createTheme } from '@mui/material/styles';

/**
 * Modern SaaS theme for MUI
 * Indigo/violet accent, Inter typeface, soft layered shadows, generous radii.
 *
 * ── Design system changes applied ──────────────────────────────
 * • Apr 2026: MuiTableHead fontSize 11px — approved in design system review
 * • Jul 2026: Modern SaaS refresh — indigo palette, Inter, shadow-based
 *   elevation (replaces border-based cards), pill-ish buttons
 */

// Soft layered elevation (kept in sync with --shadow-* vars in index.css)
const shadowSm = '0 1px 2px rgba(16,24,40,0.05)';
const shadowMd = '0 1px 3px rgba(16,24,40,0.08), 0 4px 12px rgba(16,24,40,0.05)';
const shadowLg = '0 4px 12px rgba(16,24,40,0.08), 0 12px 32px rgba(16,24,40,0.08)';

export const muiTheme = createTheme({
  palette: {
    primary: {
      main: '#4f46e5',
      light: '#818cf8',
      dark: '#4338ca',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#7c3aed',
      light: '#a78bfa',
      dark: '#6d28d9',
      contrastText: '#ffffff',
    },
    error: {
      main: '#dc2626',
      light: '#f87171',
      dark: '#b91c1c',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    info: {
      main: '#0ea5e9',
    },
    success: {
      main: '#16a34a',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: '#111827',
      secondary: '#6b7280',
      disabled: '#9ca3af',
    },
    divider: '#e5e7eb',
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 600, letterSpacing: '-0.01em' },
    h4: { fontWeight: 600, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500, color: '#6b7280' },
    subtitle2: { fontWeight: 500, color: '#6b7280' },
    body1: { fontSize: '0.9375rem' },
    body2: { fontSize: '0.875rem', color: '#6b7280' },
    button: { textTransform: 'none', fontWeight: 600 },
    caption: { color: '#9ca3af' },
  },
  components: {
    // ── AppBar ────────────────────────────────────────────────
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          background: 'linear-gradient(120deg, #4f46e5 0%, #6d5ae8 55%, #7c3aed 100%)',
          borderBottom: 'none',
        },
      },
    },
    // ── Card ─────────────────────────────────────────────────
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid #f3f4f6',
          borderRadius: 16,
          boxShadow: shadowSm,
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          '&:hover': {
            boxShadow: shadowMd,
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
          fontWeight: 600,
          color: '#111827',
        },
        subheader: {
          fontSize: '0.8125rem',
          color: '#6b7280',
        },
      },
    },
    // ── Paper ─────────────────────────────────────────────────
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid #f3f4f6',
          borderRadius: 12,
        },
        elevation1: {
          border: 'none',
          boxShadow: shadowSm,
        },
        elevation2: {
          border: 'none',
          boxShadow: shadowMd,
        },
      },
    },
    // ── Button ────────────────────────────────────────────────
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '7px 18px',
          fontWeight: 600,
          letterSpacing: '0.01em',
        },
        containedPrimary: {
          backgroundColor: '#4f46e5',
          boxShadow: '0 1px 2px rgba(79,70,229,0.25)',
          '&:hover': {
            backgroundColor: '#4338ca',
            boxShadow: '0 2px 8px rgba(79,70,229,0.35)',
          },
        },
        outlinedPrimary: {
          borderColor: '#d1d5db',
          color: '#4f46e5',
          '&:hover': {
            backgroundColor: 'rgba(79,70,229,0.05)',
            borderColor: '#4f46e5',
          },
        },
        textPrimary: {
          color: '#4f46e5',
          '&:hover': { backgroundColor: 'rgba(79,70,229,0.05)' },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          '&:hover': { backgroundColor: 'rgba(17,24,39,0.05)' },
        },
      },
    },
    // ── Chip ─────────────────────────────────────────────────
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 500,
          fontSize: '0.8125rem',
        },
        colorPrimary: {
          backgroundColor: 'rgba(79,70,229,0.1)',
          color: '#4338ca',
        },
        colorSuccess: {
          backgroundColor: 'rgba(22,163,74,0.1)',
          color: '#15803d',
        },
        colorError: {
          backgroundColor: 'rgba(220,38,38,0.1)',
          color: '#b91c1c',
        },
        colorWarning: {
          backgroundColor: 'rgba(245,158,11,0.14)',
          color: '#92400e',
        },
      },
    },
    // ── Table ─────────────────────────────────────────────────
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#f9fafb',
            color: '#6b7280',
            fontWeight: 600,
            fontSize: '0.6875rem',   // 11px — design system Apr 2026
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            borderBottom: '1px solid #e5e7eb',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(79,70,229,0.03)',
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
          borderBottom: '1px solid #f3f4f6',
          color: '#111827',
        },
      },
    },
    // ── Drawer / Sidebar ──────────────────────────────────────
    MuiDrawer: {
      styleOverrides: {
        paper: {
          border: 'none',
          boxShadow: shadowMd,
        },
      },
    },
    // ── List ─────────────────────────────────────────────────
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '1px 8px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(79,70,229,0.08)',
            color: '#4f46e5',
            '&:hover': { backgroundColor: 'rgba(79,70,229,0.14)' },
          },
          '&:hover': { backgroundColor: 'rgba(17,24,39,0.04)' },
        },
      },
    },
    // ── Alert ─────────────────────────────────────────────────
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontSize: '0.875rem',
        },
        standardSuccess: {
          backgroundColor: 'rgba(22,163,74,0.08)',
          color: '#15803d',
        },
        standardError: {
          backgroundColor: 'rgba(220,38,38,0.08)',
          color: '#b91c1c',
        },
        standardWarning: {
          backgroundColor: 'rgba(245,158,11,0.1)',
          color: '#92400e',
        },
        standardInfo: {
          backgroundColor: 'rgba(14,165,233,0.08)',
          color: '#0369a1',
        },
      },
    },
    // ── Tooltip ───────────────────────────────────────────────
    MuiTooltip: {
      defaultProps: { arrow: true },
      styleOverrides: {
        tooltip: {
          backgroundColor: '#111827',
          fontSize: '0.75rem',
          borderRadius: 8,
          padding: '5px 10px',
        },
        arrow: {
          color: '#111827',
        },
      },
    },
    // ── Dialog ────────────────────────────────────────────────
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          border: 'none',
          boxShadow: shadowLg,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.125rem',
          fontWeight: 600,
          color: '#111827',
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
            borderRadius: 10,
            backgroundColor: '#ffffff !important',
            transition: 'box-shadow 0.15s ease',
            '& input': {
              backgroundColor: '#ffffff !important',
              color: '#111827 !important',
              WebkitTextFillColor: '#111827 !important',
            },
            '& input::placeholder': {
              color: '#9ca3af !important',
              opacity: 1,
            },
            '& fieldset': { borderColor: '#e5e7eb' },
            '&:hover fieldset': { borderColor: '#a5b4fc' },
            '&.Mui-focused': {
              boxShadow: '0 0 0 3px rgba(79,70,229,0.12)',
            },
            '&.Mui-focused fieldset': { borderColor: '#4f46e5' },
          },
          '& .MuiInputLabel-root': {
            color: '#6b7280',
            '&.Mui-focused': { color: '#4f46e5' },
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
          borderRadius: 10,
          backgroundColor: '#ffffff !important',
          '& input': {
            backgroundColor: '#ffffff !important',
            color: '#111827 !important',
            WebkitTextFillColor: '#111827 !important',
          },
          '& input::placeholder': {
            color: '#9ca3af !important',
            opacity: 1,
          },
          '& input:-webkit-autofill': {
            WebkitBoxShadow: '0 0 0 1000px #ffffff inset !important',
            WebkitTextFillColor: '#111827 !important',
          },
          '& input:-webkit-autofill:focus': {
            WebkitBoxShadow: '0 0 0 1000px #ffffff inset !important',
            WebkitTextFillColor: '#111827 !important',
          },
        },
      },
    },
    // ── Select ────────────────────────────────────────────────
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 10,
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
          color: '#6b7280',
          '&.Mui-selected': { color: '#4f46e5', fontWeight: 600 },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#4f46e5',
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
        root: { borderColor: '#e5e7eb' },
      },
    },
  },
});
