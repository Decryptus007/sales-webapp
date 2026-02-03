import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useLocalStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not cause infinite re-renders with object default values', () => {
    const defaultValue = { items: [] };

    // Mock localStorage to return null (no stored value)
    localStorageMock.getItem.mockReturnValue(null);

    const { result, rerender } = renderHook(() =>
      useLocalStorage('test-key', defaultValue)
    );

    // Initial render
    expect(result.current[0]).toEqual(defaultValue);
    expect(result.current[2].isLoading).toBe(false);

    // Rerender multiple times to ensure no infinite loop
    rerender();
    rerender();
    rerender();

    // Should still have the same value and not cause infinite renders
    expect(result.current[0]).toEqual(defaultValue);
    expect(localStorageMock.getItem).toHaveBeenCalledTimes(1); // Should only be called once
  });

  it('should not cause infinite re-renders with array default values', () => {
    const defaultValue: string[] = [];

    // Mock localStorage to return null (no stored value)
    localStorageMock.getItem.mockReturnValue(null);

    const { result, rerender } = renderHook(() =>
      useLocalStorage('test-array', defaultValue)
    );

    // Initial render
    expect(result.current[0]).toEqual(defaultValue);
    expect(result.current[2].isLoading).toBe(false);

    // Rerender multiple times to ensure no infinite loop
    rerender();
    rerender();
    rerender();

    // Should still have the same value and not cause infinite renders
    expect(result.current[0]).toEqual(defaultValue);
    expect(localStorageMock.getItem).toHaveBeenCalledTimes(1); // Should only be called once
  });

  it('should update localStorage when value changes', () => {
    const defaultValue = 'initial';

    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() =>
      useLocalStorage('test-update', defaultValue)
    );

    act(() => {
      result.current[1]('updated value');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-update', '"updated value"');
    expect(result.current[0]).toBe('updated value');
  });
});