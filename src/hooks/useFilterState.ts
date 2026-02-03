import { useState, useCallback, useEffect } from 'react';
import { FilterCriteria } from '@/types';
import { useLocalStorage } from './useLocalStorage';

const FILTER_STATE_KEY = 'invoice_filters';

// Default filter state
const DEFAULT_FILTERS: FilterCriteria = {};

/**
 * Custom hook for managing filter state with persistence
 * Provides filter state management with localStorage persistence
 */
export function useFilterState() {
  const [persistedFilters, setPersistedFilters] = useLocalStorage<FilterCriteria>(
    FILTER_STATE_KEY,
    DEFAULT_FILTERS
  );

  const [filters, setFilters] = useState<FilterCriteria>(persistedFilters);

  // Update persisted filters when filters change
  useEffect(() => {
    setPersistedFilters(filters);
  }, [filters, setPersistedFilters]);

  /**
   * Update filters and persist to localStorage
   */
  const updateFilters = useCallback((newFilters: FilterCriteria) => {
    setFilters(newFilters);
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  /**
   * Update specific filter property
   */
  const updateFilter = useCallback(<K extends keyof FilterCriteria>(
    key: K,
    value: FilterCriteria[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = useCallback(() => {
    return Boolean(
      filters.dateRange?.startDate ||
      filters.dateRange?.endDate ||
      (filters.paymentStatuses && filters.paymentStatuses.length > 0) ||
      (filters.searchTerm && filters.searchTerm.trim().length > 0)
    );
  }, [filters]);

  /**
   * Get count of active filters
   */
  const getActiveFilterCount = useCallback(() => {
    let count = 0;

    if (filters.dateRange?.startDate) count++;
    if (filters.dateRange?.endDate) count++;
    if (filters.paymentStatuses && filters.paymentStatuses.length > 0) count++;
    if (filters.searchTerm && filters.searchTerm.trim().length > 0) count++;

    return count;
  }, [filters]);

  /**
   * Validate date range filters
   */
  const validateDateRange = useCallback((startDate?: Date, endDate?: Date) => {
    const errors: string[] = [];

    if (startDate && endDate && startDate > endDate) {
      errors.push('Start date cannot be after end date');
    }

    if (startDate && startDate > new Date()) {
      errors.push('Start date cannot be in the future');
    }

    if (endDate && endDate > new Date()) {
      errors.push('End date cannot be in the future');
    }

    return errors;
  }, []);

  /**
   * Set date range with validation
   */
  const setDateRange = useCallback((startDate?: Date, endDate?: Date) => {
    const errors = validateDateRange(startDate, endDate);

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    updateFilter('dateRange', {
      startDate,
      endDate,
    });
  }, [updateFilter, validateDateRange]);

  return {
    filters,
    updateFilters,
    clearFilters,
    updateFilter,
    setDateRange,
    hasActiveFilters: hasActiveFilters(),
    activeFilterCount: getActiveFilterCount(),
    validateDateRange,
  };
}