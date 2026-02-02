import React from 'react';
import { FileAttachment } from '@/types';
import { FileUploadItem } from './FileUpload';
import { downloadFile } from '@/lib/fileUtils';
import { cn } from '@/lib/utils';

export interface FileListProps {
  attachments: FileAttachment[];
  onDelete: (id: string) => void;
  onDownload?: (attachment: FileAttachment) => void;
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
  const handleDownload = (attachment: FileAttachment) => {
    try {
      if (onDownload) {
        onDownload(attachment);
      } else {
        downloadFile(attachment);
      }
    } catch (error) {
      console.error('Failed to download file:', error);
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
        <FileUploadItem
          key={attachment.id}
          attachment={attachment}
          onDelete={onDelete}
          onDownload={handleDownload}
          showPreview={showPreview}
        />
      ))}
    </div>
  );
};

export { FileList };