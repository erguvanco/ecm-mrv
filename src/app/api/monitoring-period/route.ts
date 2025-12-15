import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { createMonitoringPeriodSchema } from '@/lib/validations/monitoring-period';
import {
  parsePaginationParams,
  calculateSkip,
  createPaginatedResponse,
  serverErrorResponse,
  badRequestResponse,
  validationErrorResponse,
  validateUUIDParam,
  validateStatusParam,
} from '@/lib/api-utils';

const VALID_MONITORING_STATUSES = ['active', 'closed', 'verified'] as const;

/**
 * GET /api/monitoring-period
 * List all monitoring periods with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const pagination = parsePaginationParams(searchParams);
    const facilityId = validateUUIDParam(searchParams.get('facilityId'));
    const status = validateStatusParam(searchParams.get('status'), VALID_MONITORING_STATUSES);

    // Build where clause with validated parameters
    const where: { facilityId?: string; status?: string } = {};
    if (facilityId) where.facilityId = facilityId;
    if (status) where.status = status;

    // Get total count for pagination
    const total = await db.monitoringPeriod.count({ where });

    // Fetch paginated data
    const monitoringPeriods = await db.monitoringPeriod.findMany({
      where,
      orderBy: { periodStart: 'desc' },
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
        corcIssuances: {
          select: {
            id: true,
            serialNumber: true,
            netCORCsTCO2e: true,
            status: true,
          },
        },
        _count: {
          select: {
            corcIssuances: true,
          },
        },
      },
    });

    return NextResponse.json(createPaginatedResponse(monitoringPeriods, total, pagination));
  } catch (error) {
    console.error('Error fetching monitoring periods:', error);
    return serverErrorResponse('Failed to fetch monitoring periods');
  }
}

/**
 * POST /api/monitoring-period
 * Create a new monitoring period
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createMonitoringPeriodSchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse(result.error.issues);
    }

    // Check for overlapping periods
    const overlapping = await db.monitoringPeriod.findFirst({
      where: {
        facilityId: result.data.facilityId,
        OR: [
          {
            periodStart: { lte: result.data.periodEnd },
            periodEnd: { gte: result.data.periodStart },
          },
        ],
      },
    });

    if (overlapping) {
      return badRequestResponse('Monitoring period overlaps with an existing period');
    }

    const monitoringPeriod = await db.monitoringPeriod.create({
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

    return NextResponse.json(monitoringPeriod, { status: 201 });
  } catch (error) {
    console.error('Error creating monitoring period:', error);
    return serverErrorResponse('Failed to create monitoring period');
  }
}
