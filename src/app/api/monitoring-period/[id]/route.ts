import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { updateMonitoringPeriodSchema } from '@/lib/validations/monitoring-period';

/**
 * GET /api/monitoring-period/[id]
 * Get a specific monitoring period with all related data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const monitoringPeriod = await db.monitoringPeriod.findUnique({
      where: { id },
      include: {
        facility: true,
        corcIssuances: {
          include: {
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
            sequestrationEvents: {
              include: {
                sequestration: {
                  select: {
                    id: true,
                    finalDeliveryDate: true,
                    sequestrationType: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!monitoringPeriod) {
      return NextResponse.json(
        { error: 'Monitoring period not found' },
        { status: 404 }
      );
    }

    // Get production batches within this period
    const productionBatches = await db.productionBatch.findMany({
      where: {
        facilityId: monitoringPeriod.facilityId,
        productionDate: {
          gte: monitoringPeriod.periodStart,
          lte: monitoringPeriod.periodEnd,
        },
      },
      include: {
        labTests: true,
        feedstockAllocations: {
          include: {
            feedstockDelivery: true,
          },
        },
      },
      orderBy: { productionDate: 'desc' },
    });

    // Get sequestration events within this period
    const sequestrationEvents = await db.sequestrationEvent.findMany({
      where: {
        finalDeliveryDate: {
          gte: monitoringPeriod.periodStart,
          lte: monitoringPeriod.periodEnd,
        },
      },
      orderBy: { finalDeliveryDate: 'desc' },
    });

    return NextResponse.json({
      ...monitoringPeriod,
      productionBatches,
      sequestrationEvents,
    });
  } catch (error) {
    console.error('Error fetching monitoring period:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monitoring period' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/monitoring-period/[id]
 * Update a monitoring period
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const result = updateMonitoringPeriodSchema.safeParse({ ...body, id });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: result.error.issues },
        { status: 400 }
      );
    }

    const { id: _id, ...updateData } = result.data;

    const monitoringPeriod = await db.monitoringPeriod.update({
      where: { id },
      data: updateData,
      include: {
        facility: true,
      },
    });

    return NextResponse.json(monitoringPeriod);
  } catch (error) {
    console.error('Error updating monitoring period:', error);
    return NextResponse.json(
      { error: 'Failed to update monitoring period' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/monitoring-period/[id]
 * Delete a monitoring period (only if no CORCs issued)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if there are any CORCs issued for this period
    const corcCount = await db.cORCIssuance.count({
      where: { monitoringPeriodId: id },
    });

    if (corcCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete monitoring period with issued CORCs' },
        { status: 400 }
      );
    }

    await db.monitoringPeriod.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting monitoring period:', error);
    return NextResponse.json(
      { error: 'Failed to delete monitoring period' },
      { status: 500 }
    );
  }
}
