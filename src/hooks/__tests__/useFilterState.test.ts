import { renderHook, act } from '@testing-library/react';
import { useFilterState } from '../useFilterState';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('useFilterState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it('should initialize with empty filters', () => {
    const { result } = renderHook(() => useFilterState());

    expect(result.current.filters).toEqual({});
    expect(result.current.hasActiveFilters).toBe(false);
    expect(result.current.activeFilterCount).toBe(0);
  });

  it('should update filters and persist to localStorage', () => {
    const { result } = renderHook(() => useFilterState());

    const newFilters = {
      dateRange: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      },
      paymentStatuses: ['Paid' as const, 'Unpaid' as const],
    };

    act(() => {
      result.current.updateFilters(newFilters);
    });

    expect(result.current.filters).toEqual(newFilters);
    expect(result.current.hasActiveFilters).toBe(true);
    expect(result.current.activeFilterCount).toBe(3); // startDate, endDate, paymentStatuses
  });

  it('should clear all filters', () => {
    const { result } = renderHook(() => useFilterState());

    // Set some filters first
    act(() => {
      result.current.updateFilters({
        dateRange: { startDate: new Date('2024-01-01') },
        paymentStatuses: ['Paid'],
      });
    });

    expect(result.current.hasActiveFilters).toBe(true);

    // Clear filters
    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters).toEqual({});
    expect(result.current.hasActiveFilters).toBe(false);
    expect(result.current.activeFilterCount).toBe(0);
  });

  it('should validate date range and throw error for invalid dates', () => {
    const { result } = renderHook(() => useFilterState());

    const startDate = new Date('2024-12-31');
    const endDate = new Date('2024-01-01');

    expect(() => {
      result.current.validateDateRange(startDate, endDate);
    }).not.toThrow();

    const errors = result.current.validateDateRange(startDate, endDate);
    expect(errors).toContain('Start date cannot be after end date');
  });

  it('should set date range with validation', () => {
    const { result } = renderHook(() => useFilterState());

    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');

    act(() => {
      result.current.setDateRange(startDate, endDate);
    });

    expect(result.current.filters.dateRange).toEqual({
      startDate,
      endDate,
    });
  });

  it('should throw error when setting invalid date range', () => {
    const { result } = renderHook(() => useFilterState());

    const startDate = new Date('2024-12-31');
    const endDate = new Date('2024-01-01');

    expect(() => {
      act(() => {
        result.current.setDateRange(startDate, endDate);
      });
    }).toThrow('Start date cannot be after end date');
  });

  it('should update specific filter properties', () => {
    const { result } = renderHook(() => useFilterState());

    act(() => {
      result.current.updateFilter('paymentStatuses', ['Paid']);
    });

    expect(result.current.filters.paymentStatuses).toEqual(['Paid']);
    expect(result.current.hasActiveFilters).toBe(true);
    expect(result.current.activeFilterCount).toBe(1);
  });

  it('should handle search term in active filter count', () => {
    const { result } = renderHook(() => useFilterState());

    act(() => {
      result.current.updateFilter('searchTerm', 'test search');
    });

    expect(result.current.filters.searchTerm).toBe('test search');
    expect(result.current.hasActiveFilters).toBe(true);
    expect(result.current.activeFilterCount).toBe(1);
  });

  it('should not count empty search term as active filter', () => {
    const { result } = renderHook(() => useFilterState());

    act(() => {
      result.current.updateFilter('searchTerm', '   ');
    });

    expect(result.current.hasActiveFilters).toBe(false);
    expect(result.current.activeFilterCount).toBe(0);
  });
});