'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { PageContainer, PageHeader } from '@/components/layout/page-container';
import { Button, Spinner, Card, CardContent } from '@/components/ui';
import { PlantSettingsDialog } from '@/components/network';
import { Settings, MapPin } from 'lucide-react';

// Dynamic import for NetworkMap to avoid SSR issues with mapbox-gl
const NetworkMap = dynamic(
  () => import('@/components/network/network-map').then((mod) => mod.NetworkMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    ),
  }
);

interface MapData {
  plant: {
    plantName: string;
    lat: number | null;
    lng: number | null;
    address: string | null;
  };
  feedstockSources: Array<{
    id: string;
    date: string;
    feedstockType: string;
    sourceAddress: string | null;
    lat: number;
    lng: number;
    weightTonnes: number | null;
    deliveryDistanceKm: number;
    routeGeometry: GeoJSON.LineString | null;
    routeDistanceKm: number | null;
    routeStatus: string | null;
    truckPhotoUrl: string | null;
  }>;
  destinations: Array<{
    id: string;
    finalDeliveryDate: string;
    sequestrationType: string;
    deliveryPostcode: string;
    lat: number;
    lng: number;
    quantityTonnes: number;
    routeGeometry: GeoJSON.LineString | null;
    routeDistanceKm: number | null;
    routeStatus: string | null;
  }>;
  stats: {
    totalFeedstock: number;
    geocodedFeedstock: number;
    totalSequestration: number;
    geocodedSequestration: number;
  };
}

export default function NetworkPage() {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPlantSettings, setShowPlantSettings] = useState(false);

  const fetchMapData = async () => {
    try {
      const response = await fetch('/api/map');
      if (!response.ok) throw new Error('Failed to fetch map data');
      const data = await response.json();
      setMapData(data);

      // Auto-show plant settings if no plant location
      if (!data.plant.lat || !data.plant.lng) {
        setShowPlantSettings(true);
      }
    } catch {
      setError('Failed to load map data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, []);

  const handlePlantSettingsClose = (open: boolean) => {
    setShowPlantSettings(open);
    if (!open) {
      // Refresh data after closing settings
      fetchMapData();
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="flex h-[calc(100vh-200px)] items-center justify-center">
          <p className="text-[var(--muted-foreground)]">{error}</p>
        </div>
      </PageContainer>
    );
  }

  const hasPlantLocation = mapData?.plant.lat && mapData?.plant.lng;
  const totalMapped = (mapData?.feedstockSources.length || 0) + (mapData?.destinations.length || 0);

  return (
    <PageContainer>
      <PageHeader
        title="Supply Network"
        description="Visualize feedstock sources and sequestration destinations"
        action={
          <Button variant="outline" onClick={() => setShowPlantSettings(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Plant Location
          </Button>
        }
      />

      {!hasPlantLocation ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MapPin className="h-12 w-12 text-[var(--muted-foreground)] mb-4" />
            <h3 className="text-lg font-medium mb-2">Set Plant Location</h3>
            <p className="text-[var(--muted-foreground)] text-center mb-6 max-w-md">
              Configure your plant location to view the supply network map. This will be the center point for all feedstock sources and sequestration destinations.
            </p>
            <Button onClick={() => setShowPlantSettings(true)}>
              Set Location
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <p className="text-2xl font-semibold">{mapData?.feedstockSources.length || 0}</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Feedstock Sources
                  {mapData && mapData.stats.totalFeedstock > mapData.feedstockSources.length && (
                    <span className="text-amber-600 ml-1">
                      ({mapData.stats.totalFeedstock - mapData.feedstockSources.length} unmapped)
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-2xl font-semibold">{mapData?.destinations.length || 0}</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Destinations
                  {mapData && mapData.stats.totalSequestration > mapData.destinations.length && (
                    <span className="text-amber-600 ml-1">
                      ({mapData.stats.totalSequestration - mapData.destinations.length} unmapped)
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-2xl font-semibold">{totalMapped}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Total Locations</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-2xl font-semibold">{mapData?.plant.plantName}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Plant</p>
              </CardContent>
            </Card>
          </div>

          {/* Map */}
          <div className="h-[calc(100vh-340px)] min-h-[400px]">
            {mapData && (
              <NetworkMap
                plant={mapData.plant}
                feedstockSources={mapData.feedstockSources}
                destinations={mapData.destinations}
                onPlantClick={() => setShowPlantSettings(true)}
              />
            )}
          </div>
        </>
      )}

      <PlantSettingsDialog
        open={showPlantSettings}
        onOpenChange={handlePlantSettingsClose}
        initialData={mapData?.plant}
      />
    </PageContainer>
  );
}
