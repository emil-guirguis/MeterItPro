// /**
//  * Dashboard Example
//  * 
//  * Example implementation showing how to use the dashboard framework
//  * This can be used as a reference for migrating existing dashboards
//  */

// import React from 'react';
// import { useDashboard } from '../hooks/useDashboard';
// import { DashboardGrid } from '../components/DashboardGrid';
// import { DashboardWidget } from '../components/DashboardWidget';
// import { StatCard, formatNumber, formatPercentage } from '../components/StatCard';
// import { createResponsiveLayout } from '../utils/layoutHelpers';

// /**
//  * Example: Meter Dashboard using framework components
//  * 
//  * This example shows how to migrate the client Dashboard.tsx to use framework components
//  */
// export const MeterDashboardExample: React.FC = () => {
//   // Use the dashboard hook for state management and auto-refresh
//   const dashboard = useDashboard({
//     id: 'meter-dashboard',
//     layout: createResponsiveLayout(3, 16),
//     refreshInterval: 30000, // 30 seconds
//     persistState: true,
//     fetchData: async () => {
//       // Replace with actual API call
//       const response = await fetch('/api/meter-readings/stats');
//       return response.json();
//     }
//   });

//   const stats = dashboard.data;

//   return (
//     <div className="dashboard">
//       {/* Statistics Section using DashboardWidget */}
//       <DashboardWidget
//         id="meter-stats"
//         type="stat-card"
//         title="📊 Meter Statistics"
//         collapsible
//         defaultCollapsed={false}
//         refreshable
//         onRefresh={dashboard.refresh}
//         loading={dashboard.loading}
//         error={dashboard.error}
//       >
//         <DashboardGrid layout={dashboard.config.layout} minColumnWidth={280}>
//           <StatCard
//             id="total-energy"
//             title="Total Energy"
//             value={stats?.totalKWh || 0}
//             subtitle="Cumulative consumption"
//             icon="⚡"
//             variant="success"
//             formatValue={(val) => `${formatNumber(val)} kWh`}
//             loading={dashboard.loading}
//           />

//           <StatCard
//             id="peak-demand"
//             title="Peak Demand"
//             value={stats?.maxKWpeak || 0}
//             subtitle="Maximum recorded"
//             icon="🔌"
//             variant="warning"
//             formatValue={(val) => `${formatNumber(val)} kW`}
//             loading={dashboard.loading}
//           />

//           <StatCard
//             id="avg-voltage"
//             title="Avg Voltage"
//             value={stats?.avgVoltage || 0}
//             subtitle="System average"
//             icon="📊"
//             variant="info"
//             formatValue={(val) => `${val.toFixed(1)} V`}
//             loading={dashboard.loading}
//           />

//           <StatCard
//             id="active-meters"
//             title="Active Meters"
//             value={stats?.uniqueMeters || 0}
//             subtitle={`${formatNumber(stats?.totalReadings || 0)} readings`}
//             icon="📈"
//             variant="default"
//             loading={dashboard.loading}
//           />

//           <StatCard
//             id="power-factor"
//             title="Power Factor"
//             value={stats?.avgPowerFactor ? stats.avgPowerFactor * 100 : 0}
//             subtitle="System efficiency"
//             icon="⚖️"
//             variant="info"
//             formatValue={(val) => formatPercentage(val)}
//             loading={dashboard.loading}
//           />

//           <StatCard
//             id="avg-current"
//             title="Avg Current"
//             value={stats?.avgCurrent || 0}
//             subtitle="System load"
//             icon="🔄"
//             variant="default"
//             formatValue={(val) => `${val.toFixed(1)} A`}
//             loading={dashboard.loading}
//           />

//           <StatCard
//             id="reactive-power"
//             title="Reactive Power"
//             value={stats?.totalKVARh || 0}
//             subtitle="Total reactive"
//             icon="🔋"
//             variant="warning"
//             formatValue={(val) => `${formatNumber(val)} kVARh`}
//             loading={dashboard.loading}
//           />

//           <StatCard
//             id="apparent-power"
//             title="Apparent Power"
//             value={stats?.totalKVAh || 0}
//             subtitle="Total apparent"
//             icon="⚡"
//             variant="success"
//             formatValue={(val) => `${formatNumber(val)} kVAh`}
//             loading={dashboard.loading}
//           />

//           <StatCard
//             id="temperature"
//             title="Temperature"
//             value="N/A"
//             subtitle="Not available"
//             icon="🌡️"
//             variant="default"
//             loading={dashboard.loading}
//           />

//           <StatCard
//             id="voltage-thd"
//             title="Voltage THD"
//             value="N/A"
//             subtitle="Not available"
//             icon="📊"
//             variant="default"
//             loading={dashboard.loading}
//           />

//           <StatCard
//             id="max-demand"
//             title="Max Demand"
//             value={stats?.maxKWpeak || 0}
//             subtitle="Peak demand"
//             icon="📈"
//             variant="success"
//             formatValue={(val) => `${formatNumber(val)} kW`}
//             loading={dashboard.loading}
//           />
//         </DashboardGrid>
//       </DashboardWidget>

//       {/* Latest Meter Readings - keep existing component */}
//       <div className="dashboard__content">
//         {/* <MeterReadingsList className="dashboard__meter-readings" maxItems={50} /> */}
//       </div>
//     </div>
//   );
// };

// /**
//  * Example: Simple Stats Dashboard
//  */
// export const SimpleStatsDashboard: React.FC = () => {
//   const dashboard = useDashboard({
//     id: 'simple-stats',
//     layout: { columns: 4, gap: 16 },
//     refreshInterval: 10000,
//     fetchData: async () => {
//       // Fetch your stats data
//       return {
//         users: 1234,
//         revenue: 45200,
//         orders: 89,
//         conversion: 3.2
//       };
//     }
//   });

//   return (
//     <div style={{ padding: '2rem' }}>
//       <h1>Dashboard</h1>
      
//       <DashboardGrid layout={dashboard.config.layout}>
//         <StatCard
//           id="users"
//           title="Total Users"
//           value={dashboard.data?.users || 0}
//           icon="👥"
//           variant="info"
//           trend={{ value: 12, direction: 'up', label: '+12% from last month' }}
//           loading={dashboard.loading}
//         />

//         <StatCard
//           id="revenue"
//           title="Revenue"
//           value={dashboard.data?.revenue || 0}
//           icon="💰"
//           variant="success"
//           formatValue={(val) => `$${formatNumber(val)}`}
//           trend={{ value: 8, direction: 'up' }}
//           loading={dashboard.loading}
//         />

//         <StatCard
//           id="orders"
//           title="Orders"
//           value={dashboard.data?.orders || 0}
//           icon="📦"
//           variant="warning"
//           trend={{ value: -3, direction: 'down' }}
//           loading={dashboard.loading}
//         />

//         <StatCard
//           id="conversion"
//           title="Conversion Rate"
//           value={dashboard.data?.conversion || 0}
//           icon="📈"
//           variant="default"
//           formatValue={(val) => formatPercentage(val)}
//           loading={dashboard.loading}
//         />
//       </DashboardGrid>
//     </div>
//   );
// };
