'use client';

import { useState, useMemo } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MapTimeFilterProps {
  selectedMonth: number; // 0-11
  selectedYear: number;
  onChange: (month: number, year: number) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function MapTimeFilter({ selectedMonth, selectedYear, onChange }: MapTimeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Generate available years (current year and 2 years back)
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const years = useMemo(() => {
    const yrs = [];
    for (let y = currentYear; y >= currentYear - 2; y--) {
      yrs.push(y);
    }
    return yrs;
  }, [currentYear]);

  // Get available months for a given year (don't show future months)
  const getAvailableMonths = (year: number) => {
    if (year < currentYear) {
      return MONTHS.map((name, index) => ({ name, index }));
    }
    // For current year, only show up to current month
    return MONTHS.slice(0, currentMonth + 1).map((name, index) => ({ name, index }));
  };

  const handleSelect = (month: number, year: number) => {
    onChange(month, year);
    setIsOpen(false);
  };

  const displayLabel = `${MONTHS[selectedMonth]} ${selectedYear}`;

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Calendar className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
        <span>{displayLabel}</span>
        <ChevronDown className={`h-3 w-3 text-[var(--muted-foreground)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-50 w-64 bg-[var(--background)] border border-[var(--border)] rounded-md shadow-lg p-3">
            {/* Year tabs */}
            <div className="flex gap-1 mb-3 border-b border-[var(--border)] pb-2">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => {
                    // When switching years, ensure selected month is valid
                    const availableMonths = getAvailableMonths(year);
                    const maxMonth = availableMonths[availableMonths.length - 1].index;
                    const newMonth = selectedMonth > maxMonth ? maxMonth : selectedMonth;
                    handleSelect(newMonth, year);
                  }}
                  className={`flex-1 py-1.5 text-sm rounded transition-colors ${
                    selectedYear === year
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)] font-medium'
                      : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>

            {/* Month grid */}
            <div className="grid grid-cols-3 gap-1">
              {getAvailableMonths(selectedYear).map(({ name, index }) => (
                <button
                  key={index}
                  onClick={() => handleSelect(index, selectedYear)}
                  className={`py-2 px-1 text-xs rounded transition-colors flex items-center justify-center gap-1 ${
                    selectedMonth === index && selectedYear === selectedYear
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)] font-medium'
                      : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
                  }`}
                >
                  <span>{name.slice(0, 3)}</span>
                  {selectedMonth === index && (
                    <Check className="h-3 w-3" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
