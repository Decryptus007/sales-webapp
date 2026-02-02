import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '../Toast';

// Test component to trigger toast actions
const TestComponent: React.FC = () => {
  const { addToast } = useToast();

  return (
    <div>
      <button onClick={() => addToast({ message: 'Success message', type: 'success' })}>
        Add Success Toast
      </button>
      <button onClick={() => addToast({ message: 'Error message', type: 'error' })}>
        Add Error Toast
      </button>
      <button onClick={() => addToast({
        title: 'Warning Title',
        message: 'Warning message',
        type: 'warning'
      })}>
        Add Warning Toast
      </button>
      <button onClick={() => addToast({ message: 'Info message', type: 'info' })}>
        Add Info Toast
      </button>
    </div>
  );
};

describe('Toast Component', () => {
  describe('ToastProvider', () => {
    test('provides toast context to children', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      expect(screen.getByText('Add Success Toast')).toBeInTheDocument();
    });

    test('throws error when useToast is used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useToast must be used within a ToastProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Toast Rendering', () => {
    test('renders success toast with correct styling', async () => {
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Success Toast'));

      const toast = screen.getByRole('alert');
      expect(toast).toBeInTheDocument();
      expect(toast).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800');
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    test('renders error toast with correct styling', async () => {
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Error Toast'));

      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800');
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    test('renders warning toast with title and message', async () => {
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Warning Toast'));

      expect(screen.getByText('Warning Title')).toBeInTheDocument();
      expect(screen.getByText('Warning message')).toBeInTheDocument();

      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-800');
    });

    test('renders info toast with correct styling', async () => {
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Info Toast'));

      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-800');
    });

    test('renders correct icons for each toast type', async () => {
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      // Test success icon
      await user.click(screen.getByText('Add Success Toast'));
      const toast = screen.getByRole('alert');
      const icon = toast.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon?.parentElement).toHaveClass('text-green-400');
    });

    test('handles multiple toasts', async () => {
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Success Toast'));
      await user.click(screen.getByText('Add Error Toast'));

      const toasts = screen.getAllByRole('alert');
      expect(toasts).toHaveLength(2);

      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });

  describe('Toast Interaction', () => {
    test('closes toast when close button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Success Toast'));

      const toast = screen.getByRole('alert');
      const closeButton = toast.querySelector('button');
      expect(closeButton).toBeInTheDocument();

      await user.click(closeButton!);

      // Wait for animation and removal
      await waitFor(() => {
        expect(screen.queryByText('Success message')).not.toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });

  describe('Accessibility', () => {
    test('toast has proper ARIA attributes', async () => {
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Success Toast'));

      const toast = screen.getByRole('alert');
      expect(toast).toHaveAttribute('role', 'alert');
      expect(toast).toHaveAttribute('aria-live', 'assertive');
    });

    test('close button has proper aria-label', async () => {
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Success Toast'));

      const toast = screen.getByRole('alert');
      const closeButton = toast.querySelector('button');
      expect(closeButton).toHaveAttribute('aria-label', 'Close notification');
    });

    test('close button has proper focus styles', async () => {
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Success Toast'));

      const toast = screen.getByRole('alert');
      const closeButton = toast.querySelector('button');
      expect(closeButton).toHaveClass('focus:outline-none');
      expect(closeButton).toHaveClass('focus:ring-2');
      expect(closeButton).toHaveClass('focus:ring-blue-500');
    });

    test('toast container is positioned for screen readers', async () => {
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Success Toast'));

      const container = screen.getByRole('alert').parentElement;
      expect(container).toHaveClass('fixed', 'bottom-4', 'right-4', 'z-50');
    });
  });

  describe('Animation', () => {
    test('toast has proper animation classes', async () => {
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      await user.click(screen.getByText('Add Success Toast'));

      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('transition-all', 'duration-300', 'ease-in-out');
    });
  });
});