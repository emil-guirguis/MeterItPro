# Framework Layout - Quick Start Guide

## Installation

The layout components are already part of the framework. No installation needed!

## Basic Usage

### Option 1: Use the Client Wrapper (Easiest)

```typescript
import AppLayoutWrapper from './components/layout/AppLayoutWrapper';

function MyPage() {
  return (
    <AppLayoutWrapper title="My Page">
      <h1>Page Content</h1>
    </AppLayoutWrapper>
  );
}
```

### Option 2: Direct Framework Import

```typescript
import { AppLayout, AppLayoutConfig } from '@framework/layout';

function MyPage() {
  const config: AppLayoutConfig = {
    // ... your configuration
  };

  return (
    <AppLayout config={config}>
      <h1>Page Content</h1>
    </AppLayout>
  );
}
```

## Configuration

### Menu Items

```typescript
const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    path: '/dashboard'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings',
    path: '/settings',
    requiredPermission: Permission.SETTINGS_READ,
    children: [
      {
        id: 'profile',
        label: 'Profile',
        icon: 'user',
        path: '/settings/profile'
      }
    ]
  }
];
```

### Branding

```typescript
sidebarBrand: {
  icon: '🏢',
  text: 'My App'
}
```

### User Info

```typescript
user: {
  name: 'John Doe',
  email: 'john@example.com',
  avatar: '/path/to/avatar.jpg' // optional
}
```

## Customization

### CSS Variables

```css
:root {
  --sidebar-width: 280px;
  --color-primary: #007bff;
  --color-surface: #ffffff;
}
```

### Custom Styles

```css
.sidebar {
  background-color: #1a1a1a;
}

.app-header {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}
```

## Props

### AppLayout Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `config` | `AppLayoutConfig` | Yes | Layout configuration object |
| `children` | `ReactNode` | Yes | Page content |
| `title` | `string` | No | Page title (overrides auto-generated) |
| `breadcrumbs` | `BreadcrumbItem[]` | No | Breadcrumbs (overrides auto-generated) |
| `loading` | `boolean` | No | Show loading spinner |

### AppLayoutConfig

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `menuItems` | `MenuItem[]` | Yes | Navigation menu items |
| `sidebarBrand` | `{ icon, text }` | Yes | Sidebar branding |
| `user` | `{ name, email, avatar? }` | No | Current user |
| `notifications` | `Notification[]` | No | Notifications array |
| `onLogout` | `() => void` | Yes | Logout handler |
| `checkPermission` | `(perm?) => boolean` | Yes | Permission checker |
| `responsive` | `ResponsiveState` | Yes | Responsive state |
| `uiState` | `UIState` | Yes | UI state management |

## Common Patterns

### Protected Menu Items

```typescript
{
  id: 'admin',
  label: 'Admin',
  icon: 'admin',
  path: '/admin',
  requiredPermission: Permission.ADMIN_ACCESS
}
```

### Menu with Badge

```typescript
{
  id: 'messages',
  label: 'Messages',
  icon: 'message',
  path: '/messages',
  badge: 5 // or '5' or 'New'
}
```

### Nested Menu

```typescript
{
  id: 'settings',
  label: 'Settings',
  icon: 'settings',
  path: '/settings',
  children: [
    { id: 'profile', label: 'Profile', icon: 'user', path: '/settings/profile' },
    { id: 'security', label: 'Security', icon: 'lock', path: '/settings/security' }
  ]
}
```

## Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1023px
- **Desktop**: ≥ 1024px

## Keyboard Shortcuts

- `Esc` - Close dropdowns/modals
- `Tab` - Navigate between elements
- `Enter` / `Space` - Activate buttons/links
- Arrow keys - Navigate menu items

## Troubleshooting

### Layout not rendering?
- Check that `config` prop is provided
- Verify all required config properties are set
- Check browser console for errors

### Sidebar not collapsing?
- Verify `uiState.setSidebarCollapsed` is working
- Check responsive breakpoint detection
- Inspect UI state in React DevTools

### Menu items not showing?
- Check `checkPermission` function
- Verify menu item `requiredPermission` values
- Check that `menuItems` array is not empty

### Styles not applying?
- Verify CSS files are imported
- Check CSS variable values
- Inspect element to see applied styles
- Check for CSS specificity conflicts

## Examples

See `client/frontend/src/components/layout/AppLayoutWrapper.tsx` for a complete implementation example.

## Documentation

- Full README: `framework/frontend/layout/README.md`
- Migration Guide: `LAYOUT_MIGRATION_GUIDE.md`
- Type Definitions: `framework/frontend/layout/types/index.ts`

## Support

For issues or questions, check the documentation or review the example implementation.
