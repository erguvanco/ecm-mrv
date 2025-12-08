import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-[var(--primary)] text-[var(--primary-foreground)]',
        secondary:
          'border-transparent bg-[var(--secondary)] text-[var(--secondary-foreground)]',
        destructive:
          'border-transparent bg-red-100 text-red-800',
        outline: 'text-[var(--foreground)]',
        success:
          'border-transparent bg-green-100 text-green-800',
        warning:
          'border-transparent bg-amber-100 text-amber-800',
        info:
          'border-transparent bg-blue-100 text-blue-800',
        // Status variants for workflows
        complete:
          'border-transparent bg-green-100 text-green-800',
        pending:
          'border-transparent bg-gray-100 text-gray-600',
        draft:
          'border-transparent bg-yellow-100 text-yellow-800',
        active:
          'border-transparent bg-blue-100 text-blue-800',
        retired:
          'border-transparent bg-purple-100 text-purple-800',
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
