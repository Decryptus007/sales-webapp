import React, { useCallback, useState, useRef } from 'react';
import { FileAttachment } from '@/types';
import {
  uploadFile,
  uploadMultipleFiles,
  validateFiles,
  FileUploadOptions,
  FileUploadProgress,
  createImagePreviewUrl,
  getFileTypeDescription,
  isImageFile
} from '@/lib/fileUtils';
import { formatFileSize } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { Modal } from './Modal';

export interface FileUploadProps {
  onFilesUploaded: (attachments: FileAttachment[]) => void;
  onError?: (error: string) => void;
  maxFiles?: number;
  maxSize?: number;
  allowedTypes?: string[];
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}

export interface FileUploadItemProps {
  attachment: FileAttachment;
  onDelete: (id: string) => void;
  onDownload?: (attachment: FileAttachment) => void;
  showPreview?: boolean;
}

const FileUploadItem: React.FC<FileUploadItemProps> = ({
  attachment,
  onDelete,
  onDownload,
  showPreview = true,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const isImage = isImageFile(attachment.type);
  const previewUrl = isImage ? createImagePreviewUrl(attachment) : null;

  const handleDelete = () => {
    onDelete(attachment.id);
    setShowDeleteConfirm(false);
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(attachment);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
        <div className="flex items-center space-x-3">
          {/* File Icon or Preview */}
          <div className="flex-shrink-0">
            {isImage && previewUrl && showPreview ? (
              <button
                onClick={() => setPreviewOpen(true)}
                className="h-10 w-10 overflow-hidden rounded border border-gray-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <img
                  src={previewUrl}
                  alt={attachment.filename}
                  className="h-full w-full object-cover"
                />
              </button>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100">
                <svg
                  className="h-5 w-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* File Info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">
              {attachment.filename}
            </p>
            <p className="text-xs text-gray-500">
              {getFileTypeDescription(attachment.type)} • {formatFileSize(attachment.size)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {onDownload && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-8 w-8 p-0"
              title="Download file"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
            title="Delete file"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete File"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete "{attachment.filename}"? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Image Preview Modal */}
      {isImage && previewUrl && (
        <Modal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          title={attachment.filename}
          size="lg"
        >
          <div className="text-center">
            <img
              src={previewUrl}
              alt={attachment.filename}
              className="max-h-96 max-w-full rounded"
            />
            <p className="mt-2 text-sm text-gray-500">
              {formatFileSize(attachment.size)}
            </p>
          </div>
        </Modal>
      )}
    </>
  );
};

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesUploaded,
  onError,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  allowedTypes,
  multiple = true,
  disabled = false,
  className,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const options: FileUploadOptions = {
    maxSize,
    allowedTypes,
    onProgress: (progress: FileUploadProgress) => {
      // Progress tracking could be enhanced to show per-file progress
      console.log('Upload progress:', progress);
    },
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);

    // Validate files first
    const validation = validateFiles(fileArray, options);
    if (!validation.success) {
      onError?.(validation.errors[0]?.message || 'File validation failed');
      return;
    }

    // Check max files limit
    if (fileArray.length > maxFiles) {
      onError?.(`Cannot upload more than ${maxFiles} files at once`);
      return;
    }

    setIsUploading(true);
    setUploadProgress({});

    try {
      if (multiple) {
        const result = await uploadMultipleFiles(fileArray, options);

        if (result.failed.length > 0) {
          const errorMessages = result.failed.map(f => `${f.file.name}: ${f.error}`);
          onError?.(`Some files failed to upload: ${errorMessages.join(', ')}`);
        }

        if (result.successful.length > 0) {
          onFilesUploaded(result.successful);
        }
      } else {
        const result = await uploadFile(fileArray[0], options);

        if (result.success && result.attachment) {
          onFilesUploaded([result.attachment]);
        } else {
          onError?.(result.error || 'File upload failed');
        }
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress({});

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [onFilesUploaded, onError, maxFiles, maxSize, allowedTypes, multiple, options]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [disabled, isUploading, handleFiles]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading]);

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'relative rounded-lg border-2 border-dashed p-6 text-center transition-colors',
          isDragOver && !disabled
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400',
          disabled && 'cursor-not-allowed opacity-50',
          !disabled && !isUploading && 'cursor-pointer hover:bg-gray-50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={allowedTypes?.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />

        {isUploading ? (
          <div className="space-y-2">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
            <p className="text-sm text-gray-600">Uploading files...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                className="h-full w-full"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isDragOver ? 'Drop files here' : 'Drop files here or click to browse'}
              </p>
              <p className="text-xs text-gray-500">
                {allowedTypes
                  ? `Supported: ${allowedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}`
                  : 'PDF, JPEG, PNG, GIF, DOC, DOCX, TXT, XLS, XLSX'
                } • Max {formatFileSize(maxSize)} per file
              </p>
              {multiple && (
                <p className="text-xs text-gray-500">
                  Upload up to {maxFiles} files at once
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { FileUpload, FileUploadItem };