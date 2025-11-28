'use client';

import { useState, useCallback, useEffect } from 'react';
import { WizardStep } from './wizard-context';

interface UseWizardStateOptions {
  initialSteps: WizardStep[];
  storageKey?: string;
  initialData?: Record<string, unknown>;
}

interface WizardState<T = Record<string, unknown>> {
  currentStepIndex: number;
  data: T;
}

export function useWizardState<T extends Record<string, unknown>>({
  initialSteps,
  storageKey,
  initialData = {} as T,
}: UseWizardStateOptions) {
  const [steps, setSteps] = useState<WizardStep[]>(initialSteps);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [data, setData] = useState<T>(initialData as T);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed: WizardState<T> = JSON.parse(saved);
          setCurrentStepIndex(parsed.currentStepIndex);
          setData(parsed.data);
        }
      } catch {
        // Ignore parse errors
      }
    }
    setIsInitialized(true);
  }, [storageKey]);

  // Save to localStorage when state changes
  useEffect(() => {
    if (storageKey && isInitialized && typeof window !== 'undefined') {
      const state: WizardState<T> = {
        currentStepIndex,
        data,
      };
      localStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [storageKey, currentStepIndex, data, isInitialized]);

  const updateData = useCallback((updates: Partial<T>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetWizard = useCallback(() => {
    setCurrentStepIndex(0);
    setData(initialData as T);
    setSteps(initialSteps);
    if (storageKey && typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
  }, [initialData, initialSteps, storageKey]);

  const updateSteps = useCallback((updatedSteps: WizardStep[]) => {
    setSteps(updatedSteps);
  }, []);

  return {
    steps,
    currentStepIndex,
    data,
    isInitialized,
    setCurrentStepIndex,
    updateData,
    updateSteps,
    resetWizard,
  };
}
