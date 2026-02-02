import React from 'react';
import { cn } from '@/lib/utils';

export interface FormGroupProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  error?: string;
}

const FormGroup: React.FC<FormGroupProps> = ({
  children,
  title,
  description,
  className,
  error,
}) => {
  return (
    <fieldset className={cn('space-y-4', className)}>
      {title && (
        <legend className="text-base font-medium text-gray-900">
          {title}
        </legend>
      )}
      {description && (
        <p className="text-sm text-gray-600">{description}</p>
      )}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </fieldset>
  );
};

export { FormGroup };