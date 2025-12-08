import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { emissionFactorSchema } from '@/lib/validations/emission-factor';

// GET single emission factor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const factor = await db.emissionFactor.findUnique({
      where: { id },
    });

    if (!factor) {
      return NextResponse.json(
        { error: 'Emission factor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(factor);
  } catch (error) {
    console.error('Error fetching emission factor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emission factor' },
      { status: 500 }
    );
  }
}

// PUT update emission factor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = emissionFactorSchema.parse(body);

    const factor = await db.emissionFactor.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(factor);
  } catch (error) {
    console.error('Error updating emission factor:', error);
    return NextResponse.json(
      { error: 'Failed to update emission factor' },
      { status: 500 }
    );
  }
}

// DELETE emission factor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.emissionFactor.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting emission factor:', error);
    return NextResponse.json(
      { error: 'Failed to delete emission factor' },
      { status: 500 }
    );
  }
}
