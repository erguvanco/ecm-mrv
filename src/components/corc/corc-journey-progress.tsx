'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  Building2,
  Leaf,
  Factory,
  ArrowDownToLine,
  Calendar,
  Award,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Icon lookup map for server-component compatibility
const iconMap: Record<string, LucideIcon> = {
  Building2,
  Leaf,
  Factory,
  ArrowDownToLine,
  Calendar,
  Award,
};

export interface CORCJourneyStage {
  id: string;
  label: string;
  icon?: LucideIcon;
  iconName?: string;
  completed: boolean;
  current?: boolean;
  href?: string;
  count?: number;
}

interface CORCJourneyProgressProps {
  stages: CORCJourneyStage[];
  variant?: 'default' | 'compact';
  className?: string;
}

export function CORCJourneyProgress({
  stages,
  variant = 'default',
  className,
}: CORCJourneyProgressProps) {
  if (variant === 'compact') {
    return <CompactProgress stages={stages} className={className} />;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1 py-3 px-4 bg-[var(--muted)]/30 rounded-lg overflow-x-auto',
        className
      )}
    >
      {stages.map((stage, index) => {
        // Support both direct icon prop and iconName string for server component compatibility
        const Icon = stage.icon || (stage.iconName ? iconMap[stage.iconName] : null);
        const isLast = index === stages.length - 1;

        const stageContent = (
          <div
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs transition-colors border',
              stage.current
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
                : stage.completed
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] border-transparent',
              stage.href && !stage.current && 'hover:bg-opacity-80 cursor-pointer'
            )}
          >
            {stage.completed ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <Circle className="h-3.5 w-3.5" />
            )}
            {Icon && <Icon className="h-3.5 w-3.5" />}
            <span className={cn('whitespace-nowrap', stage.current && 'font-medium')}>
              {stage.label}
            </span>
            {stage.count !== undefined && stage.count > 0 && (
              <span className="text-[10px] opacity-70 ml-0.5">({stage.count})</span>
            )}
          </div>
        );

        return (
          <React.Fragment key={stage.id}>
            {stage.href ? (
              <Link href={stage.href}>{stageContent}</Link>
            ) : (
              stageContent
            )}
            {!isLast && (
              <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] mx-0.5 flex-shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function CompactProgress({
  stages,
  className,
}: {
  stages: CORCJourneyStage[];
  className?: string;
}) {
  const completedCount = stages.filter((s) => s.completed).length;
  const progress = (completedCount / stages.length) * 100;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-[var(--muted)] rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-[var(--muted-foreground)] whitespace-nowrap">
          {completedCount}/{stages.length}
        </span>
      </div>

      {/* Stage dots with tooltips */}
      <div className="flex items-center justify-between">
        {stages.map((stage, index) => {
          // Support both direct icon prop and iconName string for server component compatibility
          const Icon = stage.icon || (stage.iconName ? iconMap[stage.iconName] : null);
          const isLast = index === stages.length - 1;

          const dot = (
            <div
              className={cn(
                'group relative flex items-center',
                stage.href && 'cursor-pointer'
              )}
            >
              <div
                className={cn(
                  'h-6 w-6 rounded-full flex items-center justify-center transition-colors',
                  stage.current
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : stage.completed
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                )}
              >
                {Icon && <Icon className="h-3 w-3" />}
              </div>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-[var(--foreground)] text-[var(--background)] text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {stage.label}
                {stage.completed && ' ✓'}
              </div>
            </div>
          );

          return (
            <React.Fragment key={stage.id}>
              {stage.href ? <Link href={stage.href}>{dot}</Link> : dot}
              {!isLast && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-1',
                    stages[index + 1]?.completed || stage.completed
                      ? 'bg-emerald-500/50'
                      : 'bg-[var(--border)]'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// Helper function to create default CORC journey stages
export function createCORCJourneyStages(options: {
  hasFacility: boolean;
  feedstockCount: number;
  productionCount: number;
  sequestrationCount: number;
  hasMonitoringPeriod: boolean;
  monitoringPeriodId?: string;
  corcStatus?: 'draft' | 'issued' | 'retired' | null;
}): CORCJourneyStage[] {
  const {
    Building2,
    Leaf,
    Factory,
    ArrowDownToLine,
    Calendar,
    Award,
  } = require('lucide-react');

  return [
    {
      id: 'facility',
      label: 'Facility',
      icon: Building2,
      completed: options.hasFacility,
      href: '/facility',
    },
    {
      id: 'feedstock',
      label: 'Feedstock',
      icon: Leaf,
      completed: options.feedstockCount > 0,
      count: options.feedstockCount,
      href: '/feedstock',
    },
    {
      id: 'production',
      label: 'Production',
      icon: Factory,
      completed: options.productionCount > 0,
      count: options.productionCount,
      href: '/production',
    },
    {
      id: 'sequestration',
      label: 'Sequestration',
      icon: ArrowDownToLine,
      completed: options.sequestrationCount > 0,
      count: options.sequestrationCount,
      href: '/sequestration',
    },
    {
      id: 'monitoring',
      label: 'Monitoring',
      icon: Calendar,
      completed: options.hasMonitoringPeriod,
      href: options.monitoringPeriodId
        ? `/monitoring/${options.monitoringPeriodId}`
        : '/monitoring',
    },
    {
      id: 'corc',
      label: 'CORC',
      icon: Award,
      completed: options.corcStatus === 'issued' || options.corcStatus === 'retired',
      href: '/corc',
    },
  ];
}
