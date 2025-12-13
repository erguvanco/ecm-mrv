import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { createLeakageAssessmentSchema, calculateTotalLeakage } from '@/lib/validations/leakage-assessment';
import {
  parsePaginationParams,
  calculateSkip,
  createPaginatedResponse,
  serverErrorResponse,
  notFoundResponse,
  validationErrorResponse,
  validateUUIDParam,
} from '@/lib/api-utils';

/**
 * GET /api/leakage-assessment
 * List all leakage assessments with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const pagination = parsePaginationParams(searchParams);
    const facilityId = validateUUIDParam(searchParams.get('facilityId'));
    const monitoringPeriodId = validateUUIDParam(searchParams.get('monitoringPeriodId'));

    // Build where clause with validated parameters
    const where: { facilityId?: string; monitoringPeriodId?: string | null } = {};
    if (facilityId) where.facilityId = facilityId;
    if (monitoringPeriodId) where.monitoringPeriodId = monitoringPeriodId;

    // Get total count for pagination
    const total = await db.leakageAssessment.count({ where });

    // Fetch paginated data
    const assessments = await db.leakageAssessment.findMany({
      where,
      orderBy: { assessmentDate: 'desc' },
      skip: calculateSkip(pagination.page, pagination.limit),
      take: pagination.limit,
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            registrationNumber: true,
          },
        },
      },
    });

    return NextResponse.json(createPaginatedResponse(assessments, total, pagination));
  } catch (error) {
    console.error('Error fetching leakage assessments:', error);
    return serverErrorResponse('Failed to fetch leakage assessments');
  }
}

/**
 * POST /api/leakage-assessment
 * Create a new leakage assessment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Calculate total if not provided
    if (body.totalLeakageKgCO2e === undefined || body.totalLeakageKgCO2e === 0) {
      body.totalLeakageKgCO2e = calculateTotalLeakage({
        facilityEcologicalKgCO2e: body.facilityEcologicalKgCO2e ?? 0,
        biomassEcologicalKgCO2e: body.biomassEcologicalKgCO2e ?? 0,
        afoluLeakageKgCO2e: body.afoluLeakageKgCO2e ?? 0,
        energyMaterialLeakageKgCO2e: body.energyMaterialLeakageKgCO2e ?? 0,
        ilucContributionKgCO2e: body.ilucContributionKgCO2e ?? 0,
      });
    }

    const result = createLeakageAssessmentSchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse(result.error.issues);
    }

    // Verify facility exists
    const facility = await db.facility.findUnique({
      where: { id: result.data.facilityId },
      select: { id: true },
    });

    if (!facility) {
      return notFoundResponse('Facility');
    }

    const assessment = await db.leakageAssessment.create({
      data: result.data,
      include: {
        facility: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(assessment, { status: 201 });
  } catch (error) {
    console.error('Error creating leakage assessment:', error);
    return serverErrorResponse('Failed to create leakage assessment');
  }
}
