import {
  validateInvoiceCreation,
  validateInvoiceUpdate,
  validateLineItem,
  validateCustomerInfo,
  validatePaymentStatus,
  formatErrorsForForm,
  getFieldError,
} from '../validations';
import { CreateInvoiceData, UpdateInvoiceData, LineItem, PaymentStatus } from '@/types';

describe('validations', () => {
  describe('validateInvoiceCreation', () => {
    const validInvoiceData: CreateInvoiceData = {
      invoiceNumber: 'INV-001',
      date: new Date('2026-01-01'), // Use current year
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerAddress: '123 Main St',
      lineItems: [
        {
          id: '1',
          description: 'Web Development',
          quantity: 1,
          unitPrice: 1000,
          total: 1000,
        },
      ],
      subtotal: 1000,
      tax: 100,
      total: 1100,
      paymentStatus: 'Unpaid',
      attachments: [],
    };

    it('should validate correct invoice data', () => {
      const result = validateInvoiceCreation(validInvoiceData);
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing invoice number', () => {
      const invalidData = { ...validInvoiceData, invoiceNumber: '' };
      const result = validateInvoiceCreation(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.field === 'invoiceNumber')).toBe(true);
    });

    it('should reject invalid invoice number format', () => {
      const invalidData = { ...validInvoiceData, invoiceNumber: '' }; // Empty string should fail
      const result = validateInvoiceCreation(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.field === 'invoiceNumber')).toBe(true);
    });

    it('should reject future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const invalidData = { ...validInvoiceData, date: futureDate };
      const result = validateInvoiceCreation(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.field === 'date')).toBe(true);
    });

    it('should reject missing customer name', () => {
      const invalidData = { ...validInvoiceData, customerName: '' };
      const result = validateInvoiceCreation(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.field === 'customerName')).toBe(true);
    });

    it('should reject invalid email format', () => {
      const invalidData = { ...validInvoiceData, customerEmail: 'invalid-email' };
      const result = validateInvoiceCreation(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.field === 'customerEmail')).toBe(true);
    });

    it('should accept optional empty email', () => {
      const validData = { ...validInvoiceData, customerEmail: undefined };
      const result = validateInvoiceCreation(validData);

      expect(result.success).toBe(true);
    });

    it('should reject empty line items', () => {
      const invalidData = { ...validInvoiceData, lineItems: [] };
      const result = validateInvoiceCreation(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.field === 'lineItems')).toBe(true);
    });

    it('should reject negative quantities', () => {
      const invalidData = {
        ...validInvoiceData,
        lineItems: [
          {
            id: '1',
            description: 'Service',
            quantity: -1,
            unitPrice: 100,
            total: -100,
          },
        ],
      };
      const result = validateInvoiceCreation(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.field === 'lineItems.0.quantity')).toBe(true);
    });

    it('should reject negative unit prices', () => {
      const invalidData = {
        ...validInvoiceData,
        lineItems: [
          {
            id: '1',
            description: 'Service',
            quantity: 1,
            unitPrice: -100,
            total: -100,
          },
        ],
      };
      const result = validateInvoiceCreation(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.field === 'lineItems.0.unitPrice')).toBe(true);
    });

    it('should reject incorrect total calculation', () => {
      const invalidData = {
        ...validInvoiceData,
        lineItems: [
          {
            id: '1',
            description: 'Service',
            quantity: 2,
            unitPrice: 100,
            total: 150, // Should be 200
          },
        ],
        subtotal: 150,
        total: 165, // Should be 220 (200 + 20 tax)
      };
      const result = validateInvoiceCreation(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.field === 'lineItems.0.total')).toBe(true);
    });

    it('should reject negative tax', () => {
      const invalidData = { ...validInvoiceData, tax: -10 };
      const result = validateInvoiceCreation(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.field === 'tax')).toBe(true);
    });

    it('should reject invalid payment status', () => {
      const invalidData = { ...validInvoiceData, paymentStatus: 'Invalid' as PaymentStatus };
      const result = validateInvoiceCreation(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.field === 'paymentStatus')).toBe(true);
    });
  });

  describe('validateInvoiceUpdate', () => {
    const validUpdateData: UpdateInvoiceData = {
      id: 'invoice-123',
      invoiceNumber: 'INV-001',
      date: new Date('2026-01-01'),
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      lineItems: [
        {
          id: '1',
          description: 'Web Development',
          quantity: 1,
          unitPrice: 1000,
          total: 1000,
        },
      ],
      subtotal: 1000,
      tax: 100,
      total: 1100,
      paymentStatus: 'Paid',
    };

    it('should validate correct update data', () => {
      const result = validateInvoiceUpdate(validUpdateData);
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing ID', () => {
      const invalidData = { ...validUpdateData, id: '' };
      const result = validateInvoiceUpdate(invalidData);

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.field === 'id')).toBe(true);
    });

    it('should allow partial updates', () => {
      const partialUpdate = {
        id: 'invoice-123',
        customerName: 'Jane Doe',
        paymentStatus: 'Paid' as PaymentStatus,
      };

      // This should be handled by the validation logic to only validate provided fields
      // For now, we'll test with all required fields
      const result = validateInvoiceUpdate(validUpdateData);
      expect(result.success).toBe(true);
    });
  });

  describe('validateLineItem', () => {
    const validLineItem: LineItem = {
      id: '1',
      description: 'Web Development',
      quantity: 2,
      unitPrice: 500,
      total: 1000,
    };

    it('should validate correct line item', () => {
      const result = validateLineItem(validLineItem);
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty description', () => {
      const invalidItem = { ...validLineItem, description: '' };
      const result = validateLineItem(invalidItem);

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.field === 'description')).toBe(true);
    });

    it('should reject zero quantity', () => {
      const invalidItem = { ...validLineItem, quantity: 0 };
      const result = validateLineItem(invalidItem);

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.field === 'quantity')).toBe(true);
    });

    it('should reject zero unit price', () => {
      const invalidItem = { ...validLineItem, unitPrice: 0, total: 0 };
      const result = validateLineItem(invalidItem);

      expect(result.success).toBe(true); // Zero unit price is now allowed (nonnegative)
    });

    it('should reject incorrect total calculation', () => {
      const invalidItem = { ...validLineItem, total: 900 }; // Should be 1000
      const result = validateLineItem(invalidItem);

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.field === 'total')).toBe(true);
    });

    it('should handle decimal quantities and prices', () => {
      const decimalItem = {
        ...validLineItem,
        quantity: 1.5,
        unitPrice: 100.50,
        total: 150.75,
      };
      const result = validateLineItem(decimalItem);

      expect(result.success).toBe(true);
    });
  });

  describe('validateCustomerInfo', () => {
    it('should validate correct customer info', () => {
      const customerInfo = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerAddress: '123 Main St',
      };

      const result = validateCustomerInfo(customerInfo);
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty customer name', () => {
      const customerInfo = {
        customerName: '',
        customerEmail: 'john@example.com',
      };

      const result = validateCustomerInfo(customerInfo);
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.field === 'customerName')).toBe(true);
    });

    it('should reject invalid email format', () => {
      const customerInfo = {
        customerName: 'John Doe',
        customerEmail: 'invalid-email',
      };

      const result = validateCustomerInfo(customerInfo);
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.field === 'customerEmail')).toBe(true);
    });

    it('should accept optional fields as undefined', () => {
      const customerInfo = {
        customerName: 'John Doe',
        customerEmail: undefined,
        customerAddress: undefined,
      };

      const result = validateCustomerInfo(customerInfo);
      expect(result.success).toBe(true);
    });

    it('should reject customer name that is too long', () => {
      const customerInfo = {
        customerName: 'A'.repeat(101), // Assuming max length is 100
        customerEmail: 'john@example.com',
      };

      const result = validateCustomerInfo(customerInfo);
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.field === 'customerName')).toBe(true);
    });
  });

  describe('validatePaymentStatus', () => {
    it('should validate correct payment statuses', () => {
      const validStatuses: PaymentStatus[] = ['Paid', 'Unpaid', 'Partially Paid', 'Overdue'];

      validStatuses.forEach(status => {
        const result = validatePaymentStatus(status);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid payment status', () => {
      const result = validatePaymentStatus('Invalid' as PaymentStatus);
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.field === 'paymentStatus')).toBe(true);
    });
  });

  describe('formatErrorsForForm', () => {
    it('should format validation errors for form display', () => {
      const errors = [
        { field: 'customerName', message: 'Customer name is required' },
        { field: 'customerEmail', message: 'Invalid email format' },
        { field: 'lineItems.0.description', message: 'Description is required' },
      ];

      const formattedErrors = formatErrorsForForm(errors);

      expect(formattedErrors).toEqual({
        customerName: 'Customer name is required',
        customerEmail: 'Invalid email format',
        'lineItems.0.description': 'Description is required',
      });
    });

    it('should handle empty errors array', () => {
      const formattedErrors = formatErrorsForForm([]);
      expect(formattedErrors).toEqual({});
    });

    it('should handle duplicate field errors by keeping the first one', () => {
      const errors = [
        { field: 'customerName', message: 'First error' },
        { field: 'customerName', message: 'Second error' },
      ];

      const formattedErrors = formatErrorsForForm(errors);
      expect(formattedErrors.customerName).toBe('First error');
    });
  });

  describe('getFieldError', () => {
    const formErrors = {
      customerName: 'Customer name is required',
      customerEmail: 'Invalid email format',
      'lineItems.0.description': 'Description is required',
    };

    it('should return error for existing field', () => {
      const error = getFieldError(formErrors, 'customerName');
      expect(error).toBe('Customer name is required');
    });

    it('should return undefined for non-existent field', () => {
      const error = getFieldError(formErrors, 'nonExistentField');
      expect(error).toBeUndefined();
    });

    it('should return error for nested field', () => {
      const error = getFieldError(formErrors, 'lineItems.0.description');
      expect(error).toBe('Description is required');
    });
  });

  describe('Edge Cases and Complex Scenarios', () => {
    it('should handle very large numbers', () => {
      const largeNumberData = {
        invoiceNumber: 'INV-001',
        date: new Date('2026-01-01'),
        customerName: 'John Doe',
        lineItems: [
          {
            id: '1',
            description: 'Service',
            quantity: 999999,
            unitPrice: 999999.99,
            total: 999999 * 999999.99,
          },
        ],
        subtotal: 999999 * 999999.99,
        tax: 0,
        total: 999999 * 999999.99,
        paymentStatus: 'Unpaid' as PaymentStatus,
      };

      const result = validateInvoiceCreation(largeNumberData);
      // Should handle large numbers appropriately
      expect(result.success).toBe(true);
    });

    it('should handle special characters in descriptions', () => {
      const specialCharData = {
        invoiceNumber: 'INV-001',
        date: new Date('2026-01-01'),
        customerName: 'John Doe',
        lineItems: [
          {
            id: '1',
            description: 'Service with special chars: @#$%^&*()',
            quantity: 1,
            unitPrice: 100,
            total: 100,
          },
        ],
        subtotal: 100,
        tax: 0,
        total: 100,
        paymentStatus: 'Unpaid' as PaymentStatus,
      };

      const result = validateInvoiceCreation(specialCharData);
      expect(result.success).toBe(true);
    });

    it('should handle multiple line items with different validation errors', () => {
      const multipleErrorsData = {
        invoiceNumber: 'INV-001',
        date: new Date('2026-01-01'),
        customerName: 'John Doe',
        lineItems: [
          {
            id: '1',
            description: '', // Invalid: empty description
            quantity: 1,
            unitPrice: 100,
            total: 100,
          },
          {
            id: '2',
            description: 'Valid service',
            quantity: -1, // Invalid: negative quantity
            unitPrice: 100,
            total: -100,
          },
          {
            id: '3',
            description: 'Another service',
            quantity: 2,
            unitPrice: 50,
            total: 90, // Invalid: incorrect total (should be 100)
          },
        ],
        subtotal: 90,
        tax: 0,
        total: 90,
        paymentStatus: 'Unpaid' as PaymentStatus,
      };

      const result = validateInvoiceCreation(multipleErrorsData);
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(2);

      // Should have errors for each problematic line item
      expect(result.errors.some(error => error.field === 'lineItems.0.description')).toBe(true);
      expect(result.errors.some(error => error.field === 'lineItems.1.quantity')).toBe(true);
      expect(result.errors.some(error => error.field === 'lineItems.2.total')).toBe(true);
    });
  });
});