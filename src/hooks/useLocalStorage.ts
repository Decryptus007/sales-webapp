import { useState, useEffect, useCallback, useRef } from 'react';

// Custom error types for localStorage operations
export class LocalStorageError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'LocalStorageError';
  }
}

export class StorageQuotaError extends LocalStorageError {
  constructor(message: string = 'Storage quota exceeded') {
    super(message);
    this.name = 'StorageQuotaError';
  }
}

export class DataCorruptionError extends LocalStorageError {
  constructor(message: string = 'Data corruption detected') {
    super(message);
    this.name = 'DataCorruptionError';
  }
}

// Utility functions for localStorage operations
export const localStorageUtils = {
  /**
   * Safely get an item from localStorage with JSON parsing
   */
  getItem: <T>(key: string, defaultValue: T): T => {
    try {
      if (typeof window === 'undefined') {
        return defaultValue;
      }

      const item = window.localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }

      // Try to parse JSON
      const parsed = JSON.parse(item, (key, value) => {
        // Revive Date objects
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
          return new Date(value);
        }
        return value;
      });

      return parsed;
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);

      if (error instanceof SyntaxError) {
        throw new DataCorruptionError(`Corrupted data in localStorage for key "${key}"`);
      }

      throw new LocalStorageError(`Failed to read from localStorage for key "${key}"`, error as Error);
    }
  },

  /**
   * Safely set an item in localStorage with JSON serialization and storage limit handling
   */
  setItem: <T>(key: string, value: T): void => {
    try {
      if (typeof window === 'undefined') {
        return;
      }

      const serialized = JSON.stringify(value, (key, value) => {
        // Serialize Date objects as ISO strings
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      });

      // Check if the data is too large before attempting to store
      const estimatedSize = serialized.length + key.length;
      const currentSize = localStorageUtils.getStorageSize();
      const maxSize = 5 * 1024 * 1024; // 5MB typical localStorage limit

      if (currentSize + estimatedSize > maxSize) {
        console.warn(`Attempting to store ${estimatedSize} bytes, current usage: ${currentSize} bytes`);

        // Try to free up space by removing old data
        localStorageUtils.cleanupOldData();
      }

      window.localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);

      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        // Try cleanup and retry once
        try {
          localStorageUtils.cleanupOldData();
          window.localStorage.setItem(key, JSON.stringify(value, (key, value) => {
            if (value instanceof Date) {
              return value.toISOString();
            }
            return value;
          }));
        } catch (retryError) {
          throw new StorageQuotaError(`Storage quota exceeded when writing to key "${key}". Consider reducing data size or clearing old data.`);
        }
      } else {
        throw new LocalStorageError(`Failed to write to localStorage for key "${key}"`, error as Error);
      }
    }
  },

  /**
   * Safely remove an item from localStorage
   */
  removeItem: (key: string): void => {
    try {
      if (typeof window === 'undefined') {
        return;
      }

      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage key "${key}":`, error);
      throw new LocalStorageError(`Failed to remove from localStorage for key "${key}"`, error as Error);
    }
  },

  /**
   * Check if localStorage is available
   */
  isAvailable: (): boolean => {
    try {
      if (typeof window === 'undefined') {
        return false;
      }

      const testKey = '__localStorage_test__';
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get the approximate size of localStorage usage
   */
  getStorageSize: (): number => {
    try {
      if (typeof window === 'undefined') {
        return 0;
      }

      let total = 0;
      for (const key in window.localStorage) {
        if (window.localStorage.hasOwnProperty(key)) {
          total += window.localStorage[key].length + key.length;
        }
      }
      return total;
    } catch {
      return 0;
    }
  },

  /**
   * Clear all localStorage data (use with caution)
   */
  clear: (): void => {
    try {
      if (typeof window === 'undefined') {
        return;
      }

      window.localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      throw new LocalStorageError('Failed to clear localStorage', error as Error);
    }
  },

  /**
   * Clean up old or unnecessary data to free storage space
   */
  cleanupOldData: (): void => {
    try {
      if (typeof window === 'undefined') {
        return;
      }

      const keysToRemove: string[] = [];
      const now = Date.now();
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

      // Look for keys that might contain timestamp data
      for (const key in window.localStorage) {
        if (window.localStorage.hasOwnProperty(key)) {
          try {
            const data = JSON.parse(window.localStorage[key]);

            // Check if data has a timestamp and is old
            if (data && typeof data === 'object') {
              const timestamp = data.createdAt || data.updatedAt || data.timestamp;
              if (timestamp && (now - new Date(timestamp).getTime()) > maxAge) {
                keysToRemove.push(key);
              }
            }
          } catch {
            // If we can't parse the data, it might be corrupted
            if (key.startsWith('temp_') || key.startsWith('cache_')) {
              keysToRemove.push(key);
            }
          }
        }
      }

      // Remove old keys
      keysToRemove.forEach(key => {
        try {
          window.localStorage.removeItem(key);
          console.log(`Cleaned up old localStorage key: ${key}`);
        } catch (error) {
          console.warn(`Failed to remove old key ${key}:`, error);
        }
      });

      console.log(`Cleaned up ${keysToRemove.length} old localStorage entries`);
    } catch (error) {
      console.error('Error during localStorage cleanup:', error);
    }
  },

  /**
   * Get storage usage statistics
   */
  getStorageStats: (): { used: number; available: number; percentage: number } => {
    try {
      const used = localStorageUtils.getStorageSize();
      const maxSize = 5 * 1024 * 1024; // 5MB typical limit
      const available = maxSize - used;
      const percentage = (used / maxSize) * 100;

      return { used, available, percentage };
    } catch {
      return { used: 0, available: 0, percentage: 0 };
    }
  },

  /**
   * Check if we're approaching storage limits
   */
  isStorageNearLimit: (): boolean => {
    const stats = localStorageUtils.getStorageStats();
    return stats.percentage > 80; // Warn when over 80% full
  }
};

/**
 * Custom hook for managing localStorage state with React
 * Provides automatic synchronization between React state and localStorage
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void, { error: LocalStorageError | null; isLoading: boolean }] {
  const [storedValue, setStoredValue] = useState<T>(defaultValue);
  const [error, setError] = useState<LocalStorageError | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use ref to store the default value to avoid dependency issues
  const defaultValueRef = useRef(defaultValue);
  defaultValueRef.current = defaultValue;

  // Initialize state from localStorage on mount
  useEffect(() => {
    try {
      setError(null);
      const value = localStorageUtils.getItem(key, defaultValueRef.current);
      console.log('💾 useLocalStorage - Loading from localStorage key:', key);
      console.log('💾 useLocalStorage - Loaded data:', value);
      setStoredValue(value);
    } catch (err) {
      console.error('💾 useLocalStorage - Error loading from localStorage:', err);
      setError(err as LocalStorageError);
      setStoredValue(defaultValueRef.current);
    } finally {
      setIsLoading(false);
    }
  }, [key]); // Remove defaultValue from dependencies

  // Update localStorage when state changes
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      setError(null);

      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;

      console.log('💾 useLocalStorage - Saving to localStorage key:', key);
      console.log('💾 useLocalStorage - Data being saved:', valueToStore);

      // Save to localStorage
      localStorageUtils.setItem(key, valueToStore);

      // Update React state
      setStoredValue(valueToStore);

      console.log('💾 useLocalStorage - Successfully saved to localStorage');
    } catch (err) {
      console.error('💾 useLocalStorage - Error saving to localStorage:', err);
      setError(err as LocalStorageError);

      // If storage fails, still update React state for immediate UI feedback
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
    }
  }, [key, storedValue]);

  return [storedValue, setValue, { error, isLoading }];
}

/**
 * Hook for managing multiple localStorage keys as a single state object
 */
export function useLocalStorageState<T extends Record<string, any>>(
  keyPrefix: string,
  initialState: T
): [T, (updates: Partial<T>) => void, { error: LocalStorageError | null; isLoading: boolean }] {
  const [state, setState] = useState<T>(initialState);
  const [error, setError] = useState<LocalStorageError | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use ref to store the initial state to avoid dependency issues
  const initialStateRef = useRef(initialState);
  initialStateRef.current = initialState;

  // Initialize state from localStorage on mount
  useEffect(() => {
    try {
      setError(null);
      const loadedState = { ...initialStateRef.current };

      for (const key in initialStateRef.current) {
        const storageKey = `${keyPrefix}_${key}`;
        loadedState[key] = localStorageUtils.getItem(storageKey, initialStateRef.current[key]);
      }

      setState(loadedState);
    } catch (err) {
      setError(err as LocalStorageError);
      setState(initialStateRef.current);
    } finally {
      setIsLoading(false);
    }
  }, [keyPrefix]); // Remove initialState from dependencies

  // Update multiple localStorage keys
  const updateState = useCallback((updates: Partial<T>) => {
    try {
      setError(null);

      // Update localStorage for each changed key
      for (const key in updates) {
        const storageKey = `${keyPrefix}_${key}`;
        localStorageUtils.setItem(storageKey, updates[key]);
      }

      // Update React state
      setState(prev => ({ ...prev, ...updates }));
    } catch (err) {
      setError(err as LocalStorageError);

      // If storage fails, still update React state for immediate UI feedback
      setState(prev => ({ ...prev, ...updates }));
    }
  }, [keyPrefix]);

  return [state, updateState, { error, isLoading }];
}