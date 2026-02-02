import { useState, useCallback, useMemo } from 'react';
import { Invoice, LineItem, PaymentStatus } from '@/types';
import { useInvoices } from './useInvoices';
import {
  validateInvoiceCreation,
  validateInvoiceUpdate,
  formatErrorsForForm,
  calculateLineItemTotal,
  calculateInvoiceSubtotal,
  calculateInvoiceTotal
} from '@/lib/validations';
import { generateId } from '@/lib/utils';

export interface InvoiceFormData {
  invoiceNumber: string;
  date: Date;
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentStatus: PaymentStatus;
}

export interface LineItemFormData {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  total: number;
}

export interface UseInvoiceFormOptions {
  initialData?: Partial<Invoice>;
  mode?: 'create' | 'edit';
  onSuccess?: (invoice: Invoice) => void;
  onError?: (error: Error) => void;
}

export interface UseInvoiceFormReturn {
  formData: {
    invoiceNumber: string;
    date: string;
    customerName: string;
    customerEmail: string;
    customerAddress: string;
    paymentStatus: PaymentStatus;
    tax: string;
    lineItems: LineItemFormData[];
  };

  calculations: {
    subtotal: number;
    taxAmount: number;
    total: number;
  };

  state: {
    isSubmitting: boolean;
    isDirty: boolean;
    isValid: boolean;
    errors: Record<string, string>;
  };

  actions: {
    updateField: (field: string, value: string) => void;
    updateLineItem: (index: number, field: keyof LineItemFormData, value: string) => void;
    addLineItem: () => void;
    removeLineItem: (index: number) => void;
    submitForm: () => Promise<Invoice | null>;
    resetForm: () => void;
    clearErrors: () => void;
  };
}

export function useInvoiceForm(options: UseInvoiceFormOptions = {}): UseInvoiceFormReturn {
  const { initialData, mode = 'create', onSuccess, onError } = options;
  const { createInvoice, updateInvoice } = useInvoices();

  // Initialize form data
  const getInitialFormData = useCallback(() => ({
    invoiceNumber: initialData?.invoiceNumber || '',
    date: initialData?.date ? initialData.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    customerName: initialData?.customerName || '',
    customerEmail: initialData?.customerEmail || '',
    customerAddress: initialData?.customerAddress || '',
    paymentStatus: (initialData?.paymentStatus || 'Unpaid') as PaymentStatus,
    tax: initialData?.tax?.toString() || '0',
    lineItems: initialData?.lineItems && initialData.lineItems.length > 0
      ? initialData.lineItems.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        total: item.total,
      }))
      : [{
        id: generateId(),
        description: '',
        quantity: '1',
        unitPrice: '0',
        total: 0,
      }],
  }), [initialData]);

  // Form state
  const [formData, setFormData] = useState(getInitialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Calculate totals
  const calculations = useMemo(() => {
    const subtotal = calculateInvoiceSubtotal(formData.lineItems);
    const taxAmount = parseFloat(formData.tax) || 0;
    const total = calculateInvoiceTotal(subtotal, taxAmount);

    return { subtotal, taxAmount, total };
  }, [formData.lineItems, formData.tax]);

  // Get formatted form data for submission
  const getFormattedData = useCallback((): InvoiceFormData => ({
    invoiceNumber: formData.invoiceNumber.trim(),
    date: new Date(formData.date),
    customerName: formData.customerName.trim(),
    customerEmail: formData.customerEmail.trim() || undefined,
    customerAddress: formData.customerAddress.trim() || undefined,
    lineItems: formData.lineItems.map(item => ({
      id: item.id,
      description: item.description.trim(),
      quantity: parseFloat(item.quantity) || 0,
      unitPrice: parseFloat(item.unitPrice) || 0,
      total: item.total,
    })),
    subtotal: calculations.subtotal,
    tax: calculations.taxAmount,
    total: calculations.total,
    paymentStatus: formData.paymentStatus,
  }), [formData, calculations]);

  // Update line item total when quantity or unit price changes
  const updateLineItemTotal = useCallback((index: number, quantity: string, unitPrice: string) => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(unitPrice) || 0;
    const itemTotal = calculateLineItemTotal(qty, price);

    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.map((item, i) =>
        i === index ? { ...item, quantity, unitPrice, total: itemTotal } : item
      )
    }));
  }, []);

  // Update form field
  const updateField = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Update line item
  const updateLineItem = useCallback((index: number, field: keyof LineItemFormData, value: string) => {
    if (field === 'quantity' || field === 'unitPrice') {
      const updatedItems = [...formData.lineItems];
      updatedItems[index] = { ...updatedItems[index], [field]: value };

      if (field === 'quantity') {
        updateLineItemTotal(index, value, updatedItems[index].unitPrice);
      } else if (field === 'unitPrice') {
        updateLineItemTotal(index, updatedItems[index].quantity, value);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        lineItems: prev.lineItems.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        )
      }));
    }

    setIsDirty(true);

    // Clear field-specific errors
    const fieldKey = 'lineItems.' + index + '.' + field;
    if (errors[fieldKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
  }, [formData.lineItems, errors, updateLineItemTotal]);

  // Add line item
  const addLineItem = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, {
        id: generateId(),
        description: '',
        quantity: '1',
        unitPrice: '0',
        total: 0,
      }]
    }));
    setIsDirty(true);
  }, []);

  // Remove line item
  const removeLineItem = useCallback((index: number) => {
    if (formData.lineItems.length > 1) {
      setFormData(prev => ({
        ...prev,
        lineItems: prev.lineItems.filter((_, i) => i !== index)
      }));

      // Clear errors for removed line item
      setErrors(prev => {
        const newErrors = { ...prev };
        Object.keys(newErrors).forEach(key => {
          if (key.startsWith('lineItems.' + index + '.')) {
            delete newErrors[key];
          }
        });
        return newErrors;
      });

      setIsDirty(true);
    }
  }, [formData.lineItems.length]);

  // Submit form
  const submitForm = useCallback(async (): Promise<Invoice | null> => {
    if (isSubmitting) return null;

    setIsSubmitting(true);
    setErrors({});

    try {
      const formattedData = getFormattedData();

      // Validate form data
      const validation = mode === 'create'
        ? validateInvoiceCreation(formattedData)
        : validateInvoiceUpdate({ ...formattedData, id: initialData?.id || '' });

      if (!validation.success) {
        setErrors(formatErrorsForForm(validation.errors));
        return null;
      }

      // Submit based on mode
      let result: Invoice;
      if (mode === 'create') {
        result = createInvoice(formattedData);
      } else {
        if (!initialData?.id) {
          throw new Error('Invoice ID is required for updates');
        }
        result = updateInvoice(initialData.id, formattedData);
      }

      // Reset form state
      setIsDirty(false);
      onSuccess?.(result);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while saving the invoice';
      setErrors({ submit: errorMessage });
      onError?.(error instanceof Error ? error : new Error(errorMessage));
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting, getFormattedData, mode, createInvoice,
    updateInvoice, initialData?.id, onSuccess, onError
  ]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(getInitialFormData());
    setErrors({});
    setIsDirty(false);
    setIsSubmitting(false);
  }, [getInitialFormData]);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Check if form is valid
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  return {
    formData,
    calculations,
    state: {
      isSubmitting,
      isDirty,
      isValid,
      errors,
    },
    actions: {
      updateField,
      updateLineItem,
      addLineItem,
      removeLineItem,
      submitForm,
      resetForm,
      clearErrors,
    },
  };
}