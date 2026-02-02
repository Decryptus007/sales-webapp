import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '../Select';

const mockOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3', disabled: true },
];

describe('Select Component', () => {
  describe('Rendering', () => {
    test('renders select field with options', () => {
      render(<Select options={mockOptions} />);
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();

      // Check that all options are rendered
      expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Option 2' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Option 3' })).toBeInTheDocument();
    });

    test('renders with label', () => {
      render(<Select options={mockOptions} label="Choose Option" />);
      expect(screen.getByLabelText('Choose Option')).toBeInTheDocument();
      expect(screen.getByText('Choose Option')).toBeInTheDocument();
    });

    test('renders with placeholder', () => {
      render(<Select options={mockOptions} placeholder="Select an option" />);
      expect(screen.getByRole('option', { name: 'Select an option' })).toBeInTheDocument();
    });

    test('renders with helper text', () => {
      render(<Select options={mockOptions} helperText="Choose your preferred option" />);
      expect(screen.getByText('Choose your preferred option')).toBeInTheDocument();
    });

    test('renders with error message', () => {
      render(<Select options={mockOptions} error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    test('shows required indicator when required', () => {
      render(<Select options={mockOptions} label="Category" required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    test('applies error styles when error is present', () => {
      render(<Select options={mockOptions} error="Error message" />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('border-red-500');
      expect(select).toHaveClass('focus:border-red-500');
    });

    test('applies custom className', () => {
      render(<Select options={mockOptions} className="custom-class" />);
      expect(screen.getByRole('combobox')).toHaveClass('custom-class');
    });

    test('renders disabled options correctly', () => {
      render(<Select options={mockOptions} />);
      const disabledOption = screen.getByRole('option', { name: 'Option 3' });
      expect(disabledOption).toBeDisabled();
    });

    test('renders dropdown arrow icon', () => {
      render(<Select options={mockOptions} />);
      const select = screen.getByRole('combobox');
      const icon = select.parentElement?.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Interaction', () => {
    test('handles value changes', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(<Select options={mockOptions} onChange={handleChange} />);

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'option1');

      expect(handleChange).toHaveBeenCalled();
      expect(select).toHaveValue('option1');
    });

    test('handles focus and blur events', async () => {
      const handleFocus = jest.fn();
      const handleBlur = jest.fn();
      const user = userEvent.setup();

      render(<Select options={mockOptions} onFocus={handleFocus} onBlur={handleBlur} />);

      const select = screen.getByRole('combobox');
      await user.click(select);
      expect(handleFocus).toHaveBeenCalled();

      await user.tab();
      expect(handleBlur).toHaveBeenCalled();
    });

    test('forwards ref correctly', () => {
      const ref = React.createRef<HTMLSelectElement>();
      render(<Select options={mockOptions} ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLSelectElement);
    });

    test('respects disabled state', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(<Select options={mockOptions} onChange={handleChange} disabled />);

      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
      expect(select).toHaveClass('disabled:cursor-not-allowed');

      await user.selectOptions(select, 'option1');
      expect(handleChange).not.toHaveBeenCalled();
    });

    test('cannot select disabled options', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(<Select options={mockOptions} onChange={handleChange} />);

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'option3');

      // Should not change to disabled option
      expect(select).not.toHaveValue('option3');
    });
  });

  describe('Accessibility', () => {
    test('generates unique id when not provided', () => {
      const { rerender } = render(<Select options={mockOptions} label="First" />);
      const firstSelect = screen.getByLabelText('First');
      const firstId = firstSelect.getAttribute('id');

      rerender(<Select options={mockOptions} label="Second" />);
      const secondSelect = screen.getByLabelText('Second');
      const secondId = secondSelect.getAttribute('id');

      expect(firstId).toBeTruthy();
      expect(secondId).toBeTruthy();
      expect(firstId).not.toBe(secondId);
    });

    test('uses provided id', () => {
      render(<Select options={mockOptions} id="custom-id" label="Custom" />);
      expect(screen.getByLabelText('Custom')).toHaveAttribute('id', 'custom-id');
    });

    test('associates label with select', () => {
      render(<Select options={mockOptions} id="category" label="Category" />);
      const label = screen.getByText('Category');
      const select = screen.getByLabelText('Category');

      expect(label).toHaveAttribute('for', 'category');
      expect(select).toHaveAttribute('id', 'category');
    });

    test('associates error message with select', () => {
      render(<Select options={mockOptions} error="Invalid selection" />);
      const select = screen.getByRole('combobox');
      const errorMessage = screen.getByRole('alert');

      expect(select).toHaveAttribute('aria-invalid', 'true');
      expect(select).toHaveAttribute('aria-describedby');
      expect(errorMessage).toHaveAttribute('id', select.getAttribute('aria-describedby'));
    });

    test('associates helper text with select', () => {
      render(<Select options={mockOptions} helperText="Choose your category" />);
      const select = screen.getByRole('combobox');
      const helperText = screen.getByText('Choose your category');

      expect(select).toHaveAttribute('aria-describedby');
      expect(helperText).toHaveAttribute('id', select.getAttribute('aria-describedby'));
    });

    test('error takes precedence over helper text for aria-describedby', () => {
      render(<Select options={mockOptions} error="Error message" helperText="Helper text" />);
      const select = screen.getByRole('combobox');
      const errorMessage = screen.getByRole('alert');

      expect(select).toHaveAttribute('aria-describedby', errorMessage.getAttribute('id'));
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });

    test('has proper focus styles', () => {
      render(<Select options={mockOptions} />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('focus:border-blue-500');
      expect(select).toHaveClass('focus:ring-2');
      expect(select).toHaveClass('focus:ring-blue-500');
    });

    test('placeholder option is disabled', () => {
      render(<Select options={mockOptions} placeholder="Select option" />);
      const placeholderOption = screen.getByRole('option', { name: 'Select option' });
      expect(placeholderOption).toBeDisabled();
      expect(placeholderOption).toHaveValue('');
    });
  });
});