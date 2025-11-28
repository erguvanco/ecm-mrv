import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { createSequestrationEventSchema } from '@/lib/validations/sequestration';
import { calculateSequestrationRoute } from '@/lib/services/routing';

export async function GET() {
  try {
    const sequestrationEvents = await db.sequestrationEvent.findMany({
      orderBy: { finalDeliveryDate: 'desc' },
      include: {
        evidence: { select: { id: true } },
        productionBatches: {
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
        transportEvents: {
          select: { id: true, date: true, distanceKm: true },
        },
        _count: {
          select: { bcus: true },
        },
      },
    });

    // Calculate total quantity for each event
    const eventsWithQuantity = sequestrationEvents.map((event) => ({
      ...event,
      quantityTonnes: event.productionBatches.reduce(
        (sum, pb) => sum + pb.quantityTonnes,
        0
      ),
    }));

    return NextResponse.json(eventsWithQuantity);
  } catch (error) {
    console.error('Error fetching sequestration events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sequestration events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productionBatches, ...eventData } = body;

    const result = createSequestrationEventSchema.safeParse(eventData);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: result.error.issues },
        { status: 400 }
      );
    }

    const sequestrationEvent = await db.sequestrationEvent.create({
      data: {
        ...result.data,
        routeStatus: result.data.destinationLat && result.data.destinationLng ? 'pending' : null,
        productionBatches: productionBatches
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
        productionBatches: {
          include: {
            productionBatch: true,
          },
        },
      },
    });

    // Fire-and-forget: calculate route if coordinates exist
    if (sequestrationEvent.destinationLat && sequestrationEvent.destinationLng) {
      calculateSequestrationRoute(sequestrationEvent.id).catch((err) =>
        console.error('Background route calculation failed:', err)
      );
    }

    return NextResponse.json(sequestrationEvent, { status: 201 });
  } catch (error) {
    console.error('Error creating sequestration event:', error);
    return NextResponse.json(
      { error: 'Failed to create sequestration event' },
      { status: 500 }
    );
  }
}
