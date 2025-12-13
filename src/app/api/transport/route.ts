import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { createTransportEventSchema } from '@/lib/validations/transport';
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
    const total = await db.transportEvent.count();

    // Fetch paginated data
    const transportEvents = await db.transportEvent.findMany({
      orderBy: { date: 'desc' },
      skip: calculateSkip(pagination.page, pagination.limit),
      take: pagination.limit,
      include: {
        evidence: { select: { id: true } },
        feedstockDelivery: {
          select: { id: true, date: true, feedstockType: true },
        },
        sequestrationEvent: {
          select: { id: true, finalDeliveryDate: true },
        },
      },
    });

    return NextResponse.json(createPaginatedResponse(transportEvents, total, pagination));
  } catch (error) {
    console.error('Error fetching transport events:', error);
    return serverErrorResponse('Failed to fetch transport events');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createTransportEventSchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse(result.error.issues);
    }

    const transportEvent = await db.transportEvent.create({
      data: result.data,
      include: {
        evidence: true,
      },
    });

    return NextResponse.json(transportEvent, { status: 201 });
  } catch (error) {
    console.error('Error creating transport event:', error);
    return serverErrorResponse('Failed to create transport event');
  }
}
