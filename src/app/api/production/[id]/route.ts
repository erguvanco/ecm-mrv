import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { updateProductionBatchSchema } from '@/lib/validations/production';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const productionBatch = await db.productionBatch.findUnique({
      where: { id },
      include: {
        evidence: true,
        feedstockDelivery: {
          select: {
            id: true,
            date: true,
            feedstockType: true,
            weightTonnes: true,
          },
        },
        energyUsages: true,
        sequestrationBatches: {
          include: {
            sequestration: {
              select: {
                id: true,
                finalDeliveryDate: true,
              },
            },
          },
        },
        bcuBatches: {
          include: {
            bcu: {
              select: {
                id: true,
                registrySerialNumber: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!productionBatch) {
      return NextResponse.json(
        { error: 'Production batch not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(productionBatch);
  } catch (error) {
    console.error('Error fetching production batch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch production batch' },
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

    const result = updateProductionBatchSchema.safeParse({ ...body, id });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: result.error.issues },
        { status: 400 }
      );
    }

    const { id: _id, ...data } = result.data;

    const productionBatch = await db.productionBatch.update({
      where: { id },
      data,
      include: {
        evidence: true,
        feedstockDelivery: true,
      },
    });

    return NextResponse.json(productionBatch);
  } catch (error) {
    console.error('Error updating production batch:', error);
    return NextResponse.json(
      { error: 'Failed to update production batch' },
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

    await db.productionBatch.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting production batch:', error);
    return NextResponse.json(
      { error: 'Failed to delete production batch' },
      { status: 500 }
    );
  }
}
