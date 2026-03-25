import React, { useState, useEffect } from 'react';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BarChartIcon from '@mui/icons-material/BarChart';
import { dashboardService, type AggregatedData } from '../../services/dashboardService';
import './DashboardBanner.css';

interface DashboardBannerProps {
  cardDataMap: Record<number, AggregatedData | null>;
  cards: Array<{ dashboard_id: number }>;
}

export const DashboardBanner: React.FC<DashboardBannerProps> = ({
  cardDataMap,
  cards,
}) => {
  const [loading, setLoading] = useState(true);
  const [activeMetersCount, setActiveMetersCount] = useState(0);
  const [peakDemandKw, setPeakDemandKw] = useState(0);
  const [totalEnergyKwh, setTotalEnergyKwh] = useState(0);

  // Fetch total energy and power once on mount
  useEffect(() => {
    fetchBannerMetrics();
  }, []);

  // Calculate active meters count as cards load
  useEffect(() => {
    calculateActiveMetersCount();
  }, [cardDataMap, cards]);

  const fetchBannerMetrics = async () => {
    try {
      setLoading(true);
      const [totalEnergy, totalPower] = await Promise.all([
        dashboardService.getTotalActiveEnergy(),
        dashboardService.getTotalPower(),
      ]);
      setTotalEnergyKwh(Math.round(totalEnergy));
      setPeakDemandKw(Math.round(totalPower * 10) / 10);
    } catch (error) {
      console.error('Error fetching banner metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateActiveMetersCount = () => {
    // Count total active meters (number of meters with data)
    const metersWithData = new Set<number>();

    cards.forEach((card) => {
      const cardData = cardDataMap[card.dashboard_id];
      if (cardData?.aggregated_values) {
        // Count this meter as active if it has data
        metersWithData.add(card.dashboard_id);
      }
    });

    setActiveMetersCount(metersWithData.size);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const metrics = [
    {
      id: 'meters',
      icon: FlashOnIcon,
      label: 'Total Active Meters',
      value: activeMetersCount,
      unit: '',
    },
    {
      id: 'energy',
      icon: BarChartIcon,
      label: 'Total Energy',
      value: totalEnergyKwh,
      unit: 'kWh',
    },
    {
      id: 'demand',
      icon: TrendingUpIcon,
      label: 'Peak Demand',
      value: peakDemandKw,
      unit: 'kW',
    },

  ];

  return (
    <div className="dashboard-banner">
      {metrics.map((metric) => {
        const IconComponent = metric.icon;
        return (
          <div key={metric.id} className="dashboard-banner__card">
            <div className="dashboard-banner__header">
              <IconComponent className="dashboard-banner__icon" />
              <div className="dashboard-banner__label">{metric.label}</div>
            </div>
            <div className="dashboard-banner__value-row">
              <div className="dashboard-banner__value">
                {loading ? '—' : formatNumber(metric.value)}
              </div>
              {metric.unit && <div className="dashboard-banner__unit">{metric.unit}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardBanner;
