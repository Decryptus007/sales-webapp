import React, { useState, useEffect } from 'react';
import { FilterCriteria, PaymentStatus } from '@/types';
import { Button, DateRangePicker } from '@/components/ui';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

export interface FilterPanelProps {
  filters: FilterCriteria;
  onFiltersChange: (filters: FilterCriteria) => void;
  className?: string;
}

const paymentStatusOptions: { value: PaymentStatus; label: string; color: string }[] = [
  { value: 'Paid', label: 'Paid', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'Unpaid', label: 'Unpaid', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'Partially Paid', label: 'Partially Paid', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'Overdue', label: 'Overdue', color: 'bg-red-100 text-red-900 border-red-300' },
];

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (filters.dateRange?.startDate || filters.dateRange?.endDate) {
      return {
        from: filters.dateRange.startDate,
        to: filters.dateRange.endDate,
      };
    }
    return undefined;
  });
  const [dateError, setDateError] = useState<string>('');

  // Update local state when filters change externally
  useEffect(() => {
    if (filters.dateRange?.startDate || filters.dateRange?.endDate) {
      setDateRange({
        from: filters.dateRange.startDate,
        to: filters.dateRange.endDate,
      });
    } else {
      setDateRange(undefined);
    }
  }, [filters.dateRange?.startDate, filters.dateRange?.endDate]);

  const validateDateRange = (range?: DateRange): string => {
    if (!range?.from && !range?.to) return '';

    const now = new Date();
    now.setHours(23, 59, 59, 999); // End of today

    if (range.from && range.from > now) {
      return 'Start date cannot be in the future';
    }

    if (range.to && range.to > now) {
      return 'End date cannot be in the future';
    }

    if (range.from && range.to && range.from > range.to) {
      return 'Start date cannot be after end date';
    }

    return '';
  };

  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    setDateRange(newDateRange);

    const error = validateDateRange(newDateRange);
    setDateError(error);

    if (!error) {
      onFiltersChange({
        ...filters,
        dateRange: newDateRange ? {
          startDate: newDateRange.from,
          endDate: newDateRange.to,
        } : undefined,
      });
    }
  };

  const handlePaymentStatusToggle = (status: PaymentStatus) => {
    const currentStatuses = filters.paymentStatuses || [];
    const isSelected = currentStatuses.includes(status);

    let newStatuses: PaymentStatus[];
    if (isSelected) {
      newStatuses = currentStatuses.filter(s => s !== status);
    } else {
      newStatuses = [...currentStatuses, status];
    }

    onFiltersChange({
      ...filters,
      paymentStatuses: newStatuses.length > 0 ? newStatuses : undefined,
    });
  };

  const clearAllFilters = () => {
    setDateRange(undefined);
    setDateError('');
    onFiltersChange({});
  };

  const hasActiveFilters = Boolean(
    filters.dateRange?.startDate ||
    filters.dateRange?.endDate ||
    (filters.paymentStatuses && filters.paymentStatuses.length > 0)
  );

  const activeFilterCount = [
    filters.dateRange?.startDate,
    filters.dateRange?.endDate,
    filters.paymentStatuses && filters.paymentStatuses.length > 0 ? 'status' : null,
  ].filter(Boolean).length;

  // Get today's date for validation
  const today = new Date();

  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg shadow-sm', className)}>
      {/* Filter Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {activeFilterCount} active
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-gray-600 hover:text-gray-900"
            >
              Clear all
            </Button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded touch-manipulation min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center"
            aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
          >
            <svg
              className={cn('h-5 w-5 transition-transform', isExpanded && 'rotate-180')}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Date Range Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Date Range</h4>
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
              label="Select Date Range"
              placeholder="Pick a date range"
              error={dateError}
              disabled={false}
              className="w-full"
              showPresets={true}
            />
            {!dateError && (filters.dateRange?.startDate || filters.dateRange?.endDate) && (
              <div className="mt-2 text-sm text-gray-600">
                {filters.dateRange?.startDate && filters.dateRange?.endDate
                  ? `Showing invoices from ${filters.dateRange.startDate.toLocaleDateString()} to ${filters.dateRange.endDate.toLocaleDateString()}`
                  : filters.dateRange?.startDate
                    ? `Showing invoices from ${filters.dateRange.startDate.toLocaleDateString()} onwards`
                    : `Showing invoices up to ${filters.dateRange?.endDate?.toLocaleDateString()}`
                }
              </div>
            )}
          </div>

          {/* Payment Status Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Payment Status</h4>
            <div className="flex flex-wrap gap-2">
              {paymentStatusOptions.map((option) => {
                const isSelected = filters.paymentStatuses?.includes(option.value) || false;
                return (
                  <button
                    key={option.value}
                    onClick={() => handlePaymentStatusToggle(option.value)}
                    className={cn(
                      'inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                      isSelected
                        ? option.color
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    )}
                  >
                    {isSelected && (
                      <svg
                        className="mr-1.5 h-3 w-3"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {option.label}
                  </button>
                );
              })}
            </div>
            {filters.paymentStatuses && filters.paymentStatuses.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                Showing {filters.paymentStatuses.length} payment status
                {filters.paymentStatuses.length === 1 ? '' : 'es'}: {filters.paymentStatuses.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile: Always show active filters summary when collapsed */}
      {!isExpanded && hasActiveFilters && (
        <div className="p-4 bg-gray-50 border-t border-gray-200 md:hidden">
          <div className="text-sm text-gray-600">
            <div className="flex flex-wrap gap-2">
              {filters.dateRange?.startDate && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                  From: {filters.dateRange.startDate.toLocaleDateString()}
                </span>
              )}
              {filters.dateRange?.endDate && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                  To: {filters.dateRange.endDate.toLocaleDateString()}
                </span>
              )}
              {filters.paymentStatuses && filters.paymentStatuses.length > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                  Status: {filters.paymentStatuses.join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};