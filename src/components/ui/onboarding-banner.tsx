'use client';

import * as React from 'react';
import Link from 'next/link';
import { X, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface OnboardingStep {
  label: string;
  href: string;
  completed: boolean;
}

export interface OnboardingBannerProps {
  title?: string;
  description?: string;
  steps: OnboardingStep[];
  storageKey?: string;
  className?: string;
}

export function OnboardingBanner({
  title = 'Welcome to ECM MRV',
  description = 'Track your biochar carbon removal in 4 steps',
  steps,
  storageKey = 'dmrv-onboarding-dismissed',
  className,
}: OnboardingBannerProps) {
  const [isDismissed, setIsDismissed] = React.useState(true);

  React.useEffect(() => {
    const dismissed = localStorage.getItem(storageKey);
    setIsDismissed(dismissed === 'true');
  }, [storageKey]);

  const handleDismiss = () => {
    localStorage.setItem(storageKey, 'true');
    setIsDismissed(true);
  };

  if (isDismissed) {
    return null;
  }

  const completedCount = steps.filter((s) => s.completed).length;
  const nextStep = steps.find((s) => !s.completed);

  return (
    <div
      className={cn(
        'relative border bg-gradient-to-r from-[var(--card)] to-[var(--muted)] p-6',
        className
      )}
    >
      <button
        onClick={handleDismiss}
        className="absolute right-4 top-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="mb-4">
        <h2 className="font-logo text-xl">{title}</h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          {description}
        </p>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-3">
            {step.completed ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-[var(--muted-foreground)] flex-shrink-0" />
            )}
            <Link
              href={step.href}
              className={cn(
                'text-sm hover:underline',
                step.completed
                  ? 'text-[var(--muted-foreground)] line-through'
                  : 'text-[var(--foreground)] font-medium'
              )}
            >
              {step.label}
            </Link>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--muted-foreground)]">
          {completedCount} of {steps.length} steps complete
        </p>
        {nextStep && (
          <Link href={nextStep.href}>
            <Button size="sm">
              {nextStep.label}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
