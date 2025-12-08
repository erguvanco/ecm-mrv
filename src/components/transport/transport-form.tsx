'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  createTransportEventSchema,
  TransportEventInput,
  TRANSPORT_FUEL_TYPES,
  DEFAULT_ORIGIN_ADDRESS,
  DEFAULT_ORIGIN_COORDS,
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
import { AddressSearch } from '@/components/network';

interface TransportFormProps {
  initialData?: TransportEventInput & { id?: string };
  mode: 'create' | 'edit';
}

export function TransportForm({ initialData, mode }: TransportFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Origin location state - default to Garanti Karadeniz plant
  const [originLocation, setOriginLocation] = useState<{
    address: string;
    coordinates: [number, number];
  } | null>(
    initialData?.originAddress
      ? {
          address: initialData.originAddress,
          coordinates: [initialData.originLng, initialData.originLat],
        }
      : {
          address: DEFAULT_ORIGIN_ADDRESS,
          coordinates: [DEFAULT_ORIGIN_COORDS.lng, DEFAULT_ORIGIN_COORDS.lat],
        }
  );

  // Destination location state
  const [destinationLocation, setDestinationLocation] = useState<{
    address: string;
    coordinates: [number, number];
  } | null>(
    initialData?.destinationAddress && initialData?.destinationLat && initialData?.destinationLng
      ? {
          address: initialData.destinationAddress,
          coordinates: [initialData.destinationLng, initialData.destinationLat],
        }
      : null
  );

  const formatDateForInput = (date: Date | string | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createTransportEventSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          date: formatDateForInput(initialData.date),
        }
      : {
          date: formatDateForInput(new Date()),
          originAddress: DEFAULT_ORIGIN_ADDRESS,
          originLat: DEFAULT_ORIGIN_COORDS.lat,
          originLng: DEFAULT_ORIGIN_COORDS.lng,
          destinationAddress: '',
          destinationLat: 0,
          destinationLng: 0,
          distanceKm: 0,
          vehicleId: '',
          vehicleDescription: '',
          fuelType: '',
          fuelTypeOther: '',
          fuelAmount: null,
          cargoDescription: '',
          feedstockDeliveryId: '',
          sequestrationEventId: '',
          notes: '',
        },
  });

  // Handle origin location change
  const handleOriginChange = (result: { address: string; coordinates: [number, number] } | null) => {
    setOriginLocation(result);
    if (result) {
      setValue('originAddress', result.address);
      setValue('originLat', result.coordinates[1]);
      setValue('originLng', result.coordinates[0]);
    } else {
      setValue('originAddress', '');
      setValue('originLat', 0);
      setValue('originLng', 0);
    }
  };

  // Handle destination location change
  const handleDestinationChange = (result: { address: string; coordinates: [number, number] } | null) => {
    setDestinationLocation(result);
    if (result) {
      setValue('destinationAddress', result.address);
      setValue('destinationLat', result.coordinates[1]);
      setValue('destinationLng', result.coordinates[0]);
    } else {
      setValue('destinationAddress', '');
      setValue('destinationLat', 0);
      setValue('destinationLng', 0);
    }
  };

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
    <form onSubmit={handleSubmit(onSubmit as unknown as Parameters<typeof handleSubmit>[0])} className="space-y-6">
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
          <CardTitle className="text-lg">Route</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label>Origin *</Label>
            <AddressSearch
              value={originLocation}
              onChange={handleOriginChange}
              placeholder="Search for origin address..."
              error={errors.originAddress?.message}
            />
            {/* Hidden fields for form submission */}
            <input type="hidden" {...register('originAddress')} />
            <input type="hidden" {...register('originLat')} />
            <input type="hidden" {...register('originLng')} />
          </div>

          <div className="space-y-2">
            <Label>Destination *</Label>
            <AddressSearch
              value={destinationLocation}
              onChange={handleDestinationChange}
              placeholder="Search for destination address..."
              error={errors.destinationAddress?.message}
            />
            {/* Hidden fields for form submission */}
            <input type="hidden" {...register('destinationAddress')} />
            <input type="hidden" {...register('destinationLat')} />
            <input type="hidden" {...register('destinationLng')} />
          </div>

          <div className="space-y-2 md:w-1/2">
            <Label htmlFor="distanceKm">Distance (km)</Label>
            <Input
              id="distanceKm"
              type="number"
              step="0.1"
              {...register('distanceKm')}
              placeholder="Auto-calculated or enter manually"
              className={errors.distanceKm ? 'border-red-500' : ''}
            />
            <p className="text-xs text-[var(--muted-foreground)]">
              Leave at 0 to auto-calculate based on route
            </p>
            {errors.distanceKm && (
              <p className="text-sm text-red-500">{errors.distanceKm.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vehicle Information</CardTitle>
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
