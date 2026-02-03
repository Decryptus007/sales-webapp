import React from 'react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from './LoadingSpinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingText,
    disabled,
    children,
    ...props
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-manipulation select-none';

    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500 active:bg-blue-800 active:scale-95',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500 active:bg-gray-300 active:scale-95',
      outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-500 active:bg-gray-100 active:scale-95',
      ghost: 'text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-500 active:bg-gray-200 active:scale-95',
      destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 active:bg-red-800 active:scale-95',
    };

    const sizes = {
      sm: 'h-8 px-3 text-sm min-w-[2rem]',
      md: 'h-10 px-4 text-sm min-w-[2.5rem] sm:h-10 sm:px-4',
      lg: 'h-12 px-6 text-base min-w-[3rem] sm:h-12 sm:px-6',
    };

    const spinnerSizes = {
      sm: 'xs' as const,
      md: 'sm' as const,
      lg: 'md' as const,
    };

    const spinnerColor = variant === 'primary' || variant === 'destructive' ? 'white' : 'primary';

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          loading && 'cursor-wait',
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <LoadingSpinner
            size={spinnerSizes[size]}
            color={spinnerColor}
            className="mr-2"
            aria-label="Loading"
          />
        )}
        <span className={cn(loading && 'transition-opacity duration-200', loading && 'opacity-75')}>
          {loading && loadingText ? loadingText : children}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };