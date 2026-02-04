/**
 * Template Renderer Service
 * Handles template rendering with variable substitution, conditional logic, and loops
 */

const EmailTemplate = require('../models/EmailTemplatesWithSchema');
const DOMPurify = require('isomorphic-dompurify');
const VariableProcessor = require('./VariableProcessor');

class TemplateRenderer {
    /**
     * Render a template with provided variables and comprehensive processing
     */
    static async renderTemplate(templateId, variables = {}, options = {}) {
        try {
            const template = await EmailTemplate.findById(templateId);
            if (!template) {
                throw new Error('Template not found');
            }

            // Process and validate variables using VariableProcessor
            const variableProcessingOptions = {
                strict: options.strict || false,
                convertTypes: options.convertTypes !== false,
                sanitizeHtml: options.escapeHtml !== false,
                allowExtraVariables: options.allowExtraVariables !== false
            };

            const variableResult = VariableProcessor.processVariables(
                variables,
                template.variables || [],
                variableProcessingOptions
            );

            if (!variableResult.success && options.strict) {
                throw new Error(`Variable processing failed: ${variableResult.errors.join(', ')}`);
            }

            // Render template content
            const renderResult = this.renderContent(
                template.subject,
                template.content,
                template.variables,
                variableResult.variables,
                options
            );

            // Combine warnings from variable processing and rendering
            const allWarnings = [
                ...variableResult.warnings,
                ...renderResult.warnings
            ];

            return {
                success: true,
                data: {
                    id: template.id,
                    name: template.name,
                    category: template.category,
                    renderedSubject: renderResult.subject,
                    renderedContent: renderResult.content,
                    variables: renderResult.processedVariables,
                    warnings: allWarnings,
                    variableErrors: variableResult.errors
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Render template content with variables
     */
    static renderContent(subject, content, templateVariables = [], variables = {}, options = {}) {
        const {
            escapeHtml = true,
            allowMissingVariables = true,
            defaultValues = {}
        } = options;

        const warnings = [];
        const processedVariables = {};

        // Process subject
        const renderedSubject = this.processTemplateString(
            subject,
            templateVariables,
            variables,
            { escapeHtml, allowMissingVariables, defaultValues, warnings, processedVariables }
        );

        // Process content
        const renderedContent = this.processTemplateString(
            content,
            templateVariables,
            variables,
            { escapeHtml, allowMissingVariables, defaultValues, warnings, processedVariables }
        );

        return {
            subject: renderedSubject,
            content: renderedContent,
            processedVariables,
            warnings
        };
    }

    /**
     * Process a template string with variable substitution, conditionals, and loops
     */
    static processTemplateString(templateString, templateVariables, variables, context) {
        const { escapeHtml, allowMissingVariables, defaultValues, warnings, processedVariables } = context;

        // First pass: Process block helpers (conditionals and loops)
        let processed = this.processBlockHelpers(templateString, templateVariables, variables, context);

        // Second pass: Process simple variable substitution {{variable_name}}
        processed = processed.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
            const trimmedName = variableName.trim();

            // Skip if it's a helper function (should have been processed in first pass)
            if (this.isHelperFunction(trimmedName)) {
                return match; // Leave as-is if not processed
            }

            // Get variable definition
            const variableDef = templateVariables.find(v => v.name === trimmedName);
            
            // Get variable value with support for nested properties
            let value = this.getVariableValue(trimmedName, variables);

            // Handle missing variables
            if (value === undefined || value === null) {
                // Try default values
                if (defaultValues[trimmedName] !== undefined) {
                    value = defaultValues[trimmedName];
                } else if (variableDef && variableDef.defaultValue !== undefined) {
                    value = variableDef.defaultValue;
                } else if (allowMissingVariables) {
                    warnings.push(`Variable "${trimmedName}" not provided, using empty string`);
                    value = '';
                } else {
                    throw new Error(`Required variable "${trimmedName}" not provided`);
                }
            }

            // Type conversion and formatting
            if (variableDef) {
                value = this.formatVariable(value, variableDef, context);
            }

            // XSS sanitization for HTML content
            if (escapeHtml && typeof value === 'string') {
                value = this.sanitizeHtml(value);
            }

            // Track processed variables
            processedVariables[trimmedName] = value;

            return value;
        });

        return processed;
    }

    /**
     * Format variable based on its type and definition
     */
    static formatVariable(value, variableDef, context) {
        const { warnings } = context;

        try {
            switch (variableDef.type) {
                case 'date':
                    return this.formatDate(value, variableDef.format);
                
                case 'number':
                    return this.formatNumber(value, variableDef.format);
                
                case 'boolean':
                    return this.formatBoolean(value);
                
                case 'array':
                    return this.formatArray(value, variableDef);
                
                case 'object':
                    return this.formatObject(value, variableDef);
                
                case 'text':
                default:
                    return String(value);
            }
        } catch (error) {
            warnings.push(`Error formatting variable "${variableDef.name}": ${error.message}`);
            return String(value);
        }
    }

    /**
     * Format date values
     */
    static formatDate(value, format = 'YYYY-MM-DD') {
        if (!value) return '';
        
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            throw new Error('Invalid date value');
        }

        // Simple date formatting (could be enhanced with a library like moment.js)
        switch (format) {
            case 'YYYY-MM-DD':
                return date.toISOString().split('T')[0];
            case 'MM/DD/YYYY':
                return date.toLocaleDateString('en-US');
            case 'DD/MM/YYYY':
                return date.toLocaleDateString('en-GB');
            case 'long':
                return date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            default:
                return date.toLocaleDateString();
        }
    }

    /**
     * Format number values
     */
    static formatNumber(value, format) {
        const num = parseFloat(value);
        if (isNaN(num)) {
            throw new Error('Invalid number value');
        }

        if (format) {
            if (format.includes('currency')) {
                return new Intl.NumberFormat('en-US', { 
                    style: 'currency', 
                    currency: 'USD' 
                }).format(num);
            } else if (format.includes('percent')) {
                return new Intl.NumberFormat('en-US', { 
                    style: 'percent' 
                }).format(num / 100);
            } else if (format.includes('decimal')) {
                const decimals = parseInt(format.match(/\d+/)?.[0]) || 2;
                return num.toFixed(decimals);
            }
        }

        return num.toString();
    }

    /**
     * Format boolean values
     */
    static formatBoolean(value) {
        return value ? 'Yes' : 'No';
    }

    /**
     * Format array values (for simple display)
     */
    static formatArray(value, variableDef) {
        if (!Array.isArray(value)) {
            throw new Error('Expected array value');
        }

        // Simple comma-separated list
        return value.join(', ');
    }

    /**
     * Format object values (for simple display)
     */
    static formatObject(value, variableDef) {
        if (typeof value !== 'object' || value === null) {
            throw new Error('Expected object value');
        }

        // Simple key-value display
        return Object.entries(value)
            .map(([key, val]) => `${key}: ${val}`)
            .join(', ');
    }

    /**
     * Process block helpers (conditionals and loops) with full implementation
     */
    static processBlockHelpers(templateString, templateVariables, variables, context) {
        let processed = templateString;
        let hasChanges = true;
        let iterations = 0;
        const maxIterations = 10; // Prevent infinite loops

        // Keep processing until no more changes or max iterations reached
        while (hasChanges && iterations < maxIterations) {
            hasChanges = false;
            const beforeProcessing = processed;

            // Process #each loops first (they create new contexts)
            processed = this.processEachBlocks(processed, variables, context);
            if (processed !== beforeProcessing) hasChanges = true;

            // Process #with context blocks
            const afterWith = this.processWithBlocks(processed, variables, context);
            if (afterWith !== processed) hasChanges = true;
            processed = afterWith;

            // Process #if conditionals
            const afterIf = this.processIfBlocks(processed, variables, context);
            if (afterIf !== processed) hasChanges = true;
            processed = afterIf;

            // Process #unless conditionals
            const afterUnless = this.processUnlessBlocks(processed, variables, context);
            if (afterUnless !== processed) hasChanges = true;
            processed = afterUnless;

            iterations++;
        }

        if (iterations >= maxIterations) {
            context.warnings.push('Maximum template processing iterations reached - possible infinite loop');
        }

        return processed;
    }

    /**
     * Process #each loops with full implementation
     */
    static processEachBlocks(templateString, variables, context) {
        const { warnings } = context;
        
        // Match #each blocks with their content and closing tags
        const eachRegex = /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
        
        return templateString.replace(eachRegex, (match, arrayName, blockContent) => {
            const trimmedArrayName = arrayName.trim();
            const array = this.getVariableValue(trimmedArrayName, variables);
            
            if (!Array.isArray(array)) {
                warnings.push(`Variable "${trimmedArrayName}" is not an array for #each helper`);
                return '';
            }
            
            // Process each item in the array
            let result = '';
            array.forEach((item, index) => {
                // Create context for this iteration
                const iterationContext = {
                    ...variables,
                    this: item,
                    '@index': index,
                    '@first': index === 0,
                    '@last': index === array.length - 1,
                    '@length': array.length
                };
                
                // If item is an object, merge its properties into context
                if (typeof item === 'object' && item !== null) {
                    Object.assign(iterationContext, item);
                }
                
                // Process the block content with the iteration context
                let processedBlock = blockContent;
                
                // Replace {{this}} with the current item
                processedBlock = processedBlock.replace(/\{\{this\}\}/g, String(item));
                
                // Replace {{@index}}, {{@first}}, etc.
                processedBlock = processedBlock.replace(/\{\{@index\}\}/g, String(index));
                processedBlock = processedBlock.replace(/\{\{@first\}\}/g, String(index === 0));
                processedBlock = processedBlock.replace(/\{\{@last\}\}/g, String(index === array.length - 1));
                processedBlock = processedBlock.replace(/\{\{@length\}\}/g, String(array.length));
                
                // Process other variables in the block (including nested helpers)
                processedBlock = this.processTemplateString(
                    processedBlock, 
                    templateVariables, 
                    iterationContext, 
                    context
                );
                
                result += processedBlock;
            });
            
            return result;
        });
    }

    /**
     * Process #if conditional blocks (with support for nesting)
     */
    static processIfBlocks(templateString, variables, context) {
        // Process from innermost to outermost to handle nesting
        let processed = templateString;
        let hasChanges = true;
        
        while (hasChanges) {
            hasChanges = false;
            // Match innermost #if blocks first
            const ifRegex = /\{\{#if\s+([^}]+)\}\}((?:(?!\{\{#if|\{\{\/if\}\}).)*?)(?:\{\{else\}\}((?:(?!\{\{#if|\{\{\/if\}\}).)*?))?\{\{\/if\}\}/g;
            
            processed = processed.replace(ifRegex, (match, condition, trueBlock, falseBlock = '') => {
                hasChanges = true;
                const conditionResult = this.evaluateCondition(condition.trim(), variables, context);
                return conditionResult ? trueBlock : falseBlock;
            });
        }
        
        return processed;
    }

    /**
     * Process #unless conditional blocks (with support for nesting)
     */
    static processUnlessBlocks(templateString, variables, context) {
        // Process from innermost to outermost to handle nesting
        let processed = templateString;
        let hasChanges = true;
        
        while (hasChanges) {
            hasChanges = false;
            // Match innermost #unless blocks first
            const unlessRegex = /\{\{#unless\s+([^}]+)\}\}((?:(?!\{\{#unless|\{\{\/unless\}\}).)*?)(?:\{\{else\}\}((?:(?!\{\{#unless|\{\{\/unless\}\}).)*?))?\{\{\/unless\}\}/g;
            
            processed = processed.replace(unlessRegex, (match, condition, trueBlock, falseBlock = '') => {
                hasChanges = true;
                const conditionResult = !this.evaluateCondition(condition.trim(), variables, context);
                return conditionResult ? trueBlock : falseBlock;
            });
        }
        
        return processed;
    }

    /**
     * Process #with context blocks (with support for nested blocks)
     */
    static processWithBlocks(templateString, variables, context) {
        // Process from innermost to outermost to handle nesting
        let processed = templateString;
        let hasChanges = true;
        
        while (hasChanges) {
            hasChanges = false;
            const withRegex = /\{\{#with\s+([^}]+)\}\}((?:(?!\{\{#with|\{\{\/with\}\}).)*)\{\{\/with\}\}/g;
            
            processed = processed.replace(withRegex, (match, objectName, blockContent) => {
                hasChanges = true;
                const trimmedObjectName = objectName.trim();
                const obj = this.getVariableValue(trimmedObjectName, variables);
                
                if (typeof obj !== 'object' || obj === null) {
                    context.warnings.push(`Variable "${trimmedObjectName}" is not an object for #with helper`);
                    return '';
                }
                
                // Create new context with the object's properties
                const withContext = { ...variables, ...obj };
                
                // Process variables in the block with the new context
                return blockContent.replace(/\{\{([^}]+)\}\}/g, (varMatch, varName) => {
                    const trimmedVarName = varName.trim();
                    
                    // Skip helper functions
                    if (this.isHelperFunction(trimmedVarName)) {
                        return varMatch;
                    }
                    
                    const value = this.getVariableValue(trimmedVarName, withContext);
                    return value !== undefined ? String(value) : varMatch;
                });
            });
        }
        
        return processed;
    }

    /**
     * Check if variable is a helper function
     */
    static isHelperFunction(variableName) {
        const helpers = ['#each', '/each', '#if', '/if', '#unless', '/unless', '#with', '/with', 'else'];
        return helpers.some(helper => variableName.startsWith(helper) || variableName === helper);
    }

    /**
     * Sanitize HTML content to prevent XSS attacks
     */
    static sanitizeHtml(content) {
        if (typeof content !== 'string') {
            return content;
        }

        // Use DOMPurify for comprehensive XSS protection
        try {
            return DOMPurify.sanitize(content, {
                ALLOWED_TAGS: [
                    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span', 'div',
                    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                    'ul', 'ol', 'li',
                    'table', 'thead', 'tbody', 'tr', 'th', 'td',
                    'a', 'img'
                ],
                ALLOWED_ATTR: [
                    'href', 'src', 'alt', 'title', 'class', 'style',
                    'width', 'height', 'border', 'cellpadding', 'cellspacing'
                ],
                ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
            });
        } catch (error) {
            // Fallback to basic HTML escaping if DOMPurify fails
            return this.escapeHtml(content);
        }
    }

    /**
     * Evaluate conditional expressions with enhanced support
     */
    static evaluateCondition(condition, variables, context) {
        const { warnings } = context;

        try {
            // Handle parentheses for grouping
            if (condition.includes('(') && condition.includes(')')) {
                return this.evaluateComplexCondition(condition, variables, context);
            }

            // Handle logical operators (process OR first, then AND)
            if (condition.includes(' || ')) {
                const parts = condition.split(' || ');
                return parts.some(part => this.evaluateCondition(part.trim(), variables, context));
            }

            if (condition.includes(' && ')) {
                const parts = condition.split(' && ');
                return parts.every(part => this.evaluateCondition(part.trim(), variables, context));
            }

            // Handle negation
            if (condition.startsWith('!')) {
                return !this.evaluateCondition(condition.slice(1).trim(), variables, context);
            }

            // Handle comparison operators (in order of precedence)
            const operators = ['===', '!==', '==', '!=', '>=', '<=', '>', '<'];
            
            for (const op of operators) {
                if (condition.includes(op)) {
                    const [left, right] = condition.split(op).map(s => s.trim());
                    const leftValue = this.getVariableValue(left, variables);
                    const rightValue = this.getVariableValue(right, variables);
                    
                    switch (op) {
                        case '===': return leftValue === rightValue;
                        case '!==': return leftValue !== rightValue;
                        case '==': return leftValue == rightValue;
                        case '!=': return leftValue != rightValue;
                        case '>=': return Number(leftValue) >= Number(rightValue);
                        case '<=': return Number(leftValue) <= Number(rightValue);
                        case '>': return Number(leftValue) > Number(rightValue);
                        case '<': return Number(leftValue) < Number(rightValue);
                    }
                }
            }

            // Handle array/string contains operations
            if (condition.includes(' contains ')) {
                const [left, right] = condition.split(' contains ').map(s => s.trim());
                const leftValue = this.getVariableValue(left, variables);
                const rightValue = this.getVariableValue(right, variables);
                
                if (Array.isArray(leftValue)) {
                    return leftValue.includes(rightValue);
                } else if (typeof leftValue === 'string') {
                    return leftValue.includes(String(rightValue));
                }
                return false;
            }

            // Handle length checks
            if (condition.includes('.length')) {
                const [varName, op, value] = condition.split(/\s*(>|<|>=|<=|===|!==|==|!=)\s*/);
                if (varName && op && value !== undefined) {
                    const variable = this.getVariableValue(varName.replace('.length', ''), variables);
                    const length = Array.isArray(variable) || typeof variable === 'string' ? variable.length : 0;
                    const compareValue = Number(value);
                    
                    switch (op) {
                        case '>': return length > compareValue;
                        case '<': return length < compareValue;
                        case '>=': return length >= compareValue;
                        case '<=': return length <= compareValue;
                        case '===': return length === compareValue;
                        case '!==': return length !== compareValue;
                        case '==': return length == compareValue;
                        case '!=': return length != compareValue;
                    }
                }
            }

            // Simple variable existence or truthiness check
            const value = this.getVariableValue(condition, variables);
            return this.isTruthy(value);

        } catch (error) {
            warnings.push(`Error evaluating condition "${condition}": ${error.message}`);
            return false;
        }
    }

    /**
     * Evaluate complex conditions with parentheses
     */
    static evaluateComplexCondition(condition, variables, context) {
        // Simple parentheses handling - can be enhanced for nested parentheses
        const parenRegex = /\(([^)]+)\)/g;
        
        let processed = condition;
        let match;
        
        while ((match = parenRegex.exec(condition)) !== null) {
            const innerCondition = match[1];
            const result = this.evaluateCondition(innerCondition, variables, context);
            processed = processed.replace(match[0], String(result));
        }
        
        // Evaluate the processed condition
        return this.evaluateCondition(processed, variables, context);
    }

    /**
     * Check if a value is truthy according to template logic
     */
    static isTruthy(value) {
        if (value === null || value === undefined) return false;
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value !== 0;
        if (typeof value === 'string') return value.length > 0;
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'object') return Object.keys(value).length > 0;
        return Boolean(value);
    }

    /**
     * Get variable value with support for nested properties
     */
    static getVariableValue(variablePath, variables) {
        // Handle string literals
        if ((variablePath.startsWith('"') && variablePath.endsWith('"')) ||
            (variablePath.startsWith("'") && variablePath.endsWith("'"))) {
            return variablePath.slice(1, -1);
        }

        // Handle number literals
        if (!isNaN(variablePath) && !isNaN(parseFloat(variablePath))) {
            return parseFloat(variablePath);
        }

        // Handle boolean literals
        if (variablePath === 'true') return true;
        if (variablePath === 'false') return false;
        if (variablePath === 'null') return null;
        if (variablePath === 'undefined') return undefined;

        // Handle nested property access (e.g., user.name)
        const parts = variablePath.split('.');
        let value = variables;

        for (const part of parts) {
            if (value && typeof value === 'object' && part in value) {
                value = value[part];
            } else {
                return undefined;
            }
        }

        return value;
    }

    /**
     * Escape HTML characters
     */
    static escapeHtml(text) {
        const htmlEscapes = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;'
        };

        return text.replace(/[&<>"']/g, (match) => htmlEscapes[match]);
    }

    /**
     * Preview template with sample data
     */
    static async previewTemplate(templateId, sampleData = {}) {
        try {
            const template = await EmailTemplate.findById(templateId);
            if (!template) {
                throw new Error('Template not found');
            }

            // Generate sample data if not provided
            const variables = sampleData.variables || this.generateSampleData(template.variables, template.category);

            // Render with sample data
            const renderResult = this.renderContent(
                template.subject,
                template.content,
                template.variables,
                variables,
                { allowMissingVariables: true }
            );

            return {
                success: true,
                data: {
                    id: template.id,
                    name: template.name,
                    category: template.category,
                    preview: {
                        subject: renderResult.subject,
                        content: renderResult.content,
                        sampleData: variables
                    },
                    warnings: renderResult.warnings
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate sample data for template variables
     */
    static generateSampleData(templateVariables, category) {
        const sampleData = {};

        for (const variable of templateVariables) {
            sampleData[variable.name] = this.generateSampleValue(variable, category);
        }

        return sampleData;
    }

    /**
     * Generate sample value for a variable
     */
    static generateSampleValue(variable, category) {
        // Category-specific sample data
        const categoryDefaults = {
            meter_readings: {
                location_name: 'Main Office Location',
                recipient_name: 'John Smith',
                start_date: '2024-01-01',
                end_date: '2024-01-31',
                total_meters: 15,
                total_consumption: 2450.75,
                company_name: 'Facility Management Co.'
            },
            meter_errors: {
                meter_id: 'MTR-001',
                location_name: 'Main Office Location',
                recipient_name: 'Jane Doe',
                error_code: 'COMM_TIMEOUT',
                error_description: 'Communication timeout after 30 seconds',
                company_name: 'Facility Management Co.'
            },
            maintenance: {
                meter_id: 'MTR-002',
                location_name: 'Warehouse A',
                recipient_name: 'Mike Johnson',
                due_date: '2024-02-15',
                maintenance_type: 'Quarterly Calibration',
                company_name: 'Facility Management Co.'
            }
        };

        // Try category-specific default first
        const categoryData = categoryDefaults[category] || {};
        if (categoryData[variable.name]) {
            return categoryData[variable.name];
        }

        // Generate based on variable type
        switch (variable.type) {
            case 'text':
                return this.generateSampleText(variable.name);
            case 'number':
                return this.generateSampleNumber(variable.name);
            case 'date':
                return new Date().toISOString().split('T')[0];
            case 'boolean':
                return true;
            case 'array':
                return this.generateSampleArray(variable.name);
            case 'object':
                return { key: 'value', example: 'data' };
            default:
                return `Sample ${variable.name}`;
        }
    }

    /**
     * Generate sample text based on variable name
     */
    static generateSampleText(variableName) {
        const textSamples = {
            name: 'John Smith',
            email: 'john.smith@example.com',
            phone: '(555) 123-4567',
            address: '123 Main St, City, State 12345',
            location: 'Main Office Location',
            location: 'Floor 2, Room 201',
            company: 'Facility Management Co.',
            contact: 'support@example.com',
            description: 'Sample description text',
            notes: 'Additional notes and information'
        };

        // Find matching pattern
        for (const [key, value] of Object.entries(textSamples)) {
            if (variableName.toLowerCase().includes(key)) {
                return value;
            }
        }

        return `Sample ${variableName}`;
    }

    /**
     * Generate sample number based on variable name
     */
    static generateSampleNumber(variableName) {
        const numberSamples = {
            count: 15,
            total: 2450.75,
            usage: 1250.50,
            consumption: 875.25,
            reading: 12345.67,
            value: 100.00,
            amount: 500.00,
            percentage: 85.5,
            change: 12.3
        };

        // Find matching pattern
        for (const [key, value] of Object.entries(numberSamples)) {
            if (variableName.toLowerCase().includes(key)) {
                return value;
            }
        }

        return 123.45;
    }

    /**
     * Generate sample array based on variable name
     */
    static generateSampleArray(variableName) {
        if (variableName.includes('meter')) {
            return [
                { meter_id: 'MTR-001', usage: 125.50 },
                { meter_id: 'MTR-002', usage: 98.75 },
                { meter_id: 'MTR-003', usage: 156.25 }
            ];
        }

        if (variableName.includes('task')) {
            return [
                { task_description: 'Check meter calibration' },
                { task_description: 'Inspect physical connections' },
                { task_description: 'Update firmware if needed' }
            ];
        }

        return ['Item 1', 'Item 2', 'Item 3'];
    }

    /**
     * Validate template syntax and variable usage
     */
    static validateTemplate(subject, content, templateVariables = []) {
        const errors = [];
        const warnings = [];

        // Validate subject syntax
        const subjectValidation = VariableProcessor.validateTemplateSyntax(subject);
        if (!subjectValidation.isValid) {
            errors.push(...subjectValidation.errors.map(e => `Subject: ${e}`));
        }
        warnings.push(...subjectValidation.warnings.map(w => `Subject: ${w}`));

        // Validate content syntax
        const contentValidation = VariableProcessor.validateTemplateSyntax(content);
        if (!contentValidation.isValid) {
            errors.push(...contentValidation.errors.map(e => `Content: ${e}`));
        }
        warnings.push(...contentValidation.warnings.map(w => `Content: ${w}`));

        // Extract and validate variables
        const subjectVariables = VariableProcessor.extractVariables(subject);
        const contentVariables = VariableProcessor.extractVariables(content);
        const allUsedVariables = [...new Set([...subjectVariables, ...contentVariables])];

        const definedVariables = templateVariables.map(tv => tv.name);

        // Check for undefined variables
        const undefinedVariables = allUsedVariables.filter(v => !definedVariables.includes(v));
        if (undefinedVariables.length > 0) {
            warnings.push(`Variables used but not defined: ${undefinedVariables.join(', ')}`);
        }

        // Check for unused variables
        const unusedVariables = definedVariables.filter(v => !allUsedVariables.includes(v));
        if (unusedVariables.length > 0) {
            warnings.push(`Variables defined but not used: ${unusedVariables.join(', ')}`);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            usedVariables: allUsedVariables,
            definedVariables,
            undefinedVariables,
            unusedVariables
        };
    }

    /**
     * Get variable schema for a template
     */
    static getVariableSchema(templateVariables) {
        return VariableProcessor.generateSchema(templateVariables);
    }
}

module.exports = TemplateRenderer;