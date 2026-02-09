import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DuplicateIcon from '@mui/icons-material/ContentCopy';
import PreviewIcon from '@mui/icons-material/Visibility';
import MoreIcon from '@mui/icons-material/MoreVert';
import ExportIcon from '@mui/icons-material/FileDownload';
import ImportIcon from '@mui/icons-material/FileUpload';
import { DataTable } from '@framework/components/list';
import { SearchFilter, LoadingSpinner, Toast } from '@framework/components/common';
import { templateService } from '../../services/templateService';
import { useAuth } from '../../hooks/useAuth';
import { Permission } from '../../types/auth';
import type { EmailTemplate, ListParams } from '../../types/entities';
import './TemplateList.css';

interface EmailTemplateListProps {
  onEditTemplate?: (template: EmailTemplate) => void;
  onCreateTemplate?: () => void;
  onPreviewTemplate?: (template: EmailTemplate) => void;
}

export const EmailTemplateList: React.FC<EmailTemplateListProps> = ({
  onEditTemplate,
  onCreateTemplate,
  onPreviewTemplate
}) => {
  const { checkPermission } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy] = useState<string>('updatedAt');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Check permissions
  const canCreate = checkPermission(Permission.TEMPLATE_CREATE);
  const canDelete = checkPermission(Permission.TEMPLATE_DELETE);
  const canExport = checkPermission(Permission.TEMPLATE_READ); // Assuming export requires read permission

  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateName, setDuplicateName] = useState('');

  // Toast state
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: ListParams = {
        page,
        pageSize,
        sortBy,
        sortOrder,
        filters,
        search: searchQuery,
      };
      const result = await templateService.getTemplates(params);
      setTemplates(result?.items || []);
      setTotal(result?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
      setTemplates([]); // Ensure templates is always an array
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortBy, sortOrder, filters, searchQuery]);

  useEffect(() => {
    loadTemplates();
  }, [page, pageSize, sortBy, sortOrder, searchQuery, JSON.stringify(filters)]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filtering
  };



  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, template: EmailTemplate) => {
    setAnchorEl(event.currentTarget);
    setSelectedTemplate(template);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTemplate(null);
  };

  const handleEdit = () => {
    if (selectedTemplate && onEditTemplate) {
      onEditTemplate(selectedTemplate);
    }
    handleMenuClose();
  };

  const handlePreview = () => {
    if (selectedTemplate && onPreviewTemplate) {
      onPreviewTemplate(selectedTemplate);
    }
    handleMenuClose();
  };

  const handleDuplicate = () => {
    if (selectedTemplate) {
      setDuplicateName(`${selectedTemplate.name} (Copy)`);
      setDuplicateDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const confirmDuplicate = async () => {
    if (!selectedTemplate || !duplicateName.trim() || !canCreate) return;

    try {
      await templateService.duplicateTemplate(selectedTemplate.id, duplicateName.trim());
      setToast({ message: 'Template duplicated successfully', severity: 'success' });
      loadTemplates();
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Failed to duplicate template',
        severity: 'error'
      });
    } finally {
      setDuplicateDialogOpen(false);
      setDuplicateName('');
    }
  };

  const confirmDelete = async () => {
    if (!selectedTemplate || !canDelete) return;

    try {
      await templateService.deleteTemplate(selectedTemplate.id);
      setToast({ message: 'Template deleted successfully', severity: 'success' });
      loadTemplates();
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Failed to delete template',
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleExport = async () => {
    if (!canExport) return;

    try {
      const blob = await templateService.exportTemplates();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `email-templates-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setToast({ message: 'Templates exported successfully', severity: 'success' });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Failed to export templates',
        severity: 'error'
      });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await templateService.importTemplates(file);
      setToast({
        message: `Imported ${result.imported} templates successfully`,
        severity: 'success'
      });
      if (result.errors.length > 0) {
        console.warn('Import errors:', result.errors);
      }
      loadTemplates();
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Failed to import templates',
        severity: 'error'
      });
    }

    // Reset file input
    event.target.value = '';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'draft': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (template: EmailTemplate) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {template.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {template.category}
          </Typography>
        </Box>
      )
    },
    {
      key: 'subject',
      label: 'Subject',
      sortable: true,
      render: (template: EmailTemplate) => (
        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
          {template.subject}
        </Typography>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (template: EmailTemplate) => (
        <Chip
          label={template.status}
          color={getStatusColor(template.status) as any}
          size="small"
        />
      )
    },
    {
      key: 'usageCount',
      label: 'Usage',
      sortable: true,
      render: (template: EmailTemplate) => (
        <Typography variant="body2">
          {template.usageCount}
        </Typography>
      )
    },
    {
      key: 'lastUsed',
      label: 'Last Used',
      sortable: true,
      render: (template: EmailTemplate) => (
        <Typography variant="body2" color="text.secondary">
          {template.lastUsed ? formatDate(template.lastUsed) : 'Never'}
        </Typography>
      )
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      sortable: true,
      render: (template: EmailTemplate) => (
        <Typography variant="body2" color="text.secondary">
          {formatDate(template.updatedAt)}
        </Typography>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (template: EmailTemplate) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Preview">
            <IconButton
              size="small"
              onClick={() => onPreviewTemplate?.(template)}
            >
              <PreviewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => onEditTemplate?.(template)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton
            size="small"
            onClick={(e) => handleMenuOpen(e, template)}
          >
            <MoreIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  const filterOptions = [
    {
      key: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'draft', label: 'Draft' }
      ]
    },
    {
      key: 'category',
      label: 'Category',
      type: 'select' as const,
      options: [
        { value: 'meter_readings', label: 'Meter Readings' },
        { value: 'meter_errors', label: 'Meter Errors' },
        { value: 'maintenance', label: 'Maintenance' },
        { value: 'general', label: 'General' }
      ]
    }
  ];

  if (loading && templates.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <Box className="template-list">
      <Box className="template-list-header">
        <Typography variant="h5" component="h1">
          Email Templates
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <input
            accept=".json"
            className="template-import-hidden-input"
            id="import-file"
            type="file"
            onChange={handleImport}
          />
          <label htmlFor="import-file">
            <Button
              variant="outlined"
              component="span"
              startIcon={<ImportIcon />}
              size="small"
            >
              Import
            </Button>
          </label>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExport}
            size="small"
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateTemplate}
          >
            Create Template
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <SearchFilter
        onSearch={handleSearch}
        onFilter={handleFilterChange}
        onClear={() => {
          setSearchQuery('');
          setFilters({});
        }}
        filters={filterOptions}
        placeholder="Search templates..."
      />



      <DataTable
        columns={columns}
        data={templates || []}
        loading={loading}
        emptyMessage="No templates found"
        pagination={{
          total,
          currentPage: page,
          pageSize,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
          showSizeChanger: true,
          pageSizeOptions: [10, 25, 50, 100]
        }}
      />

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handlePreview}>
          <PreviewIcon fontSize="small" sx={{ mr: 1 }} />
          Preview
        </MenuItem>
        <MenuItem onClick={handleDuplicate}>
          <DuplicateIcon fontSize="small" sx={{ mr: 1 }} />
          Duplicate
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Template</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedTemplate?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Duplicate Dialog */}
      <Dialog open={duplicateDialogOpen} onClose={() => setDuplicateDialogOpen(false)}>
        <DialogTitle>Duplicate Template</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Template Name"
            fullWidth
            variant="outlined"
            value={duplicateName}
            onChange={(e) => setDuplicateName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDuplicateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmDuplicate}
            variant="contained"
            disabled={!duplicateName.trim()}
          >
            Duplicate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.severity === 'error' ? 'error' : toast.severity === 'success' ? 'success' : 'info'}
          onClose={() => setToast(null)}
        />
      )}
    </Box>
  );
};
