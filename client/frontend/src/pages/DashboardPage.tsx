import React, { useState, useEffect, useCallback, useContext, createContext, useRef, useMemo } from 'react';
import type { Layout } from 'react-grid-layout';
import { DashboardPage as FrameworkDashboardPage } from '@framework/dashboards/components/DashboardPage';
import { DashboardCard as FrameworkDashboardCard } from '@framework/dashboards/components/DashboardCard';
import { DashboardCardModal as FrameworkDashboardCardModal } from '@framework/dashboards/components/DashboardCardModal';
import { ExpandedCardModal as FrameworkExpandedCardModal } from '@framework/dashboards/components/ExpandedCardModal';
import { Visualization } from '@framework/dashboards/components/Visualization';
import type { DashboardCard as FrameworkDashboardCardType } from '@framework/dashboards/types';
import { dashboardService, type DashboardCard as DashboardCardType, type AggregatedData } from '../services/dashboardService';
import './DashboardPage.css';

// Context for passing card data and handlers to ClientDashboardCard.
// This allows ClientDashboardCard to live outside DashboardPage (stable component identity)
// while still accessing up-to-date state.
interface DashboardContextType {
  cardDataMap: Record<number, AggregatedData | null>;
  cardLoadingMap: Record<number, boolean>;
  cardErrorMap: Record<number, string | null>;
  onVisualizationChange: (cardId: number | string, newType: string) => void;
  onGroupingChange: (cardId: number | string, newGrouping: string) => void;
  onTimeFrameChange: (cardId: number | string, newTimeFrame: string) => void;
  onAggregationChange: (cardId: number | string, aggregationType: string) => void;
}

const DashboardContext = createContext<DashboardContextType>({
  cardDataMap: {},
  cardLoadingMap: {},
  cardErrorMap: {},
  onVisualizationChange: () => {},
  onGroupingChange: () => {},
  onTimeFrameChange: () => {},
  onAggregationChange: () => {},
});

/**
 * Stable top-level component for rendering a dashboard card.
 * Defined outside DashboardPage so React never sees a new component type on re-renders,
 * which would cause all cards to unmount/remount and lose chart state.
 */
const ClientDashboardCard: React.FC<any> = ({ card, ...props }) => {
  const ctx = useContext(DashboardContext);

  const cardData = ctx.cardDataMap[card.dashboard_id] || null;
  const cardLoading = ctx.cardLoadingMap[card.dashboard_id] || false;
  const cardError = ctx.cardErrorMap[card.dashboard_id] || null;

  const frameworkCard: FrameworkDashboardCardType = {
    id: card.dashboard_id,
    title: card.card_name,
    description: card.card_description,
    visualization_type: card.visualization_type,
    grid_x: card.grid_x,
    grid_y: card.grid_y,
    grid_w: card.grid_w,
    grid_h: card.grid_h,
    ...card,
  };

  return (
    <FrameworkDashboardCard
      card={frameworkCard}
      data={cardData}
      loading={cardLoading}
      error={cardError}
      VisualizationComponent={Visualization}
      onVisualizationChange={ctx.onVisualizationChange}
      onGroupingChange={ctx.onGroupingChange}
      onTimeFrameChange={ctx.onTimeFrameChange}
      onAggregationChange={ctx.onAggregationChange}
      onEdit={props.onEdit}
      onDelete={props.onDelete}
      onRefresh={props.onRefresh}
      onExpand={props.onExpand}
    />
  );
};

/**
 * Client-specific DashboardPage wrapper
 *
 * This component wraps the framework DashboardPage and provides:
 * - API communication through dashboardService
 * - Client-specific data fetching and state management
 * - Callbacks for card operations
 *
 * The framework DashboardPage handles all UI rendering and layout management.
 */
export const DashboardPage: React.FC = () => {
  const [cards, setCards] = useState<DashboardCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<DashboardCardType | null>(null);
  const [expandedCard, setExpandedCard] = useState<DashboardCardType | null>(null);
  const [expandedCardData, setExpandedCardData] = useState<AggregatedData | null>(null);
  const [layout, setLayout] = useState<Layout[]>([]);
  const [cardDataMap, setCardDataMap] = useState<Record<number, AggregatedData | null>>({});
  const [cardLoadingMap, setCardLoadingMap] = useState<Record<number, boolean>>({});
  const [cardErrorMap, setCardErrorMap] = useState<Record<number, string | null>>({});
  const [meters, setMeters] = useState<Array<{ id: number; name: string }>>([]);
  const [meterElements, setMeterElements] = useState<Array<{ id: number; name: string; element?: string }>>([]);
  const [powerColumns, setPowerColumns] = useState<Array<{ name: string; label: string; type?: string }>>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const isInitialLoadRef = React.useRef(true);

  // Keep a ref to cards so handlers can read current state without stale closures
  const cardsRef = useRef<DashboardCardType[]>([]);
  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  // Fetch data for a specific card
  const fetchCardData = useCallback(async (cardId: number) => {
    try {
      setCardLoadingMap(prev => ({ ...prev, [cardId]: true }));
      setCardErrorMap(prev => ({ ...prev, [cardId]: null }));
      const data = await dashboardService.getCardData(cardId);
      setCardDataMap(prev => ({ ...prev, [cardId]: data }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch card data';
      setCardErrorMap(prev => ({ ...prev, [cardId]: errorMsg }));
      console.error(`Error fetching data for card ${cardId}:`, err);
    } finally {
      setCardLoadingMap(prev => ({ ...prev, [cardId]: false }));
    }
  }, []);

  // Fetch all dashboard cards
  const fetchCards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📊 [DashboardPage] Fetching dashboard cards...');
      const response = await dashboardService.getDashboardCards({
        page: 1,
        limit: 100
      });
      console.log('📊 [DashboardPage] Cards received:', response.items.length);

      // Ensure all cards have reasonable dimensions (grid: 12 cols, so w should be 2-12, h should be reasonable)
      const cardsWithDefaults = response.items.map(card => ({
        ...card,
        grid_w: (card.grid_w && card.grid_w > 0 && card.grid_w <= 12) ? card.grid_w : 4,
        grid_h: (card.grid_h && card.grid_h > 0 && card.grid_h <= 20) ? card.grid_h : 8,
      }));
      setCards(cardsWithDefaults);

      const newLayout: Layout[] = cardsWithDefaults.map((card, index) => ({
        i: card.dashboard_id.toString(),
        x: card.grid_x ?? 0,
        y: card.grid_y ?? (index * 10),
        w: cardsWithDefaults[index].grid_w,
        h: cardsWithDefaults[index].grid_h,
        static: false,
      }));
      setLayout(newLayout);

      cardsWithDefaults.forEach((card) => {
        fetchCardData(card.dashboard_id);
      });

      isInitialLoadRef.current = false;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch dashboard cards';
      setError(errorMsg);
      console.error('❌ [DashboardPage] Error fetching dashboard cards:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchCardData]);

  // Load cards on mount
  useEffect(() => {
    fetchCards();
    fetchMeters();
  }, [fetchCards]);

  // Fetch meters for the modal
  const fetchMeters = useCallback(async () => {
    try {
      const metersData = await dashboardService.getMetersByTenant();
      setMeters(metersData);
    } catch (err) {
      console.error('Error fetching meters:', err);
    }
  }, []);

  // Fetch power columns for the modal
  const fetchPowerColumns = useCallback(async (deviceId: number) => {
    try {
      const columnsData = await dashboardService.getPowerColumns(deviceId);
      setPowerColumns(columnsData);
    } catch (err) {
      console.error('Error fetching power columns:', err);
    }
  }, []);

  // Fetch meter elements for the selected meter
  const fetchMeterElements = useCallback(async (meterId: number) => {
    try {
      const elementsData = await dashboardService.getMeterElementsByMeter(meterId);
      setMeterElements(elementsData);
      await fetchPowerColumns(meterId);
    } catch (err) {
      console.error('Error fetching meter elements:', err);
      setMeterElements([]);
    }
  }, [fetchPowerColumns]);

  // Handle global refresh
  const handleGlobalRefresh = async (e: React.MouseEvent) => {
    e.preventDefault();
    setRefreshing(true);
    try {
      await fetchCards();
    } finally {
      setRefreshing(false);
    }
  };

  // Handle create card button click
  const handleCreateCard = (e: React.MouseEvent) => {
    e.preventDefault();
    setEditingCard(null);
    setShowModal(true);
  };

  // Handle edit card
  const handleEditCard = async (card: DashboardCardType) => {
    setEditingCard(card);
    if (card.meter_id) {
      await fetchMeterElements(card.meter_id);
    }
    setShowModal(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowModal(false);
    setEditingCard(null);
  };

  // Handle modal success
  const handleModalSuccess = (card: DashboardCardType) => {
    console.log('✅ handleModalSuccess called, editingCard:', !!editingCard, 'card:', card);
    if (editingCard) {
      setCards(prev => prev.map(c => c.dashboard_id === card.dashboard_id ? card : c));
    } else {
      // Ensure card has reasonable default dimensions (grid: 12 cols, h: reasonable rows)
      const cardWithDefaults = {
        ...card,
        grid_w: (card.grid_w && card.grid_w > 0 && card.grid_w <= 12) ? card.grid_w : 4,
        grid_h: (card.grid_h && card.grid_h > 0 && card.grid_h <= 20) ? card.grid_h : 8,
      };

      console.log('📝 Creating new card:', cardWithDefaults.dashboard_id, cardWithDefaults.card_name);
      setCards(prev => {
        const updated = [...prev, cardWithDefaults];
        console.log('📍 After setCards, cards count:', updated.length);
        return updated;
      });

      setLayout(prev => {
        const newW = cardWithDefaults.grid_w;
        const newH = cardWithDefaults.grid_h;
        const gridCols = 12;
        const gap = 0; // 0 column gap between cards

        console.log('Finding placement for card w:', newW, 'h:', newH);

        // Try to find available space (left-to-right, top-to-bottom)
        let bestX = 0;
        let bestY = 0;
        let placed = false;

        // Scan for available space with gap consideration
        for (let tryY = 0; tryY <= 50; tryY++) {
          for (let tryX = 0; tryX <= gridCols - newW; tryX++) {
            // Check for conflicts with gap
            const conflicts = prev.some(item =>
              !(tryX + newW + gap <= item.x || tryX >= item.x + item.w + gap ||
                tryY + newH + gap <= item.y || tryY >= item.y + item.h + gap)
            );

            if (!conflicts) {
              bestX = tryX;
              bestY = tryY;
              placed = true;
              break;
            }
          }
          if (placed) break;
        }

        const newLayoutItem = {
          i: cardWithDefaults.dashboard_id.toString(),
          x: bestX,
          y: bestY,
          w: newW,
          h: newH,
          static: false,
        };
        console.log('New layout item placed at x:', bestX, 'y:', bestY);

        const updated = [...prev, newLayoutItem];
        console.log('📍 After setLayout, layout count:', updated.length);
        return updated;
      });

      console.log('🔄 Fetching data for card:', cardWithDefaults.dashboard_id);
      fetchCardData(cardWithDefaults.dashboard_id);
    }
    console.log('🚪 Closing modal');
    handleModalClose();
  };

  // Handle layout change - do not save to database
  const handleLayoutChange = async (newLayout: Layout[]) => {
    if (isInitialLoadRef.current) {
      return;
    }
    setLayout(newLayout);
  };

  // Handle delete card
  const handleDeleteCard = async (cardId: number | string) => {
    const numCardId = typeof cardId === 'string' ? parseInt(cardId) : cardId;
    const cardIdStr = numCardId.toString();
    console.log(`🗑️ Deleting card ${cardIdStr}`);
    try {
      await dashboardService.deleteDashboardCard(numCardId);
      console.log(`✅ Card ${cardIdStr} deleted from API`);
      setCards(prev => {
        const filtered = prev.filter(c => String(c.dashboard_id) !== cardIdStr);
        console.log(`Cards after filter:`, filtered.length, 'cards remaining');
        return filtered;
      });
      setLayout(prev => {
        const filtered = prev.filter(item => item.i !== cardIdStr);
        console.log(`Layout after filter:`, filtered.length, 'items remaining');
        return filtered;
      });
      setCardDataMap(prev => {
        const newMap = { ...prev };
        delete newMap[numCardId];
        return newMap;
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete card';
      setError(errorMsg);
      console.error('❌ Error deleting card:', err);
    }
  };

  // Handle drill-down
  const handleDrillDown = (cardId: number | string) => {
    console.log('Drill down for card:', cardId);
  };

  // Handle card refresh
  const handleCardRefresh = (cardId: number | string) => {
    const numCardId = typeof cardId === 'string' ? parseInt(cardId) : cardId;
    fetchCardData(numCardId);
  };

  // Handle expand card
  const handleExpandCard = async (card: DashboardCardType) => {
    setExpandedCard(card);
    try {
      const data = await dashboardService.getCardData(card.dashboard_id);
      setExpandedCardData(data);
    } catch (err) {
      console.error('Error fetching expanded card data:', err);
      setExpandedCardData(null);
    }
  };

  // Handle close expanded card
  const handleCloseExpandedCard = () => {
    setExpandedCard(null);
    setExpandedCardData(null);
  };

  // Handle error close
  const handleErrorClose = () => {
    setError(null);
  };

  // Handle visualization change - stable via useCallback + cardsRef
  const handleVisualizationChange = useCallback(async (cardId: number | string, newType: string) => {
    const numCardId = typeof cardId === 'string' ? parseInt(cardId) : Number(cardId);
    console.log('[Dashboard] handleVisualizationChange - cardId:', cardId, 'numCardId:', numCardId, 'newType:', newType, 'cardsRef len:', cardsRef.current.length);
    const original = cardsRef.current.find(c => Number(c.dashboard_id) === numCardId);
    console.log('[Dashboard] found original?', !!original);
    if (!original) return;
    setCards(prev => prev.map(c => Number(c.dashboard_id) === numCardId ? { ...c, visualization_type: newType as any } : c));
    try {
      await dashboardService.updateDashboardCard(numCardId, { visualization_type: newType as any });
      console.log('[Dashboard] visualization saved OK');
    } catch (err) {
      console.error('[Dashboard] visualization save failed:', err);
      setCards(prev => prev.map(c => Number(c.dashboard_id) === numCardId ? { ...c, visualization_type: original.visualization_type } : c));
      setError(err instanceof Error ? err.message : 'Failed to update visualization');
    }
  }, []);

  // Handle grouping change - stable via useCallback + cardsRef
  const handleGroupingChange = useCallback(async (cardId: number | string, newGrouping: string) => {
    const numCardId = typeof cardId === 'string' ? parseInt(cardId) : Number(cardId);
    console.log('[Dashboard] handleGroupingChange - cardId:', cardId, 'numCardId:', numCardId, 'newGrouping:', newGrouping, 'cardsRef len:', cardsRef.current.length);
    const original = cardsRef.current.find(c => Number(c.dashboard_id) === numCardId);
    console.log('[Dashboard] found original?', !!original);
    if (!original) return;
    setCards(prev => prev.map(c => Number(c.dashboard_id) === numCardId ? { ...c, grouping_type: newGrouping as any } : c));
    try {
      await dashboardService.updateDashboardCard(numCardId, { grouping_type: newGrouping as any });
      console.log('[Dashboard] grouping saved OK');
      fetchCardData(numCardId);
    } catch (err) {
      console.error('[Dashboard] grouping save failed:', err);
      setCards(prev => prev.map(c => Number(c.dashboard_id) === numCardId ? { ...c, grouping_type: original.grouping_type } : c));
      setError(err instanceof Error ? err.message : 'Failed to update grouping');
    }
  }, [fetchCardData]);

  // Handle time frame change - stable via useCallback + cardsRef
  const handleTimeFrameChange = useCallback(async (cardId: number | string, newTimeFrame: string) => {
    const numCardId = typeof cardId === 'string' ? parseInt(cardId) : Number(cardId);
    console.log('[Dashboard] handleTimeFrameChange - cardId:', cardId, 'numCardId:', numCardId, 'newTimeFrame:', newTimeFrame, 'cardsRef len:', cardsRef.current.length);
    const original = cardsRef.current.find(c => Number(c.dashboard_id) === numCardId);
    console.log('[Dashboard] found original?', !!original);
    if (!original) return;
    setCards(prev => prev.map(c => Number(c.dashboard_id) === numCardId ? { ...c, time_frame_type: newTimeFrame as any } : c));
    try {
      await dashboardService.updateDashboardCard(numCardId, { time_frame_type: newTimeFrame as any });
      console.log('[Dashboard] time frame saved OK');
      fetchCardData(numCardId);
    } catch (err) {
      console.error('[Dashboard] time frame save failed:', err);
      setCards(prev => prev.map(c => Number(c.dashboard_id) === numCardId ? { ...c, time_frame_type: original.time_frame_type } : c));
      setError(err instanceof Error ? err.message : 'Failed to update time frame');
    }
  }, [fetchCardData]);

  // Handle aggregation change - stable via useCallback + cardsRef
  const handleAggregationChange = useCallback(async (cardId: number | string, aggregationType: string) => {
    const numCardId = typeof cardId === 'string' ? parseInt(cardId) : Number(cardId);
    console.log('[Dashboard] handleAggregationChange - cardId:', cardId, 'numCardId:', numCardId, 'aggregationType:', aggregationType);
    const original = cardsRef.current.find(c => Number(c.dashboard_id) === numCardId);
    if (!original) return;
    setCards(prev => prev.map(c => Number(c.dashboard_id) === numCardId ? { ...c, aggregation_type: aggregationType as any } : c));
    try {
      await dashboardService.updateDashboardCard(numCardId, { aggregation_type: aggregationType as any });
      console.log('[Dashboard] aggregation saved OK');
      fetchCardData(numCardId);
    } catch (err) {
      console.error('[Dashboard] aggregation save failed:', err);
      setCards(prev => prev.map(c => Number(c.dashboard_id) === numCardId ? { ...c, aggregation_type: (original as any).aggregation_type } : c));
      setError(err instanceof Error ? err.message : 'Failed to update aggregation');
    }
  }, [fetchCardData]);

  // Handle modal form submission
  const handleDirectSubmit = useCallback(async (data: any) => {
    try {
      setModalLoading(true);
      let result;
      if (editingCard) {
        result = await dashboardService.updateDashboardCard(editingCard.dashboard_id, data);
      } else {
        result = await dashboardService.createDashboardCard(data);
      }
      handleModalSuccess(result as any);
    } catch (err) {
      console.error('Error saving card:', err);
    } finally {
      setModalLoading(false);
    }
  }, [editingCard]);

  // Memoized context value - only changes when card data or stable handlers change
  const dashboardContextValue = useMemo<DashboardContextType>(() => ({
    cardDataMap,
    cardLoadingMap,
    cardErrorMap,
    onVisualizationChange: handleVisualizationChange,
    onGroupingChange: handleGroupingChange,
    onTimeFrameChange: handleTimeFrameChange,
    onAggregationChange: handleAggregationChange,
  }), [cardDataMap, cardLoadingMap, cardErrorMap, handleVisualizationChange, handleGroupingChange, handleTimeFrameChange, handleAggregationChange]);

  return (
    <DashboardContext.Provider value={dashboardContextValue}>
      <FrameworkDashboardPage
        cards={cards.map(card => ({
          ...card,
          id: card.dashboard_id
        })) as any}
        loading={loading}
        error={error}
        layout={layout}
        onLayoutChange={handleLayoutChange}
        onCreateCard={handleCreateCard}
        onRefresh={handleGlobalRefresh}
        onEditCard={handleEditCard as any}
        onDeleteCard={handleDeleteCard as any}
        onExpandCard={handleExpandCard as any}
        onCardRefresh={handleCardRefresh}
        onDrillDown={handleDrillDown}
        onErrorClose={handleErrorClose}
        refreshing={refreshing}
        CardComponent={ClientDashboardCard}
        ExpandedModalComponent={FrameworkExpandedCardModal}
        expandedCardData={expandedCardData}
        expandedCard={expandedCard as any}
        onCloseExpandedCard={handleCloseExpandedCard}
      />
      <FrameworkDashboardCardModal
        isOpen={showModal}
        card={editingCard}
        meters={meters}
        meterElements={meterElements}
        powerColumns={powerColumns}
        loading={modalLoading}
        onClose={handleModalClose}
        onSubmit={handleDirectSubmit}
        onMeterSelect={fetchMeterElements}
      />
    </DashboardContext.Provider>
  );
};
