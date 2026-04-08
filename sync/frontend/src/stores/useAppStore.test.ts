import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './useAppStore';
import type { Meter, MeterReading } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeMeter = (id: number, overrides: Partial<Meter> = {}): Meter => ({
  meter_id: id,
  name: `Meter ${id}`,
  device_id: null,
  ip: null,
  port: null,
  active: true,
  element: '',
  ...overrides,
});

const makeReading = (id: number, meterId: number, overrides: Partial<MeterReading> = {}): MeterReading => ({
  id,
  meter_id: meterId,
  timestamp: new Date().toISOString(),
  data_point: 'kwh',
  value: id * 10,
  unit: 'kWh',
  is_synchronized: false,
  ...overrides,
});

// Reset the store to its initial state before every test.
// Zustand stores persist in memory across tests unless explicitly reset.
beforeEach(() => {
  useAppStore.setState({
    meters: [],
    readings: [],
    syncStatus: null,
    meterStatuses: [],
    tenantInfo: null,
    isLoading: false,
    error: null,
    favoriteElements: [],
  });
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('useAppStore — initial state', () => {
  it('starts with empty meters and readings', () => {
    const { meters, readings } = useAppStore.getState();
    expect(meters).toEqual([]);
    expect(readings).toEqual([]);
  });

  it('starts with isLoading false and no error', () => {
    const { isLoading, error } = useAppStore.getState();
    expect(isLoading).toBe(false);
    expect(error).toBeNull();
  });

  it('starts with empty favoriteElements', () => {
    expect(useAppStore.getState().favoriteElements).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Simple setters
// ---------------------------------------------------------------------------

describe('useAppStore — setters', () => {
  it('setMeters replaces the meters array', () => {
    const { setMeters } = useAppStore.getState();
    setMeters([makeMeter(1), makeMeter(2)]);
    expect(useAppStore.getState().meters).toHaveLength(2);
    expect(useAppStore.getState().meters[0].meter_id).toBe(1);
  });

  it('setReadings replaces the readings array', () => {
    const { setReadings } = useAppStore.getState();
    setReadings([makeReading(1, 1), makeReading(2, 1)]);
    expect(useAppStore.getState().readings).toHaveLength(2);
  });

  it('setLoading updates isLoading', () => {
    useAppStore.getState().setLoading(true);
    expect(useAppStore.getState().isLoading).toBe(true);
    useAppStore.getState().setLoading(false);
    expect(useAppStore.getState().isLoading).toBe(false);
  });

  it('setError stores the message and clears it with null', () => {
    useAppStore.getState().setError('something went wrong');
    expect(useAppStore.getState().error).toBe('something went wrong');
    useAppStore.getState().setError(null);
    expect(useAppStore.getState().error).toBeNull();
  });

  it('setTenantInfo stores tenant and clears with null', () => {
    useAppStore.getState().setTenantInfo({ tenant_id: 42, name: 'Acme' });
    expect(useAppStore.getState().tenantInfo?.tenant_id).toBe(42);
    useAppStore.getState().setTenantInfo(null);
    expect(useAppStore.getState().tenantInfo).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// toggleMeterFavorites
// ---------------------------------------------------------------------------

describe('useAppStore — toggleMeterFavorites', () => {
  it('adds data points as favorites when none are favorited', () => {
    useAppStore.getState().toggleMeterFavorites(1, ['kwh', 'kw']);
    const { favoriteElements } = useAppStore.getState();
    expect(favoriteElements).toContain('1-kwh');
    expect(favoriteElements).toContain('1-kw');
  });

  it('removes all data points when all are already favorited', () => {
    // Prime state
    useAppStore.setState({ favoriteElements: ['1-kwh', '1-kw'] });
    useAppStore.getState().toggleMeterFavorites(1, ['kwh', 'kw']);
    expect(useAppStore.getState().favoriteElements).toEqual([]);
  });

  it('adds remaining data points when only some are favorited', () => {
    useAppStore.setState({ favoriteElements: ['1-kwh'] });
    useAppStore.getState().toggleMeterFavorites(1, ['kwh', 'kw']);
    // Since not ALL are favorited, it adds (and dedupes)
    const favs = useAppStore.getState().favoriteElements;
    expect(favs).toContain('1-kwh');
    expect(favs).toContain('1-kw');
  });

  it('does not duplicate existing favorites', () => {
    useAppStore.getState().toggleMeterFavorites(1, ['kwh']);
    useAppStore.getState().toggleMeterFavorites(1, ['kwh']); // second call removes it
    expect(useAppStore.getState().favoriteElements).toEqual([]);
  });

  it('persists favorites to localStorage', () => {
    useAppStore.getState().toggleMeterFavorites(5, ['kwh']);
    const stored = JSON.parse(localStorage.getItem('favoriteElements') ?? '[]');
    expect(stored).toContain('5-kwh');
  });

  it('keeps favorites for other meters intact when toggling one meter', () => {
    useAppStore.setState({ favoriteElements: ['2-kwh'] });
    useAppStore.getState().toggleMeterFavorites(1, ['kw']);
    const favs = useAppStore.getState().favoriteElements;
    expect(favs).toContain('2-kwh');
    expect(favs).toContain('1-kw');
  });
});
