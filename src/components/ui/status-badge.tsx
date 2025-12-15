import * as React from 'react';
import { cn } from '@/lib/utils';

type StatusType = 'complete' | 'pending' | 'draft' | 'active' | 'retired' | 'error';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  showDot?: boolean;
  className?: string;
}

const statusConfig: Record<StatusType, { bg: string; text: string; dot: string; defaultLabel: string }> = {
  complete: {
    bg: 'bg-[var(--success-muted)]',
    text: 'text-[var(--success-muted-foreground)]',
    dot: 'bg-[var(--success)]',
    defaultLabel: 'Complete',
  },
  pending: {
    bg: 'bg-[var(--pending-muted)]',
    text: 'text-[var(--pending-muted-foreground)]',
    dot: 'bg-[var(--pending)]',
    defaultLabel: 'Pending',
  },
  draft: {
    bg: 'bg-[var(--warning-muted)]',
    text: 'text-[var(--warning-muted-foreground)]',
    dot: 'bg-[var(--warning)]',
    defaultLabel: 'Draft',
  },
  active: {
    bg: 'bg-[var(--info-muted)]',
    text: 'text-[var(--info-muted-foreground)]',
    dot: 'bg-[var(--info)]',
    defaultLabel: 'Active',
  },
  retired: {
    bg: 'bg-[var(--purple-muted)]',
    text: 'text-[var(--purple-muted-foreground)]',
    dot: 'bg-[var(--purple)]',
    defaultLabel: 'Retired',
  },
  error: {
    bg: 'bg-[var(--error-muted)]',
    text: 'text-[var(--error-muted-foreground)]',
    dot: 'bg-[var(--error)]',
    defaultLabel: 'Error',
  },
};

export function StatusBadge({ status, label, showDot = true, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const displayLabel = label || config.defaultLabel;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[var(--radius)]',
        config.bg,
        config.text,
        className
      )}
    >
      {showDot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      )}
      {displayLabel}
    </span>
  );
}
