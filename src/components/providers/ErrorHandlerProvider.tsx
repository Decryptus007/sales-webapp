'use client';

import React, { useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import { initializeErrorHandler } from '@/lib/errorHandler';

interface ErrorHandlerProviderProps {
  children: React.ReactNode;
}

export const ErrorHandlerProvider: React.FC<ErrorHandlerProviderProps> = ({ children }) => {
  const { addToast } = useToast();

  useEffect(() => {
    // Initialize the global error handler with toast integration
    initializeErrorHandler(addToast);
  }, [addToast]);

  return <>{children}</>;
};