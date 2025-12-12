'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
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
  Checkbox,
} from '@/components/ui';
import { BatchLinkScanner } from '@/components/qr';
import {
  sequestrationStep1Schema,
  sequestrationStep2Schema,
  sequestrationStep4Schema,
  SEQUESTRATION_TYPES,
  STORAGE_CONDITIONS,
  SEQUESTRATION_WIZARD_STEPS,
} from '@/lib/validations/sequestration';

interface ProductionBatchOption {
  id: string;
  productionDate: string | Date;
  outputBiocharWeightTonnes: number;
}

interface BatchLink {
  productionBatchId: string;
  quantityTonnes: number;
}

interface SequestrationWizardProps {
  productionBatchOptions: ProductionBatchOption[];
  initialData?: SequestrationWizardData;
  eventId?: string;
}

export interface SequestrationWizardData {
  [key: string]: unknown;
  storageBeforeDelivery?: boolean;
  storageLocation?: string | null;
  storageStartDate?: Date | string | null;
  storageEndDate?: Date | string | null;
  storageContainerIds?: string | null;
  storageConditions?: string | null;
  productionBatches?: BatchLink[];
  finalDeliveryDate?: Date | string;
  deliveryVehicleDescription?: string | null;
  deliveryPostcode?: string;
  sequestrationType?: string;
  notes?: string | null;
}

function getInitialSteps(hasStorage: boolean): WizardStep[] {
  return SEQUESTRATION_WIZARD_STEPS.filter((step) => {
    if (step.id === 2 && !hasStorage) return false;
    return true;
  }).map((step) => ({
    id: String(step.id),
    title: step.title,
    description: step.description,
    isValid: step.id === 1 ? undefined : false,
    isOptional: step.id === 5 || step.id === 6,
  }));
}

export function SequestrationWizard({
  productionBatchOptions,
  initialData,
  eventId,
}: SequestrationWizardProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBatches, setSelectedBatches] = useState<BatchLink[]>(
    initialData?.productionBatches || []
  );

  const hasStorage = initialData?.storageBeforeDelivery ?? false;

  const {
    steps,
    currentStepIndex,
    data,
    setCurrentStepIndex,
    updateData,
    updateSteps,
    resetWizard,
    isInitialized,
  } = useWizardState<SequestrationWizardData>({
    initialSteps: getInitialSteps(hasStorage),
    storageKey: eventId ? undefined : 'sequestration-wizard',
    initialData: initialData || { storageBeforeDelivery: false },
  });

  // Track previous validation state to prevent infinite loops
  const prevValidationRef = useRef<{
    step1: boolean;
    step2: boolean;
    step3: boolean;
    step4: boolean;
  } | null>(null);

  // Update steps when storage flag changes
  useEffect(() => {
    if (isInitialized) {
      const newSteps = getInitialSteps(data.storageBeforeDelivery ?? false);
      updateSteps(newSteps);
    }
  }, [data.storageBeforeDelivery, isInitialized]);

  const formatDateForInput = (date: Date | string | undefined | null) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Step 1 form
  const step1Form = useForm({
    resolver: zodResolver(sequestrationStep1Schema),
    defaultValues: {
      storageBeforeDelivery: data.storageBeforeDelivery ?? false,
    },
  });

  // Step 2 form (storage details - conditional)
  const step2Form = useForm({
    resolver: zodResolver(sequestrationStep2Schema),
    defaultValues: {
      storageLocation: data.storageLocation || '',
      storageStartDate: formatDateForInput(data.storageStartDate),
      storageEndDate: formatDateForInput(data.storageEndDate),
      storageContainerIds: data.storageContainerIds || '',
      storageConditions: data.storageConditions || 'indoor',
    },
  });

  // Step 4 form (delivery info)
  const step4Form = useForm({
    resolver: zodResolver(sequestrationStep4Schema),
    defaultValues: {
      finalDeliveryDate: formatDateForInput(data.finalDeliveryDate) || formatDateForInput(new Date()),
      deliveryVehicleDescription: data.deliveryVehicleDescription || '',
      deliveryPostcode: data.deliveryPostcode || '',
      sequestrationType: data.sequestrationType || '',
      sequestrationTypeOther: '',
    },
  });

  // Watch form values for validation
  const storageLocation = step2Form.watch('storageLocation');
  const storageStartDate = step2Form.watch('storageStartDate');
  const storageEndDate = step2Form.watch('storageEndDate');
  const finalDeliveryDate = step4Form.watch('finalDeliveryDate');
  const deliveryPostcode = step4Form.watch('deliveryPostcode');
  const sequestrationType = step4Form.watch('sequestrationType');

  // Validate steps when data changes
  useEffect(() => {
    if (!isInitialized) return;

    // Step 1 is always valid (just a checkbox)
    const step1Valid = true;

    // Step 2 (storage details) - only validate if storage is enabled
    const step2Valid = !data.storageBeforeDelivery || (
      !!storageLocation?.trim() &&
      !!storageStartDate &&
      !!storageEndDate
    );

    // Step 3 (batch linkage) - valid if at least one batch is selected
    const step3Valid = selectedBatches.length > 0;

    // Step 4 (delivery info) - all required fields filled
    const step4Valid = !!finalDeliveryDate && !!deliveryPostcode?.trim() && !!sequestrationType;

    const prev = prevValidationRef.current;

    // Only update if validation status has actually changed
    if (
      !prev ||
      step1Valid !== prev.step1 ||
      step2Valid !== prev.step2 ||
      step3Valid !== prev.step3 ||
      step4Valid !== prev.step4
    ) {
      prevValidationRef.current = { step1: step1Valid, step2: step2Valid, step3: step3Valid, step4: step4Valid };

      const newSteps = steps.map((step) => {
        if (step.id === '1') return { ...step, isValid: step1Valid };
        if (step.id === '2') return { ...step, isValid: step2Valid };
        if (step.id === '3') return { ...step, isValid: step3Valid };
        if (step.id === '4') return { ...step, isValid: step4Valid };
        if (step.id === '5') return { ...step, isValid: true, isOptional: true };
        if (step.id === '6') return { ...step, isValid: true, isOptional: true };
        return step;
      });
      updateSteps(newSteps);
    }
  }, [
    isInitialized,
    data.storageBeforeDelivery,
    storageLocation,
    storageStartDate,
    storageEndDate,
    selectedBatches.length,
    finalDeliveryDate,
    deliveryPostcode,
    sequestrationType,
    steps,
    updateSteps,
  ]);

  // Get current step ID based on whether storage is enabled
  const getCurrentStepId = () => {
    const hasStorageSteps = data.storageBeforeDelivery;
    if (!hasStorageSteps) {
      // Steps: 1, 3, 4, 5, 6 (skip 2)
      const mapping = [1, 3, 4, 5, 6];
      return mapping[currentStepIndex];
    }
    // All steps: 1, 2, 3, 4, 5, 6
    return currentStepIndex + 1;
  };

  const currentStepId = getCurrentStepId();

  const totalBiocharSelected = useMemo(() => {
    return selectedBatches.reduce((sum, b) => sum + b.quantityTonnes, 0);
  }, [selectedBatches]);

  const handleBatchToggle = (batchId: string, maxQuantity: number) => {
    setSelectedBatches((prev) => {
      const existing = prev.find((b) => b.productionBatchId === batchId);
      if (existing) {
        return prev.filter((b) => b.productionBatchId !== batchId);
      }
      return [...prev, { productionBatchId: batchId, quantityTonnes: maxQuantity }];
    });
  };

  const handleQuantityChange = (batchId: string, quantity: number) => {
    setSelectedBatches((prev) =>
      prev.map((b) =>
        b.productionBatchId === batchId
          ? { ...b, quantityTonnes: quantity }
          : b
      )
    );
  };

  const handleBatchScanned = (batchId: string) => {
    const batch = productionBatchOptions.find((b) => b.id === batchId);
    if (batch) {
      handleBatchToggle(batchId, batch.outputBiocharWeightTonnes);
    }
  };

  const handleStepChange = (newIndex: number) => {
    // Save current step data before changing
    const stepId = getCurrentStepId();

    if (stepId === 1) {
      const formData = step1Form.getValues();
      updateData({ storageBeforeDelivery: formData.storageBeforeDelivery });
    } else if (stepId === 2) {
      const formData = step2Form.getValues();
      updateData({
        storageLocation: formData.storageLocation || null,
        storageStartDate: formData.storageStartDate || null,
        storageEndDate: formData.storageEndDate || null,
        storageContainerIds: formData.storageContainerIds || null,
        storageConditions: formData.storageConditions || null,
      });
    } else if (stepId === 3) {
      updateData({ productionBatches: selectedBatches });
    } else if (stepId === 4) {
      const formData = step4Form.getValues();
      updateData({
        finalDeliveryDate: formData.finalDeliveryDate,
        deliveryVehicleDescription: formData.deliveryVehicleDescription || null,
        deliveryPostcode: formData.deliveryPostcode,
        sequestrationType: formData.sequestrationType,
      });
    }

    setCurrentStepIndex(newIndex);
  };

  const handleComplete = async () => {
    const finalData = {
      ...data,
      productionBatches: selectedBatches,
      status: 'complete',
      wizardStep: 6,
    };

    setIsSubmitting(true);
    setError(null);

    try {
      const url = eventId ? `/api/sequestration/${eventId}` : '/api/sequestration';
      const method = eventId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to save sequestration event');
      }

      resetWizard();
      router.push('/sequestration');
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
    const stepId = getCurrentStepId();

    switch (stepId) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="storageBeforeDelivery"
                checked={step1Form.watch('storageBeforeDelivery')}
                onCheckedChange={(checked) =>
                  step1Form.setValue('storageBeforeDelivery', checked === true)
                }
              />
              <div>
                <Label htmlFor="storageBeforeDelivery" className="font-medium">
                  Storage before delivery
                </Label>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Check this if the biochar was stored at an intermediate location
                  before final delivery to the sequestration site.
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storageLocation">Storage Location *</Label>
              <Input
                id="storageLocation"
                {...step2Form.register('storageLocation')}
                placeholder="e.g., Warehouse A, Field Storage"
              />
              {step2Form.formState.errors.storageLocation && (
                <p className="text-sm text-red-500">
                  {step2Form.formState.errors.storageLocation.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="storageStartDate">Storage Start Date *</Label>
                <Input
                  id="storageStartDate"
                  type="date"
                  {...step2Form.register('storageStartDate')}
                />
                {step2Form.formState.errors.storageStartDate && (
                  <p className="text-sm text-red-500">
                    {step2Form.formState.errors.storageStartDate.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="storageEndDate">Storage End Date *</Label>
                <Input
                  id="storageEndDate"
                  type="date"
                  {...step2Form.register('storageEndDate')}
                />
                {step2Form.formState.errors.storageEndDate && (
                  <p className="text-sm text-red-500">
                    {step2Form.formState.errors.storageEndDate.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storageConditions">Storage Conditions</Label>
              <Select
                id="storageConditions"
                {...step2Form.register('storageConditions')}
              >
                <option value="">Select conditions...</option>
                {STORAGE_CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storageContainerIds">Container IDs</Label>
              <Input
                id="storageContainerIds"
                {...step2Form.register('storageContainerIds')}
                placeholder="e.g., CONT-001, CONT-002"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--muted-foreground)]">
                Select the production batches included in this sequestration event
                and specify the quantity from each batch.
              </p>
              <BatchLinkScanner
                onBatchScanned={handleBatchScanned}
                linkedBatchIds={selectedBatches.map((b) => b.productionBatchId)}
              />
            </div>

            {productionBatchOptions.length === 0 ? (
              <div className="border p-4 text-center text-[var(--muted-foreground)]">
                No completed production batches available.
              </div>
            ) : (
              <div className="space-y-2">
                {productionBatchOptions.map((batch) => {
                  const isSelected = selectedBatches.some(
                    (b) => b.productionBatchId === batch.id
                  );
                  const selectedBatch = selectedBatches.find(
                    (b) => b.productionBatchId === batch.id
                  );

                  return (
                    <div
                      key={batch.id}
                      className="border p-4 space-y-2"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`batch-${batch.id}`}
                          checked={isSelected}
                          onCheckedChange={() =>
                            handleBatchToggle(
                              batch.id,
                              batch.outputBiocharWeightTonnes
                            )
                          }
                        />
                        <Label htmlFor={`batch-${batch.id}`} className="flex-1">
                          <span className="font-medium">
                            {formatDateTime(batch.productionDate)}
                          </span>
                          <span className="ml-2 text-[var(--muted-foreground)]">
                            ({batch.outputBiocharWeightTonnes.toFixed(2)} tonnes
                            available)
                          </span>
                        </Label>
                      </div>

                      {isSelected && (
                        <div className="ml-8 flex items-center gap-2">
                          <Label htmlFor={`quantity-${batch.id}`}>
                            Quantity (tonnes):
                          </Label>
                          <Input
                            id={`quantity-${batch.id}`}
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={batch.outputBiocharWeightTonnes}
                            value={selectedBatch?.quantityTonnes || ''}
                            onChange={(e) =>
                              handleQuantityChange(
                                batch.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-32"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {selectedBatches.length > 0 && (
              <div className="bg-[var(--muted)] p-4">
                <p className="font-medium">
                  Total: {totalBiocharSelected.toFixed(2)} tonnes
                </p>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="finalDeliveryDate">Delivery Date *</Label>
                <Input
                  id="finalDeliveryDate"
                  type="date"
                  {...step4Form.register('finalDeliveryDate')}
                />
                {step4Form.formState.errors.finalDeliveryDate && (
                  <p className="text-sm text-red-500">
                    {step4Form.formState.errors.finalDeliveryDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sequestrationType">Sequestration Type *</Label>
                <Select
                  id="sequestrationType"
                  {...step4Form.register('sequestrationType')}
                >
                  <option value="">Select type...</option>
                  {SEQUESTRATION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
                {step4Form.formState.errors.sequestrationType && (
                  <p className="text-sm text-red-500">
                    {step4Form.formState.errors.sequestrationType.message}
                  </p>
                )}
              </div>

              {step4Form.watch('sequestrationType') === 'other' && (
                <div className="space-y-2">
                  <Label htmlFor="sequestrationTypeOther">Please specify *</Label>
                  <Input
                    id="sequestrationTypeOther"
                    {...step4Form.register('sequestrationTypeOther')}
                    placeholder="Enter sequestration type..."
                  />
                  {step4Form.formState.errors.sequestrationTypeOther && (
                    <p className="text-sm text-red-500">
                      {step4Form.formState.errors.sequestrationTypeOther.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryPostcode">Delivery Postcode *</Label>
              <Input
                id="deliveryPostcode"
                {...step4Form.register('deliveryPostcode')}
                placeholder="e.g., SW1A 1AA"
              />
              {step4Form.formState.errors.deliveryPostcode && (
                <p className="text-sm text-red-500">
                  {step4Form.formState.errors.deliveryPostcode.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryVehicleDescription">
                Vehicle Description
              </Label>
              <Input
                id="deliveryVehicleDescription"
                {...step4Form.register('deliveryVehicleDescription')}
                placeholder="e.g., 10t Flatbed Truck"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <p className="text-[var(--muted-foreground)]">
              Upload any regulatory permits, licenses, or certificates required
              for this sequestration event.
            </p>
            <div className="border-2 border-dashed p-8 text-center">
              <p className="text-[var(--muted-foreground)]">
                Evidence file upload will be available after creating the event.
              </p>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={data.notes || ''}
                onChange={(e) => updateData({ notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>

            <Card>
              <CardContent className="pt-6">
                <h4 className="font-medium mb-4">Summary</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">
                      Storage Before Delivery
                    </span>
                    <Badge variant={data.storageBeforeDelivery ? 'default' : 'secondary'}>
                      {data.storageBeforeDelivery ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  {data.storageBeforeDelivery && data.storageLocation && (
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">
                        Storage Location
                      </span>
                      <span>{data.storageLocation}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">
                      Batches Linked
                    </span>
                    <span>{selectedBatches.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">
                      Total Quantity
                    </span>
                    <span className="font-medium">
                      {totalBiocharSelected.toFixed(2)} tonnes
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">
                      Delivery Date
                    </span>
                    <span>
                      {data.finalDeliveryDate
                        ? formatDateTime(data.finalDeliveryDate)
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">
                      Sequestration Type
                    </span>
                    <span>
                      {SEQUESTRATION_TYPES.find(
                        (t) => t.value === data.sequestrationType
                      )?.label || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">
                      Delivery Postcode
                    </span>
                    <span>{data.deliveryPostcode || '-'}</span>
                  </div>
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
          completeLabel="Complete Event"
        />
      </WizardProvider>
    </div>
  );
}
