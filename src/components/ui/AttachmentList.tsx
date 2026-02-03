'use client';

import React, { useState } from 'react';
import { FileAttachment } from '@/types';
import { AttachmentDisplay } from './AttachmentDisplay';
import { Button } from './Button';
import { cn, formatFileSize } from '@/lib/utils';
import { useToast } from './Toast';

export interface AttachmentListProps {
  attachments: FileAttachment[];
  onDelete?: (id: string) => void;
  onDownload?: (attachment: FileAttachment) => Promise<void> | void;
  onBulkDownload?: (attachments: FileAttachment[]) => Promise<void> | void;
  showPreview?: boolean;
  showMetadata?: boolean;
  compact?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  showEmptyActions?: boolean;
  onUploadClick?: () => void;
  className?: string;
  maxDisplayCount?: number;
}

const AttachmentList: React.FC<AttachmentListProps> = ({
  attachments,
  onDelete,
  onDownload,
  onBulkDownload,
  showPreview = true,
  showMetadata = true,
  compact = false,
  emptyMessage = 'No files attached',
  emptyDescription = 'Upload files to attach them to this invoice',
  showEmptyActions = true,
  onUploadClick,
  className,
  maxDisplayCount,
}) => {
  const [selectedAttachments, setSelectedAttachments] = useState<Set<string>>(new Set());
  const { addToast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);

  const displayAttachments = maxDisplayCount && !isExpanded
    ? attachments.slice(0, maxDisplayCount)
    : attachments;

  const hasMoreAttachments = maxDisplayCount && attachments.length > maxDisplayCount;

  const handleBulkDownload = async () => {
    if (!onBulkDownload || selectedAttachments.size === 0) return;

    try {
      const attachmentsToDownload = attachments.filter(att => selectedAttachments.has(att.id));
      await onBulkDownload(attachmentsToDownload);
      addToast({
        type: 'success',
        message: `Downloaded ${attachmentsToDownload.length} files`
      });
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Failed to download files'
      });
    }
  };

  const toggleSelection = (attachmentId: string) => {
    setSelectedAttachments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(attachmentId)) {
        newSet.delete(attachmentId);
      } else {
        newSet.add(attachmentId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedAttachments(new Set(attachments.map(att => att.id)));
  };

  const clearSelection = () => {
    setSelectedAttachments(new Set());
  };

  const getTotalSize = () => {
    return attachments.reduce((total, att) => total + att.size, 0);
  };

  const getSelectedSize = () => {
    return attachments
      .filter(att => selectedAttachments.has(att.id))
      .reduce((total, att) => total + att.size, 0);
  };

  // Empty state
  if (attachments.length === 0) {
    return (
      <>
        <div className={cn('text-center py-12 px-6', className)}>
          <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              className="h-full w-full"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>

          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {emptyMessage}
          </h3>

          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            {emptyDescription}
          </p>

          {showEmptyActions && onUploadClick && (
            <Button
              onClick={onUploadClick}
              variant="primary"
              size="sm"
              className="inline-flex items-center"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Files
            </Button>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <div className={cn('space-y-4', className)}>
        {/* Header with stats and bulk actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-sm font-medium text-gray-900">
              Attachments ({attachments.length})
            </h3>
            <span className="text-xs text-gray-500">
              {formatFileSize(getTotalSize())} total
            </span>
          </div>

          {attachments.length > 1 && (
            <div className="flex items-center space-x-2">
              {selectedAttachments.size > 0 && (
                <>
                  <span className="text-xs text-gray-500">
                    {selectedAttachments.size} selected ({formatFileSize(getSelectedSize())})
                  </span>
                  {onBulkDownload && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBulkDownload}
                      className="text-xs"
                    >
                      Download Selected
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="text-xs"
                  >
                    Clear
                  </Button>
                </>
              )}

              {selectedAttachments.size === 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAll}
                  className="text-xs"
                >
                  Select All
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Attachment list */}
        <div className={cn('space-y-2', compact && 'space-y-1')}>
          {displayAttachments.map((attachment) => (
            <div key={attachment.id} className="relative">
              {/* Selection checkbox for bulk operations */}
              {attachments.length > 1 && (
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedAttachments.has(attachment.id)}
                    onChange={() => toggleSelection(attachment.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              )}

              <AttachmentDisplay
                attachment={attachment}
                onDelete={onDelete}
                onDownload={onDownload}
                showPreview={showPreview}
                showMetadata={showMetadata}
                compact={compact}
                className={cn(
                  attachments.length > 1 && 'ml-6', // Add margin for checkbox
                  selectedAttachments.has(attachment.id) && 'ring-2 ring-blue-500 ring-opacity-50'
                )}
              />
            </div>
          ))}
        </div>

        {/* Show more/less toggle */}
        {hasMoreAttachments && (
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {isExpanded ? (
                <>
                  Show Less
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </>
              ) : (
                <>
                  Show {attachments.length - maxDisplayCount!} More
                  <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export { AttachmentList };