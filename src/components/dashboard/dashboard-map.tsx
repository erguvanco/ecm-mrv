'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Spinner } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, ArrowRight } from 'lucide-react';
import { MapTimeFilter } from '@/components/network/map-time-filter';

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
}

export function DashboardMap() {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize with current month/year
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const fetchMapData = useCallback(async (month: number, year: number) => {
    setIsLoading(true);
    try {
      const url = `/api/map?month=${month}&year=${year}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch map data');
      const data = await response.json();
      setMapData(data);
    } catch {
      setError('Failed to load map data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMapData(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear, fetchMapData]);

  const handleTimeChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const hasPlantLocation = mapData?.plant.lat && mapData?.plant.lng;
  const hasData = (mapData?.feedstockSources.length || 0) + (mapData?.destinations.length || 0) > 0;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Supply Network</CardTitle>
          <div className="flex items-center gap-3">
            <MapTimeFilter
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onChange={handleTimeChange}
            />
            <Link
              href="/network"
              className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              View full map
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] rounded overflow-hidden">
          {isLoading ? (
            <div className="flex h-full items-center justify-center bg-[var(--muted)]">
              <Spinner className="h-8 w-8" />
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center bg-[var(--muted)]">
              <p className="text-sm text-[var(--muted-foreground)]">{error}</p>
            </div>
          ) : !hasPlantLocation ? (
            <div className="flex flex-col h-full items-center justify-center bg-[var(--muted)]">
              <MapPin className="h-8 w-8 text-[var(--muted-foreground)] mb-3" />
              <p className="text-sm text-[var(--muted-foreground)] mb-1">No plant location set</p>
              <Link
                href="/network"
                className="text-xs text-[var(--primary)] hover:underline"
              >
                Configure in Network settings
              </Link>
            </div>
          ) : !hasData ? (
            <div className="flex flex-col h-full items-center justify-center bg-[var(--muted)]">
              <MapPin className="h-8 w-8 text-[var(--muted-foreground)] mb-3" />
              <p className="text-sm text-[var(--muted-foreground)]">No locations to display yet</p>
            </div>
          ) : (
            <NetworkMap
              plant={mapData.plant}
              feedstockSources={mapData.feedstockSources}
              destinations={mapData.destinations}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
