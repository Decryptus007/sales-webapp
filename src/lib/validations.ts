import { z } from 'zod';
import { PaymentStatus } from '@/types';

export const PaymentStatusSchema = z.enum(['Paid', 'Unpaid', 'Partially Paid', 'Overdue']);

export const LineItemSchema = z.object({
  id: z.string().min(1, 'Line item ID is required'),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().nonnegative('Unit price cannot be negative'),
  total: z.number().nonnegative('Total cannot be negative'),
});

export const FileAttachmentSchema = z.object({
  id: z.string().min(1, 'File ID is required'),
  filename: z.string().min(1, 'Filename is required'),
  size: z.number().positive('File size must be positive'),
  type: z.string().min(1, 'File type is required'),
  data: z.string().min(1, 'File data is required'),
  uploadedAt: z.date(),
});

export const InvoiceSchema = z.object({
  id: z.string().min(1, 'Invoice ID is required'),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  date: z.date(),
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  customerAddress: z.string().optional(),
  lineItems: z.array(LineItemSchema).min(1, 'At least one line item is required'),
  subtotal: z.number().nonnegative('Subtotal cannot be negative'),
  tax: z.number().nonnegative('Tax cannot be negative'),
  total: z.number().nonnegative('Total cannot be negative'),
  paymentStatus: PaymentStatusSchema,
  attachments: z.array(FileAttachmentSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateInvoiceSchema = InvoiceSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  attachments: true,
});

export const UpdateInvoiceSchema = CreateInvoiceSchema.partial().extend({
  id: z.string().min(1, 'Invoice ID is required'),
});

export const FilterCriteriaSchema = z.object({
  dateRange: z.object({
    startDate: z.date().optional(),
    endDate: z.date().optional(),
  }).optional(),
  paymentStatuses: z.array(PaymentStatusSchema).optional(),
});

// File upload validation
export const FileUploadSchema = z.object({
  file: z.instanceof(File),
  maxSize: z.number().default(10 * 1024 * 1024), // 10MB default
  allowedTypes: z.array(z.string()).default([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]),
});

export type InvoiceFormData = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoiceFormData = z.infer<typeof UpdateInvoiceSchema>;
export type FilterFormData = z.infer<typeof FilterCriteriaSchema>;