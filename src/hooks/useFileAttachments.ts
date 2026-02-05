import { useState, useCallback, useMemo } from 'react';
import { FileAttachment } from '@/types';
import {
  uploadFile,
  uploadMultipleFiles,
  downloadFile,
  validateFiles,
  checkStorageLimit,
  FileUploadOptions,
  FileUploadResult
} from '@/lib/fileUtils';
import { useInvoices } from './useInvoices';

// Custom error types for file attachment operations
export class FileAttachmentError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'FileAttachmentError';
  }
}

export class FileNotFoundError extends FileAttachmentError {
  constructor(id: string) {
    super(`File attachment with ID "${id}" not found`);
    this.name = 'FileNotFoundError';
  }
}

export class StorageLimitError extends FileAttachmentError {
  constructor(message: string) {
    super(message);
    this.name = 'StorageLimitError';
  }
}

export interface FileUploadProgress {
  fileId: string;
  filename: string;
  progress: number;
  status: 'uploading' | 'completed' | 'failed';
  error?: string;
}

export interface UseFileAttachmentsOptions {
  maxFiles?: number;
  maxFileSize?: number;
  maxTotalSize?: number;
  allowedTypes?: string[];
}

/**
 * Custom hook for managing file attachments for a specific invoice
 * Provides upload, download, delete operations with progress tracking
 */
export function useFileAttachments(
  invoiceId: string,
  options: UseFileAttachmentsOptions = {}
) {
  const {
    maxFiles = 1, // Changed from 20 to 1
    maxFileSize = 10 * 1024 * 1024, // 10MB
    maxTotalSize = 50 * 1024 * 1024, // 50MB
    allowedTypes
  } = options;

  const { getInvoice, updateInvoice, invoices } = useInvoices();
  const [operationError, setOperationError] = useState<FileAttachmentError | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, FileUploadProgress>>({});
  const [isUploading, setIsUploading] = useState(false);

  // Get current invoice and its attachments - include invoices in dependencies to react to changes
  const invoice = useMemo(() => getInvoice(invoiceId), [getInvoice, invoiceId, invoices]);
  const attachments = useMemo(() => invoice?.attachments || [], [invoice]);

  // Clear operation errors
  const clearError = useCallback(() => {
    setOperationError(null);
  }, []);

  /**
   * Upload a single file to the invoice
   */
  const uploadSingleFile = useCallback(async (
    file: File,
    uploadOptions: FileUploadOptions = {}
  ): Promise<FileAttachment | null> => {
    try {
      setOperationError(null);

      if (!invoice) {
        throw new FileAttachmentError(`Invoice with ID "${invoiceId}" not found`);
      }

      // Check file count limit
      if (attachments.length >= maxFiles) {
        throw new FileAttachmentError(`Cannot exceed ${maxFiles} attachments per invoice`);
      }

      // Check storage limit
      const storageCheck = checkStorageLimit(attachments, [file], maxTotalSize);
      if (!storageCheck.withinLimit) {
        throw new StorageLimitError(
          `Adding this file would exceed the storage limit of ${Math.round(maxTotalSize / (1024 * 1024))}MB`
        );
      }

      // Set up progress tracking
      const progressId = `${file.name}-${Date.now()}`;
      setUploadProgress(prev => ({
        ...prev,
        [progressId]: {
          fileId: progressId,
          filename: file.name,
          progress: 0,
          status: 'uploading',
        }
      }));

      setIsUploading(true);

      // Upload file with progress tracking
      const result = await uploadFile(file, {
        maxSize: maxFileSize,
        allowedTypes,
        onProgress: (progress) => {
          setUploadProgress(prev => ({
            ...prev,
            [progressId]: {
              ...prev[progressId],
              progress: progress.percentage,
            }
          }));
        },
        ...uploadOptions,
      });

      if (!result.success || !result.attachment) {
        setUploadProgress(prev => ({
          ...prev,
          [progressId]: {
            ...prev[progressId],
            status: 'failed',
            error: result.error,
          }
        }));
        throw new FileAttachmentError(result.error || 'File upload failed');
      }

      // Update invoice with new attachment
      const updatedInvoice = updateInvoice(invoiceId, {
        attachments: [...attachments, result.attachment],
      });

      // Mark upload as completed
      setUploadProgress(prev => ({
        ...prev,
        [progressId]: {
          ...prev[progressId],
          status: 'completed',
          progress: 100,
        }
      }));

      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress(prev => {
          const { [progressId]: _, ...rest } = prev;
          return rest;
        });
      }, 2000);

      return result.attachment;
    } catch (error) {
      const fileError = error instanceof FileAttachmentError
        ? error
        : new FileAttachmentError('Failed to upload file', error as Error);

      setOperationError(fileError);
      throw fileError;
    } finally {
      setIsUploading(false);
    }
  }, [invoice, invoiceId, attachments, maxFiles, maxTotalSize, maxFileSize, allowedTypes, updateInvoice]);

  /**
   * Upload multiple files to the invoice
   */
  const uploadMultipleFilesToInvoice = useCallback(async (
    files: File[],
    uploadOptions: FileUploadOptions = {}
  ): Promise<{
    successful: FileAttachment[];
    failed: Array<{ file: File; error: string }>;
  }> => {
    try {
      setOperationError(null);

      if (!invoice) {
        throw new FileAttachmentError(`Invoice with ID "${invoiceId}" not found`);
      }

      // Validate files first
      const validation = validateFiles(files, {
        maxSize: maxFileSize,
        allowedTypes,
      });

      if (!validation.success) {
        throw new FileAttachmentError(validation.errors[0]?.message || 'File validation failed');
      }

      // Check file count limit
      if (attachments.length + files.length > maxFiles) {
        throw new FileAttachmentError(
          `Cannot exceed ${maxFiles} attachments per invoice. Current: ${attachments.length}, Trying to add: ${files.length}`
        );
      }

      // Check storage limit
      const storageCheck = checkStorageLimit(attachments, files, maxTotalSize);
      if (!storageCheck.withinLimit) {
        throw new StorageLimitError(
          `Adding these files would exceed the storage limit of ${Math.round(maxTotalSize / (1024 * 1024))}MB`
        );
      }

      setIsUploading(true);

      // Set up progress tracking for all files
      const progressIds = files.map(file => `${file.name}-${Date.now()}-${Math.random()}`);
      const initialProgress: Record<string, FileUploadProgress> = {};

      files.forEach((file, index) => {
        initialProgress[progressIds[index]] = {
          fileId: progressIds[index],
          filename: file.name,
          progress: 0,
          status: 'uploading',
        };
      });

      setUploadProgress(prev => ({ ...prev, ...initialProgress }));

      // Upload files
      const result = await uploadMultipleFiles(files, {
        maxSize: maxFileSize,
        allowedTypes,
        onProgress: (progress) => {
          // Note: This is a simplified progress tracking
          // In a real implementation, you might want per-file progress
        },
        ...uploadOptions,
      });

      // Update progress for successful uploads
      result.successful.forEach((_, index) => {
        const progressId = progressIds[index];
        setUploadProgress(prev => ({
          ...prev,
          [progressId]: {
            ...prev[progressId],
            status: 'completed',
            progress: 100,
          }
        }));
      });

      // Update progress for failed uploads
      result.failed.forEach(({ file }) => {
        const fileIndex = files.findIndex(f => f === file);
        if (fileIndex !== -1) {
          const progressId = progressIds[fileIndex];
          setUploadProgress(prev => ({
            ...prev,
            [progressId]: {
              ...prev[progressId],
              status: 'failed',
              error: 'Upload failed',
            }
          }));
        }
      });

      // Update invoice with successful attachments
      if (result.successful.length > 0) {
        updateInvoice(invoiceId, {
          attachments: [...attachments, ...result.successful],
        });
      }

      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          progressIds.forEach(id => delete newProgress[id]);
          return newProgress;
        });
      }, 3000);

      return result;
    } catch (error) {
      const fileError = error instanceof FileAttachmentError
        ? error
        : new FileAttachmentError('Failed to upload files', error as Error);

      setOperationError(fileError);
      throw fileError;
    } finally {
      setIsUploading(false);
    }
  }, [invoice, invoiceId, attachments, maxFiles, maxTotalSize, maxFileSize, allowedTypes, updateInvoice]);

  /**
   * Delete a file attachment from the invoice
   */
  const deleteAttachment = useCallback((attachmentId: string): boolean => {
    try {
      setOperationError(null);

      if (!invoice) {
        throw new FileAttachmentError(`Invoice with ID "${invoiceId}" not found`);
      }

      const attachmentExists = attachments.find(att => att.id === attachmentId);
      if (!attachmentExists) {
        throw new FileNotFoundError(attachmentId);
      }

      // Remove attachment from invoice
      const updatedAttachments = attachments.filter(att => att.id !== attachmentId);
      updateInvoice(invoiceId, {
        attachments: updatedAttachments,
      });

      return true;
    } catch (error) {
      const fileError = error instanceof FileAttachmentError
        ? error
        : new FileAttachmentError('Failed to delete attachment', error as Error);

      setOperationError(fileError);
      throw fileError;
    }
  }, [invoice, invoiceId, attachments, updateInvoice]);

  /**
   * Download a file attachment with progress tracking and error handling
   */
  const downloadAttachment = useCallback(async (
    attachmentId: string,
    options: { onProgress?: (progress: any) => void; onError?: (error: Error) => void } = {}
  ): Promise<void> => {
    try {
      setOperationError(null);

      const attachment = attachments.find(att => att.id === attachmentId);
      if (!attachment) {
        throw new FileNotFoundError(attachmentId);
      }

      await downloadFile(attachment, {
        onProgress: options.onProgress,
        onError: (error) => {
          const fileError = new FileAttachmentError('Failed to download attachment', error);
          setOperationError(fileError);
          options.onError?.(fileError);
        },
        onSuccess: () => {
          // Download completed successfully
        },
        sanitizeFilename: true,
      });
    } catch (error) {
      const fileError = error instanceof FileAttachmentError
        ? error
        : new FileAttachmentError('Failed to download attachment', error as Error);

      setOperationError(fileError);
      throw fileError;
    }
  }, [attachments]);

  /**
   * Download multiple attachments
   */
  const downloadMultipleAttachments = useCallback(async (
    attachmentIds: string[],
    options: { onProgress?: (progress: any) => void; onError?: (error: Error) => void } = {}
  ): Promise<{ successful: number; failed: Array<{ attachmentId: string; error: string }> }> => {
    try {
      setOperationError(null);

      const attachmentsToDownload = attachments.filter(att => attachmentIds.includes(att.id));

      if (attachmentsToDownload.length === 0) {
        throw new FileAttachmentError('No valid attachments found for download');
      }

      const { downloadMultipleFiles } = await import('@/lib/fileUtils');
      const result = await downloadMultipleFiles(attachmentsToDownload, {
        onProgress: options.onProgress,
        onError: options.onError,
      });

      return {
        successful: result.successful,
        failed: result.failed.map(f => ({
          attachmentId: f.attachment.id,
          error: f.error
        }))
      };
    } catch (error) {
      const fileError = error instanceof FileAttachmentError
        ? error
        : new FileAttachmentError('Failed to download attachments', error as Error);

      setOperationError(fileError);
      throw fileError;
    }
  }, [attachments]);

  /**
   * Get attachment by ID
   */
  const getAttachment = useCallback((attachmentId: string): FileAttachment | null => {
    try {
      setOperationError(null);
      return attachments.find(att => att.id === attachmentId) || null;
    } catch (error) {
      const fileError = new FileAttachmentError('Failed to get attachment', error as Error);
      setOperationError(fileError);
      return null;
    }
  }, [attachments]);

  /**
   * Bulk delete attachments
   */
  const bulkDeleteAttachments = useCallback((attachmentIds: string[]): number => {
    try {
      setOperationError(null);

      if (!invoice) {
        throw new FileAttachmentError(`Invoice with ID "${invoiceId}" not found`);
      }

      const initialCount = attachments.length;
      const updatedAttachments = attachments.filter(att => !attachmentIds.includes(att.id));

      updateInvoice(invoiceId, {
        attachments: updatedAttachments,
      });

      return initialCount - updatedAttachments.length;
    } catch (error) {
      const fileError = error instanceof FileAttachmentError
        ? error
        : new FileAttachmentError('Failed to bulk delete attachments', error as Error);

      setOperationError(fileError);
      throw fileError;
    }
  }, [invoice, invoiceId, attachments, updateInvoice]);

  /**
   * Get attachment statistics
   */
  const attachmentStats = useMemo(() => {
    try {
      const totalSize = attachments.reduce((sum, att) => sum + att.size, 0);
      const typeCount = attachments.reduce((acc, att) => {
        const type = att.type;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        count: attachments.length,
        totalSize,
        averageSize: attachments.length > 0 ? totalSize / attachments.length : 0,
        typeCount,
        remainingSlots: maxFiles - attachments.length,
        storageUsed: (totalSize / maxTotalSize) * 100,
      };
    } catch (error) {
      console.error('Failed to calculate attachment stats:', error);
      return {
        count: 0,
        totalSize: 0,
        averageSize: 0,
        typeCount: {},
        remainingSlots: maxFiles,
        storageUsed: 0,
      };
    }
  }, [attachments, maxFiles, maxTotalSize]);

  /**
   * Check if more files can be uploaded
   */
  const canUploadMore = useMemo(() => {
    return attachments.length < maxFiles;
  }, [attachments.length, maxFiles]);

  /**
   * Get upload constraints for UI display
   */
  const uploadConstraints = useMemo(() => {
    return {
      maxFiles,
      maxFileSize,
      maxTotalSize,
      allowedTypes: allowedTypes || [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
      remainingFiles: maxFiles - attachments.length,
      remainingStorage: maxTotalSize - attachmentStats.totalSize,
    };
  }, [maxFiles, maxFileSize, maxTotalSize, allowedTypes, attachments.length, attachmentStats.totalSize]);

  return {
    // Data
    attachments,
    stats: attachmentStats,
    constraints: uploadConstraints,

    // State
    isUploading,
    uploadProgress: Object.values(uploadProgress),
    error: operationError,
    canUploadMore,

    // Operations
    uploadFile: uploadSingleFile,
    uploadMultipleFiles: uploadMultipleFilesToInvoice,
    deleteAttachment,
    downloadAttachment,
    downloadMultipleAttachments,
    getAttachment,
    bulkDeleteAttachments,

    // Utility
    clearError,
  };
}