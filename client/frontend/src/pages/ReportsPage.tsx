import React, { useState } from 'react';
import { ReportList, ReportForm } from '../features/reports';
import { useReportsEnhanced } from '../features/reports';
import type { Report } from '../features/reports/types';
import { FormModal } from '@framework/components/modal';
import './ReportsPage.css';

type ViewMode = 'list' | 'create' | 'edit' | 'view';

const allowedAuth = { checkPermission: () => true as boolean, user: undefined };

const ReportsPage: React.FC<{ isAdmin?: boolean }> = ({ isAdmin = false }) => {
  const reports = useReportsEnhanced();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const handleCreateReport = () => {
    setSelectedReport(null);
    setViewMode('create');
  };

  const handleEditReport = (report: any) => {
    setSelectedReport(report);
    setViewMode('edit');
  };

  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    setViewMode('view');
  };

  const handleFormSubmit = async (_data: any) => {
    // BaseForm already saved via the store — just close and refresh the list
    setViewMode('list');
    setSelectedReport(null);
    await reports.fetchItems();
  };

  const handleFormCancel = () => {
    setViewMode('list');
    setSelectedReport(null);
  };

  const renderReportDetails = (report: Report) => (
    <div className="report-details">
      <div className="report-details__header">
        <h3>{report.name}</h3>
        <div className="report-details__actions">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => handleEditReport(report)}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => setViewMode('list')}
          >
            Back to List
          </button>
        </div>
      </div>

      <div className="report-details__content">
        <div className="detail-section">
          <h4>Basic Information</h4>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Name:</label>
              <span>{report.name}</span>
            </div>
            <div className="detail-item">
              <label>Type:</label>
              <span className={`badge badge--${report.type}`}>
                {report.type}
              </span>
            </div>
            <div className="detail-item">
              <label>Status:</label>
              <span className={`status-indicator status-indicator--${report.active ? 'active' : 'inactive'}`}>
                <span className={`status-dot status-dot--${report.active ? 'active' : 'inactive'}`}></span>
                {report.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h4>Schedule</h4>
          <div className="detail-grid">
            <div className="detail-item detail-item--full">
              <label>Cron Expression:</label>
              <code className="schedule-code">{report.schedule}</code>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h4>Recipients</h4>
          <div className="detail-grid">
            <div className="detail-item detail-item--full">
              <label>Email Recipients:</label>
              {Array.isArray(report.recipients) && report.recipients.length > 0 ? (
                <ul className="recipients-list">
                  {report.recipients.map((email, idx) => (
                    <li key={idx} className="recipient-item">{email}</li>
                  ))}
                </ul>
              ) : (
                <span className="no-recipients">No recipients configured</span>
              )}
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h4>Metadata</h4>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Created:</label>
              <span>{new Date(report.created_at).toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <label>Last Updated:</label>
              <span>{new Date(report.updated_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="reports-page">
      <div className="page-content">
        {viewMode === 'list' && (
          <ReportList
            onReportCreate={handleCreateReport}
            onReportEdit={handleEditReport}
            onReportSelect={handleViewReport}
            authContext={isAdmin ? allowedAuth : undefined}
          />
        )}

        {viewMode === 'view' && selectedReport && renderReportDetails(selectedReport)}
      </div>

      {/* Create/Edit Modal */}
      {(viewMode === 'create' || viewMode === 'edit') && (
        <FormModal
          isOpen={true}
          title={viewMode === 'create' ? 'Create Report' : 'Edit Report'}
          onClose={handleFormCancel}
          onSubmit={() => { }} // No-op since form handles its own submission
          size="lg"
          showSaveButton={true}
          saveLabel="Save"
        >
          <ReportForm
            report={selectedReport || undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            hideMeters={isAdmin}
          />
        </FormModal>
      )}
    </div>
  );
};

export default ReportsPage;
