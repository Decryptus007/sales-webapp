import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterPanel } from '../FilterPanel';
import { FilterCriteria } from '@/types';

describe('FilterPanel', () => {
  const mockOnFiltersChange = jest.fn();

  beforeEach(() => {
    mockOnFiltersChange.mockClear();
  });

  it('renders filter panel with expand/collapse functionality', () => {
    const filters: FilterCriteria = {};
    render(<FilterPanel filters={filters} onFiltersChange={mockOnFiltersChange} />);

    expect(screen.getByText('Filters')).toBeInTheDocument();

    // Should be collapsed by default
    expect(screen.queryByText('Date Range')).not.toBeInTheDocument();

    // Click to expand
    const expandButton = screen.getByLabelText('Expand filters');
    fireEvent.click(expandButton);

    expect(screen.getByText('Date Range')).toBeInTheDocument();
    expect(screen.getByText('Payment Status')).toBeInTheDocument();
  });

  it('handles date range filtering', () => {
    const filters: FilterCriteria = {};
    render(<FilterPanel filters={filters} onFiltersChange={mockOnFiltersChange} />);

    // Expand the panel
    fireEvent.click(screen.getByLabelText('Expand filters'));

    // The DateRangePicker component will be present
    expect(screen.getByText('Select Date Range')).toBeInTheDocument();

    // Note: Testing the actual date selection would require more complex setup
    // since we're using a Popover with Calendar component
    // For now, we'll test that the component renders correctly
  });

  it('handles payment status filtering', () => {
    const filters: FilterCriteria = {};
    render(<FilterPanel filters={filters} onFiltersChange={mockOnFiltersChange} />);

    // Expand the panel
    fireEvent.click(screen.getByLabelText('Expand filters'));

    // Click on Paid status
    const paidButton = screen.getByText('Paid');
    fireEvent.click(paidButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      paymentStatuses: ['Paid'],
    });
  });

  it('handles multiple payment status selection', () => {
    const filters: FilterCriteria = { paymentStatuses: ['Paid'] };
    render(<FilterPanel filters={filters} onFiltersChange={mockOnFiltersChange} />);

    // Expand the panel
    fireEvent.click(screen.getByLabelText('Expand filters'));

    // Click on Unpaid status (should add to existing)
    const unpaidButton = screen.getByText('Unpaid');
    fireEvent.click(unpaidButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      paymentStatuses: ['Paid', 'Unpaid'],
    });
  });

  it('handles payment status deselection', () => {
    const filters: FilterCriteria = { paymentStatuses: ['Paid', 'Unpaid'] };
    render(<FilterPanel filters={filters} onFiltersChange={mockOnFiltersChange} />);

    // Expand the panel
    fireEvent.click(screen.getByLabelText('Expand filters'));

    // Click on Paid status (should remove it)
    const paidButton = screen.getByText('Paid');
    fireEvent.click(paidButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      paymentStatuses: ['Unpaid'],
    });
  });

  it('shows active filter count', () => {
    const filters: FilterCriteria = {
      dateRange: { startDate: new Date('2024-01-01') },
      paymentStatuses: ['Paid'],
    };
    render(<FilterPanel filters={filters} onFiltersChange={mockOnFiltersChange} />);

    expect(screen.getByText('2 active')).toBeInTheDocument();
  });

  it('clears all filters', () => {
    const filters: FilterCriteria = {
      dateRange: { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
      paymentStatuses: ['Paid'],
    };
    render(<FilterPanel filters={filters} onFiltersChange={mockOnFiltersChange} />);

    const clearButton = screen.getByText('Clear all');
    fireEvent.click(clearButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({});
  });

  it('shows filter summary when collapsed on mobile', () => {
    const filters: FilterCriteria = {
      dateRange: { startDate: new Date('2024-01-01') },
      paymentStatuses: ['Paid'],
    };
    render(<FilterPanel filters={filters} onFiltersChange={mockOnFiltersChange} />);

    // Should show active filters summary (though hidden on desktop with md:hidden)
    expect(screen.getByText('Status: Paid')).toBeInTheDocument();
  });

  it('displays all payment status options', () => {
    const filters: FilterCriteria = {};
    render(<FilterPanel filters={filters} onFiltersChange={mockOnFiltersChange} />);

    // Expand the panel
    fireEvent.click(screen.getByLabelText('Expand filters'));

    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getByText('Unpaid')).toBeInTheDocument();
    expect(screen.getByText('Partially Paid')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('shows selected payment statuses with checkmarks', () => {
    const filters: FilterCriteria = { paymentStatuses: ['Paid'] };
    render(<FilterPanel filters={filters} onFiltersChange={mockOnFiltersChange} />);

    // Expand the panel
    fireEvent.click(screen.getByLabelText('Expand filters'));

    // Paid button should have a checkmark (svg)
    const paidButton = screen.getByText('Paid').closest('button');
    expect(paidButton?.querySelector('svg')).toBeInTheDocument();
  });
});