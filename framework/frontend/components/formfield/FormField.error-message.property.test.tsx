import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import fc from 'fast-check';
import { FormField } from './FormField';

/**
 * Feature: formfield-material-design-outlined, Property 12: Error Message Display
 * Validates: Requirements 3.4
 */
describe('FormField Error Message Property-Based Tests', () => {
  it('Property 12: Error message displays when touched and error exists', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          label: fc.string({ minLength: 1, maxLength: 50 }),
          type: fc.constantFrom('text', 'email', 'password', 'number', 'textarea', 'select', 'url', 'tel' as const),
          error: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        (props) => {
          const { queryByText } = render(
            <FormField
              name={props.name}
              label={props.label}
              type={props.type}
              value=""
              error={props.error}
              touched={true}
              onChange={() => {}}
              onBlur={() => {}}
            />
          );
          const errorElement = queryByText(props.error);
          return errorElement !== null;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 12: Error message has error color styling', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          error: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        (props) => {
          const { container } = render(
            <FormField
              name={props.name}
              label="Test"
              type="text"
              value=""
              error={props.error}
              touched={true}
              onChange={() => {}}
              onBlur={() => {}}
            />
          );
          const errorElement = container.querySelector('.form-field__error');
          const styles = window.getComputedStyle(errorElement!);
          return styles.color !== '';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 12: Error message not shown when not touched', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          error: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        (props) => {
          const { queryByText } = render(
            <FormField
              name={props.name}
              label="Test"
              type="text"
              value=""
              error={props.error}
              touched={false}
              onChange={() => {}}
              onBlur={() => {}}
            />
          );
          const errorElement = queryByText(props.error);
          return errorElement === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 12: Error message not shown when no error exists', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        (props) => {
          const { container } = render(
            <FormField
              name={props.name}
              label="Test"
              type="text"
              value=""
              touched={true}
              onChange={() => {}}
              onBlur={() => {}}
            />
          );
          const errorElement = container.querySelector('.form-field__error');
          return errorElement === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 12: Error message has accessibility attributes', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          error: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        (props) => {
          const { container } = render(
            <FormField
              name={props.name}
              label="Test"
              type="text"
              value=""
              error={props.error}
              touched={true}
              onChange={() => {}}
              onBlur={() => {}}
            />
          );
          const errorElement = container.querySelector('[role="alert"]');
          return errorElement !== null;
        }
      ),
      { numRuns: 100 }
    );
  });
});
