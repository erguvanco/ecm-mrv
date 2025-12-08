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
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-500',
    defaultLabel: 'Complete',
  },
  pending: {
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
    defaultLabel: 'Pending',
  },
  draft: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    defaultLabel: 'Draft',
  },
  active: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    defaultLabel: 'Active',
  },
  retired: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
    defaultLabel: 'Retired',
  },
  error: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
    defaultLabel: 'Error',
  },
};

export function StatusBadge({ status, label, showDot = true, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const displayLabel = label || config.defaultLabel;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium',
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
