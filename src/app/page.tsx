'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { InvoiceList, FilterPanel } from '@/components/invoice';
import { Button, ConfirmationModal, useToast } from '@/components/ui';
import { useInvoices, useFilterState } from '@/hooks';
import { Invoice } from '@/types';
import { LocalStorageDebug } from '@/components/debug/LocalStorageDebug';

export default function HomePage() {
  const router = useRouter();
  const { invoices, filterInvoices, deleteInvoice, isLoading, error } = useInvoices();
  const { addToast } = useToast();
  const { filters, updateFilters, hasActiveFilters, activeFilterCount } = useFilterState();
  const [deleteModal, setDeleteModal] = React.useState<{
    isOpen: boolean;
    invoice: Invoice | null;
    isDeleting: boolean;
  }>({
    isOpen: false,
    invoice: null,
    isDeleting: false,
  });

  // Apply filters to invoices
  const filteredInvoices = useMemo(() => {
    return filterInvoices(filters);
  }, [invoices, filters, filterInvoices]);

  // Handle invoice edit navigation
  const handleEditInvoice = (invoice: Invoice) => {
    console.log('Editing invoice:', invoice);
    console.log('Invoice ID:', invoice.id);
    console.log('All invoices:', invoices);
    router.push(`/edit/${invoice.id}`);
  };

  // Handle invoice deletion with confirmation
  const handleDeleteInvoice = (invoice: Invoice) => {
    setDeleteModal({
      isOpen: true,
      invoice,
      isDeleting: false,
    });
  };

  // Handle confirmed deletion
  const handleConfirmDelete = async () => {
    if (!deleteModal.invoice) return;

    setDeleteModal(prev => ({ ...prev, isDeleting: true }));

    try {
      deleteInvoice(deleteModal.invoice.id);

      addToast({
        type: 'success',
        title: 'Invoice Deleted',
        message: `Invoice ${deleteModal.invoice.invoiceNumber} has been successfully deleted.`,
      });

      setDeleteModal({
        isOpen: false,
        invoice: null,
        isDeleting: false,
      });
    } catch (error) {
      console.error('Failed to delete invoice:', error);

      addToast({
        type: 'error',
        title: 'Deletion Failed',
        message: 'Failed to delete invoice. Please try again.',
      });

      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  // Handle cancel deletion
  const handleCancelDelete = () => {
    if (deleteModal.isDeleting) return;

    setDeleteModal({
      isOpen: false,
      invoice: null,
      isDeleting: false,
    });
  };

  // Handle create new invoice navigation
  const handleCreateInvoice = () => {
    router.push('/create');
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-12 h-12 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Invoices</h3>
        <p className="text-gray-500 mb-6">{error.message}</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
          <p className="text-gray-600 mt-1">
            Manage your sales invoices and track payments
            {hasActiveFilters && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {activeFilterCount} filter{activeFilterCount === 1 ? '' : 's'} active
              </span>
            )}
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button onClick={handleCreateInvoice}>
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        filters={filters}
        onFiltersChange={updateFilters}
      />

      {/* Invoice List */}
      <InvoiceList
        invoices={filteredInvoices}
        onEdit={handleEditInvoice}
        onDelete={handleDeleteInvoice}
        loading={isLoading}
      />

      {/* Summary Stats */}
      {filteredInvoices.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Summary
            {hasActiveFilters && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                (filtered results)
              </span>
            )}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {filteredInvoices.length}
              </div>
              <div className="text-sm text-gray-500">
                {hasActiveFilters ? 'Filtered' : 'Total'} Invoices
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredInvoices.filter(i => i.paymentStatus === 'Paid').length}
              </div>
              <div className="text-sm text-gray-500">Paid</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {filteredInvoices.filter(i => i.paymentStatus === 'Unpaid').length}
              </div>
              <div className="text-sm text-gray-500">Unpaid</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                ₦{filteredInvoices.reduce((sum, i) => sum + i.total, 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">Total Amount</div>
            </div>
          </div>
        </div>
      )}

      {/* No results message when filters are active */}
      {hasActiveFilters && filteredInvoices.length === 0 && invoices.length > 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices match your filters</h3>
          <p className="text-gray-500 mb-6">
            Try adjusting your filter criteria to see more results.
          </p>
        </div>
      )}

      {/* Debug Component - Remove in production */}
      <LocalStorageDebug />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Invoice"
        message={
          deleteModal.invoice
            ? `Are you sure you want to delete invoice ${deleteModal.invoice.invoiceNumber}? This action cannot be undone and will also remove all associated file attachments.`
            : ''
        }
        confirmText="Delete Invoice"
        cancelText="Cancel"
        variant="danger"
        loading={deleteModal.isDeleting}
      />
    </div>
  );
}