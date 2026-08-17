import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StarIcon } from './StarIcon';
import '@testing-library/jest-dom';

describe('StarIcon Component', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  describe('Rendering', () => {
    it('should render filled star when is_favorited is true', () => {
      render(
        <StarIcon
          id1="meter-1"
          id2="element-1"
          is_favorited={true}
          is_loading={false}
          on_click={mockOnClick}
        />
      );

      const filledStar = screen.getByTestId('star-icon-filled-meter-1-element-1');
      expect(filledStar).toBeInTheDocument();
    });

    it('should render outlined star when is_favorited is false', () => {
      render(
        <StarIcon
          id1="meter-1"
          id2="element-1"
          is_favorited={false}
          is_loading={false}
          on_click={mockOnClick}
        />
      );

      const outlinedStar = screen.getByTestId('star-icon-outlined-meter-1-element-1');
      expect(outlinedStar).toBeInTheDocument();
    });

    it('should render loading spinner when is_loading is true', () => {
      render(
        <StarIcon
          id1="meter-1"
          id2="element-1"
          is_favorited={false}
          is_loading={true}
          on_click={mockOnClick}
        />
      );

      const loadingSpinner = screen.getByTestId('star-icon-loading-meter-1-element-1');
      expect(loadingSpinner).toBeInTheDocument();
    });

    it('should not render star icon when is_loading is true', () => {
      render(
        <StarIcon
          id1="meter-1"
          id2="element-1"
          is_favorited={true}
          is_loading={true}
          on_click={mockOnClick}
        />
      );

      const filledStar = screen.queryByTestId('star-icon-filled-meter-1-element-1');
      expect(filledStar).not.toBeInTheDocument();
    });
  });

  describe('Click Handling', () => {
    it('should call on_click when star icon is clicked', async () => {
      const user = userEvent.setup();
      render(
        <StarIcon
          id1="meter-1"
          id2="element-1"
          is_favorited={false}
          is_loading={false}
          on_click={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should stop event propagation on click', async () => {
      const user = userEvent.setup();
      const parentClickHandler = vi.fn();

      const { container } = render(
        <div onClick={parentClickHandler}>
          <StarIcon
            id1="meter-1"
            id2="element-1"
            is_favorited={false}
            is_loading={false}
            on_click={mockOnClick}
          />
        </div>
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
      expect(parentClickHandler).not.toHaveBeenCalled();
    });

    it('should not call on_click when button is disabled (loading)', async () => {
      const user = userEvent.setup();
      render(
        <StarIcon
          id1="meter-1"
          id2="element-1"
          is_favorited={false}
          is_loading={true}
          on_click={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have correct aria-label when favorited', () => {
      render(
        <StarIcon
          id1="meter-1"
          id2="element-1"
          is_favorited={true}
          is_loading={false}
          on_click={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Remove from favorites');
    });

    it('should have correct aria-label when not favorited', () => {
      render(
        <StarIcon
          id1="meter-1"
          id2="element-1"
          is_favorited={false}
          is_loading={false}
          on_click={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Add to favorites');
    });

    it('should have correct title attribute when favorited', () => {
      render(
        <StarIcon
          id1="meter-1"
          id2="element-1"
          is_favorited={true}
          is_loading={false}
          on_click={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Remove from favorites');
    });

    it('should have correct title attribute when not favorited', () => {
      render(
        <StarIcon
          id1="meter-1"
          id2="element-1"
          is_favorited={false}
          is_loading={false}
          on_click={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Add to favorites');
    });
  });

  describe('State Transitions', () => {
    it('should transition from outlined to filled when is_favorited changes', () => {
      const { rerender } = render(
        <StarIcon
          id1="meter-1"
          id2="element-1"
          is_favorited={false}
          is_loading={false}
          on_click={mockOnClick}
        />
      );

      let outlinedStar = screen.getByTestId('star-icon-outlined-meter-1-element-1');
      expect(outlinedStar).toBeInTheDocument();

      rerender(
        <StarIcon
          id1="meter-1"
          id2="element-1"
          is_favorited={true}
          is_loading={false}
          on_click={mockOnClick}
        />
      );

      outlinedStar = screen.queryByTestId('star-icon-outlined-meter-1-element-1');
      expect(outlinedStar).not.toBeInTheDocument();

      const filledStar = screen.getByTestId('star-icon-filled-meter-1-element-1');
      expect(filledStar).toBeInTheDocument();
    });

    it('should transition from filled to outlined when is_favorited changes', () => {
      const { rerender } = render(
        <StarIcon
          id1="meter-1"
          id2="element-1"
          is_favorited={true}
          is_loading={false}
          on_click={mockOnClick}
        />
      );

      let filledStar = screen.getByTestId('star-icon-filled-meter-1-element-1');
      expect(filledStar).toBeInTheDocument();

      rerender(
        <StarIcon
          id1="meter-1"
          id2="element-1"
          is_favorited={false}
          is_loading={false}
          on_click={mockOnClick}
        />
      );

      filledStar = screen.queryByTestId('star-icon-filled-meter-1-element-1');
      expect(filledStar).not.toBeInTheDocument();

      const outlinedStar = screen.getByTestId('star-icon-outlined-meter-1-element-1');
      expect(outlinedStar).toBeInTheDocument();
    });

    it('should show loading spinner when is_loading transitions to true', () => {
      const { rerender } = render(
        <StarIcon
          id1="meter-1"
          id2="element-1"
          is_favorited={false}
          is_loading={false}
          on_click={mockOnClick}
        />
      );

      let outlinedStar = screen.getByTestId('star-icon-outlined-meter-1-element-1');
      expect(outlinedStar).toBeInTheDocument();

      rerender(
        <StarIcon
          id1="meter-1"
          id2="element-1"
          is_favorited={false}
          is_loading={true}
          on_click={mockOnClick}
        />
      );

      outlinedStar = screen.queryByTestId('star-icon-outlined-meter-1-element-1');
      expect(outlinedStar).not.toBeInTheDocument();

      const loadingSpinner = screen.getByTestId('star-icon-loading-meter-1-element-1');
      expect(loadingSpinner).toBeInTheDocument();
    });

    it('should hide loading spinner when is_loading transitions to false', () => {
      const { rerender } = render(
        <StarIcon
          id1="meter-1"
          id2="element-1"
          is_favorited={false}
          is_loading={true}
          on_click={mockOnClick}
        />
      );

      let loadingSpinner = screen.getByTestId('star-icon-loading-meter-1-element-1');
      expect(loadingSpinner).toBeInTheDocument();

      rerender(
        <StarIcon
          id1="meter-1"
          id2="element-1"
          is_favorited={false}
          is_loading={false}
          on_click={mockOnClick}
        />
      );

      loadingSpinner = screen.queryByTestId('star-icon-loading-meter-1-element-1');
      expect(loadingSpinner).not.toBeInTheDocument();

      const outlinedStar = screen.getByTestId('star-icon-outlined-meter-1-element-1');
      expect(outlinedStar).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid clicks gracefully', async () => {
      const user = userEvent.setup();
      render(
        <StarIcon
          id1="meter-1"
          id2="element-1"
          is_favorited={false}
          is_loading={false}
          on_click={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(3);
    });

    it('should handle different id1 and id2 values', () => {
      render(
        <StarIcon
          id1="meter-123"
          id2="element-456"
          is_favorited={true}
          is_loading={false}
          on_click={mockOnClick}
        />
      );

      const filledStar = screen.getByTestId('star-icon-filled-meter-123-element-456');
      expect(filledStar).toBeInTheDocument();
    });
  });
});
