import { useState, useCallback, useMemo, useEffect } from 'react';
import { Invoice, FilterCriteria, CreateInvoiceData, UpdateInvoiceData, UpdateInvoiceWithAttachmentsData } from '@/types';
import { useLocalStorage, LocalStorageError, localStorageUtils } from './useLocalStorage';
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

  // Migration: Ensure all invoices have attachments array
  useEffect(() => {
    if (!isLoading && invoices.length > 0) {
      let needsMigration = false;
      const migratedInvoices = invoices.map(invoice => {
        if (!invoice.attachments || !Array.isArray(invoice.attachments)) {
          console.log('🔧 Migration - Adding attachments array to invoice:', invoice.id);
          needsMigration = true;
          return {
            ...invoice,
            attachments: []
          };
        }
        return invoice;
      });

      if (needsMigration) {
        console.log('🔧 Migration - Updating invoices with attachments arrays');
        setInvoices(migratedInvoices);
      }
    }
  }, [invoices, isLoading, setInvoices]);

  // Clear operation errors when invoices change
  const clearError = useCallback(() => {
    setOperationError(null);
  }, []);

  /**
   * Create a new invoice with automatic ID and timestamp generation
   */
  const createInvoice = useCallback((invoiceData: CreateInvoiceData): Invoice => {
    console.log('🗃️ useInvoices - createInvoice called');
    console.log('🗃️ useInvoices - Received invoiceData.attachments:', invoiceData.attachments?.length, invoiceData.attachments);

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
        attachments: invoiceData.attachments || [], // Use provided attachments or empty array
        createdAt: now,
        updatedAt: now,
      };

      console.log('🗃️ useInvoices - Created invoice object:', newInvoice.id);
      console.log('🗃️ useInvoices - Invoice attachments:', newInvoice.attachments?.length, newInvoice.attachments);

      // Add to invoices array
      setInvoices(prev => {
        const updated = [...prev, newInvoice];
        console.log('🗃️ useInvoices - Updated invoices array, total invoices:', updated.length);
        console.log('🗃️ useInvoices - New invoice in array has attachments:', updated[updated.length - 1].attachments?.length);
        return updated;
      });

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
   * Get an invoice by ID - reads directly from localStorage to avoid stale data
   */
  const getInvoice = useCallback((id: string): Invoice | null => {
    try {
      setOperationError(null);

      // Read directly from localStorage to get the most current data
      const currentInvoices = localStorageUtils.getItem<Invoice[]>(INVOICES_STORAGE_KEY, []);
      const found = currentInvoices.find(invoice => invoice.id === id);

      console.log('🔍 useInvoices - getInvoice called for ID:', id);
      console.log('🔍 useInvoices - Reading directly from localStorage, total invoices:', currentInvoices.length);
      console.log('🔍 useInvoices - Found invoice:', found ? 'YES' : 'NO');
      if (found) {
        console.log('🔍 useInvoices - Invoice attachments:', found.attachments?.length, found.attachments);
      }
      return found || null;
    } catch (error) {
      console.error('🔍 useInvoices - Error in getInvoice:', error);
      const invoiceError = new InvoiceError('Failed to get invoice', error as Error);
      setOperationError(invoiceError);
      return null;
    }
  }, []); // Remove 'invoices' from dependencies since we're reading directly from localStorage

  /**
   * Update an existing invoice
   */
  const updateInvoice = useCallback((id: string, updates: Partial<UpdateInvoiceData> | Partial<Omit<Invoice, 'id' | 'createdAt'>>): Invoice => {
    try {
      setOperationError(null);

      console.log('🔄 useInvoices - updateInvoice called for ID:', id);
      console.log('🔄 useInvoices - Updates include attachments:', updates.attachments?.length, updates.attachments);

      const existingInvoice = invoices.find(invoice => invoice.id === id);
      if (!existingInvoice) {
        throw new InvoiceNotFoundError(id);
      }

      console.log('🔄 useInvoices - Existing invoice attachments:', existingInvoice.attachments?.length, existingInvoice.attachments);

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

      // Special handling: Don't overwrite attachments if updates.attachments is undefined
      // This allows the file attachment system to manage attachments independently
      if (updates.attachments === undefined) {
        updatedInvoice.attachments = existingInvoice.attachments;
        console.log('🔄 useInvoices - Preserving existing attachments (updates.attachments was undefined)');
      }

      console.log('🔄 useInvoices - Final updated invoice attachments:', updatedInvoice.attachments?.length, updatedInvoice.attachments);

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
   * Filter invoices based on criteria with enhanced error handling
   */
  const filterInvoices = useCallback((criteria: FilterCriteria): Invoice[] => {
    try {
      setOperationError(null);

      // Handle empty invoice list
      if (invoices.length === 0) {
        return [];
      }

      return invoices.filter(invoice => {
        // Date range filtering with enhanced validation
        if (criteria.dateRange) {
          const invoiceDate = new Date(invoice.date);

          // Handle invalid invoice dates
          if (isNaN(invoiceDate.getTime())) {
            console.warn(`Invalid date found in invoice ${invoice.id}: ${invoice.date}`);
            return false;
          }

          if (criteria.dateRange.startDate) {
            const startDate = new Date(criteria.dateRange.startDate);

            // Handle invalid start date
            if (isNaN(startDate.getTime())) {
              console.warn('Invalid start date in filter criteria');
              return true; // Don't filter out if date is invalid
            }

            startDate.setHours(0, 0, 0, 0);
            if (invoiceDate < startDate) {
              return false;
            }
          }

          if (criteria.dateRange.endDate) {
            const endDate = new Date(criteria.dateRange.endDate);

            // Handle invalid end date
            if (isNaN(endDate.getTime())) {
              console.warn('Invalid end date in filter criteria');
              return true; // Don't filter out if date is invalid
            }

            endDate.setHours(23, 59, 59, 999);
            if (invoiceDate > endDate) {
              return false;
            }
          }
        }

        // Payment status filtering with validation
        if (criteria.paymentStatuses && criteria.paymentStatuses.length > 0) {
          // Handle invalid payment status
          if (!invoice.paymentStatus) {
            console.warn(`Missing payment status in invoice ${invoice.id}`);
            return false;
          }

          if (!criteria.paymentStatuses.includes(invoice.paymentStatus)) {
            return false;
          }
        }

        // Search term filtering (if implemented)
        if (criteria.searchTerm && criteria.searchTerm.trim()) {
          const searchTerm = criteria.searchTerm.toLowerCase().trim();

          // Search in multiple fields with null checks
          const searchableFields = [
            invoice.invoiceNumber || '',
            invoice.customerName || '',
            invoice.customerEmail || '',
            ...(invoice.lineItems || []).map(item => item.description || '')
          ];

          const matches = searchableFields.some(field =>
            field.toLowerCase().includes(searchTerm)
          );

          if (!matches) {
            return false;
          }
        }

        return true;
      });
    } catch (error) {
      const invoiceError = new InvoiceError('Failed to filter invoices', error as Error);
      setOperationError(invoiceError);

      // Return all invoices if filtering fails to maintain functionality
      console.error('Filter operation failed, returning all invoices:', error);
      return invoices;
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