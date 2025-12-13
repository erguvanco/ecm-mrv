import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { updateCORCSchema } from '@/lib/validations/corc';

/**
 * GET /api/corc/[id]
 * Get a specific CORC with full details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const corc = await db.cORCIssuance.findUnique({
      where: { id },
      include: {
        monitoringPeriod: {
          include: {
            facility: true,
          },
        },
        productionBatches: {
          include: {
            productionBatch: {
              include: {
                labTests: true,
                feedstockAllocations: {
                  include: {
                    feedstockDelivery: true,
                  },
                },
              },
            },
          },
        },
        sequestrationEvents: {
          include: {
            sequestration: true,
          },
        },
        evidence: true,
      },
    });

    if (!corc) {
      return NextResponse.json(
        { error: 'CORC not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(corc);
  } catch (error) {
    console.error('Error fetching CORC:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CORC' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/corc/[id]
 * Update a CORC (only if in draft status)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check current status
    const existing = await db.cORCIssuance.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'CORC not found' },
        { status: 404 }
      );
    }

    if (existing.status !== 'draft') {
      return NextResponse.json(
        { error: 'Cannot modify CORC that has been issued or retired' },
        { status: 400 }
      );
    }

    const result = updateCORCSchema.safeParse({ ...body, id });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: result.error.issues },
        { status: 400 }
      );
    }

    const { id: _id, ...updateData } = result.data;

    const corc = await db.cORCIssuance.update({
      where: { id },
      data: updateData,
      include: {
        monitoringPeriod: {
          include: {
            facility: true,
          },
        },
      },
    });

    return NextResponse.json(corc);
  } catch (error) {
    console.error('Error updating CORC:', error);
    return NextResponse.json(
      { error: 'Failed to update CORC' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/corc/[id]
 * Delete a CORC (only if in draft status)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check current status
    const existing = await db.cORCIssuance.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'CORC not found' },
        { status: 404 }
      );
    }

    if (existing.status !== 'draft') {
      return NextResponse.json(
        { error: 'Cannot delete CORC that has been issued or retired' },
        { status: 400 }
      );
    }

    await db.cORCIssuance.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting CORC:', error);
    return NextResponse.json(
      { error: 'Failed to delete CORC' },
      { status: 500 }
    );
  }
}
