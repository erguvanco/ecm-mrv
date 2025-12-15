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
        'flex flex-col sm:flex-row gap-2 mb-3',
        className
      )}
    >
      <div className="flex flex-1 gap-2">
        {onSearchChange && (
          <SearchInput
            value={searchValue}
            onValueChange={onSearchChange}
            placeholder={searchPlaceholder}
            className="w-full sm:max-w-[200px]"
            compact
          />
        )}
        {filters && filters.length > 0 && (
          <div className="flex gap-1.5">
            {filters.map((filter) => (
              <Select
                key={filter.id}
                value={filter.value || ''}
                onChange={(e) => filter.onChange?.(e.target.value)}
                className="w-auto min-w-[120px]"
                compact
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
      {actions && <div className="flex gap-1.5">{actions}</div>}
    </div>
  );
}
