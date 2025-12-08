'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatDateTime } from '@/lib/utils';
import { createBCUSchema, type BCUInput } from '@/lib/validations/bcu';
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

interface SequestrationOption {
  id: string;
  finalDeliveryDate: string;
  sequestrationType: string;
  quantityTonnes: number;
}

interface IssueBCUFormProps {
  sequestrationOptions: SequestrationOption[];
}

export function IssueBCUForm({ sequestrationOptions }: IssueBCUFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<SequestrationOption | null>(
    null
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createBCUSchema),
    defaultValues: {
      issuanceDate: new Date().toISOString().split('T')[0],
      status: 'issued' as const,
      registrySerialNumber: '',
      quantityTonnesCO2e: 0,
      ownerName: '',
      notes: '',
    },
  });

  const handleEventSelect = (eventId: string) => {
    const event = sequestrationOptions.find((e) => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      // Calculate CO2e (2.5 factor for biochar)
      const co2e = event.quantityTonnes * 2.5;
      setValue('quantityTonnesCO2e', co2e);
    } else {
      setSelectedEvent(null);
    }
  };

  const onSubmit = async (data: BCUInput) => {
    if (!selectedEvent) {
      setError('Please select a sequestration event');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/registry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          sequestrationEventId: selectedEvent.id,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to issue BCU');
      }

      router.push('/registry');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit as unknown as Parameters<typeof handleSubmit>[0])} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-50 p-4 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sequestration Event</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sequestrationEvent">
              Select Sequestration Event *
            </Label>
            <Select
              id="sequestrationEvent"
              onChange={(e) => handleEventSelect(e.target.value)}
            >
              <option value="">Select event...</option>
              {sequestrationOptions.map((event) => (
                <option key={event.id} value={event.id}>
                  {formatDateTime(event.finalDeliveryDate)} -{' '}
                  {event.sequestrationType} ({event.quantityTonnes.toFixed(2)}t)
                </option>
              ))}
            </Select>
          </div>

          {selectedEvent && (
            <div className="bg-[var(--muted)] p-4">
              <p className="text-sm">
                <span className="font-medium">Biochar quantity:</span>{' '}
                {selectedEvent.quantityTonnes.toFixed(2)} tonnes
              </p>
              <p className="text-sm">
                <span className="font-medium">Estimated CO2e removal:</span>{' '}
                {(selectedEvent.quantityTonnes * 2.5).toFixed(2)} tCO2e
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">BCU Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="quantityTonnesCO2e">Quantity (tCO2e) *</Label>
            <Input
              id="quantityTonnesCO2e"
              type="number"
              step="0.01"
              {...register('quantityTonnesCO2e')}
              className={errors.quantityTonnesCO2e ? 'border-red-500' : ''}
            />
            {errors.quantityTonnesCO2e && (
              <p className="text-sm text-red-500">
                {errors.quantityTonnesCO2e.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="issuanceDate">Issuance Date *</Label>
            <Input
              id="issuanceDate"
              type="date"
              {...register('issuanceDate')}
              className={errors.issuanceDate ? 'border-red-500' : ''}
            />
            {errors.issuanceDate && (
              <p className="text-sm text-red-500">
                {errors.issuanceDate.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="registrySerialNumber">Serial Number *</Label>
            <Input
              id="registrySerialNumber"
              {...register('registrySerialNumber')}
              placeholder="Auto-generated if left blank"
              className={errors.registrySerialNumber ? 'border-red-500' : ''}
            />
            {errors.registrySerialNumber && (
              <p className="text-sm text-red-500">
                {errors.registrySerialNumber.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerName">Initial Owner</Label>
            <Input
              id="ownerName"
              {...register('ownerName')}
              placeholder="Optional owner name"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Any additional notes..."
              rows={2}
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
        <Button type="submit" disabled={isSubmitting || !selectedEvent}>
          {isSubmitting ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Issuing...
            </>
          ) : (
            'Issue BCU'
          )}
        </Button>
      </div>
    </form>
  );
}
