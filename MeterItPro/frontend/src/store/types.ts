// Store Types and Interfaces

import type { User } from '../types/auth';
// import type { 
//   Location, 
//   Contact, 
//   Meter, 
//   EmailTemplate, 
//   CompanySettings 
// } from '../types/entities';

// Base Entity State
export interface EntityState<T> {
  items: T[];
  selectedItem: T | null;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
  hasMore: boolean;
  total: number;
}

// Pagination and Filtering
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface FilterState {
  search: string;
  filters: Record<string, any>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface ListState extends PaginationState, FilterState {
  loading: boolean;
  error: string | null;
}

// Auth Store State
export interface AuthStoreState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

// UI Store State
export interface UIStoreState {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  notifications: Notification[];
  modals: Record<string, ModalState>;
  loading: Record<string, boolean>;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  // Responsive header state
  headerLayout: HeaderLayout;
  showSidebarInHeader: boolean;
  isTransitioning: boolean;
  lastBreakpoint: 'mobile' | 'tablet' | 'desktop';
  sidebarHeaderConfig: SidebarHeaderConfig;
}

// Import header layout types
export interface HeaderLayout {
  left: {
    visible: boolean;
    elements: ('menu-toggle' | 'brand' | 'breadcrumbs')[];
  };
  center: {
    visible: boolean;
    content: 'title' | 'search' | 'breadcrumbs' | null;
  };
  right: {
    visible: boolean;
    elements: ('notifications' | 'user-menu' | 'settings')[];
  };
}

export interface SidebarHeaderConfig {
  brand: {
    icon: string;
    text: string;
    showIcon: boolean;
    showText: boolean;
  };
  toggle: {
    position: 'left' | 'right';
    style: 'hamburger' | 'arrow' | 'custom';
    ariaLabel: string;
  };
  responsive: {
    hideOnDesktop: boolean;
    showInHeaderBelow: number;
    animationDuration: number;
  };
}

export interface ModalState {
  isOpen: boolean;
  data?: any;
  loading?: boolean;
  error?: string | null;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  closable?: boolean;
  createdAt: Date;
  read?: boolean;
}

// Entity Store States
export interface UsersStoreState extends EntityState<User> {
  list: ListState;
}

export interface LocationsStoreState extends EntityState<Location> {
  list: ListState;
}


// export interface ContactsStoreState extends EntityState<Contact> {
//   list: ListState;
// }

// export interface MetersStoreState extends EntityState<Meter> {
//   list: ListState;
// }

// export interface TemplatesStoreState extends EntityState<EmailTemplate> {
//   list: ListState;
// }

// export interface SettingsStoreState {
//   company: CompanySettings | null;
//   loading: boolean;
//   error: string | null;
//   lastFetch: number | null;
// }

// Root Store State
export interface RootStoreState {
  auth: AuthStoreState;
  ui: UIStoreState;
  // users: UsersStoreState;
  // locations: LocationsStoreState;
  // contacts: ContactsStoreState;
  // meters: MetersStoreState;
  // templates: TemplatesStoreState;
  // settings: SettingsStoreState;
}

// Action Types
export interface BaseActions {
  reset: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export interface EntityActions<T> extends BaseActions {
  setItems: (items: T[]) => void;
  addItem: (item: T) => void;
  updateItem: (id: string, updates: Partial<T>) => void;
  removeItem: (id: string) => void;
  setSelectedItem: (item: T | null) => void;
  setTotal: (total: number) => void;
  setHasMore: (hasMore: boolean) => void;
  setLastFetch: (timestamp: number) => void;
}

export interface ListActions extends BaseActions {
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSearch: (search: string) => void;
  setFilters: (filters: Record<string, any>) => void;
  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  resetFilters: () => void;
}

// Store Slices
export interface AuthStoreSlice extends AuthStoreState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<any>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null, refreshToken?: string | null, expiresAt?: number | null) => void;
  clearError: () => void;
}

export interface UIStoreSlice extends UIStoreState {
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  removeNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  openModal: (modalId: string, data?: any) => void;
  closeModal: (modalId: string) => void;
  setModalLoading: (modalId: string, loading: boolean) => void;
  setModalError: (modalId: string, error: string | null) => void;
  setGlobalLoading: (key: string, loading: boolean) => void;
  setScreenSize: (isMobile: boolean, isTablet: boolean, isDesktop: boolean) => void;
  // Responsive header actions
  setHeaderLayout: (layout: HeaderLayout) => void;
  setShowSidebarInHeader: (show: boolean) => void;
  setTransitioning: (transitioning: boolean) => void;
  updateBreakpoint: (breakpoint: 'mobile' | 'tablet' | 'desktop') => void;
  setSidebarHeaderConfig: (config: Partial<SidebarHeaderConfig>) => void;
}

// Generic Entity Store Slice
export interface EntityStoreSlice<T> extends EntityState<T>, EntityActions<T> {
  list: ListState;
  fetchItems: (params?: any) => Promise<void>;
  fetchItem: (id: string) => Promise<any>;
  createItem: (data: Partial<T>) => Promise<any>;
  updateItemById: (id: string, data: Partial<T>) => Promise<any>;
  deleteItem: (id: string) => Promise<void>;
  // List actions
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSearch: (search: string) => void;
  setFilters: (filters: Record<string, any>) => void;
  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  resetFilters: () => void;
  setListLoading: (loading: boolean) => void;
  setListError: (error: string | null) => void;
  resetList: () => void;
  // Optimistic update methods
  addItemToList: (item: T) => void;
  updateItemInList: (item: T) => void;
}

// Cache Configuration
export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxAge: number; // Maximum age before forced refresh
  staleWhileRevalidate: boolean; // Return stale data while fetching fresh
}

// Persistence Configuration
export interface PersistConfig {
  name: string;
  storage: 'localStorage' | 'sessionStorage' | 'indexedDB';
  whitelist?: string[]; // Keys to persist
  blacklist?: string[]; // Keys to exclude from persistence
  version: number;
  migrate?: (persistedState: any, version: number) => any;
}