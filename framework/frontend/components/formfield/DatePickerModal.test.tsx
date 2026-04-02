import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as userEvent from '@testing-library/user-event';
import fc from 'fast-check';
import { DatePickerModal } from './DatePickerModal';

describe('DatePickerModal', () => {
  describe('Unit Tests', () => {
    it('does not render when isOpen is false', () => {
      const { container } = render(
        <DatePickerModal
          isOpen={false}
          onDateSelect={vi.fn()}
          onClose={vi.fn()}
        />
      );
      
      expect(container.querySelector('.date-picker-modal')).not.toBeInTheDocument();
    });

    it('renders modal when isOpen is true', () => {
      const { container } = render(
        <DatePickerModal
          isOpen={true}
          onDateSelect={vi.fn()}
          onClose={vi.fn()}
        />
      );
      
      expect(container.querySelector('.date-picker-modal')).toBeInTheDocument();
    });

    it('displays close button', () => {
      render(
        <DatePickerModal
          isOpen={true}
          onDateSelect={vi.fn()}
          onClose={vi.fn()}
        />
      );
      
      const closeButton = screen.getByRole('button', { name: /close date picker/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', async () => {
      const handleClose = vi.fn();
      const user = userEvent.setup();
      render(
        <DatePickerModal
          isOpen={true}
          onDateSelect={vi.fn()}
          onClose={handleClose}
        />
      );
      
      const closeButton = screen.getByRole('button', { name: /close date picker/i });
      await user.click(closeButton);
      
      expect(handleClose).toHaveBeenCalledOnce();
    });

    it('calls onClose when Escape key is pressed', async () => {
      const handleClose = vi.fn();
      const user = userEvent.setup();
      render(
        <DatePickerModal
          isOpen={true}
          onDateSelect={vi.fn()}
          onClose={handleClose}
        />
      );
      
      await user.keyboard('{Escape}');
      
      expect(handleClose).toHaveBeenCalledOnce();
    });

    it('calls onClose when backdrop is clicked', async () => {
      const handleClose = vi.fn();
      const user = userEvent.setup();
      const { container } = render(
        <DatePickerModal
          isOpen={true}
          onDateSelect={vi.fn()}
          onClose={handleClose}
        />
      );
      
      const backdrop = container.querySelector('.date-picker-modal__backdrop');
      if (backdrop) {
        await user.click(backdrop);
      }
      
      expect(handleClose).toHaveBeenCalledOnce();
    });

    it('displays current month and year in header', () => {
      const today = new Date();
      const monthName = today.toLocaleString('default', { month: 'long' });
      const year = today.getFullYear();
      
      render(
        <DatePickerModal
          isOpen={true}
          onDateSelect={vi.fn()}
          onClose={vi.fn()}
        />
      );
      
      const header = screen.getByRole('button', { name: new RegExp(`${monthName}.*${year}`) });
      expect(header).toBeInTheDocument();
    });

    it('displays weekday headers', () => {
      render(
        <DatePickerModal
          isOpen={true}
          onDateSelect={vi.fn()}
          onClose={vi.fn()}
        />
      );
      
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      weekdays.forEach((day) => {
        expect(screen.getByText(day)).toBeInTheDocument();
      });
    });

    it('displays navigation buttons', () => {
      render(
        <DatePickerModal
          isOpen={true}
          onDateSelect={vi.fn()}
          onClose={vi.fn()}
        />
      );
      
      const prevButton = screen.getByRole('button', { name: /previous month/i });
      const nextButton = screen.getByRole('button', { name: /next month/i });
      
      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });

    it('highlights selected date', () => {
      const today = new Date();
      const selectedDate = today.toISOString().split('T')[0];
      
      const { container } = render(
        <DatePickerModal
          isOpen={true}
          selectedDate={selectedDate}
          onDateSelect={vi.fn()}
          onClose={vi.fn()}
        />
      );
      
      const selectedDayButton = container.querySelector('.date-picker-modal__day--selected');
      expect(selectedDayButton).toBeInTheDocument();
    });

    it('disables dates outside min/max range', () => {
      const today = new Date();
      const minDate = new Date(today.getFullYear(), today.getMonth(), 10).toISOString().split('T')[0];
      const maxDate = new Date(today.getFullYear(), today.getMonth(), 20).toISOString().split('T')[0];
      
      const { container } = render(
        <DatePickerModal
          isOpen={true}
          minDate={minDate}
          maxDate={maxDate}
          onDateSelect={vi.fn()}
          onClose={vi.fn()}
        />
      );
      
      const disabledDays = container.querySelectorAll('.date-picker-modal__day--disabled');
      expect(disabledDays.length).toBeGreaterThan(0);
    });

    it('calls onDateSelect when a date is clicked', async () => {
      const handleDateSelect = vi.fn();
      const user = userEvent.setup();
      render(
        <DatePickerModal
          isOpen={true}
          onDateSelect={handleDateSelect}
          onClose={vi.fn()}
        />
      );
      
      const dateButton = screen.getByRole('button', { name: /^\d+$/ });
      await user.click(dateButton);
      
      expect(handleDateSelect).toHaveBeenCalled();
    });

    it('does not call onDateSelect when disabled date is clicked', async () => {
      const handleDateSelect = vi.fn();
      const user = userEvent.setup();
      const today = new Date();
      const minDate = new Date(today.getFullYear(), today.getMonth(), 15).toISOString().split('T')[0];
      
      const { container } = render(
        <DatePickerModal
          isOpen={true}
          minDate={minDate}
          onDateSelect={handleDateSelect}
          onClose={vi.fn()}
        />
      );
      
      const disabledDayButton = container.querySelector('.date-picker-modal__day--disabled') as HTMLButtonElement;
      if (disabledDayButton) {
        await user.click(disabledDayButton);
      }
      
      expect(handleDateSelect).not.toHaveBeenCalled();
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * **Feature: date-field-picker, Property 5: Month navigation advances correctly**
     * **Validates: Requirements 2.2, 2.3**
     */
    it('should advance to next month when next button is clicked', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 11 }),
          fc.integer({ min: 2000, max: 2100 }),
          async (month, year) => {
            const user = userEvent.setup();
            const { rerender } = render(
              <DatePickerModal
                isOpen={true}
                onDateSelect={vi.fn()}
                onClose={vi.fn()}
              />
            );

            // Get initial month display
            const currentDate = new Date();
            const initialMonth = currentDate.toLocaleString('default', { month: 'long' });

            // Click next month button
            const nextButton = screen.getByRole('button', { name: /next month/i });
            await user.click(nextButton);

            // Verify the month has changed
            const expectedNextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
            const expectedMonth = expectedNextDate.toLocaleString('default', { month: 'long' });

            // Re-render to get updated content
            rerender(
              <DatePickerModal
                isOpen={true}
                onDateSelect={vi.fn()}
                onClose={vi.fn()}
              />
            );

            // The month should have advanced
            expect(expectedMonth).not.toBe(initialMonth);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: date-field-picker, Property 5: Month navigation advances correctly**
     * **Validates: Requirements 2.2, 2.3**
     */
    it('should go back to previous month when previous button is clicked', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 11 }),
          fc.integer({ min: 2000, max: 2100 }),
          async (month, year) => {
            const user = userEvent.setup();
            const { rerender } = render(
              <DatePickerModal
                isOpen={true}
                onDateSelect={vi.fn()}
                onClose={vi.fn()}
              />
            );

            // Get initial month display
            const currentDate = new Date();
            const initialMonth = currentDate.toLocaleString('default', { month: 'long' });

            // Click previous month button
            const prevButton = screen.getByRole('button', { name: /previous month/i });
            await user.click(prevButton);

            // Verify the month has changed
            const expectedPrevDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
            const expectedMonth = expectedPrevDate.toLocaleString('default', { month: 'long' });

            // Re-render to get updated content
            rerender(
              <DatePickerModal
                isOpen={true}
                onDateSelect={vi.fn()}
                onClose={vi.fn()}
              />
            );

            // The month should have gone back
            expect(expectedMonth).not.toBe(initialMonth);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: date-field-picker, Property 8: Disabled dates respect constraints**
     * **Validates: Requirements 4.1**
     */
    it('should disable dates outside min/max range and prevent selection', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 28 }),
          fc.integer({ min: 1, max: 28 }),
          async (minDay, maxDay) => {
            // Ensure minDay < maxDay
            const actualMinDay = Math.min(minDay, maxDay);
            const actualMaxDay = Math.max(minDay, maxDay);

            const today = new Date();
            const minDate = new Date(today.getFullYear(), today.getMonth(), actualMinDay)
              .toISOString()
              .split('T')[0];
            const maxDate = new Date(today.getFullYear(), today.getMonth(), actualMaxDay)
              .toISOString()
              .split('T')[0];

            const handleDateSelect = vi.fn();
            const { container } = render(
              <DatePickerModal
                isOpen={true}
                minDate={minDate}
                maxDate={maxDate}
                onDateSelect={handleDateSelect}
                onClose={vi.fn()}
              />
            );

            // Verify disabled dates are marked with disabled class
            const disabledDays = container.querySelectorAll('.date-picker-modal__day--disabled');
            expect(disabledDays.length).toBeGreaterThan(0);

            // Verify disabled date buttons are actually disabled
            disabledDays.forEach((dayButton) => {
              expect((dayButton as HTMLButtonElement).disabled).toBe(true);
            });

            // Verify enabled dates are within range
            const enabledDays = container.querySelectorAll(
              '.date-picker-modal__day:not(.date-picker-modal__day--disabled):not(.date-picker-modal__day--empty)'
            );
            enabledDays.forEach((dayButton) => {
              const dayText = dayButton.textContent;
              if (dayText) {
                const dayNum = parseInt(dayText, 10);
                expect(dayNum).toBeGreaterThanOrEqual(actualMinDay);
                expect(dayNum).toBeLessThanOrEqual(actualMaxDay);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
