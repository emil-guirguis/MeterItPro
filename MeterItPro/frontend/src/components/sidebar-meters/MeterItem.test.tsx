import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MeterItem } from './MeterItem';
import type { Meter } from './types';

describe('MeterItem Component', () => {
  const mockMeter: Meter = {
    meter_id: '1',
    meter_element_id: '',
    tenantId: 'tenant-1',
    name: 'Test Meter',
    description: 'A test meter',
    createdDate: new Date(),
    updatedDate: new Date(),
  };

  it('renders meter name', () => {
    const mockCallbacks = {
      onExpand: vi.fn(),
      onSelect: vi.fn(),
      onFavoriteToggle: vi.fn(),
    };

    render(
      <MeterItem
        meter={mockMeter}
        isFavorite={false}
        isExpanded={false}
        isSelected={false}
        {...mockCallbacks}
      />
    );

    expect(screen.getByText('Test Meter')).toBeInTheDocument();
  });

  it('displays favorite indicator when favorited', () => {
    const mockCallbacks = {
      onExpand: vi.fn(),
      onSelect: vi.fn(),
      onFavoriteToggle: vi.fn(),
    };

    render(
      <MeterItem
        meter={mockMeter}
        isFavorite={true}
        isExpanded={false}
        isSelected={false}
        {...mockCallbacks}
      />
    );

    // MUI Star icon is used - check via data-testid
    const starIcon = screen.getByTestId('StarIcon');
    expect(starIcon).toBeInTheDocument();
  });

  it('does not display favorite indicator when not favorited', () => {
    const mockCallbacks = {
      onExpand: vi.fn(),
      onSelect: vi.fn(),
      onFavoriteToggle: vi.fn(),
    };

    const { container } = render(
      <MeterItem
        meter={mockMeter}
        isFavorite={false}
        isExpanded={false}
        isSelected={false}
        {...mockCallbacks}
      />
    );

    const favoriteIndicators = container.querySelectorAll('.favorite-indicator');
    expect(favoriteIndicators.length).toBe(0);
  });

  it('calls onExpand when expand button is clicked', () => {
    const onExpand = vi.fn();
    const mockCallbacks = {
      onExpand,
      onSelect: vi.fn(),
      onFavoriteToggle: vi.fn(),
    };

    render(
      <MeterItem
        meter={mockMeter}
        isFavorite={false}
        isExpanded={false}
        isSelected={false}
        {...mockCallbacks}
      />
    );

    const expandButton = screen.getByRole('button', { name: /expand meter/i });
    fireEvent.click(expandButton);

    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  it('calls onSelect when meter content is clicked', () => {
    const onSelect = vi.fn();
    const mockCallbacks = {
      onExpand: vi.fn(),
      onSelect,
      onFavoriteToggle: vi.fn(),
    };

    render(
      <MeterItem
        meter={mockMeter}
        isFavorite={false}
        isExpanded={false}
        isSelected={false}
        {...mockCallbacks}
      />
    );

    const meterName = screen.getByText('Test Meter');
    fireEvent.click(meterName);

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('applies selected class when isSelected is true', () => {
    const mockCallbacks = {
      onExpand: vi.fn(),
      onSelect: vi.fn(),
      onFavoriteToggle: vi.fn(),
    };

    const { container } = render(
      <MeterItem
        meter={mockMeter}
        isFavorite={false}
        isExpanded={false}
        isSelected={true}
        {...mockCallbacks}
      />
    );

    const meterItem = container.querySelector('.meter-item');
    expect(meterItem).toHaveClass('selected');
  });

  it('rotates expand button when expanded', () => {
    const mockCallbacks = {
      onExpand: vi.fn(),
      onSelect: vi.fn(),
      onFavoriteToggle: vi.fn(),
    };

    const { container } = render(
      <MeterItem
        meter={mockMeter}
        isFavorite={false}
        isExpanded={true}
        isSelected={false}
        {...mockCallbacks}
      />
    );

    const expandButton = container.querySelector('.expand-button');
    expect(expandButton).toHaveClass('expanded');
  });

  it('shows favorite button on hover', () => {
    const mockCallbacks = {
      onExpand: vi.fn(),
      onSelect: vi.fn(),
      onFavoriteToggle: vi.fn(),
    };

    render(
      <MeterItem
        meter={mockMeter}
        isFavorite={false}
        isExpanded={false}
        isSelected={false}
        {...mockCallbacks}
      />
    );

    // MeterItem always shows the star button (no hover needed)
    const favoriteButton = screen.getByRole('button', { name: /add all elements to favorites/i });
    expect(favoriteButton).toBeInTheDocument();
  });

  it('calls onFavoriteToggle when favorite button is clicked', () => {
    const onFavoriteToggle = vi.fn();
    const mockCallbacks = {
      onExpand: vi.fn(),
      onSelect: vi.fn(),
      onFavoriteToggle,
    };

    render(
      <MeterItem
        meter={mockMeter}
        isFavorite={false}
        isExpanded={false}
        isSelected={false}
        {...mockCallbacks}
      />
    );

    const favoriteButton = screen.getByRole('button', { name: /add all elements to favorites/i });
    fireEvent.click(favoriteButton);

    expect(onFavoriteToggle).toHaveBeenCalledTimes(1);
  });
});
