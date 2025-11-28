'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import { useWizard } from './wizard-context';

interface WizardContentProps {
  children: ReactNode;
}

export function WizardContent({ children }: WizardContentProps) {
  const { currentStep } = useWizard();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{currentStep.title}</CardTitle>
        {currentStep.description && (
          <CardDescription>{currentStep.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
