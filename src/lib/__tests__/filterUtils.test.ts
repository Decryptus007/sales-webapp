import { Invoice, FilterCriteria } from '@/types';

// Extract the filtering logic as a pure function for testing
export function filterInvoices(invoices: Invoice[], criteria: FilterCriteria): Invoice[] {
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
}

// Mock invoice data for testing
const createMockInvoice = (overrides: Partial<Invoice>): Invoice => ({
  id: '1',
  invoiceNumber: 'INV-001',
  date: new Date('2024-01-15'),
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
  paymentStatus: 'Paid',
  attachments: [],
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  ...overrides,
});

describe('Invoice Filtering Logic', () => {
  const mockInvoices: Invoice[] = [
    createMockInvoice({
      id: '1',
      date: new Date('2024-01-10'),
      paymentStatus: 'Paid',
      invoiceNumber: 'INV-001',
    }),
    createMockInvoice({
      id: '2',
      date: new Date('2024-01-15'),
      paymentStatus: 'Unpaid',
      invoiceNumber: 'INV-002',
    }),
    createMockInvoice({
      id: '3',
      date: new Date('2024-01-20'),
      paymentStatus: 'Paid',
      invoiceNumber: 'INV-003',
    }),
    createMockInvoice({
      id: '4',
      date: new Date('2024-01-25'),
      paymentStatus: 'Overdue',
      invoiceNumber: 'INV-004',
    }),
  ];

  it('filters invoices by start date only', () => {
    const criteria: FilterCriteria = {
      dateRange: {
        startDate: new Date('2024-01-15'),
      },
    };

    const filtered = filterInvoices(mockInvoices, criteria);

    expect(filtered).toHaveLength(3);
    expect(filtered.map(i => i.invoiceNumber)).toEqual(['INV-002', 'INV-003', 'INV-004']);
  });

  it('filters invoices by end date only', () => {
    const criteria: FilterCriteria = {
      dateRange: {
        endDate: new Date('2024-01-20'),
      },
    };

    const filtered = filterInvoices(mockInvoices, criteria);

    expect(filtered).toHaveLength(3);
    expect(filtered.map(i => i.invoiceNumber)).toEqual(['INV-001', 'INV-002', 'INV-003']);
  });

  it('filters invoices by date range (start and end)', () => {
    const criteria: FilterCriteria = {
      dateRange: {
        startDate: new Date('2024-01-12'),
        endDate: new Date('2024-01-22'),
      },
    };

    const filtered = filterInvoices(mockInvoices, criteria);

    expect(filtered).toHaveLength(2);
    expect(filtered.map(i => i.invoiceNumber)).toEqual(['INV-002', 'INV-003']);
  });

  it('filters invoices by single payment status', () => {
    const criteria: FilterCriteria = {
      paymentStatuses: ['Paid'],
    };

    const filtered = filterInvoices(mockInvoices, criteria);

    expect(filtered).toHaveLength(2);
    expect(filtered.map(i => i.paymentStatus)).toEqual(['Paid', 'Paid']);
  });

  it('filters invoices by multiple payment statuses', () => {
    const criteria: FilterCriteria = {
      paymentStatuses: ['Paid', 'Unpaid'],
    };

    const filtered = filterInvoices(mockInvoices, criteria);

    expect(filtered).toHaveLength(3);
    expect(filtered.map(i => i.paymentStatus)).toEqual(['Paid', 'Unpaid', 'Paid']);
  });

  it('applies combined date range and payment status filters', () => {
    const criteria: FilterCriteria = {
      dateRange: {
        startDate: new Date('2024-01-12'),
        endDate: new Date('2024-01-22'),
      },
      paymentStatuses: ['Paid'],
    };

    const filtered = filterInvoices(mockInvoices, criteria);

    // Should only include INV-003 (within date range AND paid status)
    expect(filtered).toHaveLength(1);
    expect(filtered[0].invoiceNumber).toBe('INV-003');
    expect(filtered[0].paymentStatus).toBe('Paid');
  });

  it('returns all invoices when no filters are applied', () => {
    const criteria: FilterCriteria = {};

    const filtered = filterInvoices(mockInvoices, criteria);

    expect(filtered).toHaveLength(4);
  });

  it('returns empty array when no invoices match filters', () => {
    const criteria: FilterCriteria = {
      dateRange: {
        startDate: new Date('2024-02-01'),
      },
    };

    const filtered = filterInvoices(mockInvoices, criteria);

    expect(filtered).toHaveLength(0);
  });

  it('handles edge case with same start and end date', () => {
    const criteria: FilterCriteria = {
      dateRange: {
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-15'),
      },
    };

    const filtered = filterInvoices(mockInvoices, criteria);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].invoiceNumber).toBe('INV-002');
  });

  it('handles empty payment status array', () => {
    const criteria: FilterCriteria = {
      paymentStatuses: [],
    };

    const filtered = filterInvoices(mockInvoices, criteria);

    // Empty array should not filter anything
    expect(filtered).toHaveLength(4);
  });

  it('filters by all payment status types', () => {
    const invoicesWithAllStatuses = [
      createMockInvoice({ id: '1', paymentStatus: 'Paid' }),
      createMockInvoice({ id: '2', paymentStatus: 'Unpaid' }),
      createMockInvoice({ id: '3', paymentStatus: 'Partially Paid' }),
      createMockInvoice({ id: '4', paymentStatus: 'Overdue' }),
    ];

    // Test each status individually
    expect(filterInvoices(invoicesWithAllStatuses, { paymentStatuses: ['Paid'] })).toHaveLength(1);
    expect(filterInvoices(invoicesWithAllStatuses, { paymentStatuses: ['Unpaid'] })).toHaveLength(1);
    expect(filterInvoices(invoicesWithAllStatuses, { paymentStatuses: ['Partially Paid'] })).toHaveLength(1);
    expect(filterInvoices(invoicesWithAllStatuses, { paymentStatuses: ['Overdue'] })).toHaveLength(1);

    // Test all statuses together
    expect(filterInvoices(invoicesWithAllStatuses, {
      paymentStatuses: ['Paid', 'Unpaid', 'Partially Paid', 'Overdue']
    })).toHaveLength(4);
  });
});