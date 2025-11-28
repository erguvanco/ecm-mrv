import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { createBCUSchema } from '@/lib/validations/bcu';

export async function GET() {
  try {
    const bcus = await db.bCU.findMany({
      orderBy: { issuanceDate: 'desc' },
      include: {
        evidence: { select: { id: true } },
        sequestrationEvent: {
          select: {
            id: true,
            finalDeliveryDate: true,
            sequestrationType: true,
            deliveryPostcode: true,
          },
        },
        productionBatchAllocations: {
          include: {
            productionBatch: {
              select: {
                id: true,
                productionDate: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(bcus);
  } catch (error) {
    console.error('Error fetching BCUs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch BCUs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sequestrationEventId, productionBatchAllocations, ...bcuData } = body;

    const result = createBCUSchema.safeParse(bcuData);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: result.error.issues },
        { status: 400 }
      );
    }

    // Generate a registry serial number if not provided
    const serialNumber =
      result.data.registrySerialNumber ||
      `BCU-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const bcu = await db.bCU.create({
      data: {
        ...result.data,
        registrySerialNumber: serialNumber,
        sequestrationEventId,
        productionBatchAllocations: productionBatchAllocations
          ? {
              create: productionBatchAllocations.map(
                (alloc: { productionBatchId: string; quantityTonnesCO2e: number }) => ({
                  productionBatchId: alloc.productionBatchId,
                  quantityTonnesCO2e: alloc.quantityTonnesCO2e,
                })
              ),
            }
          : undefined,
      },
      include: {
        evidence: true,
        sequestrationEvent: true,
      },
    });

    return NextResponse.json(bcu, { status: 201 });
  } catch (error) {
    console.error('Error creating BCU:', error);
    return NextResponse.json(
      { error: 'Failed to create BCU' },
      { status: 500 }
    );
  }
}
