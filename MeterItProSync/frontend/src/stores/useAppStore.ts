import { create } from 'zustand';
import { Meter, MeterReading, SyncStatus, MeterStatus, TenantInfo } from '../types';

interface AppState {
  meters: Meter[];
  readings: MeterReading[];
  syncStatus: SyncStatus | null;
  meterStatuses: MeterStatus[];
  tenantInfo: TenantInfo | null;
  isLoading: boolean;
  error: string | null;
  // Favorite elements: keys are "meterId-dataPoint"
  favoriteElements: string[];

  setMeters: (meters: Meter[]) => void;
  setReadings: (readings: MeterReading[]) => void;
  setSyncStatus: (status: SyncStatus) => void;
  setMeterStatuses: (statuses: MeterStatus[]) => void;
  setTenantInfo: (info: TenantInfo | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleMeterFavorites: (meterId: number | string, dataPoints: string[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  meters: [],
  readings: [],
  syncStatus: null,
  meterStatuses: [],
  tenantInfo: null,
  isLoading: false,
  error: null,
  favoriteElements: JSON.parse(localStorage.getItem('favoriteElements') || '[]'),

  setMeters: (meters) => set({ meters }),
  setReadings: (readings) => set({ readings }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setMeterStatuses: (meterStatuses) => set({ meterStatuses }),
  setTenantInfo: (tenantInfo) => set({ tenantInfo }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  toggleMeterFavorites: (meterId, dataPoints) =>
    set((state) => {
      const keys = dataPoints.map((dp) => `${meterId}-${dp}`);
      const allFavorited = keys.every((k) => state.favoriteElements.includes(k));
      const newFavorites = allFavorited
        ? state.favoriteElements.filter((k) => !keys.includes(k))
        : [...new Set([...state.favoriteElements, ...keys])];
      localStorage.setItem('favoriteElements', JSON.stringify(newFavorites));
      return { favoriteElements: newFavorites };
    }),
}));
