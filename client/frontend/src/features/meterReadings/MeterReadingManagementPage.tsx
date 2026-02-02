/**
 * Meter Reading Management Page
 * 
 * Read-only view for meter readings
 * Uses EntityManagementPage but without form/create/edit functionality
 */

console.log('[MeterReadingManagementPage.tsx] Module loaded at', new Date().toISOString());

import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MeterReadingList } from './MeterReadingList';
import { MeterReadingForm } from './MeterReadingForm';
import { DetailedMeterReadingView } from './DetailedMeterReadingView';
import { useMeterReadingsEnhanced } from './meterReadingsStore';
import { useMeterSelection } from '../../contexts/MeterSelectionContext';
import { useAuth } from '../../hooks/useAuth';
import { meterReadingService } from '../../services/meterReadingService';
import { adaptMeterReading, type MeterInfo, type MeterReadingData } from './meterReadingAdapter';

export const MeterReadingManagementPage: React.FC = () => {
  console.log('[MeterReadingManagementPage] RENDERING');
  const store = useMeterReadingsEnhanced();
  const { setSelectedMeter, setSelectedElement } = useMeterSelection();
  const auth = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [gridType, setGridType] = React.useState<'simple' | 'baselist'>('simple');
  const [showForm, setShowForm] = React.useState(false);
  const [showDetailedView, setShowDetailedView] = React.useState(false);
  const [detailedReading, setDetailedReading] = React.useState<{ meterInfo: MeterInfo; reading: MeterReadingData } | null>(null);
  const [detailedViewLoading, setDetailedViewLoading] = React.useState(false);
  const [detailedViewError, setDetailedViewError] = React.useState<string | null>(null);

  const meterId = searchParams.get('meterId');
  const elementId = searchParams.get('elementId');
  const elementName = searchParams.get('elementName');
  const elementNumber = searchParams.get('elementNumber');
  const urlGridType = searchParams.get('gridType') as 'simple' | 'baselist' | null;

  console.log('[MeterReadingManagementPage] URL params - meterId:', meterId, 'elementId:', elementId, 'elementName:', elementName, 'elementNumber:', elementNumber, 'gridType:', urlGridType);
  console.log('[MeterReadingManagementPage] auth.user?.client:', auth.user?.client);

  // Set context values from URL params and fetch readings
  React.useEffect(() => {
    console.log('[MeterReadingManagementPage] ===== EFFECT TRIGGERED =====');
    console.log('[MeterReadingManagementPage] meterId:', meterId, 'elementId:', elementId, 'tenantId:', auth.user?.client);
    console.log('[MeterReadingManagementPage] meterId type:', typeof meterId, 'elementId type:', typeof elementId);
    
    if (meterId && auth.user?.client) {
      console.log('[MeterReadingManagementPage] Conditions met, setting context and fetching');
      setSelectedMeter(meterId);
      if (elementId) {
        const parsedElementNumber = elementNumber ? parseInt(elementNumber) : undefined;
        setSelectedElement(elementId, elementName || undefined, parsedElementNumber);
      }
      
      // Set gridType from URL if provided
      if (urlGridType) {
        console.log('[MeterReadingManagementPage] Setting gridType from URL:', urlGridType);
        setGridType(urlGridType);
      }
      
      // NOTE: showForm is no longer used when gridType === 'simple'
      // The detailed view is now handled by the second useEffect
      setShowForm(false);
      
      const fetchParams = {
        tenantId: auth.user.client,
        meterId: meterId,
        meterElementId: elementId || undefined,
      };
      console.log('[MeterReadingManagementPage] Calling fetchItems with:', fetchParams);
      store.fetchItems(fetchParams);
      console.log('[MeterReadingManagementPage] ===== EFFECT COMPLETE =====');
    } else {
      console.log('[MeterReadingManagementPage] Conditions NOT met - meterId:', meterId, 'tenantId:', auth.user?.client);
    }
  }, [meterId, elementId, elementName, elementNumber, auth.user?.client, urlGridType]);

  /**
   * Fetch last meter reading when showing detailed view (favorite clicked)
   */
  React.useEffect(() => {
    console.log('[MeterReadingManagementPage] ===== DETAILED VIEW EFFECT TRIGGERED =====');
    console.log('[MeterReadingManagementPage] urlGridType:', urlGridType, 'meterId:', meterId, 'elementId:', elementId, 'tenantId:', auth.user?.client);
    
    const fetchLastReading = async () => {
      if (urlGridType === 'simple' && meterId && elementId && auth.user?.client) {
        console.log('[MeterReadingManagementPage] Conditions met for detailed view, fetching...');
        setDetailedViewLoading(true);
        setDetailedViewError(null);
        setShowDetailedView(true);
        
        try {
          console.log('[MeterReadingManagementPage] Fetching last reading for:', { meterId, elementId, tenantId: auth.user.client });
          const rawReading = await meterReadingService.getLastMeterReading(
            auth.user.client,
            meterId,
            elementId
          );
          
          console.log('[MeterReadingManagementPage] Raw reading received:', rawReading);
          const adaptedData = adaptMeterReading(rawReading);
          console.log('[MeterReadingManagementPage] Adapted reading:', adaptedData);
          
          setDetailedReading(adaptedData);
          setDetailedViewLoading(false);
        } catch (error) {
          console.error('[MeterReadingManagementPage] Error fetching last reading:', error);
          setDetailedViewError(error instanceof Error ? error.message : 'Failed to load meter reading');
          setDetailedViewLoading(false);
        }
      } else {
        console.log('[MeterReadingManagementPage] Conditions NOT met for detailed view');
        console.log('[MeterReadingManagementPage] urlGridType === simple?', urlGridType === 'simple');
        console.log('[MeterReadingManagementPage] meterId?', !!meterId);
        console.log('[MeterReadingManagementPage] elementId?', !!elementId);
        console.log('[MeterReadingManagementPage] tenantId?', !!auth.user?.client);
        setShowDetailedView(false);
        setDetailedReading(null);
      }
    };
    
    fetchLastReading();
  }, [meterId, elementId, auth.user?.client, urlGridType]);

  /**
   * Handle navigation to the meter reading list
   */
  const handleNavigateToList = React.useCallback(() => {
    const params = new URLSearchParams();
    if (meterId) params.set('meterId', meterId);
    if (elementId) params.set('elementId', elementId);
    if (elementName) params.set('elementName', elementName);
    if (elementNumber) params.set('elementNumber', elementNumber);
    params.set('gridType', 'baselist');
    navigate(`/meter-readings?${params.toString()}`);
  }, [meterId, elementId, elementName, elementNumber, navigate]);

  console.log('[MeterReadingManagementPage] ===== RENDER DECISION =====');
  console.log('[MeterReadingManagementPage] showDetailedView:', showDetailedView);
  console.log('[MeterReadingManagementPage] showForm:', showForm);
  console.log('[MeterReadingManagementPage] elementId:', elementId);
  console.log('[MeterReadingManagementPage] detailedReading:', !!detailedReading);
  console.log('[MeterReadingManagementPage] detailedViewLoading:', detailedViewLoading);
  console.log('[MeterReadingManagementPage] detailedViewError:', detailedViewError);

  return (
    <div className="meter-reading-management-page">
      {showDetailedView && elementId ? (
        <>
          {console.log('[MeterReadingManagementPage] Rendering detailed view branch')}
          {detailedReading ? (
            <>
              {console.log('[MeterReadingManagementPage] Rendering DetailedMeterReadingView component')}
              <DetailedMeterReadingView
                meterInfo={detailedReading.meterInfo}
                reading={detailedReading.reading}
                loading={detailedViewLoading}
                error={detailedViewError}
              />
            </>
          ) : (
            <>
              {console.log('[MeterReadingManagementPage] Rendering loading/error state')}
              <div className="detailed-view-loading">
                {detailedViewLoading ? (
                  <p>Loading meter reading...</p>
                ) : detailedViewError ? (
                  <div className="detailed-view-error">
                    <p>Error: {detailedViewError}</p>
                    <button onClick={handleNavigateToList}>View All Readings</button>
                  </div>
                ) : (
                  <p>Initializing...</p>
                )}
              </div>
            </>
          )}
        </>
      ) : showForm && elementId ? (
        <>
          {console.log('[MeterReadingManagementPage] Rendering MeterReadingForm')}
          <MeterReadingForm 
            meterElementId={elementId}
            onNavigateToList={handleNavigateToList}
          />
        </>
      ) : (
        <>
          {console.log('[MeterReadingManagementPage] Rendering MeterReadingList')}
          <MeterReadingList gridType={gridType} onGridTypeChange={setGridType} />
        </>
      )}
    </div>
  );
};
