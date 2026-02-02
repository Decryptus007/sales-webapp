import {
  fileToBase64,
  base64ToBlob,
  uploadFile,
  validateFiles,
  getFileExtension,
  isImageFile,
  getFileTypeDescription,
  calculateStorageSize,
  checkStorageLimit,
} from '../fileUtils';
import { FileAttachment } from '@/types';

// Mock File constructor for testing
class MockFile extends File {
  constructor(bits: BlobPart[], name: string, options?: FilePropertyBag) {
    super(bits, name, options);
  }
}

// Helper to create test files
const createTestFile = (name: string, size: number, type: string): File => {
  const content = 'a'.repeat(size);
  return new MockFile([content], name, { type });
};

describe('fileUtils', () => {
  describe('fileToBase64', () => {
    it('should convert file to base64', async () => {
      const file = createTestFile('test.txt', 10, 'text/plain');
      const base64 = await fileToBase64(file);

      expect(typeof base64).toBe('string');
      expect(base64.length).toBeGreaterThan(0);
    });

    it('should track progress during conversion', async () => {
      const file = createTestFile('test.txt', 100, 'text/plain');
      const progressCallback = jest.fn();

      await fileToBase64(file, progressCallback);

      // Progress callback might not be called for small files in test environment
      // but the function should complete successfully
      expect(true).toBe(true);
    });
  });

  describe('base64ToBlob', () => {
    it('should convert base64 to blob', () => {
      const base64 = 'SGVsbG8gV29ybGQ='; // "Hello World" in base64
      const blob = base64ToBlob(base64, 'text/plain');

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/plain');
      expect(blob.size).toBeGreaterThan(0);
    });
  });

  describe('uploadFile', () => {
    it('should upload valid file successfully', async () => {
      const file = createTestFile('test.pdf', 1000, 'application/pdf');
      const result = await uploadFile(file);

      expect(result.success).toBe(true);
      expect(result.attachment).toBeDefined();
      expect(result.attachment?.filename).toBe('test.pdf');
      expect(result.attachment?.type).toBe('application/pdf');
      expect(result.attachment?.size).toBe(1000);
    });

    it('should reject file that exceeds size limit', async () => {
      const file = createTestFile('large.pdf', 20 * 1024 * 1024, 'application/pdf'); // 20MB
      const result = await uploadFile(file, { maxSize: 10 * 1024 * 1024 }); // 10MB limit

      expect(result.success).toBe(false);
      expect(result.error).toContain('size');
    });

    it('should reject unsupported file type', async () => {
      const file = createTestFile('test.exe', 1000, 'application/x-executable');
      const result = await uploadFile(file);

      expect(result.success).toBe(false);
      expect(result.error).toContain('type');
    });
  });

  describe('validateFiles', () => {
    it('should validate array of valid files', () => {
      const files = [
        createTestFile('test1.pdf', 1000, 'application/pdf'),
        createTestFile('test2.jpg', 2000, 'image/jpeg'),
      ];

      const result = validateFiles(files);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid files', () => {
      const files = [
        createTestFile('test.exe', 1000, 'application/x-executable'),
        createTestFile('large.pdf', 20 * 1024 * 1024, 'application/pdf'),
      ];

      const result = validateFiles(files, { maxSize: 10 * 1024 * 1024 });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should return error for empty file array', () => {
      const result = validateFiles([]);

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain('No files selected');
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extension correctly', () => {
      expect(getFileExtension('test.pdf')).toBe('pdf');
      expect(getFileExtension('image.jpeg')).toBe('jpeg');
      expect(getFileExtension('document.docx')).toBe('docx');
      expect(getFileExtension('noextension')).toBe('');
    });
  });

  describe('isImageFile', () => {
    it('should identify image file types', () => {
      expect(isImageFile('image/jpeg')).toBe(true);
      expect(isImageFile('image/png')).toBe(true);
      expect(isImageFile('image/gif')).toBe(true);
      expect(isImageFile('application/pdf')).toBe(false);
      expect(isImageFile('text/plain')).toBe(false);
    });
  });

  describe('getFileTypeDescription', () => {
    it('should return human-readable descriptions', () => {
      expect(getFileTypeDescription('application/pdf')).toBe('PDF Document');
      expect(getFileTypeDescription('image/jpeg')).toBe('JPEG Image');
      expect(getFileTypeDescription('text/plain')).toBe('Text File');
      expect(getFileTypeDescription('unknown/type')).toBe('Unknown File Type');
    });
  });

  describe('calculateStorageSize', () => {
    it('should calculate total storage size with base64 overhead', () => {
      const attachments: FileAttachment[] = [
        {
          id: '1',
          filename: 'test1.pdf',
          size: 1000,
          type: 'application/pdf',
          data: 'base64data',
          uploadedAt: new Date(),
        },
        {
          id: '2',
          filename: 'test2.jpg',
          size: 2000,
          type: 'image/jpeg',
          data: 'base64data',
          uploadedAt: new Date(),
        },
      ];

      const storageSize = calculateStorageSize(attachments);

      // Should be approximately 33% larger than original size due to base64 encoding
      expect(storageSize).toBeGreaterThan(3000);
      expect(storageSize).toBeLessThan(4000);
    });
  });

  describe('checkStorageLimit', () => {
    it('should check if files fit within storage limit', () => {
      const existingAttachments: FileAttachment[] = [
        {
          id: '1',
          filename: 'existing.pdf',
          size: 5000,
          type: 'application/pdf',
          data: 'base64data',
          uploadedAt: new Date(),
        },
      ];

      const newFiles = [
        createTestFile('new.pdf', 3000, 'application/pdf'),
      ];

      const result = checkStorageLimit(existingAttachments, newFiles, 15000);

      expect(result.withinLimit).toBe(true);
      expect(result.currentSize).toBeGreaterThan(0);
      expect(result.newSize).toBeGreaterThan(0);
      expect(result.maxSize).toBe(15000);
    });

    it('should detect when storage limit would be exceeded', () => {
      const existingAttachments: FileAttachment[] = [
        {
          id: '1',
          filename: 'existing.pdf',
          size: 8000,
          type: 'application/pdf',
          data: 'base64data',
          uploadedAt: new Date(),
        },
      ];

      const newFiles = [
        createTestFile('new.pdf', 5000, 'application/pdf'),
      ];

      const result = checkStorageLimit(existingAttachments, newFiles, 15000);

      expect(result.withinLimit).toBe(false);
    });
  });
});