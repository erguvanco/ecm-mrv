'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  createTransportEventSchema,
  TransportEventInput,
  TRANSPORT_FUEL_TYPES,
} from '@/lib/validations/transport';
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

interface TransportFormProps {
  initialData?: TransportEventInput & { id?: string };
  mode: 'create' | 'edit';
}

export function TransportForm({ initialData, mode }: TransportFormProps) {
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
  } = useForm<TransportEventInput>({
    resolver: zodResolver(createTransportEventSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          date: formatDateForInput(initialData.date),
        }
      : {
          date: formatDateForInput(new Date()),
        },
  });

  const onSubmit = async (data: TransportEventInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url =
        mode === 'create'
          ? '/api/transport'
          : `/api/transport/${initialData?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to save transport event');
      }

      router.push('/transport');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 p-4 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transport Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              {...register('date')}
              className={errors.date ? 'border-red-500' : ''}
            />
            {errors.date && (
              <p className="text-sm text-red-500">{errors.date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="distanceKm">Distance (km) *</Label>
            <Input
              id="distanceKm"
              type="number"
              step="0.1"
              {...register('distanceKm')}
              className={errors.distanceKm ? 'border-red-500' : ''}
            />
            {errors.distanceKm && (
              <p className="text-sm text-red-500">{errors.distanceKm.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicleId">Vehicle ID</Label>
            <Input
              id="vehicleId"
              {...register('vehicleId')}
              placeholder="e.g., ABC-123"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicleDescription">Vehicle Description</Label>
            <Input
              id="vehicleDescription"
              {...register('vehicleDescription')}
              placeholder="e.g., 20t Truck"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="cargoDescription">Cargo Description</Label>
            <Input
              id="cargoDescription"
              {...register('cargoDescription')}
              placeholder="e.g., Biochar delivery to application site"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fuel Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fuelType">Fuel Type</Label>
            <Select id="fuelType" {...register('fuelType')}>
              <option value="">Select fuel type...</option>
              {TRANSPORT_FUEL_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </div>

          {watch('fuelType') === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="fuelTypeOther">Please specify *</Label>
              <Input
                id="fuelTypeOther"
                {...register('fuelTypeOther')}
                placeholder="Enter fuel type..."
                className={errors.fuelTypeOther ? 'border-red-500' : ''}
              />
              {errors.fuelTypeOther && (
                <p className="text-sm text-red-500">{errors.fuelTypeOther.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="fuelAmount">Fuel Amount (liters)</Label>
            <Input
              id="fuelAmount"
              type="number"
              step="0.1"
              {...register('fuelAmount')}
              className={errors.fuelAmount ? 'border-red-500' : ''}
            />
            {errors.fuelAmount && (
              <p className="text-sm text-red-500">
                {errors.fuelAmount.message}
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
              placeholder="Any additional notes about this transport event..."
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
            'Create Event'
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  );
}
