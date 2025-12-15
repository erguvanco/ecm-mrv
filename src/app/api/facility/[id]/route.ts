import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { updateFacilitySchema } from '@/lib/validations/facility';

/**
 * GET /api/facility/[id]
 * Get a specific facility by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const facility = await db.facility.findUnique({
      where: { id },
      include: {
        monitoringPeriods: {
          orderBy: { periodStart: 'desc' },
          include: {
            _count: {
              select: {
                corcIssuances: true,
              },
            },
          },
        },
        productionBatches: {
          orderBy: { productionDate: 'desc' },
          take: 10,
          select: {
            id: true,
            productionDate: true,
            outputBiocharWeightTonnes: true,
            status: true,
          },
        },
        leakageAssessments: {
          orderBy: { assessmentDate: 'desc' },
        },
      },
    });

    if (!facility) {
      return NextResponse.json(
        { error: 'Facility not found' },
        { status: 404 }
      );
    }

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
 * PUT /api/facility/[id]
 * Update a facility
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const result = updateFacilitySchema.safeParse({ ...body, id });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: result.error.issues },
        { status: 400 }
      );
    }

    const { id: _id, ...updateData } = result.data;

    const facility = await db.facility.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(facility);
  } catch (error) {
    console.error('Error updating facility:', error);
    return NextResponse.json(
      { error: 'Failed to update facility' },
      { status: 500 }
    );
  }
}
