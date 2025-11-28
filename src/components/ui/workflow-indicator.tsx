import * as React from 'react';
import Link from 'next/link';
import { ChevronRight, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WorkflowStep {
  id: string;
  label: string;
  href: string;
  status: 'pending' | 'available' | 'complete';
  count?: number;
}

export interface WorkflowIndicatorProps {
  steps: WorkflowStep[];
  currentStep?: string;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function WorkflowIndicator({
  steps,
  currentStep,
  orientation = 'horizontal',
  className,
}: WorkflowIndicatorProps) {
  const getStatusIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'available':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      default:
        return <Circle className="h-5 w-5 text-[var(--muted-foreground)]" />;
    }
  };

  const getStatusStyles = (step: WorkflowStep, isCurrent: boolean) => {
    if (isCurrent) {
      return 'bg-[var(--primary)] text-[var(--primary-foreground)]';
    }
    switch (step.status) {
      case 'complete':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'available':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-[var(--muted)] text-[var(--muted-foreground)]';
    }
  };

  if (orientation === 'vertical') {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStep;
          return (
            <div key={step.id} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                {getStatusIcon(step.status)}
                {index < steps.length - 1 && (
                  <div className="w-px h-8 bg-[var(--border)] my-1" />
                )}
              </div>
              <Link
                href={step.href}
                className={cn(
                  'text-sm py-1 px-2 -mt-0.5 hover:bg-[var(--muted)] transition-colors',
                  isCurrent && 'font-medium'
                )}
              >
                {step.label}
                {step.count !== undefined && (
                  <span className="ml-2 text-xs text-[var(--muted-foreground)]">
                    ({step.count})
                  </span>
                )}
              </Link>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1 p-3 bg-[var(--muted)]/50 overflow-x-auto',
        className
      )}
    >
      {steps.map((step, index) => {
        const isCurrent = step.id === currentStep;
        return (
          <React.Fragment key={step.id}>
            <Link
              href={step.href}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 text-sm whitespace-nowrap transition-colors border',
                getStatusStyles(step, isCurrent),
                'hover:opacity-80'
              )}
            >
              {getStatusIcon(step.status)}
              <span className={isCurrent ? 'font-medium' : ''}>
                {step.label}
              </span>
              {step.count !== undefined && step.count > 0 && (
                <span
                  className={cn(
                    'text-xs px-1.5 py-0.5',
                    step.status === 'complete'
                      ? 'bg-green-200 text-green-800'
                      : step.status === 'available'
                        ? 'bg-amber-200 text-amber-800'
                        : 'bg-[var(--background)] text-[var(--muted-foreground)]'
                  )}
                >
                  {step.count}
                </span>
              )}
            </Link>
            {index < steps.length - 1 && (
              <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] flex-shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
