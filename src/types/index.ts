export type PaymentStatus = 'Paid' | 'Unpaid' | 'Partially Paid' | 'Overdue';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface FileAttachment {
  id: string;
  filename: string;
  size: number;
  type: string;
  data: string; // Base64 encoded file data
  uploadedAt: Date;
}

export interface Invoice {
  id: string;
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
  attachments: FileAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FilterCriteria {
  dateRange?: {
    startDate?: Date;
    endDate?: Date;
  };
  paymentStatuses?: PaymentStatus[];
}

// Utility types for form handling
export type CreateInvoiceData = Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'attachments'>;
export type UpdateInvoiceData = Partial<CreateInvoiceData> & { id: string };

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState {
  isSubmitting: boolean;
  errors: ValidationError[];
  isDirty: boolean;
}