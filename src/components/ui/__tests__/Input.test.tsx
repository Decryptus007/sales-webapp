import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

describe('Input Component', () => {
  describe('Rendering', () => {
    test('renders input field', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    test('renders with label', () => {
      render(<Input label="Email Address" />);
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByText('Email Address')).toBeInTheDocument();
    });

    test('renders with helper text', () => {
      render(<Input helperText="Enter your email address" />);
      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    });

    test('renders with error message', () => {
      render(<Input error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    test('shows required indicator when required', () => {
      render(<Input label="Email" required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    test('applies error styles when error is present', () => {
      render(<Input error="Error message" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-red-500');
      expect(input).toHaveClass('focus:border-red-500');
    });

    test('applies custom className', () => {
      render(<Input className="custom-class" />);
      expect(screen.getByRole('textbox')).toHaveClass('custom-class');
    });

    test('renders different input types', () => {
      const { rerender } = render(<Input type="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');

      rerender(<Input type="password" />);
      expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'password');
    });
  });

  describe('Interaction', () => {
    test('handles value changes', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(<Input onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test@example.com');

      expect(handleChange).toHaveBeenCalled();
      expect(input).toHaveValue('test@example.com');
    });

    test('handles focus and blur events', async () => {
      const handleFocus = jest.fn();
      const handleBlur = jest.fn();
      const user = userEvent.setup();

      render(<Input onFocus={handleFocus} onBlur={handleBlur} />);

      const input = screen.getByRole('textbox');
      await user.click(input);
      expect(handleFocus).toHaveBeenCalled();

      await user.tab();
      expect(handleBlur).toHaveBeenCalled();
    });

    test('forwards ref correctly', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    test('respects disabled state', async () => {
      const user = userEvent.setup();
      render(<Input disabled />);

      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('disabled:cursor-not-allowed');

      await user.type(input, 'test');
      expect(input).toHaveValue('');
    });
  });

  describe('Accessibility', () => {
    test('generates unique id when not provided', () => {
      const { rerender } = render(<Input label="First" />);
      const firstInput = screen.getByLabelText('First');
      const firstId = firstInput.getAttribute('id');

      rerender(<Input label="Second" />);
      const secondInput = screen.getByLabelText('Second');
      const secondId = secondInput.getAttribute('id');

      expect(firstId).toBeTruthy();
      expect(secondId).toBeTruthy();
      expect(firstId).not.toBe(secondId);
    });

    test('uses provided id', () => {
      render(<Input id="custom-id" label="Custom" />);
      expect(screen.getByLabelText('Custom')).toHaveAttribute('id', 'custom-id');
    });

    test('associates label with input', () => {
      render(<Input id="email" label="Email Address" />);
      const label = screen.getByText('Email Address');
      const input = screen.getByLabelText('Email Address');

      expect(label).toHaveAttribute('for', 'email');
      expect(input).toHaveAttribute('id', 'email');
    });

    test('associates error message with input', () => {
      render(<Input error="Invalid email" />);
      const input = screen.getByRole('textbox');
      const errorMessage = screen.getByRole('alert');

      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby');
      expect(errorMessage).toHaveAttribute('id', input.getAttribute('aria-describedby'));
    });

    test('associates helper text with input', () => {
      render(<Input helperText="Enter your email" />);
      const input = screen.getByRole('textbox');
      const helperText = screen.getByText('Enter your email');

      expect(input).toHaveAttribute('aria-describedby');
      expect(helperText).toHaveAttribute('id', input.getAttribute('aria-describedby'));
    });

    test('error takes precedence over helper text for aria-describedby', () => {
      render(<Input error="Error message" helperText="Helper text" />);
      const input = screen.getByRole('textbox');
      const errorMessage = screen.getByRole('alert');

      expect(input).toHaveAttribute('aria-describedby', errorMessage.getAttribute('id'));
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });

    test('has proper focus styles', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus:border-blue-500');
      expect(input).toHaveClass('focus:ring-2');
      expect(input).toHaveClass('focus:ring-blue-500');
    });
  });
});