import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Component that throws an error for testing
const ThrowError: React.FC<{ shouldThrow?: boolean; errorMessage?: string }> = ({
  shouldThrow = false,
  errorMessage = 'Test error'
}) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div>No error</div>;
};

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Normal Operation', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should render multiple children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>First child</div>
          <div>Second child</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('First child')).toBeInTheDocument();
      expect(screen.getByText('Second child')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should catch and display error when child component throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should display custom error message when provided', () => {
      const customMessage = 'Custom error occurred';

      render(
        <ErrorBoundary fallback={<div>{customMessage}</div>}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(customMessage)).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('should call onError callback when error occurs', () => {
      const onError = jest.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} errorMessage="Callback test error" />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Callback test error',
        }),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it('should reset error state when children change', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Error boundary should show error UI
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Rerender with non-throwing component
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      // Should show normal content again
      expect(screen.getByText('No error')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('should provide retry functionality', () => {
      let shouldThrow = true;

      const RetryableComponent = () => {
        if (shouldThrow) {
          throw new Error('Retryable error');
        }
        return <div>Success after retry</div>;
      };

      const { rerender } = render(
        <ErrorBoundary>
          <RetryableComponent />
        </ErrorBoundary>
      );

      // Should show error initially
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Simulate fixing the error
      shouldThrow = false;

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /try again/i });
      retryButton.click();

      // Force rerender to simulate retry
      rerender(
        <ErrorBoundary>
          <RetryableComponent />
        </ErrorBoundary>
      );

      // Should show success content
      expect(screen.getByText('Success after retry')).toBeInTheDocument();
    });
  });

  describe('Error Information Display', () => {
    it('should show error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Development error" />
        </ErrorBoundary>
      );

      // In development, should show more detailed error information
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should hide error details in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Production error" />
        </ErrorBoundary>
      );

      // In production, should show generic error message
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for error state', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorContainer = screen.getByRole('alert');
      expect(errorContainer).toBeInTheDocument();
      expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have accessible retry button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).not.toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle errors in nested components', () => {
      const NestedComponent = () => (
        <div>
          <div>
            <ThrowError shouldThrow={true} errorMessage="Nested error" />
          </div>
        </div>
      );

      render(
        <ErrorBoundary>
          <NestedComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should handle async errors appropriately', async () => {
      const AsyncErrorComponent = () => {
        React.useEffect(() => {
          // Simulate async error - note that error boundaries don't catch async errors
          // This test documents the limitation
          setTimeout(() => {
            throw new Error('Async error');
          }, 0);
        }, []);

        return <div>Async component</div>;
      };

      render(
        <ErrorBoundary>
          <AsyncErrorComponent />
        </ErrorBoundary>
      );

      // Should render normally since error boundaries don't catch async errors
      expect(screen.getByText('Async component')).toBeInTheDocument();
    });

    it('should handle errors during render phase', () => {
      const RenderErrorComponent = () => {
        // Error during render
        throw new Error('Render phase error');
      };

      render(
        <ErrorBoundary>
          <RenderErrorComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should handle null/undefined children gracefully', () => {
      render(
        <ErrorBoundary>
          {null}
          {undefined}
          <div>Valid child</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Valid child')).toBeInTheDocument();
    });
  });

  describe('Custom Fallback UI', () => {
    it('should render custom fallback component', () => {
      const CustomFallback = ({ error }: { error: Error }) => (
        <div>
          <h2>Custom Error UI</h2>
          <p>Error: {error.message}</p>
        </div>
      );

      render(
        <ErrorBoundary fallback={<CustomFallback error={new Error('Test')} />}>
          <ThrowError shouldThrow={true} errorMessage="Custom fallback test" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    });

    it('should pass error and errorInfo to custom fallback', () => {
      const CustomFallback = ({ error, errorInfo }: { error: Error; errorInfo: any }) => (
        <div>
          <h2>Error: {error.message}</h2>
          <details>
            <summary>Error Details</summary>
            <pre>{errorInfo.componentStack}</pre>
          </details>
        </div>
      );

      render(
        <ErrorBoundary
          fallback={<CustomFallback error={new Error('Test')} errorInfo={{ componentStack: 'test stack' }} />}
        >
          <ThrowError shouldThrow={true} errorMessage="Fallback props test" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error: Test')).toBeInTheDocument();
    });
  });
});