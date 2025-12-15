'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface SectionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function SectionCard({
  title,
  description,
  icon: Icon,
  badge,
  collapsible = false,
  defaultCollapsed = false,
  className,
  children,
  ...props
}: SectionCardProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  return (
    <div
      className={cn(
        'border bg-[var(--card)] text-[var(--card-foreground)] shadow-sm',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'flex items-center gap-3 p-6 pb-4',
          collapsible && 'cursor-pointer select-none'
        )}
        onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
      >
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center bg-[var(--muted)]">
            <Icon className="h-4.5 w-4.5 text-[var(--muted-foreground)]" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-medium">{title}</h3>
            {badge}
          </div>
          {description && (
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
              {description}
            </p>
          )}
        </div>
        {collapsible && (
          <svg
            className={cn(
              'h-5 w-5 text-[var(--muted-foreground)] transition-transform',
              isCollapsed && '-rotate-90'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>
      {!isCollapsed && (
        <div className="px-6 pb-6">
          {children}
        </div>
      )}
    </div>
  );
}
