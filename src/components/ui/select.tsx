'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  compact?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, compact = false, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            'flex w-full appearance-none border border-[var(--input)] bg-[var(--background)] ring-offset-[var(--background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--muted)]',
            compact
              ? 'h-8 text-xs rounded-sm px-2 py-1 pr-7'
              : 'h-10 text-sm rounded-[var(--radius)] px-3 py-2 pr-10',
            error && 'border-[var(--destructive)] focus-visible:ring-[var(--destructive)]',
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className={cn(
          'absolute top-1/2 -translate-y-1/2 opacity-50 pointer-events-none',
          compact ? 'right-2 h-3.5 w-3.5' : 'right-3 h-4 w-4'
        )} />
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Select };
