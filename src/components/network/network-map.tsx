'use client';

import { useCallback, useState, useEffect, useMemo } from 'react';
import { Factory, Leaf, ArrowDownToLine, Loader2, X, ChevronDown } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { QRDisplay } from '@/components/qr/qr-display';
import { Button } from '@/components/ui/button';

// Import mapbox components - will only render client-side due to isMounted check
import Map, { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl/mapbox';
import type { MapMouseEvent, MarkerEvent } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

interface PlantData {
  plantName: string;
  lat: number | null;
  lng: number | null;
  address: string | null;
}

interface FeedstockSource {
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
}

interface Destination {
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
}

// Aggregated location types
interface AggregatedFeedstockLocation {
  lat: number;
  lng: number;
  address: string | null;
  deliveries: FeedstockSource[];
  totalWeight: number;
}

interface AggregatedDestinationLocation {
  lat: number;
  lng: number;
  postcode: string;
  deliveries: Destination[];
  totalQuantity: number;
}

interface NetworkMapProps {
  plant: PlantData;
  feedstockSources: FeedstockSource[];
  destinations: Destination[];
  onPlantClick?: () => void;
}

type PopupInfo =
  | {
      type: 'plant';
      data: PlantData;
      lng: number;
      lat: number;
    }
  | {
      type: 'feedstock';
      data: AggregatedFeedstockLocation;
      lng: number;
      lat: number;
    }
  | {
      type: 'destination';
      data: AggregatedDestinationLocation;
      lng: number;
      lat: number;
    }
  | null;

type SelectedRoute = {
  id: string;
  type: 'feedstock' | 'destination';
  data: FeedstockSource | Destination;
  lng: number;
  lat: number;
} | null;

export function NetworkMap({
  plant,
  feedstockSources,
  destinations,
  onPlantClick,
}: NetworkMapProps) {
  const [popupInfo, setPopupInfo] = useState<PopupInfo>(null);
  const [selectedRoute, setSelectedRoute] = useState<SelectedRoute>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedFeedstockLocation, setSelectedFeedstockLocation] = useState<AggregatedFeedstockLocation | null>(null);
  const [selectedDestinationLocation, setSelectedDestinationLocation] = useState<AggregatedDestinationLocation | null>(null);
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);

  // Set mounted state for client-side only rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Aggregate feedstock sources by coordinates
  const aggregatedFeedstockLocations: AggregatedFeedstockLocation[] = useMemo(() => {
    const locationMap: Record<string, AggregatedFeedstockLocation> = {};

    feedstockSources.forEach((source) => {
      const key = `${source.lat},${source.lng}`;
      const existing = locationMap[key];

      if (existing) {
        existing.deliveries.push(source);
        existing.totalWeight += source.weightTonnes || 0;
      } else {
        locationMap[key] = {
          lat: source.lat,
          lng: source.lng,
          address: source.sourceAddress,
          deliveries: [source],
          totalWeight: source.weightTonnes || 0,
        };
      }
    });

    return Object.values(locationMap);
  }, [feedstockSources]);

  // Aggregate destinations by coordinates
  const aggregatedDestinationLocations: AggregatedDestinationLocation[] = useMemo(() => {
    const locationMap: Record<string, AggregatedDestinationLocation> = {};

    destinations.forEach((dest) => {
      const key = `${dest.lat},${dest.lng}`;
      const existing = locationMap[key];

      if (existing) {
        existing.deliveries.push(dest);
        existing.totalQuantity += dest.quantityTonnes || 0;
      } else {
        locationMap[key] = {
          lat: dest.lat,
          lng: dest.lng,
          postcode: dest.deliveryPostcode,
          deliveries: [dest],
          totalQuantity: dest.quantityTonnes || 0,
        };
      }
    });

    return Object.values(locationMap);
  }, [destinations]);

  // All useCallback hooks must be called before any early returns (Rules of Hooks)
  const handlePlantMarkerClick = useCallback(
    (e: MarkerEvent<MouseEvent>, data: PlantData, lng: number, lat: number) => {
      e.originalEvent?.stopPropagation();
      setPopupInfo({ type: 'plant', data, lng, lat });
      setSelectedRoute(null);
    },
    []
  );

  const handleFeedstockMarkerClick = useCallback(
    (e: MarkerEvent<MouseEvent>, data: AggregatedFeedstockLocation) => {
      e.originalEvent?.stopPropagation();
      setPopupInfo({ type: 'feedstock', data, lng: data.lng, lat: data.lat });
      setSelectedRoute(null);
      setSelectedFeedstockLocation(data);
      setSelectedDestinationLocation(null);
      setIsPanelMinimized(false);
    },
    []
  );

  const handleDestinationMarkerClick = useCallback(
    (e: MarkerEvent<MouseEvent>, data: AggregatedDestinationLocation) => {
      e.originalEvent?.stopPropagation();
      setPopupInfo({ type: 'destination', data, lng: data.lng, lat: data.lat });
      setSelectedRoute(null);
      setSelectedDestinationLocation(data);
      setSelectedFeedstockLocation(null);
      setIsPanelMinimized(false);
    },
    []
  );

  const closePanel = useCallback(() => {
    setSelectedFeedstockLocation(null);
    setSelectedDestinationLocation(null);
    setPopupInfo(null);
  }, []);

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      // Check if clicked on a route layer
      const features = e.features;
      if (features && features.length > 0) {
        const feature = features[0];
        const props = feature.properties;
        if (props && props.id) {
          const routeType = props.type as 'feedstock' | 'destination';
          const routeData =
            routeType === 'feedstock'
              ? feedstockSources.find((f) => f.id === props.id)
              : destinations.find((d) => d.id === props.id);

          if (routeData) {
            setSelectedRoute({
              id: props.id,
              type: routeType,
              data: routeData,
              lng: e.lngLat.lng,
              lat: e.lngLat.lat,
            });
            setPopupInfo(null);
            return;
          }
        }
      }

      // Close popup and deselect route on map click if not clicking a marker or route
      if (popupInfo) {
        setPopupInfo(null);
      }
      if (selectedRoute) {
        setSelectedRoute(null);
      }
    },
    [popupInfo, selectedRoute, feedstockSources, destinations]
  );

  // Show loading state until mounted (prevents SSR issues)
  if (!isMounted) {
    return (
      <div className="relative h-full w-full rounded border overflow-hidden flex items-center justify-center bg-muted/20">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm">Loading map...</span>
        </div>
      </div>
    );
  }

  // Calculate bounds to fit all markers
  const allPoints = [
    ...(plant.lat && plant.lng ? [[plant.lng, plant.lat]] : []),
    ...aggregatedFeedstockLocations.map((f) => [f.lng, f.lat]),
    ...aggregatedDestinationLocations.map((d) => [d.lng, d.lat]),
  ];

  // Default to UK center if no points
  const initialViewState = {
    longitude: plant.lng || -1.5,
    latitude: plant.lat || 52.5,
    zoom: allPoints.length > 1 ? 6 : 8,
  };

  // Create GeoJSON for connection lines
  // Use actual route geometries when available, fall back to straight lines
  const feedstockLines = feedstockSources
    .filter(() => plant.lat !== null && plant.lng !== null)
    .map((f) => ({
      type: 'Feature' as const,
      properties: {
        id: f.id,
        type: 'feedstock',
        hasRoute: !!f.routeGeometry,
        feedstockType: f.feedstockType,
        distanceKm: f.routeDistanceKm || f.deliveryDistanceKm,
        weightTonnes: f.weightTonnes,
        date: f.date,
      },
      geometry: f.routeGeometry || {
        type: 'LineString' as const,
        coordinates: [
          [f.lng, f.lat],
          [plant.lng!, plant.lat!],
        ] as [number, number][],
      },
    }));

  const destinationLines = destinations
    .filter(() => plant.lat !== null && plant.lng !== null)
    .map((d) => ({
      type: 'Feature' as const,
      properties: {
        id: d.id,
        type: 'destination',
        hasRoute: !!d.routeGeometry,
        sequestrationType: d.sequestrationType,
        distanceKm: d.routeDistanceKm,
        quantityTonnes: d.quantityTonnes,
        date: d.finalDeliveryDate,
      },
      geometry: d.routeGeometry || {
        type: 'LineString' as const,
        coordinates: [
          [plant.lng!, plant.lat!],
          [d.lng, d.lat],
        ] as [number, number][],
      },
    }));

  const linesGeoJSON: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: [...feedstockLines, ...destinationLines],
  };

  // Create GeoJSON for highlighted route
  const selectedRouteGeoJSON: GeoJSON.FeatureCollection | null = selectedRoute
    ? {
        type: 'FeatureCollection',
        features:
          selectedRoute.type === 'feedstock'
            ? feedstockLines.filter((f) => f.properties.id === selectedRoute.id)
            : destinationLines.filter((d) => d.properties.id === selectedRoute.id),
      }
    : null;

  return (
    <div className="relative h-full w-full rounded border overflow-hidden">
      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={initialViewState}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        onClick={handleMapClick}
        interactiveLayerIds={[
          'feedstock-lines-route',
          'feedstock-lines-fallback',
          'destination-lines-route',
          'destination-lines-fallback',
        ]}
        cursor={selectedRoute ? 'pointer' : 'grab'}
      >
        <NavigationControl position="bottom-right" />

        {/* Connection Lines */}
        <Source id="connection-lines" type="geojson" data={linesGeoJSON}>
          {/* Feedstock lines with actual routes (solid green) */}
          <Layer
            id="feedstock-lines-route"
            type="line"
            filter={['all', ['==', ['get', 'type'], 'feedstock'], ['==', ['get', 'hasRoute'], true]]}
            paint={{
              'line-color': '#16a34a',
              'line-width': 2.5,
              'line-opacity': 0.8,
            }}
          />
          {/* Feedstock lines fallback (dashed green) */}
          <Layer
            id="feedstock-lines-fallback"
            type="line"
            filter={['all', ['==', ['get', 'type'], 'feedstock'], ['==', ['get', 'hasRoute'], false]]}
            paint={{
              'line-color': '#16a34a',
              'line-width': 1.5,
              'line-opacity': 0.4,
              'line-dasharray': [2, 2],
            }}
          />
          {/* Destination lines with actual routes (solid blue) */}
          <Layer
            id="destination-lines-route"
            type="line"
            filter={['all', ['==', ['get', 'type'], 'destination'], ['==', ['get', 'hasRoute'], true]]}
            paint={{
              'line-color': '#2563eb',
              'line-width': 2.5,
              'line-opacity': 0.8,
            }}
          />
          {/* Destination lines fallback (dashed blue) */}
          <Layer
            id="destination-lines-fallback"
            type="line"
            filter={['all', ['==', ['get', 'type'], 'destination'], ['==', ['get', 'hasRoute'], false]]}
            paint={{
              'line-color': '#2563eb',
              'line-width': 1.5,
              'line-opacity': 0.4,
              'line-dasharray': [2, 2],
            }}
          />
        </Source>

        {/* Highlighted Route */}
        {selectedRouteGeoJSON && (
          <Source id="selected-route" type="geojson" data={selectedRouteGeoJSON}>
            <Layer
              id="selected-route-glow"
              type="line"
              paint={{
                'line-color': selectedRoute?.type === 'feedstock' ? '#16a34a' : '#2563eb',
                'line-width': 8,
                'line-opacity': 0.3,
                'line-blur': 3,
              }}
            />
            <Layer
              id="selected-route-line"
              type="line"
              paint={{
                'line-color': selectedRoute?.type === 'feedstock' ? '#16a34a' : '#2563eb',
                'line-width': 4,
                'line-opacity': 1,
              }}
            />
          </Source>
        )}

        {/* Plant Marker */}
        {plant.lat && plant.lng && (
          <Marker
            longitude={plant.lng}
            latitude={plant.lat}
            anchor="center"
            onClick={(e) => {
              handlePlantMarkerClick(e, plant, plant.lng!, plant.lat!);
              onPlantClick?.();
            }}
          >
            <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#0a0a0a] text-white shadow-lg transition-transform hover:scale-110">
              <Factory className="h-5 w-5" />
            </div>
          </Marker>
        )}

        {/* Aggregated Feedstock Markers */}
        {aggregatedFeedstockLocations.map((location) => (
          <Marker
            key={`feedstock-${location.lat},${location.lng}`}
            longitude={location.lng}
            latitude={location.lat}
            anchor="center"
            onClick={(e) => handleFeedstockMarkerClick(e, location)}
          >
            <div className="relative cursor-pointer transition-transform hover:scale-110">
              <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0a0a0a] bg-white shadow">
                <Leaf className="h-3.5 w-3.5 text-[#0a0a0a]" />
              </div>
              {location.deliveries.length > 1 && (
                <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#16a34a] text-[10px] font-medium text-white shadow">
                  {location.deliveries.length}
                </div>
              )}
            </div>
          </Marker>
        ))}

        {/* Aggregated Destination Markers */}
        {aggregatedDestinationLocations.map((location) => (
          <Marker
            key={`dest-${location.lat},${location.lng}`}
            longitude={location.lng}
            latitude={location.lat}
            anchor="center"
            onClick={(e) => handleDestinationMarkerClick(e, location)}
          >
            <div className="relative cursor-pointer transition-transform hover:scale-110">
              <div className="flex h-7 w-7 items-center justify-center rounded border-2 border-[#0a0a0a] bg-white shadow">
                <ArrowDownToLine className="h-3.5 w-3.5 text-[#0a0a0a]" />
              </div>
              {location.deliveries.length > 1 && (
                <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#2563eb] text-[10px] font-medium text-white shadow">
                  {location.deliveries.length}
                </div>
              )}
            </div>
          </Marker>
        ))}

        {/* Plant Popup only */}
        {popupInfo && popupInfo.type === 'plant' && (
          <Popup
            longitude={popupInfo.lng}
            latitude={popupInfo.lat}
            anchor="bottom"
            onClose={() => setPopupInfo(null)}
            closeButton={true}
            closeOnClick={false}
            className="network-popup"
          >
            <div className="min-w-[140px]">
              <p className="font-medium text-sm">{popupInfo.data.plantName}</p>
              {popupInfo.data.address && (
                <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5 leading-tight">
                  {popupInfo.data.address}
                </p>
              )}
            </div>
          </Popup>
        )}

        {/* Route Tooltip Popup */}
        {selectedRoute && (
          <Popup
            longitude={selectedRoute.lng}
            latitude={selectedRoute.lat}
            anchor="bottom"
            onClose={() => setSelectedRoute(null)}
            closeButton={true}
            closeOnClick={false}
            className="network-popup route-popup"
          >
            <div className="p-1 min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-0.5 rounded"
                  style={{ backgroundColor: selectedRoute.type === 'feedstock' ? '#16a34a' : '#2563eb' }}
                />
                <p className="font-medium text-sm">
                  {selectedRoute.type === 'feedstock' ? 'Feedstock Delivery' : 'Sequestration Delivery'}
                </p>
              </div>
              {selectedRoute.type === 'feedstock' && (
                <div className="space-y-1.5">
                  <p className="text-sm capitalize font-medium">
                    {(selectedRoute.data as FeedstockSource).feedstockType.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {formatDateTime((selectedRoute.data as FeedstockSource).date)}
                  </p>
                  {(selectedRoute.data as FeedstockSource).sourceAddress && (
                    <p className="text-xs text-[var(--muted-foreground)]">
                      From: {(selectedRoute.data as FeedstockSource).sourceAddress}
                    </p>
                  )}
                  <div className="pt-2 mt-2 border-t grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[var(--muted-foreground)]">Distance</p>
                      <p className="font-medium">
                        {(
                          (selectedRoute.data as FeedstockSource).routeDistanceKm ||
                          (selectedRoute.data as FeedstockSource).deliveryDistanceKm
                        ).toFixed(2)}{' '}
                        km
                      </p>
                    </div>
                    {(selectedRoute.data as FeedstockSource).weightTonnes && (
                      <div>
                        <p className="text-[var(--muted-foreground)]">Weight</p>
                        <p className="font-medium">
                          {(selectedRoute.data as FeedstockSource).weightTonnes?.toFixed(2)} t
                        </p>
                      </div>
                    )}
                  </div>
                  {/* Truck Photo Thumbnail */}
                  {(selectedRoute.data as FeedstockSource).truckPhotoUrl && (
                    <div className="pt-2 mt-2 border-t">
                      <p className="text-xs text-[var(--muted-foreground)] mb-1">Arrival Photo</p>
                      <a
                        href={(selectedRoute.data as FeedstockSource).truckPhotoUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={(selectedRoute.data as FeedstockSource).truckPhotoUrl!}
                          alt="Truck arrival"
                          className="w-full h-20 object-cover rounded border hover:opacity-90 transition-opacity cursor-pointer"
                        />
                      </a>
                    </div>
                  )}
                  {/* QR Code */}
                  <div className="pt-2 mt-2 border-t flex justify-center">
                    <QRDisplay
                      entityType="feedstock"
                      entityId={(selectedRoute.data as FeedstockSource).id}
                      size="xs"
                      showActions={false}
                    />
                  </div>
                </div>
              )}
              {selectedRoute.type === 'destination' && (
                <div className="space-y-1.5">
                  <p className="text-sm capitalize font-medium">
                    {(selectedRoute.data as Destination).sequestrationType.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {formatDateTime((selectedRoute.data as Destination).finalDeliveryDate)}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    To: {(selectedRoute.data as Destination).deliveryPostcode}
                  </p>
                  <div className="pt-2 mt-2 border-t grid grid-cols-2 gap-2 text-xs">
                    {(selectedRoute.data as Destination).routeDistanceKm && (
                      <div>
                        <p className="text-[var(--muted-foreground)]">Distance</p>
                        <p className="font-medium">
                          {(selectedRoute.data as Destination).routeDistanceKm?.toFixed(2)} km
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-[var(--muted-foreground)]">Quantity</p>
                      <p className="font-medium">{(selectedRoute.data as Destination).quantityTonnes.toFixed(2)} t</p>
                    </div>
                  </div>
                  {/* QR Code */}
                  <div className="pt-2 mt-2 border-t flex justify-center">
                    <QRDisplay
                      entityType="sequestration"
                      entityId={(selectedRoute.data as Destination).id}
                      size="xs"
                      showActions={false}
                    />
                  </div>
                </div>
              )}
            </div>
          </Popup>
        )}
      </Map>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 rounded border bg-white/95 p-3 text-xs shadow-sm backdrop-blur">
        <p className="font-medium mb-2">Legend</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0a0a0a]">
              <Factory className="h-3 w-3 text-white" />
            </div>
            <span>Plant</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#0a0a0a] bg-white">
              <Leaf className="h-2.5 w-2.5 text-[#0a0a0a]" />
            </div>
            <span>Feedstock Source</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded border-2 border-[#0a0a0a] bg-white">
              <ArrowDownToLine className="h-2.5 w-2.5 text-[#0a0a0a]" />
            </div>
            <span>Destination</span>
          </div>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t">
            <div className="w-6 h-0.5 bg-[#16a34a] rounded" />
            <span>Feedstock Route (incoming)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-[#2563eb] rounded" />
            <span>Delivery Route (outgoing)</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-[2px] opacity-50"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(90deg, #6b7280 0, #6b7280 3px, transparent 3px, transparent 6px)',
              }}
            />
            <span>Pending route</span>
          </div>
        </div>
      </div>

      {/* Slide-up Panel for Feedstock Deliveries */}
      {selectedFeedstockLocation && (
        <div
          className={`absolute bottom-0 left-0 right-0 bg-white border-t shadow-lg transition-all duration-300 ease-in-out ${
            isPanelMinimized ? 'h-12' : 'h-[280px]'
          }`}
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b bg-[var(--muted)]/50">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#16a34a] bg-white">
                <Leaf className="h-3 w-3 text-[#16a34a]" />
              </div>
              <div>
                <p className="font-medium text-sm">{selectedFeedstockLocation.address || 'Unknown Location'}</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {selectedFeedstockLocation.deliveries.length} deliveries &middot; {selectedFeedstockLocation.totalWeight.toFixed(1)}t total
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setIsPanelMinimized(!isPanelMinimized)}
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${isPanelMinimized ? 'rotate-180' : ''}`} />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={closePanel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Panel Content - Table */}
          {!isPanelMinimized && (
            <div className="overflow-auto h-[calc(100%-48px)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--muted)]/30 sticky top-0">
                  <tr className="text-left text-xs text-[var(--muted-foreground)]">
                    <th className="px-4 py-2 font-medium">Date</th>
                    <th className="px-4 py-2 font-medium">Type</th>
                    <th className="px-4 py-2 font-medium text-right">Weight</th>
                    <th className="px-4 py-2 font-medium text-right">Distance</th>
                    <th className="px-4 py-2 font-medium text-center">QR</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedFeedstockLocation.deliveries
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((delivery) => (
                      <tr key={delivery.id} className="hover:bg-[var(--muted)]/20">
                        <td className="px-4 py-2 text-xs">{formatDateTime(delivery.date)}</td>
                        <td className="px-4 py-2 text-xs capitalize">{delivery.feedstockType.replace('_', ' ')}</td>
                        <td className="px-4 py-2 text-xs text-right font-medium">
                          {delivery.weightTonnes?.toFixed(2) || '-'} t
                        </td>
                        <td className="px-4 py-2 text-xs text-right text-[var(--muted-foreground)]">
                          {delivery.deliveryDistanceKm.toFixed(1)} km
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex justify-center">
                            <QRDisplay entityType="feedstock" entityId={delivery.id} size="xs" showActions={false} />
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Slide-up Panel for Destination Deliveries */}
      {selectedDestinationLocation && (
        <div
          className={`absolute bottom-0 left-0 right-0 bg-white border-t shadow-lg transition-all duration-300 ease-in-out ${
            isPanelMinimized ? 'h-12' : 'h-[280px]'
          }`}
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b bg-[var(--muted)]/50">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded border-2 border-[#2563eb] bg-white">
                <ArrowDownToLine className="h-3 w-3 text-[#2563eb]" />
              </div>
              <div>
                <p className="font-medium text-sm">{selectedDestinationLocation.postcode}</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {selectedDestinationLocation.deliveries.length} deliveries &middot; {selectedDestinationLocation.totalQuantity.toFixed(1)}t total
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setIsPanelMinimized(!isPanelMinimized)}
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${isPanelMinimized ? 'rotate-180' : ''}`} />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={closePanel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Panel Content - Table */}
          {!isPanelMinimized && (
            <div className="overflow-auto h-[calc(100%-48px)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--muted)]/30 sticky top-0">
                  <tr className="text-left text-xs text-[var(--muted-foreground)]">
                    <th className="px-4 py-2 font-medium">Date</th>
                    <th className="px-4 py-2 font-medium">Type</th>
                    <th className="px-4 py-2 font-medium text-right">Quantity</th>
                    <th className="px-4 py-2 font-medium text-right">Distance</th>
                    <th className="px-4 py-2 font-medium text-center">QR</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedDestinationLocation.deliveries
                    .sort((a, b) => new Date(b.finalDeliveryDate).getTime() - new Date(a.finalDeliveryDate).getTime())
                    .map((delivery) => (
                      <tr key={delivery.id} className="hover:bg-[var(--muted)]/20">
                        <td className="px-4 py-2 text-xs">{formatDateTime(delivery.finalDeliveryDate)}</td>
                        <td className="px-4 py-2 text-xs capitalize">{delivery.sequestrationType.replace('_', ' ')}</td>
                        <td className="px-4 py-2 text-xs text-right font-medium">{delivery.quantityTonnes.toFixed(2)} t</td>
                        <td className="px-4 py-2 text-xs text-right text-[var(--muted-foreground)]">
                          {delivery.routeDistanceKm?.toFixed(1) || '-'} km
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex justify-center">
                            <QRDisplay entityType="sequestration" entityId={delivery.id} size="xs" showActions={false} />
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
