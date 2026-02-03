"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { Calendar } from "@/components/ui/Calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover"

export interface DatePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  error?: string
  label?: string
  required?: boolean
  id?: string
  name?: string
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  error,
  label,
  required,
  id,
  name,
}: DatePickerProps) {
  const inputId = id || `datepicker-${Math.random().toString(36).substring(2, 9)}`

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 block text-sm font-medium text-gray-700 touch-manipulation"
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <button
            id={inputId}
            className={cn(
              "inline-flex items-center justify-start w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-900 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] sm:min-h-[40px] h-10 font-normal text-left",
              !date && "text-gray-400",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500",
              disabled && "cursor-not-allowed opacity-50",
              className
            )}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : undefined}
          >
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="flex-1 truncate text-left">
              {date ? format(date, "PPP") : placeholder}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={onDateChange}
            disabled={(date) => disabled || date > new Date()}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-1 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
      {/* Hidden input for form compatibility */}
      <input
        type="hidden"
        name={name}
        value={date ? date.toISOString() : ''}
      />
    </div>
  )
}