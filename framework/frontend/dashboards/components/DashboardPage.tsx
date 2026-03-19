import React, { useState, useCallback, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import type { DashboardCard as DashboardCardType, AggregatedData } from '../types/dashboard';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './DashboardPage.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

/**
 * Props for the framework DashboardPage component
 */
export interface DashboardPageProps {
  /** Array of dashboard cards to display */
  cards: DashboardCardType[];
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Current grid layout */
  layout: Layout[];
  /** Whether layout is being saved */
  savingLayout?: boolean;
  /** Callback when layout changes */
  onLayoutChange: (newLayout: Layout[]) => void;
  /** Callback to create a new card */
  onCreateCard: (e: React.MouseEvent) => void;
  /** Callback to refresh all cards */
  onRefresh: (e: React.MouseEvent) => void;
  /** Callback to edit a card */
  onEditCard: (card: DashboardCardType) => void;
  /** Callback to delete a card */
  onDeleteCard: (cardId: number) => void;
  /** Callback to expand a card */
  onExpandCard: (card: DashboardCardType) => void;
  /** Callback to refresh a specific card */
  onCardRefresh: (cardId: number) => void;
  /** Callback to drill down on a card */
  onDrillDown?: (cardId: number) => void;
  /** Callback to close error banner */
  onErrorClose?: () => void;
  /** Whether refresh is in progress */
  refreshing?: boolean;
  /** Card component to render */
  CardComponent: React.ComponentType<any>;
  /** Modal component for creating/editing cards */
  ModalComponent?: React.ComponentType<any>;
  /** Modal component for expanded card view */
  ExpandedModalComponent?: React.ComponentType<any>;
  /** Whether modal is open */
  showModal?: boolean;
  /** Card being edited (null for create) */
  editingCard?: DashboardCardType | null;
  /** Expanded card data */
  expandedCardData?: AggregatedData | null;
  /** Expanded card */
  expandedCard?: DashboardCardType | null;
  /** Callback to close modal */
  onModalClose?: () => void;
  /** Callback when modal succeeds */
  onModalSuccess?: (card: DashboardCardType) => void;
  /** Callback to close expanded card modal */
  onCloseExpandedCard?: () => void;
}

/**
 * Framework DashboardPage Component
 * 
 * Generic dashboard page component that manages card layout and orchestration.
 * All data and callbacks are provided through props - no API calls or business logic.
 * 
 * @example
 * ```tsx
 * <DashboardPage
 *   cards={cards}
 *   loading={loading}
 *   error={error}
 *   layout={layout}
 *   onLayoutChange={handleLayoutChange}
 *   onCreateCard={handleCreateCard}
 *   onRefresh={handleRefresh}
 *   onEditCard={handleEditCard}
 *   onDeleteCard={handleDeleteCard}
 *   onExpandCard={handleExpandCard}
 *   onCardRefresh={handleCardRefresh}
 *   CardComponent={DashboardCard}
 *   ModalComponent={DashboardCardModal}
 *   ExpandedModalComponent={ExpandedCardModal}
 * />
 * ```
 */
export const DashboardPage: React.FC<DashboardPageProps> = ({
  cards,
  loading,
  error,
  layout,
  savingLayout = false,
  onLayoutChange,
  onCreateCard,
  onRefresh,
  onEditCard,
  onDeleteCard,
  onExpandCard,
  onCardRefresh,
  onDrillDown,
  onErrorClose,
  refreshing = false,
  CardComponent,
  ModalComponent,
  ExpandedModalComponent,
  showModal = false,
  editingCard = null,
  expandedCardData = null,
  expandedCard = null,
  onModalClose,
  onModalSuccess,
  onCloseExpandedCard,
}) => {
  const [localLayout, setLocalLayout] = useState<Layout[]>(layout);
  const [prevCardIds, setPrevCardIds] = useState<string[]>(layout.map(l => l.i));

  // Sync localLayout when layout prop changes (detect new/removed cards)
  useEffect(() => {
    const currentCardIds = layout.map(l => l.i);
    const cardCountChanged = currentCardIds.length !== prevCardIds.length;
    const newCardsAdded = currentCardIds.some(id => !prevCardIds.includes(id));
    const cardsRemoved = prevCardIds.some(id => !currentCardIds.includes(id));

    if (cardCountChanged || newCardsAdded || cardsRemoved) {
      setLocalLayout(layout);
      setPrevCardIds(currentCardIds);
    }
  }, [layout]);

  // Handle layout change
  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    setLocalLayout(newLayout);
    onLayoutChange(newLayout);
  }, [onLayoutChange]);

  return (
    <div className="dashboard-page">
      {/* Page Header */}
      <div className="dashboard-page__header">
        <div className="dashboard-page__title-section">
          <h1 className="dashboard-page__title">Dashboard</h1>
        </div>
        <div className="dashboard-page__header-actions">
          <button
            type="button"
            className="dashboard-page__btn dashboard-page__btn--primary"
            onClick={onCreateCard}
            title="Create a new dashboard card"
          >
            ➕ Create Card
          </button>
          <button
            type="button"
            className="dashboard-page__btn dashboard-page__btn--secondary"
            onClick={onRefresh}
            disabled={refreshing}
            title="Refresh all cards"
          >
            {refreshing ? (
              <>
                <span className="dashboard-page__spinner">⟳</span>
                Refreshing...
              </>
            ) : (
              <>
                🔄 Refresh All
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="dashboard-page__error-banner">
          <p>{error}</p>
          <button
            type="button"
            className="dashboard-page__error-close"
            onClick={onErrorClose}
            aria-label="Close error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="dashboard-page__loading">
          <div className="dashboard-page__loading-spinner"></div>
          <p>Loading dashboard cards...</p>
        </div>
      ) : cards.length === 0 ? (
        /* Empty State */
        <div className="dashboard-page__empty">
          <div className="dashboard-page__empty-icon">📊</div>
          <h2 className="dashboard-page__empty-title">No Dashboard Cards Yet</h2>
          <p className="dashboard-page__empty-description">
            Create your first dashboard card to start monitoring your metrics.
          </p>
          <button
            type="button"
            className="dashboard-page__btn dashboard-page__btn--primary"
            onClick={onCreateCard}
          >
            ➕ Create Your First Card
          </button>
        </div>
      ) : (
        /* Cards Grid */
        <ResponsiveGridLayout
          className="dashboard-page__cards-grid"
          layout={localLayout}
          layouts={{ lg: localLayout }}
          onLayoutChange={handleLayoutChange}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={60}
          isDraggable={!savingLayout}
          isResizable={!savingLayout}
          compactType={null}
          preventCollision={true}
          useCSSTransforms={true}
          draggableHandle=".dashboard-page__drag-handle"
        >
          {cards.map((card) => (
            <div key={card.id?.toString()} className="dashboard-page__card-wrapper">
              <CardComponent
                card={card}
                onEdit={onEditCard}
                onDelete={onDeleteCard}
                onDrillDown={onDrillDown}
                onRefresh={onCardRefresh}
                onExpand={onExpandCard}
              />
            </div>
          ))}
        </ResponsiveGridLayout>
      )}

      {/* Dashboard Card Modal */}
      {ModalComponent && (
        <ModalComponent
          isOpen={showModal}
          card={editingCard}
          onClose={onModalClose}
          onSuccess={onModalSuccess}
        />
      )}

      {/* Expanded Card Modal */}
      {ExpandedModalComponent && expandedCard && (
        <ExpandedModalComponent
          card={expandedCard}
          data={expandedCardData}
          onClose={onCloseExpandedCard}
        />
      )}
    </div>
  );
};
