'use client';

import React, { useState } from 'react';
import { FileAttachment } from '@/types';
import { formatFileSize, cn } from '@/lib/utils';
import {
  getFileTypeDescription,
  isImageFile,
  createImagePreviewUrl,
  getFileExtension
} from '@/lib/fileUtils';
import { Button } from './Button';
import { Modal } from './Modal';
import { ConfirmationModal } from './ConfirmationModal';

export interface AttachmentDisplayProps {
  attachment: FileAttachment;
  onDelete?: (id: string) => void;
  onDownload?: (attachment: FileAttachment) => Promise<void> | void;
  showPreview?: boolean;
  showMetadata?: boolean;
  compact?: boolean;
  className?: string;
}

const AttachmentDisplay: React.FC<AttachmentDisplayProps> = ({
  attachment,
  onDelete,
  onDownload,
  showPreview = true,
  showMetadata = true,
  compact = false,
  className,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const isImage = isImageFile(attachment.type);
  const previewUrl = isImage ? createImagePreviewUrl(attachment) : null;
  const fileExtension = getFileExtension(attachment.filename);
  const typeDescription = getFileTypeDescription(attachment.type);

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(attachment.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async () => {
    if (!onDownload) return;

    setIsDownloading(true);
    try {
      await onDownload(attachment);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatUploadDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getFileIcon = () => {
    const iconClass = "h-5 w-5 text-gray-500";

    if (isImage) {
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }

    if (attachment.type.includes('pdf')) {
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }

    if (attachment.type.includes('word') || attachment.type.includes('document')) {
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }

    if (attachment.type.includes('excel') || attachment.type.includes('spreadsheet')) {
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
        </svg>
      );
    }

    // Default file icon
    return (
      <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  if (compact) {
    return (
      <>
        <div className={cn("flex items-center space-x-2 p-2 rounded border border-gray-200 hover:bg-gray-50", className)}>
          {/* File Icon/Preview */}
          <div className="flex-shrink-0">
            {isImage && previewUrl && showPreview ? (
              <button
                onClick={() => setPreviewOpen(true)}
                className="h-8 w-8 overflow-hidden rounded border border-gray-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <img
                  src={previewUrl}
                  alt={attachment.filename}
                  className="h-full w-full object-cover"
                />
              </button>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-100">
                {getFileIcon()}
              </div>
            )}
          </div>

          {/* File Info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900" title={attachment.filename}>
              {attachment.filename}
            </p>
            <p className="text-xs text-gray-500">
              {formatFileSize(attachment.size)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1">
            {onDownload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
                className="h-6 w-6 p-0"
                title="Download file"
              >
                {isDownloading ? (
                  <div className="h-3 w-3 animate-spin rounded-full border border-gray-300 border-t-blue-600"></div>
                ) : (
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="h-6 w-6 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                title="Delete file"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            )}
          </div>
        </div>

        {/* Modals */}
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
          title="Delete File"
          message={`Are you sure you want to delete "${attachment.filename}"? This action cannot be undone.`}
          confirmText="Delete File"
          cancelText="Cancel"
          variant="danger"
          loading={isDeleting}
        />

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
  }

  return (
    <>
      <div className={cn("rounded-lg border border-gray-200 p-4 hover:bg-gray-50", className)}>
        <div className="flex items-start space-x-4">
          {/* File Icon or Preview */}
          <div className="flex-shrink-0">
            {isImage && previewUrl && showPreview ? (
              <button
                onClick={() => setPreviewOpen(true)}
                className="h-16 w-16 overflow-hidden rounded-lg border border-gray-200 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <img
                  src={previewUrl}
                  alt={attachment.filename}
                  className="h-full w-full object-cover"
                />
              </button>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100">
                {getFileIcon()}
              </div>
            )}
          </div>

          {/* File Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-medium text-gray-900" title={attachment.filename}>
                  {attachment.filename}
                </h4>

                {showMetadata && (
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{typeDescription}</span>
                      <span>•</span>
                      <span>{formatFileSize(attachment.size)}</span>
                      {fileExtension && (
                        <>
                          <span>•</span>
                          <span className="uppercase">{fileExtension}</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Uploaded {formatUploadDate(attachment.uploadedAt)}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 ml-4">
                {onDownload && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="h-8 w-8 p-0"
                    title="Download file"
                  >
                    {isDownloading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border border-gray-300 border-t-blue-600"></div>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                    title="Delete file"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete File"
        message={`Are you sure you want to delete "${attachment.filename}"? This action cannot be undone.`}
        confirmText="Delete File"
        cancelText="Cancel"
        variant="danger"
        loading={isDeleting}
      />

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
            <div className="mt-4 text-sm text-gray-500 space-y-1">
              <p>{formatFileSize(attachment.size)}</p>
              <p>Uploaded {formatUploadDate(attachment.uploadedAt)}</p>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export { AttachmentDisplay };