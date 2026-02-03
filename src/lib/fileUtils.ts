import { FileAttachment } from '@/types';
import { generateId } from './utils';
import { validateFileUpload, ValidationResult } from './validations';

export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FileUploadResult {
  success: boolean;
  attachment?: FileAttachment;
  error?: string;
}

export interface FileUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  onProgress?: (progress: FileUploadProgress) => void;
}

/**
 * Converts a File object to base64 string with progress tracking
 */
export function fileToBase64(
  file: File,
  onProgress?: (progress: FileUploadProgress) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to read file as base64'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress: FileUploadProgress = {
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100),
        };
        onProgress(progress);
      }
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Converts base64 string back to a Blob for downloading
 */
export function base64ToBlob(base64: string, type: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type });
}

/**
 * Validates and uploads a file, converting it to a FileAttachment
 */
export async function uploadFile(
  file: File,
  options: FileUploadOptions = {}
): Promise<FileUploadResult> {
  try {
    // Validate the file
    const validation = validateFileUpload(file, options.maxSize, options.allowedTypes);

    if (!validation.success) {
      return {
        success: false,
        error: validation.errors[0]?.message || 'File validation failed',
      };
    }

    // Convert to base64 with progress tracking
    const base64Data = await fileToBase64(file, options.onProgress);

    // Create FileAttachment object
    const attachment: FileAttachment = {
      id: generateId(),
      filename: file.name,
      size: file.size,
      type: file.type,
      data: base64Data,
      uploadedAt: new Date(),
    };

    return {
      success: true,
      attachment,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during file upload',
    };
  }
}

export interface FileDownloadProgress {
  loaded: number;
  total: number;
  percentage: number;
  status: 'preparing' | 'downloading' | 'completed' | 'failed';
}

export interface FileDownloadOptions {
  onProgress?: (progress: FileDownloadProgress) => void;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
  sanitizeFilename?: boolean;
}

/**
 * Sanitizes a filename to prevent security issues
 */
export function sanitizeFilename(filename: string): string {
  // Remove or replace dangerous characters
  return filename
    .replace(/[<>:"/\\|?*]/g, '_') // Replace dangerous characters with underscore
    .replace(/\.\./g, '_') // Replace double dots
    .replace(/^\./, '_') // Replace leading dot
    .trim()
    .substring(0, 255); // Limit length
}

/**
 * Downloads a file attachment by creating a temporary download link with enhanced security and progress tracking
 */
export function downloadFile(
  attachment: FileAttachment,
  options: FileDownloadOptions = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const { onProgress, onError, onSuccess, sanitizeFilename: shouldSanitize = true } = options;

      // Report preparation phase
      onProgress?.({
        loaded: 0,
        total: attachment.size,
        percentage: 0,
        status: 'preparing'
      });

      // Validate attachment data
      if (!attachment.data || !attachment.filename) {
        const error = new Error('Invalid attachment data');
        onError?.(error);
        reject(error);
        return;
      }

      // Sanitize filename for security
      const safeFilename = shouldSanitize
        ? sanitizeFilename(attachment.filename)
        : attachment.filename;

      // Report download start
      onProgress?.({
        loaded: 0,
        total: attachment.size,
        percentage: 0,
        status: 'downloading'
      });

      // Convert base64 to blob
      const blob = base64ToBlob(attachment.data, attachment.type);

      // Verify blob size matches expected size
      if (Math.abs(blob.size - attachment.size) > attachment.size * 0.1) {
        console.warn('Downloaded file size differs from expected size');
      }

      // Create download URL
      const url = URL.createObjectURL(blob);

      // Create and configure download link
      const link = document.createElement('a');
      link.href = url;
      link.download = safeFilename;
      link.style.display = 'none';

      // Add to DOM temporarily
      document.body.appendChild(link);

      // Set up cleanup function
      const cleanup = () => {
        try {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } catch (cleanupError) {
          console.warn('Cleanup error:', cleanupError);
        }
      };

      // Handle download completion
      const handleDownloadComplete = () => {
        onProgress?.({
          loaded: attachment.size,
          total: attachment.size,
          percentage: 100,
          status: 'completed'
        });

        onSuccess?.();
        cleanup();
        resolve();
      };

      // Handle download error
      const handleDownloadError = (error: Error) => {
        onProgress?.({
          loaded: 0,
          total: attachment.size,
          percentage: 0,
          status: 'failed'
        });

        onError?.(error);
        cleanup();
        reject(error);
      };

      // Simulate progress for user feedback (since we can't track actual download progress)
      let progressInterval: NodeJS.Timeout | null = null;
      let currentProgress = 0;

      const simulateProgress = () => {
        progressInterval = setInterval(() => {
          currentProgress += 10;
          if (currentProgress <= 90) {
            onProgress?.({
              loaded: Math.floor((currentProgress / 100) * attachment.size),
              total: attachment.size,
              percentage: currentProgress,
              status: 'downloading'
            });
          }
        }, 100);
      };

      // Start progress simulation
      simulateProgress();

      // Trigger download
      try {
        link.click();

        // Complete progress after a short delay (simulating download completion)
        setTimeout(() => {
          if (progressInterval) {
            clearInterval(progressInterval);
          }
          handleDownloadComplete();
        }, 1000);

      } catch (clickError) {
        if (progressInterval) {
          clearInterval(progressInterval);
        }
        handleDownloadError(new Error(`Failed to initiate download: ${clickError}`));
      }

    } catch (error) {
      const downloadError = error instanceof Error
        ? error
        : new Error('Unknown error occurred during file download');

      options.onError?.(downloadError);
      reject(downloadError);
    }
  });
}

/**
 * Downloads multiple files as a zip (fallback: downloads individually)
 */
export async function downloadMultipleFiles(
  attachments: FileAttachment[],
  options: FileDownloadOptions = {}
): Promise<{ successful: number; failed: Array<{ attachment: FileAttachment; error: string }> }> {
  const successful: number[] = [];
  const failed: Array<{ attachment: FileAttachment; error: string }> = [];

  for (let i = 0; i < attachments.length; i++) {
    const attachment = attachments[i];

    try {
      await downloadFile(attachment, {
        ...options,
        onProgress: (progress) => {
          // Adjust progress to account for multiple files
          const overallProgress = {
            ...progress,
            loaded: progress.loaded + (i * attachment.size),
            total: attachments.reduce((sum, att) => sum + att.size, 0),
            percentage: Math.round(((i + progress.percentage / 100) / attachments.length) * 100)
          };
          options.onProgress?.(overallProgress);
        }
      });

      successful.push(i);

      // Add delay between downloads to prevent browser blocking
      if (i < attachments.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (error) {
      failed.push({
        attachment,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return {
    successful: successful.length,
    failed
  };
}

/**
 * Validates multiple files for batch upload
 */
export function validateFiles(
  files: File[],
  options: FileUploadOptions = {}
): ValidationResult {
  const errors: Array<{ field: string; message: string }> = [];

  // Check if any files provided
  if (files.length === 0) {
    return {
      success: false,
      errors: [{ field: 'files', message: 'No files selected' }],
    };
  }

  // Validate each file
  files.forEach((file, index) => {
    const validation = validateFileUpload(file, options.maxSize, options.allowedTypes);
    if (!validation.success) {
      validation.errors.forEach(error => {
        errors.push({
          field: `files[${index}]`,
          message: `${file.name}: ${error.message}`,
        });
      });
    }
  });

  return {
    success: errors.length === 0,
    errors,
  };
}

/**
 * Uploads multiple files with progress tracking
 */
export async function uploadMultipleFiles(
  files: File[],
  options: FileUploadOptions = {}
): Promise<{
  successful: FileAttachment[];
  failed: Array<{ file: File; error: string }>;
}> {
  const successful: FileAttachment[] = [];
  const failed: Array<{ file: File; error: string }> = [];

  for (const file of files) {
    try {
      const result = await uploadFile(file, options);

      if (result.success && result.attachment) {
        successful.push(result.attachment);
      } else {
        failed.push({
          file,
          error: result.error || 'Unknown error',
        });
      }
    } catch (error) {
      failed.push({
        file,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { successful, failed };
}

/**
 * Gets file extension from filename
 */
export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex !== -1 ? filename.slice(lastDotIndex + 1).toLowerCase() : '';
}

/**
 * Checks if a file type is an image
 */
export function isImageFile(type: string): boolean {
  return type.startsWith('image/');
}

/**
 * Gets a human-readable file type description
 */
export function getFileTypeDescription(type: string): string {
  const typeMap: Record<string, string> = {
    'application/pdf': 'PDF Document',
    'image/jpeg': 'JPEG Image',
    'image/png': 'PNG Image',
    'image/gif': 'GIF Image',
    'application/msword': 'Word Document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
    'text/plain': 'Text File',
    'application/vnd.ms-excel': 'Excel Spreadsheet',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
  };

  return typeMap[type] || 'Unknown File Type';
}

/**
 * Creates a preview URL for image files
 */
export function createImagePreviewUrl(attachment: FileAttachment): string | null {
  if (!isImageFile(attachment.type)) {
    return null;
  }

  return `data:${attachment.type};base64,${attachment.data}`;
}

/**
 * Estimates storage size impact of attachments
 */
export function calculateStorageSize(attachments: FileAttachment[]): number {
  return attachments.reduce((total, attachment) => {
    // Base64 encoding increases size by ~33%
    return total + Math.ceil(attachment.size * 1.33);
  }, 0);
}

/**
 * Checks if adding new attachments would exceed storage limits
 */
export function checkStorageLimit(
  existingAttachments: FileAttachment[],
  newFiles: File[],
  maxTotalSize: number = 50 * 1024 * 1024 // 50MB default
): { withinLimit: boolean; currentSize: number; newSize: number; maxSize: number } {
  const currentSize = calculateStorageSize(existingAttachments);
  const newFilesSize = newFiles.reduce((total, file) => total + Math.ceil(file.size * 1.33), 0);
  const totalSize = currentSize + newFilesSize;

  return {
    withinLimit: totalSize <= maxTotalSize,
    currentSize,
    newSize: newFilesSize,
    maxSize: maxTotalSize,
  };
}