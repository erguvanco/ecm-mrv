import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { createProductionBatchSchema } from '@/lib/validations/production';

export async function GET() {
  try {
    const productionBatches = await db.productionBatch.findMany({
      orderBy: { productionDate: 'desc' },
      include: {
        evidence: { select: { id: true } },
        feedstockDelivery: {
          select: {
            id: true,
            date: true,
            feedstockType: true,
            weightTonnes: true,
          },
        },
        feedstockAllocations: {
          include: {
            feedstockDelivery: {
              select: {
                id: true,
                date: true,
                feedstockType: true,
                weightTonnes: true,
              },
            },
          },
        },
        _count: {
          select: {
            sequestrationBatches: true,
            bcuBatches: true,
          },
        },
      },
    });

    return NextResponse.json(productionBatches);
  } catch (error) {
    console.error('Error fetching production batches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch production batches' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createProductionBatchSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: result.error.issues },
        { status: 400 }
      );
    }

    const { feedstockAllocations, ...batchData } = result.data;

    // Use a transaction to create batch and allocations together
    const productionBatch = await db.$transaction(async (tx) => {
      // Create the production batch
      const batch = await tx.productionBatch.create({
        data: batchData,
      });

      // Create feedstock allocations if provided
      if (feedstockAllocations && feedstockAllocations.length > 0) {
        // Get feedstock delivery weights to calculate weightUsedTonnes
        const deliveryIds = feedstockAllocations.map(a => a.feedstockDeliveryId);
        const deliveries = await tx.feedstockDelivery.findMany({
          where: { id: { in: deliveryIds } },
          select: { id: true, weightTonnes: true },
        });
        const deliveryWeightMap = new Map(deliveries.map(d => [d.id, d.weightTonnes]));

        await tx.productionFeedstock.createMany({
          data: feedstockAllocations.map(allocation => ({
            productionBatchId: batch.id,
            feedstockDeliveryId: allocation.feedstockDeliveryId,
            percentageUsed: allocation.percentageUsed,
            weightUsedTonnes: deliveryWeightMap.get(allocation.feedstockDeliveryId)
              ? (deliveryWeightMap.get(allocation.feedstockDeliveryId)! * allocation.percentageUsed) / 100
              : null,
          })),
        });
      }

      // Return batch with allocations
      return tx.productionBatch.findUnique({
        where: { id: batch.id },
        include: {
          evidence: true,
          feedstockDelivery: true,
          feedstockAllocations: {
            include: {
              feedstockDelivery: {
                select: {
                  id: true,
                  date: true,
                  feedstockType: true,
                  weightTonnes: true,
                },
              },
            },
          },
        },
      });
    });

    return NextResponse.json(productionBatch, { status: 201 });
  } catch (error) {
    console.error('Error creating production batch:', error);
    return NextResponse.json(
      { error: 'Failed to create production batch' },
      { status: 500 }
    );
  }
}
