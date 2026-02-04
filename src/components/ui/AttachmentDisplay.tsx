'use client';

import React, { useState } from 'react';
import { FileAttachment } from '@/types';
import { formatFileSize, cn } from '@/lib/utils';
import {
  getFileTypeDescription,
  getFileExtension
} from '@/lib/fileUtils';
import { Button } from './Button';
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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

    // Get file extension for more specific icon matching
    const extension = getFileExtension(attachment.filename)?.toLowerCase();
    const mimeType = attachment.type.toLowerCase();

    // Image files
    if (mimeType.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension || '')) {
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }

    // PDF files
    if (mimeType.includes('pdf') || extension === 'pdf') {
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M8.267 14.68c-.184 0-.308.018-.372.036v1.178c.076.018.171.023.302.023.479 0 .774-.242.774-.651 0-.366-.254-.586-.704-.586zm3.487.012c-.2 0-.33.018-.407.036v2.61c.077.018.201.018.313.018.817.006 1.349-.444 1.349-1.396.006-.83-.479-1.268-1.255-1.268z" />
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM9.498 16.19c-.309.29-.765.42-1.296.42a2.23 2.23 0 0 1-.308-.018v1.426H7v-3.936A7.558 7.558 0 0 1 8.219 14c.557 0 .953.106 1.22.319.254.202.426.533.426.923-.001.392-.131.723-.367.948zm3.807 1.355c-.42.349-1.059.515-1.84.515-.468 0-.799-.03-1.024-.06v-3.917A7.947 7.947 0 0 1 11.66 14c.757 0 1.249.136 1.633.426.415.308.675.799.675 1.504 0 .763-.279 1.29-.663 1.615zM17 14.77h-1.532v.911H16.9v.734h-1.432v1.604h-.906V14.03H17v.74z" />
        </svg>
      );
    }

    // Word documents
    if (mimeType.includes('word') || mimeType.includes('document') || ['doc', 'docx'].includes(extension || '')) {
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6.5 18L8 12h1l1.5 6h-1l-.25-1h-1.5L7.5 18h-1zm3.25-2h1l-.5-2-.5 2zm2.75 2L11 12h1l1.5 6h-1l-.25-1h-1.5l-.25 1h-1zm1.25-2h1l-.5-2-.5 2z" />
        </svg>
      );
    }

    // Excel/Spreadsheet files
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || ['xls', 'xlsx', 'csv'].includes(extension || '')) {
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6zm2-2h8v-2H8v2zm0-3h8v-2H8v2zm0-3h8V9H8v3z" />
        </svg>
      );
    }

    // PowerPoint files
    if (mimeType.includes('presentation') || ['ppt', 'pptx'].includes(extension || '')) {
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM9 15v-4.5h1.5c1.1 0 2 .9 2 2s-.9 2-2 2H9zm1.5-3.5H10V13h.5c.55 0 1-.45 1-1s-.45-1-1-1z" />
        </svg>
      );
    }

    // Text files
    if (mimeType.includes('text') || ['txt', 'md', 'rtf'].includes(extension || '')) {
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }

    // Archive files
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '')) {
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    }

    // Video files
    if (mimeType.includes('video') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension || '')) {
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    }

    // Audio files
    if (mimeType.includes('audio') || ['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(extension || '')) {
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
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
            <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-100">
              {getFileIcon()}
            </div>
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
      </>
    );
  }

  return (
    <>
      <div className={cn("rounded-lg border border-gray-200 p-4 hover:bg-gray-50", className)}>
        <div className="flex items-start space-x-4">
          {/* File Icon or Preview */}
          <div className="flex-shrink-0">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100">
              {getFileIcon()}
            </div>
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
    </>
  );
};

export { AttachmentDisplay };