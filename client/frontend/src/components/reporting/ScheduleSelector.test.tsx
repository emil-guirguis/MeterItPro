import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import ScheduleSelector from './ScheduleSelector';

describe('ScheduleSelector', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  test('should render with predefined schedules', () => {
    render(
      <ScheduleSelector
        schedule="0 9 * * *"
        onChange={mockOnChange}
      />
    );

    expect(screen.getByLabelText('Schedule')).toBeInTheDocument();
  });

  test('should select daily schedule preset', async () => {
    render(
      <ScheduleSelector
        schedule="0 9 * * 1"
        onChange={mockOnChange}
      />
    );

    const select = screen.getByLabelText('Schedule');
    fireEvent.mouseDown(select);

    const dailyOption = screen.getByRole('option', { name: 'Daily at 9:00 AM' });
    fireEvent.click(dailyOption);

    expect(mockOnChange).toHaveBeenCalledWith('0 9 * * *');
  });

  test('should select weekly schedule preset', async () => {
    render(
      <ScheduleSelector
        schedule="0 9 * * *"
        onChange={mockOnChange}
      />
    );

    const select = screen.getByLabelText('Schedule');
    fireEvent.mouseDown(select);

    const weeklyOption = screen.getByRole('option', { name: 'Weekly on Monday at 9:00 AM' });
    fireEvent.click(weeklyOption);

    expect(mockOnChange).toHaveBeenCalledWith('0 9 * * 1');
  });

  test('should select monthly schedule preset', async () => {
    render(
      <ScheduleSelector
        schedule="0 9 * * *"
        onChange={mockOnChange}
      />
    );

    const select = screen.getByLabelText('Schedule');
    fireEvent.mouseDown(select);

    const monthlyOption = screen.getByRole('option', { name: 'Monthly on the 1st at 9:00 AM' });
    fireEvent.click(monthlyOption);

    expect(mockOnChange).toHaveBeenCalledWith('0 9 1 * *');
  });

  test('should show custom cron input when custom is selected', async () => {
    render(
      <ScheduleSelector
        schedule="0 9 * * *"
        onChange={mockOnChange}
      />
    );

    const select = screen.getByLabelText('Schedule');
    fireEvent.mouseDown(select);

    const customOption = screen.getByRole('option', { name: 'Custom Cron Expression' });
    fireEvent.click(customOption);

    expect(screen.getByLabelText('Cron Expression')).toBeInTheDocument();
  });

  test('should update custom cron expression', async () => {
    render(
      <ScheduleSelector
        schedule="custom"
        onChange={mockOnChange}
      />
    );

    const select = screen.getByLabelText('Schedule');
    fireEvent.mouseDown(select);

    const customOption = screen.getByRole('option', { name: 'Custom Cron Expression' });
    fireEvent.click(customOption);

    const cronInput = screen.getByLabelText('Cron Expression');
    await userEvent.clear(cronInput);
    await userEvent.type(cronInput, '*/15 * * * *');

    expect(mockOnChange).toHaveBeenCalledWith('*/15 * * * *');
  });

  test('should display error message for invalid cron', () => {
    render(
      <ScheduleSelector
        schedule="invalid"
        onChange={mockOnChange}
        error="Invalid cron expression format"
      />
    );

    const select = screen.getByLabelText('Schedule');
    fireEvent.mouseDown(select);

    const customOption = screen.getByRole('option', { name: 'Custom Cron Expression' });
    fireEvent.click(customOption);

    expect(screen.getByText('Invalid cron expression format')).toBeInTheDocument();
  });

  test('should disable input when disabled prop is true', () => {
    render(
      <ScheduleSelector
        schedule="0 9 * * *"
        onChange={mockOnChange}
        disabled={true}
      />
    );

    const select = screen.getByLabelText('Schedule');
    expect(select).toHaveAttribute('aria-disabled', 'true');
  });

  test('should recognize non-preset cron as custom', () => {
    render(
      <ScheduleSelector
        schedule="*/30 * * * *"
        onChange={mockOnChange}
      />
    );

    const select = screen.getByLabelText('Schedule');
    fireEvent.mouseDown(select);

    const customOption = screen.getByRole('option', { name: 'Custom Cron Expression' });
    fireEvent.click(customOption);

    const cronInput = screen.getByLabelText('Cron Expression') as HTMLInputElement;
    expect(cronInput.value).toBe('*/30 * * * *');
  });

  test('should display schedule value when preset is selected', () => {
    render(
      <ScheduleSelector
        schedule="0 9 * * *"
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Schedule: 0 9 * * *')).toBeInTheDocument();
  });

  test('should show cron help text when custom is selected', async () => {
    render(
      <ScheduleSelector
        schedule="0 9 * * *"
        onChange={mockOnChange}
      />
    );

    const select = screen.getByLabelText('Schedule');
    fireEvent.mouseDown(select);

    const customOption = screen.getByRole('option', { name: 'Custom Cron Expression' });
    fireEvent.click(customOption);

    expect(screen.getByText(/Cron format:/)).toBeInTheDocument();
    // "Daily at 9:00 AM" appears in the help text within the cron input helper text
    expect(screen.getAllByText(/Daily at 9:00 AM/)[0]).toBeInTheDocument();
  });

  test('should handle switching between presets', async () => {
    render(
      <ScheduleSelector
        schedule="0 9 * * *"
        onChange={mockOnChange}
      />
    );

    const select = screen.getByLabelText('Schedule');

    // Switch to weekly
    fireEvent.mouseDown(select);
    const weeklyOption = screen.getByRole('option', { name: 'Weekly on Monday at 9:00 AM' });
    fireEvent.click(weeklyOption);

    expect(mockOnChange).toHaveBeenCalledWith('0 9 * * 1');

    // Switch to monthly
    fireEvent.mouseDown(select);
    const monthlyOption = screen.getByRole('option', { name: 'Monthly on the 1st at 9:00 AM' });
    fireEvent.click(monthlyOption);

    expect(mockOnChange).toHaveBeenCalledWith('0 9 1 * *');
  });
});
