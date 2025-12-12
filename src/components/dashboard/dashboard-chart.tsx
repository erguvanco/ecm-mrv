'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { TrendingUp } from 'lucide-react';

interface ChartDataPoint {
  month: string;
  feedstockDeliveries: number;
  biocharProduced: number;
  co2Sequestered: number;
}

interface SeriesConfig {
  key: keyof Omit<ChartDataPoint, 'month'>;
  label: string;
  color: string;
  unit: string;
}

const SERIES_CONFIG: SeriesConfig[] = [
  { key: 'feedstockDeliveries', label: 'Feedstock Deliveries', color: '#16a34a', unit: 't' },
  { key: 'biocharProduced', label: 'Biochar Produced', color: '#2563eb', unit: 't' },
  { key: 'co2Sequestered', label: 'CO₂e Sequestered', color: '#7c3aed', unit: 't' },
];

export function DashboardChart() {
  const searchParams = useSearchParams();
  const range = searchParams.get('range') || 'all';

  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>({
    feedstockDeliveries: true,
    biocharProduced: true,
    co2Sequestered: true,
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const url = range !== 'all'
          ? `/api/dashboard/chart-data?range=${range}`
          : '/api/dashboard/chart-data';
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch chart data');
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [range]);

  const toggleSeries = (key: string) => {
    setVisibleSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-[var(--muted)]">
              <TrendingUp className="h-4.5 w-4.5 text-[var(--muted-foreground)]" />
            </div>
            <CardTitle className="text-base font-medium">Activity Over Time</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <Spinner className="h-8 w-8" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-[var(--muted)]">
              <TrendingUp className="h-4.5 w-4.5 text-[var(--muted-foreground)]" />
            </div>
            <CardTitle className="text-base font-medium">Activity Over Time</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-[var(--muted-foreground)]">
            Failed to load chart data
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-[var(--muted)]">
              <TrendingUp className="h-4.5 w-4.5 text-[var(--muted-foreground)]" />
            </div>
            <CardTitle className="text-base font-medium">Activity Over Time</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-[var(--muted-foreground)]">
            No data available yet. Start by adding feedstock deliveries.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-[var(--muted)]">
              <TrendingUp className="h-4.5 w-4.5 text-[var(--muted-foreground)]" />
            </div>
            <CardTitle className="text-base font-medium">Activity Over Time</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            {SERIES_CONFIG.map((series) => (
              <button
                key={series.key}
                onClick={() => toggleSeries(series.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition-all border ${
                  visibleSeries[series.key]
                    ? 'bg-[var(--background)] border-[var(--border)]'
                    : 'bg-[var(--muted)] border-transparent opacity-50'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: series.color }}
                />
                {series.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                tickLine={{ stroke: 'var(--border)' }}
                axisLine={{ stroke: 'var(--border)' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                tickLine={{ stroke: 'var(--border)' }}
                axisLine={{ stroke: 'var(--border)' }}
                tickFormatter={(value) => `${value}t`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '0',
                  fontSize: '12px',
                }}
                labelStyle={{ fontWeight: 500, marginBottom: '4px' }}
                formatter={(value: number, name: string) => {
                  const series = SERIES_CONFIG.find((s) => s.key === name);
                  return [`${value.toFixed(2)}${series?.unit || ''}`, series?.label || name];
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                content={() => null} // Hide default legend since we have custom toggles
              />
              {SERIES_CONFIG.map((series) =>
                visibleSeries[series.key] ? (
                  <Line
                    key={series.key}
                    type="monotone"
                    dataKey={series.key}
                    name={series.key}
                    stroke={series.color}
                    strokeWidth={2}
                    dot={{ fill: series.color, strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                ) : null
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
