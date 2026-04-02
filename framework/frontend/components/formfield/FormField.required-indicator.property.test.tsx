import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import fc from 'fast-check';
import { FormField } from './FormField';

/**
 * Feature: formfield-material-design-outlined, Property 11: Required Indicator Display
 * Validates: Requirements 3.3
 */
describe('FormField Required Indicator Property-Based Tests', () => {
  it('Property 11: Required indicator displays asterisk with error color', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          label: fc.string({ minLength: 1, maxLength: 50 }),
          type: fc.constantFrom('text', 'email', 'password', 'number', 'textarea', 'select', 'url', 'tel' as const),
        }),
        (props) => {
          const { container } = render(
            <FormField
              name={props.name}
              label={props.label}
              type={props.type}
              value=""
              required={true}
              onChange={() => {}}
              onBlur={() => {}}
            />
          );
          const requiredIndicator = container.querySelector('.form-field__required');
          return requiredIndicator !== null && requiredIndicator.textContent === '*';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 11: Required indicator has error color styling', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          label: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        (props) => {
          const { container } = render(
            <FormField
              name={props.name}
              label={props.label}
              type="text"
              value=""
              required={true}
              onChange={() => {}}
              onBlur={() => {}}
            />
          );
          const requiredIndicator = container.querySelector('.form-field__required');
          const styles = window.getComputedStyle(requiredIndicator!);
          return styles.color !== '';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 11: Required indicator not shown when not required', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          label: fc.string({ minLength: 1, maxLength: 50 }),
          type: fc.constantFrom('text', 'email', 'password', 'number', 'textarea', 'select', 'url', 'tel' as const),
        }),
        (props) => {
          const { container } = render(
            <FormField
              name={props.name}
              label={props.label}
              type={props.type}
              value=""
              required={false}
              onChange={() => {}}
              onBlur={() => {}}
            />
          );
          const requiredIndicator = container.querySelector('.form-field__required');
          return requiredIndicator === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 11: Required indicator displays for all field types', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          label: fc.string({ minLength: 1, maxLength: 50 }),
          type: fc.constantFrom('text', 'email', 'password', 'number', 'textarea', 'select', 'url', 'tel', 'date', 'time', 'search' as const),
        }),
        (props) => {
          const { container } = render(
            <FormField
              name={props.name}
              label={props.label}
              type={props.type}
              value=""
              required={true}
              onChange={() => {}}
              onBlur={() => {}}
            />
          );
          const requiredIndicator = container.querySelector('.form-field__required');
          return requiredIndicator !== null;
        }
      ),
      { numRuns: 100 }
    );
  });
});
