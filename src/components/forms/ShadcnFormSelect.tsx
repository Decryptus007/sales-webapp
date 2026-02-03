import React from 'react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/ShadcnSelect';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ShadcnFormSelectProps {
  name: string;
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ShadcnFormSelect({
  name,
  label,
  error,
  helperText,
  placeholder,
  options,
  value,
  onValueChange,
  required,
  disabled,
  className,
}: ShadcnFormSelectProps) {
  const selectId = `select-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label
          htmlFor={selectId}
          className="mb-2 block text-sm font-medium text-gray-700 touch-manipulation"
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          id={selectId}
          className={cn(
            error && "border-red-500 focus:border-red-500 focus:ring-red-500"
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
          }
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p
          id={`${selectId}-error`}
          className="mt-1 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
      {helperText && !error && (
        <p
          id={`${selectId}-helper`}
          className="mt-1 text-sm text-gray-500"
        >
          {helperText}
        </p>
      )}
    </div>
  );
}