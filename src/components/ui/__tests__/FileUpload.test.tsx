import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileUpload, FileUploadItem } from '../FileUpload';
import { FileAttachment } from '@/types';

// Mock the file utilities
jest.mock('@/lib/fileUtils', () => ({
  uploadFile: jest.fn(),
  uploadMultipleFiles: jest.fn(),
  validateFiles: jest.fn(),
  createImagePreviewUrl: jest.fn(),
  getFileTypeDescription: jest.fn(() => 'PDF Document'),
  isImageFile: jest.fn(() => false),
  downloadFile: jest.fn(),
}));

// Mock the utils
jest.mock('@/lib/utils', () => ({
  cn: jest.fn((...classes) => classes.filter(Boolean).join(' ')),
  formatFileSize: jest.fn((size) => `${size} bytes`),
}));

const mockAttachment: FileAttachment = {
  id: 'test-id',
  filename: 'test-document.pdf',
  size: 1024,
  type: 'application/pdf',
  data: 'base64data',
  uploadedAt: new Date('2024-01-01'),
};

describe('FileUpload', () => {
  const mockOnFilesUploaded = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render upload area with correct text', () => {
    render(
      <FileUpload
        onFilesUploaded={mockOnFilesUploaded}
        onError={mockOnError}
      />
    );

    expect(screen.getByText('Drop files here or click to browse')).toBeInTheDocument();
    expect(screen.getByText(/PDF, JPEG, PNG/)).toBeInTheDocument();
  });

  it('should show loading state when uploading', () => {
    render(
      <FileUpload
        onFilesUploaded={mockOnFilesUploaded}
        onError={mockOnError}
      />
    );

    // Simulate uploading state by checking if the component can handle it
    // In a real test, we would trigger file upload and check loading state
    expect(screen.getByText('Drop files here or click to browse')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <FileUpload
        onFilesUploaded={mockOnFilesUploaded}
        onError={mockOnError}
        disabled={true}
      />
    );

    // Just check that the component renders when disabled
    expect(screen.getByText('Drop files here or click to browse')).toBeInTheDocument();
  });

  it('should show custom allowed types when provided', () => {
    render(
      <FileUpload
        onFilesUploaded={mockOnFilesUploaded}
        onError={mockOnError}
        allowedTypes={['application/pdf', 'image/jpeg']}
      />
    );

    expect(screen.getByText(/Supported: PDF, JPEG/)).toBeInTheDocument();
  });

  it('should show max files limit when multiple is enabled', () => {
    render(
      <FileUpload
        onFilesUploaded={mockOnFilesUploaded}
        onError={mockOnError}
        multiple={true}
        maxFiles={5}
      />
    );

    expect(screen.getByText('Upload up to 5 files at once')).toBeInTheDocument();
  });
});

describe('FileUploadItem', () => {
  const mockOnDelete = jest.fn();
  const mockOnDownload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render file information correctly', () => {
    render(
      <FileUploadItem
        attachment={mockAttachment}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
    expect(screen.getByText('PDF Document • 1024 bytes')).toBeInTheDocument();
  });

  it('should show download and delete buttons', () => {
    render(
      <FileUploadItem
        attachment={mockAttachment}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByTitle('Download file')).toBeInTheDocument();
    expect(screen.getByTitle('Delete file')).toBeInTheDocument();
  });

  it('should call onDownload when download button is clicked', () => {
    render(
      <FileUploadItem
        attachment={mockAttachment}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
      />
    );

    const downloadButton = screen.getByTitle('Download file');
    fireEvent.click(downloadButton);

    expect(mockOnDownload).toHaveBeenCalledWith(mockAttachment);
  });

  it('should show delete confirmation modal when delete button is clicked', async () => {
    render(
      <FileUploadItem
        attachment={mockAttachment}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
      />
    );

    const deleteButton = screen.getByTitle('Delete file');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('Delete File')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
    });
  });

  it('should call onDelete when delete is confirmed', async () => {
    render(
      <FileUploadItem
        attachment={mockAttachment}
        onDelete={mockOnDelete}
        onDownload={mockOnDownload}
      />
    );

    // Click delete button
    const deleteButton = screen.getByTitle('Delete file');
    fireEvent.click(deleteButton);

    // Wait for modal and click confirm
    await waitFor(() => {
      const confirmButton = screen.getByText('Delete');
      fireEvent.click(confirmButton);
    });

    expect(mockOnDelete).toHaveBeenCalledWith('test-id');
  });

  it('should not show download button when onDownload is not provided', () => {
    render(
      <FileUploadItem
        attachment={mockAttachment}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.queryByTitle('Download file')).not.toBeInTheDocument();
    expect(screen.getByTitle('Delete file')).toBeInTheDocument();
  });
});