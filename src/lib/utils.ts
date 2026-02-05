import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function formatCurrency(amount: number, options?: { currency?: string; locale?: string }): string {
  const currency = options?.currency || 'NGN';
  const locale = options?.locale || 'en-NG';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function formatDate(date: Date | string, format?: string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date');
  }

  if (format) {
    // Simple format handling for common patterns
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return format
      .replace('yyyy', year.toString())
      .replace('MMMM do', `${monthNames[month - 1]} ${day}${getOrdinalSuffix(day)}`)
      .replace('MMM', monthNames[month - 1])
      .replace('MM', month.toString().padStart(2, '0'))
      .replace('dd', day.toString().padStart(2, '0'))
      .replace('EEEE', dayNames[dateObj.getDay()]);
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
}

function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 0) return '0 B';
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  if (i === 0) {
    // For bytes, don't show decimal places
    return bytes + ' ' + sizes[i];
  }

  const value = bytes / Math.pow(k, i);
  return value.toFixed(1) + ' ' + sizes[i];
}

export function calculateLineItemTotal(quantity: number, unitPrice: number): number {
  return Math.round((quantity * unitPrice) * 100) / 100;
}

export function calculateInvoiceSubtotal(lineItems: Array<{ total: number }>): number {
  return Math.round(lineItems.reduce((sum, item) => sum + item.total, 0) * 100) / 100;
}

export function calculateInvoiceTotal(subtotal: number, tax: number): number {
  return Math.round((subtotal + tax) * 100) / 100;
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function sanitizeFilename(filename: string): string {
  if (!filename || filename.trim() === '') {
    return 'untitled';
  }

  // Remove invalid characters
  let sanitized = filename.replace(/[<>:"/\\|?*]/g, '');

  // Handle Windows reserved names
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
  const nameWithoutExt = sanitized.split('.')[0];
  if (reservedNames.includes(nameWithoutExt.toUpperCase())) {
    sanitized = nameWithoutExt + '_' + (sanitized.includes('.') ? '.' + sanitized.split('.').slice(1).join('.') : '');
  }

  // Remove trailing dots and spaces
  sanitized = sanitized.replace(/[.\s]+$/, '');

  // Handle leading dots (hidden files)
  if (sanitized.startsWith('.') && sanitized.length > 1) {
    sanitized = sanitized.substring(1);
  }

  return sanitized || 'untitled';
}

export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (maxLength <= 0) return suffix;
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

export function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}