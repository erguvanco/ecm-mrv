'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';

interface CalculationItem {
  label: string;
  value: number;
  type: 'positive' | 'negative';
  description?: string;
  formula?: string;
}

interface CalculationWaterfallProps {
  cStored: number | null;
  cBaseline: number | null;
  cLoss: number | null;
  eProject: number | null;
  eLeakage: number | null;
  netCORCs: number | null;
  persistenceFraction?: number | null;
  showFormula?: boolean;
  showDescriptions?: boolean;
  className?: string;
}

export function CalculationWaterfall({
  cStored,
  cBaseline,
  cLoss,
  eProject,
  eLeakage,
  netCORCs,
  persistenceFraction,
  showFormula = true,
  showDescriptions = true,
  className,
}: CalculationWaterfallProps) {
  const items: CalculationItem[] = [
    {
      label: 'C_stored',
      value: cStored ?? 0,
      type: 'positive',
      description: 'Carbon stored in biochar (before persistence)',
      formula: 'Biochar mass × C_org × 44/12',
    },
    {
      label: 'C_baseline',
      value: cBaseline ?? 0,
      type: 'negative',
      description: 'Baseline carbon from feedstock decomposition',
      formula: 'Based on feedstock type and iLUC risk',
    },
    {
      label: 'C_loss',
      value: cLoss ?? 0,
      type: 'negative',
      description: 'Carbon loss due to incomplete persistence',
      formula: 'C_stored × (1 - persistence_fraction)',
    },
    {
      label: 'E_project',
      value: eProject ?? 0,
      type: 'negative',
      description: 'Project emissions (energy, transport)',
      formula: 'Sum of all operational emissions',
    },
    {
      label: 'E_leakage',
      value: eLeakage ?? 0,
      type: 'negative',
      description: 'Leakage emissions outside project boundary',
      formula: 'Based on leakage assessment',
    },
  ];

  const maxValue = Math.max(cStored ?? 0, 1);

  // Calculate running total for waterfall effect
  let runningTotal = 0;
  const waterfallData = items.map((item) => {
    const startValue = runningTotal;
    if (item.type === 'positive') {
      runningTotal += item.value;
    } else {
      runningTotal -= item.value;
    }
    return {
      ...item,
      startValue,
      endValue: runningTotal,
    };
  });

  return (
    <div className={cn('space-y-4', className)}>
      {/* Formula */}
      {showFormula && (
        <div className="p-3 bg-[var(--muted)]/50 rounded text-sm font-mono text-center">
          CORCs = C_stored - C_baseline - C_loss - E_project - E_leakage
        </div>
      )}

      {/* Waterfall bars */}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="group">
            <div className="flex items-center gap-3">
              <span className="w-20 text-xs text-[var(--muted-foreground)] text-right font-mono">
                {item.label}
              </span>
              <div className="flex-1 h-7 bg-[var(--muted)]/30 rounded relative overflow-hidden">
                <div
                  className={cn(
                    'absolute top-0 h-full rounded transition-all duration-500',
                    item.type === 'positive' ? 'bg-emerald-500' : 'bg-red-400/70'
                  )}
                  style={{
                    width: `${Math.min((item.value / maxValue) * 100, 100)}%`,
                  }}
                />
                <span className="absolute inset-0 flex items-center px-2 text-xs font-medium">
                  {item.type === 'positive' ? '+' : '-'}
                  {item.value.toFixed(2)} tCO2e
                </span>
              </div>
              {showDescriptions && (
                <div className="relative">
                  <Info className="h-4 w-4 text-[var(--muted-foreground)] cursor-help" />
                  <div className="absolute right-0 top-full mt-1 w-56 p-2 bg-[var(--popover)] border border-[var(--border)] rounded shadow-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                    <p className="font-medium mb-1">{item.description}</p>
                    {item.formula && (
                      <p className="text-[var(--muted-foreground)] font-mono text-[10px]">
                        {item.formula}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Persistence info */}
      {persistenceFraction !== null && persistenceFraction !== undefined && (
        <div className="flex items-center justify-between py-2 px-3 bg-amber-500/5 border border-amber-500/20 rounded">
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-700">Persistence Fraction (BC+200)</span>
          </div>
          <span className="text-sm font-semibold text-amber-700">
            {persistenceFraction.toFixed(1)}%
          </span>
        </div>
      )}

      {/* Net result */}
      <div className="flex items-center justify-between pt-4 border-t-2 border-[var(--border)]">
        <div>
          <span className="font-semibold">Net CORCs</span>
          <p className="text-xs text-[var(--muted-foreground)]">
            CO₂ Removal Certificates
          </p>
        </div>
        <div className="text-right">
          <span
            className={cn(
              'text-2xl font-bold',
              (netCORCs ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
            )}
          >
            {netCORCs?.toFixed(2) ?? '0'}
          </span>
          <span className="text-sm text-[var(--muted-foreground)] ml-1">tCO2e</span>
        </div>
      </div>
    </div>
  );
}

// Compact version for dashboard
interface CompactCalculationSummaryProps {
  cStored: number | null;
  netCORCs: number | null;
  className?: string;
}

export function CompactCalculationSummary({
  cStored,
  netCORCs,
  className,
}: CompactCalculationSummaryProps) {
  const efficiency =
    cStored && netCORCs ? ((netCORCs / cStored) * 100).toFixed(0) : '—';

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="flex-1">
        <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] mb-1">
          <span>C_stored</span>
          <span>Net CORCs</span>
        </div>
        <div className="h-3 bg-[var(--muted)] rounded-full overflow-hidden relative">
          {cStored && netCORCs && (
            <>
              <div
                className="absolute top-0 left-0 h-full bg-emerald-500/30"
                style={{ width: '100%' }}
              />
              <div
                className="absolute top-0 left-0 h-full bg-emerald-500"
                style={{ width: `${(netCORCs / cStored) * 100}%` }}
              />
            </>
          )}
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="font-medium">{cStored?.toFixed(1) ?? '0'}</span>
          <span className="font-bold text-emerald-600">
            {netCORCs?.toFixed(1) ?? '0'}
          </span>
        </div>
      </div>
      <div className="text-center">
        <span className="text-2xl font-bold">{efficiency}</span>
        <span className="text-xs text-[var(--muted-foreground)]">%</span>
        <p className="text-[10px] text-[var(--muted-foreground)]">efficiency</p>
      </div>
    </div>
  );
}
