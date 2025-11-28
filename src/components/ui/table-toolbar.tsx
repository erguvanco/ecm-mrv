'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { SearchInput } from './search-input';
import { Select } from './select';

export interface FilterOption {
  value: string;
  label: string;
}

export interface TableFilter {
  id: string;
  label: string;
  options: FilterOption[];
  value?: string;
  onChange?: (value: string) => void;
}

export interface TableToolbarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: TableFilter[];
  actions?: React.ReactNode;
  className?: string;
}

export function TableToolbar({
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  filters,
  actions,
  className,
}: TableToolbarProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row gap-3 mb-4',
        className
      )}
    >
      <div className="flex flex-1 gap-3">
        {onSearchChange && (
          <SearchInput
            value={searchValue}
            onValueChange={onSearchChange}
            placeholder={searchPlaceholder}
            className="w-full sm:max-w-xs"
          />
        )}
        {filters && filters.length > 0 && (
          <div className="flex gap-2">
            {filters.map((filter) => (
              <Select
                key={filter.id}
                value={filter.value || ''}
                onChange={(e) => filter.onChange?.(e.target.value)}
                className="w-auto min-w-[140px]"
              >
                <option value="">{filter.label}</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            ))}
          </div>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
