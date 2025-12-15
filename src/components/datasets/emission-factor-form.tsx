'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  emissionFactorSchema,
  type EmissionFactorInput,
  CATEGORIES,
  SOURCES,
  REGIONS,
} from '@/lib/validations/emission-factor';

interface EmissionFactor extends EmissionFactorInput {
  id: string;
}

interface EmissionFactorFormProps {
  factor?: EmissionFactor;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EmissionFactorForm({ factor, onSuccess, onCancel }: EmissionFactorFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!factor;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmissionFactorInput>({
    resolver: zodResolver(emissionFactorSchema),
    defaultValues: factor || {
      name: '',
      category: 'electricity',
      unit: '',
      year: new Date().getFullYear(),
      source: 'DEFRA',
      region: 'UK',
      totalCo2e: 0,
      isActive: true,
    },
  });

  const category = watch('category');
  const source = watch('source');

  const onSubmit = async (data: EmissionFactorInput) => {
    setIsSubmitting(true);
    try {
      const url = isEditing ? `/api/datasets/${factor.id}` : '/api/datasets';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving emission factor:', error);
      alert(error instanceof Error ? error.message : 'Failed to save emission factor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="e.g., Grid Electricity UK 2024"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <Label htmlFor="category">Category *</Label>
          <select
            id="category"
            value={category}
            onChange={(e) => setValue('category', e.target.value as EmissionFactorInput['category'])}
            className={`w-full h-10 rounded-md border bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] ${errors.category ? 'border-red-500' : 'border-[var(--border)]'}`}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {category === 'other' && (
          <div>
            <Label htmlFor="categoryOther">Custom Category</Label>
            <Input id="categoryOther" {...register('categoryOther')} />
          </div>
        )}

        <div>
          <Label htmlFor="unit">Unit *</Label>
          <Input
            id="unit"
            {...register('unit')}
            placeholder="e.g., kgCO2e/kWh"
            className={errors.unit ? 'border-red-500' : ''}
          />
          {errors.unit && <p className="text-sm text-red-500 mt-1">{errors.unit.message}</p>}
        </div>

        <div>
          <Label htmlFor="year">Year *</Label>
          <Input
            id="year"
            type="number"
            {...register('year')}
            min={1990}
            max={2100}
            className={errors.year ? 'border-red-500' : ''}
          />
          {errors.year && <p className="text-sm text-red-500 mt-1">{errors.year.message}</p>}
        </div>

        <div>
          <Label htmlFor="source">Source *</Label>
          <select
            id="source"
            value={source}
            onChange={(e) => setValue('source', e.target.value as EmissionFactorInput['source'])}
            className={`w-full h-10 rounded-md border bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] ${errors.source ? 'border-red-500' : 'border-[var(--border)]'}`}
          >
            {SOURCES.map((src) => (
              <option key={src.value} value={src.value}>
                {src.label}
              </option>
            ))}
          </select>
        </div>

        {source === 'Custom' && (
          <div>
            <Label htmlFor="sourceOther">Custom Source</Label>
            <Input id="sourceOther" {...register('sourceOther')} placeholder="Source name" />
          </div>
        )}

        <div>
          <Label htmlFor="region">Region</Label>
          <select
            id="region"
            value={watch('region') || ''}
            onChange={(e) => setValue('region', e.target.value)}
            className="w-full h-10 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            <option value="">Select region</option>
            {REGIONS.map((reg) => (
              <option key={reg.value} value={reg.value}>
                {reg.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <h4 className="font-medium mb-3">GHG Breakdown (optional)</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="co2Factor">CO2 Factor</Label>
            <Input
              id="co2Factor"
              type="number"
              step="any"
              {...register('co2Factor')}
              placeholder="kg CO2/unit"
            />
          </div>
          <div>
            <Label htmlFor="ch4Factor">CH4 Factor</Label>
            <Input
              id="ch4Factor"
              type="number"
              step="any"
              {...register('ch4Factor')}
              placeholder="kg CH4/unit"
            />
          </div>
          <div>
            <Label htmlFor="n2oFactor">N2O Factor</Label>
            <Input
              id="n2oFactor"
              type="number"
              step="any"
              {...register('n2oFactor')}
              placeholder="kg N2O/unit"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="totalCo2e">Total CO2e *</Label>
            <Input
              id="totalCo2e"
              type="number"
              step="any"
              {...register('totalCo2e')}
              placeholder="kg CO2e/unit"
              className={errors.totalCo2e ? 'border-red-500' : ''}
            />
            {errors.totalCo2e && <p className="text-sm text-red-500 mt-1">{errors.totalCo2e.message}</p>}
          </div>
          <div>
            <Label htmlFor="gwpCh4">GWP CH4</Label>
            <Input
              id="gwpCh4"
              type="number"
              step="any"
              {...register('gwpCh4')}
              placeholder="e.g., 28"
            />
          </div>
          <div>
            <Label htmlFor="gwpN2o">GWP N2O</Label>
            <Input
              id="gwpN2o"
              type="number"
              step="any"
              {...register('gwpN2o')}
              placeholder="e.g., 265"
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          placeholder="Additional information about this emission factor"
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
