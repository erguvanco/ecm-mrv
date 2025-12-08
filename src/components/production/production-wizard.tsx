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
  FileUpload,
  UploadedFile,
} from '@/components/ui';
import {
  productionStep1Schema,
  productionStep3Schema,
  productionStep4Schema,
  productionStep5Schema,
  PRODUCTION_WIZARD_STEPS,
  FeedstockAllocation,
} from '@/lib/validations/production';
import { FEEDSTOCK_TYPES } from '@/lib/validations/feedstock';
import { Plus, X, ChevronDown, Paperclip } from 'lucide-react';

// Helper to get human-readable feedstock type label
const getFeedstockTypeLabel = (value: string): string => {
  const type = FEEDSTOCK_TYPES.find(t => t.value === value);
  return type?.label || value;
};

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

  // Evidence files per allocation (keyed by feedstockDeliveryId)
  const [allocationEvidence, setAllocationEvidence] = useState<Record<string, UploadedFile[]>>({});

  // Track which allocation's evidence section is expanded
  const [expandedEvidence, setExpandedEvidence] = useState<string | null>(null);

  // Step 1 form
  const getDefaultDateTime = () => {
    if (data.productionDate) {
      const d = new Date(data.productionDate);
      return d.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
    }
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };

  const step1Form = useForm({
    resolver: zodResolver(productionStep1Schema),
    defaultValues: {
      productionDate: getDefaultDateTime(),
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

  // Step 2 form (Output Biochar - was step 3)
  const step2Form = useForm({
    resolver: zodResolver(productionStep3Schema),
    defaultValues: {
      outputBiocharWeightTonnes: data.outputBiocharWeightTonnes || '',
    },
  });

  // Step 3 form (Temperature - was step 4)
  const step3Form = useForm({
    resolver: zodResolver(productionStep4Schema),
    defaultValues: {
      temperatureMin: data.temperatureMin || '',
      temperatureMax: data.temperatureMax || '',
      temperatureAvg: data.temperatureAvg || '',
    },
  });

  // Step 4 form (Summary - was step 5)
  const step4Form = useForm({
    resolver: zodResolver(productionStep5Schema),
    defaultValues: {
      notes: data.notes || '',
    },
  });

  // Track previous validation state to prevent infinite loops
  const prevValidationRef = useRef<{ step1: boolean; step2: boolean } | null>(null);

  // Watch form values for validation
  const productionDateValue = step1Form.watch('productionDate');
  const outputBiocharValue = step2Form.watch('outputBiocharWeightTonnes');

  // Sync form values to wizard data for step 1 on mount and when form changes
  useEffect(() => {
    if (!isInitialized) return;
    // Sync production date from form to wizard data if not already set
    if (productionDateValue && !data.productionDate) {
      updateData({ productionDate: productionDateValue });
    }
  }, [isInitialized, productionDateValue, data.productionDate, updateData]);

  // Get current input weight for validation
  const currentInputWeight = calculateTotalAllocatedWeight();

  // Validate steps when data changes
  useEffect(() => {
    if (!isInitialized) return;

    // Step 1 is valid if date is set and at least one feedstock is allocated
    const step1Valid = !!productionDateValue && allocations.length > 0;

    // Step 2 is valid if output weight is positive AND less than or equal to input weight
    const outputWeight = Number(outputBiocharValue) || 0;
    const step2Valid = outputWeight > 0 && outputWeight <= currentInputWeight;

    const prev = prevValidationRef.current;

    // Only update if validation status has actually changed
    if (
      !prev ||
      step1Valid !== prev.step1 ||
      step2Valid !== prev.step2
    ) {
      prevValidationRef.current = { step1: step1Valid, step2: step2Valid };

      const newSteps = steps.map((step) => {
        if (step.id === '1') return { ...step, isValid: step1Valid };
        if (step.id === '2') return { ...step, isValid: step2Valid };
        if (step.id === '3') return { ...step, isValid: true, isOptional: true };
        if (step.id === '4') return { ...step, isValid: true, isOptional: true };
        return step;
      });
      updateSteps(newSteps);
    }
  }, [productionDateValue, allocations.length, outputBiocharValue, currentInputWeight, isInitialized, steps, updateSteps]);

  const handleStepChange = (newIndex: number) => {
    // Calculate input weight from allocations
    const inputWeight = calculateTotalAllocatedWeight();

    // Save current step data before changing
    if (currentStepIndex === 0) {
      const formData = step1Form.getValues();
      updateData({
        productionDate: formData.productionDate,
        feedstockDeliveryId: formData.feedstockDeliveryId || null,
        feedstockAllocations: allocations.length > 0 ? allocations : undefined,
        inputFeedstockWeightTonnes: inputWeight > 0 ? inputWeight : undefined,
      });
    } else if (currentStepIndex === 1) {
      const formData = step2Form.getValues();
      updateData({
        outputBiocharWeightTonnes: Number(formData.outputBiocharWeightTonnes),
      });
    } else if (currentStepIndex === 2) {
      const formData = step3Form.getValues();
      updateData({
        temperatureMin: formData.temperatureMin ? Number(formData.temperatureMin) : null,
        temperatureMax: formData.temperatureMax ? Number(formData.temperatureMax) : null,
        temperatureAvg: formData.temperatureAvg ? Number(formData.temperatureAvg) : null,
      });
    } else if (currentStepIndex === 3) {
      const formData = step4Form.getValues();
      updateData({ notes: formData.notes || null });
    }

    setCurrentStepIndex(newIndex);
  };

  const handleComplete = async () => {
    // Calculate input weight from allocations
    const inputWeight = calculateTotalAllocatedWeight();

    // Collect all data
    const step4Data = step4Form.getValues();
    const finalData = {
      ...data,
      feedstockAllocations: allocations.length > 0 ? allocations : undefined,
      inputFeedstockWeightTonnes: inputWeight > 0 ? inputWeight : data.inputFeedstockWeightTonnes,
      notes: step4Data.notes || null,
      status: 'complete',
      wizardStep: 4,
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

  // Get current input weight from allocations
  const inputWeight = calculateTotalAllocatedWeight();

  const renderStep = () => {
    switch (currentStepIndex) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productionDate">Production Date & Time *</Label>
              <Input
                id="productionDate"
                type="datetime-local"
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
                <Label>Link to Feedstock Deliveries *</Label>
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
                    const isEvidenceExpanded = expandedEvidence === allocation.feedstockDeliveryId;
                    const evidenceFiles = allocationEvidence[allocation.feedstockDeliveryId] || [];

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
                                        {formatDateTime(fs.date)} – {getFeedstockTypeLabel(fs.feedstockType)}
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

                              {/* Evidence upload toggle */}
                              <button
                                type="button"
                                onClick={() => setExpandedEvidence(isEvidenceExpanded ? null : allocation.feedstockDeliveryId)}
                                className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                              >
                                <Paperclip className="h-3 w-3" />
                                <span>
                                  {evidenceFiles.length > 0
                                    ? `${evidenceFiles.length} evidence file${evidenceFiles.length > 1 ? 's' : ''}`
                                    : 'Add evidence (optional)'}
                                </span>
                                <ChevronDown className={`h-3 w-3 transition-transform ${isEvidenceExpanded ? 'rotate-180' : ''}`} />
                              </button>

                              {/* Evidence upload section */}
                              {isEvidenceExpanded && (
                                <div className="pt-2 border-t border-[var(--border)]">
                                  <FileUpload
                                    files={evidenceFiles}
                                    onChange={(files) => {
                                      setAllocationEvidence(prev => ({
                                        ...prev,
                                        [allocation.feedstockDeliveryId]: files,
                                      }));
                                    }}
                                    maxFiles={5}
                                  />
                                </div>
                              )}
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
                      Total Input Weight
                    </span>
                    <Badge variant="secondary" className="text-sm">
                      {inputWeight.toFixed(2)} tonnes
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 1:
        const outputValue = Number(outputBiocharValue) || 0;
        const exceedsInput = outputValue > 0 && outputValue > inputWeight;
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
                max={inputWeight}
                {...step2Form.register('outputBiocharWeightTonnes')}
              />
              {step2Form.formState.errors.outputBiocharWeightTonnes && (
                <p className="text-sm text-red-500">
                  {step2Form.formState.errors.outputBiocharWeightTonnes.message}
                </p>
              )}
              {exceedsInput && (
                <p className="text-sm text-red-500">
                  Output weight cannot exceed input weight ({inputWeight.toFixed(2)} tonnes)
                </p>
              )}
            </div>
            {inputWeight > 0 && (
              <p className="text-sm text-[var(--muted-foreground)]">
                Input weight from feedstock: {inputWeight.toFixed(2)} tonnes. Typical
                conversion rates are 20-30%.
              </p>
            )}
          </div>
        );

      case 2:
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
                  {...step3Form.register('temperatureMin')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperatureMax">Max Temperature (°C)</Label>
                <Input
                  id="temperatureMax"
                  type="number"
                  step="1"
                  {...step3Form.register('temperatureMax')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperatureAvg">Avg Temperature (°C)</Label>
                <Input
                  id="temperatureAvg"
                  type="number"
                  step="1"
                  {...step3Form.register('temperatureAvg')}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...step4Form.register('notes')}
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
                          <span>Total Input Weight</span>
                          <span>{inputWeight.toFixed(2)} tonnes</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-2 border-t border-[var(--border)] mt-2">
                    <span className="text-[var(--muted-foreground)]">
                      Output Weight
                    </span>
                    <span>
                      {data.outputBiocharWeightTonnes
                        ? `${data.outputBiocharWeightTonnes} tonnes`
                        : '-'}
                    </span>
                  </div>
                  {inputWeight > 0 &&
                    data.outputBiocharWeightTonnes && (
                      <div className="flex justify-between">
                        <span className="text-[var(--muted-foreground)]">
                          Conversion Rate
                        </span>
                        <Badge variant="secondary">
                          {(
                            (Number(data.outputBiocharWeightTonnes) /
                              inputWeight) *
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
