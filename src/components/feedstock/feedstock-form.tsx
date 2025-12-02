'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  createFeedstockDeliverySchema,
  FeedstockDeliveryInput,
  FEEDSTOCK_TYPES,
  FUEL_TYPES,
} from '@/lib/validations/feedstock';
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
  HelpTooltip,
} from '@/components/ui';
import { AddressSearch } from '@/components/network';

interface FeedstockFormProps {
  initialData?: FeedstockDeliveryInput & { id?: string };
  mode: 'create' | 'edit';
}

export function FeedstockForm({ initialData, mode }: FeedstockFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceLocation, setSourceLocation] = useState<{
    address: string;
    coordinates: [number, number];
  } | null>(
    initialData?.sourceAddress && initialData?.sourceLat && initialData?.sourceLng
      ? {
          address: initialData.sourceAddress,
          coordinates: [initialData.sourceLng, initialData.sourceLat],
        }
      : null
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FeedstockDeliveryInput>({
    resolver: zodResolver(createFeedstockDeliverySchema),
    defaultValues: initialData
      ? {
          ...initialData,
          date: initialData.date
            ? new Date(initialData.date).toISOString().split('T')[0]
            : undefined,
        }
      : {
          date: new Date().toISOString().split('T')[0],
        },
  });

  const handleSourceLocationChange = (result: { address: string; coordinates: [number, number] } | null) => {
    setSourceLocation(result);
    if (result) {
      setValue('sourceAddress', result.address);
      setValue('sourceLat', result.coordinates[1]);
      setValue('sourceLng', result.coordinates[0]);
    } else {
      setValue('sourceAddress', null);
      setValue('sourceLat', null);
      setValue('sourceLng', null);
    }
  };

  const onSubmit = async (data: FeedstockDeliveryInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url =
        mode === 'create'
          ? '/api/feedstock'
          : `/api/feedstock/${initialData?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to save feedstock delivery');
      }

      router.push('/feedstock');
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
          <CardTitle className="text-lg">Delivery Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="date">Delivery Date *</Label>
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
            <div className="flex items-center gap-1.5">
              <Label htmlFor="feedstockType">Feedstock Type *</Label>
              <HelpTooltip content="The biomass type affects carbon content calculations in LCA" />
            </div>
            <Select
              id="feedstockType"
              {...register('feedstockType')}
              className={errors.feedstockType ? 'border-red-500' : ''}
            >
              <option value="">Select type...</option>
              {FEEDSTOCK_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
            {errors.feedstockType && (
              <p className="text-sm text-red-500">
                {errors.feedstockType.message}
              </p>
            )}
          </div>

          {watch('feedstockType') === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="feedstockTypeOther">Please specify *</Label>
              <Input
                id="feedstockTypeOther"
                {...register('feedstockTypeOther')}
                placeholder="Enter feedstock type..."
                className={errors.feedstockTypeOther ? 'border-red-500' : ''}
              />
              {errors.feedstockTypeOther && (
                <p className="text-sm text-red-500">
                  {errors.feedstockTypeOther.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="weightTonnes">Weight (tonnes)</Label>
            <Input
              id="weightTonnes"
              type="number"
              step="0.01"
              {...register('weightTonnes')}
              className={errors.weightTonnes ? 'border-red-500' : ''}
            />
            {errors.weightTonnes && (
              <p className="text-sm text-red-500">
                {errors.weightTonnes.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="volumeM3">Volume (m³)</Label>
            <Input
              id="volumeM3"
              type="number"
              step="0.01"
              {...register('volumeM3')}
              className={errors.volumeM3 ? 'border-red-500' : ''}
            />
            {errors.volumeM3 && (
              <p className="text-sm text-red-500">{errors.volumeM3.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Source Location *</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label>Feedstock Source Address *</Label>
              <HelpTooltip content="Search for the location where feedstock was collected. The delivery distance will be calculated automatically from this address to your plant." />
            </div>
            <AddressSearch
              value={sourceLocation}
              onChange={handleSourceLocationChange}
              placeholder="Search for source address..."
            />
            {(errors.sourceAddress || errors.sourceLat || errors.sourceLng) && (
              <p className="text-sm text-red-500">
                Source address is required
              </p>
            )}
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            The delivery distance will be calculated automatically based on the driving route from this address to your plant location.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transport Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
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

          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="fuelType">Fuel Type</Label>
              <HelpTooltip content="Different fuel types have different emission factors" />
            </div>
            <Select id="fuelType" {...register('fuelType')}>
              <option value="">Select fuel type...</option>
              {FUEL_TYPES.map((type) => (
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
                <p className="text-sm text-red-500">
                  {errors.fuelTypeOther.message}
                </p>
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
              placeholder="Any additional notes about this delivery..."
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
            'Create Delivery'
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  );
}
