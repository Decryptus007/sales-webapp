"use client"

import * as React from "react"
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/Calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover"
import { useMediaQuery } from "@/hooks"

export interface DateRangePickerProps {
  dateRange?: DateRange
  onDateRangeChange?: (dateRange: DateRange | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  error?: string
  label?: string
  required?: boolean
  id?: string
  name?: string
  showPresets?: boolean
}

const dateRangePresets = [
  {
    label: "Today",
    getValue: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day
      return { from: today, to: today };
    }
  },
  {
    label: "Yesterday",
    getValue: () => {
      const yesterday = subDays(new Date(), 1);
      yesterday.setHours(0, 0, 0, 0);
      return { from: yesterday, to: yesterday };
    }
  },
  {
    label: "Last 7 days",
    getValue: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sevenDaysAgo = subDays(today, 6);
      return { from: sevenDaysAgo, to: today };
    }
  },
  {
    label: "Last 30 days",
    getValue: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thirtyDaysAgo = subDays(today, 29);
      return { from: thirtyDaysAgo, to: today };
    }
  },
  {
    label: "This week",
    getValue: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekStart = startOfWeek(today);
      return { from: weekStart, to: today };
    }
  },
  {
    label: "This month",
    getValue: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const monthStart = startOfMonth(today);
      return { from: monthStart, to: today };
    }
  }
];

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  placeholder = "Pick a date range",
  disabled = false,
  className,
  error,
  label,
  required,
  id,
  name,
  showPresets = true,
}: DateRangePickerProps) {
  const inputId = id || `daterangepicker-${Math.random().toString(36).substring(2, 9)}`
  const isMobile = useMediaQuery("(max-width: 768px)")

  const formatDateRange = (range?: DateRange) => {
    if (!range) return placeholder

    if (range.from) {
      if (range.to) {
        return `${format(range.from, "LLL dd, y")} - ${format(range.to, "LLL dd, y")}`
      } else {
        return format(range.from, "LLL dd, y")
      }
    }

    return placeholder
  }

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
              !dateRange && "text-gray-400",
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
              {formatDateRange(dateRange)}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "w-auto p-0",
            isMobile ? "max-w-[95vw]" : "max-w-none"
          )}
          align={isMobile ? "center" : "start"}
          side={isMobile ? "bottom" : "bottom"}
        >
          <div className={cn(
            "flex",
            isMobile ? "flex-col" : "flex-row"
          )}>
            {showPresets && !isMobile && (
              <div className="border-gray-200 border-r p-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Quick select</h4>
                  {dateRangePresets.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => onDateRangeChange?.(preset.getValue())}
                      className="w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors min-h-[36px] touch-manipulation"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="p-3">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={onDateRangeChange}
                numberOfMonths={isMobile ? 1 : 2}
                disabled={(date) => disabled || date > new Date()}
                className="p-0"
              />
            </div>
          </div>
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
      {/* Hidden inputs for form compatibility */}
      <input
        type="hidden"
        name={`${name}_from`}
        value={dateRange?.from ? dateRange.from.toISOString() : ''}
      />
      <input
        type="hidden"
        name={`${name}_to`}
        value={dateRange?.to ? dateRange.to.toISOString() : ''}
      />
    </div>
  )
}