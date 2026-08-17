import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import RecipientManager from './RecipientManager';

describe('RecipientManager', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  test('should render with empty recipients', () => {
    render(
      <RecipientManager
        recipients={[]}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  test('should add a valid email recipient', async () => {
    render(
      <RecipientManager
        recipients={[]}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByLabelText('Email Address');
    const addButton = screen.getByRole('button', { name: /add/i });

    await userEvent.type(input, 'user@example.com');
    fireEvent.click(addButton);

    expect(mockOnChange).toHaveBeenCalledWith(['user@example.com']);
  });

  test('should reject invalid email format', async () => {
    render(
      <RecipientManager
        recipients={[]}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByLabelText('Email Address');
    const addButton = screen.getByRole('button', { name: /add/i });

    await userEvent.type(input, 'invalid-email');
    fireEvent.click(addButton);

    expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  test('should reject empty email', async () => {
    render(
      <RecipientManager
        recipients={[]}
        onChange={mockOnChange}
      />
    );

    const addButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addButton);

    expect(screen.getByText('Email address is required')).toBeInTheDocument();
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  test('should reject duplicate email', async () => {
    render(
      <RecipientManager
        recipients={['user@example.com']}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByLabelText('Email Address');
    const addButton = screen.getByRole('button', { name: /add/i });

    await userEvent.type(input, 'user@example.com');
    fireEvent.click(addButton);

    expect(screen.getByText('This email is already added')).toBeInTheDocument();
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  test('should display existing recipients as chips', () => {
    render(
      <RecipientManager
        recipients={['user1@example.com', 'user2@example.com']}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    expect(screen.getByText('user2@example.com')).toBeInTheDocument();
  });

  test('should remove recipient when chip delete is clicked', async () => {
    render(
      <RecipientManager
        recipients={['user1@example.com', 'user2@example.com']}
        onChange={mockOnChange}
      />
    );

    const deleteIcons = screen.getAllByTestId('CancelIcon');
    fireEvent.click(deleteIcons[0]);

    expect(mockOnChange).toHaveBeenCalledWith(['user2@example.com']);
  });

  test('should add recipient on Enter key press', async () => {
    render(
      <RecipientManager
        recipients={[]}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByLabelText('Email Address') as HTMLInputElement;
    await userEvent.type(input, 'user@example.com{Enter}');

    expect(mockOnChange).toHaveBeenCalledWith(['user@example.com']);
  });

  test('should clear input after successful add', async () => {
    render(
      <RecipientManager
        recipients={[]}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByLabelText('Email Address') as HTMLInputElement;
    const addButton = screen.getByRole('button', { name: /add/i });

    await userEvent.type(input, 'user@example.com');
    fireEvent.click(addButton);

    expect(input.value).toBe('');
  });

  test('should display error message when provided', () => {
    render(
      <RecipientManager
        recipients={[]}
        onChange={mockOnChange}
        error="At least one recipient is required"
      />
    );

    expect(screen.getByText('At least one recipient is required')).toBeInTheDocument();
  });

  test('should disable input when disabled prop is true', () => {
    render(
      <RecipientManager
        recipients={[]}
        onChange={mockOnChange}
        disabled={true}
      />
    );

    const input = screen.getByLabelText('Email Address') as HTMLInputElement;
    const addButton = screen.getByRole('button', { name: /add/i }) as HTMLButtonElement;

    expect(input.disabled).toBe(true);
    expect(addButton.disabled).toBe(true);
  });

  test('should trim whitespace from email input', async () => {
    render(
      <RecipientManager
        recipients={[]}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByLabelText('Email Address');
    const addButton = screen.getByRole('button', { name: /add/i });

    await userEvent.type(input, '  user@example.com  ');
    fireEvent.click(addButton);

    expect(mockOnChange).toHaveBeenCalledWith(['user@example.com']);
  });

  test('should clear error message when user starts typing', async () => {
    const { rerender } = render(
      <RecipientManager
        recipients={[]}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByLabelText('Email Address');
    const addButton = screen.getByRole('button', { name: /add/i });

    await userEvent.type(input, 'invalid');
    fireEvent.click(addButton);

    expect(screen.getByText('Invalid email format')).toBeInTheDocument();

    await userEvent.clear(input);
    await userEvent.type(input, 'valid@example.com');

    expect(screen.queryByText('Invalid email format')).not.toBeInTheDocument();
  });
});
