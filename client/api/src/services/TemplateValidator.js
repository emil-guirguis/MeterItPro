/**
 * Template Validator Service
 * Validates email template content and variables
 */

class TemplateValidator {
    /**
     * Validate template content and variables
     */
    static validateTemplate(templateData) {
        const errors = [];
        const warnings = [];

        // Validate required fields
        if (!templateData.name || templateData.name.trim().length === 0) {
            errors.push('Template name is required');
        }

        if (!templateData.subject || templateData.subject.trim().length === 0) {
            errors.push('Template subject is required');
        }

        if (!templateData.content || templateData.content.trim().length === 0) {
            errors.push('Template content is required');
        }

        if (!templateData.category) {
            errors.push('Template category is required');
        } else if (!this.isValidCategory(templateData.category)) {
            errors.push('Invalid template category');
        }

        // Validate template name format
        if (templateData.name && !this.isValidTemplateName(templateData.name)) {
            errors.push('Template name must be 3-255 characters and contain only letters, numbers, spaces, hyphens, and underscores');
        }

        // Validate subject length
        if (templateData.subject && templateData.subject.length > 500) {
            errors.push('Template subject must be 500 characters or less');
        }

        // Validate content length
        if (templateData.content && templateData.content.length > 100000) {
            errors.push('Template content must be 100,000 characters or less');
        }

        // Validate variables if provided
        if (templateData.variables) {
            const variableValidation = this.validateVariables(templateData.variables);
            errors.push(...variableValidation.errors);
            warnings.push(...variableValidation.warnings);
        }

        // Validate template syntax
        if (templateData.content) {
            const syntaxValidation = this.validateTemplateSyntax(templateData.content, templateData.variables || []);
            errors.push(...syntaxValidation.errors);
            warnings.push(...syntaxValidation.warnings);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validate template variables
     */
    static validateVariables(variables) {
        const errors = [];
        const warnings = [];
        const variableNames = new Set();

        if (!Array.isArray(variables)) {
            errors.push('Variables must be an array');
            return { errors, warnings };
        }

        for (let i = 0; i < variables.length; i++) {
            const variable = variables[i];
            const prefix = `Variable ${i + 1}`;

            // Check required fields
            if (!variable.name) {
                errors.push(`${prefix}: name is required`);
                continue;
            }

            if (!variable.description) {
                warnings.push(`${prefix} (${variable.name}): description is recommended`);
            }

            if (!variable.type) {
                errors.push(`${prefix} (${variable.name}): type is required`);
            } else if (!this.isValidVariableType(variable.type)) {
                errors.push(`${prefix} (${variable.name}): invalid type "${variable.type}"`);
            }

            // Check for duplicate names
            if (variableNames.has(variable.name)) {
                errors.push(`${prefix} (${variable.name}): duplicate variable name`);
            } else {
                variableNames.add(variable.name);
            }

            // Validate variable name format
            if (!this.isValidVariableName(variable.name)) {
                errors.push(`${prefix} (${variable.name}): invalid name format. Use only letters, numbers, and underscores`);
            }

            // Validate description length
            if (variable.description && variable.description.length > 500) {
                warnings.push(`${prefix} (${variable.name}): description is very long (${variable.description.length} characters)`);
            }
        }

        return { errors, warnings };
    }

    /**
     * Validate template syntax and variable usage
     */
    static validateTemplateSyntax(content, variables = []) {
        const errors = [];
        const warnings = [];

        // Find all variable placeholders in content
        const variablePattern = /\{\{([^}]+)\}\}/g;
        const foundVariables = new Set();
        const definedVariables = new Set(variables.map(v => v.name));
        let match;

        while ((match = variablePattern.exec(content)) !== null) {
            const variableName = match[1].trim();
            foundVariables.add(variableName);

            // Check for invalid variable syntax
            if (variableName.length === 0) {
                errors.push('Empty variable placeholder found: {{}}');
                continue;
            }

            // Check for undefined variables
            if (!definedVariables.has(variableName) && !this.isHelperFunction(variableName)) {
                warnings.push(`Variable "{{${variableName}}}" used in template but not defined in variables list`);
            }
        }

        // Check for unused variables
        for (const variable of variables) {
            if (!foundVariables.has(variable.name) && !this.isHelperFunction(variable.name)) {
                warnings.push(`Variable "${variable.name}" defined but not used in template`);
            }
        }

        // Basic HTML validation
        if (content.includes('<') && content.includes('>')) {
            const htmlValidation = this.validateBasicHTML(content);
            errors.push(...htmlValidation.errors);
            warnings.push(...htmlValidation.warnings);
        }

        return { errors, warnings };
    }

    /**
     * Basic HTML validation
     */
    static validateBasicHTML(content) {
        const errors = [];
        const warnings = [];

        // Check for unclosed tags (basic check)
        const openTags = content.match(/<[^/][^>]*>/g) || [];
        const closeTags = content.match(/<\/[^>]*>/g) || [];

        if (openTags.length !== closeTags.length) {
            warnings.push('Possible unclosed HTML tags detected');
        }

        // Check for dangerous tags
        const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form'];
        for (const tag of dangerousTags) {
            if (content.toLowerCase().includes(`<${tag}`)) {
                errors.push(`Potentially dangerous HTML tag detected: <${tag}>`);
            }
        }

        // Check for inline styles with javascript
        if (content.toLowerCase().includes('javascript:')) {
            errors.push('JavaScript code detected in template content');
        }

        return { errors, warnings };
    }

    /**
     * Check if category is valid
     */
    static isValidCategory(category) {
        const validCategories = ['meter_readings', 'meter_errors', 'maintenance', 'general'];
        return validCategories.includes(category);
    }

    /**
     * Check if template name is valid
     */
    static isValidTemplateName(name) {
        return /^[a-zA-Z0-9\s\-_]{3,255}$/.test(name);
    }

    /**
     * Check if variable name is valid
     */
    static isValidVariableName(name) {
        return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(name);
    }

    /**
     * Check if variable type is valid
     */
    static isValidVariableType(type) {
        const validTypes = ['text', 'number', 'date', 'boolean', 'array', 'object'];
        return validTypes.includes(type);
    }

    /**
     * Check if variable is a helper function (like #each, #if)
     */
    static isHelperFunction(variableName) {
        const helpers = ['each', 'if', 'unless', 'with'];
        return helpers.some(helper => variableName.startsWith(`#${helper}`) || variableName.startsWith(`/${helper}`));
    }

    /**
     * Get available template categories
     */
    static getValidCategories() {
        return [
            { value: 'meter_readings', label: 'Meter Readings' },
            { value: 'meter_errors', label: 'Meter Errors' },
            { value: 'maintenance', label: 'Maintenance' },
            { value: 'general', label: 'General' }
        ];
    }

    /**
     * Get available variable types
     */
    static getValidVariableTypes() {
        return [
            { value: 'text', label: 'Text' },
            { value: 'number', label: 'Number' },
            { value: 'date', label: 'Date' },
            { value: 'boolean', label: 'Boolean' },
            { value: 'array', label: 'Array' },
            { value: 'object', label: 'Object' }
        ];
    }
}

module.exports = TemplateValidator;