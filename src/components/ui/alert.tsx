import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const alertVariants = cva(
  'relative flex items-start gap-3 p-4 text-sm rounded-[var(--radius)]',
  {
    variants: {
      variant: {
        default: 'bg-[var(--muted)] text-[var(--foreground)]',
        success: 'bg-[var(--success-muted)] text-[var(--success-muted-foreground)] border border-[var(--success)]/20',
        error: 'bg-[var(--error-muted)] text-[var(--error-muted-foreground)] border border-[var(--error)]/20',
        warning: 'bg-[var(--warning-muted)] text-[var(--warning-muted-foreground)] border border-[var(--warning)]/20',
        info: 'bg-[var(--info-muted)] text-[var(--info-muted-foreground)] border border-[var(--info)]/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const iconMap = {
  default: Info,
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function Alert({
  className,
  variant = 'default',
  title,
  dismissible = false,
  onDismiss,
  children,
  ...props
}: AlertProps) {
  const Icon = iconMap[variant || 'default'];

  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {title && (
          <h5 className="font-medium mb-1">{title}</h5>
        )}
        <div className={title ? '' : 'leading-relaxed'}>{children}</div>
      </div>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 p-1 -m-1 hover:opacity-70 transition-opacity"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('font-medium leading-none tracking-tight', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

export const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';
