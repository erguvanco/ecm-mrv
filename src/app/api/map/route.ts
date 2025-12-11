import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getDateRange, type TimeRange } from '@/lib/utils/date-range';

export async function GET(request: NextRequest) {
  try {
    // Get time range from query params
    const { searchParams } = new URL(request.url);
    const range = (searchParams.get('range') as TimeRange) || 'all';
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');

    let rangeStart: Date | null = null;
    let rangeEnd: Date | null = null;

    // If month/year params are provided, use them for filtering
    if (monthParam !== null && yearParam !== null) {
      const month = parseInt(monthParam, 10);
      const year = parseInt(yearParam, 10);
      rangeStart = new Date(year, month, 1);
      rangeEnd = new Date(year, month + 1, 0, 23, 59, 59, 999); // Last day of month
    } else {
      // Fall back to range-based filtering
      const dateRange = getDateRange(range);
      rangeStart = dateRange.start;
    }

    // Get plant settings
    let plant = await db.plantSettings.findFirst({
      where: { id: 'singleton' },
    });

    // Create default plant settings if not exists
    if (!plant) {
      plant = await db.plantSettings.create({
        data: {
          id: 'singleton',
          plantName: 'Biochar Plant',
        },
      });
    }

    // Build date filter
    const feedstockDateFilter = rangeStart
      ? rangeEnd
        ? { date: { gte: rangeStart, lte: rangeEnd } }
        : { date: { gte: rangeStart } }
      : {};
    const sequestrationDateFilter = rangeStart
      ? rangeEnd
        ? { finalDeliveryDate: { gte: rangeStart, lte: rangeEnd } }
        : { finalDeliveryDate: { gte: rangeStart } }
      : {};

    // Get feedstock sources with coordinates
    const feedstockSources = await db.feedstockDelivery.findMany({
      where: {
        sourceLat: { not: null },
        sourceLng: { not: null },
        ...feedstockDateFilter,
      },
      select: {
        id: true,
        date: true,
        feedstockType: true,
        sourceAddress: true,
        sourceLat: true,
        sourceLng: true,
        weightTonnes: true,
        deliveryDistanceKm: true,
        routeGeometry: true,
        routeDistanceKm: true,
        routeStatus: true,
        truckPhotoUrl: true,
      },
      orderBy: { date: 'desc' },
    });

    // Get sequestration destinations with coordinates
    const destinations = await db.sequestrationEvent.findMany({
      where: {
        destinationLat: { not: null },
        destinationLng: { not: null },
        ...sequestrationDateFilter,
      },
      select: {
        id: true,
        finalDeliveryDate: true,
        sequestrationType: true,
        deliveryPostcode: true,
        destinationLat: true,
        destinationLng: true,
        routeGeometry: true,
        routeDistanceKm: true,
        routeStatus: true,
        batches: {
          select: {
            quantityTonnes: true,
          },
        },
      },
      orderBy: { finalDeliveryDate: 'desc' },
    });

    // Calculate total quantity for each destination
    const destinationsWithQuantity = destinations.map((d) => ({
      id: d.id,
      finalDeliveryDate: d.finalDeliveryDate,
      sequestrationType: d.sequestrationType,
      deliveryPostcode: d.deliveryPostcode,
      lat: d.destinationLat,
      lng: d.destinationLng,
      quantityTonnes: d.batches.reduce((sum, b) => sum + b.quantityTonnes, 0),
      routeGeometry: d.routeGeometry ? JSON.parse(d.routeGeometry) : null,
      routeDistanceKm: d.routeDistanceKm,
      routeStatus: d.routeStatus,
    }));

    // Stats
    const totalFeedstock = await db.feedstockDelivery.count();
    const geocodedFeedstock = feedstockSources.length;
    const totalSequestration = await db.sequestrationEvent.count();
    const geocodedSequestration = destinations.length;

    return NextResponse.json({
      plant: {
        plantName: plant.plantName,
        lat: plant.lat,
        lng: plant.lng,
        address: plant.address,
      },
      feedstockSources: feedstockSources.map((f) => ({
        id: f.id,
        date: f.date,
        feedstockType: f.feedstockType,
        sourceAddress: f.sourceAddress,
        lat: f.sourceLat,
        lng: f.sourceLng,
        weightTonnes: f.weightTonnes,
        deliveryDistanceKm: f.deliveryDistanceKm,
        routeGeometry: f.routeGeometry ? JSON.parse(f.routeGeometry) : null,
        routeDistanceKm: f.routeDistanceKm,
        routeStatus: f.routeStatus,
        truckPhotoUrl: f.truckPhotoUrl,
      })),
      destinations: destinationsWithQuantity,
      stats: {
        totalFeedstock,
        geocodedFeedstock,
        totalSequestration,
        geocodedSequestration,
      },
    });
  } catch (error) {
    console.error('Error fetching map data:', error);
    return NextResponse.json({ error: 'Failed to fetch map data' }, { status: 500 });
  }
}
