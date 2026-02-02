import { useState, useCallback, useMemo } from 'react';
import { Invoice, FilterCriteria, CreateInvoiceData, UpdateInvoiceData, UpdateInvoiceWithAttachmentsData } from '@/types';
import { useLocalStorage, LocalStorageError } from './useLocalStorage';
import { generateId } from '@/lib/utils';

// Constants for localStorage keys
const INVOICES_STORAGE_KEY = 'sales_invoices';

// Custom error types for invoice operations
export class InvoiceError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'InvoiceError';
  }
}

export class InvoiceNotFoundError extends InvoiceError {
  constructor(id: string) {
    super(`Invoice with ID "${id}" not found`);
    this.name = 'InvoiceNotFoundError';
  }
}

export class DuplicateInvoiceNumberError extends InvoiceError {
  constructor(invoiceNumber: string) {
    super(`Invoice number "${invoiceNumber}" already exists`);
    this.name = 'DuplicateInvoiceNumberError';
  }
}

/**
 * Custom hook for managing invoice data with CRUD operations
 * Provides automatic ID generation, timestamp management, and filtering
 */
export function useInvoices() {
  const [invoices, setInvoices, { error: storageError, isLoading }] = useLocalStorage<Invoice[]>(
    INVOICES_STORAGE_KEY,
    []
  );

  const [operationError, setOperationError] = useState<InvoiceError | null>(null);

  // Clear operation errors when invoices change
  const clearError = useCallback(() => {
    setOperationError(null);
  }, []);

  /**
   * Create a new invoice with automatic ID and timestamp generation
   */
  const createInvoice = useCallback((invoiceData: CreateInvoiceData): Invoice => {
    try {
      setOperationError(null);

      // Check for duplicate invoice number
      const existingInvoice = invoices.find(
        invoice => invoice.invoiceNumber === invoiceData.invoiceNumber
      );

      if (existingInvoice) {
        throw new DuplicateInvoiceNumberError(invoiceData.invoiceNumber);
      }

      // Create new invoice with generated ID and timestamps
      const now = new Date();
      const newInvoice: Invoice = {
        ...invoiceData,
        id: generateId(),
        attachments: [], // Start with empty attachments
        createdAt: now,
        updatedAt: now,
      };

      // Add to invoices array
      setInvoices(prev => [...prev, newInvoice]);

      return newInvoice;
    } catch (error) {
      const invoiceError = error instanceof InvoiceError
        ? error
        : new InvoiceError('Failed to create invoice', error as Error);

      setOperationError(invoiceError);
      throw invoiceError;
    }
  }, [invoices, setInvoices]);

  /**
   * Get an invoice by ID
   */
  const getInvoice = useCallback((id: string): Invoice | null => {
    try {
      setOperationError(null);
      return invoices.find(invoice => invoice.id === id) || null;
    } catch (error) {
      const invoiceError = new InvoiceError('Failed to get invoice', error as Error);
      setOperationError(invoiceError);
      return null;
    }
  }, [invoices]);

  /**
   * Update an existing invoice
   */
  const updateInvoice = useCallback((id: string, updates: Partial<UpdateInvoiceData> | Partial<Omit<Invoice, 'id' | 'createdAt'>>): Invoice => {
    try {
      setOperationError(null);

      const existingInvoice = invoices.find(invoice => invoice.id === id);
      if (!existingInvoice) {
        throw new InvoiceNotFoundError(id);
      }

      // Check for duplicate invoice number if it's being updated
      if (updates.invoiceNumber && updates.invoiceNumber !== existingInvoice.invoiceNumber) {
        const duplicateInvoice = invoices.find(
          invoice => invoice.id !== id && invoice.invoiceNumber === updates.invoiceNumber
        );

        if (duplicateInvoice) {
          throw new DuplicateInvoiceNumberError(updates.invoiceNumber);
        }
      }

      // Create updated invoice with new timestamp
      const updatedInvoice: Invoice = {
        ...existingInvoice,
        ...updates,
        id, // Ensure ID cannot be changed
        createdAt: existingInvoice.createdAt, // Preserve creation timestamp
        updatedAt: new Date(),
      };

      // Update invoices array
      setInvoices(prev =>
        prev.map(invoice => invoice.id === id ? updatedInvoice : invoice)
      );

      return updatedInvoice;
    } catch (error) {
      const invoiceError = error instanceof InvoiceError
        ? error
        : new InvoiceError('Failed to update invoice', error as Error);

      setOperationError(invoiceError);
      throw invoiceError;
    }
  }, [invoices, setInvoices]);

  /**
   * Delete an invoice by ID
   */
  const deleteInvoice = useCallback((id: string): boolean => {
    try {
      setOperationError(null);

      const existingInvoice = invoices.find(invoice => invoice.id === id);
      if (!existingInvoice) {
        throw new InvoiceNotFoundError(id);
      }

      // Remove invoice from array
      setInvoices(prev => prev.filter(invoice => invoice.id !== id));

      return true;
    } catch (error) {
      const invoiceError = error instanceof InvoiceError
        ? error
        : new InvoiceError('Failed to delete invoice', error as Error);

      setOperationError(invoiceError);
      throw invoiceError;
    }
  }, [invoices, setInvoices]);

  /**
   * Filter invoices based on criteria
   */
  const filterInvoices = useCallback((criteria: FilterCriteria): Invoice[] => {
    try {
      setOperationError(null);

      return invoices.filter(invoice => {
        // Date range filtering
        if (criteria.dateRange) {
          const invoiceDate = new Date(invoice.date);

          if (criteria.dateRange.startDate) {
            const startDate = new Date(criteria.dateRange.startDate);
            startDate.setHours(0, 0, 0, 0);
            if (invoiceDate < startDate) {
              return false;
            }
          }

          if (criteria.dateRange.endDate) {
            const endDate = new Date(criteria.dateRange.endDate);
            endDate.setHours(23, 59, 59, 999);
            if (invoiceDate > endDate) {
              return false;
            }
          }
        }

        // Payment status filtering
        if (criteria.paymentStatuses && criteria.paymentStatuses.length > 0) {
          if (!criteria.paymentStatuses.includes(invoice.paymentStatus)) {
            return false;
          }
        }

        return true;
      });
    } catch (error) {
      const invoiceError = new InvoiceError('Failed to filter invoices', error as Error);
      setOperationError(invoiceError);
      return [];
    }
  }, [invoices]);

  /**
   * Get invoices sorted by date (newest first)
   */
  const getSortedInvoices = useCallback((sortBy: 'date' | 'invoiceNumber' | 'customerName' | 'total' = 'date', order: 'asc' | 'desc' = 'desc'): Invoice[] => {
    try {
      setOperationError(null);

      return [...invoices].sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case 'date':
            comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
            break;
          case 'invoiceNumber':
            comparison = a.invoiceNumber.localeCompare(b.invoiceNumber);
            break;
          case 'customerName':
            comparison = a.customerName.localeCompare(b.customerName);
            break;
          case 'total':
            comparison = a.total - b.total;
            break;
        }

        return order === 'desc' ? -comparison : comparison;
      });
    } catch (error) {
      const invoiceError = new InvoiceError('Failed to sort invoices', error as Error);
      setOperationError(invoiceError);
      return invoices;
    }
  }, [invoices]);

  /**
   * Search invoices by text (invoice number, customer name, or line item descriptions)
   */
  const searchInvoices = useCallback((searchTerm: string): Invoice[] => {
    try {
      setOperationError(null);

      if (!searchTerm.trim()) {
        return invoices;
      }

      const term = searchTerm.toLowerCase().trim();

      return invoices.filter(invoice => {
        // Search in invoice number
        if (invoice.invoiceNumber.toLowerCase().includes(term)) {
          return true;
        }

        // Search in customer name
        if (invoice.customerName.toLowerCase().includes(term)) {
          return true;
        }

        // Search in customer email
        if (invoice.customerEmail?.toLowerCase().includes(term)) {
          return true;
        }

        // Search in line item descriptions
        if (invoice.lineItems.some(item =>
          item.description.toLowerCase().includes(term)
        )) {
          return true;
        }

        return false;
      });
    } catch (error) {
      const invoiceError = new InvoiceError('Failed to search invoices', error as Error);
      setOperationError(invoiceError);
      return [];
    }
  }, [invoices]);

  /**
   * Get invoice statistics
   */
  const getInvoiceStats = useMemo(() => {
    try {
      const stats = {
        total: invoices.length,
        paid: invoices.filter(i => i.paymentStatus === 'Paid').length,
        unpaid: invoices.filter(i => i.paymentStatus === 'Unpaid').length,
        partiallyPaid: invoices.filter(i => i.paymentStatus === 'Partially Paid').length,
        overdue: invoices.filter(i => i.paymentStatus === 'Overdue').length,
        totalAmount: invoices.reduce((sum, i) => sum + i.total, 0),
        paidAmount: invoices
          .filter(i => i.paymentStatus === 'Paid')
          .reduce((sum, i) => sum + i.total, 0),
        unpaidAmount: invoices
          .filter(i => i.paymentStatus !== 'Paid')
          .reduce((sum, i) => sum + i.total, 0),
      };

      return stats;
    } catch (error) {
      console.error('Failed to calculate invoice stats:', error);
      return {
        total: 0,
        paid: 0,
        unpaid: 0,
        partiallyPaid: 0,
        overdue: 0,
        totalAmount: 0,
        paidAmount: 0,
        unpaidAmount: 0,
      };
    }
  }, [invoices]);

  /**
   * Bulk operations
   */
  const bulkDeleteInvoices = useCallback((ids: string[]): number => {
    try {
      setOperationError(null);

      const initialCount = invoices.length;
      setInvoices(prev => prev.filter(invoice => !ids.includes(invoice.id)));
      const finalCount = invoices.length - ids.length;

      return initialCount - finalCount; // Return number of deleted invoices
    } catch (error) {
      const invoiceError = new InvoiceError('Failed to bulk delete invoices', error as Error);
      setOperationError(invoiceError);
      throw invoiceError;
    }
  }, [invoices, setInvoices]);

  const bulkUpdatePaymentStatus = useCallback((ids: string[], paymentStatus: Invoice['paymentStatus']): number => {
    try {
      setOperationError(null);

      let updatedCount = 0;
      const now = new Date();

      setInvoices(prev =>
        prev.map(invoice => {
          if (ids.includes(invoice.id)) {
            updatedCount++;
            return {
              ...invoice,
              paymentStatus,
              updatedAt: now,
            };
          }
          return invoice;
        })
      );

      return updatedCount;
    } catch (error) {
      const invoiceError = new InvoiceError('Failed to bulk update payment status', error as Error);
      setOperationError(invoiceError);
      throw invoiceError;
    }
  }, [setInvoices]);

  // Combined error state
  const error = storageError || operationError;

  return {
    // Data
    invoices,
    stats: getInvoiceStats,

    // State
    isLoading,
    error,

    // CRUD operations
    createInvoice,
    getInvoice,
    updateInvoice,
    deleteInvoice,

    // Query operations
    filterInvoices,
    getSortedInvoices,
    searchInvoices,

    // Bulk operations
    bulkDeleteInvoices,
    bulkUpdatePaymentStatus,

    // Utility
    clearError,
  };
}