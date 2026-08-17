import type { StatDefinition } from '@meterit/framework-frontend/components/list/types/list';
import type { Meter } from './metersStore';

export const meterStats: StatDefinition<Meter>[] = [
  {
    label: 'Total Meters',
    value: (items: Meter[]) => Array.isArray(items) ? items.length : 0,
  },
  {
    label: 'Active',
    value: (items: Meter[]) => Array.isArray(items) ? items.filter(m => m.active).length : 0,
  },
  {
    label: 'Inactive',
    value: (items: Meter[]) => Array.isArray(items) ? items.filter(m => !m.active).length : 0,
  },
  {
    label: 'Virtual',
    value: (items: Meter[]) => Array.isArray(items) ? items.filter(m => (m as any).is_virtual).length : 0,
  },
];
