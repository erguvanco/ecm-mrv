import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { updateEnergyUsageSchema } from '@/lib/validations/energy';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const energyUsage = await db.energyUsage.findUnique({
      where: { id },
      include: {
        evidence: true,
        productionBatch: {
          select: { id: true, productionDate: true },
        },
      },
    });

    if (!energyUsage) {
      return NextResponse.json(
        { error: 'Energy usage not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(energyUsage);
  } catch (error) {
    console.error('Error fetching energy usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch energy usage' },
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

    const result = updateEnergyUsageSchema.safeParse({ ...body, id });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: result.error.issues },
        { status: 400 }
      );
    }

    const { id: _id, ...data } = result.data;

    const energyUsage = await db.energyUsage.update({
      where: { id },
      data,
      include: {
        evidence: true,
      },
    });

    return NextResponse.json(energyUsage);
  } catch (error) {
    console.error('Error updating energy usage:', error);
    return NextResponse.json(
      { error: 'Failed to update energy usage' },
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

    // Check if record exists before attempting delete
    const existing = await db.energyUsage.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Energy usage not found' },
        { status: 404 }
      );
    }

    await db.energyUsage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting energy usage:', error);
    return NextResponse.json(
      { error: 'Failed to delete energy usage' },
      { status: 500 }
    );
  }
}
