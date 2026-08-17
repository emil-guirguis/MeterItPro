/**
 * Tool validation utilities
 */

import Joi from 'joi';

export function validateToolArgs(args: any, schema: Joi.Schema): { valid: boolean; errors?: string[] } {
  const { error } = schema.validate(args, { abortEarly: false });

  if (error) {
    return {
      valid: false,
      errors: error.details.map(detail => detail.message),
    };
  }

  return { valid: true };
}

export function createToolValidator(schema: Joi.Schema) {
  return async (args: any) => validateToolArgs(args, schema);
}
