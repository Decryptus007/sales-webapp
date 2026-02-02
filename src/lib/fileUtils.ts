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

/**
 * Downloads a file attachment by creating a temporary download link
 */
export function downloadFile(attachment: FileAttachment): void {
  try {
    const blob = base64ToBlob(attachment.data, attachment.type);
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.filename;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download file:', error);
    throw new Error('Failed to download file');
  }
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