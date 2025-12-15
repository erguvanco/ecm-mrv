import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { retireCORCSchema } from '@/lib/validations/corc';

/**
 * POST /api/corc/[id]/retire
 * Retire a CORC (change status from issued to retired)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const result = retireCORCSchema.safeParse({ ...body, id });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: result.error.issues },
        { status: 400 }
      );
    }

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

    if (existing.status !== 'issued') {
      return NextResponse.json(
        { error: `CORC must be issued before it can be retired (current status: ${existing.status})` },
        { status: 400 }
      );
    }

    const corc = await db.cORCIssuance.update({
      where: { id },
      data: {
        status: 'retired',
        retirementDate: result.data.retirementDate,
        retirementBeneficiary: result.data.retirementBeneficiary,
        notes: result.data.notes,
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
    console.error('Error retiring CORC:', error);
    return NextResponse.json(
      { error: 'Failed to retire CORC' },
      { status: 500 }
    );
  }
}
