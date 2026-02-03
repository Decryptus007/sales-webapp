import { useState, useCallback, useRef, useEffect } from 'react';

export interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  progress?: number;
  message?: string;
}

export interface LoadingOptions {
  minDuration?: number; // Minimum loading duration in ms
  message?: string;
  showProgress?: boolean;
}

/**
 * Hook for managing loading states with optional minimum duration
 * and progress tracking
 */
export function useLoadingState(initialState: boolean = false) {
  const [state, setState] = useState<LoadingState>({
    isLoading: initialState,
    error: null,
    progress: undefined,
    message: undefined,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const setLoading = useCallback((
    loading: boolean,
    options: LoadingOptions = {}
  ) => {
    const { minDuration = 0, message, showProgress } = options;

    if (loading) {
      // Start loading
      startTimeRef.current = Date.now();
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        message,
        progress: showProgress ? 0 : undefined,
      }));
    } else {
      // Stop loading with minimum duration
      const elapsed = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
      const remaining = Math.max(0, minDuration - elapsed);

      if (remaining > 0) {
        timeoutRef.current = setTimeout(() => {
          setState(prev => ({
            ...prev,
            isLoading: false,
            progress: undefined,
            message: undefined,
          }));
        }, remaining);
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          progress: undefined,
          message: undefined,
        }));
      }
    }
  }, []);

  const setError = useCallback((error: Error | null) => {
    setState(prev => ({
      ...prev,
      error,
      isLoading: false,
      progress: undefined,
    }));
  }, []);

  const setProgress = useCallback((progress: number) => {
    setState(prev => ({
      ...prev,
      progress: Math.min(Math.max(progress, 0), 100),
    }));
  }, []);

  const setMessage = useCallback((message: string) => {
    setState(prev => ({
      ...prev,
      message,
    }));
  }, []);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setState({
      isLoading: false,
      error: null,
      progress: undefined,
      message: undefined,
    });
  }, []);

  return {
    ...state,
    setLoading,
    setError,
    setProgress,
    setMessage,
    reset,
  };
}

/**
 * Hook for managing multiple loading states
 */
export function useMultipleLoadingStates<T extends string>(
  keys: readonly T[]
): Record<T, LoadingState> & {
  setLoading: (key: T, loading: boolean, options?: LoadingOptions) => void;
  setError: (key: T, error: Error | null) => void;
  setProgress: (key: T, progress: number) => void;
  setMessage: (key: T, message: string) => void;
  reset: (key?: T) => void;
  isAnyLoading: boolean;
  hasAnyError: boolean;
} {
  const [states, setStates] = useState<Record<T, LoadingState>>(() =>
    keys.reduce((acc, key) => {
      acc[key] = {
        isLoading: false,
        error: null,
        progress: undefined,
        message: undefined,
      };
      return acc;
    }, {} as Record<T, LoadingState>)
  );

  const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});
  const startTimeRefs = useRef<Record<string, number>>({});

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  const setLoading = useCallback((
    key: T,
    loading: boolean,
    options: LoadingOptions = {}
  ) => {
    const { minDuration = 0, message, showProgress } = options;

    if (loading) {
      startTimeRefs.current[key] = Date.now();
      setStates(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          isLoading: true,
          error: null,
          message,
          progress: showProgress ? 0 : undefined,
        },
      }));
    } else {
      const elapsed = startTimeRefs.current[key] ? Date.now() - startTimeRefs.current[key] : 0;
      const remaining = Math.max(0, minDuration - elapsed);

      if (remaining > 0) {
        timeoutRefs.current[key] = setTimeout(() => {
          setStates(prev => ({
            ...prev,
            [key]: {
              ...prev[key],
              isLoading: false,
              progress: undefined,
              message: undefined,
            },
          }));
        }, remaining);
      } else {
        setStates(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            isLoading: false,
            progress: undefined,
            message: undefined,
          },
        }));
      }
    }
  }, []);

  const setError = useCallback((key: T, error: Error | null) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        error,
        isLoading: false,
        progress: undefined,
      },
    }));
  }, []);

  const setProgress = useCallback((key: T, progress: number) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        progress: Math.min(Math.max(progress, 0), 100),
      },
    }));
  }, []);

  const setMessage = useCallback((key: T, message: string) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        message,
      },
    }));
  }, []);

  const reset = useCallback((key?: T) => {
    if (key) {
      // Reset specific key
      if (timeoutRefs.current[key]) {
        clearTimeout(timeoutRefs.current[key]);
        delete timeoutRefs.current[key];
      }
      setStates(prev => ({
        ...prev,
        [key]: {
          isLoading: false,
          error: null,
          progress: undefined,
          message: undefined,
        },
      }));
    } else {
      // Reset all keys
      Object.values(timeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
      timeoutRefs.current = {};
      setStates(
        keys.reduce((acc, k) => {
          acc[k] = {
            isLoading: false,
            error: null,
            progress: undefined,
            message: undefined,
          };
          return acc;
        }, {} as Record<T, LoadingState>)
      );
    }
  }, [keys]);

  const isAnyLoading = (Object.values(states) as LoadingState[]).some(state => state.isLoading);
  const hasAnyError = (Object.values(states) as LoadingState[]).some(state => state.error !== null);

  return {
    ...states,
    setLoading,
    setError,
    setProgress,
    setMessage,
    reset,
    isAnyLoading,
    hasAnyError,
  };
}

/**
 * Hook for wrapping async operations with loading state
 */
export function useAsyncOperation<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  options: LoadingOptions = {}
) {
  const { isLoading, error, progress, message, setLoading, setError, setProgress, setMessage } = useLoadingState();

  const execute = useCallback(async (...args: T): Promise<R | null> => {
    try {
      setLoading(true, options);
      const result = await operation(...args);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err as Error);
      return null;
    }
  }, [operation, options, setLoading, setError]);

  return {
    execute,
    isLoading,
    error,
    progress,
    message,
    setProgress,
    setMessage,
  };
}

/**
 * Hook for managing form submission loading states
 */
export function useFormLoadingState() {
  const [states, setStates] = useState({
    isSubmitting: false,
    isValidating: false,
    isSaving: false,
    submitError: null as Error | null,
    validationError: null as Error | null,
  });

  const setSubmitting = useCallback((submitting: boolean) => {
    setStates(prev => ({
      ...prev,
      isSubmitting: submitting,
      submitError: submitting ? null : prev.submitError,
    }));
  }, []);

  const setValidating = useCallback((validating: boolean) => {
    setStates(prev => ({
      ...prev,
      isValidating: validating,
      validationError: validating ? null : prev.validationError,
    }));
  }, []);

  const setSaving = useCallback((saving: boolean) => {
    setStates(prev => ({
      ...prev,
      isSaving: saving,
    }));
  }, []);

  const setSubmitError = useCallback((error: Error | null) => {
    setStates(prev => ({
      ...prev,
      submitError: error,
      isSubmitting: false,
    }));
  }, []);

  const setValidationError = useCallback((error: Error | null) => {
    setStates(prev => ({
      ...prev,
      validationError: error,
      isValidating: false,
    }));
  }, []);

  const reset = useCallback(() => {
    setStates({
      isSubmitting: false,
      isValidating: false,
      isSaving: false,
      submitError: null,
      validationError: null,
    });
  }, []);

  const isAnyLoading = states.isSubmitting || states.isValidating || states.isSaving;

  return {
    ...states,
    setSubmitting,
    setValidating,
    setSaving,
    setSubmitError,
    setValidationError,
    reset,
    isAnyLoading,
  };
}