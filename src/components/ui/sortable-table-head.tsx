'use client';

import * as React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SortDirection } from '@/hooks/use-table-sort';

interface SortableTableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortKey: string;
  currentSortKey: string | null;
  sortDirection: SortDirection;
  onSort: (key: string) => void;
  children: React.ReactNode;
}

export function SortableTableHead({
  sortKey,
  currentSortKey,
  sortDirection,
  onSort,
  children,
  className,
  ...props
}: SortableTableHeadProps) {
  const isActive = currentSortKey === sortKey;

  return (
    <th
      className={cn(
        'h-12 px-4 text-left align-middle font-medium text-[var(--muted-foreground)] cursor-pointer select-none hover:text-[var(--foreground)] transition-colors',
        isActive && 'text-[var(--foreground)]',
        className
      )}
      onClick={() => onSort(sortKey)}
      {...props}
    >
      <div className="flex items-center gap-1.5">
        <span>{children}</span>
        <span className="flex-shrink-0">
          {isActive && sortDirection === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : isActive && sortDirection === 'desc' ? (
            <ArrowDown className="h-3.5 w-3.5" />
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
          )}
        </span>
      </div>
    </th>
  );
}
