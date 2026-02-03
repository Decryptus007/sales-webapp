"use client"

import React, { useState } from 'react';
import { DatePicker, DateRangePicker } from '@/components/ui';
import { DateRange } from 'react-day-picker';

export function DatePickerDemo() {
  const [singleDate, setSingleDate] = useState<Date | undefined>();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">shadcn/ui DatePicker Demo</h2>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">Single Date Picker</h3>
          <DatePicker
            date={singleDate}
            onDateChange={setSingleDate}
            label="Select a date"
            placeholder="Pick a date"
          />
          {singleDate && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {singleDate.toLocaleDateString()}
            </p>
          )}
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">Date Range Picker with Presets</h3>
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            label="Select date range"
            placeholder="Pick a date range"
            showPresets={true}
          />
          {dateRange && (
            <p className="mt-2 text-sm text-gray-600">
              Range: {dateRange.from?.toLocaleDateString()} - {dateRange.to?.toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}