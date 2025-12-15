'use client';

import { Button, Spinner } from '@/components/ui';
import { useWizard } from './wizard-context';

interface WizardNavigationProps {
  onComplete?: () => void;
  isSubmitting?: boolean;
  completeLabel?: string;
}

export function WizardNavigation({
  onComplete,
  isSubmitting = false,
  completeLabel = 'Complete',
}: WizardNavigationProps) {
  const {
    isFirstStep,
    isLastStep,
    canGoNext,
    canGoPrevious,
    goNext,
    goPrevious,
    currentStep,
  } = useWizard();

  const handleNext = () => {
    if (isLastStep && onComplete) {
      onComplete();
    } else {
      goNext();
    }
  };

  return (
    <div className="mt-8 flex justify-between border-t pt-6">
      <Button
        type="button"
        variant="outline"
        onClick={goPrevious}
        disabled={!canGoPrevious || isSubmitting}
      >
        Previous
      </Button>

      <div className="flex gap-2">
        {currentStep?.isOptional && !isLastStep && (
          <Button
            type="button"
            variant="ghost"
            onClick={goNext}
            disabled={isSubmitting}
          >
            Skip
          </Button>
        )}

        <Button
          type="button"
          onClick={handleNext}
          disabled={(!canGoNext && !isLastStep) || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Saving...
            </>
          ) : isLastStep ? (
            completeLabel
          ) : (
            'Next'
          )}
        </Button>
      </div>
    </div>
  );
}
