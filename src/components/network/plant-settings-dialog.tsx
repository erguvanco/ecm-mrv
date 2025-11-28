'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
  Label,
  Spinner,
} from '@/components/ui';

interface PlantSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    plantName: string;
    address: string | null;
    lat: number | null;
    lng: number | null;
  };
}

export function PlantSettingsDialog({
  open,
  onOpenChange,
  initialData,
}: PlantSettingsDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [plantName, setPlantName] = useState(initialData?.plantName || 'Biochar Plant');
  const [address, setAddress] = useState(initialData?.address || '');
  const [lat, setLat] = useState<string>(initialData?.lat?.toString() || '');
  const [lng, setLng] = useState<string>(initialData?.lng?.toString() || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setPlantName(initialData.plantName);
      setAddress(initialData.address || '');
      setLat(initialData.lat?.toString() || '');
      setLng(initialData.lng?.toString() || '');
    }
  }, [initialData]);

  const handleGeocode = async () => {
    if (!address.trim()) return;

    setIsGeocoding(true);
    setError(null);

    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(address)}&mode=geocode`);
      const result = await response.json();

      if (result.success) {
        setLat(result.lat.toString());
        setLng(result.lng.toString());
      } else {
        setError(result.error || 'Failed to geocode address');
      }
    } catch {
      setError('Failed to geocode address');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/settings/plant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plantName,
          address: address || null,
          lat: lat ? parseFloat(lat) : null,
          lng: lng ? parseFloat(lng) : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save plant settings');
      }

      router.refresh();
      onOpenChange(false);
    } catch {
      setError('Failed to save plant settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Plant Location</DialogTitle>
          <DialogDescription>
            Set your plant location to center the network map.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="plantName">Plant Name</Label>
            <Input
              id="plantName"
              value={plantName}
              onChange={(e) => setPlantName(e.target.value)}
              placeholder="Biochar Plant"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <div className="flex gap-2">
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter address or postcode"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleGeocode}
                disabled={isGeocoding || !address.trim()}
              >
                {isGeocoding ? <Spinner className="h-4 w-4" /> : 'Lookup'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lat">Latitude</Label>
              <Input
                id="lat"
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="52.2053"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lng">Longitude</Label>
              <Input
                id="lng"
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="0.1218"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                'Save Location'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
