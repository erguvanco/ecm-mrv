import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { createLabTestSchema, calculateLabTestDerivedValues } from '@/lib/validations/lab-test';

/**
 * GET /api/production/[id]/lab-test
 * List all lab tests for a production batch
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify production batch exists
    const batch = await db.productionBatch.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!batch) {
      return NextResponse.json(
        { error: 'Production batch not found' },
        { status: 404 }
      );
    }

    const labTests = await db.biocharLabTest.findMany({
      where: { productionBatchId: id },
      orderBy: { testDate: 'desc' },
    });

    return NextResponse.json(labTests);
  } catch (error) {
    console.error('Error fetching lab tests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lab tests' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/production/[id]/lab-test
 * Create a new lab test for a production batch
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Verify production batch exists
    const batch = await db.productionBatch.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!batch) {
      return NextResponse.json(
        { error: 'Production batch not found' },
        { status: 404 }
      );
    }

    const result = createLabTestSchema.safeParse({ ...body, productionBatchId: id });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: result.error.issues },
        { status: 400 }
      );
    }

    // Calculate derived values
    const derivedValues = calculateLabTestDerivedValues({
      totalCarbonPercent: result.data.totalCarbonPercent,
      inorganicCarbonPercent: result.data.inorganicCarbonPercent,
      hydrogenPercent: result.data.hydrogenPercent,
    });

    const labTest = await db.$transaction(async (tx) => {
      // Create the lab test
      const test = await tx.biocharLabTest.create({
        data: {
          ...result.data,
          organicCarbonPercent: derivedValues.organicCarbonPercent,
          hCorgRatio: derivedValues.hCorgRatio,
          passesQualityThreshold: derivedValues.passesQualityThreshold,
        },
      });

      // Update production batch with quality data from latest test
      await tx.productionBatch.update({
        where: { id },
        data: {
          totalCarbonPercent: result.data.totalCarbonPercent,
          organicCarbonPercent: derivedValues.organicCarbonPercent,
          hydrogenPercent: result.data.hydrogenPercent,
          hCorgRatio: derivedValues.hCorgRatio,
          qualityValidationStatus: derivedValues.passesQualityThreshold ? 'passed' : 'failed',
        },
      });

      return test;
    });

    return NextResponse.json({
      ...labTest,
      qualityClassification: derivedValues.qualityClassification,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating lab test:', error);
    return NextResponse.json(
      { error: 'Failed to create lab test' },
      { status: 500 }
    );
  }
}
