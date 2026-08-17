// /**
//  * Client Dashboard Example
//  * 
//  * This example demonstrates how a client application integrates the framework dashboard
//  * with their own services and business logic.
//  * 
//  * Key patterns:
//  * - Client service handles API communication with tenant context
//  * - Framework components receive data through props
//  * - Client maintains separation of concerns
//  * - Callbacks allow client to implement custom business logic
//  */

// import React, { useState, useEffect, useCallback } from 'react';
// import type { Layout } from 'react-grid-layout';
// import { DashboardPage } from '../components/DashboardPage';
// import { DashboardCard } from '../components/DashboardCard';
// import { DashboardCardForm } from '../components/DashboardCardForm';
// import { ExpandedCardModal } from '../components/ExpandedCardModal';
// import { Visualization } from '../components/Visualization';
// import type { DashboardCard as DashboardCardType, AggregatedData } from '../types/dashboard';

// /**
//  * Mock client service - in real app, this would be your actual service
//  * This demonstrates the separation between framework and client-specific code
//  */
// class MockClientDashboardService {
//   tenantId: string;
//   authToken: string;

//   constructor(tenantId: string, authToken: string) {
//     this.tenantId = tenantId;
//     this.authToken = authToken;
//   }

//   /**
//    * Get all dashboard cards for the tenant
//    * In a real app, this would make an API call with tenant context
//    */
//   async getDashboardCards(): Promise<DashboardCardType[]> {
//     // Simulate API delay
//     await new Promise(resolve => setTimeout(resolve, 500));

//     return [
//       {
//         id: 1,
//         title: 'Energy Consumption',
//         description: 'Total energy consumption over time',
//         visualization_type: 'line',
//         grid_x: 0,
//         grid_y: 0,
//         grid_w: 6,
//         grid_h: 8,
//         meter_id: 101,
//         meter_element_id: 1,
//         selected_columns: ['kWh'],
//         time_frame_type: 'last_month',
//         grouping_type: 'daily'
//       },
//       {
//         id: 2,
//         title: 'Power Distribution',
//         description: 'Power distribution by phase',
//         visualization_type: 'pie',
//         grid_x: 6,
//         grid_y: 0,
//         grid_w: 6,
//         grid_h: 8,
//         meter_id: 101,
//         meter_element_id: 2,
//         selected_columns: ['kW_phase_a', 'kW_phase_b', 'kW_phase_c'],
//         time_frame_type: 'this_month_to_date',
//         grouping_type: 'total'
//       },
//       {
//         id: 3,
//         title: 'Demand Profile',
//         description: 'Peak demand throughout the day',
//         visualization_type: 'bar',
//         grid_x: 0,
//         grid_y: 8,
//         grid_w: 6,
//         grid_h: 8,
//         meter_id: 102,
//         meter_element_id: 1,
//         selected_columns: ['kW'],
//         time_frame_type: 'last_month',
//         grouping_type: 'hourly'
//       },
//       {
//         id: 4,
//         title: 'Power Factor Trend',
//         description: 'Power factor efficiency over time',
//         visualization_type: 'area',
//         grid_x: 6,
//         grid_y: 8,
//         grid_w: 6,
//         grid_h: 8,
//         meter_id: 101,
//         meter_element_id: 3,
//         selected_columns: ['power_factor'],
//         time_frame_type: 'last_month',
//         grouping_type: 'daily'
//       }
//     ];
//   }

//   /**
//    * Get aggregated data for a specific card
//    * In a real app, this would fetch from your API with tenant context
//    */
//   async getCardData(cardId: number): Promise<AggregatedData> {
//     // Simulate API delay
//     await new Promise(resolve => setTimeout(resolve, 300));

//     // Generate mock data based on card ID
//     const baseValue = cardId * 1000;
//     const dataPoints = Array.from({ length: 30 }, (_, i) => ({
//       date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
//       value: baseValue + Math.random() * 500 - 250,
//       value2: baseValue * 0.8 + Math.random() * 400 - 200,
//       value3: baseValue * 0.6 + Math.random() * 300 - 150
//     }));

//     return {
//       card_id: cardId,
//       aggregated_values: {
//         total: baseValue,
//         average: baseValue * 0.95,
//         min: baseValue * 0.7,
//         max: baseValue * 1.3
//       },
//       grouped_data: dataPoints
//     };
//   }

//   /**
//    * Create a new dashboard card
//    * In a real app, this would POST to your API
//    */
//   async createCard(data: Partial<DashboardCardType>): Promise<DashboardCardType> {
//     await new Promise(resolve => setTimeout(resolve, 500));

//     return {
//       id: Math.floor(Math.random() * 10000),
//       title: data.title || 'New Card',
//       description: data.description,
//       visualization_type: data.visualization_type || 'line',
//       grid_x: data.grid_x || 0,
//       grid_y: data.grid_y || 0,
//       grid_w: data.grid_w || 6,
//       grid_h: data.grid_h || 8,
//       ...data
//     };
//   }

//   /**
//    * Update an existing dashboard card
//    * In a real app, this would PUT to your API
//    */
//   async updateCard(cardId: number, data: Partial<DashboardCardType>): Promise<DashboardCardType> {
//     await new Promise(resolve => setTimeout(resolve, 500));

//     return {
//       id: cardId,
//       title: data.title || 'Updated Card',
//       visualization_type: data.visualization_type || 'line',
//       grid_x: data.grid_x || 0,
//       grid_y: data.grid_y || 0,
//       grid_w: data.grid_w || 6,
//       grid_h: data.grid_h || 8,
//       ...data
//     };
//   }

//   /**
//    * Delete a dashboard card
//    * In a real app, this would DELETE from your API
//    */
//   async deleteCard(_cardId: number): Promise<void> {
//     await new Promise(resolve => setTimeout(resolve, 300));
//     // In real app, would make DELETE request
//   }

//   /**
//    * Save layout changes
//    * In a real app, this would persist to your API
//    */
//   async saveLayout(_cardId: number, _layout: Partial<DashboardCardType>): Promise<void> {
//     await new Promise(resolve => setTimeout(resolve, 200));
//     // In real app, would make PATCH request
//   }
// }

// /**
//  * Example: Client Dashboard using Framework Components
//  * 
//  * This demonstrates the recommended pattern for integrating the framework dashboard
//  * into a client application. The client maintains:
//  * - Service layer for API communication
//  * - State management for dashboard data
//  * - Callbacks for user interactions
//  * 
//  * The framework provides:
//  * - UI components (DashboardPage, DashboardCard, etc.)
//  * - Layout management
//  * - Visualization rendering
//  */
// export const ClientDashboardExample: React.FC = () => {
//   // Initialize mock service (in real app, inject actual service)
//   const service = new MockClientDashboardService('tenant-123', 'auth-token-xyz');

//   // State management
//   const [cards, setCards] = useState<DashboardCardType[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [layout, setLayout] = useState<Layout[]>([]);
//   const [cardDataMap, setCardDataMap] = useState<Record<number, AggregatedData | null>>({});
//   const [cardLoadingMap, setCardLoadingMap] = useState<Record<number, boolean>>({});
//   const [cardErrorMap, setCardErrorMap] = useState<Record<number, string | null>>({});
//   const [showModal, setShowModal] = useState(false);
//   const [editingCard, setEditingCard] = useState<DashboardCardType | null>(null);
//   const [expandedCard, setExpandedCard] = useState<DashboardCardType | null>(null);
//   const [expandedCardData, setExpandedCardData] = useState<AggregatedData | null>(null);

//   // Fetch all cards on mount
//   useEffect(() => {
//     const loadCards = async () => {
//       try {
//         setLoading(true);
//         setError(null);
//         const fetchedCards = await service.getDashboardCards();
//         setCards(fetchedCards);

//         // Initialize layout from card positions
//         const newLayout: Layout[] = fetchedCards.map(card => ({
//           i: card.id.toString(),
//           x: card.grid_x ?? 0,
//           y: card.grid_y ?? 0,
//           w: card.grid_w ?? 6,
//           h: card.grid_h ?? 8,
//           static: false
//         }));
//         setLayout(newLayout);

//         // Fetch data for each card
//         fetchedCards.forEach(card => {
//           fetchCardData(card.id as number);
//         });
//       } catch (err) {
//         setError(err instanceof Error ? err.message : 'Failed to load dashboard');
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadCards();
//   }, []);

//   // Fetch data for a specific card
//   const fetchCardData = useCallback(async (cardId: number) => {
//     try {
//       setCardLoadingMap(prev => ({ ...prev, [cardId]: true }));
//       setCardErrorMap(prev => ({ ...prev, [cardId]: null }));
//       const data = await service.getCardData(cardId);
//       setCardDataMap(prev => ({ ...prev, [cardId]: data }));
//     } catch (err) {
//       setCardErrorMap(prev => ({
//         ...prev,
//         [cardId]: err instanceof Error ? err.message : 'Failed to fetch data'
//       }));
//     } finally {
//       setCardLoadingMap(prev => ({ ...prev, [cardId]: false }));
//     }
//   }, []);

//   // Handle create dashboard button click
//   const handleCreateCard = () => {
//     setEditingCard(null);
//     setShowModal(true);
//   };

//   // Handle edit card
//   const handleEditCard = (card: DashboardCardType) => {
//     setEditingCard(card);
//     setShowModal(true);
//   };

//   // Handle modal close
//   const handleModalClose = () => {
//     setShowModal(false);
//     setEditingCard(null);
//   };

//   // Handle modal success
//   const handleModalSuccess = async (cardData: Partial<DashboardCardType>) => {
//     try {
//       if (editingCard) {
//         const updated = await service.updateCard(editingCard.id as number, cardData);
//         setCards(cards.map(c => c.id === updated.id ? updated : c));
//       } else {
//         const created = await service.createCard(cardData);
//         setCards([...cards, created]);
//         fetchCardData(created.id as number);
//       }
//       handleModalClose();
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to save card');
//     }
//   };

//   // Handle delete card
//   const handleDeleteCard = async (cardId: number | string) => {
//     const numCardId = typeof cardId === 'string' ? parseInt(cardId) : cardId;
//     try {
//       await service.deleteCard(numCardId);
//       setCards(cards.filter(c => c.id !== numCardId));
//       setCardDataMap(prev => {
//         const newMap = { ...prev };
//         delete newMap[numCardId];
//         return newMap;
//       });
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to delete card');
//     }
//   };

//   // Handle layout change
//   const handleLayoutChange = async (newLayout: Layout[]) => {
//     setLayout(newLayout);

//     try {
//       // Save layout changes for each card
//       const updates = newLayout.map(item => {
//         const card = cards.find(c => c.id === parseInt(item.i));
//         if (card) {
//           return service.saveLayout(card.id as number, {
//             grid_x: item.x,
//             grid_y: item.y,
//             grid_w: item.w,
//             grid_h: item.h
//           });
//         }
//         return Promise.resolve();
//       });

//       await Promise.all(updates);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to save layout');
//     }
//   };

//   // Handle card refresh
//   const handleCardRefresh = (cardId: number | string) => {
//     const numCardId = typeof cardId === 'string' ? parseInt(cardId) : cardId;
//     fetchCardData(numCardId);
//   };

//   // Handle expand card
//   const handleExpandCard = async (card: DashboardCardType) => {
//     setExpandedCard(card);
//     try {
//       const data = await service.getCardData(card.id as number);
//       setExpandedCardData(data);
//     } catch (err) {
//       console.error('Error fetching expanded card data:', err);
//     }
//   };

//   // Handle close expanded card
//   const handleCloseExpandedCard = () => {
//     setExpandedCard(null);
//     setExpandedCardData(null);
//   };

//   // Wrapper component that provides data to framework card
//   const ClientDashboardCard: React.FC<any> = ({ card, ...props }) => {
//     const cardData = cardDataMap[card.id as number] || null;
//     const cardLoading = cardLoadingMap[card.id as number] || false;
//     const cardError = cardErrorMap[card.id as number] || null;

//     return (
//       <DashboardCard
//         card={card}
//         data={cardData}
//         loading={cardLoading}
//         error={cardError}
//         VisualizationComponent={Visualization}
//         {...props}
//       />
//     );
//   };

//   return (
//     <DashboardPage
//       cards={cards}
//       loading={loading}
//       error={error}
//       layout={layout}
//       onLayoutChange={handleLayoutChange}
//       onCreateCard={handleCreateCard}
//       onRefresh={() => window.location.reload()}
//       onEditCard={handleEditCard}
//       onDeleteCard={handleDeleteCard}
//       onExpandCard={handleExpandCard}
//       onCardRefresh={handleCardRefresh}
//       onErrorClose={() => setError(null)}
//       CardComponent={ClientDashboardCard}
//       ModalComponent={DashboardCardForm}
//       ExpandedModalComponent={ExpandedCardModal}
//       showModal={showModal}
//       editingCard={editingCard}
//       expandedCard={expandedCard}
//       expandedCardData={expandedCardData}
//       onModalClose={handleModalClose}
//       onModalSuccess={handleModalSuccess}
//       onCloseExpandedCard={handleCloseExpandedCard}
//     />
//   );
// };

// export default ClientDashboardExample;
