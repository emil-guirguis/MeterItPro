# Client Layout Components

This directory contains **client-specific** layout code only. All reusable layout components are in the framework.

## Structure

### Framework Components (Inherited)
All core layout components are imported from `@framework/layout`:
- `AppLayout` - Main layout container
- `Header` - Top navigation bar
- `Sidebar` - Side navigation menu
- `MobileNav` - Mobile navigation drawer
- `Breadcrumb` - Breadcrumb navigation
- `HamburgerIcon` - Animated menu icon

### Client-Specific Files

#### Production Files
- **`AppLayoutWrapper.tsx`** - Client configuration wrapper for framework AppLayout
  - Configures menu items
  - Sets up branding
  - Provides auth context
  - Connects client hooks

- **`index.ts`** - Re-exports framework components and client wrapper

#### Development/Debug Files
- **`DebugMobileNav.tsx`** - Debug tool for mobile navigation
- **`DebugPanel.tsx`** - Debug panel component
- **`TestMobileNav.tsx`** - Test component for mobile nav
- **`TestPage.tsx`** - Test page component
- **`PerformanceOptimizations.css`** - Client-specific performance styles
- **`__tests__/`** - Client-specific layout tests

## Usage

### In Your Pages/Components

```typescript
// Use the client wrapper (recommended)
import AppLayoutWrapper from './components/layout/AppLayoutWrapper';

function MyPage() {
  return (
    <AppLayoutWrapper title="My Page">
      <YourContent />
    </AppLayoutWrapper>
  );
}
```

### Or Import Framework Components Directly

```typescript
// Import framework components directly
import { AppLayout, Header, Sidebar } from '@framework/layout';
```

## Customization

To customize the layout for this client:

1. **Edit `AppLayoutWrapper.tsx`** to change:
   - Menu items
   - Branding (icon, text)
   - Permissions
   - User information

2. **DO NOT** duplicate framework components here
   - All layout components live in `framework/frontend/layout/`
   - Only client-specific wrappers and configurations belong here

## File Organization Rules

✅ **KEEP in this directory:**
- Client-specific wrappers (AppLayoutWrapper)
- Client-specific debug/test tools
- Client-specific styles
- Client-specific tests

❌ **DO NOT add to this directory:**
- Duplicate copies of framework components
- Generic layout components
- Reusable navigation components
- Anything that could be shared across clients

## Framework Location

Framework layout components are located at:
```
framework/frontend/layout/
├── components/
│   ├── AppLayout.tsx
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── MobileNav.tsx
│   ├── Breadcrumb.tsx
│   └── HamburgerIcon.tsx
├── types/
│   └── index.ts
└── README.md
```

## Documentation

- Framework Layout README: `framework/frontend/layout/README.md`
- Quick Start Guide: `framework/frontend/layout/QUICK_START.md`
- Migration Guide: `LAYOUT_MIGRATION_GUIDE.md`
