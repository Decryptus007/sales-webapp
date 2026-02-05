import { renderHook, act } from '@testing-library/react';
import { useFileAttachments } from '../useFileAttachments';
import { useInvoices } from '../useInvoices';

// Mock the useInvoices hook
jest.mock('../useInvoices');
const mockUseInvoices = useInvoices as jest.MockedFunction<typeof useInvoices>;

// Mock file utilities
jest.mock('@/lib/fileUtils', () => ({
  uploadFile: jest.fn(),
  uploadMultipleFiles: jest.fn(),
  downloadFile: jest.fn(),
  downloadMultipleFiles: jest.fn(),
  validateFiles: jest.fn(),
  checkStorageLimit: jest.fn(),
}));

import * as fileUtils from '@/lib/fileUtils';

// Mock File constructor for testing
class MockFile extends File {
  constructor(bits: BlobPart[], name: string, options?: FilePropertyBag) {
    super(bits, name, options);
  }
}

const createTestFile = (name: string, size: number, type: string): File => {
  const content = 'a'.repeat(size);
  return new MockFile([content], name, { type });
};

const mockInvoice = {
  id: 'test-invoice-id',
  invoiceNumber: 'INV-001',
  date: new Date('2024-01-01'),
  customerName: 'John Doe',
  lineItems: [
    {
      id: '1',
      description: 'Service',
      quantity: 1,
      unitPrice: 100,
      total: 100,
    },
  ],
  subtotal: 100,
  tax: 10,
  total: 110,
  paymentStatus: 'Unpaid' as const,
  attachments: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('useFileAttachments', () => {
  const mockGetInvoice = jest.fn();
  const mockUpdateInvoice = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseInvoices.mockReturnValue({
      getInvoice: mockGetInvoice,
      updateInvoice: mockUpdateInvoice,
      invoices: [mockInvoice],
      createInvoice: jest.fn(),
      deleteInvoice: jest.fn(),
      filterInvoices: jest.fn(),
      getSortedInvoices: jest.fn(),
      searchInvoices: jest.fn(),
      bulkDeleteInvoices: jest.fn(),
      bulkUpdatePaymentStatus: jest.fn(),
      stats: {
        total: 1,
        paid: 0,
        unpaid: 1,
        partiallyPaid: 0,
        overdue: 0,
        totalAmount: 110,
        paidAmount: 0,
        unpaidAmount: 110,
      },
      isLoading: false,
      error: null,
      clearError: jest.fn(),
    });

    mockGetInvoice.mockReturnValue(mockInvoice);
  });

  describe('Initial State', () => {
    it('should initialize with empty attachments when invoice has no attachments', () => {
      const { result } = renderHook(() => useFileAttachments('test-invoice-id'));

      expect(result.current.attachments).toEqual([]);
      expect(result.current.stats.count).toBe(0);
      expect(result.current.canUploadMore).toBe(true);
      expect(result.current.isUploading).toBe(false);
    });

    it('should initialize with existing attachments', () => {
      const invoiceWithAttachments = {
        ...mockInvoice,
        attachments: [
          {
            id: 'att-1',
            filename: 'test.pdf',
            size: 1000,
            type: 'application/pdf',
            data: 'base64data',
            uploadedAt: new Date(),
          },
        ],
      };

      mockGetInvoice.mockReturnValue(invoiceWithAttachments);

      const { result } = renderHook(() => useFileAttachments('test-invoice-id'));

      expect(result.current.attachments).toHaveLength(1);
      expect(result.current.stats.count).toBe(1);
      expect(result.current.canUploadMore).toBe(false); // maxFiles is 1
    });

    it('should use custom options', () => {
      const options = {
        maxFiles: 5,
        maxFileSize: 5 * 1024 * 1024,
        maxTotalSize: 25 * 1024 * 1024,
      };

      const { result } = renderHook(() => useFileAttachments('test-invoice-id', options));

      expect(result.current.constraints.maxFiles).toBe(5);
      expect(result.current.constraints.maxFileSize).toBe(5 * 1024 * 1024);
      expect(result.current.constraints.maxTotalSize).toBe(25 * 1024 * 1024);
    });
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const mockAttachment = {
        id: 'att-1',
        filename: 'test.pdf',
        size: 1000,
        type: 'application/pdf',
        data: 'base64data',
        uploadedAt: new Date(),
      };

      (fileUtils.uploadFile as jest.Mock).mockResolvedValue({
        success: true,
        attachment: mockAttachment,
      });

      (fileUtils.checkStorageLimit as jest.Mock).mockReturnValue({
        withinLimit: true,
      });

      const { result } = renderHook(() => useFileAttachments('test-invoice-id'));

      const file = createTestFile('test.pdf', 1000, 'application/pdf');

      let uploadResult;
      await act(async () => {
        uploadResult = await result.current.uploadFile(file);
      });

      expect(uploadResult).toEqual(mockAttachment);
      expect(mockUpdateInvoice).toHaveBeenCalledWith('test-invoice-id', {
        attachments: [mockAttachment],
      });
    });

    it('should reject upload when file limit exceeded', async () => {
      const invoiceWithAttachment = {
        ...mockInvoice,
        attachments: [
          {
            id: 'att-1',
            filename: 'existing.pdf',
            size: 1000,
            type: 'application/pdf',
            data: 'base64data',
            uploadedAt: new Date(),
          },
        ],
      };

      mockGetInvoice.mockReturnValue(invoiceWithAttachment);

      const { result } = renderHook(() => useFileAttachments('test-invoice-id'));

      const file = createTestFile('test.pdf', 1000, 'application/pdf');

      await expect(
        act(async () => {
          await result.current.uploadFile(file);
        })
      ).rejects.toThrow('Cannot exceed 1 attachments per invoice');
    });

    it('should reject upload when storage limit exceeded', async () => {
      (fileUtils.checkStorageLimit as jest.Mock).mockReturnValue({
        withinLimit: false,
      });

      const { result } = renderHook(() => useFileAttachments('test-invoice-id'));

      const file = createTestFile('large.pdf', 60 * 1024 * 1024, 'application/pdf');

      await expect(
        act(async () => {
          await result.current.uploadFile(file);
        })
      ).rejects.toThrow('Adding this file would exceed the storage limit');
    });

    it('should handle upload failure', async () => {
      (fileUtils.uploadFile as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Upload failed',
      });

      (fileUtils.checkStorageLimit as jest.Mock).mockReturnValue({
        withinLimit: true,
      });

      const { result } = renderHook(() => useFileAttachments('test-invoice-id'));

      const file = createTestFile('test.pdf', 1000, 'application/pdf');

      await expect(
        act(async () => {
          await result.current.uploadFile(file);
        })
      ).rejects.toThrow('Upload failed');
    });
  });

  describe('deleteAttachment', () => {
    it('should delete attachment successfully', () => {
      const invoiceWithAttachment = {
        ...mockInvoice,
        attachments: [
          {
            id: 'att-1',
            filename: 'test.pdf',
            size: 1000,
            type: 'application/pdf',
            data: 'base64data',
            uploadedAt: new Date(),
          },
        ],
      };

      mockGetInvoice.mockReturnValue(invoiceWithAttachment);

      const { result } = renderHook(() => useFileAttachments('test-invoice-id'));

      let deleteResult;
      act(() => {
        deleteResult = result.current.deleteAttachment('att-1');
      });

      expect(deleteResult).toBe(true);
      expect(mockUpdateInvoice).toHaveBeenCalledWith('test-invoice-id', {
        attachments: [],
      });
    });

    it('should throw error for non-existent attachment', () => {
      const { result } = renderHook(() => useFileAttachments('test-invoice-id'));

      expect(() => {
        act(() => {
          result.current.deleteAttachment('non-existent-id');
        });
      }).toThrow('File attachment with ID "non-existent-id" not found');
    });

    it('should throw error when invoice not found', () => {
      mockGetInvoice.mockReturnValue(null);

      const { result } = renderHook(() => useFileAttachments('test-invoice-id'));

      expect(() => {
        act(() => {
          result.current.deleteAttachment('att-1');
        });
      }).toThrow('Invoice with ID "test-invoice-id" not found');
    });
  });

  describe('downloadAttachment', () => {
    it('should download attachment successfully', async () => {
      const attachment = {
        id: 'att-1',
        filename: 'test.pdf',
        size: 1000,
        type: 'application/pdf',
        data: 'base64data',
        uploadedAt: new Date(),
      };

      const invoiceWithAttachment = {
        ...mockInvoice,
        attachments: [attachment],
      };

      mockGetInvoice.mockReturnValue(invoiceWithAttachment);

      (fileUtils.downloadFile as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useFileAttachments('test-invoice-id'));

      await act(async () => {
        await result.current.downloadAttachment('att-1');
      });

      expect(fileUtils.downloadFile).toHaveBeenCalledWith(
        attachment,
        expect.objectContaining({
          onProgress: undefined,
          onError: expect.any(Function),
          onSuccess: expect.any(Function),
          sanitizeFilename: true,
        })
      );
    });

    it('should throw error for non-existent attachment', async () => {
      const { result } = renderHook(() => useFileAttachments('test-invoice-id'));

      await expect(
        act(async () => {
          await result.current.downloadAttachment('non-existent-id');
        })
      ).rejects.toThrow('File attachment with ID "non-existent-id" not found');
    });
  });

  describe('getAttachment', () => {
    it('should return attachment by ID', () => {
      const attachment = {
        id: 'att-1',
        filename: 'test.pdf',
        size: 1000,
        type: 'application/pdf',
        data: 'base64data',
        uploadedAt: new Date(),
      };

      const invoiceWithAttachment = {
        ...mockInvoice,
        attachments: [attachment],
      };

      mockGetInvoice.mockReturnValue(invoiceWithAttachment);

      const { result } = renderHook(() => useFileAttachments('test-invoice-id'));

      const foundAttachment = result.current.getAttachment('att-1');
      expect(foundAttachment).toEqual(attachment);
    });

    it('should return null for non-existent attachment', () => {
      const { result } = renderHook(() => useFileAttachments('test-invoice-id'));

      const foundAttachment = result.current.getAttachment('non-existent-id');
      expect(foundAttachment).toBeNull();
    });
  });

  describe('bulkDeleteAttachments', () => {
    it('should delete multiple attachments', () => {
      const attachments = [
        {
          id: 'att-1',
          filename: 'test1.pdf',
          size: 1000,
          type: 'application/pdf',
          data: 'base64data',
          uploadedAt: new Date(),
        },
        {
          id: 'att-2',
          filename: 'test2.pdf',
          size: 2000,
          type: 'application/pdf',
          data: 'base64data',
          uploadedAt: new Date(),
        },
      ];

      const invoiceWithAttachments = {
        ...mockInvoice,
        attachments,
      };

      mockGetInvoice.mockReturnValue(invoiceWithAttachments);

      const { result } = renderHook(() => useFileAttachments('test-invoice-id', { maxFiles: 5 }));

      let deletedCount;
      act(() => {
        deletedCount = result.current.bulkDeleteAttachments(['att-1', 'att-2']);
      });

      expect(deletedCount).toBe(2);
      expect(mockUpdateInvoice).toHaveBeenCalledWith('test-invoice-id', {
        attachments: [],
      });
    });
  });

  describe('Statistics', () => {
    it('should calculate attachment statistics correctly', () => {
      const attachments = [
        {
          id: 'att-1',
          filename: 'test1.pdf',
          size: 1000,
          type: 'application/pdf',
          data: 'base64data',
          uploadedAt: new Date(),
        },
        {
          id: 'att-2',
          filename: 'test2.jpg',
          size: 2000,
          type: 'image/jpeg',
          data: 'base64data',
          uploadedAt: new Date(),
        },
      ];

      const invoiceWithAttachments = {
        ...mockInvoice,
        attachments,
      };

      mockGetInvoice.mockReturnValue(invoiceWithAttachments);

      const { result } = renderHook(() => useFileAttachments('test-invoice-id', { maxFiles: 5 }));

      const stats = result.current.stats;
      expect(stats.count).toBe(2);
      expect(stats.totalSize).toBe(3000);
      expect(stats.averageSize).toBe(1500);
      expect(stats.typeCount['application/pdf']).toBe(1);
      expect(stats.typeCount['image/jpeg']).toBe(1);
      expect(stats.remainingSlots).toBe(3);
    });
  });

  describe('Upload Constraints', () => {
    it('should provide correct upload constraints', () => {
      const options = {
        maxFiles: 3,
        maxFileSize: 5 * 1024 * 1024,
        maxTotalSize: 15 * 1024 * 1024,
      };

      const { result } = renderHook(() => useFileAttachments('test-invoice-id', options));

      const constraints = result.current.constraints;
      expect(constraints.maxFiles).toBe(3);
      expect(constraints.maxFileSize).toBe(5 * 1024 * 1024);
      expect(constraints.maxTotalSize).toBe(15 * 1024 * 1024);
      expect(constraints.remainingFiles).toBe(3);
      expect(constraints.remainingStorage).toBe(15 * 1024 * 1024);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully and set error state', async () => {
      (fileUtils.uploadFile as jest.Mock).mockRejectedValue(new Error('Network error'));

      (fileUtils.checkStorageLimit as jest.Mock).mockReturnValue({
        withinLimit: true,
      });

      const { result } = renderHook(() => useFileAttachments('test-invoice-id'));

      const file = createTestFile('test.pdf', 1000, 'application/pdf');

      await expect(
        act(async () => {
          await result.current.uploadFile(file);
        })
      ).rejects.toThrow('Failed to upload file');

      expect(result.current.error).toBeDefined();
    });

    it('should clear errors', () => {
      const { result } = renderHook(() => useFileAttachments('test-invoice-id'));

      // Simulate an error
      act(() => {
        try {
          result.current.deleteAttachment('non-existent-id');
        } catch (error) {
          // Error is expected
        }
      });

      expect(result.current.error).toBeDefined();

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});