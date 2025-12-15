import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-0.5 border px-1.5 py-0.5 text-[10px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 rounded',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-[var(--primary)] text-[var(--primary-foreground)]',
        secondary:
          'border-transparent bg-[var(--secondary)] text-[var(--secondary-foreground)]',
        destructive:
          'border-transparent bg-[var(--error-muted)] text-[var(--error-muted-foreground)]',
        outline: 'text-[var(--foreground)]',
        success:
          'border-transparent bg-[var(--success-muted)] text-[var(--success-muted-foreground)]',
        warning:
          'border-transparent bg-[var(--warning-muted)] text-[var(--warning-muted-foreground)]',
        info:
          'border-transparent bg-[var(--info-muted)] text-[var(--info-muted-foreground)]',
        // Status variants for workflows
        complete:
          'border-transparent bg-[var(--success-muted)] text-[var(--success-muted-foreground)]',
        pending:
          'border-transparent bg-[var(--pending-muted)] text-[var(--pending-muted-foreground)]',
        draft:
          'border-transparent bg-[var(--warning-muted)] text-[var(--warning-muted-foreground)]',
        active:
          'border-transparent bg-[var(--info-muted)] text-[var(--info-muted-foreground)]',
        retired:
          'border-transparent bg-[var(--purple-muted)] text-[var(--purple-muted-foreground)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
