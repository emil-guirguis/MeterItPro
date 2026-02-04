/**
 * Template Service
 * Business logic layer for email template management
 */

const EmailTemplate = require('../models/EmailTemplatesWithSchema');
const TemplateValidator = require('./TemplateValidator');

class TemplateService {
    /**
     * Create a new email template
     */
    static async createTemplate(templateData, userId = null) {
        try {
            // Validate template data
            const validation = TemplateValidator.validateTemplate(templateData);
            if (!validation.isValid) {
                throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
            }

            // Check if template name already exists
            const existingTemplate = await EmailTemplate.findOne({ name: templateData.name });
            if (existingTemplate) {
                throw new Error('Template with this name already exists');
            }

            // Create the template
            const template = await EmailTemplate.create({
                ...templateData,
                createdBy: userId
            });

            return {
                success: true,
                data: template,
                validation: {
                    warnings: validation.warnings
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Get template by ID
     */
    static async getTemplate(templateId) {
        try {
            const template = await EmailTemplate.findById(templateId);
            if (!template) {
                throw new Error('Template not found');
            }

            return {
                success: true,
                data: template
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Get all templates with filtering and pagination
     */
    static async getTemplates(options = {}) {
        try {
            const {
                page = 1,
                limit = 20,
                category,
                search,
                isActive,
                isDefault,
                sortBy = 'createdat',
                sortOrder = 'desc'
            } = options;

            // Calculate offset
            const offset = (page - 1) * limit;

            // Build where clause
            const where = {};
            if (category) where.category = category;
            if (isActive !== undefined) where.isactive = isActive;
            if (isDefault !== undefined) where.isdefault = isDefault;

            // Get templates
            const result = await EmailTemplate.findAll({
                where,
                order: [[String(sortBy), String(sortOrder).toUpperCase()]],
                limit: Number(limit),
                offset: Number(offset)
            });

            // Calculate pagination info
            const total = result.pagination?.total || 0;
            const totalPages = Math.ceil(total / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;

            return {
                success: true,
                data: {
                    templates: result.rows,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages,
                        totalItems: total,
                        itemsPerPage: parseInt(limit),
                        hasNextPage,
                        hasPrevPage
                    }
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Update an existing template
     */
    static async updateTemplate(templateId, updateData, userId = null) {
        try {
            // Get existing template
            const template = await EmailTemplate.findById(templateId);
            if (!template) {
                throw new Error('Template not found');
            }

            // Check if it's a default template and prevent certain updates
            if (template.isdefault && updateData.isActive === false) {
                throw new Error('Cannot deactivate default templates');
            }

            // Validate update data
            const mergedData = { ...template, ...updateData };
            const validation = TemplateValidator.validateTemplate(mergedData);
            if (!validation.isValid) {
                throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
            }

            // Check for name conflicts if name is being updated
            if (updateData.name && updateData.name !== template.name) {
                const existingTemplate = await EmailTemplate.findOne({ name: updateData.name });
                if (existingTemplate) {
                    throw new Error('Template with this name already exists');
                }
            }

            // Update the template
            const updatedTemplate = await template.update(updateData);

            return {
                success: true,
                data: updatedTemplate,
                validation: {
                    warnings: validation.warnings
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Delete a template
     */
    static async deleteTemplate(templateId, force = false) {
        try {
            const template = await EmailTemplate.findById(templateId);
            if (!template) {
                throw new Error('Template not found');
            }

            // Prevent deletion of default templates unless forced
            if (template.isdefault && !force) {
                throw new Error('Cannot delete default templates. Use force=true to override.');
            }

            // Check if template is in use
            if (template.usagecount > 0 && !force) {
                // Soft delete by deactivating
                await template.update({ isactive: false });
                return {
                    success: true,
                    message: 'Template deactivated (was in use)',
                    data: { id: templateId, action: 'deactivated' }
                };
            } else {
                // Hard delete
                await template.delete();
                return {
                    success: true,
                    message: 'Template deleted permanently',
                    data: { id: templateId, action: 'deleted' }
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Get templates by category
     */
    static async getTemplatesByCategory(category) {
        try {
            if (!TemplateValidator.isValidCategory(category)) {
                throw new Error('Invalid category');
            }

            const result = await EmailTemplate.findAll({ where: { category } });
            
            return {
                success: true,
                data: result.rows
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Duplicate a template
     */
    static async duplicateTemplate(templateId, newName, userId = null) {
        try {
            const originalTemplate = await EmailTemplate.findById(templateId);
            if (!originalTemplate) {
                throw new Error('Template not found');
            }

            // Check if new name already exists
            const existingTemplate = await EmailTemplate.findOne({ name: newName });
            if (existingTemplate) {
                throw new Error('Template with this name already exists');
            }

            // Create duplicate
            const duplicateData = {
                name: newName,
                subject: originalTemplate.subject,
                content: originalTemplate.content,
                category: originalTemplate.category,
                variables: originalTemplate.variables,
                isDefault: false // Duplicates are never default
            };

            const duplicate = await EmailTemplate.create({
                ...duplicateData,
                createdBy: userId
            });

            return {
                success: true,
                data: duplicate,
                message: `Template duplicated as "${newName}"`
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Get template statistics
     */
    static async getTemplateStats() {
        try {
            const db = EmailTemplate.getDb();
            
            // Get statistics using raw SQL query
            const statsQuery = `
                SELECT 
                    COUNT(*) as total_templates,
                    COUNT(*) FILTER (WHERE isactive = true) as active_templates,
                    COUNT(*) FILTER (WHERE isdefault = true) as default_templates,
                    COUNT(*) FILTER (WHERE category = 'meter_readings') as meter_reading_templates,
                    COUNT(*) FILTER (WHERE category = 'meter_errors') as meter_error_templates,
                    COUNT(*) FILTER (WHERE category = 'maintenance') as maintenance_templates,
                    COUNT(*) FILTER (WHERE category = 'general') as general_templates,
                    SUM(usagecount) as total_usage,
                    AVG(usagecount) as average_usage
                FROM email_templates
            `;
            
            const result = await db.query(statsQuery);
            const stats = result.rows[0];
            
            return {
                success: true,
                data: {
                    total: parseInt(stats.total_templates) || 0,
                    active: parseInt(stats.active_templates) || 0,
                    default: parseInt(stats.default_templates) || 0,
                    byCategory: {
                        meterReadings: parseInt(stats.meter_reading_templates) || 0,
                        meterErrors: parseInt(stats.meter_error_templates) || 0,
                        maintenance: parseInt(stats.maintenance_templates) || 0,
                        general: parseInt(stats.general_templates) || 0
                    },
                    usage: {
                        total: parseInt(stats.total_usage) || 0,
                        average: parseFloat(stats.average_usage) || 0
                    }
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Validate template content and variables
     */
    static validateTemplateContent(templateData) {
        try {
            const validation = TemplateValidator.validateTemplate(templateData);
            
            return {
                success: true,
                data: {
                    isValid: validation.isValid,
                    errors: validation.errors,
                    warnings: validation.warnings
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Get available template categories
     */
    static getCategories() {
        return {
            success: true,
            data: TemplateValidator.getValidCategories()
        };
    }

    /**
     * Get available variable types
     */
    static getVariableTypes() {
        return {
            success: true,
            data: TemplateValidator.getValidVariableTypes()
        };
    }

    /**
     * Search templates
     */
    static async searchTemplates(query, options = {}) {
        try {
            const {
                category,
                isActive = true,
                limit = 10
            } = options;

            const where = { isactive: isActive };
            if (category) where.category = category;

            const result = await EmailTemplate.findAll({
                where,
                order: [['usagecount', 'DESC']],
                limit: parseInt(limit)
            });

            return {
                success: true,
                data: result.rows.map(t => ({
                    id: t.id,
                    name: t.name,
                    subject: t.subject,
                    category: t.category,
                    usageCount: t.usagecount,
                    lastUsed: t.lastused
                }))
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Increment template usage
     */
    static async recordTemplateUsage(templateId) {
        try {
            const template = await EmailTemplate.findById(templateId);
            if (!template) {
                throw new Error('Template not found');
            }

            // Increment usage count and update last used timestamp
            await template.update({
                usagecount: (template.usagecount || 0) + 1,
                lastused: new Date()
            });

            return {
                success: true,
                data: {
                    id: templateId,
                    usageCount: template.usagecount,
                    lastUsed: template.lastused
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Get template usage analytics
     */
    static async getUsageAnalytics(options = {}) {
        try {
            const {
                category,
                startDate,
                endDate,
                limit = 10
            } = options;

            // Build where clause
            const where = { isactive: true };
            if (category) where.category = category;

            // Get templates sorted by usage
            const result = await EmailTemplate.findAll({
                where,
                order: [['usagecount', 'DESC']],
                limit: parseInt(limit)
            });

            const analytics = result.rows.map(template => ({
                id: template.id,
                name: template.name,
                category: template.category,
                usageCount: template.usagecount,
                lastUsed: template.lastused,
                createdAt: template.createdat
            }));

            return {
                success: true,
                data: {
                    topTemplates: analytics,
                    totalTemplates: result.total,
                    filters: { category, startDate, endDate }
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Bulk operations
     */
    static async bulkUpdateTemplates(templateIds, updateData) {
        try {
            const results = [];
            const errors = [];

            for (const templateId of templateIds) {
                try {
                    const result = await this.updateTemplate(templateId, updateData);
                    if (result.success) {
                        results.push({ id: templateId, success: true });
                    } else {
                        errors.push({ id: templateId, error: result.error });
                    }
                } catch (error) {
                    errors.push({ id: templateId, error: error instanceof Error ? error.message : String(error) });
                }
            }

            return {
                success: errors.length === 0,
                data: {
                    updated: results.length,
                    failed: errors.length,
                    results,
                    errors
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
}

module.exports = TemplateService;