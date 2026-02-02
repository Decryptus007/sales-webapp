import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../Modal';

describe('Modal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    children: <div>Modal content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders modal when open', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    test('does not render when closed', () => {
      render(<Modal {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('renders with title', () => {
      render(<Modal {...defaultProps} title="Test Modal" />);
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    test('renders close button when title is provided', () => {
      render(<Modal {...defaultProps} title="Test Modal" />);
      const closeButton = screen.getByRole('button', { name: 'Close modal' });
      expect(closeButton).toBeInTheDocument();
    });

    test('renders with different sizes', () => {
      const { rerender } = render(<Modal {...defaultProps} size="sm" />);
      expect(screen.getByRole('dialog').firstChild).toHaveClass('max-w-md');

      rerender(<Modal {...defaultProps} size="md" />);
      expect(screen.getByRole('dialog').firstChild).toHaveClass('max-w-lg');

      rerender(<Modal {...defaultProps} size="lg" />);
      expect(screen.getByRole('dialog').firstChild).toHaveClass('max-w-2xl');

      rerender(<Modal {...defaultProps} size="xl" />);
      expect(screen.getByRole('dialog').firstChild).toHaveClass('max-w-4xl');
    });

    test('applies custom className', () => {
      render(<Modal {...defaultProps} className="custom-modal" />);
      expect(screen.getByRole('dialog').firstChild).toHaveClass('custom-modal');
    });

    test('sets body overflow hidden when open', () => {
      render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    test('restores body overflow when closed', () => {
      const { rerender } = render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');

      rerender(<Modal {...defaultProps} isOpen={false} />);
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('Interaction', () => {
    test('calls onClose when overlay is clicked', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(<Modal {...defaultProps} onClose={onClose} />);

      const overlay = screen.getByRole('dialog');
      await user.click(overlay);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('does not close when modal content is clicked', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(<Modal {...defaultProps} onClose={onClose} />);

      const content = screen.getByText('Modal content');
      await user.click(content);

      expect(onClose).not.toHaveBeenCalled();
    });

    test('does not close on overlay click when closeOnOverlayClick is false', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(<Modal {...defaultProps} onClose={onClose} closeOnOverlayClick={false} />);

      const overlay = screen.getByRole('dialog');
      await user.click(overlay);

      expect(onClose).not.toHaveBeenCalled();
    });

    test('calls onClose when close button is clicked', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(<Modal {...defaultProps} onClose={onClose} title="Test Modal" />);

      const closeButton = screen.getByRole('button', { name: 'Close modal' });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('calls onClose when Escape key is pressed', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(<Modal {...defaultProps} onClose={onClose} />);

      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('does not close on Escape when closeOnEscape is false', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(<Modal {...defaultProps} onClose={onClose} closeOnEscape={false} />);

      await user.keyboard('{Escape}');

      expect(onClose).not.toHaveBeenCalled();
    });

    test('does not close on Escape when modal is not open', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(<Modal {...defaultProps} onClose={onClose} isOpen={false} />);

      await user.keyboard('{Escape}');

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    test('has proper dialog role and attributes', () => {
      render(<Modal {...defaultProps} title="Test Modal" />);
      const dialog = screen.getByRole('dialog');

      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    test('does not have aria-labelledby when no title', () => {
      render(<Modal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');

      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).not.toHaveAttribute('aria-labelledby');
    });

    test('close button has proper aria-label', () => {
      render(<Modal {...defaultProps} title="Test Modal" />);
      const closeButton = screen.getByRole('button', { name: 'Close modal' });

      expect(closeButton).toHaveAttribute('aria-label', 'Close modal');
    });

    test('close button has proper focus styles', () => {
      render(<Modal {...defaultProps} title="Test Modal" />);
      const closeButton = screen.getByRole('button', { name: 'Close modal' });

      expect(closeButton).toHaveClass('focus:outline-none');
      expect(closeButton).toHaveClass('focus:ring-2');
      expect(closeButton).toHaveClass('focus:ring-blue-500');
    });

    test('modal content stops event propagation', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(
        <Modal {...defaultProps} onClose={onClose}>
          <button>Inside button</button>
        </Modal>
      );

      const insideButton = screen.getByRole('button', { name: 'Inside button' });
      await user.click(insideButton);

      expect(onClose).not.toHaveBeenCalled();
    });

    test('manages focus trap by preventing body scroll', () => {
      render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  describe('Event Cleanup', () => {
    test('removes event listeners when unmounted', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      const { unmount } = render(<Modal {...defaultProps} />);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    test('restores body overflow when unmounted', () => {
      const { unmount } = render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');

      unmount();
      expect(document.body.style.overflow).toBe('unset');
    });
  });
});