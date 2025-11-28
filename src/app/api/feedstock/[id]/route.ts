import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { updateFeedstockDeliverySchema } from '@/lib/validations/feedstock';
import { calculateFeedstockRoute } from '@/lib/services/routing';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const feedstock = await db.feedstockDelivery.findUnique({
      where: { id },
      include: {
        evidence: true,
        productionBatches: {
          select: { id: true, productionDate: true, outputBiocharWeightTonnes: true },
        },
        transportEvents: {
          select: { id: true, date: true, distanceKm: true },
        },
      },
    });

    if (!feedstock) {
      return NextResponse.json(
        { error: 'Feedstock delivery not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(feedstock);
  } catch (error) {
    console.error('Error fetching feedstock:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedstock delivery' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const result = updateFeedstockDeliverySchema.safeParse({ ...body, id });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: result.error.issues },
        { status: 400 }
      );
    }

    const { id: _id, ...data } = result.data;

    // Check if coordinates are changing
    const existing = await db.feedstockDelivery.findUnique({
      where: { id },
      select: { sourceLat: true, sourceLng: true },
    });

    const coordsChanged =
      data.sourceLat !== existing?.sourceLat || data.sourceLng !== existing?.sourceLng;

    const feedstock = await db.feedstockDelivery.update({
      where: { id },
      data: {
        ...data,
        // Reset route status if coordinates changed
        ...(coordsChanged && data.sourceLat && data.sourceLng
          ? { routeStatus: 'pending', routeGeometry: null, routeDistanceKm: null, routeDurationMin: null }
          : {}),
      },
      include: {
        evidence: true,
      },
    });

    // Fire-and-forget: recalculate route if coordinates changed
    if (coordsChanged && feedstock.sourceLat && feedstock.sourceLng) {
      calculateFeedstockRoute(feedstock.id).catch((err) =>
        console.error('Background route calculation failed:', err)
      );
    }

    return NextResponse.json(feedstock);
  } catch (error) {
    console.error('Error updating feedstock:', error);
    return NextResponse.json(
      { error: 'Failed to update feedstock delivery' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.feedstockDelivery.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting feedstock:', error);
    return NextResponse.json(
      { error: 'Failed to delete feedstock delivery' },
      { status: 500 }
    );
  }
}
