import { z } from 'zod';
import { PaymentStatus, ValidationError } from '@/types';

export const PaymentStatusSchema = z.enum(['Paid', 'Unpaid', 'Partially Paid', 'Overdue']);

export const FileAttachmentSchema = z.object({
  id: z.string().min(1, 'File ID is required'),
  filename: z.string().min(1, 'Filename is required').max(255, 'Filename cannot exceed 255 characters'),
  size: z.number().positive('File size must be positive').max(10 * 1024 * 1024, 'File size cannot exceed 10MB'),
  type: z.string().min(1, 'File type is required').refine((type) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    return allowedTypes.includes(type);
  }, {
    message: 'File type not supported. Allowed types: PDF, JPEG, PNG, GIF, DOC, DOCX, TXT, XLS, XLSX',
  }),
  data: z.string().min(1, 'File data is required'),
  uploadedAt: z.date(),
});

// Base schemas without refinements
const BaseLineItemSchema = z.object({
  id: z.string().min(1, 'Line item ID is required'),
  description: z.string().min(1, 'Description is required').max(500, 'Description cannot exceed 500 characters'),
  quantity: z.number().positive('Quantity must be positive').max(999999, 'Quantity cannot exceed 999,999'),
  unitPrice: z.number().nonnegative('Unit price cannot be negative').max(999999.99, 'Unit price cannot exceed ₦999,999.99'),
  total: z.number().nonnegative('Total cannot be negative'),
});

export const LineItemSchema = BaseLineItemSchema.refine((data) => {
  // Business logic: total should equal quantity * unitPrice
  const calculatedTotal = Math.round(data.quantity * data.unitPrice * 100) / 100;
  const providedTotal = Math.round(data.total * 100) / 100;
  return Math.abs(calculatedTotal - providedTotal) < 0.01;
}, {
  message: 'Total must equal quantity × unit price',
  path: ['total'],
});

const BaseInvoiceSchema = z.object({
  id: z.string().min(1, 'Invoice ID is required'),
  invoiceNumber: z.string().min(1, 'Invoice number is required').max(50, 'Invoice number cannot exceed 50 characters'),
  date: z.date().refine((date) => {
    const today = new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    const oneYearFromNow = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    return date >= oneYearAgo && date <= oneYearFromNow;
  }, {
    message: 'Invoice date must be within one year of today',
  }),
  customerName: z.string().min(1, 'Customer name is required').max(200, 'Customer name cannot exceed 200 characters'),
  customerEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  customerAddress: z.string().max(500, 'Customer address cannot exceed 500 characters').optional(),
  lineItems: z.array(BaseLineItemSchema).min(1, 'At least one line item is required').max(100, 'Cannot exceed 100 line items'),
  subtotal: z.number().nonnegative('Subtotal cannot be negative'),
  tax: z.number().nonnegative('Tax cannot be negative').max(999999.99, 'Tax cannot exceed ₦999,999.99'),
  total: z.number().nonnegative('Total cannot be negative'),
  paymentStatus: PaymentStatusSchema,
  attachments: z.array(FileAttachmentSchema).max(20, 'Cannot exceed 20 attachments per invoice'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const InvoiceSchema = BaseInvoiceSchema.refine((data) => {
  // Business logic: subtotal should equal sum of line item totals
  const calculatedSubtotal = Math.round(data.lineItems.reduce((sum, item) => sum + item.total, 0) * 100) / 100;
  const providedSubtotal = Math.round(data.subtotal * 100) / 100;
  return Math.abs(calculatedSubtotal - providedSubtotal) < 0.01;
}, {
  message: 'Subtotal must equal the sum of all line item totals',
  path: ['subtotal'],
}).refine((data) => {
  // Business logic: total should equal subtotal + tax
  const calculatedTotal = Math.round((data.subtotal + data.tax) * 100) / 100;
  const providedTotal = Math.round(data.total * 100) / 100;
  return Math.abs(calculatedTotal - providedTotal) < 0.01;
}, {
  message: 'Total must equal subtotal + tax',
  path: ['total'],
});

export const CreateInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required').max(50, 'Invoice number cannot exceed 50 characters'),
  date: z.date().refine((date) => {
    const today = new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    const oneYearFromNow = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    return date >= oneYearAgo && date <= oneYearFromNow;
  }, {
    message: 'Invoice date must be within one year of today',
  }),
  customerName: z.string().min(1, 'Customer name is required').max(200, 'Customer name cannot exceed 200 characters'),
  customerEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  customerAddress: z.string().max(500, 'Customer address cannot exceed 500 characters').optional(),
  lineItems: z.array(LineItemSchema).min(1, 'At least one line item is required').max(100, 'Cannot exceed 100 line items'),
  subtotal: z.number().nonnegative('Subtotal cannot be negative'),
  tax: z.number().nonnegative('Tax cannot be negative').max(999999.99, 'Tax cannot exceed ₦999,999.99'),
  total: z.number().nonnegative('Total cannot be negative'),
  paymentStatus: PaymentStatusSchema,
}).refine((data) => {
  // Business logic: subtotal should equal sum of line item totals
  const calculatedSubtotal = Math.round(data.lineItems.reduce((sum, item) => sum + item.total, 0) * 100) / 100;
  const providedSubtotal = Math.round(data.subtotal * 100) / 100;
  return Math.abs(calculatedSubtotal - providedSubtotal) < 0.01;
}, {
  message: 'Subtotal must equal the sum of all line item totals',
  path: ['subtotal'],
}).refine((data) => {
  // Business logic: total should equal subtotal + tax
  const calculatedTotal = Math.round((data.subtotal + data.tax) * 100) / 100;
  const providedTotal = Math.round(data.total * 100) / 100;
  return Math.abs(calculatedTotal - providedTotal) < 0.01;
}, {
  message: 'Total must equal subtotal + tax',
  path: ['total'],
});

export const UpdateInvoiceSchema = z.object({
  id: z.string().min(1, 'Invoice ID is required'),
  invoiceNumber: z.string().min(1, 'Invoice number is required').max(50, 'Invoice number cannot exceed 50 characters').optional(),
  date: z.date().refine((date) => {
    const today = new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    const oneYearFromNow = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    return date >= oneYearAgo && date <= oneYearFromNow;
  }, {
    message: 'Invoice date must be within one year of today',
  }).optional(),
  customerName: z.string().min(1, 'Customer name is required').max(200, 'Customer name cannot exceed 200 characters').optional(),
  customerEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  customerAddress: z.string().max(500, 'Customer address cannot exceed 500 characters').optional(),
  lineItems: z.array(BaseLineItemSchema).min(1, 'At least one line item is required').max(100, 'Cannot exceed 100 line items').optional(),
  subtotal: z.number().nonnegative('Subtotal cannot be negative').optional(),
  tax: z.number().nonnegative('Tax cannot be negative').max(999999.99, 'Tax cannot exceed ₦999,999.99').optional(),
  total: z.number().nonnegative('Total cannot be negative').optional(),
  paymentStatus: PaymentStatusSchema.optional(),
});

export const FilterCriteriaSchema = z.object({
  dateRange: z.object({
    startDate: z.date().optional(),
    endDate: z.date().optional(),
  }).optional().refine((dateRange) => {
    if (!dateRange || !dateRange.startDate || !dateRange.endDate) {
      return true; // Allow partial date ranges
    }
    return dateRange.startDate <= dateRange.endDate;
  }, {
    message: 'Start date must be before or equal to end date',
    path: ['endDate'],
  }),
  paymentStatuses: z.array(PaymentStatusSchema).optional(),
});

// File upload validation
export const FileUploadSchema = z.object({
  file: z.instanceof(File),
  maxSize: z.number().default(10 * 1024 * 1024), // 10MB default
  allowedTypes: z.array(z.string()).default([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]),
});

export type InvoiceFormData = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoiceFormData = z.infer<typeof UpdateInvoiceSchema>;
export type FilterFormData = z.infer<typeof FilterCriteriaSchema>;

// Validation utility functions
export interface ValidationResult {
  success: boolean;
  errors: ValidationError[];
  data?: any;
}

/**
 * Validates invoice data for creation
 */
export function validateInvoiceCreation(data: unknown): ValidationResult {
  const result = CreateInvoiceSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      errors: [],
      data: result.data,
    };
  }

  return {
    success: false,
    errors: formatZodErrors(result.error),
  };
}

/**
 * Validates invoice data for updates
 */
export function validateInvoiceUpdate(data: unknown): ValidationResult {
  const result = UpdateInvoiceSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      errors: [],
      data: result.data,
    };
  }

  return {
    success: false,
    errors: formatZodErrors(result.error),
  };
}

/**
 * Validates filter criteria
 */
export function validateFilterCriteria(data: unknown): ValidationResult {
  const result = FilterCriteriaSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      errors: [],
      data: result.data,
    };
  }

  return {
    success: false,
    errors: formatZodErrors(result.error),
  };
}

/**
 * Validates a single line item
 */
export function validateLineItem(data: unknown): ValidationResult {
  const result = LineItemSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      errors: [],
      data: result.data,
    };
  }

  return {
    success: false,
    errors: formatZodErrors(result.error),
  };
}

/**
 * Validates file upload data
 */
export function validateFileUpload(file: File, maxSize?: number, allowedTypes?: string[]): ValidationResult {
  const schema = FileUploadSchema.extend({
    maxSize: z.number().default(maxSize || 10 * 1024 * 1024),
    allowedTypes: z.array(z.string()).default(allowedTypes || [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]),
  });

  // Check file size
  if (file.size > (maxSize || 10 * 1024 * 1024)) {
    return {
      success: false,
      errors: [{
        field: 'file',
        message: `File size exceeds ${formatFileSize(maxSize || 10 * 1024 * 1024)} limit`,
      }],
    };
  }

  // Check file type
  const allowedFileTypes = allowedTypes || [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  if (!allowedFileTypes.includes(file.type)) {
    return {
      success: false,
      errors: [{
        field: 'file',
        message: 'File type not supported. Allowed types: PDF, JPEG, PNG, GIF, DOC, DOCX, TXT, XLS, XLSX',
      }],
    };
  }

  return {
    success: true,
    errors: [],
    data: file,
  };
}

/**
 * Formats Zod validation errors into a consistent format
 */
export function formatZodErrors(error: z.ZodError): ValidationError[] {
  return error.issues.map((err: z.ZodIssue) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

/**
 * Formats validation errors for display in forms
 */
export function formatErrorsForForm(errors: ValidationError[]): Record<string, string> {
  const formErrors: Record<string, string> = {};

  errors.forEach((error) => {
    // Only set if not already set (keep first error)
    if (!formErrors[error.field]) {
      formErrors[error.field] = error.message;
    }
  });

  return formErrors;
}

/**
 * Validates customer information
 */
export function validateCustomerInfo(data: {
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
}): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate customer name
  if (!data.customerName || data.customerName.trim() === '') {
    errors.push({ field: 'customerName', message: 'Customer name is required' });
  } else if (data.customerName.length > 100) {
    errors.push({ field: 'customerName', message: 'Customer name cannot exceed 100 characters' });
  }

  // Validate customer email if provided
  if (data.customerEmail && data.customerEmail.trim() !== '') {
    if (!validateEmailFormat(data.customerEmail)) {
      errors.push({ field: 'customerEmail', message: 'Invalid email format' });
    }
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

/**
 * Validates payment status
 */
export function validatePaymentStatus(status: PaymentStatus): ValidationResult {
  const validStatuses: PaymentStatus[] = ['Paid', 'Unpaid', 'Partially Paid', 'Overdue'];

  if (!validStatuses.includes(status)) {
    return {
      success: false,
      errors: [{ field: 'paymentStatus', message: 'Invalid payment status' }],
    };
  }

  return {
    success: true,
    errors: [],
  };
}

/**
 * Gets the first error message for a specific field from form errors object
 */
export function getFieldError(errors: Record<string, string>, fieldName: string): string | undefined {
  return errors[fieldName];
}

/**
 * Checks if a specific field has validation errors
 */
export function hasFieldError(errors: ValidationError[], fieldName: string): boolean {
  return errors.some((err) => err.field === fieldName);
}

/**
 * Formats file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validates and calculates line item total
 */
export function calculateLineItemTotal(quantity: number, unitPrice: number): number {
  if (quantity < 0 || unitPrice < 0) {
    throw new Error('Quantity and unit price must be non-negative');
  }

  return Math.round(quantity * unitPrice * 100) / 100;
}

/**
 * Validates and calculates invoice subtotal from line items
 */
export function calculateInvoiceSubtotal(lineItems: Array<{ total: number }>): number {
  return Math.round(lineItems.reduce((sum, item) => sum + item.total, 0) * 100) / 100;
}

/**
 * Validates and calculates invoice total
 */
export function calculateInvoiceTotal(subtotal: number, tax: number): number {
  if (subtotal < 0 || tax < 0) {
    throw new Error('Subtotal and tax must be non-negative');
  }

  return Math.round((subtotal + tax) * 100) / 100;
}

/**
 * Validates invoice number uniqueness (for use with existing invoices)
 */
export function validateInvoiceNumberUniqueness(
  invoiceNumber: string,
  existingInvoices: Array<{ invoiceNumber: string; id?: string }>,
  currentInvoiceId?: string
): ValidationResult {
  const duplicate = existingInvoices.find(
    (invoice) =>
      invoice.invoiceNumber === invoiceNumber &&
      invoice.id !== currentInvoiceId
  );

  if (duplicate) {
    return {
      success: false,
      errors: [{
        field: 'invoiceNumber',
        message: 'Invoice number already exists',
      }],
    };
  }

  return {
    success: true,
    errors: [],
  };
}

/**
 * Sanitizes string input to prevent XSS and other issues
 */
export function sanitizeStringInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

/**
 * Validates email format (more permissive than Zod's built-in)
 */
export function validateEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Edge case handling utilities
 */

/**
 * Safely parses a date string with fallback
 */
export function safeDateParse(dateInput: unknown): Date | null {
  if (!dateInput) return null;

  try {
    if (dateInput instanceof Date) {
      return isNaN(dateInput.getTime()) ? null : dateInput;
    }

    if (typeof dateInput === 'string') {
      const parsed = new Date(dateInput);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    if (typeof dateInput === 'number') {
      const parsed = new Date(dateInput);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Safely parses a number with fallback
 */
export function safeNumberParse(numberInput: unknown, fallback: number = 0): number {
  if (typeof numberInput === 'number' && !isNaN(numberInput) && isFinite(numberInput)) {
    return numberInput;
  }

  if (typeof numberInput === 'string') {
    const parsed = parseFloat(numberInput);
    return isNaN(parsed) || !isFinite(parsed) ? fallback : parsed;
  }

  return fallback;
}

/**
 * Validates and sanitizes invoice data for edge cases
 */
export function sanitizeInvoiceData(data: any): any {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid invoice data: must be an object');
  }

  const sanitized = { ...data };

  // Sanitize string fields
  if (sanitized.invoiceNumber) {
    sanitized.invoiceNumber = sanitizeStringInput(sanitized.invoiceNumber);
  }

  if (sanitized.customerName) {
    sanitized.customerName = sanitizeStringInput(sanitized.customerName);
  }

  if (sanitized.customerEmail) {
    sanitized.customerEmail = sanitized.customerEmail.trim().toLowerCase();
  }

  if (sanitized.customerAddress) {
    sanitized.customerAddress = sanitizeStringInput(sanitized.customerAddress);
  }

  // Sanitize date
  if (sanitized.date) {
    const parsedDate = safeDateParse(sanitized.date);
    if (!parsedDate) {
      throw new Error('Invalid invoice date');
    }
    sanitized.date = parsedDate;
  }

  // Sanitize numeric fields
  sanitized.subtotal = safeNumberParse(sanitized.subtotal, 0);
  sanitized.tax = safeNumberParse(sanitized.tax, 0);
  sanitized.total = safeNumberParse(sanitized.total, 0);

  // Sanitize line items
  if (Array.isArray(sanitized.lineItems)) {
    sanitized.lineItems = sanitized.lineItems.map((item: any) => ({
      ...item,
      description: item.description ? sanitizeStringInput(item.description) : '',
      quantity: safeNumberParse(item.quantity, 1),
      unitPrice: safeNumberParse(item.unitPrice, 0),
      total: safeNumberParse(item.total, 0),
    }));
  }

  return sanitized;
}

/**
 * Handles corrupted localStorage data gracefully
 */
export function handleCorruptedData<T>(
  key: string,
  corruptedData: any,
  defaultValue: T,
  onCorruption?: (key: string, error: Error) => void
): T {
  try {
    console.warn(`Corrupted data detected for key "${key}":`, corruptedData);

    if (onCorruption) {
      onCorruption(key, new Error(`Corrupted data in localStorage for key "${key}"`));
    }

    // Try to salvage partial data if it's an array
    if (Array.isArray(defaultValue) && Array.isArray(corruptedData)) {
      const salvaged = corruptedData.filter((item: any) => {
        try {
          // Basic validation - check if item has required properties
          return item && typeof item === 'object' && item.id;
        } catch {
          return false;
        }
      });

      if (salvaged.length > 0) {
        console.log(`Salvaged ${salvaged.length} items from corrupted data`);
        return salvaged as T;
      }
    }

    return defaultValue;
  } catch (error) {
    console.error(`Error handling corrupted data for key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Validates browser compatibility for required features
 */
export function validateBrowserCompatibility(): { compatible: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check localStorage
  try {
    const testKey = '__compatibility_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
  } catch {
    issues.push('localStorage is not available');
  }

  // Check JSON support
  try {
    JSON.parse('{}');
    JSON.stringify({});
  } catch {
    issues.push('JSON support is not available');
  }

  // Check Date support
  try {
    new Date().toISOString();
  } catch {
    issues.push('Date API is not fully supported');
  }

  // Check File API support (for file uploads)
  if (typeof File === 'undefined' || typeof FileReader === 'undefined') {
    issues.push('File API is not supported (file uploads may not work)');
  }

  return {
    compatible: issues.length === 0,
    issues,
  };
}

/**
 * Provides fallback behavior when features are not supported
 */
export function getFallbackBehavior(feature: string): {
  available: boolean;
  fallback?: string;
  message?: string;
} {
  const fallbacks: Record<string, { available: boolean; fallback?: string; message?: string }> = {
    localStorage: {
      available: typeof Storage !== 'undefined',
      fallback: 'memory',
      message: 'Data will not persist between sessions',
    },
    fileAPI: {
      available: typeof File !== 'undefined' && typeof FileReader !== 'undefined',
      fallback: 'disabled',
      message: 'File uploads are not supported in this browser',
    },
    dragDrop: {
      available: 'draggable' in document.createElement('div'),
      fallback: 'click',
      message: 'Drag and drop is not supported, use click to upload files',
    },
    touchEvents: {
      available: 'ontouchstart' in window,
      fallback: 'mouse',
      message: 'Touch events not supported, using mouse events',
    },
  };

  return fallbacks[feature] || { available: false, message: 'Feature not supported' };
}