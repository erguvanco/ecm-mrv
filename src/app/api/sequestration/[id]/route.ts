import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { updateSequestrationEventSchema } from '@/lib/validations/sequestration';
import { calculateSequestrationRoute } from '@/lib/services/routing';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sequestrationEvent = await db.sequestrationEvent.findUnique({
      where: { id },
      include: {
        evidence: true,
        batches: {
          include: {
            productionBatch: {
              select: {
                id: true,
                productionDate: true,
                outputBiocharWeightTonnes: true,
              },
            },
          },
        },
        transportEvents: true,
        bcuEvents: {
          include: {
            bcu: {
              select: {
                id: true,
                registrySerialNumber: true,
                status: true,
                quantityTonnesCO2e: true,
              },
            },
          },
        },
      },
    });

    if (!sequestrationEvent) {
      return NextResponse.json(
        { error: 'Sequestration event not found' },
        { status: 404 }
      );
    }

    // Calculate total quantity
    const quantityTonnes = sequestrationEvent.batches.reduce(
      (sum, pb) => sum + pb.quantityTonnes,
      0
    );

    return NextResponse.json({ ...sequestrationEvent, quantityTonnes });
  } catch (error) {
    console.error('Error fetching sequestration event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sequestration event' },
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
    const { productionBatches, ...eventData } = body;

    const result = updateSequestrationEventSchema.safeParse({ ...eventData, id });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: result.error.issues },
        { status: 400 }
      );
    }

    const { id: _id, ...data } = result.data;

    // Check if coordinates are changing
    const existing = await db.sequestrationEvent.findUnique({
      where: { id },
      select: { destinationLat: true, destinationLng: true },
    });

    const coordsChanged =
      data.destinationLat !== existing?.destinationLat ||
      data.destinationLng !== existing?.destinationLng;

    // Update event and batch links in a transaction
    const sequestrationEvent = await db.$transaction(async (tx) => {
      // Delete existing batch links
      await tx.sequestrationBatch.deleteMany({
        where: { sequestrationId: id },
      });

      // Update event and create new batch links
      return tx.sequestrationEvent.update({
        where: { id },
        data: {
          ...data,
          // Reset route status if coordinates changed
          ...(coordsChanged && data.destinationLat && data.destinationLng
            ? { routeStatus: 'pending', routeGeometry: null, routeDistanceKm: null, routeDurationMin: null }
            : {}),
          batches: productionBatches
            ? {
                create: productionBatches.map(
                  (pb: { productionBatchId: string; quantityTonnes: number }) => ({
                    productionBatchId: pb.productionBatchId,
                    quantityTonnes: pb.quantityTonnes,
                  })
                ),
              }
            : undefined,
        },
        include: {
          evidence: true,
          batches: {
            include: {
              productionBatch: true,
            },
          },
        },
      });
    });

    // Fire-and-forget: recalculate route if coordinates changed
    if (coordsChanged && sequestrationEvent.destinationLat && sequestrationEvent.destinationLng) {
      calculateSequestrationRoute(sequestrationEvent.id).catch((err) =>
        console.error('Background route calculation failed:', err)
      );
    }

    return NextResponse.json(sequestrationEvent);
  } catch (error) {
    console.error('Error updating sequestration event:', error);
    return NextResponse.json(
      { error: 'Failed to update sequestration event' },
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

    await db.sequestrationEvent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting sequestration event:', error);
    return NextResponse.json(
      { error: 'Failed to delete sequestration event' },
      { status: 500 }
    );
  }
}
