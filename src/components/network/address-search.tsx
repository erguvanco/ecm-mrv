'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Input, Spinner } from '@/components/ui';
import { MapPin, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddressResult {
  address: string;
  coordinates: [number, number]; // [lng, lat]
}

interface Suggestion {
  id: string;
  placeName: string;
  coordinates: [number, number];
}

interface AddressSearchProps {
  value?: AddressResult | null;
  onChange: (result: AddressResult | null) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function AddressSearch({
  value,
  onChange,
  placeholder = 'Search for address...',
  error,
  disabled,
  className,
}: AddressSearchProps) {
  const [query, setQuery] = useState(value?.address || '');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Update query when value changes externally
  useEffect(() => {
    if (value?.address !== query) {
      setQuery(value?.address || '');
    }
  }, [value?.address]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchAddresses = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } catch (err) {
      console.error('Address search error:', err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    // Clear previous selection if user starts typing
    if (value) {
      onChange(null);
    }

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      searchAddresses(newQuery);
    }, 300);
  };

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    setQuery(suggestion.placeName);
    setSuggestions([]);
    setShowSuggestions(false);
    onChange({
      address: suggestion.placeName,
      coordinates: suggestion.coordinates,
    });
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    onChange(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <Input
          ref={inputRef}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn('pl-9 pr-8', error && 'border-red-500')}
        />
        {isLoading && (
          <Spinner className="absolute right-8 top-1/2 h-4 w-4 -translate-y-1/2" />
        )}
        {query && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded border bg-white shadow-lg">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className={cn(
                'flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--muted)]',
                index === selectedIndex && 'bg-[var(--muted)]'
              )}
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
              <span className="line-clamp-2">{suggestion.placeName}</span>
            </button>
          ))}
        </div>
      )}

      {/* Selected address confirmation */}
      {value && (
        <div className="mt-2 flex items-start gap-2 rounded border border-dashed p-2 text-sm">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
          <div className="flex-1">
            <p className="font-medium text-green-700">Location set</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {value.coordinates[1].toFixed(6)}, {value.coordinates[0].toFixed(6)}
            </p>
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
