'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { InvoiceForm, InvoiceFormData } from '@/components/invoice';
import { useInvoices } from '@/hooks';
import { Invoice } from '@/types';

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const { getInvoice, updateInvoice, invoices, isLoading: invoicesLoading } = useInvoices();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Use ref to track the current invoice state without causing re-renders
  const currentInvoiceRef = useRef<Invoice | null>(null);

  const invoiceId = params.id as string;

  // Load invoice data on mount - wait for invoices to load first
  useEffect(() => {
    if (!invoiceId) {
      setNotFound(true);
      setIsLoadingInvoice(false);
      return;
    }

    // Wait for invoices to load from localStorage before trying to get invoice
    if (invoicesLoading) {
      return;
    }

    try {
      const foundInvoice = getInvoice(invoiceId);

      if (foundInvoice) {
        console.log('📄 EditPage - Found invoice:', foundInvoice.id);
        console.log('📄 EditPage - Invoice attachments:', foundInvoice.attachments?.length, foundInvoice.attachments);
        setInvoice(foundInvoice);
        currentInvoiceRef.current = foundInvoice;
      } else {
        console.log('📄 EditPage - Invoice not found for ID:', invoiceId);
        setNotFound(true);
      }
    } catch (error) {
      console.error('Failed to load invoice:', error);
      setNotFound(true);
    } finally {
      setIsLoadingInvoice(false);
    }
  }, [invoiceId, invoicesLoading]); // Remove 'invoices' and 'getInvoice' from dependencies

  // Update invoice state when invoices array changes (for attachment updates)
  useEffect(() => {
    if (!invoicesLoading && currentInvoiceRef.current) {
      const currentInvoice = getInvoice(invoiceId);
      if (currentInvoice && currentInvoice.updatedAt !== currentInvoiceRef.current.updatedAt) {
        console.log('📄 EditPage - Invoice updated, refreshing state');
        console.log('📄 EditPage - New attachment count:', currentInvoice.attachments?.length);
        setInvoice(currentInvoice);
        currentInvoiceRef.current = currentInvoice;
      }
    }
  }, [invoices, invoiceId, invoicesLoading]); // Remove 'invoice' and 'getInvoice' from dependencies

  // Handle form submission
  const handleSubmit = async (formData: InvoiceFormData) => {
    console.log('📄 EditPage - handleSubmit called');

    // Get the CURRENT invoice data at submission time, not stale state
    const currentInvoice = getInvoice(invoiceId);
    if (!currentInvoice) {
      console.error('📄 EditPage - Invoice not found at submission time');
      return;
    }

    console.log('📄 EditPage - Current invoice attachments at submission:', currentInvoice.attachments?.length, currentInvoice.attachments);
    console.log('📄 EditPage - Form data attachments:', formData.attachments?.length, formData.attachments);

    setIsLoading(true);

    try {
      // Update the invoice - DON'T override attachments as they're managed by the file attachment system
      const updatedInvoice = updateInvoice(currentInvoice.id, {
        invoiceNumber: formData.invoiceNumber,
        date: formData.date,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerAddress: formData.customerAddress,
        lineItems: formData.lineItems,
        subtotal: formData.subtotal,
        tax: formData.tax,
        total: formData.total,
        paymentStatus: formData.paymentStatus,
        // DON'T pass attachments - let the file attachment system manage them
      });

      console.log('📄 EditPage - Updated invoice attachments:', updatedInvoice.attachments?.length, updatedInvoice.attachments);

      // Navigate back to home page - success toast will be shown by the form
      router.push('/');
    } catch (error) {
      console.error('Failed to update invoice:', error);
      // Error will be handled by the form component
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel navigation - no confirmation needed as form handles it
  const handleCancel = () => {
    router.push('/');
  };

  // Loading state - show loading while invoices are loading OR while searching for invoice
  if (invoicesLoading || isLoadingInvoice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            <div className="space-y-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (notFound || !invoice) {
    return (
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Invoice Not Found</h3>
        <p className="text-gray-500 mb-6">
          The invoice you're looking for doesn't exist or may have been deleted.
        </p>
        <button
          onClick={() => router.push('/')}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Back to Invoices
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          aria-label="Go back"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Edit Invoice {invoice.invoiceNumber}
          </h1>
          <p className="text-gray-600 mt-1">
            Update the invoice details below
          </p>
        </div>
      </div>

      {/* Invoice Metadata */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-500">Created:</span>
            <div className="text-gray-900">
              {new Date(invoice.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div>
            <span className="font-medium text-gray-500">Last Updated:</span>
            <div className="text-gray-900">
              {new Date(invoice.updatedAt).toLocaleDateString()}
            </div>
          </div>
          <div>
            <span className="font-medium text-gray-500">Attachments:</span>
            <div className="text-gray-900">
              {invoice.attachments.length} file{invoice.attachments.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Form */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-8">
          <InvoiceForm
            mode="edit"
            initialData={invoice}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-amber-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-amber-800">
              Important Notes
            </h3>
            <div className="mt-2 text-sm text-amber-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Changes will be saved immediately when you submit the form</li>
                <li>The original creation date will be preserved</li>
                <li>File attachments are managed separately and won't be affected</li>
                <li>Make sure to review all changes before saving</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}