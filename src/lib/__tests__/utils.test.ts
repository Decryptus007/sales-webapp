import {
  cn,
  formatCurrency,
  formatDate,
  formatFileSize,
  generateId,
  calculateLineItemTotal,
  calculateInvoiceSubtotal,
  calculateInvoiceTotal,
  debounce,
  throttle,
  isValidEmail,
  sanitizeFilename,
  truncateText,
  capitalizeFirst,
  slugify,
} from '../utils';
import { LineItem } from '@/types';

describe('utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      const result = cn('base-class', 'additional-class');
      expect(result).toBe('base-class additional-class');
    });

    it('should handle conditional classes', () => {
      const result = cn('base-class', true && 'conditional-class', false && 'hidden-class');
      expect(result).toBe('base-class conditional-class');
    });

    it('should handle undefined and null values', () => {
      const result = cn('base-class', undefined, null, 'valid-class');
      expect(result).toBe('base-class valid-class');
    });

    it('should merge Tailwind classes correctly', () => {
      const result = cn('bg-red-500', 'bg-blue-500');
      expect(result).toBe('bg-blue-500'); // Later class should override
    });
  });

  describe('formatCurrency', () => {
    it('should format currency with default settings', () => {
      expect(formatCurrency(1234.56)).toBe('₦1,234.56');
      expect(formatCurrency(0)).toBe('₦0.00');
      expect(formatCurrency(1000)).toBe('₦1,000.00');
    });

    it('should handle negative amounts', () => {
      expect(formatCurrency(-1234.56)).toBe('-₦1,234.56');
    });

    it('should handle very large numbers', () => {
      expect(formatCurrency(1234567890.12)).toBe('₦1,234,567,890.12');
    });

    it('should handle decimal precision', () => {
      expect(formatCurrency(1234.567)).toBe('₦1,234.57'); // Should round to 2 decimal places
      expect(formatCurrency(1234.1)).toBe('₦1,234.10');
    });

    it('should handle custom currency options', () => {
      const result = formatCurrency(1234.56, {
        currency: 'USD',
        locale: 'en-US'
      });
      expect(result).toBe('$1,234.56');
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2024-01-15T10:30:00Z');

    it('should format date with default format', () => {
      const result = formatDate(testDate);
      expect(result).toBe('Jan 15, 2024');
    });

    it('should format date with custom format', () => {
      const result = formatDate(testDate, 'yyyy-MM-dd');
      expect(result).toBe('2024-01-15');
    });

    it('should handle different date formats', () => {
      expect(formatDate(testDate, 'MMM dd, yyyy')).toBe('Jan 15, 2024');
      expect(formatDate(testDate, 'dd/MM/yyyy')).toBe('15/01/2024');
      expect(formatDate(testDate, 'EEEE, MMMM do, yyyy')).toContain('Monday');
    });

    it('should handle invalid dates', () => {
      const invalidDate = new Date('invalid');
      expect(() => formatDate(invalidDate)).toThrow();
    });

    it('should handle date strings', () => {
      const result = formatDate('2024-01-15');
      expect(result).toBe('Jan 15, 2024');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(512)).toBe('512 B');
      expect(formatFileSize(1023)).toBe('1023 B');
    });

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(2048)).toBe('2.0 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
      expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB');
    });

    it('should handle very large sizes', () => {
      const terabyte = 1024 * 1024 * 1024 * 1024;
      expect(formatFileSize(terabyte)).toBe('1.0 TB');
    });

    it('should handle negative sizes', () => {
      expect(formatFileSize(-1024)).toBe('0 B');
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs of consistent length', () => {
      const id1 = generateId();
      const id2 = generateId();

      // IDs should be reasonably long but may vary slightly due to timestamp differences
      expect(id1.length).toBeGreaterThan(15); // Should be reasonably long
      expect(id2.length).toBeGreaterThan(15); // Should be reasonably long
      expect(Math.abs(id1.length - id2.length)).toBeLessThanOrEqual(1); // Allow 1 character difference
    });

    it('should generate alphanumeric IDs', () => {
      const id = generateId();
      expect(id).toMatch(/^[a-zA-Z0-9]+$/);
    });

    it('should generate many unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 1000; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(1000); // All should be unique
    });
  });

  describe('calculateLineItemTotal', () => {
    it('should calculate total correctly', () => {
      expect(calculateLineItemTotal(2, 50)).toBe(100);
      expect(calculateLineItemTotal(1, 99.99)).toBe(99.99);
      expect(calculateLineItemTotal(0, 100)).toBe(0);
    });

    it('should handle decimal quantities and prices', () => {
      expect(calculateLineItemTotal(1.5, 100)).toBe(150);
      expect(calculateLineItemTotal(2, 99.99)).toBe(199.98);
      expect(calculateLineItemTotal(0.5, 200)).toBe(100);
    });

    it('should handle negative values', () => {
      expect(calculateLineItemTotal(-1, 100)).toBe(-100);
      expect(calculateLineItemTotal(1, -100)).toBe(-100);
      expect(calculateLineItemTotal(-1, -100)).toBe(100);
    });

    it('should handle very small numbers', () => {
      expect(calculateLineItemTotal(0.001, 1000)).toBe(1);
      expect(calculateLineItemTotal(1, 0.01)).toBe(0.01);
    });
  });

  describe('calculateInvoiceSubtotal', () => {
    const lineItems: LineItem[] = [
      {
        id: '1',
        description: 'Item 1',
        quantity: 2,
        unitPrice: 50,
        total: 100,
      },
      {
        id: '2',
        description: 'Item 2',
        quantity: 1,
        unitPrice: 75,
        total: 75,
      },
    ];

    it('should calculate subtotal correctly', () => {
      expect(calculateInvoiceSubtotal(lineItems)).toBe(175);
    });

    it('should handle empty line items', () => {
      expect(calculateInvoiceSubtotal([])).toBe(0);
    });

    it('should handle single line item', () => {
      const singleItem = [lineItems[0]];
      expect(calculateInvoiceSubtotal(singleItem)).toBe(100);
    });

    it('should handle line items with zero totals', () => {
      const itemsWithZero = [
        ...lineItems,
        {
          id: '3',
          description: 'Free item',
          quantity: 1,
          unitPrice: 0,
          total: 0,
        },
      ];
      expect(calculateInvoiceSubtotal(itemsWithZero)).toBe(175);
    });
  });

  describe('calculateInvoiceTotal', () => {
    it('should calculate total with tax correctly', () => {
      expect(calculateInvoiceTotal(100, 10)).toBe(110);
      expect(calculateInvoiceTotal(200, 25)).toBe(225);
      expect(calculateInvoiceTotal(0, 10)).toBe(10);
    });

    it('should handle zero tax', () => {
      expect(calculateInvoiceTotal(100, 0)).toBe(100);
    });

    it('should handle negative tax (discount)', () => {
      expect(calculateInvoiceTotal(100, -10)).toBe(90);
    });

    it('should handle decimal values', () => {
      expect(calculateInvoiceTotal(99.99, 10.01)).toBe(110);
      expect(calculateInvoiceTotal(100.50, 5.25)).toBe(105.75);
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    afterEach(() => {
      jest.clearAllTimers();
    });

    it('should delay function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments correctly', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1', 'arg2');
      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('throttle', () => {
    jest.useFakeTimers();

    afterEach(() => {
      jest.clearAllTimers();
    });

    it('should limit function calls', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(100);
      throttledFn();

      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should pass arguments correctly', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn('arg1', 'arg2');
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
      expect(isValidEmail('123@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user@.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('user space@example.com')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isValidEmail('a@b.c')).toBe(true); // Minimal valid email
      expect(isValidEmail('very.long.email.address@very.long.domain.name.com')).toBe(true);
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove invalid characters', () => {
      expect(sanitizeFilename('file<>:"/\\|?*.txt')).toBe('file.txt');
      expect(sanitizeFilename('normal-file_name.pdf')).toBe('normal-file_name.pdf');
    });

    it('should handle empty strings', () => {
      expect(sanitizeFilename('')).toBe('untitled');
      expect(sanitizeFilename('   ')).toBe('untitled');
    });

    it('should preserve file extensions', () => {
      expect(sanitizeFilename('document.pdf')).toBe('document.pdf');
      expect(sanitizeFilename('image.jpeg')).toBe('image.jpeg');
    });

    it('should handle special cases', () => {
      expect(sanitizeFilename('CON.txt')).toBe('CON_.txt'); // Windows reserved name
      expect(sanitizeFilename('file.')).toBe('file');
      expect(sanitizeFilename('.hidden')).toBe('hidden');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const longText = 'This is a very long text that should be truncated';
      expect(truncateText(longText, 20)).toBe('This is a very lo...');
    });

    it('should not truncate short text', () => {
      const shortText = 'Short text';
      expect(truncateText(shortText, 20)).toBe('Short text');
    });

    it('should handle custom suffix', () => {
      const text = 'This is a long text';
      expect(truncateText(text, 10, ' [more]')).toBe('Thi [more]');
    });

    it('should handle edge cases', () => {
      expect(truncateText('', 10)).toBe('');
      expect(truncateText('Text', 0)).toBe('...');
      expect(truncateText('Text', -1)).toBe('...');
    });
  });

  describe('capitalizeFirst', () => {
    it('should capitalize first letter', () => {
      expect(capitalizeFirst('hello')).toBe('Hello');
      expect(capitalizeFirst('HELLO')).toBe('HELLO');
      expect(capitalizeFirst('hELLO')).toBe('HELLO');
    });

    it('should handle empty strings', () => {
      expect(capitalizeFirst('')).toBe('');
    });

    it('should handle single characters', () => {
      expect(capitalizeFirst('a')).toBe('A');
      expect(capitalizeFirst('A')).toBe('A');
    });

    it('should handle special characters', () => {
      expect(capitalizeFirst('123abc')).toBe('123abc');
      expect(capitalizeFirst('!hello')).toBe('!hello');
    });
  });

  describe('slugify', () => {
    it('should create URL-friendly slugs', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('This is a Test!')).toBe('this-is-a-test');
      expect(slugify('Special@Characters#Here')).toBe('specialcharactershere');
    });

    it('should handle multiple spaces', () => {
      expect(slugify('Multiple   Spaces   Here')).toBe('multiple-spaces-here');
    });

    it('should handle leading/trailing spaces', () => {
      expect(slugify('  Trimmed Text  ')).toBe('trimmed-text');
    });

    it('should handle empty strings', () => {
      expect(slugify('')).toBe('');
      expect(slugify('   ')).toBe('');
    });

    it('should handle numbers and hyphens', () => {
      expect(slugify('Item-123 Test')).toBe('item-123-test');
      expect(slugify('2024-01-15')).toBe('2024-01-15');
    });
  });

  describe('Edge Cases and Performance', () => {
    it('should handle very large numbers in calculations', () => {
      const largeNumber = Number.MAX_SAFE_INTEGER;
      expect(calculateLineItemTotal(1, largeNumber)).toBe(largeNumber);
      expect(formatCurrency(largeNumber)).toContain(largeNumber.toLocaleString());
    });

    it('should handle floating point precision issues', () => {
      // JavaScript floating point arithmetic can be imprecise
      const result = calculateLineItemTotal(0.1, 0.2);
      expect(result).toBeCloseTo(0.02, 10);
    });

    it('should handle null and undefined inputs gracefully', () => {
      expect(() => formatCurrency(null as any)).not.toThrow();
      expect(() => formatDate(null as any)).toThrow();
      expect(() => formatFileSize(undefined as any)).not.toThrow();
    });
  });
});