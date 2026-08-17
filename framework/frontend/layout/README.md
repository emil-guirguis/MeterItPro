# Framework Layout Components

This module provides a complete, responsive layout system for client applications including:

- **AppLayout**: Main layout wrapper with header, sidebar, and content area
- **Header**: Top navigation bar with user menu and notifications
- **Sidebar**: Collapsible side navigation with nested menu support
- **MobileNav**: Mobile-friendly navigation drawer
- **Breadcrumb**: Breadcrumb navigation component
- **HamburgerIcon**: Animated hamburger menu icon

## Features

- ✅ Fully responsive (mobile, tablet, desktop)
- ✅ Collapsible sidebar with persistent state
- ✅ Permission-based menu filtering
- ✅ Nested menu items support
- ✅ User menu with dropdown
- ✅ Notifications dropdown
- ✅ Breadcrumb navigation
- ✅ Accessibility compliant (ARIA labels, keyboard navigation)
- ✅ Smooth animations and transitions
- ✅ Dark mode support (via CSS variables)

## Usage

### Basic Setup

```typescript
import { AppLayout, AppLayoutConfig } from '@framework/layout';
import { useAuth } from './hooks/useAuth';
import { useResponsive } from './hooks/useResponsive';
import { useUI } from './store/slices/uiSlice';
import { usePageTitle } from './hooks/usePageTitle';
import { generateBreadcrumbs, getPageTitle } from './utils/navigationUtils';
import { Permission } from './types/auth';

// Define your menu items
const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'dashboard',
    path: '/dashboard'
  },
  {
    id: 'users',
    label: 'Users',
    icon: 'users',
    path: '/users',
    requiredPermission: Permission.USER_READ
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings',
    path: '/settings',
    children: [
      {
        id: 'profile',
        label: 'Profile',
        icon: 'user',
        path: '/settings/profile'
      },
      {
        id: 'preferences',
        label: 'Preferences',
        icon: 'settings',
        path: '/settings/preferences'
      }
    ]
  }
];

function App() {
  const { user, logout, checkPermission } = useAuth();
  const responsive = useResponsive();
  const uiState = useUI();

  const config: AppLayoutConfig = {
    menuItems,
    sidebarBrand: {
      icon: '🏢',
      text: 'My App'
    },
    user,
    notifications: [],
    onLogout: logout,
    checkPermission,
    responsive,
    uiState,
    usePageTitle,
    generateBreadcrumbs,
    getPageTitle
  };

  return (
    <AppLayout config={config}>
      {/* Your page content here */}
      <YourPageComponent />
    </AppLayout>
  );
}
```

### Configuration Options

#### AppLayoutConfig

| Property | Type | Description |
|----------|------|-------------|
| `menuItems` | `MenuItem[]` | Array of navigation menu items |
| `sidebarBrand` | `{ icon: string, text: string }` | Branding for sidebar header |
| `user` | `{ name: string, email: string, avatar?: string }` | Current user information |
| `notifications` | `Notification[]` | Array of notifications |
| `onLogout` | `() => void` | Logout handler function |
| `checkPermission` | `(permission?: string) => boolean` | Permission checker function |
| `responsive` | `ResponsiveState` | Responsive breakpoint state |
| `uiState` | `UIState` | UI state management (sidebar collapse, mobile nav) |
| `usePageTitle` | `(title: string) => void` | Optional page title hook |
| `generateBreadcrumbs` | `(pathname: string) => BreadcrumbItem[]` | Optional breadcrumb generator |
| `getPageTitle` | `(pathname: string) => string` | Optional page title generator |

#### MenuItem

```typescript
interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  requiredPermission?: string;
  children?: MenuItem[];
  badge?: string | number;
}
```

### Required Client-Side Implementations

Client applications must provide:

1. **useResponsive Hook**: Returns responsive breakpoint state
   ```typescript
   interface ResponsiveState {
     isMobile: boolean;
     isTablet: boolean;
     isDesktop: boolean;
     showSidebarInHeader: boolean;
   }
   ```

2. **UI State Management**: Manages sidebar and mobile nav state
   ```typescript
   interface UIState {
     sidebarCollapsed: boolean;
     setSidebarCollapsed: (collapsed: boolean) => void;
     mobileNavOpen: boolean;
     setMobileNavOpen: (open: boolean) => void;
   }
   ```

3. **Auth Context**: Provides user info and permission checking
   ```typescript
   interface AuthContext {
     user?: { name: string; email: string; avatar?: string };
     logout: () => void;
     checkPermission: (permission?: string) => boolean;
   }
   ```

### Customization

#### CSS Variables

The layout components use CSS variables for theming. Override these in your client app:

```css
:root {
  --sidebar-width: 280px;
  --sidebar-collapsed-width: 64px;
  --color-primary: #007bff;
  --color-surface: #ffffff;
  --color-background: #f5f5f5;
  --color-border: #e0e0e0;
  --color-text-primary: #333;
  --color-text-secondary: #666;
}
```

#### Custom Styling

You can override component styles by targeting their CSS classes:

```css
/* Custom sidebar styling */
.sidebar {
  background-color: #1a1a1a;
}

.sidebar-link {
  border-radius: 12px;
}

/* Custom header styling */
.app-header {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}
```

## Component Architecture

```
AppLayout (Main Container)
├── Header
│   ├── Menu Toggle Button (HamburgerIcon)
│   ├── Brand/Logo
│   ├── Notifications Dropdown
│   └── User Menu Dropdown
├── Sidebar (Desktop only)
│   ├── Brand Header
│   ├── Navigation Menu
│   │   ├── Menu Items
│   │   └── Nested Submenus
│   └── Footer (Version info)
├── MobileNav (Mobile/Tablet only)
│   ├── Navigation Menu
│   ├── Quick Actions
│   └── Footer
└── Content Area
    ├── Breadcrumb Navigation
    └── Page Content
```

## Responsive Behavior

- **Desktop (≥1024px)**: Fixed sidebar, collapsible
- **Tablet (768px - 1023px)**: Mobile nav drawer
- **Mobile (<768px)**: Mobile nav drawer, optimized touch targets

## Accessibility

All components follow WCAG 2.1 AA standards:

- Proper ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader friendly
- High contrast mode support
- Reduced motion support

## Migration from Client-Specific Layout

If you have an existing layout in your client app:

1. Install framework layout dependencies
2. Create configuration object with your menu items and hooks
3. Replace your layout component with `AppLayout`
4. Remove old layout components from client app
5. Update imports throughout your app

Example migration:

```typescript
// Before
import AppLayout from './components/layout/AppLayout';

// After
import { AppLayout } from '@framework/layout';
```

## Examples

See the `client/frontend` application for a complete implementation example.
