import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DatePickerButton } from './DatePickerButton';

describe('DatePickerButton', () => {
  it('renders a button with calendar icon', () => {
    const handleClick = vi.fn();
    render(<DatePickerButton onClick={handleClick} />);
    
    const button = screen.getByRole('button', { name: /open date picker/i });
    expect(button).toBeInTheDocument();
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<DatePickerButton onClick={handleClick} />);
    
    const button = screen.getByRole('button', { name: /open date picker/i });
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('is disabled when disabled prop is true', () => {
    const handleClick = vi.fn();
    render(<DatePickerButton onClick={handleClick} disabled={true} />);
    
    const button = screen.getByRole('button', { name: /open date picker/i });
    expect(button).toBeDisabled();
  });

  it('does not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<DatePickerButton onClick={handleClick} disabled={true} />);
    
    const button = screen.getByRole('button', { name: /open date picker/i });
    await user.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const handleClick = vi.fn();
    render(<DatePickerButton onClick={handleClick} className="custom-class" />);
    
    const button = screen.getByRole('button', { name: /open date picker/i });
    expect(button).toHaveClass('custom-class');
  });
});
