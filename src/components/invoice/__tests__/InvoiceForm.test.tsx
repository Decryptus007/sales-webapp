import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { InvoiceForm } from '../InvoiceForm';
import { PaymentStatus } from '@/types';

// Mock the hooks
jest.mock('@/hooks/useInvoices', () => ({
  useInvoices: () => ({
    createInvoice: jest.fn(),
    updateInvoice: jest.fn(),
    error: null,
  }),
}));

describe('InvoiceForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form with basic structure', () => {
    render(
      <InvoiceForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        mode="create"
      />
    );

    // Check for form sections
    expect(screen.getByText('Invoice Details')).toBeInTheDocument();
    expect(screen.getByText('Customer Information')).toBeInTheDocument();
    expect(screen.getByText('Line Items')).toBeInTheDocument();
    expect(screen.getByText('Totals')).toBeInTheDocument();

    // Check for buttons
    expect(screen.getByRole('button', { name: /create invoice/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('displays initial data when provided', () => {
    const initialData = {
      invoiceNumber: 'INV-001',
      customerName: 'John Doe',
      paymentStatus: 'Paid' as PaymentStatus,
    };

    render(
      <InvoiceForm
        initialData={initialData}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        mode="edit"
      />
    );

    expect(screen.getByDisplayValue('INV-001')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Paid')).toBeInTheDocument();
  });

  it('adds and removes line items', () => {
    render(
      <InvoiceForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        mode="create"
      />
    );

    // Initially should have one line item
    expect(screen.getAllByText(/item \d+/i)).toHaveLength(1);

    // Add a line item
    fireEvent.click(screen.getByRole('button', { name: /add line item/i }));
    expect(screen.getAllByText(/item \d+/i)).toHaveLength(2);

    // Remove a line item (should only work if more than 1 exists)
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    fireEvent.click(removeButtons[0]);
    expect(screen.getAllByText(/item \d+/i)).toHaveLength(1);
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <InvoiceForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        mode="create"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('shows correct button text based on mode', () => {
    const { rerender } = render(
      <InvoiceForm
        onSubmit={mockOnSubmit}
        mode="create"
      />
    );

    expect(screen.getByRole('button', { name: /create invoice/i })).toBeInTheDocument();

    rerender(
      <InvoiceForm
        onSubmit={mockOnSubmit}
        mode="edit"
      />
    );

    expect(screen.getByRole('button', { name: /update invoice/i })).toBeInTheDocument();
  });

  it('disables submit button when loading', () => {
    render(
      <InvoiceForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        mode="create"
        isLoading={true}
      />
    );

    expect(screen.getByRole('button', { name: /create invoice/i })).toBeDisabled();
  });
});