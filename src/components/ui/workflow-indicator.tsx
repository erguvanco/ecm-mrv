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
  const getStatusIcon = (status: WorkflowStep['status'], isCurrent: boolean) => {
    const iconClass = isCurrent ? 'h-3 w-3' : 'h-3 w-3';
    switch (status) {
      case 'complete':
        return <CheckCircle2 className={cn(iconClass, isCurrent ? 'text-[var(--primary-foreground)]' : 'text-[var(--success)]')} />;
      case 'available':
        return <AlertCircle className={cn(iconClass, isCurrent ? 'text-[var(--primary-foreground)]' : 'text-[var(--warning)]')} />;
      default:
        return <Circle className={cn(iconClass, 'text-[var(--muted-foreground)]')} />;
    }
  };

  const getStatusStyles = (step: WorkflowStep, isCurrent: boolean) => {
    if (isCurrent) {
      return 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]';
    }
    switch (step.status) {
      case 'complete':
        return 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30 hover:bg-[var(--success)]/20';
      case 'available':
        return 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/30 hover:bg-[var(--warning)]/20';
      default:
        return 'bg-[var(--muted)] text-[var(--muted-foreground)] border-transparent hover:bg-[var(--muted)]/80';
    }
  };

  if (orientation === 'vertical') {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStep;
          return (
            <div key={step.id} className="flex items-start gap-2">
              <div className="flex flex-col items-center">
                {getStatusIcon(step.status, isCurrent)}
                {index < steps.length - 1 && (
                  <div className="w-px h-6 bg-[var(--border)] my-0.5" />
                )}
              </div>
              <Link
                href={step.href}
                className={cn(
                  'text-xs py-0.5 px-1.5 -mt-0.5 hover:bg-[var(--muted)] transition-colors rounded',
                  isCurrent && 'font-medium'
                )}
              >
                {step.label}
                {step.count !== undefined && (
                  <span className="ml-1 text-[10px] text-[var(--muted-foreground)]">
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
        'flex items-center gap-0.5 py-1.5 px-2 bg-[var(--muted)]/30 rounded overflow-x-auto',
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
                'flex items-center gap-1 px-2 py-1 text-xs whitespace-nowrap transition-colors border rounded',
                getStatusStyles(step, isCurrent)
              )}
            >
              {getStatusIcon(step.status, isCurrent)}
              <span className={isCurrent ? 'font-medium' : ''}>
                {step.label}
              </span>
              {step.count !== undefined && step.count > 0 && (
                <span className="text-[10px] opacity-70">
                  {step.count}
                </span>
              )}
            </Link>
            {index < steps.length - 1 && (
              <ChevronRight className="h-3 w-3 text-[var(--muted-foreground)] flex-shrink-0 mx-0.5" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
