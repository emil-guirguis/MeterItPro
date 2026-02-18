import React, { useState, useEffect, useCallback } from 'react';
import type { Layout } from 'react-grid-layout';
import { DashboardPage as FrameworkDashboardPage } from '@framework/dashboards/components/DashboardPage';
import { DashboardCard as FrameworkDashboardCard } from '@framework/dashboards/components/DashboardCard';
import { DashboardCardModal as FrameworkDashboardCardModal } from '@framework/dashboards/components/DashboardCardModal';
import { ExpandedCardModal as FrameworkExpandedCardModal } from '@framework/dashboards/components/ExpandedCardModal';
import { Visualization } from '@framework/dashboards/components/Visualization';
import type { DashboardCard as FrameworkDashboardCardType } from '@framework/dashboards/types';
import { dashboardService, type DashboardCard as DashboardCardType, type AggregatedData } from '../services/dashboardService';
import './DashboardPage.css';

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
      console.log('📊 [DashboardPage] API Response:', response);
      console.log('📊 [DashboardPage] Cards received:', response.items.length);
      setCards(response.items);
      
      // Initialize layout from card positions - use pixel values from API
      const newLayout: Layout[] = response.items.map((card, index) => ({
        i: card.dashboard_id.toString(),
        x: card.grid_x ?? 0,
        y: card.grid_y ?? (index * 520),
        w: card.grid_w ?? 300,
        h: card.grid_h ?? 500,
        static: false,
      }));
      setLayout(newLayout);
      console.log('📊 [DashboardPage] Layout initialized:', newLayout);
      console.log('📊 [DashboardPage] Cards with grid properties:', response.items.map(c => ({
        id: c.dashboard_id,
        grid_x: c.grid_x,
        grid_y: c.grid_y,
        grid_w: c.grid_w,
        grid_h: c.grid_h
      })));

      // Fetch data for each card
      response.items.forEach((card) => {
        fetchCardData(card.dashboard_id);
      });
      
      // Mark initial load as complete - now we can save layout changes
      isInitialLoadRef.current = false;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch dashboard cards';
      setError(errorMsg);
      console.error('❌ [DashboardPage] Error fetching dashboard cards:', err);
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Load cards on mount
  useEffect(() => {
    console.log('📊 [DashboardPage] useEffect: Loading cards on mount');
    fetchCards();
    fetchMeters();
    fetchPowerColumns();
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

  // Fetch meter elements for the selected meter
  const fetchMeterElements = useCallback(async (meterId: number) => {
    try {
      console.log('📋 [DashboardPage] Fetching meter elements for meter:', meterId);
      const elementsData = await dashboardService.getMeterElementsByMeter(meterId);
      console.log('📋 [DashboardPage] Meter elements received:', elementsData);
      setMeterElements(elementsData);
    } catch (err) {
      console.error('❌ [DashboardPage] Error fetching meter elements:', err);
      setMeterElements([]);
    }
  }, []);

  // Fetch power columns for the modal
  const fetchPowerColumns = useCallback(async () => {
    try {
      const columnsData = await dashboardService.getPowerColumns();
      setPowerColumns(columnsData);
    } catch (err) {
      console.error('Error fetching power columns:', err);
    }
  }, []);

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
      // Fetch meter elements before opening modal to avoid flash
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
    if (editingCard) {
      // Update existing card in list
      setCards(cards.map(c => c.dashboard_id === card.dashboard_id ? card : c));
    } else {
      // Add new card to list
      setCards([...cards, card]);
      // Fetch data for the new card
      fetchCardData(card.dashboard_id);
    }
    handleModalClose();
  };

  // Handle layout change - DISABLED - do not save layout changes
  const handleLayoutChange = async (newLayout: Layout[]) => {
    // Skip layout changes during initial load - react-grid-layout fires this on mount
    if (isInitialLoadRef.current) {
      console.log('📊 [DashboardPage] Layout change during initial load - IGNORING');
      return;
    }
    
    // DO NOT SAVE - just update local state
    setLayout(newLayout);
    console.log('📊 [DashboardPage] Layout changed but NOT saving to database');
  };

  // Handle delete card
  const handleDeleteCard = async (cardId: number | string) => {
    const numCardId = typeof cardId === 'string' ? parseInt(cardId) : cardId;
    try {
      await dashboardService.deleteDashboardCard(numCardId);
      setCards(cards.filter(c => c.dashboard_id !== numCardId));
      setCardDataMap(prev => {
        const newMap = { ...prev };
        delete newMap[numCardId];
        return newMap;
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete card';
      setError(errorMsg);
      console.error('Error deleting card:', err);
    }
  };

  // Handle drill-down
  const handleDrillDown = (cardId: number | string) => {
    // TODO: Navigate to detailed readings view
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

  // Handle visualization change
  const handleVisualizationChange = async (cardId: number | string, newType: string) => {
    const numCardId = typeof cardId === 'string' ? parseInt(cardId) : cardId;
    try {
      const card = cards.find(c => c.dashboard_id === numCardId);
      if (card) {
        await dashboardService.updateDashboardCard(numCardId, {
          visualization_type: newType as any
        });
        setCards(cards.map(c => 
          c.dashboard_id === numCardId 
            ? { ...c, visualization_type: newType as any }
            : c
        ));
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update visualization';
      setError(errorMsg);
      console.error('Error updating visualization:', err);
    }
  };

  // Handle grouping change
  const handleGroupingChange = async (cardId: number | string, newGrouping: string) => {
    const numCardId = typeof cardId === 'string' ? parseInt(cardId) : cardId;
    try {
      const card = cards.find(c => c.dashboard_id === numCardId);
      if (card) {
        await dashboardService.updateDashboardCard(numCardId, {
          grouping_type: newGrouping as any
        });
        setCards(cards.map(c => 
          c.dashboard_id === numCardId 
            ? { ...c, grouping_type: newGrouping as any }
            : c
        ));
        // Refresh card data with new grouping
        fetchCardData(numCardId);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update grouping';
      setError(errorMsg);
      console.error('Error updating grouping:', err);
    }
  };

  // Handle time frame change
  const handleTimeFrameChange = async (cardId: number | string, newTimeFrame: string) => {
    const numCardId = typeof cardId === 'string' ? parseInt(cardId) : cardId;
    try {
      const card = cards.find(c => c.dashboard_id === numCardId);
      if (card) {
        await dashboardService.updateDashboardCard(numCardId, {
          time_frame_type: newTimeFrame as any
        });
        setCards(cards.map(c => 
          c.dashboard_id === numCardId 
            ? { ...c, time_frame_type: newTimeFrame as any }
            : c
        ));
        // Refresh card data with new time frame
        fetchCardData(numCardId);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update time frame';
      setError(errorMsg);
      console.error('Error updating time frame:', err);
    }
  };

  // Create a wrapper component for the framework DashboardCard that provides data
  const ClientDashboardCard: React.FC<any> = ({ card, ...props }) => {
    const cardData = cardDataMap[card.dashboard_id] || null;
    const cardLoading = cardLoadingMap[card.dashboard_id] || false;
    const cardError = cardErrorMap[card.dashboard_id] || null;

    // Convert client card to framework card format
    const frameworkCard: FrameworkDashboardCardType = {
      id: card.dashboard_id,
      title: card.card_name,
      description: card.card_description,
      visualization_type: card.visualization_type,
      grid_x: card.grid_x,
      grid_y: card.grid_y,
      grid_w: card.grid_w,
      grid_h: card.grid_h,
      // Include client-specific properties for callbacks
      ...card,
    };

    return (
      <FrameworkDashboardCard
        card={frameworkCard}
        data={cardData}
        loading={cardLoading}
        error={cardError}
        VisualizationComponent={Visualization}
        onVisualizationChange={handleVisualizationChange}
        onGroupingChange={handleGroupingChange}
        onTimeFrameChange={handleTimeFrameChange}
        onEdit={props.onEdit}
        onDelete={props.onDelete}
        onRefresh={props.onRefresh}
        onExpand={props.onExpand}
      />
    );
  };

  // Create a wrapper component for the modal that provides meters, elements, and power columns
  const ClientDashboardCardModal = React.memo(({ isOpen, card, onClose, onSuccess }: any) => {
    const handleSubmit = useCallback(async (data: any) => {
      try {
        setModalLoading(true);
        let result;
        if (card) {
          result = await dashboardService.updateDashboardCard(card.dashboard_id, data);
        } else {
          result = await dashboardService.createDashboardCard(data);
        }
        onSuccess?.(result);
      } catch (err) {
        console.error('Error saving card:', err);
      } finally {
        setModalLoading(false);
      }
    }, [card, onSuccess]);

    return (
      <FrameworkDashboardCardModal
        isOpen={isOpen}
        card={card}
        meters={meters}
        meterElements={meterElements}
        powerColumns={powerColumns}
        loading={modalLoading}
        onClose={onClose}
        onSubmit={handleSubmit}
        onMeterSelect={fetchMeterElements}
      />
    );
  }, (prevProps, nextProps) => {
    // Only re-render if these props change
    return prevProps.isOpen === nextProps.isOpen &&
           prevProps.card === nextProps.card &&
           prevProps.onClose === nextProps.onClose &&
           prevProps.onSuccess === nextProps.onSuccess &&
           prevProps.meterElements === nextProps.meterElements &&
           prevProps.meters === nextProps.meters &&
           prevProps.powerColumns === nextProps.powerColumns &&
           prevProps.loading === nextProps.loading;
  });

  return (
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
      ModalComponent={ClientDashboardCardModal}
      ExpandedModalComponent={FrameworkExpandedCardModal}
      showModal={showModal}
      editingCard={editingCard as any}
      expandedCardData={expandedCardData}
      expandedCard={expandedCard as any}
      onModalClose={handleModalClose}
      onModalSuccess={handleModalSuccess as any}
      onCloseExpandedCard={handleCloseExpandedCard}
    />
  );
};
