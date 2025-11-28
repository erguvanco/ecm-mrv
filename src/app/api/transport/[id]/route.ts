import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { updateTransportEventSchema } from '@/lib/validations/transport';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const transportEvent = await db.transportEvent.findUnique({
      where: { id },
      include: {
        evidence: true,
        feedstockDelivery: {
          select: { id: true, date: true, feedstockType: true },
        },
        sequestrationEvent: {
          select: { id: true, date: true },
        },
      },
    });

    if (!transportEvent) {
      return NextResponse.json(
        { error: 'Transport event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(transportEvent);
  } catch (error) {
    console.error('Error fetching transport event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transport event' },
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

    const result = updateTransportEventSchema.safeParse({ ...body, id });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: result.error.issues },
        { status: 400 }
      );
    }

    const { id: _id, ...data } = result.data;

    const transportEvent = await db.transportEvent.update({
      where: { id },
      data,
      include: {
        evidence: true,
      },
    });

    return NextResponse.json(transportEvent);
  } catch (error) {
    console.error('Error updating transport event:', error);
    return NextResponse.json(
      { error: 'Failed to update transport event' },
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

    await db.transportEvent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting transport event:', error);
    return NextResponse.json(
      { error: 'Failed to delete transport event' },
      { status: 500 }
    );
  }
}
