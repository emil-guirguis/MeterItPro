/**
 * Variable Processor Service
 * Advanced variable processing, validation, and type conversion for email templates
 */

class VariableProcessor {
    /**
     * Process and validate variables against template definitions
     */
    static processVariables(variables, templateVariables, options = {}) {
        const {
            strict = false,
            convertTypes = true,
            sanitizeHtml = true,
            allowExtraVariables = true
        } = options;

        const processed = {};
        const errors = [];
        const warnings = [];

        // Create a map of template variables for quick lookup
        const templateVarMap = new Map();
        templateVariables.forEach(tv => templateVarMap.set(tv.name, tv));

        // Process each provided variable
        for (const [name, value] of Object.entries(variables)) {
            const templateVar = templateVarMap.get(name);

            if (!templateVar) {
                if (!allowExtraVariables) {
                    warnings.push(`Variable "${name}" is not defined in template`);
                }
                processed[name] = value;
                continue;
            }

            try {
                // Validate required variables
                if (templateVar.required && (value === null || value === undefined || value === '')) {
                    errors.push(`Required variable "${name}" is missing or empty`);
                    continue;
                }

                // Type conversion and validation
                let processedValue = value;
                if (convertTypes && value !== null && value !== undefined) {
                    processedValue = this.convertVariableType(value, templateVar, { sanitizeHtml });
                }

                // Additional validation
                const validation = this.validateVariable(processedValue, templateVar);
                if (!validation.isValid) {
                    errors.push(`Variable "${name}": ${validation.error}`);
                    continue;
                }

                if (validation.warnings.length > 0) {
                    warnings.push(...validation.warnings.map(w => `Variable "${name}": ${w}`));
                }

                processed[name] = processedValue;
            } catch (error) {
                errors.push(`Error processing variable "${name}": ${error.message}`);
            }
        }

        // Check for missing required variables
        templateVariables.forEach(tv => {
            if (tv.required && !(tv.name in variables)) {
                errors.push(`Required variable "${tv.name}" is not provided`);
            }
        });

        return {
            success: errors.length === 0,
            variables: processed,
            errors,
            warnings
        };
    }

    /**
     * Convert variable to the specified type
     */
    static convertVariableType(value, templateVar, options = {}) {
        const { sanitizeHtml = true } = options;

        switch (templateVar.type) {
            case 'text':
                return this.convertToText(value, templateVar, { sanitizeHtml });
            
            case 'number':
                return this.convertToNumber(value, templateVar);
            
            case 'date':
                return this.convertToDate(value, templateVar);
            
            case 'boolean':
                return this.convertToBoolean(value, templateVar);
            
            case 'array':
                return this.convertToArray(value, templateVar);
            
            case 'object':
                return this.convertToObject(value, templateVar);
            
            default:
                return value;
        }
    }

    /**
     * Convert to text with sanitization
     */
    static convertToText(value, templateVar, options = {}) {
        const { sanitizeHtml = true } = options;
        
        let text = String(value);
        
        // Apply length limits
        if (templateVar.maxLength && text.length > templateVar.maxLength) {
            text = text.substring(0, templateVar.maxLength);
        }
        
        // Apply pattern validation
        if (templateVar.pattern) {
            const regex = new RegExp(templateVar.pattern);
            if (!regex.test(text)) {
                throw new Error(`Text does not match required pattern: ${templateVar.pattern}`);
            }
        }
        
        // HTML sanitization
        if (sanitizeHtml && templateVar.allowHtml !== true) {
            text = this.escapeHtml(text);
        }
        
        return text;
    }

    /**
     * Convert to number with validation
     */
    static convertToNumber(value, templateVar) {
        let num;
        
        if (typeof value === 'number') {
            num = value;
        } else if (typeof value === 'string') {
            // Remove common formatting characters
            const cleaned = value.replace(/[$,\s]/g, '');
            num = parseFloat(cleaned);
        } else {
            num = Number(value);
        }
        
        if (isNaN(num)) {
            throw new Error('Invalid number value');
        }
        
        // Apply range validation
        if (templateVar.min !== undefined && num < templateVar.min) {
            throw new Error(`Number ${num} is below minimum value ${templateVar.min}`);
        }
        
        if (templateVar.max !== undefined && num > templateVar.max) {
            throw new Error(`Number ${num} is above maximum value ${templateVar.max}`);
        }
        
        // Apply precision
        if (templateVar.precision !== undefined) {
            num = parseFloat(num.toFixed(templateVar.precision));
        }
        
        return num;
    }

    /**
     * Convert to date with validation
     */
    static convertToDate(value, templateVar) {
        let date;
        
        if (value instanceof Date) {
            date = value;
        } else if (typeof value === 'string' || typeof value === 'number') {
            date = new Date(value);
        } else {
            throw new Error('Invalid date value');
        }
        
        if (isNaN(date.getTime())) {
            throw new Error('Invalid date value');
        }
        
        // Apply date range validation
        if (templateVar.minDate) {
            const minDate = new Date(templateVar.minDate);
            if (date < minDate) {
                throw new Error(`Date is before minimum date ${templateVar.minDate}`);
            }
        }
        
        if (templateVar.maxDate) {
            const maxDate = new Date(templateVar.maxDate);
            if (date > maxDate) {
                throw new Error(`Date is after maximum date ${templateVar.maxDate}`);
            }
        }
        
        return date;
    }

    /**
     * Convert to boolean
     */
    static convertToBoolean(value, templateVar) {
        if (typeof value === 'boolean') {
            return value;
        }
        
        if (typeof value === 'string') {
            const lower = value.toLowerCase().trim();
            if (['true', '1', 'yes', 'on', 'enabled'].includes(lower)) {
                return true;
            }
            if (['false', '0', 'no', 'off', 'disabled'].includes(lower)) {
                return false;
            }
        }
        
        if (typeof value === 'number') {
            return value !== 0;
        }
        
        return Boolean(value);
    }

    /**
     * Convert to array with validation
     */
    static convertToArray(value, templateVar) {
        let array;
        
        if (Array.isArray(value)) {
            array = value;
        } else if (typeof value === 'string') {
            try {
                // Try to parse as JSON first
                array = JSON.parse(value);
                if (!Array.isArray(array)) {
                    // Split by comma if not JSON
                    array = value.split(',').map(item => item.trim());
                }
            } catch {
                // Split by comma
                array = value.split(',').map(item => item.trim());
            }
        } else {
            throw new Error('Invalid array value');
        }
        
        // Apply length validation
        if (templateVar.minLength !== undefined && array.length < templateVar.minLength) {
            throw new Error(`Array has ${array.length} items, minimum required is ${templateVar.minLength}`);
        }
        
        if (templateVar.maxLength !== undefined && array.length > templateVar.maxLength) {
            throw new Error(`Array has ${array.length} items, maximum allowed is ${templateVar.maxLength}`);
        }
        
        // Validate array items if itemType is specified
        if (templateVar.itemType) {
            array = array.map((item, index) => {
                try {
                    return this.convertVariableType(item, { 
                        ...templateVar, 
                        type: templateVar.itemType,
                        name: `${templateVar.name}[${index}]`
                    });
                } catch (error) {
                    throw new Error(`Array item ${index}: ${error.message}`);
                }
            });
        }
        
        return array;
    }

    /**
     * Convert to object with validation
     */
    static convertToObject(value, templateVar) {
        let obj;
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            obj = value;
        } else if (typeof value === 'string') {
            try {
                obj = JSON.parse(value);
                if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
                    throw new Error('Parsed value is not an object');
                }
            } catch {
                throw new Error('Invalid JSON object string');
            }
        } else {
            throw new Error('Invalid object value');
        }
        
        // Validate required properties
        if (templateVar.requiredProperties) {
            for (const prop of templateVar.requiredProperties) {
                if (!(prop in obj)) {
                    throw new Error(`Required property "${prop}" is missing`);
                }
            }
        }
        
        // Validate property types if schema is provided
        if (templateVar.schema) {
            for (const [propName, propSchema] of Object.entries(templateVar.schema)) {
                if (propName in obj) {
                    try {
                        obj[propName] = this.convertVariableType(obj[propName], {
                            ...propSchema,
                            name: `${templateVar.name}.${propName}`
                        });
                    } catch (error) {
                        throw new Error(`Property "${propName}": ${error.message}`);
                    }
                }
            }
        }
        
        return obj;
    }

    /**
     * Validate a processed variable
     */
    static validateVariable(value, templateVar) {
        const warnings = [];
        
        try {
            // Custom validation function
            if (templateVar.validate && typeof templateVar.validate === 'function') {
                const customResult = templateVar.validate(value);
                if (customResult !== true) {
                    return {
                        isValid: false,
                        error: typeof customResult === 'string' ? customResult : 'Custom validation failed',
                        warnings
                    };
                }
            }
            
            // Enum validation
            if (templateVar.enum && !templateVar.enum.includes(value)) {
                return {
                    isValid: false,
                    error: `Value must be one of: ${templateVar.enum.join(', ')}`,
                    warnings
                };
            }
            
            // Additional type-specific validations
            switch (templateVar.type) {
                case 'text':
                    if (templateVar.minLength && value.length < templateVar.minLength) {
                        return {
                            isValid: false,
                            error: `Text must be at least ${templateVar.minLength} characters`,
                            warnings
                        };
                    }
                    break;
                    
                case 'array':
                    if (templateVar.uniqueItems && new Set(value).size !== value.length) {
                        warnings.push('Array contains duplicate items');
                    }
                    break;
            }
            
            return {
                isValid: true,
                warnings
            };
            
        } catch (error) {
            return {
                isValid: false,
                error: error.message,
                warnings
            };
        }
    }

    /**
     * Generate variable schema from template variables
     */
    static generateSchema(templateVariables) {
        const schema = {
            type: 'object',
            properties: {},
            required: []
        };
        
        templateVariables.forEach(tv => {
            const property = {
                type: this.mapTypeToJsonSchema(tv.type),
                description: tv.description
            };
            
            // Add type-specific constraints
            switch (tv.type) {
                case 'text':
                    if (tv.minLength) property.minLength = tv.minLength;
                    if (tv.maxLength) property.maxLength = tv.maxLength;
                    if (tv.pattern) property.pattern = tv.pattern;
                    if (tv.enum) property.enum = tv.enum;
                    break;
                    
                case 'number':
                    if (tv.min !== undefined) property.minimum = tv.min;
                    if (tv.max !== undefined) property.maximum = tv.max;
                    break;
                    
                case 'array':
                    if (tv.minLength !== undefined) property.minItems = tv.minLength;
                    if (tv.maxLength !== undefined) property.maxItems = tv.maxLength;
                    if (tv.itemType) {
                        property.items = { type: this.mapTypeToJsonSchema(tv.itemType) };
                    }
                    if (tv.uniqueItems) property.uniqueItems = true;
                    break;
                    
                case 'object':
                    if (tv.requiredProperties) property.required = tv.requiredProperties;
                    if (tv.schema) {
                        property.properties = {};
                        for (const [propName, propSchema] of Object.entries(tv.schema)) {
                            property.properties[propName] = {
                                type: this.mapTypeToJsonSchema(propSchema.type),
                                description: propSchema.description
                            };
                        }
                    }
                    break;
            }
            
            schema.properties[tv.name] = property;
            
            if (tv.required) {
                schema.required.push(tv.name);
            }
        });
        
        return schema;
    }

    /**
     * Map internal types to JSON Schema types
     */
    static mapTypeToJsonSchema(type) {
        const typeMap = {
            'text': 'string',
            'number': 'number',
            'date': 'string',
            'boolean': 'boolean',
            'array': 'array',
            'object': 'object'
        };
        
        return typeMap[type] || 'string';
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
            "'": '&#x27;',
            '/': '&#x2F;'
        };

        return text.replace(/[&<>"'/]/g, (match) => htmlEscapes[match]);
    }

    /**
     * Extract variables from template content
     */
    static extractVariables(templateContent) {
        const variables = new Set();
        const variablePattern = /\{\{([^}]+)\}\}/g;
        let match;

        while ((match = variablePattern.exec(templateContent)) !== null) {
            const variableName = match[1].trim();
            
            // Skip helper functions
            if (!this.isHelperFunction(variableName)) {
                // Handle nested properties (e.g., user.name -> user)
                const rootVariable = variableName.split('.')[0];
                variables.add(rootVariable);
            }
        }

        return Array.from(variables);
    }

    /**
     * Check if variable name is a helper function
     */
    static isHelperFunction(variableName) {
        const helpers = ['#each', '/each', '#if', '/if', '#unless', '/unless', '#with', '/with', 'else', '@index', '@first', '@last', '@length', 'this'];
        return helpers.some(helper => 
            variableName.startsWith(helper) || 
            variableName === helper ||
            variableName.startsWith('@')
        );
    }

    /**
     * Validate template syntax
     */
    static validateTemplateSyntax(templateContent) {
        const errors = [];
        const warnings = [];

        // Check for unmatched helper blocks
        const helpers = ['each', 'if', 'unless', 'with'];
        
        helpers.forEach(helper => {
            const openPattern = new RegExp(`\\{\\{#${helper}\\s+[^}]+\\}\\}`, 'g');
            const closePattern = new RegExp(`\\{\\{\\/${helper}\\}\\}`, 'g');
            
            const openMatches = (templateContent.match(openPattern) || []).length;
            const closeMatches = (templateContent.match(closePattern) || []).length;
            
            if (openMatches !== closeMatches) {
                errors.push(`Unmatched ${helper} blocks: ${openMatches} opening, ${closeMatches} closing`);
            }
        });

        // Check for invalid variable syntax
        const invalidVariables = templateContent.match(/\{\{[^}]*\}\}/g) || [];
        invalidVariables.forEach(variable => {
            if (variable === '{{}}') {
                errors.push('Empty variable placeholder found');
            }
        });

        // Check for potentially dangerous content
        const dangerousPatterns = [
            { pattern: /<script/i, message: 'Script tags detected in template' },
            { pattern: /javascript:/i, message: 'JavaScript URLs detected in template' },
            { pattern: /on\w+\s*=/i, message: 'Event handlers detected in template' }
        ];

        dangerousPatterns.forEach(({ pattern, message }) => {
            if (pattern.test(templateContent)) {
                warnings.push(message);
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
}

module.exports = VariableProcessor;