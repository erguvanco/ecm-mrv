import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { updateLeakageAssessmentSchema, calculateTotalLeakage } from '@/lib/validations/leakage-assessment';

/**
 * GET /api/leakage-assessment/[id]
 * Get a specific leakage assessment
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const assessment = await db.leakageAssessment.findUnique({
      where: { id },
      include: {
        facility: true,
      },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: 'Leakage assessment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(assessment);
  } catch (error) {
    console.error('Error fetching leakage assessment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leakage assessment' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/leakage-assessment/[id]
 * Update a leakage assessment
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get existing assessment for calculating totals
    const existing = await db.leakageAssessment.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Leakage assessment not found' },
        { status: 404 }
      );
    }

    // Recalculate total if any component changed
    const facilityEco = body.facilityEcologicalKgCO2e ?? existing.facilityEcologicalKgCO2e;
    const biomassEco = body.biomassEcologicalKgCO2e ?? existing.biomassEcologicalKgCO2e;
    const afolu = body.afoluLeakageKgCO2e ?? existing.afoluLeakageKgCO2e;
    const energyMaterial = body.energyMaterialLeakageKgCO2e ?? existing.energyMaterialLeakageKgCO2e;
    const iluc = body.ilucContributionKgCO2e ?? existing.ilucContributionKgCO2e;

    body.totalLeakageKgCO2e = calculateTotalLeakage({
      facilityEcologicalKgCO2e: facilityEco,
      biomassEcologicalKgCO2e: biomassEco,
      afoluLeakageKgCO2e: afolu,
      energyMaterialLeakageKgCO2e: energyMaterial,
      ilucContributionKgCO2e: iluc,
    });

    const result = updateLeakageAssessmentSchema.safeParse({ ...body, id });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: result.error.issues },
        { status: 400 }
      );
    }

    const { id: _id, ...updateData } = result.data;

    const assessment = await db.leakageAssessment.update({
      where: { id },
      data: updateData,
      include: {
        facility: true,
      },
    });

    return NextResponse.json(assessment);
  } catch (error) {
    console.error('Error updating leakage assessment:', error);
    return NextResponse.json(
      { error: 'Failed to update leakage assessment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/leakage-assessment/[id]
 * Delete a leakage assessment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.leakageAssessment.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Leakage assessment not found' },
        { status: 404 }
      );
    }

    await db.leakageAssessment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting leakage assessment:', error);
    return NextResponse.json(
      { error: 'Failed to delete leakage assessment' },
      { status: 500 }
    );
  }
}
