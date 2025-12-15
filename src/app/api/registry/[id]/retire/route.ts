import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { retireBCUSchema } from '@/lib/validations/bcu';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const result = retireBCUSchema.safeParse({ ...body, id });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: result.error.issues },
        { status: 400 }
      );
    }

    // Check current status
    const currentBCU = await db.bCU.findUnique({ where: { id } });

    if (!currentBCU) {
      return NextResponse.json({ error: 'BCU not found' }, { status: 404 });
    }

    if (currentBCU.status === 'retired') {
      return NextResponse.json(
        { error: 'BCU is already retired' },
        { status: 400 }
      );
    }

    const bcu = await db.bCU.update({
      where: { id },
      data: {
        status: 'retired',
        retirementDate: new Date(),
        retirementBeneficiary: result.data.retirementBeneficiary,
        notes: result.data.notes
          ? `${currentBCU.notes || ''}\n[Retirement] ${result.data.notes}`
          : currentBCU.notes,
      },
      include: {
        evidence: true,
        sequestrationEvents: true,
      },
    });

    return NextResponse.json(bcu);
  } catch (error) {
    console.error('Error retiring BCU:', error);
    return NextResponse.json(
      { error: 'Failed to retire BCU' },
      { status: 500 }
    );
  }
}
