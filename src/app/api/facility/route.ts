import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { createFacilitySchema } from '@/lib/validations/facility';

/**
 * GET /api/facility
 * Get the single facility (or null if none exists)
 */
export async function GET() {
  try {
    // For MVP, we only support a single facility
    const facility = await db.facility.findFirst({
      include: {
        monitoringPeriods: {
          orderBy: { periodStart: 'desc' },
          take: 5,
        },
        leakageAssessments: {
          orderBy: { assessmentDate: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            productionBatches: true,
            monitoringPeriods: true,
          },
        },
      },
    });

    return NextResponse.json(facility);
  } catch (error) {
    console.error('Error fetching facility:', error);
    return NextResponse.json(
      { error: 'Failed to fetch facility' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/facility
 * Create a new facility (only if none exists for MVP)
 */
export async function POST(request: NextRequest) {
  try {
    // Check if facility already exists
    const existingFacility = await db.facility.findFirst();
    if (existingFacility) {
      return NextResponse.json(
        { error: 'A facility already exists. For MVP, only one facility is supported.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const result = createFacilitySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: result.error.issues },
        { status: 400 }
      );
    }

    const facility = await db.facility.create({
      data: result.data,
    });

    return NextResponse.json(facility, { status: 201 });
  } catch (error) {
    console.error('Error creating facility:', error);
    return NextResponse.json(
      { error: 'Failed to create facility' },
      { status: 500 }
    );
  }
}
