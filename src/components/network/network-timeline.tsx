'use client';

import * as React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ArrowUp, ArrowDown, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MonthData {
  month: number;
  label: string;
  incoming: {
    count: number;
    tonnage: number;
  };
  production: {
    count: number;
    tonnage: number;
  };
  outgoing: {
    count: number;
    tonnage: number;
  };
}

interface TimelineData {
  year: number;
  months: MonthData[];
}

interface NetworkTimelineProps {
  selectedMonth: number;
  selectedYear: number;
  onMonthSelect: (month: number, year: number) => void;
}

const INCOMING_COLOR = '#16a34a';
const INCOMING_SELECTED = '#15803d';
const PRODUCTION_COLOR = '#2563eb';
const PRODUCTION_SELECTED = '#1d4ed8';
const OUTGOING_COLOR = '#7c3aed';
const OUTGOING_SELECTED = '#6d28d9';

interface TooltipPayload {
  dataKey: string;
  value: number;
  payload: MonthData;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-md px-2.5 py-2 text-xs shadow">
      <p className="font-medium mb-1">{label}</p>
      <div className="space-y-0.5 text-[var(--muted-foreground)]">
        <div><span className="text-[#16a34a]">{data.incoming.count}</span> in ({data.incoming.tonnage.toFixed(1)}t)</div>
        <div><span className="text-[#2563eb]">{data.production.count}</span> prod ({data.production.tonnage.toFixed(1)}t)</div>
        <div><span className="text-[#7c3aed]">{data.outgoing.count}</span> out ({data.outgoing.tonnage.toFixed(1)}t)</div>
      </div>
    </div>
  );
}

export function NetworkTimeline({
  selectedMonth,
  selectedYear,
  onMonthSelect,
}: NetworkTimelineProps) {
  const [data, setData] = React.useState<TimelineData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showYearDropdown, setShowYearDropdown] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();
  const availableYears = [currentYear, currentYear - 1, currentYear - 2];

  React.useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/network/timeline?year=${selectedYear}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch timeline data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [selectedYear]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowYearDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBarClick = (data: MonthData) => {
    onMonthSelect(data.month, selectedYear);
  };

  if (isLoading || !data) {
    return (
      <Card className="mb-4">
        <CardContent className="py-4">
          <div className="h-20 flex items-center justify-center text-[var(--muted-foreground)]">
            Loading timeline...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <ArrowUp className="h-3 w-3 text-[#16a34a]" />
              <span className="text-[var(--muted-foreground)]">Incoming</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Circle className="h-3 w-3 text-[#2563eb] fill-current" />
              <span className="text-[var(--muted-foreground)]">Production</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowDown className="h-3 w-3 text-[#7c3aed]" />
              <span className="text-[var(--muted-foreground)]">Outgoing</span>
            </div>
          </div>
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowYearDropdown(!showYearDropdown)}
            >
              {selectedYear}
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
            {showYearDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-10">
                {availableYears.map((year) => (
                  <button
                    key={year}
                    className={cn(
                      'block w-full px-4 py-2 text-sm text-left hover:bg-[var(--accent)]',
                      year === selectedYear && 'font-medium bg-[var(--accent)]'
                    )}
                    onClick={() => {
                      onMonthSelect(selectedMonth, year);
                      setShowYearDropdown(false);
                    }}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="h-20">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.months}
              margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
              barGap={1}
              barCategoryGap="15%"
            >
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--accent)', opacity: 0.3 }} />
              <Bar
                dataKey="incoming.count"
                radius={[2, 2, 0, 0]}
                onClick={(data) => handleBarClick(data as unknown as MonthData)}
                style={{ cursor: 'pointer' }}
              >
                {data.months.map((entry, index) => (
                  <Cell
                    key={`incoming-${index}`}
                    fill={index === selectedMonth ? INCOMING_SELECTED : INCOMING_COLOR}
                    stroke={index === selectedMonth ? '#000' : 'none'}
                    strokeWidth={index === selectedMonth ? 1 : 0}
                  />
                ))}
              </Bar>
              <Bar
                dataKey="production.count"
                radius={[2, 2, 0, 0]}
                onClick={(data) => handleBarClick(data as unknown as MonthData)}
                style={{ cursor: 'pointer' }}
              >
                {data.months.map((entry, index) => (
                  <Cell
                    key={`production-${index}`}
                    fill={index === selectedMonth ? PRODUCTION_SELECTED : PRODUCTION_COLOR}
                    stroke={index === selectedMonth ? '#000' : 'none'}
                    strokeWidth={index === selectedMonth ? 1 : 0}
                  />
                ))}
              </Bar>
              <Bar
                dataKey="outgoing.count"
                radius={[2, 2, 0, 0]}
                onClick={(data) => handleBarClick(data as unknown as MonthData)}
                style={{ cursor: 'pointer' }}
              >
                {data.months.map((entry, index) => (
                  <Cell
                    key={`outgoing-${index}`}
                    fill={index === selectedMonth ? OUTGOING_SELECTED : OUTGOING_COLOR}
                    stroke={index === selectedMonth ? '#000' : 'none'}
                    strokeWidth={index === selectedMonth ? 1 : 0}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
