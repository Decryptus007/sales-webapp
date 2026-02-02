import React from 'react';
import { cn } from '@/lib/utils';

export interface FormCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  error?: string;
  helperText?: string;
  loading?: boolean;
}

const FormCheckbox = React.forwardRef<HTMLInputElement, FormCheckboxProps>(
  ({ name, label, error, helperText, loading, className, ...props }, ref) => {
    const checkboxId = props.id || `checkbox-${name}`;

    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-start">
          <div className="flex h-5 items-center">
            <input
              {...props}
              ref={ref}
              type="checkbox"
              name={name}
              id={checkboxId}
              className={cn(
                'h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
                error && 'border-red-500 focus:ring-red-500',
                'cursor-pointer'
              )}
              disabled={props.disabled || loading}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={
                error ? `${name}-error` : helperText ? `${name}-helper` : undefined
              }
            />
          </div>
          <div className="ml-3">
            <label
              htmlFor={checkboxId}
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              {label}
              {props.required && <span className="ml-1 text-red-500">*</span>}
            </label>
            {helperText && !error && (
              <p
                id={`${name}-helper`}
                className="mt-1 text-sm text-gray-500"
              >
                {helperText}
              </p>
            )}
          </div>
        </div>
        {error && (
          <p
            id={`${name}-error`}
            className="text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormCheckbox.displayName = 'FormCheckbox';

export { FormCheckbox };