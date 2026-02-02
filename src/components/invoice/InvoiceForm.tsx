import React, { useState, useCallback, useEffect } from 'react';
import { Invoice, LineItem, PaymentStatus, FileAttachment } from '@/types';
import { FormInput, FormSelect, FormGroup } from '@/components/forms';
import { Button, FileUpload, FileList, useToast } from '@/components/ui';
import { useFileAttachments } from '@/hooks';
import { generateId, calculateLineItemTotal, calculateInvoiceSubtotal, calculateInvoiceTotal } from '@/lib/utils';
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

  // File attachments hook (only for edit mode with existing invoice)
  const fileAttachments = mode === 'edit' && initialData?.id
    ? useFileAttachments(initialData.id)
    : null;
  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState(initialData?.invoiceNumber || '');
  const [date, setDate] = useState(() => {
    if (initialData?.date) {
      return initialData.date.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
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

    setIsSubmitting(true);
    setErrors({});

    try {
      // Prepare form data
      const formData: InvoiceFormData = {
        invoiceNumber: invoiceNumber.trim(),
        date: new Date(date),
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
      };

      // Validate form data
      const validation = mode === 'create'
        ? validateInvoiceCreation(formData)
        : validateInvoiceUpdate({ ...formData, id: initialData?.id || '' });

      if (!validation.success) {
        setErrors(formatErrorsForForm(validation.errors));
        return;
      }

      // Submit form
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'An error occurred while saving the invoice'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting, isLoading, invoiceNumber, date, customerName, customerEmail,
    customerAddress, lineItems, subtotal, taxAmount, total, paymentStatus,
    onSubmit, mode, initialData?.id
  ]);

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

          <FormInput
            name="date"
            label="Invoice Date"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              clearFieldError('date');
            }}
            error={errors.date}
            required
            disabled={isLoading || isSubmitting}
          />
        </div>

        <FormSelect
          name="paymentStatus"
          label="Payment Status"
          value={paymentStatus}
          onChange={(e) => {
            setPaymentStatus(e.target.value as PaymentStatus);
            clearFieldError('paymentStatus');
          }}
          options={paymentStatusOptions}
          error={errors.paymentStatus}
          required
          disabled={isLoading || isSubmitting}
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
                    className="text-red-600 hover:text-red-700"
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
                  Total: ${item.total.toFixed(2)}
                </span>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addLineItem}
            disabled={isLoading || isSubmitting}
            className="w-full"
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

          <div className="rounded-lg bg-gray-50 p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 font-medium">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </FormGroup>

      {/* File Attachments - Only show in edit mode */}
      {mode === 'edit' && fileAttachments && (
        <FormGroup
          title="File Attachments"
          description="Upload and manage files related to this invoice"
        >
          <div className="space-y-4">
            {/* File Upload */}
            <FileUpload
              onFilesUploaded={(attachments) => {
                addToast({
                  type: 'success',
                  title: 'Files Uploaded',
                  message: `${attachments.length} file(s) uploaded successfully.`,
                });
              }}
              onError={(error) => {
                addToast({
                  type: 'error',
                  title: 'Upload Failed',
                  message: error,
                });
              }}
              maxFiles={fileAttachments.constraints.remainingFiles}
              maxSize={fileAttachments.constraints.maxFileSize}
              allowedTypes={fileAttachments.constraints.allowedTypes}
              disabled={isLoading || isSubmitting || !fileAttachments.canUploadMore}
            />

            {/* File List */}
            {fileAttachments.attachments.length > 0 && (
              <FileList
                attachments={fileAttachments.attachments}
                onDelete={(id) => {
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
                }}
                onDownload={(attachment) => {
                  try {
                    fileAttachments.downloadAttachment(attachment.id);
                  } catch (error) {
                    addToast({
                      type: 'error',
                      title: 'Download Failed',
                      message: 'Failed to download file. Please try again.',
                    });
                  }
                }}
              />
            )}

            {/* Attachment Stats */}
            {fileAttachments.stats.count > 0 && (
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="text-xs text-gray-600">
                  {fileAttachments.stats.count} file(s) • {' '}
                  {(fileAttachments.stats.totalSize / (1024 * 1024)).toFixed(1)}MB used • {' '}
                  {fileAttachments.constraints.remainingFiles} slot(s) remaining
                </div>
              </div>
            )}
          </div>
        </FormGroup>
      )}

      {/* Form Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading || isSubmitting}
          >
            Cancel
          </Button>
        )}

        <Button
          type="submit"
          loading={isSubmitting || isLoading}
          disabled={isLoading || isSubmitting}
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
    </form>
  );
};