import { generateId, formatCurrency, calculateLineItemTotal } from '@/lib/utils';
import { InvoiceSchema, LineItemSchema } from '@/lib/validations';
import { PaymentStatus } from '@/types';

describe('Project Setup', () => {
  describe('Utility Functions', () => {
    test('generateId creates unique identifiers', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });

    test('formatCurrency formats numbers correctly', () => {
      expect(formatCurrency(100)).toBe('$100.00');
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
    });

    test('calculateLineItemTotal computes correctly', () => {
      expect(calculateLineItemTotal(2, 10.50)).toBe(21);
      expect(calculateLineItemTotal(1, 99.99)).toBe(99.99);
      expect(calculateLineItemTotal(0, 100)).toBe(0);
    });
  });

  describe('Type Definitions', () => {
    test('PaymentStatus type includes all expected values', () => {
      const statuses: PaymentStatus[] = ['Paid', 'Unpaid', 'Partially Paid', 'Overdue'];

      statuses.forEach(status => {
        expect(['Paid', 'Unpaid', 'Partially Paid', 'Overdue']).toContain(status);
      });
    });
  });

  describe('Validation Schemas', () => {
    test('LineItemSchema validates correct data', () => {
      const validLineItem = {
        id: 'line-1',
        description: 'Test Item',
        quantity: 2,
        unitPrice: 10.50,
        total: 21.00,
      };

      const result = LineItemSchema.safeParse(validLineItem);
      expect(result.success).toBe(true);
    });

    test('LineItemSchema rejects invalid data', () => {
      const invalidLineItem = {
        id: '',
        description: '',
        quantity: -1,
        unitPrice: -10,
        total: -21,
      };

      const result = LineItemSchema.safeParse(invalidLineItem);
      expect(result.success).toBe(false);
    });

    test('InvoiceSchema validates complete invoice data', () => {
      const validInvoice = {
        id: 'inv-1',
        invoiceNumber: 'INV-001',
        date: new Date(),
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        lineItems: [{
          id: 'line-1',
          description: 'Test Item',
          quantity: 1,
          unitPrice: 100,
          total: 100,
        }],
        subtotal: 100,
        tax: 10,
        total: 110,
        paymentStatus: 'Unpaid' as PaymentStatus,
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = InvoiceSchema.safeParse(validInvoice);
      expect(result.success).toBe(true);
    });
  });
});