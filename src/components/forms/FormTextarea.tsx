import React from 'react';
import { cn } from '@/lib/utils';
import { FormField } from './FormField';

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: string;
  label?: string;
  error?: string;
  helperText?: string;
  loading?: boolean;
}

const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ name, label, error, helperText, loading, className, ...props }, ref) => {
    return (
      <FormField
        label={label}
        error={error}
        helperText={helperText}
        required={props.required}
        className={className}
      >
        <textarea
          {...props}
          ref={ref}
          name={name}
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            className
          )}
          disabled={props.disabled || loading}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${name}-error` : helperText ? `${name}-helper` : undefined
          }
        />
      </FormField>
    );
  }
);

FormTextarea.displayName = 'FormTextarea';

export { FormTextarea };