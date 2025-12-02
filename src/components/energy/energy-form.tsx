'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  createEnergyUsageSchema,
  EnergyUsageInput,
  ENERGY_SCOPES,
  ENERGY_TYPES,
  ENERGY_UNITS,
} from '@/lib/validations/energy';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  Textarea,
  Spinner,
} from '@/components/ui';

interface EnergyFormProps {
  initialData?: EnergyUsageInput & { id?: string };
  mode: 'create' | 'edit';
}

export function EnergyForm({ initialData, mode }: EnergyFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDateForInput = (date: Date | string | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createEnergyUsageSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          periodStart: formatDateForInput(initialData.periodStart),
          periodEnd: formatDateForInput(initialData.periodEnd),
        }
      : {
          scope: '',
          scopeOther: '',
          energyType: '',
          energyTypeOther: '',
          quantity: 0,
          unit: '',
          periodStart: formatDateForInput(new Date()),
          periodEnd: formatDateForInput(new Date()),
          productionBatchId: '',
          notes: '',
        },
  });

  const onSubmit = async (data: EnergyUsageInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url =
        mode === 'create'
          ? '/api/energy'
          : `/api/energy/${initialData?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to save energy usage');
      }

      router.push('/energy');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit as unknown as Parameters<typeof handleSubmit>[0])} className="space-y-6">
      {error && (
        <div className="bg-red-50 p-4 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Energy Usage Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="scope">Scope *</Label>
            <Select
              id="scope"
              {...register('scope')}
              className={errors.scope ? 'border-red-500' : ''}
            >
              <option value="">Select scope...</option>
              {ENERGY_SCOPES.map((scope) => (
                <option key={scope.value} value={scope.value}>
                  {scope.label}
                </option>
              ))}
            </Select>
            {errors.scope && (
              <p className="text-sm text-red-500">{errors.scope.message}</p>
            )}
          </div>

          {watch('scope') === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="scopeOther">Please specify *</Label>
              <Input
                id="scopeOther"
                {...register('scopeOther')}
                placeholder="Enter scope..."
                className={errors.scopeOther ? 'border-red-500' : ''}
              />
              {errors.scopeOther && (
                <p className="text-sm text-red-500">{errors.scopeOther.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="energyType">Energy Type *</Label>
            <Select
              id="energyType"
              {...register('energyType')}
              className={errors.energyType ? 'border-red-500' : ''}
            >
              <option value="">Select type...</option>
              {ENERGY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
            {errors.energyType && (
              <p className="text-sm text-red-500">
                {errors.energyType.message}
              </p>
            )}
          </div>

          {watch('energyType') === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="energyTypeOther">Please specify *</Label>
              <Input
                id="energyTypeOther"
                {...register('energyTypeOther')}
                placeholder="Enter energy type..."
                className={errors.energyTypeOther ? 'border-red-500' : ''}
              />
              {errors.energyTypeOther && (
                <p className="text-sm text-red-500">{errors.energyTypeOther.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              {...register('quantity')}
              className={errors.quantity ? 'border-red-500' : ''}
            />
            {errors.quantity && (
              <p className="text-sm text-red-500">{errors.quantity.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unit *</Label>
            <Select
              id="unit"
              {...register('unit')}
              className={errors.unit ? 'border-red-500' : ''}
            >
              <option value="">Select unit...</option>
              {ENERGY_UNITS.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </Select>
            {errors.unit && (
              <p className="text-sm text-red-500">{errors.unit.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Measurement Period</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="periodStart">Period Start *</Label>
            <Input
              id="periodStart"
              type="date"
              {...register('periodStart')}
              className={errors.periodStart ? 'border-red-500' : ''}
            />
            {errors.periodStart && (
              <p className="text-sm text-red-500">
                {errors.periodStart.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="periodEnd">Period End *</Label>
            <Input
              id="periodEnd"
              type="date"
              {...register('periodEnd')}
              className={errors.periodEnd ? 'border-red-500' : ''}
            />
            {errors.periodEnd && (
              <p className="text-sm text-red-500">
                {errors.periodEnd.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Any additional notes about this energy usage..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              {mode === 'create' ? 'Creating...' : 'Saving...'}
            </>
          ) : mode === 'create' ? (
            'Create Record'
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  );
}
