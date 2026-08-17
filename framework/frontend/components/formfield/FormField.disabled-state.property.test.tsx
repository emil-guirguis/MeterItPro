import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import fc from 'fast-check';
import { FormField } from './FormField';

/**
 * Feature: formfield-material-design-outlined, Property 9: Disabled Field Appearance
 * Validates: Requirements 3.1
 */
describe('FormField Disabled State Property-Based Tests', () => {
  it('Property 9: Disabled field has reduced opacity', () => {
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
              disabled={true}
              onChange={() => {}}
              onBlur={() => {}}
            />
          );
          const input = container.querySelector('input, textarea, select');
          const styles = window.getComputedStyle(input!);
          return styles.opacity === '0.38' || parseFloat(styles.opacity) === 0.38;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 9: Disabled field has not-allowed cursor', () => {
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
              disabled={true}
              onChange={() => {}}
              onBlur={() => {}}
            />
          );
          const input = container.querySelector('input, textarea, select');
          const styles = window.getComputedStyle(input!);
          return styles.cursor === 'not-allowed';
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 9: Disabled checkbox and radio have not-allowed cursor', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          label: fc.string({ minLength: 1, maxLength: 50 }),
          type: fc.constantFrom('checkbox', 'radio' as const),
        }),
        (props) => {
          const { container } = render(
            <FormField
              name={props.name}
              label={props.label}
              type={props.type}
              value={false}
              disabled={true}
              options={props.type === 'radio' ? [{ value: 'opt1', label: 'Option 1' }] : undefined}
              onChange={() => {}}
              onBlur={() => {}}
            />
          );
          const input = container.querySelector('input[type="checkbox"], input[type="radio"]');
          const styles = window.getComputedStyle(input!);
          return styles.cursor === 'not-allowed';
        }
      ),
      { numRuns: 100 }
    );
  });
});
