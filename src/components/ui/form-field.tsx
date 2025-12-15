import * as React from 'react';
import { cn } from '@/lib/utils';
import { Label } from './label';

export interface FormFieldProps {
  /** Unique ID for the field - used to connect label, input, and error */
  id: string;
  /** Label text displayed above the field */
  label: string;
  /** Whether the field is required */
  required?: boolean;
  /** Error message to display below the field */
  error?: string;
  /** Hint or help text displayed below the field (not shown if error is present) */
  hint?: string;
  /** The form input element(s) */
  children: React.ReactNode;
  /** Additional class name for the wrapper */
  className?: string;
}

/**
 * FormField provides an accessible wrapper for form inputs.
 * It connects the label to the input via htmlFor/id,
 * and error messages via aria-describedby for screen readers.
 *
 * Usage:
 * ```tsx
 * <FormField
 *   id="email"
 *   label="Email"
 *   required
 *   error={errors.email?.message}
 * >
 *   <Input
 *     id="email"
 *     type="email"
 *     error={!!errors.email}
 *     aria-describedby={errors.email ? 'email-error' : undefined}
 *     {...register('email')}
 *   />
 * </FormField>
 * ```
 */
export function FormField({
  id,
  label,
  required = false,
  error,
  hint,
  children,
  className,
}: FormFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  // Clone children to add aria-describedby if not already present
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      const childProps: Record<string, unknown> = {};

      // Add aria-describedby for accessibility
      const describedBy: string[] = [];
      if (error) describedBy.push(errorId);
      if (hint && !error) describedBy.push(hintId);

      if (describedBy.length > 0) {
        childProps['aria-describedby'] = describedBy.join(' ');
      }

      // Add aria-invalid for error state
      if (error) {
        childProps['aria-invalid'] = true;
      }

      // Only add if the child doesn't already have these props
      const existingProps = child.props as Record<string, unknown>;
      if (!existingProps['aria-describedby'] && childProps['aria-describedby']) {
        return React.cloneElement(child, childProps);
      }
    }
    return child;
  });

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {enhancedChildren}
      {error && (
        <p
          id={errorId}
          className="text-xs text-[var(--error)]"
          role="alert"
        >
          {error}
        </p>
      )}
      {hint && !error && (
        <p
          id={hintId}
          className="text-xs text-[var(--muted-foreground)]"
        >
          {hint}
        </p>
      )}
    </div>
  );
}
