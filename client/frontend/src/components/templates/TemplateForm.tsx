import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,

  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PreviewIcon from '@mui/icons-material/Preview';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpIcon from '@mui/icons-material/Help';

import { LoadingSpinner, Toast } from '@framework/components/common';
import { TemplateEditor } from './TemplateEditor';
import { templateService } from '../../services/templateService';
import type { 
  EmailTemplate, 
  EmailTemplateCreateRequest, 
  EmailTemplateUpdateRequest,
  TemplateVariable 
} from '../../types/entities';
import './TemplateForm.css';

interface TemplateFormProps {
  template?: EmailTemplate;
  open: boolean;
  onClose: () => void;
  onSave: (template: EmailTemplate) => void;
}

const TEMPLATE_CATEGORIES = [
  { value: 'meter_readings', label: 'Meter Readings' },
  { value: 'meter_errors', label: 'Meter Errors' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'general', label: 'General' }
];

export const TemplateForm: React.FC<TemplateFormProps> = ({
  template,
  open,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    category: 'general',
    variables: [] as TemplateVariable[]
  });
  
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [availableVariables, setAvailableVariables] = useState<Record<string, any>>({});
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    variables: string[];
  } | null>(null);
  
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{
    subject: string;
    htmlContent: string;
    textContent?: string;
  } | null>(null);
  
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  // Initialize form data when template changes
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        subject: template.subject,
        content: template.content,
        category: template.category,
        variables: template.variables || []
      });
    } else {
      setFormData({
        name: '',
        subject: '',
        content: '',
        category: 'general',
        variables: []
      });
    }
    setValidationResult(null);
  }, [template]);

  const loadAvailableVariables = useCallback(async (category: string) => {
    try {
      // Load variables from backend for the selected category
      const vars = await templateService.getAvailableVariables(category);
      setAvailableVariables(vars || {});
    } catch (err) {
      console.warn('Failed to load available variables:', err);
      setAvailableVariables({});
    }
  }, []);

  // Load available variables when category changes
  useEffect(() => {
    if (formData.category) {
      loadAvailableVariables(formData.category);
    }
  }, [formData.category, loadAvailableVariables]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation when content changes
    if (field === 'content' || field === 'subject') {
      setValidationResult(null);
    }
  };

  const handleValidate = async () => {
    if (!formData.content.trim() || !formData.subject.trim()) {
      setToast({ message: 'Please enter both subject and content to validate', severity: 'warning' });
      return;
    }

    try {
      setValidating(true);
      const result = await templateService.validateTemplate(formData.content, formData.subject);
      setValidationResult(result);
      
      if (result.isValid) {
        setToast({ message: 'Template validation passed', severity: 'success' });
      } else {
        setToast({ message: 'Template validation failed', severity: 'error' });
      }
    } catch (err) {
      setToast({ 
        message: err instanceof Error ? err.message : 'Validation failed', 
        severity: 'error' 
      });
    } finally {
      setValidating(false);
    }
  };

  const handlePreview = async () => {
    if (!formData.content.trim() || !formData.subject.trim()) {
      setToast({ message: 'Please enter both subject and content to preview', severity: 'warning' });
      return;
    }

    try {
      setLoading(true);
      
      // Use only backend-provided sample values when present; otherwise omit variable
      const sampleVariables: Record<string, any> = {};
      Object.entries(availableVariables).forEach(([key, info]: [string, any]) => {
        if (info && Object.prototype.hasOwnProperty.call(info, 'sample')) {
          sampleVariables[key] = info.sample;
        }
      });

      const preview = await templateService.previewTemplate({
        content: formData.content,
        subject: formData.subject,
        variables: sampleVariables
      });
      
      setPreviewData(preview);
      setPreviewDialogOpen(true);
    } catch (err) {
      setToast({ 
        message: err instanceof Error ? err.message : 'Preview failed', 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.subject.trim() || !formData.content.trim()) {
      setToast({ message: 'Please fill in all required fields', severity: 'error' });
      return;
    }

    try {
      setLoading(true);
      
      let savedTemplate: EmailTemplate;
      
      if (template) {
        // Update existing template
        const updateData: EmailTemplateUpdateRequest = {
          id: template.id,
          ...formData
        };
        savedTemplate = await templateService.updateTemplate(updateData);
      } else {
        // Create new template
        const createData: EmailTemplateCreateRequest = formData;
        savedTemplate = await templateService.createTemplate(createData);
      }
      
      setToast({ 
        message: `Template ${template ? 'updated' : 'created'} successfully`, 
        severity: 'success' 
      });
      
      onSave(savedTemplate);
      onClose();
    } catch (err) {
      setToast({ 
        message: err instanceof Error ? err.message : `Failed to ${template ? 'update' : 'create'} template`, 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const insertVariable = (variableName: string) => {
    const variable = `{{${variableName}}}`;
    // The TemplateEditor will handle variable insertion through its own interface
    // For now, we'll append to the content
    const newContent = formData.content + variable;
    handleInputChange('content', newContent);
  };

  const renderVariableHelp = () => (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2">Available Variables</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <List dense>
          {Object.entries(availableVariables).map(([key, info]: [string, any]) => (
            <ListItem key={key} disablePadding>
              <ListItemButton onClick={() => insertVariable(key)}>
                <ListItemText
                  primary={`{{${key}}}`}
                  secondary={info.description || `${info.type} variable`}
                />
                <Chip 
                  label={info.type} 
                  size="small" 
                  variant="outlined"
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        {Object.keys(availableVariables).length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No variables available for this category
          </Typography>
        )}
      </AccordionDetails>
    </Accordion>
  );

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>{template ? 'Edit Template' : 'Create Template'}</DialogTitle>
        <DialogContent>
        <Box className="template-form">
          {loading && <LoadingSpinner />}
          
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth
                      label="Template Name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      placeholder="Enter template name"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth required>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        label="Category"
                      >
                        {TEMPLATE_CATEGORIES.map(cat => (
                          <MenuItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Subject Line"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      required
                      placeholder="Enter email subject (you can use variables like {{recipient_name}})"
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Template Content */}
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Template Content
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<HelpIcon />}
                      onClick={() => setHelpDialogOpen(true)}
                    >
                      Help
                    </Button>
                    <Button
                      size="small"
                      startIcon={<PreviewIcon />}
                      onClick={handlePreview}
                      disabled={loading || !formData.content.trim()}
                    >
                      Preview
                    </Button>
                    <Button
                      size="small"
                      onClick={handleValidate}
                      disabled={validating || !formData.content.trim()}
                    >
                      {validating ? 'Validating...' : 'Validate'}
                    </Button>
                  </Box>
                </Box>
                
                <TemplateEditor
                  value={formData.content}
                  onChange={(content) => handleInputChange('content', content)}
                  availableVariables={availableVariables}
                  placeholder="Enter your email template content here. Use {{variable_name}} for dynamic content."
                  height={400}
                  showToolbar={true}
                  showVariableHelper={false} // We'll show it in the sidebar instead
                  onPreview={handlePreview}
                />
                
                {/* Validation Results */}
                {validationResult && (
                  <Box sx={{ mt: 2 }}>
                    {validationResult.errors.length > 0 && (
                      <Alert severity="error" sx={{ mb: 1 }}>
                        <Typography variant="subtitle2">Validation Errors:</Typography>
                        <ul className="template-validation-error-list">
                          {validationResult.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </Alert>
                    )}
                    
                    {validationResult.warnings.length > 0 && (
                      <Alert severity="warning" sx={{ mb: 1 }}>
                        <Typography variant="subtitle2">Warnings:</Typography>
                        <ul className="template-validation-warning-list">
                          {validationResult.warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </Alert>
                    )}
                    
                    {validationResult.isValid && (
                      <Alert severity="success">
                        Template validation passed successfully!
                        {validationResult.variables.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2">
                              Variables found: {validationResult.variables.join(', ')}
                            </Typography>
                          </Box>
                        )}
                      </Alert>
                    )}
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Variable Helper */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, position: 'sticky', top: 20 }}>
                <Typography variant="h6" gutterBottom>
                  Variable Helper
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Click on a variable to insert it into your template
                </Typography>
                {renderVariableHelp()}
              </Paper>
            </Grid>
          </Grid>

          {/* Form Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button
              onClick={onClose}
              startIcon={<CancelIcon />}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              startIcon={<SaveIcon />}
              disabled={loading || !formData.name.trim() || !formData.subject.trim() || !formData.content.trim()}
            >
              {loading ? 'Saving...' : (template ? 'Update Template' : 'Create Template')}
            </Button>
          </Box>
        </Box>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog 
        open={previewDialogOpen} 
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Template Preview</DialogTitle>
        <DialogContent>
          {previewData && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Subject:
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                {previewData.subject}
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>
                Content:
              </Typography>
              <Box 
                sx={{ 
                  border: 1, 
                  borderColor: 'grey.300', 
                  borderRadius: 1, 
                  p: 2,
                  maxHeight: 400,
                  overflow: 'auto'
                }}
                dangerouslySetInnerHTML={{ __html: previewData.htmlContent }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Help Dialog */}
      <Dialog 
        open={helpDialogOpen} 
        onClose={() => setHelpDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Template Help</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Use variables in your templates to insert dynamic content. Variables are enclosed in double curly braces.
          </Typography>
          
          <Typography variant="subtitle2" gutterBottom>
            Examples:
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <li><code>{'{{recipient_name}}'}</code> - Recipient's name</li>
            <li><code>{'{{location_name}}'}</code> - Location name</li>
            <li><code>{'{{meter_id}}'}</code> - Meter identifier</li>
            <li><code>{'{{current_date}}'}</code> - Current date</li>
          </Box>
          
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Conditional Logic:
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <li><code>{'{{#if condition}}...{{/if}}'}</code> - Show content if condition is true</li>
            <li><code>{'{{#each items}}...{{/each}}'}</code> - Loop through items</li>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Available variables depend on the selected category. Use the Variable Helper panel to see all available variables for your category.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpDialogOpen(false)}>Close</Button>
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
    </>
  );
};