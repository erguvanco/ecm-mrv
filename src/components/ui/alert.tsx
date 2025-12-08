import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const alertVariants = cva(
  'relative flex items-start gap-3 p-4 text-sm',
  {
    variants: {
      variant: {
        default: 'bg-[var(--muted)] text-[var(--foreground)]',
        success: 'bg-green-50 text-green-800 border border-green-200',
        error: 'bg-red-50 text-red-800 border border-red-200',
        warning: 'bg-amber-50 text-amber-800 border border-amber-200',
        info: 'bg-blue-50 text-blue-800 border border-blue-200',
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
