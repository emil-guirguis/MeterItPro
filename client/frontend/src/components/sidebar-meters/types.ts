/**
 * Types for Sidebar Meters Section
 * Defines interfaces for Meter, MeterElement, Favorite, and MeterReading
 */

import React from 'react';

export interface Meter {
  meter_id: string;
  meter_element_id: string;
  tenantId: string;
  name: string;
  description?: string;
  createdDate: Date;
  updatedDate: Date;
}

export interface MeterElement {
  meter_element_id: string;
  meter_id: string;
  element: string;  // The element letter (A, B, C, etc.)
  name: string;
  description?: string;
  createdDate: Date;
  updatedDate: Date;
  is_favorited?: boolean;  // Whether this element is favorited by the current user
  favorite_name?: string;  // Formatted favorite name from API
}

export interface Favorite {
  favorite_id: number;
  tenant_id: number;
  users_id: number;
  table_name: string;
  id1: number;  // meter_id
  id2: number;  // meter_element_id
  created_at: string;
  favorite_name?: string;
  order_by?: number;
}

export interface MeterReading {
  id: string;
  meterId: string;
  meterElementId?: string;
  value: number;
  unit: string;
  createdDate: Date;
  [key: string]: any; // Additional fields from existing schema
}

export interface SidebarMetersProps {
  tenantId: string;
  userId: string;
  onMeterSelect: (meterId: string, meterName?: string) => void;
  onMeterElementSelect: (meterId: string, elementId: string, elementName?: string, elementNumber?: number, gridType?: 'simple' | 'baselist') => void;
  /** Which section to display. Defaults to 'all'. */
  mode?: 'favorites' | 'meters' | 'all';
}

export interface MeterItemProps {
  meter: Meter;
  isFavorite: boolean;
  isExpanded: boolean;
  isSelected: boolean;
  onExpand: () => void;
  onSelect: () => void;
  onFavoriteToggle: () => void;
}

export interface MeterElementItemProps {
  element: MeterElement;
  meterId: string;
  isFavorite: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onFavoriteToggle: () => void;
  id1?: string;  // meter_id
  id2?: string;  // meter_element_id
  is_favorited?: boolean;
  on_star_click?: (e: React.MouseEvent<HTMLButtonElement>) => Promise<void>;
}

export interface StarIconProps {
  id1: string;  // meter_id
  id2: string;  // meter_element_id

  is_favorited: boolean;
  is_loading: boolean;
  on_click: (e: React.MouseEvent<HTMLButtonElement>) => Promise<void>;
}

export interface FavoriteDisplay {
  favorite_id: number;  // favorite record ID
  id1: number;  // meter_id
  id2: number;  // meter_element_id
  favorite_name: string;
  order_by?: number;
}

export interface FavoritesSectionProps {
  favorites: FavoriteDisplay[];
  meters: Meter[];
  meterElements: { [meterId: string]: MeterElement[] };
  selectedItem?: SelectedItem | null;
  onItemClick: (meterId: string, elementId: string, favoriteName?: string, gridType?: 'simple' | 'baselist') => void;
  onStarClick: (favoriteId: number, meterId: string, elementId: string) => Promise<void>;
  onReorder?: (reorderedFavorites: FavoriteDisplay[]) => void;
}

export interface MetersListProps {
  meters: Meter[];
  favorites: Favorite[];
  meterElements: { [meterId: string]: any[] };
  expandedMeters: Set<string>;
  selectedItem: SelectedItem | null;
  onMeterExpand: (meterId: string) => void;
  onMeterSelect: (meterId: string, meterName?: string) => void;
  onMeterElementSelect: (meterId: string, elementId: string, elementName?: string, elementNumber?: number) => void;
  onFavoriteToggle: (meterId: string, elementId?: string) => void;
}

export interface SelectedItem {
  type: 'meter' | 'element';
  meterId: string;
  elementId?: string;
}
