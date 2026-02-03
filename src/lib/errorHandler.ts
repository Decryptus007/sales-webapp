import React from 'react';
import { Toast } from '@/components/ui/Toast';

// Error types for better categorization
export enum ErrorType {
  VALIDATION = 'validation',
  NETWORK = 'network',
  STORAGE = 'storage',
  PERMISSION = 'permission',
  NOT_FOUND = 'not_found',
  UNKNOWN = 'unknown',
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  type: ErrorType;
  message: string;
  originalError: Error;
  context: ErrorContext;
  stack?: string;
  userAgent: string;
  url: string;
  timestamp: Date;
}

// Custom error classes
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly context: ErrorContext;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    context: ErrorContext = {},
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.context = context;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context: ErrorContext = {}) {
    super(message, ErrorType.VALIDATION, context);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string, context: ErrorContext = {}) {
    super(message, ErrorType.NETWORK, context);
    this.name = 'NetworkError';
  }
}

export class StorageError extends AppError {
  constructor(message: string, context: ErrorContext = {}) {
    super(message, ErrorType.STORAGE, context);
    this.name = 'StorageError';
  }
}

export class PermissionError extends AppError {
  constructor(message: string, context: ErrorContext = {}) {
    super(message, ErrorType.PERMISSION, context);
    this.name = 'PermissionError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, context: ErrorContext = {}) {
    super(message, ErrorType.NOT_FOUND, context);
    this.name = 'NotFoundError';
  }
}

// Global error handler class
class GlobalErrorHandler {
  private errorReports: ErrorReport[] = [];
  private maxReports = 100;
  private toastHandler?: (toast: Omit<Toast, 'id'>) => void;

  constructor() {
    this.setupGlobalHandlers();
  }

  // Set up global error handlers
  private setupGlobalHandlers() {
    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);

        const error = event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason));

        this.handleError(error, {
          component: 'Global',
          action: 'unhandledrejection',
        });

        // Prevent the default browser behavior
        event.preventDefault();
      });

      // Handle uncaught errors
      window.addEventListener('error', (event) => {
        console.error('Uncaught error:', event.error);

        this.handleError(event.error || new Error(event.message), {
          component: 'Global',
          action: 'uncaught_error',
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        });
      });
    }
  }

  // Set toast handler for user notifications
  setToastHandler(handler: (toast: Omit<Toast, 'id'>) => void) {
    this.toastHandler = handler;
  }

  // Main error handling method
  handleError(error: Error, context: ErrorContext = {}): ErrorReport {
    const errorReport = this.createErrorReport(error, context);

    // Store error report
    this.storeErrorReport(errorReport);

    // Log error
    this.logError(errorReport);

    // Show user notification if appropriate
    this.showUserNotification(errorReport);

    // Report to external service (if configured)
    this.reportToExternalService(errorReport);

    return errorReport;
  }

  // Create structured error report
  private createErrorReport(error: Error, context: ErrorContext): ErrorReport {
    const id = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      id,
      type: this.determineErrorType(error),
      message: error.message,
      originalError: error,
      context: {
        ...context,
        timestamp: new Date(),
      },
      stack: error.stack,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      timestamp: new Date(),
    };
  }

  // Determine error type from error instance
  private determineErrorType(error: Error): ErrorType {
    if (error instanceof AppError) {
      return error.type;
    }

    // Check error message patterns
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return ErrorType.NETWORK;
    }

    if (message.includes('storage') || message.includes('quota')) {
      return ErrorType.STORAGE;
    }

    if (message.includes('permission') || message.includes('denied')) {
      return ErrorType.PERMISSION;
    }

    if (message.includes('not found') || message.includes('404')) {
      return ErrorType.NOT_FOUND;
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION;
    }

    return ErrorType.UNKNOWN;
  }

  // Store error report in memory (could be extended to persist)
  private storeErrorReport(report: ErrorReport) {
    this.errorReports.unshift(report);

    // Keep only the most recent reports
    if (this.errorReports.length > this.maxReports) {
      this.errorReports = this.errorReports.slice(0, this.maxReports);
    }
  }

  // Log error with structured data
  private logError(report: ErrorReport) {
    console.group(`🚨 Error [${report.type.toUpperCase()}] - ${report.id}`);
    console.error('Message:', report.message);
    console.error('Original Error:', report.originalError);
    console.table({
      Type: report.type,
      Component: report.context.component || 'Unknown',
      Action: report.context.action || 'Unknown',
      Timestamp: report.timestamp.toISOString(),
      URL: report.url,
    });

    if (report.context.metadata) {
      console.table(report.context.metadata);
    }

    if (report.stack) {
      console.error('Stack Trace:', report.stack);
    }

    console.groupEnd();
  }

  // Show appropriate user notification
  private showUserNotification(report: ErrorReport) {
    if (!this.toastHandler) return;

    const userMessage = this.getUserFriendlyMessage(report);

    // Don't show toast for validation errors (they should be handled by forms)
    if (report.type === ErrorType.VALIDATION) {
      return;
    }

    this.toastHandler({
      type: 'error',
      title: this.getErrorTitle(report.type),
      message: userMessage,
      duration: report.type === ErrorType.NETWORK ? 8000 : 5000,
    });
  }

  // Get user-friendly error message
  private getUserFriendlyMessage(report: ErrorReport): string {
    switch (report.type) {
      case ErrorType.NETWORK:
        return 'Unable to connect to the server. Please check your internet connection and try again.';

      case ErrorType.STORAGE:
        return 'Storage limit reached. Please free up some space or contact support.';

      case ErrorType.PERMISSION:
        return 'You don\'t have permission to perform this action.';

      case ErrorType.NOT_FOUND:
        return 'The requested item could not be found.';

      case ErrorType.VALIDATION:
        return report.message; // Validation errors are usually user-friendly

      default:
        return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
    }
  }

  // Get error title for toast
  private getErrorTitle(type: ErrorType): string {
    switch (type) {
      case ErrorType.NETWORK:
        return 'Connection Error';
      case ErrorType.STORAGE:
        return 'Storage Error';
      case ErrorType.PERMISSION:
        return 'Permission Denied';
      case ErrorType.NOT_FOUND:
        return 'Not Found';
      case ErrorType.VALIDATION:
        return 'Validation Error';
      default:
        return 'Error';
    }
  }

  // Report to external error tracking service
  private reportToExternalService(report: ErrorReport) {
    // In a real application, you would send this to your error tracking service
    // Examples: Sentry, Bugsnag, LogRocket, etc.

    // For now, we'll just prepare the data structure
    const externalReport = {
      errorId: report.id,
      message: report.message,
      type: report.type,
      stack: report.stack,
      context: report.context,
      userAgent: report.userAgent,
      url: report.url,
      timestamp: report.timestamp.toISOString(),
    };

    // TODO: Send to external service
    // Example: Sentry.captureException(report.originalError, { extra: externalReport });
    console.debug('External error report prepared:', externalReport);
  }

  // Get recent error reports
  getRecentErrors(limit: number = 10): ErrorReport[] {
    return this.errorReports.slice(0, limit);
  }

  // Get error statistics
  getErrorStats(): Record<ErrorType, number> {
    const stats = Object.values(ErrorType).reduce((acc, type) => {
      acc[type] = 0;
      return acc;
    }, {} as Record<ErrorType, number>);

    this.errorReports.forEach(report => {
      stats[report.type]++;
    });

    return stats;
  }

  // Clear error reports
  clearErrors() {
    this.errorReports = [];
  }
}

// Create global instance
export const globalErrorHandler = new GlobalErrorHandler();

// Convenience functions for common error scenarios
export const errorHandlers = {
  // Handle async operation errors
  async: async <T>(
    operation: () => Promise<T>,
    context: ErrorContext = {}
  ): Promise<T | null> => {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      globalErrorHandler.handleError(error as Error, context);
      return null;
    }
  },

  // Handle sync operation errors
  sync: <T>(
    operation: () => T,
    context: ErrorContext = {}
  ): T | null => {
    try {
      return operation();
    } catch (error) {
      globalErrorHandler.handleError(error as Error, context);
      return null;
    }
  },

  // Wrap component methods with error handling
  component: <T extends any[], R>(
    fn: (...args: T) => R,
    componentName: string,
    actionName: string
  ) => {
    return (...args: T): R | null => {
      try {
        return fn(...args);
      } catch (error) {
        globalErrorHandler.handleError(error as Error, {
          component: componentName,
          action: actionName,
        });
        return null;
      }
    };
  },
};

// React hook for error handling
export function useErrorHandler() {
  const [lastError, setLastError] = React.useState<ErrorReport | null>(null);

  const handleError = React.useCallback((error: Error, context: ErrorContext = {}) => {
    const report = globalErrorHandler.handleError(error, context);
    setLastError(report);
    return report;
  }, []);

  const clearLastError = React.useCallback(() => {
    setLastError(null);
  }, []);

  return {
    handleError,
    lastError,
    clearLastError,
    recentErrors: globalErrorHandler.getRecentErrors(),
    errorStats: globalErrorHandler.getErrorStats(),
  };
}

// Initialize error handler with toast integration
export function initializeErrorHandler(toastHandler: (toast: Omit<Toast, 'id'>) => void) {
  globalErrorHandler.setToastHandler(toastHandler);
}