import React from 'react';
import { Input, InputProps } from '@/components/ui/Input';
import { FormField } from './FormField';

export interface FormInputProps extends Omit<InputProps, 'error'> {
  name: string;
  label?: string;
  error?: string;
  helperText?: string;
  loading?: boolean;
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ name, label, error, helperText, loading, className, ...props }, ref) => {
    return (
      <FormField
        label={label}
        error={error}
        helperText={helperText}
        required={props.required}
        className={className}
      >
        <Input
          {...props}
          ref={ref}
          name={name}
          error={error}
          disabled={props.disabled || loading}
          aria-describedby={
            error ? `${name}-error` : helperText ? `${name}-helper` : undefined
          }
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg
              className="h-4 w-4 animate-spin text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
      </FormField>
    );
  }
);

FormInput.displayName = 'FormInput';

export { FormInput };