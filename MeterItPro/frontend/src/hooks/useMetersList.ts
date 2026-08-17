import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

export interface MeterListItem {
  meter_id: number;
  id?: number;
  name: string;
  serial_number?: string;
  is_virtual?: boolean;
}

// Module-level cache — shared across all hook instances, fetched only once per session
let _cache: MeterListItem[] | null = null;
let _pending: Promise<MeterListItem[]> | null = null;

function parseResponse(data: any): MeterListItem[] {
  if (data?.data?.items && Array.isArray(data.data.items)) return data.data.items;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
}

export function useMetersList() {
  const [meters, setMeters] = useState<MeterListItem[]>(_cache ?? []);
  const [loading, setLoading] = useState(_cache === null);

  useEffect(() => {
    if (_cache !== null) {
      setMeters(_cache);
      setLoading(false);
      return;
    }

    if (!_pending) {
      _pending = apiClient
        .get('/meters', { params: { limit: 1000, sortBy: 'name', sortOrder: 'asc' } })
        .then(res => {
          _cache = parseResponse(res.data);
          return _cache;
        })
        .catch(() => {
          _pending = null; // allow retry on error
          return [];
        });
    }

    let mounted = true;
    _pending.then(list => {
      if (mounted) {
        setMeters(list);
        setLoading(false);
      }
    });

    return () => { mounted = false; };
  }, []);

  return { meters, loading };
}
