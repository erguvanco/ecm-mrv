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
import { Plus, X, ChevronDown, Paperclip, Calendar, Scale, Thermometer, FileText, Package, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

// Legacy feedstock type mappings for older database records
const LEGACY_FEEDSTOCK_LABELS: Record<string, string> = {
  agricultural_residue: 'Agricultural Residue',
  forestry_residue: 'Forestry Residue',
  energy_crops: 'Energy Crops',
  organic_waste: 'Organic Waste',
  animal_residue: 'Animal Residue',
  waste_oil: 'Waste Oil',
  wood: 'Wood',
};

// Helper to get human-readable feedstock type label
const getFeedstockTypeLabel = (value: string): string => {
  // Check specific feedstock types first
  const type = FEEDSTOCK_TYPES.find(t => t.value === value);
  if (type) return type.label;

  // Check legacy/generic types
  if (LEGACY_FEEDSTOCK_LABELS[value]) return LEGACY_FEEDSTOCK_LABELS[value];

  // Format snake_case to Title Case as fallback
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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

  // Evidence files for output biochar
  const [outputEvidence, setOutputEvidence] = useState<UploadedFile[]>([]);
  const [showOutputEvidence, setShowOutputEvidence] = useState(false);

  // Evidence files for temperature
  const [temperatureEvidence, setTemperatureEvidence] = useState<UploadedFile[]>([]);
  const [showTemperatureEvidence, setShowTemperatureEvidence] = useState(false);

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

    // Step 2 is valid if output weight is positive (warning shown if exceeds input, but allowed)
    const outputWeight = Number(outputBiocharValue) || 0;
    const step2Valid = outputWeight > 0;

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

    // Prepare evidence files metadata per allocation
    const evidenceByAllocation: Record<string, Array<{
      fileName: string;
      fileSize: number;
      mimeType: string;
      category: string;
    }>> = {};

    for (const [feedstockId, files] of Object.entries(allocationEvidence)) {
      if (files.length > 0) {
        evidenceByAllocation[feedstockId] = files.map(f => ({
          fileName: f.fileName,
          fileSize: f.fileSize,
          mimeType: f.mimeType,
          category: f.category,
        }));
      }
    }

    // Prepare output evidence files
    const outputEvidenceMetadata = outputEvidence.length > 0
      ? outputEvidence.map(f => ({
          fileName: f.fileName,
          fileSize: f.fileSize,
          mimeType: f.mimeType,
          category: f.category,
        }))
      : undefined;

    // Prepare temperature evidence files
    const temperatureEvidenceMetadata = temperatureEvidence.length > 0
      ? temperatureEvidence.map(f => ({
          fileName: f.fileName,
          fileSize: f.fileSize,
          mimeType: f.mimeType,
          category: f.category,
        }))
      : undefined;

    // Collect all data
    const step4Data = step4Form.getValues();
    const finalData = {
      ...data,
      feedstockAllocations: allocations.length > 0 ? allocations : undefined,
      inputFeedstockWeightTonnes: inputWeight > 0 ? inputWeight : data.inputFeedstockWeightTonnes,
      notes: step4Data.notes || null,
      status: 'complete',
      wizardStep: 4,
      evidenceByAllocation: Object.keys(evidenceByAllocation).length > 0 ? evidenceByAllocation : undefined,
      outputEvidence: outputEvidenceMetadata,
      temperatureEvidence: temperatureEvidenceMetadata,
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
                {...step2Form.register('outputBiocharWeightTonnes')}
              />
              {step2Form.formState.errors.outputBiocharWeightTonnes && (
                <p className="text-sm text-red-500">
                  {step2Form.formState.errors.outputBiocharWeightTonnes.message}
                </p>
              )}
              {exceedsInput && (
                <p className="text-sm text-amber-600">
                  ⚠️ Output weight ({outputValue.toFixed(2)}t) exceeds input feedstock weight ({inputWeight.toFixed(2)}t). Please verify this is correct.
                </p>
              )}
            </div>
            {inputWeight > 0 && (
              <p className="text-sm text-[var(--muted-foreground)]">
                Input weight from feedstock: {inputWeight.toFixed(2)} tonnes. Typical
                conversion rates are 20-30%.
              </p>
            )}

            {/* Evidence upload toggle */}
            <div className="pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowOutputEvidence(!showOutputEvidence)}
                className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <Paperclip className="h-3 w-3" />
                <span>
                  {outputEvidence.length > 0
                    ? `${outputEvidence.length} evidence file${outputEvidence.length > 1 ? 's' : ''}`
                    : 'Add output evidence (optional)'}
                </span>
                <ChevronDown className={`h-3 w-3 transition-transform ${showOutputEvidence ? 'rotate-180' : ''}`} />
              </button>

              {/* Evidence upload section */}
              {showOutputEvidence && (
                <div className="mt-3">
                  <FileUpload
                    files={outputEvidence}
                    onChange={setOutputEvidence}
                    maxFiles={5}
                  />
                </div>
              )}
            </div>
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

            {/* Evidence upload toggle */}
            <div className="pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowTemperatureEvidence(!showTemperatureEvidence)}
                className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                <Paperclip className="h-3 w-3" />
                <span>
                  {temperatureEvidence.length > 0
                    ? `${temperatureEvidence.length} evidence file${temperatureEvidence.length > 1 ? 's' : ''}`
                    : 'Add temperature log evidence (optional)'}
                </span>
                <ChevronDown className={`h-3 w-3 transition-transform ${showTemperatureEvidence ? 'rotate-180' : ''}`} />
              </button>

              {/* Evidence upload section */}
              {showTemperatureEvidence && (
                <div className="mt-3">
                  <FileUpload
                    files={temperatureEvidence}
                    onChange={setTemperatureEvidence}
                    maxFiles={5}
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        // Calculate conversion rate and determine color
        const conversionRate = inputWeight > 0 && data.outputBiocharWeightTonnes
          ? (Number(data.outputBiocharWeightTonnes) / inputWeight) * 100
          : 0;
        const getConversionRateColor = (rate: number) => {
          if (rate > 100) return 'text-red-600 bg-red-50 border-red-200';
          if (rate >= 20 && rate <= 35) return 'text-green-600 bg-green-50 border-green-200';
          if (rate >= 15 && rate <= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
          return 'text-[var(--muted-foreground)] bg-[var(--muted)]/30 border-[var(--border)]';
        };

        // Count total evidence files
        const totalFeedstockEvidence = Object.values(allocationEvidence).reduce((sum, files) => sum + files.length, 0);
        const totalEvidence = totalFeedstockEvidence + outputEvidence.length + temperatureEvidence.length;

        return (
          <div className="space-y-6">
            {/* Notes section */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                {...step4Form.register('notes')}
                placeholder="Any additional notes about this production batch..."
                rows={3}
              />
            </div>

            {/* Summary Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold text-lg">Production Batch Summary</h4>
            </div>

            {/* Main metrics grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Production Date Card */}
              <Card className="border-[var(--border)]">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Production Date</p>
                      <p className="font-medium mt-0.5">
                        {data.productionDate ? formatDateTime(data.productionDate) : '-'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Conversion Rate Card */}
              {inputWeight > 0 && data.outputBiocharWeightTonnes && (
                <Card className={`border ${getConversionRateColor(conversionRate)}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${conversionRate > 100 ? 'bg-red-100 text-red-600' : conversionRate >= 20 && conversionRate <= 35 ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Conversion Rate</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="font-semibold text-lg">{conversionRate.toFixed(1)}%</p>
                          {conversionRate > 100 && (
                            <span className="text-xs flex items-center gap-1 text-red-600">
                              <AlertTriangle className="h-3 w-3" /> exceeds input
                            </span>
                          )}
                          {conversionRate >= 20 && conversionRate <= 35 && (
                            <span className="text-xs text-green-600">typical range</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Weight metrics */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Input Weight Card */}
              <Card className="border-[var(--border)]">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                      <Scale className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Input Feedstock</p>
                      <p className="font-semibold text-lg mt-0.5">{inputWeight.toFixed(2)} <span className="text-sm font-normal">tonnes</span></p>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">
                        from {allocations.length} source{allocations.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Output Weight Card */}
              <Card className="border-[var(--border)]">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Output Biochar</p>
                      <p className="font-semibold text-lg mt-0.5">
                        {data.outputBiocharWeightTonnes ? (
                          <>{Number(data.outputBiocharWeightTonnes).toFixed(2)} <span className="text-sm font-normal">tonnes</span></>
                        ) : '-'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Feedstock Sources Detail */}
            {allocations.length > 0 && (
              <Card className="border-[var(--border)]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Scale className="h-4 w-4 text-[var(--muted-foreground)]" />
                    <h5 className="font-medium text-sm">Feedstock Sources</h5>
                  </div>
                  <div className="space-y-2">
                    {allocations.map((allocation, idx) => {
                      const fs = feedstockOptions.find(
                        (f) => f.id === allocation.feedstockDeliveryId
                      );
                      if (!fs) return null;
                      const allocWeight = fs.weightTonnes
                        ? (fs.weightTonnes * allocation.percentageUsed) / 100
                        : 0;
                      const evidenceCount = allocationEvidence[allocation.feedstockDeliveryId]?.length || 0;
                      return (
                        <div key={idx} className="flex items-center justify-between py-2 px-3 bg-[var(--muted)]/30 rounded-md">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{getFeedstockTypeLabel(fs.feedstockType)}</p>
                            <p className="text-xs text-[var(--muted-foreground)]">
                              {formatDateTimeShort(fs.date)}
                              {evidenceCount > 0 && (
                                <span className="ml-2 inline-flex items-center gap-1">
                                  <Paperclip className="h-3 w-3" />
                                  {evidenceCount} file{evidenceCount !== 1 ? 's' : ''}
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{allocWeight.toFixed(2)}t</p>
                            <p className="text-xs text-[var(--muted-foreground)]">{allocation.percentageUsed}% used</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Temperature & Evidence Row */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Temperature Card */}
              {(data.temperatureMin || data.temperatureMax || data.temperatureAvg) ? (
                <Card className="border-[var(--border)]">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-red-50 text-red-500">
                        <Thermometer className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Temperature Profile</p>
                        <div className="flex items-center gap-4 mt-1">
                          {data.temperatureMin && (
                            <div>
                              <p className="text-xs text-[var(--muted-foreground)]">Min</p>
                              <p className="font-medium">{data.temperatureMin}°C</p>
                            </div>
                          )}
                          {data.temperatureAvg && (
                            <div>
                              <p className="text-xs text-[var(--muted-foreground)]">Avg</p>
                              <p className="font-medium">{data.temperatureAvg}°C</p>
                            </div>
                          )}
                          {data.temperatureMax && (
                            <div>
                              <p className="text-xs text-[var(--muted-foreground)]">Max</p>
                              <p className="font-medium">{data.temperatureMax}°C</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-[var(--border)] border-dashed">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-[var(--muted)]/50 text-[var(--muted-foreground)]">
                        <Thermometer className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Temperature Profile</p>
                        <p className="text-sm text-[var(--muted-foreground)] mt-1">No temperature data recorded</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Evidence Summary Card */}
              <Card className="border-[var(--border)]">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${totalEvidence > 0 ? 'bg-purple-50 text-purple-600' : 'bg-[var(--muted)]/50 text-[var(--muted-foreground)]'}`}>
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Evidence Files</p>
                      {totalEvidence > 0 ? (
                        <div className="mt-1 space-y-1">
                          <p className="font-medium">{totalEvidence} file{totalEvidence !== 1 ? 's' : ''} attached</p>
                          <div className="text-xs text-[var(--muted-foreground)] space-y-0.5">
                            {totalFeedstockEvidence > 0 && (
                              <p>{totalFeedstockEvidence} feedstock evidence</p>
                            )}
                            {outputEvidence.length > 0 && (
                              <p>{outputEvidence.length} output evidence</p>
                            )}
                            {temperatureEvidence.length > 0 && (
                              <p>{temperatureEvidence.length} temperature log</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-[var(--muted-foreground)] mt-1">No evidence files attached</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
