import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { InvoiceList } from '../InvoiceList';
import { Invoice } from '@/types';

// Mock invoice data for testing
const mockInvoices: Invoice[] = [
  {
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
  },
  {
    id: '2',
    invoiceNumber: 'INV-002',
    date: new Date('2024-01-20'),
    customerName: 'Jane Smith',
    customerEmail: 'jane@example.com',
    lineItems: [
      {
        id: '2',
        description: 'Consulting',
        quantity: 2,
        unitPrice: 500,
        total: 1000,
      },
    ],
    subtotal: 1000,
    tax: 80,
    total: 1080,
    paymentStatus: 'Unpaid',
    attachments: [],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
];

describe('InvoiceList', () => {
  it('renders invoice list with all invoices', () => {
    render(<InvoiceList invoices={mockInvoices} />);

    expect(screen.getAllByText('INV-001')).toHaveLength(2); // Desktop + Mobile
    expect(screen.getAllByText('INV-002')).toHaveLength(2); // Desktop + Mobile
    expect(screen.getAllByText('John Doe')).toHaveLength(2); // Desktop + Mobile
    expect(screen.getAllByText('Jane Smith')).toHaveLength(2); // Desktop + Mobile
  });

  it('displays empty state when no invoices', () => {
    render(<InvoiceList invoices={[]} />);

    expect(screen.getByText('No invoices found')).toBeInTheDocument();
    expect(screen.getByText('Get started by creating your first invoice.')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<InvoiceList invoices={[]} loading={true} />);

    // Should show loading skeletons
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(3);
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn();
    render(<InvoiceList invoices={mockInvoices} onEdit={onEdit} />);

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    expect(onEdit).toHaveBeenCalledWith(mockInvoices[0]);
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = jest.fn();
    render(<InvoiceList invoices={mockInvoices} onDelete={onDelete} />);

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(onDelete).toHaveBeenCalledWith(mockInvoices[0]);
  });

  it('displays payment status badges correctly', () => {
    render(<InvoiceList invoices={mockInvoices} />);

    expect(screen.getAllByText('Paid')).toHaveLength(2); // Desktop + Mobile
    expect(screen.getAllByText('Unpaid')).toHaveLength(2); // Desktop + Mobile
  });

  it('formats currency and dates correctly', () => {
    render(<InvoiceList invoices={mockInvoices} />);

    expect(screen.getAllByText('$1,100.00')).toHaveLength(2); // Desktop + Mobile
    expect(screen.getAllByText('$1,080.00')).toHaveLength(2); // Desktop + Mobile
    expect(screen.getAllByText('Jan 15, 2024')).toHaveLength(2); // Desktop + Mobile
    expect(screen.getAllByText('Jan 20, 2024')).toHaveLength(2); // Desktop + Mobile
  });

  it('shows customer email when available', () => {
    render(<InvoiceList invoices={mockInvoices} />);

    expect(screen.getAllByText('john@example.com')).toHaveLength(2); // Desktop + Mobile
    expect(screen.getAllByText('jane@example.com')).toHaveLength(2); // Desktop + Mobile
  });
});