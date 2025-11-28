import db from '@/lib/db';

export interface RouteResult {
  success: boolean;
  distanceKm?: number;
  durationMin?: number;
  geometry?: GeoJSON.LineString;
  cached?: boolean;
  error?: string;
}

export interface RecalculateResult {
  feedstockCount: number;
  sequestrationCount: number;
  errors: string[];
}

const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
const CACHE_TTL_DAYS = 30;
const RATE_LIMIT_DELAY_MS = 250;

// Round coordinates to 5 decimals (~1m precision) for cache matching
function roundCoord(coord: number): number {
  return Math.round(coord * 100000) / 100000;
}

// Delay helper for rate limiting
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate a route between two points using Mapbox Directions API
 * Checks cache first, stores result in cache
 */
export async function calculateRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<RouteResult> {
  const originLat = roundCoord(origin.lat);
  const originLng = roundCoord(origin.lng);
  const destLat = roundCoord(destination.lat);
  const destLng = roundCoord(destination.lng);

  // Check cache first
  const cached = await db.routeCache.findFirst({
    where: {
      originLat,
      originLng,
      destLat,
      destLng,
      expiresAt: { gt: new Date() },
    },
  });

  if (cached) {
    return {
      success: true,
      distanceKm: cached.distanceKm,
      durationMin: cached.durationMin || undefined,
      geometry: JSON.parse(cached.geometry) as GeoJSON.LineString,
      cached: true,
    };
  }

  // Call Mapbox Directions API
  if (!MAPBOX_ACCESS_TOKEN) {
    return { success: false, error: 'Mapbox API token not configured' };
  }

  try {
    // Mapbox expects coordinates as lng,lat
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${originLng},${originLat};${destLng},${destLat}?access_token=${MAPBOX_ACCESS_TOKEN}&geometries=geojson&overview=full`;

    const response = await fetch(url);

    if (response.status === 429) {
      // Rate limited - wait and retry once
      await delay(1000);
      const retryResponse = await fetch(url);
      if (!retryResponse.ok) {
        return { success: false, error: `Directions API rate limited: ${retryResponse.status}` };
      }
      const retryData = await retryResponse.json();
      return processDirectionsResponse(retryData, originLat, originLng, destLat, destLng);
    }

    if (!response.ok) {
      return { success: false, error: `Directions API error: ${response.status}` };
    }

    const data = await response.json();
    return processDirectionsResponse(data, originLat, originLng, destLat, destLng);
  } catch (error) {
    console.error('Routing error:', error);
    return { success: false, error: 'Failed to calculate route' };
  }
}

async function processDirectionsResponse(
  data: { code?: string; routes?: Array<{ distance: number; duration: number; geometry: GeoJSON.LineString }> },
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<RouteResult> {
  if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
    return { success: false, error: 'No route found between these points' };
  }

  const route = data.routes[0];
  const distanceKm = route.distance / 1000; // Convert meters to km
  const durationMin = route.duration / 60; // Convert seconds to minutes
  const geometry = route.geometry;

  // Cache the result
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CACHE_TTL_DAYS);

  try {
    await db.routeCache.upsert({
      where: {
        originLat_originLng_destLat_destLng: {
          originLat,
          originLng,
          destLat,
          destLng,
        },
      },
      create: {
        originLat,
        originLng,
        destLat,
        destLng,
        distanceKm,
        durationMin,
        geometry: JSON.stringify(geometry),
        expiresAt,
      },
      update: {
        distanceKm,
        durationMin,
        geometry: JSON.stringify(geometry),
        expiresAt,
      },
    });
  } catch (cacheError) {
    // Log but don't fail if caching fails
    console.error('Failed to cache route:', cacheError);
  }

  return {
    success: true,
    distanceKm,
    durationMin,
    geometry,
    cached: false,
  };
}

/**
 * Calculate route from feedstock source to plant
 * Updates the feedstock record with route data
 */
export async function calculateFeedstockRoute(feedstockId: string): Promise<RouteResult> {
  // Get feedstock and plant data
  const feedstock = await db.feedstockDelivery.findUnique({
    where: { id: feedstockId },
    select: { sourceLat: true, sourceLng: true },
  });

  if (!feedstock || !feedstock.sourceLat || !feedstock.sourceLng) {
    await db.feedstockDelivery.update({
      where: { id: feedstockId },
      data: { routeStatus: 'failed' },
    });
    return { success: false, error: 'Feedstock has no source coordinates' };
  }

  const plant = await db.plantSettings.findUnique({
    where: { id: 'singleton' },
    select: { lat: true, lng: true },
  });

  if (!plant || !plant.lat || !plant.lng) {
    await db.feedstockDelivery.update({
      where: { id: feedstockId },
      data: { routeStatus: 'no_plant' },
    });
    return { success: false, error: 'Plant location not configured' };
  }

  // Calculate route from feedstock source to plant
  const result = await calculateRoute(
    { lat: feedstock.sourceLat, lng: feedstock.sourceLng },
    { lat: plant.lat, lng: plant.lng }
  );

  // Update feedstock record
  if (result.success) {
    await db.feedstockDelivery.update({
      where: { id: feedstockId },
      data: {
        routeGeometry: JSON.stringify(result.geometry),
        routeDistanceKm: result.distanceKm,
        routeDurationMin: result.durationMin,
        routeCalculatedAt: new Date(),
        routeStatus: 'success',
        // Also update the deliveryDistanceKm with actual road distance
        deliveryDistanceKm: result.distanceKm!,
      },
    });
  } else {
    await db.feedstockDelivery.update({
      where: { id: feedstockId },
      data: {
        routeStatus: 'failed',
        routeCalculatedAt: new Date(),
      },
    });
  }

  return result;
}

/**
 * Calculate route from plant to sequestration destination
 * Updates the sequestration record with route data
 */
export async function calculateSequestrationRoute(sequestrationId: string): Promise<RouteResult> {
  // Get sequestration and plant data
  const sequestration = await db.sequestrationEvent.findUnique({
    where: { id: sequestrationId },
    select: { destinationLat: true, destinationLng: true },
  });

  if (!sequestration || !sequestration.destinationLat || !sequestration.destinationLng) {
    await db.sequestrationEvent.update({
      where: { id: sequestrationId },
      data: { routeStatus: 'failed' },
    });
    return { success: false, error: 'Sequestration has no destination coordinates' };
  }

  const plant = await db.plantSettings.findUnique({
    where: { id: 'singleton' },
    select: { lat: true, lng: true },
  });

  if (!plant || !plant.lat || !plant.lng) {
    await db.sequestrationEvent.update({
      where: { id: sequestrationId },
      data: { routeStatus: 'no_plant' },
    });
    return { success: false, error: 'Plant location not configured' };
  }

  // Calculate route from plant to destination
  const result = await calculateRoute(
    { lat: plant.lat, lng: plant.lng },
    { lat: sequestration.destinationLat, lng: sequestration.destinationLng }
  );

  // Update sequestration record
  if (result.success) {
    await db.sequestrationEvent.update({
      where: { id: sequestrationId },
      data: {
        routeGeometry: JSON.stringify(result.geometry),
        routeDistanceKm: result.distanceKm,
        routeDurationMin: result.durationMin,
        routeCalculatedAt: new Date(),
        routeStatus: 'success',
      },
    });
  } else {
    await db.sequestrationEvent.update({
      where: { id: sequestrationId },
      data: {
        routeStatus: 'failed',
        routeCalculatedAt: new Date(),
      },
    });
  }

  return result;
}

/**
 * Recalculate all routes - called when plant location changes
 * Processes in background with rate limiting
 */
export async function recalculateAllRoutes(): Promise<RecalculateResult> {
  const errors: string[] = [];
  let feedstockCount = 0;
  let sequestrationCount = 0;

  // Get all feedstock deliveries with coordinates
  const feedstocks = await db.feedstockDelivery.findMany({
    where: {
      sourceLat: { not: null },
      sourceLng: { not: null },
    },
    select: { id: true },
  });

  // Get all sequestration events with coordinates
  const sequestrations = await db.sequestrationEvent.findMany({
    where: {
      destinationLat: { not: null },
      destinationLng: { not: null },
    },
    select: { id: true },
  });

  // Mark all as pending
  await db.feedstockDelivery.updateMany({
    where: {
      id: { in: feedstocks.map((f) => f.id) },
    },
    data: { routeStatus: 'pending' },
  });

  await db.sequestrationEvent.updateMany({
    where: {
      id: { in: sequestrations.map((s) => s.id) },
    },
    data: { routeStatus: 'pending' },
  });

  // Process feedstock routes with rate limiting
  for (const feedstock of feedstocks) {
    try {
      const result = await calculateFeedstockRoute(feedstock.id);
      if (result.success) {
        feedstockCount++;
      } else {
        errors.push(`Feedstock ${feedstock.id}: ${result.error}`);
      }
      await delay(RATE_LIMIT_DELAY_MS);
    } catch (error) {
      errors.push(`Feedstock ${feedstock.id}: ${error}`);
    }
  }

  // Process sequestration routes with rate limiting
  for (const sequestration of sequestrations) {
    try {
      const result = await calculateSequestrationRoute(sequestration.id);
      if (result.success) {
        sequestrationCount++;
      } else {
        errors.push(`Sequestration ${sequestration.id}: ${result.error}`);
      }
      await delay(RATE_LIMIT_DELAY_MS);
    } catch (error) {
      errors.push(`Sequestration ${sequestration.id}: ${error}`);
    }
  }

  return { feedstockCount, sequestrationCount, errors };
}
