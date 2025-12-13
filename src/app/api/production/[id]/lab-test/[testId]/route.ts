import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { updateLabTestSchema, calculateLabTestDerivedValues } from '@/lib/validations/lab-test';

/**
 * GET /api/production/[id]/lab-test/[testId]
 * Get a specific lab test
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; testId: string }> }
) {
  try {
    const { id, testId } = await params;

    const labTest = await db.biocharLabTest.findFirst({
      where: {
        id: testId,
        productionBatchId: id,
      },
    });

    if (!labTest) {
      return NextResponse.json(
        { error: 'Lab test not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(labTest);
  } catch (error) {
    console.error('Error fetching lab test:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lab test' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/production/[id]/lab-test/[testId]
 * Update a lab test
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; testId: string }> }
) {
  try {
    const { id, testId } = await params;
    const body = await request.json();

    // Verify lab test exists and belongs to this batch
    const existing = await db.biocharLabTest.findFirst({
      where: {
        id: testId,
        productionBatchId: id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Lab test not found' },
        { status: 404 }
      );
    }

    const result = updateLabTestSchema.safeParse({ ...body, id: testId });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: result.error.issues },
        { status: 400 }
      );
    }

    const { id: _id, ...updateData } = result.data;

    // Recalculate derived values if carbon/hydrogen changed
    let derivedValues = null;
    const totalCarbon = updateData.totalCarbonPercent ?? existing.totalCarbonPercent;
    const inorganicCarbon = updateData.inorganicCarbonPercent ?? existing.inorganicCarbonPercent;
    const hydrogen = updateData.hydrogenPercent ?? existing.hydrogenPercent;

    if (updateData.totalCarbonPercent !== undefined ||
        updateData.inorganicCarbonPercent !== undefined ||
        updateData.hydrogenPercent !== undefined) {
      derivedValues = calculateLabTestDerivedValues({
        totalCarbonPercent: totalCarbon,
        inorganicCarbonPercent: inorganicCarbon,
        hydrogenPercent: hydrogen,
      });
    }

    const labTest = await db.$transaction(async (tx) => {
      const test = await tx.biocharLabTest.update({
        where: { id: testId },
        data: {
          ...updateData,
          ...(derivedValues && {
            organicCarbonPercent: derivedValues.organicCarbonPercent,
            hCorgRatio: derivedValues.hCorgRatio,
            passesQualityThreshold: derivedValues.passesQualityThreshold,
          }),
        },
      });

      // Update production batch with quality data if this is the latest test
      const latestTest = await tx.biocharLabTest.findFirst({
        where: { productionBatchId: id },
        orderBy: { testDate: 'desc' },
      });

      if (latestTest && latestTest.id === testId && derivedValues) {
        await tx.productionBatch.update({
          where: { id },
          data: {
            totalCarbonPercent: totalCarbon,
            organicCarbonPercent: derivedValues.organicCarbonPercent,
            hydrogenPercent: hydrogen,
            hCorgRatio: derivedValues.hCorgRatio,
            qualityValidationStatus: derivedValues.passesQualityThreshold ? 'passed' : 'failed',
          },
        });
      }

      return test;
    });

    return NextResponse.json(labTest);
  } catch (error) {
    console.error('Error updating lab test:', error);
    return NextResponse.json(
      { error: 'Failed to update lab test' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/production/[id]/lab-test/[testId]
 * Delete a lab test
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; testId: string }> }
) {
  try {
    const { id, testId } = await params;

    // Verify lab test exists and belongs to this batch
    const existing = await db.biocharLabTest.findFirst({
      where: {
        id: testId,
        productionBatchId: id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Lab test not found' },
        { status: 404 }
      );
    }

    await db.biocharLabTest.delete({
      where: { id: testId },
    });

    // Update production batch to use next most recent test (if any)
    const nextTest = await db.biocharLabTest.findFirst({
      where: { productionBatchId: id },
      orderBy: { testDate: 'desc' },
    });

    if (nextTest) {
      const derivedValues = calculateLabTestDerivedValues({
        totalCarbonPercent: nextTest.totalCarbonPercent,
        inorganicCarbonPercent: nextTest.inorganicCarbonPercent,
        hydrogenPercent: nextTest.hydrogenPercent,
      });

      await db.productionBatch.update({
        where: { id },
        data: {
          totalCarbonPercent: nextTest.totalCarbonPercent,
          organicCarbonPercent: derivedValues.organicCarbonPercent,
          hydrogenPercent: nextTest.hydrogenPercent,
          hCorgRatio: derivedValues.hCorgRatio,
          qualityValidationStatus: derivedValues.passesQualityThreshold ? 'passed' : 'failed',
        },
      });
    } else {
      // No more lab tests, clear quality data
      await db.productionBatch.update({
        where: { id },
        data: {
          totalCarbonPercent: null,
          organicCarbonPercent: null,
          hydrogenPercent: null,
          hCorgRatio: null,
          qualityValidationStatus: 'pending',
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lab test:', error);
    return NextResponse.json(
      { error: 'Failed to delete lab test' },
      { status: 500 }
    );
  }
}
