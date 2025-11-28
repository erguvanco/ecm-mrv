import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { createTransportEventSchema } from '@/lib/validations/transport';

export async function GET() {
  try {
    const transportEvents = await db.transportEvent.findMany({
      orderBy: { date: 'desc' },
      include: {
        evidence: { select: { id: true } },
        feedstockDelivery: {
          select: { id: true, date: true, feedstockType: true },
        },
        sequestrationEvent: {
          select: { id: true, date: true },
        },
      },
    });

    return NextResponse.json(transportEvents);
  } catch (error) {
    console.error('Error fetching transport events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transport events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createTransportEventSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: result.error.issues },
        { status: 400 }
      );
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
    return NextResponse.json(
      { error: 'Failed to create transport event' },
      { status: 500 }
    );
  }
}
