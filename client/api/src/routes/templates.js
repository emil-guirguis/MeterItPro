const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const TemplateService = require('../services/TemplateService');
const TemplateRenderer = require('../services/TemplateRenderer');

const router = express.Router();
router.use(authenticateToken);

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// GET /api/templates - Get all templates with filtering and pagination
router.get('/', 
  requirePermission('template:read'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('category').optional().isIn(['meter_readings', 'meter_errors', 'maintenance', 'general']).withMessage('Invalid category'),
    query('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
    query('isDefault').optional().isBoolean().withMessage('isDefault must be boolean'),
    query('sortBy').optional().isIn(['name', 'subject', 'category', 'usagecount', 'createdat', 'updatedat', 'createdAt', 'updatedAt', 'lastused']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
    query('search').optional().isLength({ min: 1, max: 100 }).withMessage('Search query must be 1-100 characters')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const result = await TemplateService.getTemplates(req.query);
      
      if (result.success) {
        res.json({
          success: true,
          data: {
            items: result.data.templates,
            total: result.data.pagination.totalItems,
            page: result.data.pagination.currentPage,
            pageSize: result.data.pagination.itemsPerPage,
            totalPages: result.data.pagination.totalPages
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch templates'
      });
    }
  }
);

// GET /api/templates/stats - Get template statistics
router.get('/stats',
  requirePermission('template:read'),
  async (req, res) => {
    try {
      const result = await TemplateService.getTemplateStats();
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error fetching template stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch template statistics'
      });
    }
  }
);

// GET /api/templates/categories - Get available categories
router.get('/categories',
  requirePermission('template:read'),
  async (req, res) => {
    try {
      const result = TemplateService.getCategories();
      res.json(result);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch categories'
      });
    }
  }
);

// GET /api/templates/variable-types - Get available variable types
router.get('/variable-types',
  requirePermission('template:read'),
  async (req, res) => {
    try {
      const result = TemplateService.getVariableTypes();
      res.json(result);
    } catch (error) {
      console.error('Error fetching variable types:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch variable types'
      });
    }
  }
);

// GET /api/templates/search - Search templates
router.get('/search',
  requirePermission('template:read'),
  [
    query('q').notEmpty().withMessage('Search query is required'),
    query('category').optional().isIn(['meter_readings', 'meter_errors', 'maintenance', 'general']).withMessage('Invalid category'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const result = await TemplateService.searchTemplates(req.query.q, {
        category: req.query.category,
        limit: req.query.limit
      });
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error searching templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search templates'
      });
    }
  }
);

// GET /api/templates/:id - Get specific template
router.get('/:id',
  requirePermission('template:read'),
  [
    param('id').isInt().withMessage('Template ID must be an integer')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const result = await TemplateService.getTemplate(req.params.id);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data
        });
      } else {
        res.status(404).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch template'
      });
    }
  }
);

// POST /api/templates - Create new template
router.post('/',
  requirePermission('template:create'),
  [
    body('name').notEmpty().isLength({ min: 3, max: 255 }).withMessage('Name must be 3-255 characters'),
    body('subject').notEmpty().isLength({ max: 500 }).withMessage('Subject is required and must be max 500 characters'),
    body('content').notEmpty().withMessage('Content is required'),
    body('category').isIn(['meter_readings', 'meter_errors', 'maintenance', 'general']).withMessage('Invalid category'),
    body('variables').optional().isArray().withMessage('Variables must be an array')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const result = await TemplateService.createTemplate(req.body, req.user?.id);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          data: result.data,
          validation: result.validation
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create template'
      });
    }
  }
);

// PUT /api/templates/:id - Update template
router.put('/:id',
  requirePermission('template:update'),
  [
    param('id').isInt().withMessage('Template ID must be an integer'),
    body('name').optional().isLength({ min: 3, max: 255 }).withMessage('Name must be 3-255 characters'),
    body('subject').optional().isLength({ max: 500 }).withMessage('Subject must be max 500 characters'),
    body('category').optional().isIn(['meter_readings', 'meter_errors', 'maintenance', 'general']).withMessage('Invalid category'),
    body('variables').optional().isArray().withMessage('Variables must be an array')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const result = await TemplateService.updateTemplate(req.params.id, req.body, req.user?.id);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          validation: result.validation
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error updating template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update template'
      });
    }
  }
);

// DELETE /api/templates/:id - Delete template
router.delete('/:id',
  requirePermission('template:delete'),
  [
    param('id').isInt().withMessage('Template ID must be an integer'),
    query('force').optional().isBoolean().withMessage('Force must be boolean')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const result = await TemplateService.deleteTemplate(req.params.id, req.query.force === 'true');
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete template'
      });
    }
  }
);

// POST /api/templates/:id/duplicate - Duplicate template
router.post('/:id/duplicate',
  requirePermission('template:create'),
  [
    param('id').isInt().withMessage('Template ID must be an integer'),
    body('name').notEmpty().isLength({ min: 3, max: 255 }).withMessage('Name must be 3-255 characters')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const result = await TemplateService.duplicateTemplate(req.params.id, req.body.name, req.user?.id);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          data: result.data,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to duplicate template'
      });
    }
  }
);

// POST /api/templates/validate - Validate template content
router.post('/validate',
  requirePermission('template:read'),
  [
    body('name').optional().isLength({ min: 3, max: 255 }).withMessage('Name must be 3-255 characters'),
    body('subject').optional().isLength({ max: 500 }).withMessage('Subject must be max 500 characters'),
    body('content').optional().notEmpty().withMessage('Content cannot be empty'),
    body('category').optional().isIn(['meter_readings', 'meter_errors', 'maintenance', 'general']).withMessage('Invalid category'),
    body('variables').optional().isArray().withMessage('Variables must be an array')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const result = TemplateService.validateTemplateContent(req.body);
      res.json(result);
    } catch (error) {
      console.error('Error validating template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate template'
      });
    }
  }
);

// POST /api/templates/:id/preview - Preview template with sample data
router.post('/:id/preview',
  requirePermission('template:read'),
  [
    param('id').isInt().withMessage('Template ID must be an integer'),
    body('variables').optional().isObject().withMessage('Variables must be an object')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const result = await TemplateRenderer.previewTemplate(req.params.id, req.body);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error previewing template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to preview template'
      });
    }
  }
);

// POST /api/templates/:id/render - Render template with provided data
router.post('/:id/render',
  requirePermission('template:read'),
  [
    param('id').isInt().withMessage('Template ID must be an integer'),
    body('variables').isObject().withMessage('Variables object is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const result = await TemplateRenderer.renderTemplate(req.params.id, req.body.variables, req.body.options);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error rendering template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to render template'
      });
    }
  }
);

// GET /api/templates/category/:category - Get templates by category
router.get('/category/:category',
  requirePermission('template:read'),
  [
    param('category').isIn(['meter_readings', 'meter_errors', 'maintenance', 'general']).withMessage('Invalid category')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const result = await TemplateService.getTemplatesByCategory(req.params.category);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error fetching templates by category:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch templates by category'
      });
    }
  }
);

// POST /api/templates/bulk - Bulk operations on templates
router.post('/bulk',
  requirePermission('template:update'),
  [
    body('action').isIn(['activate', 'deactivate', 'delete']).withMessage('Invalid bulk action'),
    body('templateIds').isArray({ min: 1 }).withMessage('Template IDs array is required'),
    body('templateIds.*').isInt().withMessage('All template IDs must be integers')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { action, templateIds } = req.body;
      let result;

      switch (action) {
        case 'activate':
          result = await TemplateService.bulkUpdateTemplates(templateIds, { isactive: true });
          break;
        case 'deactivate':
          result = await TemplateService.bulkUpdateTemplates(templateIds, { isactive: false });
          break;
        case 'delete':
          // Check permission for delete
          if (!req.user.permissions.includes('template:delete')) {
            return res.status(403).json({
              success: false,
              message: 'Delete permission required for bulk delete'
            });
          }
          
          // Perform bulk delete
          const deleteResults = [];
          for (const templateId of templateIds) {
            const deleteResult = await TemplateService.deleteTemplate(templateId, false);
            deleteResults.push({ id: templateId, ...deleteResult });
          }
          
          result = {
            success: deleteResults.every(r => r.success),
            data: {
              updated: deleteResults.filter(r => r.success).length,
              failed: deleteResults.filter(r => !r.success).length,
              results: deleteResults
            }
          };
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid action'
          });
      }

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: `Bulk ${action} completed: ${result.data.updated} updated, ${result.data.failed} failed`
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error performing bulk operation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform bulk operation'
      });
    }
  }
);

// GET /api/templates/usage-analytics - Get template usage analytics
router.get('/usage-analytics',
  requirePermission('template:read'),
  [
    query('category').optional().isIn(['meter_readings', 'meter_errors', 'maintenance', 'general']).withMessage('Invalid category'),
    query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO date'),
    query('endDate').optional().isISO8601().withMessage('End date must be valid ISO date'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const result = await TemplateService.getUsageAnalytics(req.query);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error fetching usage analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch usage analytics'
      });
    }
  }
);

// POST /api/templates/:id/usage - Record template usage manually
router.post('/:id/usage',
  requirePermission('template:read'),
  [
    param('id').isInt().withMessage('Template ID must be an integer')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const result = await TemplateService.recordTemplateUsage(req.params.id);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: 'Template usage recorded'
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error recording template usage:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record template usage'
      });
    }
  }
);

// GET /api/templates/:id/variables - Get template variables with schema
router.get('/:id/variables',
  requirePermission('template:read'),
  [
    param('id').isInt().withMessage('Template ID must be an integer')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const template = await TemplateService.getTemplate(req.params.id);
      
      if (!template.success) {
        return res.status(404).json({
          success: false,
          message: template.error
        });
      }

      const schema = TemplateRenderer.getVariableSchema(template.data.variables || []);
      
      res.json({
        success: true,
        data: {
          variables: template.data.variables || [],
          schema: schema,
          totalVariables: (template.data.variables || []).length
        }
      });
    } catch (error) {
      console.error('Error fetching template variables:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch template variables'
      });
    }
  }
);

// POST /api/templates/import - Import templates from JSON
router.post('/import',
  requirePermission('template:create'),
  [
    body('templates').isArray({ min: 1 }).withMessage('Templates array is required'),
    body('overwrite').optional().isBoolean().withMessage('Overwrite must be boolean')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { templates, overwrite = false } = req.body;
      const results = [];
      let created = 0;
      let updated = 0;
      let failed = 0;

      for (const templateData of templates) {
        try {
          // Check if template exists
          const existingTemplate = await TemplateService.getTemplates({ 
            search: templateData.name,
            limit: 1 
          });

          if (existingTemplate.success && existingTemplate.data.templates.length > 0) {
            if (overwrite) {
              // Update existing template
              const updateResult = await TemplateService.updateTemplate(
                existingTemplate.data.templates[0].id,
                templateData,
                req.user?.id
              );
              
              if (updateResult.success) {
                updated++;
                results.push({ name: templateData.name, action: 'updated', success: true });
              } else {
                failed++;
                results.push({ name: templateData.name, action: 'update_failed', success: false, error: updateResult.error });
              }
            } else {
              // Skip existing template
              results.push({ name: templateData.name, action: 'skipped', success: true, reason: 'already_exists' });
            }
          } else {
            // Create new template
            const createResult = await TemplateService.createTemplate(templateData, req.user?.id);
            
            if (createResult.success) {
              created++;
              results.push({ name: templateData.name, action: 'created', success: true });
            } else {
              failed++;
              results.push({ name: templateData.name, action: 'create_failed', success: false, error: createResult.error });
            }
          }
        } catch (error) {
          failed++;
          results.push({ name: templateData.name || 'unknown', action: 'failed', success: false, error: error.message });
        }
      }

      res.json({
        success: failed === 0,
        data: {
          summary: {
            total: templates.length,
            created,
            updated,
            failed,
            skipped: results.filter(r => r.action === 'skipped').length
          },
          results
        },
        message: `Import completed: ${created} created, ${updated} updated, ${failed} failed`
      });
    } catch (error) {
      console.error('Error importing templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to import templates'
      });
    }
  }
);

// GET /api/templates/export - Export templates as JSON
router.get('/export',
  requirePermission('template:read'),
  [
    query('category').optional().isIn(['meter_readings', 'meter_errors', 'maintenance', 'general']).withMessage('Invalid category'),
    query('includeDefault').optional().isBoolean().withMessage('Include default must be boolean'),
    query('includeInactive').optional().isBoolean().withMessage('Include inactive must be boolean')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { category, includeDefault = true, includeInactive = false } = req.query;
      
      const filters = {};
      if (category) filters.category = category;
      if (!includeInactive) filters.isActive = true;
      
      const result = await TemplateService.getTemplates({
        filters,
        limit: 1000, // Large limit for export
        sortBy: 'category',
        sortOrder: 'asc'
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error
        });
      }

      let templates = result.data.templates;
      
      // Filter out default templates if requested
      if (!includeDefault) {
        templates = templates.filter(t => !t.isDefault);
      }

      // Clean up templates for export (remove system fields)
      const exportTemplates = templates.map(template => ({
        name: template.name,
        subject: template.subject,
        content: template.content,
        category: template.category,
        variables: template.variables || []
      }));

      res.json({
        success: true,
        data: {
          templates: exportTemplates,
          exportInfo: {
            exportedAt: new Date().toISOString(),
            totalTemplates: exportTemplates.length,
            filters: { category, includeDefault, includeInactive }
          }
        }
      });
    } catch (error) {
      console.error('Error exporting templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export templates'
      });
    }
  }
);

module.exports = router;