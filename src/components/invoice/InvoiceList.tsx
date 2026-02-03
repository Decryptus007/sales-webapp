import React, { useState } from 'react';
import { Invoice, PaymentStatus } from '@/types';
import { Button, Skeleton, FadeTransition } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface InvoiceListProps {
  invoices: Invoice[];
  onEdit?: (invoice: Invoice) => void;
  onDelete?: (invoice: Invoice) => void;
  loading?: boolean;
  className?: string;
}

const PaymentStatusBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  const statusStyles = {
    'Paid': 'bg-green-100 text-green-800 border-green-200',
    'Unpaid': 'bg-red-100 text-red-800 border-red-200',
    'Partially Paid': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Overdue': 'bg-red-100 text-red-900 border-red-300 font-semibold',
  };

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      statusStyles[status]
    )}>
      {status}
    </span>
  );
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount);
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  onEdit,
  onDelete,
  loading = false,
  className,
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (invoice: Invoice) => {
    if (!onDelete) return;

    setDeletingId(invoice.id);
    try {
      await onDelete(invoice);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Loading skeleton */}
        <FadeTransition show={true}>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index}>
                {/* Desktop skeleton */}
                <div className="hidden md:block">
                  <div className="bg-white shadow rounded-lg border border-gray-200 p-6">
                    <div className="grid grid-cols-6 gap-4">
                      <Skeleton variant="text" height="1.25rem" />
                      <Skeleton variant="text" height="1.25rem" />
                      <Skeleton variant="text" height="1.25rem" />
                      <Skeleton variant="text" height="1.25rem" />
                      <Skeleton variant="rectangular" height="1.5rem" width="5rem" />
                      <div className="flex space-x-2 justify-end">
                        <Skeleton variant="rectangular" height="2rem" width="3rem" />
                        <Skeleton variant="rectangular" height="2rem" width="4rem" />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Mobile skeleton */}
                <div className="md:hidden">
                  <div className="bg-white shadow rounded-lg border border-gray-200 p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <Skeleton variant="text" height="1.25rem" width="60%" />
                          <Skeleton variant="text" height="1rem" width="80%" />
                        </div>
                        <Skeleton variant="rectangular" height="1.5rem" width="5rem" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Skeleton variant="text" height="1rem" />
                        <Skeleton variant="text" height="1rem" />
                      </div>
                      <div className="flex space-x-2 pt-2">
                        <Skeleton variant="rectangular" height="2rem" className="flex-1" />
                        <Skeleton variant="rectangular" height="2rem" className="flex-1" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </FadeTransition>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <FadeTransition show={true} className={cn('text-center py-12', className)}>
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
        <p className="text-gray-500 mb-6">
          Get started by creating your first invoice.
        </p>
      </FadeTransition>
    );
  }

  return (
    <FadeTransition show={true} className={cn('space-y-4', className)}>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices.map((invoice, index) => (
              <tr
                key={invoice.id}
                className="hover:bg-gray-50 transition-colors duration-150"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animation: 'fadeInUp 0.3s ease-out forwards',
                  opacity: 0,
                }}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {invoice.invoiceNumber}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{invoice.customerName}</div>
                  {invoice.customerEmail && (
                    <div className="text-sm text-gray-500">{invoice.customerEmail}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(invoice.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatCurrency(invoice.total)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <PaymentStatusBadge status={invoice.paymentStatus} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(invoice)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(invoice)}
                      loading={deletingId === invoice.id}
                      loadingText="Deleting..."
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {invoices.map((invoice, index) => (
          <div
            key={invoice.id}
            className="bg-white shadow rounded-lg border border-gray-200 p-4 transition-all duration-200 hover:shadow-md"
            style={{
              animationDelay: `${index * 100}ms`,
              animation: 'fadeInUp 0.3s ease-out forwards',
              opacity: 0,
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {invoice.invoiceNumber}
                </h3>
                <p className="text-sm text-gray-600">{invoice.customerName}</p>
                {invoice.customerEmail && (
                  <p className="text-sm text-gray-500">{invoice.customerEmail}</p>
                )}
              </div>
              <PaymentStatusBadge status={invoice.paymentStatus} />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </p>
                <p className="text-sm text-gray-900">{formatDate(invoice.date)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(invoice.total)}
                </p>
              </div>
            </div>

            {(onEdit || onDelete) && (
              <div className="flex space-x-2 pt-3 border-t border-gray-200">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(invoice)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(invoice)}
                    loading={deletingId === invoice.id}
                    loadingText="Deleting..."
                    className="flex-1"
                  >
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </FadeTransition>
  );
};