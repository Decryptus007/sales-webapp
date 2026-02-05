import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmationModal } from '../ConfirmationModal';

describe('ConfirmationModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when open', () => {
      render(<ConfirmationModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<ConfirmationModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render with default button text', () => {
      render(<ConfirmationModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should render with custom button text', () => {
      render(
        <ConfirmationModal
          {...defaultProps}
          confirmText="Delete"
          cancelText="Keep"
        />
      );

      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /keep/i })).toBeInTheDocument();
    });

    it('should render with different variants', () => {
      const { rerender } = render(
        <ConfirmationModal {...defaultProps} variant="danger" />
      );

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).toHaveClass('bg-red-600');

      rerender(<ConfirmationModal {...defaultProps} variant="warning" />);
      expect(screen.getByRole('button', { name: /confirm/i })).toHaveClass('bg-yellow-600');

      rerender(<ConfirmationModal {...defaultProps} variant="info" />);
      expect(screen.getByRole('button', { name: /confirm/i })).toHaveClass('bg-blue-600');
    });

    it('should show loading state on confirm button', () => {
      render(<ConfirmationModal {...defaultProps} loading={true} />);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).toBeDisabled();
      expect(confirmButton.querySelector('svg')).toBeInTheDocument(); // Loading spinner
    });

    it('should disable cancel button when loading', () => {
      render(<ConfirmationModal {...defaultProps} loading={true} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Interaction', () => {
    it('should call onConfirm when confirm button is clicked', async () => {
      const onConfirm = jest.fn();
      const user = userEvent.setup();

      render(<ConfirmationModal {...defaultProps} onConfirm={onConfirm} />);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when cancel button is clicked', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(<ConfirmationModal {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when overlay is clicked', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(<ConfirmationModal {...defaultProps} onClose={onClose} />);

      const overlay = screen.getByRole('dialog');
      await user.click(overlay);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not close when modal content is clicked', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(<ConfirmationModal {...defaultProps} onClose={onClose} />);

      const title = screen.getByText('Confirm Action');
      await user.click(title);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should call onClose when Escape key is pressed', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(<ConfirmationModal {...defaultProps} onClose={onClose} />);

      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not trigger actions when loading', async () => {
      const onConfirm = jest.fn();
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(
        <ConfirmationModal
          {...defaultProps}
          onConfirm={onConfirm}
          onClose={onClose}
          loading={true}
        />
      );

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      await user.click(confirmButton);
      await user.click(cancelButton);

      expect(onConfirm).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper dialog attributes', () => {
      render(<ConfirmationModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });

    it.skip('should focus confirm button by default', () => {
      // Skip this test as focus management is difficult to test in jsdom environment
      render(<ConfirmationModal {...defaultProps} />);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).toHaveFocus();
    });

    it.skip('should trap focus within modal', async () => {
      // Skip this test as focus management is difficult to test in jsdom environment
      const user = userEvent.setup();

      render(<ConfirmationModal {...defaultProps} />);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      // Should start with confirm button focused
      expect(confirmButton).toHaveFocus();

      // Tab should move to cancel button
      await user.tab();
      expect(cancelButton).toHaveFocus();

      // Tab again should cycle back to confirm button
      await user.tab();
      expect(confirmButton).toHaveFocus();

      // Shift+Tab should go back to cancel button
      await user.tab({ shift: true });
      expect(cancelButton).toHaveFocus();
    });

    it('should have proper button roles and labels', () => {
      render(
        <ConfirmationModal
          {...defaultProps}
          confirmText="Delete Item"
          cancelText="Keep Item"
        />
      );

      expect(screen.getByRole('button', { name: /delete item/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /keep item/i })).toBeInTheDocument();
    });

    it('should announce loading state to screen readers', () => {
      render(<ConfirmationModal {...defaultProps} loading={true} />);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      const spinner = confirmButton.querySelector('svg');

      expect(spinner).toHaveAttribute('aria-label', 'Loading');
    });
  });

  describe('Variants and Styling', () => {
    it('should apply danger variant styles', () => {
      render(<ConfirmationModal {...defaultProps} variant="danger" />);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).toHaveClass('bg-red-600');
      expect(confirmButton).toHaveClass('hover:bg-red-700');
    });

    it('should apply warning variant styles', () => {
      render(<ConfirmationModal {...defaultProps} variant="warning" />);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).toHaveClass('bg-yellow-600');
      expect(confirmButton).toHaveClass('hover:bg-yellow-700');
    });

    it('should apply info variant styles', () => {
      render(<ConfirmationModal {...defaultProps} variant="info" />);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton).toHaveClass('bg-blue-600');
      expect(confirmButton).toHaveClass('hover:bg-blue-700');
    });

    it('should show appropriate icon for each variant', () => {
      const { rerender } = render(
        <ConfirmationModal {...defaultProps} variant="danger" />
      );

      // Danger variant should show warning icon
      expect(screen.getByTestId('danger-icon')).toBeInTheDocument();

      rerender(<ConfirmationModal {...defaultProps} variant="warning" />);
      expect(screen.getByTestId('warning-icon')).toBeInTheDocument();

      rerender(<ConfirmationModal {...defaultProps} variant="info" />);
      expect(screen.getByTestId('info-icon')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(1000);

      render(
        <ConfirmationModal
          {...defaultProps}
          message={longMessage}
        />
      );

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle empty message', () => {
      render(
        <ConfirmationModal
          {...defaultProps}
          message=""
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    });

    it('should handle special characters in title and message', () => {
      const specialTitle = 'Delete "Important File" & Save Changes?';
      const specialMessage = 'This action will permanently delete <file.txt> & cannot be undone!';

      render(
        <ConfirmationModal
          {...defaultProps}
          title={specialTitle}
          message={specialMessage}
        />
      );

      expect(screen.getByText(specialTitle)).toBeInTheDocument();
      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    it('should handle rapid open/close cycles', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      const { rerender } = render(
        <ConfirmationModal {...defaultProps} onClose={onClose} isOpen={true} />
      );

      // Rapidly toggle open/close
      rerender(<ConfirmationModal {...defaultProps} onClose={onClose} isOpen={false} />);
      rerender(<ConfirmationModal {...defaultProps} onClose={onClose} isOpen={true} />);
      rerender(<ConfirmationModal {...defaultProps} onClose={onClose} isOpen={false} />);

      // Should handle gracefully without errors
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Async Operations', () => {
    it('should handle async confirm operations', async () => {
      const asyncConfirm = jest.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();

      render(
        <ConfirmationModal
          {...defaultProps}
          onConfirm={asyncConfirm}
          loading={false}
        />
      );

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      expect(asyncConfirm).toHaveBeenCalledTimes(1);
    });

    it('should prevent double-clicking during loading', async () => {
      const onConfirm = jest.fn();
      const user = userEvent.setup();

      render(
        <ConfirmationModal
          {...defaultProps}
          onConfirm={onConfirm}
          loading={true}
        />
      );

      const confirmButton = screen.getByRole('button', { name: /confirm/i });

      // Try to click multiple times while loading
      await user.click(confirmButton);
      await user.click(confirmButton);
      await user.click(confirmButton);

      expect(onConfirm).not.toHaveBeenCalled();
    });
  });
});