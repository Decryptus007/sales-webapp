'use client';

import React, { useState } from 'react';
import { FileAttachment } from '@/types';
import { FileUploadItem } from './FileUpload';
import { downloadFile } from '@/lib/fileUtils';
import { cn } from '@/lib/utils';
import { useToast } from './Toast';

export interface FileListProps {
  attachments: FileAttachment[];
  onDelete: (id: string) => void;
  onDownload?: (attachment: FileAttachment) => Promise<void> | void;
  showPreview?: boolean;
  emptyMessage?: string;
  className?: string;
}

const FileList: React.FC<FileListProps> = ({
  attachments,
  onDelete,
  onDownload,
  showPreview = true,
  emptyMessage = 'No files attached',
  className,
}) => {
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const { addToast } = useToast();

  const handleDownload = async (attachment: FileAttachment) => {
    try {
      setDownloadingFiles(prev => new Set(prev).add(attachment.id));
      setDownloadProgress(prev => ({ ...prev, [attachment.id]: 0 }));

      if (onDownload) {
        await onDownload(attachment);
      } else {
        await downloadFile(attachment, {
          onProgress: (progress) => {
            setDownloadProgress(prev => ({
              ...prev,
              [attachment.id]: progress.percentage
            }));
          },
          onError: (error) => {
            addToast({
              type: 'error',
              message: `Failed to download ${attachment.filename}: ${error.message}`
            });
          },
          onSuccess: () => {
            addToast({
              type: 'success',
              message: `Successfully downloaded ${attachment.filename}`
            });
          }
        });
      }
    } catch (error) {
      console.error('Failed to download file:', error);
      addToast({
        type: 'error',
        message: `Failed to download ${attachment.filename}`
      });
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(attachment.id);
        return newSet;
      });

      // Clear progress after a delay
      setTimeout(() => {
        setDownloadProgress(prev => {
          const { [attachment.id]: _, ...rest } = prev;
          return rest;
        });
      }, 2000);
    }
  };

  if (attachments.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <div className="mx-auto h-12 w-12 text-gray-300">
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p className="mt-2 text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {attachments.map((attachment) => (
        <div key={attachment.id} className="relative">
          <FileUploadItem
            attachment={attachment}
            onDelete={onDelete}
            onDownload={handleDownload}
            showPreview={showPreview}
          />

          {/* Download Progress Overlay */}
          {downloadingFiles.has(attachment.id) && (
            <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="mt-1 text-xs text-gray-600">
                  Downloading... {downloadProgress[attachment.id] || 0}%
                </p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export { FileList };