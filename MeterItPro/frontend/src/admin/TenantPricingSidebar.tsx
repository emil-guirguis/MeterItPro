import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, Divider, CircularProgress } from '@mui/material';
import { listTenantCosts, listEquipment, type TenantCost, type TenantEquipment } from './adminService';

interface Props {
  tenantId: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

function toMonthly(cost: TenantCost): number {
  const amount = Number(cost.amount);
  switch (cost.billing_cycle) {
    case 'monthly':   return amount;
    case 'quarterly': return amount / 3;
    case 'annual':    return amount / 12;
    default:          return 0;
  }
}


const ROW_STYLE = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  py: 0.4,
};

interface LineProps { label: string; value: string; bold?: boolean; large?: boolean }

const Line: React.FC<LineProps> = ({ label, value, bold, large }) => (
  <Box sx={ROW_STYLE}>
    <Typography
      variant={large ? 'body2' : 'caption'}
      fontWeight={bold ? 600 : 400}
      color={bold ? 'text.primary' : 'text.secondary'}
    >
      {label}
    </Typography>
    <Typography
      variant={large ? 'body2' : 'caption'}
      fontWeight={bold ? 600 : 400}
      color={bold ? 'text.primary' : 'text.secondary'}
    >
      {value}
    </Typography>
  </Box>
);

export const TenantPricingSidebar: React.FC<Props> = ({ tenantId }) => {
  const [costs, setCosts]           = useState<TenantCost[]>([]);
  const [equipment, setEquipment]   = useState<TenantEquipment[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, e] = await Promise.all([listTenantCosts(tenantId), listEquipment(tenantId)]);
      setCosts(c);
      setEquipment(e);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { void load(); }, [load]);

  const active    = useMemo(() => costs.filter(i => i.active), [costs]);
  const recurring = useMemo(() => active.filter(i => i.billing_cycle !== 'one-time'), [active]);
  const oneTime   = useMemo(() => active.filter(i => i.billing_cycle === 'one-time'), [active]);

  const equipmentTotal = useMemo(
    () => equipment.reduce((s, e) => s + Number(e.quantity) * Number(e.price), 0),
    [equipment],
  );

  const subtotal      = useMemo(() => recurring.reduce((s, i) => s + toMonthly(i), 0), [recurring]);
  const tax           = 0;
  const monthlyTotal  = subtotal + tax;
  const annualRevenue = monthlyTotal * 12
    + oneTime.reduce((s, i) => s + Number(i.amount), 0)
    + equipmentTotal;

  return (
    <Box
      sx={{
        width: 240,
        flexShrink: 0,
        borderLeft: '1px solid',
        borderColor: 'divider',
        bgcolor: 'grey.50',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        overflowY: 'auto',
      }}
    >
      <Typography variant="subtitle2" fontWeight={600} color="text.primary">
        Revenue Summary
      </Typography>

      <Divider />

      {loading && (
        <Box display="flex" justifyContent="center" pt={2}>
          <CircularProgress size={20} />
        </Box>
      )}

      {!loading && error && (
        <Typography variant="caption" color="error">{error}</Typography>
      )}

      {!loading && !error && (
        <>
          <Line label="Recurring Costs" value={`${fmt(subtotal)}/mo`} />

          {oneTime.length > 0 && (
            <Line
              label="One-time Costs"
              value={fmt(oneTime.reduce((s, i) => s + Number(i.amount), 0))}
            />
          )}

          {equipment.length > 0 && (
            <Line label="Equipment" value={fmt(equipmentTotal)} />
          )}

          <Divider />

          {/* Totals */}
          <Box>
            <Line label="Subtotal" value={`${fmt(subtotal)}/mo`} />
            <Line label="Tax (0%)" value={fmt(tax)} />
          </Box>

          <Divider />

          <Box>
            <Line label="Monthly Total" value={`${fmt(monthlyTotal)}/mo`} bold />
            <Box sx={{ mt: 0.5, p: 1, bgcolor: '#e3f2fd', borderRadius: 1, border: '1px solid #bbdefb' }}>
              <Typography variant="caption" color="text.secondary" display="block">Annual Revenue</Typography>
              <Typography variant="body2" fontWeight={700} color="primary.main">
                {fmt(annualRevenue)}
              </Typography>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};
