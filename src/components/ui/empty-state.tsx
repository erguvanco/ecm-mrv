import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'border bg-[var(--card)] p-12 text-center',
        className
      )}
    >
      {Icon && (
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center bg-[var(--muted)]">
          <Icon className="h-7 w-7 text-[var(--muted-foreground)]" />
        </div>
      )}
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="mt-2 text-sm text-[var(--muted-foreground)] max-w-md mx-auto">
        {description}
      </p>
      {(action || secondaryAction) && (
        <div className="mt-6 flex items-center justify-center gap-3">
          {action && (
            <Link href={action.href}>
              <Button>{action.label}</Button>
            </Link>
          )}
          {secondaryAction && (
            <Link href={secondaryAction.href}>
              <Button variant="outline">{secondaryAction.label}</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
