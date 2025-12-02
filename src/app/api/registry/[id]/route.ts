import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { updateBCUSchema, transferBCUSchema, retireBCUSchema } from '@/lib/validations/bcu';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const bcu = await db.bCU.findUnique({
      where: { id },
      include: {
        evidence: true,
        sequestrationEvents: {
          include: {
            sequestration: {
              include: {
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
              },
            },
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

    if (!bcu) {
      return NextResponse.json({ error: 'BCU not found' }, { status: 404 });
    }

    return NextResponse.json(bcu);
  } catch (error) {
    console.error('Error fetching BCU:', error);
    return NextResponse.json(
      { error: 'Failed to fetch BCU' },
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

    const result = updateBCUSchema.safeParse({ ...body, id });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: result.error.issues },
        { status: 400 }
      );
    }

    const { id: _id, ...data } = result.data;

    const bcu = await db.bCU.update({
      where: { id },
      data,
      include: {
        evidence: true,
        sequestrationEvents: true,
      },
    });

    return NextResponse.json(bcu);
  } catch (error) {
    console.error('Error updating BCU:', error);
    return NextResponse.json(
      { error: 'Failed to update BCU' },
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

    const bcu = await db.bCU.findUnique({ where: { id } });

    if (!bcu) {
      return NextResponse.json({ error: 'BCU not found' }, { status: 404 });
    }

    if (bcu.status !== 'issued') {
      return NextResponse.json(
        { error: 'Cannot delete a BCU that has been transferred or retired' },
        { status: 400 }
      );
    }

    await db.bCU.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting BCU:', error);
    return NextResponse.json(
      { error: 'Failed to delete BCU' },
      { status: 500 }
    );
  }
}
