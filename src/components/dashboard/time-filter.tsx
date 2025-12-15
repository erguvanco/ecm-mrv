'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type TimeRange } from '@/lib/utils/date-range';

// Re-export for convenience
export { type TimeRange, getDateRange } from '@/lib/utils/date-range';

interface TimeOption {
  value: TimeRange;
  label: string;
  shortLabel: string;
}

const TIME_OPTIONS: TimeOption[] = [
  { value: 'all', label: 'All Time', shortLabel: 'All' },
  { value: '7d', label: 'Last 7 Days', shortLabel: '7D' },
  { value: '30d', label: 'Last 30 Days', shortLabel: '30D' },
  { value: '90d', label: 'Last 90 Days', shortLabel: '90D' },
  { value: '12m', label: 'Last 12 Months', shortLabel: '12M' },
  { value: 'ytd', label: 'Year to Date', shortLabel: 'YTD' },
];

interface TimeFilterProps {
  defaultValue?: TimeRange;
}

export function TimeFilter({ defaultValue = 'all' }: TimeFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const currentRange = (searchParams.get('range') as TimeRange) || defaultValue;
  const currentOption = TIME_OPTIONS.find(opt => opt.value === currentRange) || TIME_OPTIONS[0];

  const handleSelect = (value: TimeRange) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete('range');
    } else {
      params.set('range', value);
    }
    router.push(`/?${params.toString()}`);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Calendar className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
        <span>{currentOption.label}</span>
        <ChevronDown className={`h-3 w-3 text-[var(--muted-foreground)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-[var(--background)] border border-[var(--border)] rounded-md shadow-lg py-1">
            {TIME_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-[var(--muted)] transition-colors ${
                  currentRange === option.value ? 'text-[var(--foreground)] font-medium' : 'text-[var(--muted-foreground)]'
                }`}
              >
                <span>{option.label}</span>
                {currentRange === option.value && (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
