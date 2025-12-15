import * as React from 'react';
import { cn } from '@/lib/utils';
import { Breadcrumbs, BreadcrumbItem } from '@/components/ui/breadcrumbs';
import { type LucideIcon } from 'lucide-react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  icon?: LucideIcon;
  iconColor?: string;
}

export function PageHeader({ title, description, action, breadcrumbs, icon: Icon, iconColor = 'text-[var(--muted-foreground)]' }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', iconColor.replace('text-', 'bg-').replace('-500', '-500/10'))}>
              <Icon className={cn('h-5 w-5', iconColor)} />
            </div>
          )}
          <div>
            <h1 className="font-logo text-2xl tracking-tight">{title}</h1>
            {description && (
              <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{description}</p>
            )}
          </div>
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
    </div>
  );
}
