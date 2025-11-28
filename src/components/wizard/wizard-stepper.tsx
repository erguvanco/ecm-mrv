'use client';

import { cn } from '@/lib/utils';
import { useWizard } from './wizard-context';

export function WizardStepper() {
  const { steps, currentStepIndex, goToStep } = useWizard();

  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isPast = index < currentStepIndex;
          const canNavigate = isPast || step.isValid !== false;

          return (
            <li
              key={step.id}
              className={cn(
                'relative flex-1',
                index !== steps.length - 1 && 'pr-8 sm:pr-20'
              )}
            >
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => canNavigate && goToStep(index)}
                  disabled={!canNavigate}
                  className={cn(
                    'relative flex h-10 w-10 items-center justify-center text-sm font-medium transition-colors',
                    isCompleted &&
                      'bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90',
                    isCurrent &&
                      'border-2 border-[var(--primary)] bg-white text-[var(--primary)]',
                    !isCompleted &&
                      !isCurrent &&
                      'border-2 border-gray-300 bg-white text-gray-500',
                    canNavigate && 'cursor-pointer',
                    !canNavigate && 'cursor-not-allowed opacity-50'
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </button>

                {index !== steps.length - 1 && (
                  <div
                    className={cn(
                      'absolute right-0 top-5 hidden h-0.5 w-full sm:block',
                      'left-10 -translate-y-1/2',
                      isCompleted ? 'bg-[var(--primary)]' : 'bg-gray-200'
                    )}
                    style={{ width: 'calc(100% - 2.5rem - 1rem)' }}
                  />
                )}
              </div>

              <div className="mt-2">
                <span
                  className={cn(
                    'text-sm font-medium',
                    isCurrent
                      ? 'text-[var(--primary)]'
                      : isCompleted
                        ? 'text-gray-900'
                        : 'text-gray-500'
                  )}
                >
                  {step.title}
                </span>
                {step.description && (
                  <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
                    {step.description}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
