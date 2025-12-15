import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { transferBCUSchema } from '@/lib/validations/bcu';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const result = transferBCUSchema.safeParse({ ...body, id });

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
        { error: 'Cannot transfer a retired BCU' },
        { status: 400 }
      );
    }

    const bcu = await db.bCU.update({
      where: { id },
      data: {
        status: 'transferred',
        ownerName: result.data.newOwnerName,
        accountId: result.data.newAccountId,
        notes: result.data.notes
          ? `${currentBCU.notes || ''}\n[Transfer] ${result.data.notes}`
          : currentBCU.notes,
      },
      include: {
        evidence: true,
        sequestrationEvents: true,
      },
    });

    return NextResponse.json(bcu);
  } catch (error) {
    console.error('Error transferring BCU:', error);
    return NextResponse.json(
      { error: 'Failed to transfer BCU' },
      { status: 500 }
    );
  }
}
