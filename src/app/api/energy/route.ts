import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { createEnergyUsageSchema } from '@/lib/validations/energy';

export async function GET() {
  try {
    const energyUsages = await db.energyUsage.findMany({
      orderBy: { periodStart: 'desc' },
      include: {
        evidence: { select: { id: true } },
        productionBatch: {
          select: { id: true, productionDate: true },
        },
      },
    });

    return NextResponse.json(energyUsages);
  } catch (error) {
    console.error('Error fetching energy usages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch energy usages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createEnergyUsageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: result.error.issues },
        { status: 400 }
      );
    }

    const energyUsage = await db.energyUsage.create({
      data: result.data,
      include: {
        evidence: true,
      },
    });

    return NextResponse.json(energyUsage, { status: 201 });
  } catch (error) {
    console.error('Error creating energy usage:', error);
    return NextResponse.json(
      { error: 'Failed to create energy usage' },
      { status: 500 }
    );
  }
}
