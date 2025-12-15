'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from './input';

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onValueChange?: (value: string) => void;
  debounceMs?: number;
  compact?: boolean;
}

export function SearchInput({
  value: controlledValue,
  onValueChange,
  debounceMs = 300,
  placeholder = 'Search...',
  className,
  compact = false,
  ...props
}: SearchInputProps) {
  const [internalValue, setInternalValue] = React.useState(controlledValue || '');
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Sync with controlled value
  React.useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);

    if (onValueChange) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        onValueChange(newValue);
      }, debounceMs);
    }
  };

  const handleClear = () => {
    setInternalValue('');
    if (onValueChange) {
      onValueChange('');
    }
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={cn('relative', className)}>
      <Search className={cn(
        'absolute top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]',
        compact ? 'left-2 h-3.5 w-3.5' : 'left-3 h-4 w-4'
      )} />
      <Input
        type="text"
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          compact ? 'h-8 text-xs rounded-sm pl-7 pr-7' : 'pl-9 pr-9'
        )}
        {...props}
      />
      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors',
            compact ? 'right-2' : 'right-3'
          )}
          aria-label="Clear search"
        >
          <X className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        </button>
      )}
    </div>
  );
}
