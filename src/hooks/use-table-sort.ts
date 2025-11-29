import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig<T> {
  key: keyof T | string;
  direction: SortDirection;
}

export function useTableSort<T>(
  data: T[],
  defaultSort?: SortConfig<T>
) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(
    defaultSort || null
  );

  const handleSort = (key: keyof T | string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        // Cycle through: asc -> desc -> null
        if (current.direction === 'asc') {
          return { key, direction: 'desc' };
        } else if (current.direction === 'desc') {
          return null;
        }
      }
      return { key, direction: 'asc' };
    });
  };

  const sortedData = useMemo(() => {
    if (!sortConfig || !sortConfig.direction) {
      return data;
    }

    return [...data].sort((a, b) => {
      const key = sortConfig.key as string;

      // Handle nested keys (e.g., 'feedstockDelivery.date')
      const getValue = (obj: T, path: string): unknown => {
        return path.split('.').reduce((acc: unknown, part: string) => {
          if (acc && typeof acc === 'object' && part in acc) {
            return (acc as Record<string, unknown>)[part];
          }
          return undefined;
        }, obj);
      };

      let aValue = getValue(a, key);
      let bValue = getValue(b, key);

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
      if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1;

      // Handle dates
      if (
        typeof aValue === 'string' &&
        typeof bValue === 'string' &&
        !isNaN(Date.parse(aValue)) &&
        !isNaN(Date.parse(bValue))
      ) {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // Handle numbers
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }

      // Handle strings (case-insensitive)
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  return {
    sortedData,
    sortConfig,
    handleSort,
  };
}
