# Design Document: Sales Invoice Management System

## Overview

The Sales Invoice Management System is a modern web application built with React and Next.js that provides comprehensive CRUD operations for managing sales invoices. The system features a responsive design using Tailwind CSS, client-side state management, and file attachment capabilities. The architecture emphasizes component reusability, type safety with TypeScript, and comprehensive testing through both unit tests and property-based testing.

The application follows a client-side architecture with local storage persistence, making it suitable for single-user scenarios or as a foundation for future backend integration. The design prioritizes user experience with real-time validation, responsive layouts, and clear feedback mechanisms.

## Architecture

### High-Level Architecture

The system follows a layered client-side architecture:

```
┌─────────────────────────────────────────┐
│              UI Layer                   │
│  (React Components + Tailwind CSS)     │
├─────────────────────────────────────────┤
│           Business Logic Layer          │
│     (Custom Hooks + Utility Functions) │
├─────────────────────────────────────────┤
│            Data Layer                   │
│  (Local Storage + File System APIs)    │
└─────────────────────────────────────────┘
```

### Technology Stack

- **Frontend Framework**: Next.js 16 with App Router and React 19
- **UI Library**: React 19 with TypeScript
- **Styling**: Tailwind CSS v4 for responsive design
- **State Management**: React hooks (useState, useReducer, useContext)
- **Data Persistence**: Browser localStorage for invoice data
- **File Storage**: Browser File System Access API with localStorage fallback
- **Form Handling**: React Hook Form with Zod validation
- **Testing**: Jest + React Testing Library + fast-check for property-based testing

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Invoice list page
│   ├── create/page.tsx    # Create invoice page
│   └── edit/[id]/page.tsx # Edit invoice page
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── forms/            # Form components
│   ├── invoice/          # Invoice-specific components
│   └── layout/           # Layout components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and configurations
├── types/                # TypeScript type definitions
└── __tests__/            # Test files
```

## Components and Interfaces

### Core Data Models

```typescript
interface Invoice {
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

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface FileAttachment {
  id: string;
  filename: string;
  size: number;
  type: string;
  data: string; // Base64 encoded file data
  uploadedAt: Date;
}

type PaymentStatus = 'Paid' | 'Unpaid' | 'Partially Paid' | 'Overdue';

interface FilterCriteria {
  dateRange?: {
    startDate?: Date;
    endDate?: Date;
  };
  paymentStatuses?: PaymentStatus[];
}
```

### Component Architecture

#### Core Components

**InvoiceList Component**
- Displays paginated list of invoices
- Integrates filtering controls
- Handles responsive layout (table on desktop, cards on mobile)
- Manages selection and bulk operations

**InvoiceForm Component**
- Handles both create and edit modes
- Real-time validation with Zod schemas
- Dynamic line item management
- File upload integration

**FilterPanel Component**
- Date range picker with validation
- Multi-select payment status filter
- Clear filters functionality
- Responsive collapsible design

**FileUpload Component**
- Drag-and-drop file upload
- File type and size validation
- Progress indicators
- Preview capabilities for images

#### UI Components

**Button, Input, Select, Modal, Toast** - Base UI components built with Tailwind CSS and following accessibility best practices.

### Custom Hooks

```typescript
// Invoice data management
const useInvoices = () => {
  // CRUD operations, filtering, sorting
  // Returns: invoices, createInvoice, updateInvoice, deleteInvoice, filterInvoices
}

// File attachment management
const useFileAttachments = (invoiceId: string) => {
  // File upload, download, deletion
  // Returns: attachments, uploadFile, deleteFile, downloadFile
}

// Form validation and submission
const useInvoiceForm = (initialData?: Invoice) => {
  // Form state, validation, submission
  // Returns: form methods, validation errors, submit handler
}

// Local storage persistence
const useLocalStorage = <T>(key: string, defaultValue: T) => {
  // Persistent state management
  // Returns: [value, setValue] with localStorage sync
}
```

## Data Models

### Invoice Data Structure

The invoice model represents the core business entity with comprehensive metadata:

- **Identification**: Unique ID and human-readable invoice number
- **Customer Information**: Name, email, and address fields
- **Financial Data**: Line items with automatic calculation of subtotals, tax, and totals
- **Status Tracking**: Payment status with predefined enum values
- **Timestamps**: Creation and modification tracking
- **Attachments**: Associated files with metadata

### Data Validation Schema

```typescript
const InvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  date: z.date(),
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email().optional(),
  lineItems: z.array(LineItemSchema).min(1, "At least one line item required"),
  paymentStatus: z.enum(['Paid', 'Unpaid', 'Partially Paid', 'Overdue']),
});

const LineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unitPrice: z.number().nonnegative("Unit price cannot be negative"),
});
```

### Storage Strategy

**Invoice Data**: Stored in localStorage as JSON with automatic serialization/deserialization of dates and complex objects.

**File Attachments**: Stored as base64-encoded strings within the invoice record, with size limits enforced to prevent localStorage quota issues.

**Data Integrity**: Validation occurs at multiple layers - form input, before storage, and after retrieval to ensure data consistency.
## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, I've identified several categories of properties that can be combined for more comprehensive testing:

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated:
- Invoice creation validation (1.2, 1.5) can be combined into comprehensive input validation
- Date filtering properties (3.1, 3.2, 3.3) can be combined into comprehensive date range filtering
- Update validation (5.2, 5.5) can be combined with creation validation as they use the same rules
- File validation properties (7.2, 7.3, 7.4, 7.5) can be combined into comprehensive file validation
- Persistence properties (12.1, 12.3) can be combined as they test the same persistence mechanism

### Core Properties

**Property 1: Invoice CRUD Operations Preserve Data Integrity**
*For any* valid invoice data, creating an invoice and then retrieving it should return an invoice with identical data, and updating that invoice should preserve all unchanged fields while updating only the specified fields.
**Validates: Requirements 1.1, 5.1, 5.3, 5.4**

**Property 2: Input Validation Consistency**
*For any* invoice data missing required fields (invoice number, date, customer name, line items, payment status) or containing invalid values, both creation and update operations should reject the data and display appropriate validation errors.
**Validates: Requirements 1.2, 1.5, 5.2, 5.5**

**Property 3: Unique Identifier Assignment**
*For any* set of invoices created in sequence, all invoice IDs should be unique and creation timestamps should be properly assigned.
**Validates: Requirements 1.3, 1.4**

**Property 4: Invoice List Display Completeness**
*For any* collection of invoices in the system, the invoice list should display all invoices with their key information (invoice number, date, customer name, total amount, payment status) visible.
**Validates: Requirements 2.1, 2.2**

**Property 5: Date Range Filtering Accuracy**
*For any* collection of invoices and any date range filter (start date, end date, or both), the filtered results should contain only invoices with dates within the specified range, and clearing filters should restore the complete list.
**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

**Property 6: Payment Status Filtering Accuracy**
*For any* collection of invoices and any combination of payment status filters, the filtered results should contain only invoices matching the selected statuses, and clearing filters should restore the complete list.
**Validates: Requirements 4.1, 4.2, 4.3**

**Property 7: Combined Filter Logic**
*For any* collection of invoices with both date range and payment status filters active, the results should contain only invoices that match both criteria simultaneously.
**Validates: Requirements 4.4**

**Property 8: Invoice Deletion with Cascade**
*For any* invoice with attachments, deleting the invoice should remove both the invoice record and all associated file attachments from the system, and the invoice should no longer appear in any lists.
**Validates: Requirements 6.1, 6.2, 6.4**

**Property 9: File Upload and Association**
*For any* valid file within size and type constraints, uploading it to an invoice should store the file with correct metadata (filename, size, type) and associate it with the correct invoice.
**Validates: Requirements 7.1, 7.4**

**Property 10: File Validation and Rejection**
*For any* file that exceeds the 10MB size limit or has an unsupported file type, the upload should be rejected with appropriate error messages.
**Validates: Requirements 7.2, 7.3, 7.5**

**Property 11: File Download Integrity**
*For any* file attachment, downloading it should preserve the original filename and file content exactly as uploaded.
**Validates: Requirements 8.2, 8.4**

**Property 12: Attachment Display Completeness**
*For any* invoice with attachments, viewing the invoice should display all attached files with their names and sizes correctly.
**Validates: Requirements 8.1**

**Property 13: Attachment Deletion**
*For any* file attachment, deleting it should remove the file from both the invoice's attachment list and from storage, and the attachment should no longer appear in the attachment list.
**Validates: Requirements 9.1, 9.2, 9.4**

**Property 14: Form Validation Feedback**
*For any* invalid form submission, the system should display specific error messages for each invalid field while preserving all user input data.
**Validates: Requirements 11.1, 11.5**

**Property 15: Success and Error Messaging**
*For any* successful operation, the system should display appropriate success confirmation, and for any failed operation, the system should display user-friendly error messages.
**Validates: Requirements 11.2, 11.3**

**Property 16: Data Persistence Across Sessions**
*For any* invoice or file data created or updated, the data should be immediately persisted and remain available after page reloads or browser session restarts.
**Validates: Requirements 12.1, 12.2, 12.3, 12.4**

## Error Handling

### Client-Side Error Handling

**Form Validation Errors**
- Real-time validation with immediate feedback
- Field-level error messages with specific guidance
- Form submission prevention until all errors resolved
- Preservation of user input during validation failures

**File Upload Errors**
- File type validation with supported format list
- File size validation with clear size limits
- Upload progress indication with error recovery
- Graceful handling of browser API limitations

**Data Persistence Errors**
- localStorage quota exceeded handling
- Data corruption detection and recovery
- Automatic retry mechanisms for transient failures
- User notification of persistent storage issues

### Error Recovery Strategies

**Graceful Degradation**
- Fallback to basic functionality when advanced features fail
- Progressive enhancement approach for file handling
- Offline capability with sync when connection restored

**User Feedback**
- Toast notifications for operation status
- Loading states during async operations
- Clear error messages with actionable guidance
- Confirmation dialogs for destructive operations

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit testing and property-based testing to ensure comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points between components. These tests verify concrete scenarios and ensure components work correctly in isolation.

**Property Tests**: Verify universal properties across all possible inputs using randomized test data. These tests catch edge cases that might be missed by example-based testing and ensure the system behaves correctly across the full input space.

### Property-Based Testing Configuration

**Testing Library**: fast-check for JavaScript/TypeScript property-based testing
**Test Configuration**: Minimum 100 iterations per property test to ensure adequate coverage through randomization
**Test Tagging**: Each property test must include a comment referencing its design document property

Example test structure:
```typescript
// Feature: sales-invoice-management, Property 1: Invoice CRUD Operations Preserve Data Integrity
test('invoice creation and retrieval preserves data integrity', () => {
  fc.assert(fc.property(
    invoiceArbitrary,
    (invoiceData) => {
      const created = createInvoice(invoiceData);
      const retrieved = getInvoice(created.id);
      expect(retrieved).toEqual(created);
    }
  ), { numRuns: 100 });
});
```

### Unit Testing Focus Areas

**Component Integration**
- Form submission workflows
- Filter interaction with invoice list
- File upload integration with invoice forms
- Navigation between create/edit/list views

**Edge Cases and Error Conditions**
- Empty invoice lists
- Invoices without attachments
- Invalid date inputs
- Browser storage limitations
- File upload failures

**User Interface Behavior**
- Responsive layout adaptations
- Loading states and transitions
- Form validation feedback timing
- Success/error message display

### Test Data Generation

**Property Test Generators**
- Invoice data with realistic constraints
- File data with various types and sizes
- Date ranges with edge cases
- Filter combinations
- Invalid input variations

**Mock Data for Unit Tests**
- Predefined invoice examples
- Sample file attachments
- Error scenarios
- Browser API mocks

The combination of unit tests and property tests ensures both concrete functionality verification and comprehensive input space coverage, providing confidence in system correctness across all usage scenarios.