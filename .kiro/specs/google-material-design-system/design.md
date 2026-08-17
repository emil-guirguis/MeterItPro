# Design Document: Google Material Design 3 System Implementation

## Overview

This design document specifies the implementation approach for applying Google Material Design 3 (MD3) consistently across the entire system. The implementation focuses on creating a centralized Material Design 3 theme at the framework layer that all components, modules, and datagrids inherit from. This ensures visual consistency, maintainability, and adherence to Material Design 3 specifications across all user interfaces.

The approach leverages MUI v5's theming capabilities to define Material Design 3 color tokens, typography scales, spacing systems, and component styling. All framework components will be updated to use theme tokens, and all client-facing modules will automatically inherit these styles.

## Architecture

### Theme Provider Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Root                          │
│                  (MUI ThemeProvider)                         │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Material Design 3 Theme Configuration         │   │
│  │  - Color Palette (Primary, Secondary, Tertiary, etc) │   │
│  │  - Typography Scales (Display, Headline, Body, etc)  │   │
│  │  - Spacing System (4px-based scale)                  │   │
│  │  - Component Overrides (Button, Card, Input, etc)    │   │
│  │  - Elevation/Shadow System                           │   │
│  │  - Breakpoints (Mobile, Tablet, Desktop)             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Framework Components (Inherit Theme)         │   │
│  │  - framework/frontend/components/*                   │   │
│  │  - All components use theme tokens via sx prop       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │    Client Modules (Inherit Framework Styling)        │   │
│  │  - MeterItPro/frontend/src/components/*                  │   │
│  │  - MeterItPro/frontend/src/dashboards/*                  │   │
│  │  - MeterItProSync/frontend/src/*                               │   │
│  │  - framework/frontend/dashboards/*                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Material Design 3 Color System

Material Design 3 uses a semantic color system with the following key colors:

**Primary Colors**:
- Primary: Main brand color (default: #6750A4)
- On Primary: Text/content on primary background
- Primary Container: Container background using primary
- On Primary Container: Text on primary container

**Secondary Colors**:
- Secondary: Supporting brand color (default: #625B71)
- On Secondary: Text on secondary background
- Secondary Container: Container background using secondary
- On Secondary Container: Text on secondary container

**Tertiary Colors**:
- Tertiary: Accent color (default: #7D5260)
- On Tertiary: Text on tertiary background
- Tertiary Container: Container background using tertiary
- On Tertiary Container: Text on tertiary container

**Semantic Colors**:
- Error: Error state color (default: #B3261E)
- Warning: Warning state color (default: #F57C00)
- Info: Information state color (default: #0288D1)
- Success: Success state color (default: #2E7D32)

**Neutral Colors**:
- Background: Page background
- Surface: Component surface
- Outline: Borders and dividers
- Outline Variant: Secondary borders

### Typography System

Material Design 3 defines typography scales with specific sizes, weights, and line heights:

**Display Scale** (Large, Medium, Small):
- Display Large: 57px, weight 400, line-height 64px
- Display Medium: 45px, weight 400, line-height 52px
- Display Small: 36px, weight 400, line-height 44px

**Headline Scale** (Large, Medium, Small):
- Headline Large: 32px, weight 400, line-height 40px
- Headline Medium: 28px, weight 400, line-height 36px
- Headline Small: 24px, weight 400, line-height 32px

**Title Scale** (Large, Medium, Small):
- Title Large: 22px, weight 500, line-height 28px
- Title Medium: 16px, weight 500, line-height 24px
- Title Small: 14px, weight 500, line-height 20px

**Body Scale** (Large, Medium, Small):
- Body Large: 16px, weight 400, line-height 24px
- Body Medium: 14px, weight 400, line-height 20px
- Body Small: 12px, weight 400, line-height 16px

**Label Scale** (Large, Medium, Small):
- Label Large: 14px, weight 500, line-height 20px
- Label Medium: 12px, weight 500, line-height 16px
- Label Small: 11px, weight 500, line-height 16px

### Spacing System

Material Design 3 uses a 4px-based spacing scale:

```
Spacing Scale: 0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, ...

Common Usage:
- xs: 4px (small gaps, tight spacing)
- sm: 8px (small components, compact spacing)
- md: 12px (form fields, standard spacing)
- lg: 16px (containers, standard padding)
- xl: 24px (sections, large spacing)
- 2xl: 32px (major sections, large gaps)
```

### Elevation System

Material Design 3 defines 5 elevation levels with specific shadow specifications:

```
Elevation 0: No shadow (flat)
Elevation 1: 0px 1px 3px rgba(0,0,0,0.12), 0px 1px 2px rgba(0,0,0,0.24)
Elevation 2: 0px 3px 6px rgba(0,0,0,0.16), 0px 3px 6px rgba(0,0,0,0.23)
Elevation 3: 0px 10px 20px rgba(0,0,0,0.19), 0px 3px 6px rgba(0,0,0,0.23)
Elevation 4: 0px 15px 25px rgba(0,0,0,0.15), 0px 5px 10px rgba(0,0,0,0.05)
Elevation 5: 0px 20px 40px rgba(0,0,0,0.2)
```

### State Layers

Material Design 3 uses state layers for interactive feedback:

```
Hover State Layer: 8% opacity of primary color
Focused State Layer: 12% opacity of primary color
Pressed State Layer: 12% opacity of primary color
Disabled State Layer: 38% opacity of primary color
```

## Components and Interfaces

### Theme Configuration File

**Location**: `framework/frontend/src/theme/materialDesign3Theme.ts`

**Responsibilities**:
- Define Material Design 3 color palette
- Configure typography scales
- Set spacing system
- Define elevation/shadow system
- Configure component overrides
- Export theme for use in ThemeProvider

**Key Exports**:
- `createMaterialDesign3Theme()`: Function to create MD3 theme
- `lightTheme`: Pre-configured light theme
- `darkTheme`: Pre-configured dark theme

### Theme Provider Component

**Location**: `framework/frontend/src/theme/ThemeProvider.tsx`

**Responsibilities**:
- Wrap application with MUI ThemeProvider
- Manage theme switching (light/dark mode)
- Provide theme context to all components
- Handle theme persistence

**Props**:
- `children`: React components to wrap
- `initialTheme`: Initial theme mode ('light' or 'dark')
- `onThemeChange`: Callback when theme changes

### Component Styling Approach

All framework components will be updated to use Material Design 3 styling through:

1. **MUI sx Prop**: For inline styling with theme tokens
   ```typescript
   <Button sx={{ 
     backgroundColor: theme.palette.primary.main,
     padding: theme.spacing(2),
     borderRadius: theme.shape.borderRadius
   }} />
   ```

2. **Styled Components**: For complex component styling
   ```typescript
   const StyledButton = styled(Button)(({ theme }) => ({
     backgroundColor: theme.palette.primary.main,
     '&:hover': {
       backgroundColor: theme.palette.primary.dark,
     }
   }));
   ```

3. **CSS Modules with Theme Variables**: For legacy CSS
   ```css
   .button {
     background-color: var(--md3-primary);
     padding: var(--md3-spacing-lg);
   }
   ```

### DataGrid Styling

**MUI DataGrid Styling**:
- Use `sx` prop to apply Material Design 3 colors
- Override default header styling with MD3 typography
- Apply state layers to row hover/selection
- Use MD3 outline color for borders

**Custom Table Styling** (EditableDataGrid):
- Update CSS classes to use Material Design 3 colors
- Apply MD3 spacing to padding/margins
- Use MD3 elevation for table container
- Apply state layers to interactive elements

## Data Models

### Theme Configuration Structure

```typescript
interface MaterialDesign3Theme {
  palette: {
    primary: ColorTokens;
    secondary: ColorTokens;
    tertiary: ColorTokens;
    error: ColorTokens;
    warning: ColorTokens;
    info: ColorTokens;
    success: ColorTokens;
    background: string;
    surface: string;
    outline: string;
    outlineVariant: string;
  };
  typography: {
    displayLarge: TypographyVariant;
    displayMedium: TypographyVariant;
    displaySmall: TypographyVariant;
    headlineLarge: TypographyVariant;
    headlineMedium: TypographyVariant;
    headlineSmall: TypographyVariant;
    titleLarge: TypographyVariant;
    titleMedium: TypographyVariant;
    titleSmall: TypographyVariant;
    bodyLarge: TypographyVariant;
    bodyMedium: TypographyVariant;
    bodySmall: TypographyVariant;
    labelLarge: TypographyVariant;
    labelMedium: TypographyVariant;
    labelSmall: TypographyVariant;
  };
  spacing: SpacingScale;
  elevation: ElevationSystem;
  breakpoints: BreakpointSystem;
}

interface ColorTokens {
  main: string;
  light: string;
  dark: string;
  container: string;
  onContainer: string;
}

interface TypographyVariant {
  fontSize: string;
  fontWeight: number;
  lineHeight: string;
  letterSpacing: string;
}

interface SpacingScale {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

interface ElevationSystem {
  level0: string;
  level1: string;
  level2: string;
  level3: string;
  level4: string;
  level5: string;
}

interface BreakpointSystem {
  mobile: number;
  tablet: number;
  desktop: number;
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Theme Token Availability

*For any* Material Design 3 theme instance, all required color tokens (primary, secondary, tertiary, error, warning, info, success) should be defined and accessible.

**Validates: Requirements 1.1, 12.1**

### Property 2: Component Theme Token Usage

*For any* framework component, all color values should reference theme tokens rather than hardcoded hex values.

**Validates: Requirements 1.2, 12.2**

### Property 3: Light Mode Contrast Compliance

*For any* text element in light mode, the contrast ratio between text color and background color should meet WCAG 2.1 AA standards (4.5:1 for normal text, 3:1 for large text).

**Validates: Requirements 1.3, 15.1**

### Property 4: Dark Mode Contrast Compliance

*For any* text element in dark mode, the contrast ratio between text color and background color should meet WCAG 2.1 AA standards (4.5:1 for normal text, 3:1 for large text).

**Validates: Requirements 1.4, 15.6**

### Property 5: Typography Scale Consistency

*For any* text element, the font size, weight, and line height should match one of the Material Design 3 typography scales (Display, Headline, Title, Body, Label).

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.6**

### Property 6: Font Family Consistency

*For any* text element, the font family should be Roboto or the configured system font stack from the Material Design 3 theme.

**Validates: Requirements 2.5**

### Property 7: Spacing Scale Compliance

*For any* spacing value (padding, margin, gap) in a component, the value should be from the Material Design 3 spacing scale (4px, 8px, 12px, 16px, 20px, 24px, 28px, 32px, etc.).

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 8: Responsive Breakpoint Alignment

*For any* responsive layout, the breakpoints should align with Material Design 3 specifications (mobile: 0-599px, tablet: 600-839px, desktop: 840px+).

**Validates: Requirements 3.6, 14.1, 14.2, 14.3**

### Property 9: Button Variant Support

*For any* button component, it should support all Material Design 3 button variants (Filled, Filled Tonal, Outlined, Text) with appropriate styling.

**Validates: Requirements 4.1**

### Property 10: Button State Layer Application

*For any* button in hover state, a Material Design 3 state layer (8% opacity) should be applied to the button background.

**Validates: Requirements 4.3, 10.1**

### Property 11: Button Focus Indicator Visibility

*For any* focused button, a Material Design 3 focus indicator should be visible with appropriate contrast and width.

**Validates: Requirements 4.4, 10.2**

### Property 12: Button Disabled State Opacity

*For any* disabled button, the opacity should be reduced to 38% according to Material Design 3 disabled state specifications.

**Validates: Requirements 4.6, 10.4**

### Property 13: Card Elevation Consistency

*For any* card component, the elevation level should be between 1-2 for default state according to Material Design 3 specifications.

**Validates: Requirements 5.1**

### Property 14: Card Padding Compliance

*For any* card component, the internal padding should be 16px according to Material Design 3 spacing guidelines.

**Validates: Requirements 5.3**

### Property 15: Card Border Radius Consistency

*For any* card component, the border radius should be 12px according to Material Design 3 specifications.

**Validates: Requirements 5.4**

### Property 16: Input Field Focus Indicator

*For any* focused input field, a Material Design 3 focus indicator should be visible with primary color.

**Validates: Requirements 6.2**

### Property 17: Input Error State Styling

*For any* input field in error state, the error color should be applied and supporting text should be displayed.

**Validates: Requirements 6.3**

### Property 18: Dialog Elevation Level

*For any* dialog component, the elevation level should be 3 or higher according to Material Design 3 specifications.

**Validates: Requirements 7.1**

### Property 19: Dialog Scrim Opacity

*For any* dialog scrim, the opacity should follow Material Design 3 specifications (typically 32% for light mode, 32% for dark mode).

**Validates: Requirements 7.2**

### Property 20: DataGrid Header Styling

*For any* datagrid header cell, the typography and background color should follow Material Design 3 specifications.

**Validates: Requirements 8.2**

### Property 21: DataGrid Row Hover State

*For any* datagrid row in hover state, a Material Design 3 state layer (8% opacity) should be applied.

**Validates: Requirements 8.3**

### Property 22: DataGrid Border Color

*For any* datagrid border, the color should be the Material Design 3 outline color from the theme.

**Validates: Requirements 8.7**

### Property 23: Elevation Shadow Specification

*For any* component with elevation, the shadow should match Material Design 3 shadow specifications with appropriate blur and spread values.

**Validates: Requirements 9.2**

### Property 24: Component State Transition Timing

*For any* component state transition, the animation timing should be 200ms according to Material Design 3 specifications.

**Validates: Requirements 10.6**

### Property 25: Icon Size Compliance

*For any* icon component, the size should be one of the Material Design 3 icon sizes (18px, 24px, 32px, 48px).

**Validates: Requirements 11.2**

### Property 26: Icon Color Token Usage

*For any* icon in a form field, the color should reference a Material Design 3 color token from the theme.

**Validates: Requirements 11.4**

### Property 27: Theme Token Propagation

*For any* theme update, all components referencing that theme token should be re-rendered with the new value.

**Validates: Requirements 12.3**

### Property 28: Framework Component Inheritance

*For any* component used in client frontend, sync frontend, or dashboards, it should inherit Material Design 3 styling from the framework layer.

**Validates: Requirements 13.2, 13.3, 13.4**

### Property 29: Component Spacing Responsiveness

*For any* component spacing value, it should adjust according to Material Design 3 responsive guidelines when the viewport changes.

**Validates: Requirements 14.4**

### Property 30: Focus Indicator Contrast

*For any* focused interactive element, the focus indicator should have sufficient contrast to meet WCAG 2.1 AA standards.

**Validates: Requirements 15.2**

## Error Handling

### Theme Loading Errors

**Scenario**: Theme configuration file fails to load or contains invalid values.

**Handling**:
- Provide fallback Material Design 3 theme with default values
- Log error to console with descriptive message
- Display warning banner to user if in development mode
- Ensure application remains functional with fallback theme

### Color Token Missing

**Scenario**: Component references a color token that doesn't exist in the theme.

**Handling**:
- Use fallback color from Material Design 3 default palette
- Log warning with component name and missing token
- Provide migration guide for updating component

### Typography Scale Mismatch

**Scenario**: Component uses typography that doesn't match Material Design 3 scales.

**Handling**:
- Map to nearest Material Design 3 typography scale
- Log warning with suggested scale
- Provide linting rule to catch in development

### Contrast Ratio Failure

**Scenario**: Color combination fails WCAG 2.1 AA contrast requirements.

**Handling**:
- Adjust color to meet contrast requirements
- Log warning with current and required contrast ratios
- Provide accessibility audit report

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

1. **Theme Configuration Tests**
   - Verify all required color tokens are defined
   - Verify typography scales match Material Design 3 specifications
   - Verify spacing scale values are correct
   - Verify elevation shadow specifications

2. **Component Styling Tests**
   - Verify button variants render with correct styling
   - Verify card padding and border radius
   - Verify input focus indicator visibility
   - Verify dialog elevation and scrim opacity

3. **Contrast Ratio Tests**
   - Verify text contrast meets WCAG 2.1 AA standards
   - Verify focus indicator contrast
   - Verify disabled state contrast

4. **Responsive Design Tests**
   - Verify breakpoints match Material Design 3 specifications
   - Verify spacing adjusts at breakpoints
   - Verify layout adapts to different screen sizes

### Property-Based Testing

Property-based tests will verify universal properties across all inputs:

1. **Theme Token Properties**
   - For all color tokens, verify they are defined and accessible
   - For all typography scales, verify they match Material Design 3 specifications
   - For all spacing values, verify they are from the spacing scale

2. **Component Styling Properties**
   - For all components, verify they use theme tokens instead of hardcoded colors
   - For all buttons, verify they support all Material Design 3 variants
   - For all cards, verify they use correct elevation and padding

3. **State Layer Properties**
   - For all interactive components, verify state layers are applied correctly
   - For all hover states, verify 8% opacity is applied
   - For all disabled states, verify 38% opacity is applied

4. **Contrast Compliance Properties**
   - For all text elements, verify contrast ratios meet WCAG 2.1 AA standards
   - For all focus indicators, verify they have sufficient contrast
   - For all color combinations, verify they meet accessibility standards

5. **Responsive Design Properties**
   - For all layouts, verify breakpoints align with Material Design 3 specifications
   - For all spacing values, verify they adjust at breakpoints
   - For all components, verify they render correctly at different screen sizes

**Property Test Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with: **Feature: google-material-design-system, Property {number}: {property_text}**
- Tests will use fast-check for property generation
- Tests will verify Material Design 3 compliance across all generated inputs

