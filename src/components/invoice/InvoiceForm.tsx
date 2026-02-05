import React, { useState, useCallback, useEffect } from 'react';
import { Invoice, LineItem, PaymentStatus, FileAttachment } from '@/types';
import { FormInput, FormGroup, ShadcnFormSelect } from '@/components/forms';
import { Button, FileUpload, AttachmentList, useToast, DatePicker, ConfirmationModal } from '@/components/ui';
import { useFileAttachments } from '@/hooks';
import { generateId, calculateLineItemTotal, calculateInvoiceSubtotal, calculateInvoiceTotal, formatCurrency } from '@/lib/utils';
import { validateInvoiceCreation, validateInvoiceUpdate, formatErrorsForForm, getFieldError } from '@/lib/validations';
import { cn } from '@/lib/utils';

export interface InvoiceFormProps {
  initialData?: Partial<Invoice>;
  onSubmit: (data: InvoiceFormData) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
  className?: string;
}

export interface InvoiceFormData {
  invoiceNumber: string;
  date: Date;
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentStatus: PaymentStatus;
  attachments?: FileAttachment[]; // Add attachments to form data
}

interface LineItemFormData {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  total: number;
}

const paymentStatusOptions = [
  { value: 'Unpaid', label: 'Unpaid' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Partially Paid', label: 'Partially Paid' },
  { value: 'Overdue', label: 'Overdue' },
];

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'create',
  className,
}) => {
  const { addToast } = useToast();

  // File attachments state for create mode
  const [tempAttachments, setTempAttachments] = useState<FileAttachment[]>([]);

  // File attachments hook (only for edit mode with existing invoice)
  const fileAttachments = mode === 'edit' && initialData?.id
    ? useFileAttachments(initialData.id)
    : null;
  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState(initialData?.invoiceNumber || '');
  const [date, setDate] = useState<Date | undefined>(() => {
    if (initialData?.date) {
      return initialData.date;
    }
    return new Date();
  });
  const [customerName, setCustomerName] = useState(initialData?.customerName || '');
  const [customerEmail, setCustomerEmail] = useState(initialData?.customerEmail || '');
  const [customerAddress, setCustomerAddress] = useState(initialData?.customerAddress || '');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(initialData?.paymentStatus || 'Unpaid');
  const [tax, setTax] = useState(initialData?.tax?.toString() || '0');

  // Line items state
  const [lineItems, setLineItems] = useState<LineItemFormData[]>(() => {
    if (initialData?.lineItems && initialData.lineItems.length > 0) {
      return initialData.lineItems.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        total: item.total,
      }));
    }
    return [{
      id: generateId(),
      description: '',
      quantity: '1',
      unitPrice: '0',
      total: 0,
    }];
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<InvoiceFormData | null>(null);

  // Cancel confirmation modal state
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Helper functions for temporary file attachments in create mode
  const handleTempFileDelete = useCallback((attachmentId: string) => {
    setTempAttachments(prev => prev.filter(att => att.id !== attachmentId));
    addToast({
      type: 'success',
      title: 'File Removed',
      message: 'File has been removed from the invoice.',
    });
  }, [addToast]);

  const handleTempFileDownload = useCallback(async (attachment: FileAttachment) => {
    try {
      const { downloadFile } = await import('@/lib/fileUtils');
      await downloadFile(attachment);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Download Failed',
        message: 'Failed to download file. Please try again.',
      });
    }
  }, [addToast]);

  // Calculate totals
  const subtotal = calculateInvoiceSubtotal(lineItems);
  const taxAmount = parseFloat(tax) || 0;
  const total = calculateInvoiceTotal(subtotal, taxAmount);

  // Update line item total when quantity or unit price changes
  const updateLineItemTotal = useCallback((index: number, quantity: string, unitPrice: string) => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(unitPrice) || 0;
    const itemTotal = calculateLineItemTotal(qty, price);

    setLineItems(prev => prev.map((item, i) =>
      i === index ? { ...item, quantity, unitPrice, total: itemTotal } : item
    ));
  }, []);

  // Handle line item changes
  const handleLineItemChange = useCallback((index: number, field: keyof LineItemFormData, value: string) => {
    if (field === 'quantity' || field === 'unitPrice') {
      const updatedItems = [...lineItems];
      updatedItems[index] = { ...updatedItems[index], [field]: value };

      if (field === 'quantity') {
        updateLineItemTotal(index, value, updatedItems[index].unitPrice);
      } else if (field === 'unitPrice') {
        updateLineItemTotal(index, updatedItems[index].quantity, value);
      }
    } else {
      setLineItems(prev => prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ));
    }

    // Clear field-specific errors
    const fieldKey = `lineItems.${index}.${field}`;
    if (errors[fieldKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
  }, [lineItems, errors, updateLineItemTotal]);

  // Add new line item
  const addLineItem = useCallback(() => {
    setLineItems(prev => [...prev, {
      id: generateId(),
      description: '',
      quantity: '1',
      unitPrice: '0',
      total: 0,
    }]);
  }, []);

  // Remove line item
  const removeLineItem = useCallback((index: number) => {
    if (lineItems.length > 1) {
      setLineItems(prev => prev.filter((_, i) => i !== index));

      // Clear errors for removed line item
      setErrors(prev => {
        const newErrors = { ...prev };
        Object.keys(newErrors).forEach(key => {
          if (key.startsWith(`lineItems.${index}.`)) {
            delete newErrors[key];
          }
        });
        return newErrors;
      });
    }
  }, [lineItems.length]);

  // Clear field errors on input change
  const clearFieldError = useCallback((fieldName: string) => {
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  }, [errors]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting || isLoading) return;

    // Prepare form data
    const formData: InvoiceFormData = {
      invoiceNumber: invoiceNumber.trim(),
      date: date || new Date(),
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim() || undefined,
      customerAddress: customerAddress.trim() || undefined,
      lineItems: lineItems.map(item => ({
        id: item.id,
        description: item.description.trim(),
        quantity: parseFloat(item.quantity) || 0,
        unitPrice: parseFloat(item.unitPrice) || 0,
        total: item.total,
      })),
      subtotal,
      tax: taxAmount,
      total,
      paymentStatus,
      attachments: mode === 'create' ? tempAttachments : undefined,
    };

    // Validate form data
    const validation = mode === 'create'
      ? validateInvoiceCreation(formData)
      : validateInvoiceUpdate({ ...formData, id: initialData?.id || '' });

    if (!validation.success) {
      setErrors(formatErrorsForForm(validation.errors));
      return;
    }

    // For edit mode, show confirmation modal
    if (mode === 'edit') {
      setPendingFormData(formData);
      setShowConfirmModal(true);
      return;
    }

    // For create mode, submit directly
    await submitForm(formData);
  }, [
    isSubmitting, isLoading, invoiceNumber, date, customerName, customerEmail,
    customerAddress, lineItems, subtotal, taxAmount, total, paymentStatus,
    mode, initialData?.id, tempAttachments
  ]);

  // Actually submit the form
  const submitForm = useCallback(async (formData: InvoiceFormData) => {
    setIsSubmitting(true);
    setErrors({});

    try {
      await onSubmit(formData);

      // Show success toast
      addToast({
        type: 'success',
        title: mode === 'create' ? 'Invoice Created' : 'Invoice Updated',
        message: `Invoice ${formData.invoiceNumber} has been ${mode === 'create' ? 'created' : 'updated'} successfully.`,
      });
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'An error occurred while saving the invoice'
      });

      // Show error toast
      addToast({
        type: 'error',
        title: mode === 'create' ? 'Creation Failed' : 'Update Failed',
        message: error instanceof Error ? error.message : 'An error occurred while saving the invoice',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, mode, addToast]);

  // Handle confirmed submission
  const handleConfirmSubmit = useCallback(async () => {
    if (pendingFormData) {
      setShowConfirmModal(false);
      await submitForm(pendingFormData);
      setPendingFormData(null);
    }
  }, [pendingFormData, submitForm]);

  // Handle cancel confirmation
  const handleCancelClick = useCallback(() => {
    if (onCancel) {
      setShowCancelModal(true);
    }
  }, [onCancel]);

  const handleConfirmCancel = useCallback(() => {
    setShowCancelModal(false);
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  // Auto-calculate totals when line items or tax change
  useEffect(() => {
    // Totals are calculated in render, no need for additional effect
  }, [lineItems, tax]);

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Invoice Details */}
      <FormGroup title="Invoice Details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            name="invoiceNumber"
            label="Invoice Number"
            value={invoiceNumber}
            onChange={(e) => {
              setInvoiceNumber(e.target.value);
              clearFieldError('invoiceNumber');
            }}
            error={errors.invoiceNumber}
            required
            placeholder="INV-001"
            disabled={isLoading || isSubmitting}
          />

          <DatePicker
            date={date}
            onDateChange={setDate}
            label="Invoice Date"
            error={errors.date}
            required
            disabled={isLoading || isSubmitting}
            name="date"
          />
        </div>

        <ShadcnFormSelect
          name="paymentStatus"
          label="Payment Status"
          value={paymentStatus}
          onValueChange={(value) => {
            setPaymentStatus(value as PaymentStatus);
            clearFieldError('paymentStatus');
          }}
          options={paymentStatusOptions}
          error={errors.paymentStatus}
          required
          disabled={isLoading || isSubmitting}
          placeholder="Select payment status"
        />
      </FormGroup>

      {/* Customer Information */}
      <FormGroup title="Customer Information">
        <FormInput
          name="customerName"
          label="Customer Name"
          value={customerName}
          onChange={(e) => {
            setCustomerName(e.target.value);
            clearFieldError('customerName');
          }}
          error={errors.customerName}
          required
          placeholder="John Doe"
          disabled={isLoading || isSubmitting}
        />

        <FormInput
          name="customerEmail"
          label="Customer Email"
          type="email"
          value={customerEmail}
          onChange={(e) => {
            setCustomerEmail(e.target.value);
            clearFieldError('customerEmail');
          }}
          error={errors.customerEmail}
          placeholder="john@example.com"
          disabled={isLoading || isSubmitting}
        />

        <FormInput
          name="customerAddress"
          label="Customer Address"
          value={customerAddress}
          onChange={(e) => {
            setCustomerAddress(e.target.value);
            clearFieldError('customerAddress');
          }}
          error={errors.customerAddress}
          placeholder="123 Main St, City, State 12345"
          disabled={isLoading || isSubmitting}
        />
      </FormGroup>

      {/* Line Items */}
      <FormGroup
        title="Line Items"
        description="Add items to this invoice"
        error={errors.lineItems}
      >
        <div className="space-y-4">
          {lineItems.map((item, index) => (
            <div key={item.id} className="rounded-lg border border-gray-200 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">
                  Item {index + 1}
                </h4>
                {lineItems.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLineItem(index)}
                    disabled={isLoading || isSubmitting}
                    className="text-red-600 hover:text-red-700 min-h-[44px] sm:min-h-[32px] touch-manipulation"
                  >
                    Remove
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-2">
                  <FormInput
                    name={`lineItems.${index}.description`}
                    label="Description"
                    value={item.description}
                    onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                    error={errors[`lineItems.${index}.description`]}
                    required
                    placeholder="Product or service description"
                    disabled={isLoading || isSubmitting}
                  />
                </div>

                <FormInput
                  name={`lineItems.${index}.quantity`}
                  label="Quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                  error={errors[`lineItems.${index}.quantity`]}
                  required
                  disabled={isLoading || isSubmitting}
                />

                <FormInput
                  name={`lineItems.${index}.unitPrice`}
                  label="Unit Price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) => handleLineItemChange(index, 'unitPrice', e.target.value)}
                  error={errors[`lineItems.${index}.unitPrice`]}
                  required
                  disabled={isLoading || isSubmitting}
                />
              </div>

              <div className="mt-4 text-right">
                <span className="text-sm font-medium text-gray-900">
                  Total: {formatCurrency(item.total)}
                </span>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addLineItem}
            disabled={isLoading || isSubmitting}
            className="w-full min-h-[44px] sm:min-h-[40px] touch-manipulation"
          >
            Add Line Item
          </Button>
        </div>
      </FormGroup>

      {/* Totals */}
      <FormGroup title="Totals">
        <div className="space-y-4">
          <FormInput
            name="tax"
            label="Tax Amount"
            type="number"
            min="0"
            step="0.01"
            value={tax}
            onChange={(e) => {
              setTax(e.target.value);
              clearFieldError('tax');
            }}
            error={errors.tax}
            disabled={isLoading || isSubmitting}
          />

          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <div className="space-y-2 text-sm text-gray-800">
              <div className="flex justify-between">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Tax:</span>
                <span className="font-medium text-gray-900">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-blue-200 pt-2 font-semibold">
                <span className="text-gray-800">Total:</span>
                <span className="text-gray-900">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </FormGroup>

      {/* File Attachments - Available in both create and edit modes */}
      <FormGroup
        title="File Attachment"
        description="Upload one file related to this invoice (PDF, images, documents)"
      >
        <div className="space-y-4">
          {/* Show current attachment status */}
          {((mode === 'edit' && fileAttachments && fileAttachments.stats.count > 0) || (mode === 'create' && tempAttachments.length > 0)) ? (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    File attached successfully
                  </p>
                  <p className="text-sm text-green-700">
                    You have reached the maximum of 1 file per invoice. To add a different file, please delete the current one first.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* File Upload */}
              <FileUpload
                onFilesUploaded={async (attachments) => {
                  if (mode === 'edit' && fileAttachments) {
                    // Edit mode: use the file attachments hook
                    try {
                      await fileAttachments.uploadMultipleFiles(
                        attachments.map(att => new File([att.data], att.filename, { type: att.type }))
                      );
                      addToast({
                        type: 'success',
                        title: 'File Uploaded',
                        message: 'File uploaded successfully.',
                      });
                    } catch (error) {
                      addToast({
                        type: 'error',
                        title: 'Upload Failed',
                        message: 'Failed to upload file. Please try again.',
                      });
                    }
                  } else {
                    // Create mode: directly use the FileAttachment objects
                    setTempAttachments(prev => {
                      const updated = [...prev, ...attachments];
                      return updated;
                    });
                    addToast({
                      type: 'success',
                      title: 'File Uploaded',
                      message: 'File uploaded successfully.',
                    });
                  }
                }}
                onError={(error) => {
                  addToast({
                    type: 'error',
                    title: 'Upload Failed',
                    message: error,
                  });
                }}
                maxFiles={1}
                maxSize={10 * 1024 * 1024} // 10MB
                allowedTypes={[
                  'application/pdf',
                  'image/jpeg',
                  'image/png',
                  'image/gif',
                  'application/msword',
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  'text/plain',
                  'application/vnd.ms-excel',
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                ]}
                disabled={isLoading || isSubmitting}
              />

              {/* Upload instructions */}
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-4 w-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-2">
                    <p className="text-xs text-blue-700">
                      <strong>One file per invoice:</strong> You can upload one file up to 10MB. Supported formats include PDF, images, Word documents, Excel files, and text files.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Enhanced Attachment List */}
          <AttachmentList
            attachments={mode === 'edit' && fileAttachments ? fileAttachments.attachments : tempAttachments}
            onDelete={async (id) => {
              if (mode === 'edit' && fileAttachments) {
                // Edit mode: use the file attachments hook
                try {
                  fileAttachments.deleteAttachment(id);
                  addToast({
                    type: 'success',
                    title: 'File Deleted',
                    message: 'File has been successfully deleted.',
                  });
                } catch (error) {
                  addToast({
                    type: 'error',
                    title: 'Deletion Failed',
                    message: 'Failed to delete file. Please try again.',
                  });
                }
              } else {
                // Create mode: handle temporary attachments
                handleTempFileDelete(id);
              }
            }}
            onDownload={async (attachment) => {
              if (mode === 'edit' && fileAttachments) {
                // Edit mode: use the file attachments hook
                try {
                  await fileAttachments.downloadAttachment(attachment.id);
                } catch (error) {
                  addToast({
                    type: 'error',
                    title: 'Download Failed',
                    message: 'Failed to download file. Please try again.',
                  });
                }
              } else {
                // Create mode: handle temporary attachments
                await handleTempFileDownload(attachment);
              }
            }}
            onBulkDownload={async (attachments) => {
              if (mode === 'edit' && fileAttachments) {
                // Edit mode: use the file attachments hook
                try {
                  await fileAttachments.downloadMultipleAttachments(
                    attachments.map(att => att.id)
                  );
                } catch (error) {
                  addToast({
                    type: 'error',
                    title: 'Bulk Download Failed',
                    message: 'Failed to download files. Please try again.',
                  });
                }
              } else {
                // Create mode: download individual files directly
                try {
                  for (const attachment of attachments) {
                    await handleTempFileDownload(attachment);
                  }
                } catch (error) {
                  addToast({
                    type: 'error',
                    title: 'Bulk Download Failed',
                    message: 'Failed to download files. Please try again.',
                  });
                }
              }
            }}
            showPreview={true}
            showMetadata={true}
            compact={false}
            emptyMessage="No file attached to this invoice"
            emptyDescription="Upload a document, image, or other file related to this invoice"
            showEmptyActions={true}
            onUploadClick={() => {
              // Scroll to upload area or focus file input
              const uploadElement = document.querySelector('[data-testid="file-upload"]');
              uploadElement?.scrollIntoView({ behavior: 'smooth' });
            }}
            maxDisplayCount={5}
          />
        </div>
      </FormGroup>

      {/* Form Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading || isSubmitting}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Cancel
          </Button>
        )}

        <Button
          type="submit"
          loading={isSubmitting || isLoading}
          disabled={isLoading || isSubmitting}
          className="w-full sm:w-auto order-1 sm:order-2"
        >
          {mode === 'create' ? 'Create Invoice' : 'Update Invoice'}
        </Button>
      </div>

      {/* Global form error */}
      {errors.submit && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      {/* Confirmation Modal for Updates */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setPendingFormData(null);
        }}
        onConfirm={handleConfirmSubmit}
        title="Confirm Invoice Update"
        message={`Are you sure you want to update invoice ${pendingFormData?.invoiceNumber}? This action will save all changes permanently.`}
        confirmText="Update Invoice"
        cancelText="Cancel"
        variant="info"
        loading={isSubmitting}
      />

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Changes"
        message="Are you sure you want to cancel? Any unsaved changes will be lost."
        confirmText="Yes, Cancel"
        cancelText="Continue Editing"
        variant="warning"
      />
    </form>
  );
};