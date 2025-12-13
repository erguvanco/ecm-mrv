import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { issueCORCSchema } from '@/lib/validations/corc';

/**
 * POST /api/corc/[id]/issue
 * Issue a CORC (change status from draft to issued)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const result = issueCORCSchema.safeParse({ ...body, id });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: result.error.issues },
        { status: 400 }
      );
    }

    // Check current status
    const existing = await db.cORCIssuance.findUnique({
      where: { id },
      select: { status: true, netCORCsTCO2e: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'CORC not found' },
        { status: 404 }
      );
    }

    if (existing.status !== 'draft') {
      return NextResponse.json(
        { error: `CORC is already ${existing.status}` },
        { status: 400 }
      );
    }

    if (existing.netCORCsTCO2e <= 0) {
      return NextResponse.json(
        { error: 'Cannot issue CORC with zero or negative net CORCs' },
        { status: 400 }
      );
    }

    const corc = await db.cORCIssuance.update({
      where: { id },
      data: {
        status: 'issued',
        issuanceDate: result.data.issuanceDate,
        ownerName: result.data.ownerName,
        ownerAccountId: result.data.ownerAccountId,
      },
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
    console.error('Error issuing CORC:', error);
    return NextResponse.json(
      { error: 'Failed to issue CORC' },
      { status: 500 }
    );
  }
}
