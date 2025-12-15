'use client';

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  isValid?: boolean;
  isOptional?: boolean;
}

interface WizardContextValue {
  steps: WizardStep[];
  currentStepIndex: number;
  currentStep: WizardStep;
  isFirstStep: boolean;
  isLastStep: boolean;
  progress: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
  goToStep: (index: number) => void;
  goNext: () => void;
  goPrevious: () => void;
  setStepValid: (stepId: string, isValid: boolean) => void;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
}

interface WizardProviderProps {
  children: ReactNode;
  steps: WizardStep[];
  currentStepIndex: number;
  onStepChange: (index: number) => void;
  onStepsUpdate?: (steps: WizardStep[]) => void;
}

export function WizardProvider({
  children,
  steps,
  currentStepIndex,
  onStepChange,
  onStepsUpdate,
}: WizardProviderProps) {
  const currentStep = steps[currentStepIndex] || steps[0];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const canGoNext = useMemo(() => {
    if (isLastStep) return false;
    const step = steps[currentStepIndex];
    return step?.isOptional || step?.isValid !== false;
  }, [currentStepIndex, isLastStep, steps]);

  const canGoPrevious = !isFirstStep;

  const goToStep = useCallback(
    (index: number) => {
      if (index >= 0 && index < steps.length) {
        // Check if all previous steps are valid when going forward
        if (index > currentStepIndex) {
          for (let i = currentStepIndex; i < index; i++) {
            const step = steps[i];
            if (!step.isOptional && step.isValid === false) {
              return; // Don't allow skipping invalid steps
            }
          }
        }
        onStepChange(index);
      }
    },
    [currentStepIndex, onStepChange, steps]
  );

  const goNext = useCallback(() => {
    if (canGoNext) {
      goToStep(currentStepIndex + 1);
    }
  }, [canGoNext, currentStepIndex, goToStep]);

  const goPrevious = useCallback(() => {
    if (canGoPrevious) {
      goToStep(currentStepIndex - 1);
    }
  }, [canGoPrevious, currentStepIndex, goToStep]);

  const setStepValid = useCallback(
    (stepId: string, isValid: boolean) => {
      if (onStepsUpdate) {
        const updatedSteps = steps.map((step) =>
          step.id === stepId ? { ...step, isValid } : step
        );
        onStepsUpdate(updatedSteps);
      }
    },
    [onStepsUpdate, steps]
  );

  const value = useMemo(
    () => ({
      steps,
      currentStepIndex,
      currentStep,
      isFirstStep,
      isLastStep,
      progress,
      canGoNext,
      canGoPrevious,
      goToStep,
      goNext,
      goPrevious,
      setStepValid,
    }),
    [
      steps,
      currentStepIndex,
      currentStep,
      isFirstStep,
      isLastStep,
      progress,
      canGoNext,
      canGoPrevious,
      goToStep,
      goNext,
      goPrevious,
      setStepValid,
    ]
  );

  return (
    <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
  );
}
