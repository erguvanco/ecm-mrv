import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { z } from 'zod';
import { geocodeAddress } from '@/lib/services/geocoding';
import { recalculateAllRoutes } from '@/lib/services/routing';

const updatePlantSchema = z.object({
  plantName: z.string().min(1).optional(),
  address: z.string().optional().nullable(),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
});

export async function GET() {
  try {
    let plant = await db.plantSettings.findFirst({
      where: { id: 'singleton' },
    });

    if (!plant) {
      plant = await db.plantSettings.create({
        data: {
          id: 'singleton',
          plantName: 'Biochar Plant',
        },
      });
    }

    return NextResponse.json({
      plantName: plant.plantName,
      address: plant.address,
      lat: plant.lat,
      lng: plant.lng,
    });
  } catch (error) {
    console.error('Error fetching plant settings:', error);
    return NextResponse.json({ error: 'Failed to fetch plant settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const result = updatePlantSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: result.error.issues },
        { status: 400 }
      );
    }

    const { plantName, address, lat, lng } = result.data;

    // Get existing plant settings to check if coordinates change
    const existing = await db.plantSettings.findFirst({
      where: { id: 'singleton' },
      select: { lat: true, lng: true },
    });

    // If address is provided but no coordinates, geocode it
    let finalLat = lat;
    let finalLng = lng;

    if (address && (lat === undefined || lng === undefined)) {
      const geocodeResult = await geocodeAddress(address);
      if (geocodeResult.success) {
        finalLat = geocodeResult.lat;
        finalLng = geocodeResult.lng;
      }
    }

    // Check if coordinates are changing
    const coordsChanged =
      finalLat !== existing?.lat || finalLng !== existing?.lng;

    const plant = await db.plantSettings.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        plantName: plantName || 'Biochar Plant',
        address,
        lat: finalLat,
        lng: finalLng,
      },
      update: {
        ...(plantName !== undefined && { plantName }),
        ...(address !== undefined && { address }),
        ...(finalLat !== undefined && { lat: finalLat }),
        ...(finalLng !== undefined && { lng: finalLng }),
      },
    });

    // Fire-and-forget: recalculate all routes if plant location changed
    if (coordsChanged && plant.lat && plant.lng) {
      recalculateAllRoutes().catch((err) =>
        console.error('Background route recalculation failed:', err)
      );
    }

    return NextResponse.json({
      plantName: plant.plantName,
      address: plant.address,
      lat: plant.lat,
      lng: plant.lng,
    });
  } catch (error) {
    console.error('Error updating plant settings:', error);
    return NextResponse.json({ error: 'Failed to update plant settings' }, { status: 500 });
  }
}
