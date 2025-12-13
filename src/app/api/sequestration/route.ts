import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { createSequestrationEventSchema } from '@/lib/validations/sequestration';
import { calculateSequestrationRoute } from '@/lib/services/routing';
import {
  parsePaginationParams,
  calculateSkip,
  createPaginatedResponse,
  serverErrorResponse,
  validationErrorResponse,
} from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pagination = parsePaginationParams(searchParams);

    // Get total count for pagination
    const total = await db.sequestrationEvent.count();

    // Fetch paginated data
    const sequestrationEvents = await db.sequestrationEvent.findMany({
      orderBy: { finalDeliveryDate: 'desc' },
      skip: calculateSkip(pagination.page, pagination.limit),
      take: pagination.limit,
      include: {
        evidence: { select: { id: true } },
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
        transportEvents: {
          select: { id: true, date: true, distanceKm: true },
        },
        _count: {
          select: { bcuEvents: true },
        },
      },
    });

    // Calculate total quantity for each event
    const eventsWithQuantity = sequestrationEvents.map((event) => ({
      ...event,
      quantityTonnes: event.batches.reduce(
        (sum, pb) => sum + pb.quantityTonnes,
        0
      ),
    }));

    return NextResponse.json(createPaginatedResponse(eventsWithQuantity, total, pagination));
  } catch (error) {
    console.error('Error fetching sequestration events:', error);
    return serverErrorResponse('Failed to fetch sequestration events');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productionBatches, ...eventData } = body;

    const result = createSequestrationEventSchema.safeParse(eventData);

    if (!result.success) {
      return validationErrorResponse(result.error.issues);
    }

    const sequestrationEvent = await db.sequestrationEvent.create({
      data: {
        ...result.data,
        routeStatus: result.data.destinationLat && result.data.destinationLng ? 'pending' : null,
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

    // Fire-and-forget: calculate route if coordinates exist
    if (sequestrationEvent.destinationLat && sequestrationEvent.destinationLng) {
      calculateSequestrationRoute(sequestrationEvent.id).catch((err) =>
        console.error('Background route calculation failed:', err)
      );
    }

    return NextResponse.json(sequestrationEvent, { status: 201 });
  } catch (error) {
    console.error('Error creating sequestration event:', error);
    return serverErrorResponse('Failed to create sequestration event');
  }
}
