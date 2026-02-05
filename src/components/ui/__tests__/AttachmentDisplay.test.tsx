import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AttachmentDisplay } from '../AttachmentDisplay';
import { FileAttachment } from '@/types';
import { ToastProvider } from '../Toast';

// Mock file utils
jest.mock('@/lib/fileUtils', () => ({
  getFileTypeDescription: jest.fn(() => 'PDF Document'),
  isImageFile: jest.fn(() => false),
  createImagePreviewUrl: jest.fn(() => null),
  getFileExtension: jest.fn(() => 'pdf'),
}));

const mockAttachment: FileAttachment = {
  id: 'test-1',
  filename: 'test-document.pdf',
  size: 1024000, // 1MB
  type: 'application/pdf',
  data: 'base64data',
  uploadedAt: new Date('2024-01-01T10:00:00Z'),
};

const renderWithToast = (component: React.ReactElement) => {
  return render(
    <ToastProvider>
      {component}
    </ToastProvider>
  );
};

describe('AttachmentDisplay', () => {
  it('renders attachment with metadata', () => {
    renderWithToast(
      <AttachmentDisplay
        attachment={mockAttachment}
        showMetadata={true}
      />
    );

    expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
    expect(screen.getByText('PDF Document')).toBeInTheDocument();
    expect(screen.getByText('1000.0 KB')).toBeInTheDocument(); // formatFileSize returns KB for this size
    expect(screen.getByText('pdf')).toBeInTheDocument(); // Extension is lowercase
  });

  it('renders in compact mode', () => {
    renderWithToast(
      <AttachmentDisplay
        attachment={mockAttachment}
        compact={true}
      />
    );

    expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
    expect(screen.getByText('1000.0 KB')).toBeInTheDocument(); // formatFileSize returns KB for this size
  });

  it('calls onDownload when download button is clicked', async () => {
    const mockOnDownload = jest.fn<Promise<void>, [FileAttachment]>().mockResolvedValue(undefined);

    renderWithToast(
      <AttachmentDisplay
        attachment={mockAttachment}
        onDownload={mockOnDownload}
      />
    );

    const downloadButton = screen.getByTitle('Download file');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(mockOnDownload).toHaveBeenCalledWith(mockAttachment);
    });
  });

  it('calls onDelete when delete button is clicked and confirmed', async () => {
    const mockOnDelete = jest.fn<Promise<void>, [string]>().mockResolvedValue(undefined);

    renderWithToast(
      <AttachmentDisplay
        attachment={mockAttachment}
        onDelete={mockOnDelete}
      />
    );

    // Click delete button
    const deleteButton = screen.getByTitle('Delete file');
    fireEvent.click(deleteButton);

    // Confirm deletion - use getByRole to find the button
    const confirmButton = screen.getByRole('button', { name: 'Delete File' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith('test-1');
    });
  });

  it('shows loading state during download', async () => {
    const mockOnDownload = jest.fn<Promise<void>, [FileAttachment]>(() => new Promise(resolve => setTimeout(resolve, 100)));

    renderWithToast(
      <AttachmentDisplay
        attachment={mockAttachment}
        onDownload={mockOnDownload}
      />
    );

    const downloadButton = screen.getByTitle('Download file');
    fireEvent.click(downloadButton);

    // Should show loading spinner
    expect(downloadButton).toBeDisabled();
  });
});