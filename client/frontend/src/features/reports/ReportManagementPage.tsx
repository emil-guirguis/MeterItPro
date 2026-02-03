import React, { useState, useCallback } from 'react';
import { AppLayoutWrapper as AppLayout } from '../../components/layout';
import { FormModal } from '@framework/components/modal';
import { useReportsEnhanced } from './reportsStore';
import { useAuth } from '../../hooks/useAuth';
import { Permission } from '../../types/auth';
import './ReportManagementPage.css'
import type { Report } from '../../services/reportingService';

export const ReportManagementPage: React.FC<{ onReportSelect?: (reportId: string) => void }> = () => {
  const { checkPermission } = useAuth();
  const reports = useReportsEnhanced();

    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);

      // Check permissions
      const canUpdate = checkPermission(Permission.REPORT_UPDATE);
  
  // Handle report editing
  const handleReportEdit = useCallback((report: Report) => {
    if (!canUpdate) return;
    setSelectedReport(report);
    setShowEditModal(true);
  }, [canUpdate]);

  // Handle form submission for creating report
  const handleCreateSubmit = useCallback(async (reportData: Partial<Report>) => {
    try {
      await reports.createReport(reportData);
      setShowCreateModal(false);
      setSelectedReport(null);
    } catch (error) {
      // Error is handled by the store and displayed in the form
      throw error;
    }
  }, [reports]);

  // Handle form submission for updating report
  const handleUpdateSubmit = useCallback(async (reportData: Partial<Report>) => {
    if (!selectedReport) return;
    
    try {
      // Use _id if id is not available (legacy compatibility)
      const reportId = selectedReport.report_id || (selectedReport as any)._id;
      await reports.updateReport(reportId, reportData);
      setShowEditModal(false);
      setSelectedReport(null);
    } catch (error) {
      // Error is handled by the store and displayed in the form
      throw error;
    }
  }, [selectedReport, reports]);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setSelectedReport(null);
  }, []);

  // Breadcrumb configuration
  const breadcrumbs = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Report Management', path: '/reports' },
  ];

  return (
    <AppLayout 
      title="Report Management" 
      breadcrumbs={breadcrumbs}
    >
      <div className="report-management-page">
        {/* Report list would go here - ReportList component needs to be created */}
        <div className="report-list-placeholder">
          <p>Report list component to be implemented</p>
        </div>

        {/* Create Report Modal */}
        <FormModal
          isOpen={showCreateModal}
          title="Create New Report"
          onClose={handleModalClose}
          onSubmit={handleCreateSubmit}
          loading={reports.loading}
          error={reports.error || undefined}
          size="lg"
          showSaveButton={true}
        >
          {/* Report form would go here - ReportForm component needs to be created */}
          <div className="report-form-placeholder">
            <p>Report form component to be implemented</p>
          </div>
        </FormModal>

        {/* Edit Report Modal */}
        <FormModal
          isOpen={showEditModal}
          title={`Edit Report: ${selectedReport?.name || ''}`}
          data={selectedReport || undefined}
          onClose={handleModalClose}
          onSubmit={handleUpdateSubmit}
          loading={reports.loading}
          error={reports.error || undefined}
          size="lg"
          showSaveButton={true}
        >
          {/* Report form would go here - ReportForm component needs to be created */}
          <div className="report-form-placeholder">
            <p>Report form component to be implemented</p>
          </div>
        </FormModal>

        {/* View Report Modal */}
        <FormModal
          isOpen={showViewModal}
          title={`Report Details: ${selectedReport?.name || ''}`}
          onClose={handleModalClose}
          onSubmit={() => Promise.resolve()}
          size="md"
        >
          <ReportDetails report={selectedReport} onEdit={() => {
            setShowViewModal(false);
            if (selectedReport) {
              handleReportEdit(selectedReport);
            }
          }} />
        </FormModal>
      </div>
    </AppLayout>
  );
};

// Report Details Component for View Modal
interface ReportDetailsProps {
  report: Report | null;
  onEdit: () => void;
}

const ReportDetails: React.FC<ReportDetailsProps> = ({ report, onEdit }) => {
  const { checkPermission } = useAuth();
  const canUpdate = checkPermission(Permission.REPORT_UPDATE);

  if (!report) return null;

  return (
    <div className="report-details">
      <div className="report-details__section">
        <h3 className="report-details__section-title">Basic Information</h3>
        <div className="report-details__grid">
          <div className="report-details__field">
            <label className="report-details__label">Name</label>
            <span className="report-details__value">{report.name}</span>
          </div>
          <div className="report-details__field">
            <label className="report-details__label">Type</label>
            <span className="report-details__value">{report.type}</span>
          </div>
          <div className="report-details__field">
            <label className="report-details__label">Schedule</label>
            <span className="report-details__value">{report.schedule}</span>
          </div>
          <div className="report-details__field">
            <label className="report-details__label">Status</label>
            <span className={`report-details__status report-details__status--${report.enabled}`}>
              {report.enabled ? '✅ Enabled' : '❌ Disabled'}
            </span>
          </div>
        </div>
      </div>

      <div className="report-details__section">
        <h3 className="report-details__section-title">Recipients</h3>
        <div className="report-details__recipients">
          {report.recipients.length > 0 ? (
            <div className="report-details__recipient-list">
              {report.recipients.map((recipient: string) => (
                <span key={recipient} className="report-details__recipient">
                  {recipient}
                </span>
              ))}
            </div>
          ) : (
            <span className="report-details__no-recipients">No recipients configured</span>
          )}
        </div>
      </div>

      <div className="report-details__section">
        <h3 className="report-details__section-title">Timestamps</h3>
        <div className="report-details__grid">
          <div className="report-details__field">
            <label className="report-details__label">Created</label>
            <span className="report-details__value">
              {new Date(report.created_at).toLocaleString()}
            </span>
          </div>
          <div className="report-details__field">
            <label className="report-details__label">Last Updated</label>
            <span className="report-details__value">
              {new Date(report.updated_at).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {canUpdate && (
        <div className="report-details__actions">
          <button
            type="button"
            onClick={onEdit}
            className="report-details__edit-btn"
          >
            ✏️ Edit Report
          </button>
        </div>
      )}
    </div>
  );
};