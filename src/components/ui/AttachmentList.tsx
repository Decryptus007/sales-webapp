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

  // Empty state - just return null, no need for empty state UI
  if (attachments.length === 0) {
    return null;
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