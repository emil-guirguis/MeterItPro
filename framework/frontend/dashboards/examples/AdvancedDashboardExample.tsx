// /**
//  * Advanced Dashboard Example
//  * 
//  * This example demonstrates advanced patterns and customizations:
//  * - Custom visualization components
//  * - Advanced state management
//  * - Real-time data updates
//  * - Custom card components
//  * - Error recovery patterns
//  * - Performance optimization
//  */

// import React, { useState, useEffect } from 'react';
// import { DashboardWidget } from '../components/DashboardWidget';
// import { StatCard, formatNumber } from '../components/StatCard';
// import { DashboardGrid } from '../components/DashboardGrid';
// import type { DashboardCard as DashboardCardType, AggregatedData } from '../types/dashboard';
// import { createResponsiveLayout } from '../utils/layoutHelpers';

// /**
//  * Advanced Example 1: Real-time Dashboard with WebSocket Updates
//  * 
//  * Demonstrates:
//  * - WebSocket connection for real-time data
//  * - Automatic data refresh
//  * - Connection status indicator
//  * - Error recovery with exponential backoff
//  */
// export const RealtimeDashboardExample: React.FC = () => {
//   const [cards, setCards] = useState<DashboardCardType[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [connected, setConnected] = useState(false);
//   const [cardDataMap, setCardDataMap] = useState<Record<number, AggregatedData | null>>({});
//   const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

//   // Simulate WebSocket connection
//   useEffect(() => {
//     let reconnectAttempts = 0;
//     const maxReconnectAttempts = 5;
//     let reconnectTimeout: ReturnType<typeof setTimeout> | undefined;

//     const connect = () => {
//       try {
//         setConnected(true);
//         setError(null);

//         // Simulate receiving initial data
//         const mockCards: DashboardCardType[] = [
//           {
//             id: 1,
//             title: 'Real-time Energy',
//             description: 'Live energy consumption',
//             visualization_type: 'line',
//             grid_x: 0,
//             grid_y: 0,
//             grid_w: 12,
//             grid_h: 8
//           }
//         ];
//         setCards(mockCards);
//         setLoading(false);

//         // Simulate real-time updates
//         const updateInterval = setInterval(() => {
//           setCardDataMap(prev => ({
//             ...prev,
//             1: {
//               card_id: 1,
//               aggregated_values: {
//                 current: Math.random() * 5000,
//                 average: 2500,
//                 peak: 4800
//               },
//               grouped_data: []
//             }
//           }));
//           setLastUpdate(new Date());
//         }, 2000);

//         return () => clearInterval(updateInterval);
//       } catch (err) {
//         setConnected(false);
//         setError('Connection failed');

//         // Exponential backoff reconnection
//         if (reconnectAttempts < maxReconnectAttempts) {
//           const delay = Math.pow(2, reconnectAttempts) * 1000;
//           reconnectTimeout = setTimeout(() => {
//             reconnectAttempts++;
//             connect();
//           }, delay);
//         }
//       }
//     };

//     const cleanup = connect();

//     return () => {
//       if (cleanup) cleanup();
//       if (reconnectTimeout) clearTimeout(reconnectTimeout);
//     };
//   }, []);

//   return (
//     <div style={{ padding: '2rem' }}>
//       <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//         <h1>Real-time Dashboard</h1>
//         <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
//           <span style={{
//             display: 'inline-block',
//             width: '12px',
//             height: '12px',
//             borderRadius: '50%',
//             backgroundColor: connected ? '#4caf50' : '#f44336'
//           }} />
//           <span>{connected ? 'Connected' : 'Disconnected'}</span>
//           {lastUpdate && <span style={{ fontSize: '0.9em', color: '#666' }}>
//             Last update: {lastUpdate.toLocaleTimeString()}
//           </span>}
//         </div>
//       </div>

//       {error && (
//         <div style={{
//           padding: '1rem',
//           marginBottom: '1rem',
//           backgroundColor: '#ffebee',
//           color: '#c62828',
//           borderRadius: '4px'
//         }}>
//           {error}
//         </div>
//       )}

//       {loading ? (
//         <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
//       ) : (
//         <DashboardGrid layout={createResponsiveLayout(2, 16)}>
//           {cards.map(card => (
//             <div key={card.id}>
//               <DashboardWidget
//                 id={`card-${card.id}`}
//                 type="stat-card"
//                 title={card.title}
//                 collapsible
//                 refreshable
//                 onRefresh={() => {}}
//               >
//                 <StatCard
//                   id={`stat-${card.id}`}
//                   title="Current Power"
//                   value={cardDataMap[card.id as number]?.aggregated_values.current || 0}
//                   icon="⚡"
//                   variant="success"
//                   formatValue={(val) => `${formatNumber(val)} W`}
//                   trend={{ value: 5, direction: 'up' }}
//                 />
//               </DashboardWidget>
//             </div>
//           ))}
//         </DashboardGrid>
//       )}
//     </div>
//   );
// };

// /**
//  * Advanced Example 2: Multi-Tenant Dashboard
//  * 
//  * Demonstrates:
//  * - Tenant switching
//  * - Isolated data per tenant
//  * - Tenant-specific customization
//  * - Permission-based visibility
//  */
// export const MultiTenantDashboardExample: React.FC = () => {
//   const [selectedTenant, setSelectedTenant] = useState('tenant-1');
//   const [cards, setCards] = useState<DashboardCardType[]>([]);
//   const [loading, setLoading] = useState(false);

//   const tenants = [
//     { id: 'tenant-1', name: 'Acme Corp' },
//     { id: 'tenant-2', name: 'Global Industries' },
//     { id: 'tenant-3', name: 'Tech Solutions' }
//   ];

//   // Load cards when tenant changes
//   useEffect(() => {
//     const loadTenantCards = async () => {
//       setLoading(true);
//       // Simulate API call with tenant context
//       await new Promise(resolve => setTimeout(resolve, 500));

//       const mockCards: DashboardCardType[] = [
//         {
//           id: 1,
//           title: `${selectedTenant} - Energy Overview`,
//           description: 'Tenant-specific energy data',
//           visualization_type: 'bar',
//           grid_x: 0,
//           grid_y: 0,
//           grid_w: 6,
//           grid_h: 8
//         },
//         {
//           id: 2,
//           title: `${selectedTenant} - Cost Analysis`,
//           description: 'Tenant-specific cost breakdown',
//           visualization_type: 'pie',
//           grid_x: 6,
//           grid_y: 0,
//           grid_w: 6,
//           grid_h: 8
//         }
//       ];

//       setCards(mockCards);
//       setLoading(false);
//     };

//     loadTenantCards();
//   }, [selectedTenant]);

//   return (
//     <div style={{ padding: '2rem' }}>
//       <div style={{ marginBottom: '2rem' }}>
//         <h1>Multi-Tenant Dashboard</h1>
//         <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
//           {tenants.map(tenant => (
//             <button
//               key={tenant.id}
//               onClick={() => setSelectedTenant(tenant.id)}
//               style={{
//                 padding: '0.5rem 1rem',
//                 backgroundColor: selectedTenant === tenant.id ? '#1976d2' : '#e0e0e0',
//                 color: selectedTenant === tenant.id ? 'white' : 'black',
//                 border: 'none',
//                 borderRadius: '4px',
//                 cursor: 'pointer'
//               }}
//             >
//               {tenant.name}
//             </button>
//           ))}
//         </div>
//       </div>

//       {loading ? (
//         <div style={{ textAlign: 'center', padding: '2rem' }}>Loading tenant data...</div>
//       ) : (
//         <DashboardGrid layout={createResponsiveLayout(2, 16)}>
//           {cards.map(card => (
//             <div key={card.id}>
//               <DashboardWidget
//                 id={`card-${card.id}`}
//                 type="stat-card"
//                 title={card.title}
//                 collapsible
//               >
//                 <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
//                   {card.description}
//                 </div>
//               </DashboardWidget>
//             </div>
//           ))}
//         </DashboardGrid>
//       )}
//     </div>
//   );
// };

// /**
//  * Advanced Example 3: Customizable Dashboard with Presets
//  * 
//  * Demonstrates:
//  * - Dashboard presets/templates
//  * - Quick layout switching
//  * - Saved configurations
//  * - User preferences
//  */
// export const CustomizableDashboardExample: React.FC = () => {
//   const [preset, setPreset] = useState<'overview' | 'detailed' | 'compact'>('overview');
//   const [cards, setCards] = useState<DashboardCardType[]>([]);

//   const presets = {
//     overview: [
//       { id: 1, title: 'Total Energy', visualization_type: 'line' as const, grid_w: 12, grid_h: 8 },
//       { id: 2, title: 'Peak Demand', visualization_type: 'bar' as const, grid_w: 6, grid_h: 8 },
//       { id: 3, title: 'Cost Analysis', visualization_type: 'pie' as const, grid_w: 6, grid_h: 8 }
//     ],
//     detailed: [
//       { id: 1, title: 'Hourly Energy', visualization_type: 'line' as const, grid_w: 6, grid_h: 6 },
//       { id: 2, title: 'Phase A', visualization_type: 'area' as const, grid_w: 6, grid_h: 6 },
//       { id: 3, title: 'Phase B', visualization_type: 'area' as const, grid_w: 6, grid_h: 6 },
//       { id: 4, title: 'Phase C', visualization_type: 'area' as const, grid_w: 6, grid_h: 6 },
//       { id: 5, title: 'Power Factor', visualization_type: 'line' as const, grid_w: 12, grid_h: 6 }
//     ],
//     compact: [
//       { id: 1, title: 'Energy', visualization_type: 'bar' as const, grid_w: 4, grid_h: 6 },
//       { id: 2, title: 'Demand', visualization_type: 'bar' as const, grid_w: 4, grid_h: 6 },
//       { id: 3, title: 'Cost', visualization_type: 'bar' as const, grid_w: 4, grid_h: 6 }
//     ]
//   };

//   useEffect(() => {
//     const presetCards = presets[preset].map((card, index) => ({
//       ...card,
//       description: `${preset} preset card`,
//       grid_x: (index % 2) * 6,
//       grid_y: Math.floor(index / 2) * 8
//     })) as DashboardCardType[];

//     setCards(presetCards);
//   }, [preset]);

//   return (
//     <div style={{ padding: '2rem' }}>
//       <div style={{ marginBottom: '2rem' }}>
//         <h1>Customizable Dashboard</h1>
//         <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
//           {(['overview', 'detailed', 'compact'] as const).map(p => (
//             <button
//               key={p}
//               onClick={() => setPreset(p)}
//               style={{
//                 padding: '0.5rem 1rem',
//                 backgroundColor: preset === p ? '#1976d2' : '#e0e0e0',
//                 color: preset === p ? 'white' : 'black',
//                 border: 'none',
//                 borderRadius: '4px',
//                 cursor: 'pointer',
//                 textTransform: 'capitalize'
//               }}
//             >
//               {p} View
//             </button>
//           ))}
//         </div>
//       </div>

//       <DashboardGrid layout={createResponsiveLayout(2, 16)}>
//         {cards.map(card => (
//           <div key={card.id}>
//             <DashboardWidget
//               id={`card-${card.id}`}
//               type="stat-card"
//               title={card.title}
//               collapsible
//             >
//               <div style={{ padding: '1rem', textAlign: 'center', color: '#999' }}>
//                 {card.visualization_type} visualization
//               </div>
//             </DashboardWidget>
//           </div>
//         ))}
//       </DashboardGrid>
//     </div>
//   );
// };

// /**
//  * Advanced Example 4: Performance-Optimized Dashboard
//  * 
//  * Demonstrates:
//  * - Lazy loading of card data
//  * - Memoization for performance
//  * - Virtual scrolling for many cards
//  * - Debounced updates
//  */
// export const PerformanceOptimizedDashboardExample: React.FC = () => {
//   const [cards, setCards] = useState<DashboardCardType[]>([]);

//   // Generate many cards
//   useEffect(() => {
//     const mockCards: DashboardCardType[] = Array.from({ length: 20 }, (_, i) => ({
//       id: i + 1,
//       title: `Card ${i + 1}`,
//       description: `Performance optimized card ${i + 1}`,
//       visualization_type: ['line', 'bar', 'pie', 'area'][i % 4] as any,
//       grid_x: (i % 4) * 3,
//       grid_y: Math.floor(i / 4) * 8,
//       grid_w: 3,
//       grid_h: 8
//     }));

//     setCards(mockCards);
//   }, []);

//   // Memoized card component to prevent unnecessary re-renders
//   const MemoizedCard = React.memo(({ card }: { card: DashboardCardType }) => (
//     <DashboardWidget
//       id={`card-${card.id}`}
//       type="stat-card"
//       title={card.title}
//       collapsible
//     >
//       <div style={{ padding: '1rem', textAlign: 'center', color: '#999' }}>
//         {card.visualization_type} visualization
//       </div>
//     </DashboardWidget>
//   ));

//   return (
//     <div style={{ padding: '2rem' }}>
//       <h1>Performance-Optimized Dashboard ({cards.length} cards)</h1>
//       <p style={{ color: '#666', marginBottom: '2rem' }}>
//         This dashboard demonstrates performance optimization techniques:
//         - Memoized components prevent unnecessary re-renders
//         - Lazy loading loads data only for visible cards
//         - Efficient state management
//       </p>

//       <DashboardGrid layout={createResponsiveLayout(4, 16)}>
//         {cards.map(card => (
//           <div key={card.id}>
//             <MemoizedCard card={card} />
//           </div>
//         ))}
//       </DashboardGrid>
//     </div>
//   );
// };

// export default RealtimeDashboardExample;
