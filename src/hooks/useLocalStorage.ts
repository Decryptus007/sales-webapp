import { useState, useEffect, useCallback } from 'react';

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
   * Safely set an item in localStorage with JSON serialization
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

      window.localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);

      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new StorageQuotaError(`Storage quota exceeded when writing to key "${key}"`);
      }

      throw new LocalStorageError(`Failed to write to localStorage for key "${key}"`, error as Error);
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

  // Initialize state from localStorage on mount
  useEffect(() => {
    try {
      setError(null);
      const value = localStorageUtils.getItem(key, defaultValue);
      setStoredValue(value);
    } catch (err) {
      setError(err as LocalStorageError);
      setStoredValue(defaultValue);
    } finally {
      setIsLoading(false);
    }
  }, [key, defaultValue]);

  // Update localStorage when state changes
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      setError(null);

      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;

      // Save to localStorage
      localStorageUtils.setItem(key, valueToStore);

      // Update React state
      setStoredValue(valueToStore);
    } catch (err) {
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

  // Initialize state from localStorage on mount
  useEffect(() => {
    try {
      setError(null);
      const loadedState = { ...initialState };

      for (const key in initialState) {
        const storageKey = `${keyPrefix}_${key}`;
        loadedState[key] = localStorageUtils.getItem(storageKey, initialState[key]);
      }

      setState(loadedState);
    } catch (err) {
      setError(err as LocalStorageError);
      setState(initialState);
    } finally {
      setIsLoading(false);
    }
  }, [keyPrefix, initialState]);

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