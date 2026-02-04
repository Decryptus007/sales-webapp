'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InvoiceForm, InvoiceFormData } from '@/components/invoice';
import { useInvoices } from '@/hooks';
import { Invoice, CreateInvoiceData } from '@/types';

export default function CreateInvoicePage() {
  const router = useRouter();
  const { createInvoice } = useInvoices();
  const [isLoading, setIsLoading] = useState(false);

  // Handle form submission
  const handleSubmit = async (formData: InvoiceFormData) => {
    console.log('🏗️ CreatePage - handleSubmit called');
    console.log('🏗️ CreatePage - Received formData.attachments:', formData.attachments?.length, formData.attachments);

    setIsLoading(true);

    try {
      // Create the invoice with attachments
      const invoiceData: CreateInvoiceData = {
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
      };

      // Add attachments if any were uploaded during creation
      if (formData.attachments && formData.attachments.length > 0) {
        invoiceData.attachments = formData.attachments;
        console.log('🏗️ CreatePage - Added attachments to invoiceData:', invoiceData.attachments.length, invoiceData.attachments);
      } else {
        console.log('🏗️ CreatePage - No attachments to add');
      }

      console.log('🏗️ CreatePage - Calling createInvoice with data:', invoiceData);
      const newInvoice: Invoice = createInvoice(invoiceData);
      console.log('🏗️ CreatePage - Created invoice:', newInvoice.id, 'with attachments:', newInvoice.attachments?.length, newInvoice.attachments);

      // Navigate back to home page - success toast will be shown by the form
      router.push('/');
    } catch (error) {
      console.error('Failed to create invoice:', error);
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
          <h1 className="text-2xl font-bold text-gray-900">Create New Invoice</h1>
          <p className="text-gray-600 mt-1">
            Fill in the details below to create a new sales invoice
          </p>
        </div>
      </div>

      {/* Invoice Form */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-8">
          <InvoiceForm
            mode="create"
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Tips for creating invoices
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Use a unique invoice number for easy tracking</li>
                <li>Double-check customer information for accuracy</li>
                <li>Add detailed descriptions for each line item</li>
                <li>Review totals before saving the invoice</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}