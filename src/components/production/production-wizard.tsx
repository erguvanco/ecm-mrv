'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatDateTime, formatDateTimeShort } from '@/lib/utils';
import {
  WizardProvider,
  WizardStepper,
  WizardContent,
  WizardNavigation,
  useWizardState,
  WizardStep,
} from '@/components/wizard';
import {
  Input,
  Label,
  Select,
  Textarea,
  Card,
  CardContent,
  Badge,
  Button,
} from '@/components/ui';
import {
  productionStep1Schema,
  productionStep2Schema,
  productionStep3Schema,
  productionStep4Schema,
  productionStep5Schema,
  PRODUCTION_WIZARD_STEPS,
  FeedstockAllocation,
} from '@/lib/validations/production';
import { Plus, X } from 'lucide-react';

interface FeedstockOption {
  id: string;
  date: string | Date;
  feedstockType: string;
  weightTonnes: number | null;
}

interface ProductionWizardProps {
  feedstockOptions: FeedstockOption[];
  initialData?: ProductionWizardData;
  batchId?: string;
}

export interface ProductionWizardData {
  [key: string]: unknown;
  productionDate?: Date | string;
  feedstockDeliveryId?: string | null; // Deprecated
  feedstockAllocations?: FeedstockAllocation[];
  inputFeedstockWeightTonnes?: number;
  outputBiocharWeightTonnes?: number;
  temperatureMin?: number | null;
  temperatureMax?: number | null;
  temperatureAvg?: number | null;
  notes?: string | null;
}

const initialSteps: WizardStep[] = PRODUCTION_WIZARD_STEPS.map((step) => ({
  id: String(step.id),
  title: step.title,
  description: step.description,
  isValid: step.id === 1 ? undefined : false,
}));

export function ProductionWizard({
  feedstockOptions,
  initialData,
  batchId,
}: ProductionWizardProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    steps,
    currentStepIndex,
    data,
    setCurrentStepIndex,
    updateData,
    updateSteps,
    resetWizard,
    isInitialized,
  } = useWizardState<ProductionWizardData>({
    initialSteps,
    storageKey: batchId ? undefined : 'production-wizard',
    initialData: initialData || {},
  });

  // Local state for feedstock allocations
  const [allocations, setAllocations] = useState<FeedstockAllocation[]>(
    data.feedstockAllocations || []
  );

  // Step 1 form
  const step1Form = useForm({
    resolver: zodResolver(productionStep1Schema),
    defaultValues: {
      productionDate: data.productionDate
        ? new Date(data.productionDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      feedstockDeliveryId: data.feedstockDeliveryId || '',
      feedstockAllocations: data.feedstockAllocations || [],
    },
  });

  // Feedstock allocation handlers
  const addAllocation = useCallback(() => {
    const availableOptions = feedstockOptions.filter(
      (opt) => !allocations.some((a) => a.feedstockDeliveryId === opt.id)
    );
    if (availableOptions.length > 0) {
      setAllocations((prev) => [
        ...prev,
        { feedstockDeliveryId: availableOptions[0].id, percentageUsed: 100 },
      ]);
    }
  }, [feedstockOptions, allocations]);

  const removeAllocation = useCallback((index: number) => {
    setAllocations((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateAllocation = useCallback(
    (index: number, field: keyof FeedstockAllocation, value: string | number) => {
      setAllocations((prev) =>
        prev.map((a, i) =>
          i === index
            ? {
                ...a,
                [field]: field === 'percentageUsed' ? Number(value) : value,
              }
            : a
        )
      );
    },
    []
  );

  // Calculate total allocated weight from selected feedstocks
  const calculateTotalAllocatedWeight = useCallback(() => {
    return allocations.reduce((total, allocation) => {
      const feedstock = feedstockOptions.find(
        (f) => f.id === allocation.feedstockDeliveryId
      );
      if (feedstock?.weightTonnes) {
        return total + (feedstock.weightTonnes * allocation.percentageUsed) / 100;
      }
      return total;
    }, 0);
  }, [allocations, feedstockOptions]);

  // Step 2 form
  const step2Form = useForm({
    resolver: zodResolver(productionStep2Schema),
    defaultValues: {
      inputFeedstockWeightTonnes: data.inputFeedstockWeightTonnes || '',
    },
  });

  // Step 3 form
  const step3Form = useForm({
    resolver: zodResolver(productionStep3Schema),
    defaultValues: {
      outputBiocharWeightTonnes: data.outputBiocharWeightTonnes || '',
    },
  });

  // Step 4 form
  const step4Form = useForm({
    resolver: zodResolver(productionStep4Schema),
    defaultValues: {
      temperatureMin: data.temperatureMin || '',
      temperatureMax: data.temperatureMax || '',
      temperatureAvg: data.temperatureAvg || '',
    },
  });

  // Step 5 form
  const step5Form = useForm({
    resolver: zodResolver(productionStep5Schema),
    defaultValues: {
      notes: data.notes || '',
    },
  });

  // Track previous validation state to prevent infinite loops
  const prevValidationRef = useRef<{ step1: boolean; step2: boolean; step3: boolean } | null>(null);

  // Validate steps when data changes
  useEffect(() => {
    if (!isInitialized) return;

    const step1Valid = !!data.productionDate;
    const step2Valid = data.inputFeedstockWeightTonnes != null && Number(data.inputFeedstockWeightTonnes) > 0;
    const step3Valid = data.outputBiocharWeightTonnes != null && Number(data.outputBiocharWeightTonnes) > 0;

    const prev = prevValidationRef.current;

    // Only update if validation status has actually changed
    if (
      !prev ||
      step1Valid !== prev.step1 ||
      step2Valid !== prev.step2 ||
      step3Valid !== prev.step3
    ) {
      prevValidationRef.current = { step1: step1Valid, step2: step2Valid, step3: step3Valid };

      const newSteps = steps.map((step) => {
        if (step.id === '1') return { ...step, isValid: step1Valid };
        if (step.id === '2') return { ...step, isValid: step2Valid };
        if (step.id === '3') return { ...step, isValid: step3Valid };
        if (step.id === '4') return { ...step, isValid: true, isOptional: true };
        if (step.id === '5') return { ...step, isValid: true, isOptional: true };
        return step;
      });
      updateSteps(newSteps);
    }
  }, [data.productionDate, data.inputFeedstockWeightTonnes, data.outputBiocharWeightTonnes, isInitialized, steps, updateSteps]);

  const handleStepChange = (newIndex: number) => {
    // Save current step data before changing
    if (currentStepIndex === 0) {
      const formData = step1Form.getValues();
      updateData({
        productionDate: formData.productionDate,
        feedstockDeliveryId: formData.feedstockDeliveryId || null,
        feedstockAllocations: allocations.length > 0 ? allocations : undefined,
      });
    } else if (currentStepIndex === 1) {
      const formData = step2Form.getValues();
      updateData({
        inputFeedstockWeightTonnes: Number(formData.inputFeedstockWeightTonnes),
      });
    } else if (currentStepIndex === 2) {
      const formData = step3Form.getValues();
      updateData({
        outputBiocharWeightTonnes: Number(formData.outputBiocharWeightTonnes),
      });
    } else if (currentStepIndex === 3) {
      const formData = step4Form.getValues();
      updateData({
        temperatureMin: formData.temperatureMin ? Number(formData.temperatureMin) : null,
        temperatureMax: formData.temperatureMax ? Number(formData.temperatureMax) : null,
        temperatureAvg: formData.temperatureAvg ? Number(formData.temperatureAvg) : null,
      });
    } else if (currentStepIndex === 4) {
      const formData = step5Form.getValues();
      updateData({ notes: formData.notes || null });
    }

    setCurrentStepIndex(newIndex);
  };

  const handleComplete = async () => {
    // Collect all data
    const step5Data = step5Form.getValues();
    const finalData = {
      ...data,
      feedstockAllocations: allocations.length > 0 ? allocations : undefined,
      notes: step5Data.notes || null,
      status: 'complete',
      wizardStep: 5,
    };

    setIsSubmitting(true);
    setError(null);

    try {
      const url = batchId ? `/api/production/${batchId}` : '/api/production';
      const method = batchId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to save production batch');
      }

      resetWizard();
      router.push('/production');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isInitialized) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const renderStep = () => {
    switch (currentStepIndex) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productionDate">Production Date *</Label>
              <Input
                id="productionDate"
                type="date"
                {...step1Form.register('productionDate')}
              />
              {step1Form.formState.errors.productionDate && (
                <p className="text-sm text-red-500">
                  {step1Form.formState.errors.productionDate.message}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Link to Feedstock Deliveries</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAllocation}
                  disabled={allocations.length >= feedstockOptions.length}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Feedstock
                </Button>
              </div>

              {allocations.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)] py-3 text-center border border-dashed rounded-md">
                  No feedstock deliveries linked. Click &quot;Add Feedstock&quot; to allocate deliveries to this batch.
                </p>
              ) : (
                <div className="space-y-3">
                  {allocations.map((allocation, index) => {
                    const selectedFeedstock = feedstockOptions.find(
                      (f) => f.id === allocation.feedstockDeliveryId
                    );
                    const allocatedWeight = selectedFeedstock?.weightTonnes
                      ? (selectedFeedstock.weightTonnes * allocation.percentageUsed) / 100
                      : 0;

                    return (
                      <Card key={index} className="border-[var(--border)]">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 space-y-3">
                              <div className="space-y-1.5">
                                <Label className="text-xs">Feedstock Delivery</Label>
                                <Select
                                  value={allocation.feedstockDeliveryId}
                                  onChange={(e) =>
                                    updateAllocation(index, 'feedstockDeliveryId', e.target.value)
                                  }
                                >
                                  {feedstockOptions.map((fs) => {
                                    const isUsed = allocations.some(
                                      (a, i) => i !== index && a.feedstockDeliveryId === fs.id
                                    );
                                    return (
                                      <option key={fs.id} value={fs.id} disabled={isUsed}>
                                        {formatDateTime(fs.date)} – {fs.feedstockType}
                                        {fs.weightTonnes ? ` (${fs.weightTonnes}t)` : ''}
                                        {isUsed ? ' (already selected)' : ''}
                                      </option>
                                    );
                                  })}
                                </Select>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex-1 space-y-1.5">
                                  <Label className="text-xs">Percentage Used</Label>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      min="0.01"
                                      max="100"
                                      step="0.1"
                                      value={allocation.percentageUsed}
                                      onChange={(e) =>
                                        updateAllocation(index, 'percentageUsed', e.target.value)
                                      }
                                      className="w-24"
                                    />
                                    <span className="text-sm text-[var(--muted-foreground)]">%</span>
                                  </div>
                                </div>
                                {allocatedWeight > 0 && (
                                  <div className="text-right">
                                    <p className="text-xs text-[var(--muted-foreground)]">Allocated</p>
                                    <p className="text-sm font-medium">{allocatedWeight.toFixed(2)}t</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAllocation(index)}
                              className="h-8 w-8 p-0 text-[var(--muted-foreground)] hover:text-red-500"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {/* Total allocated weight summary */}
                  <div className="flex justify-between items-center pt-2 border-t border-[var(--border)]">
                    <span className="text-sm text-[var(--muted-foreground)]">
                      Total Allocated Weight
                    </span>
                    <Badge variant="secondary" className="text-sm">
                      {calculateTotalAllocatedWeight().toFixed(2)} tonnes
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inputFeedstockWeightTonnes">
                Input Feedstock Weight (tonnes) *
              </Label>
              <Input
                id="inputFeedstockWeightTonnes"
                type="number"
                step="0.01"
                {...step2Form.register('inputFeedstockWeightTonnes')}
              />
              {step2Form.formState.errors.inputFeedstockWeightTonnes && (
                <p className="text-sm text-red-500">
                  {step2Form.formState.errors.inputFeedstockWeightTonnes.message}
                </p>
              )}
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              Enter the total weight of feedstock input for this production
              batch.
            </p>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="outputBiocharWeightTonnes">
                Output Biochar Weight (tonnes) *
              </Label>
              <Input
                id="outputBiocharWeightTonnes"
                type="number"
                step="0.01"
                {...step3Form.register('outputBiocharWeightTonnes')}
              />
              {step3Form.formState.errors.outputBiocharWeightTonnes && (
                <p className="text-sm text-red-500">
                  {step3Form.formState.errors.outputBiocharWeightTonnes.message}
                </p>
              )}
            </div>
            {data.inputFeedstockWeightTonnes && (
              <p className="text-sm text-[var(--muted-foreground)]">
                Input weight: {data.inputFeedstockWeightTonnes} tonnes. Typical
                conversion rates are 20-30%.
              </p>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-[var(--muted-foreground)]">
              Temperature data is optional but helps with quality tracking.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="temperatureMin">Min Temperature (°C)</Label>
                <Input
                  id="temperatureMin"
                  type="number"
                  step="1"
                  {...step4Form.register('temperatureMin')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperatureMax">Max Temperature (°C)</Label>
                <Input
                  id="temperatureMax"
                  type="number"
                  step="1"
                  {...step4Form.register('temperatureMax')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperatureAvg">Avg Temperature (°C)</Label>
                <Input
                  id="temperatureAvg"
                  type="number"
                  step="1"
                  {...step4Form.register('temperatureAvg')}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...step5Form.register('notes')}
                placeholder="Any additional notes about this production batch..."
                rows={3}
              />
            </div>

            <Card>
              <CardContent className="pt-6">
                <h4 className="font-medium mb-4">Summary</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">
                      Production Date
                    </span>
                    <span>
                      {data.productionDate
                        ? formatDateTime(data.productionDate)
                        : '-'}
                    </span>
                  </div>

                  {/* Feedstock Allocations */}
                  {allocations.length > 0 && (
                    <div className="pt-2 border-t border-[var(--border)] mt-2">
                      <span className="text-[var(--muted-foreground)] block mb-2">
                        Feedstock Sources ({allocations.length})
                      </span>
                      <div className="space-y-1.5 ml-2">
                        {allocations.map((allocation, idx) => {
                          const fs = feedstockOptions.find(
                            (f) => f.id === allocation.feedstockDeliveryId
                          );
                          if (!fs) return null;
                          const allocWeight = fs.weightTonnes
                            ? (fs.weightTonnes * allocation.percentageUsed) / 100
                            : 0;
                          return (
                            <div key={idx} className="flex justify-between text-xs">
                              <span>
                                {formatDateTimeShort(fs.date)} – {fs.feedstockType}
                              </span>
                              <span>
                                {allocation.percentageUsed}% ({allocWeight.toFixed(2)}t)
                              </span>
                            </div>
                          );
                        })}
                        <div className="flex justify-between text-xs font-medium pt-1 border-t border-[var(--border)]">
                          <span>Total Allocated</span>
                          <span>{calculateTotalAllocatedWeight().toFixed(2)} tonnes</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-2 border-t border-[var(--border)] mt-2">
                    <span className="text-[var(--muted-foreground)]">
                      Input Weight
                    </span>
                    <span>
                      {data.inputFeedstockWeightTonnes
                        ? `${data.inputFeedstockWeightTonnes} tonnes`
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">
                      Output Weight
                    </span>
                    <span>
                      {data.outputBiocharWeightTonnes
                        ? `${data.outputBiocharWeightTonnes} tonnes`
                        : '-'}
                    </span>
                  </div>
                  {data.inputFeedstockWeightTonnes &&
                    data.outputBiocharWeightTonnes && (
                      <div className="flex justify-between">
                        <span className="text-[var(--muted-foreground)]">
                          Conversion Rate
                        </span>
                        <Badge variant="secondary">
                          {(
                            (data.outputBiocharWeightTonnes /
                              data.inputFeedstockWeightTonnes) *
                            100
                          ).toFixed(1)}
                          %
                        </Badge>
                      </div>
                    )}
                  {(data.temperatureMin ||
                    data.temperatureMax ||
                    data.temperatureAvg) && (
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">
                        Temperature Range
                      </span>
                      <span>
                        {data.temperatureMin || '-'} / {data.temperatureAvg || '-'} /{' '}
                        {data.temperatureMax || '-'} °C
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {error && (
        <div className="mb-6 bg-red-50 p-4 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <WizardProvider
        steps={steps}
        currentStepIndex={currentStepIndex}
        onStepChange={handleStepChange}
        onStepsUpdate={updateSteps}
      >
        <WizardStepper />
        <WizardContent>{renderStep()}</WizardContent>
        <WizardNavigation
          onComplete={handleComplete}
          isSubmitting={isSubmitting}
          completeLabel="Complete Batch"
        />
      </WizardProvider>
    </div>
  );
}
