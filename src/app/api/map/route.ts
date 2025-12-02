import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
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

    // Get feedstock sources with coordinates
    const feedstockSources = await db.feedstockDelivery.findMany({
      where: {
        sourceLat: { not: null },
        sourceLng: { not: null },
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
