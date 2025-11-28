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

    const productionBatch = await db.productionBatch.create({
      data: result.data,
      include: {
        evidence: true,
        feedstockDelivery: true,
      },
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
