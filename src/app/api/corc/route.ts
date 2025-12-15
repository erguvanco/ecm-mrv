import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { createCORCSchema, generateCORCSerialNumber } from '@/lib/validations/corc';
import {
  parsePaginationParams,
  calculateSkip,
  createPaginatedResponse,
  serverErrorResponse,
  VALID_CORC_STATUSES,
  validateStatusParam,
  validateUUIDParam,
} from '@/lib/api-utils';

/**
 * GET /api/corc
 * List all CORC issuances with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const pagination = parsePaginationParams(searchParams);
    const status = validateStatusParam(searchParams.get('status'), VALID_CORC_STATUSES);
    const monitoringPeriodId = validateUUIDParam(searchParams.get('monitoringPeriodId'));

    // Build where clause with validated parameters
    const where: { status?: string; monitoringPeriodId?: string } = {};
    if (status) where.status = status;
    if (monitoringPeriodId) where.monitoringPeriodId = monitoringPeriodId;

    // Get total count for pagination
    const total = await db.cORCIssuance.count({ where });

    // Fetch paginated data
    const corcs = await db.cORCIssuance.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: calculateSkip(pagination.page, pagination.limit),
      take: pagination.limit,
      include: {
        monitoringPeriod: {
          include: {
            facility: {
              select: {
                id: true,
                name: true,
                registrationNumber: true,
              },
            },
          },
        },
        productionBatches: {
          include: {
            productionBatch: {
              select: {
                id: true,
                productionDate: true,
                outputBiocharWeightTonnes: true,
              },
            },
          },
        },
        _count: {
          select: {
            productionBatches: true,
            sequestrationEvents: true,
            evidence: true,
          },
        },
      },
    });

    return NextResponse.json(createPaginatedResponse(corcs, total, pagination));
  } catch (error) {
    console.error('Error fetching CORCs:', error);
    return serverErrorResponse('Failed to fetch CORCs');
  }
}

/**
 * POST /api/corc
 * Create a new CORC issuance (typically from a monitoring period calculation)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // If creating from a monitoring period, auto-populate values
    if (body.fromMonitoringPeriod && body.monitoringPeriodId) {
      const period = await db.monitoringPeriod.findUnique({
        where: { id: body.monitoringPeriodId },
        include: {
          facility: true,
        },
      });

      if (!period) {
        return NextResponse.json(
          { error: 'Monitoring period not found' },
          { status: 404 }
        );
      }

      if (period.netCORCsTCO2e === null) {
        return NextResponse.json(
          { error: 'CORC calculation has not been run for this monitoring period' },
          { status: 400 }
        );
      }

      // Get existing CORC count for serial number generation
      const existingCount = await db.cORCIssuance.count();
      const facilityCode = period.facility.registrationNumber.substring(0, 6).toUpperCase();
      const year = new Date().getFullYear();

      body.serialNumber = body.serialNumber || generateCORCSerialNumber(facilityCode, year, existingCount + 1);
      body.cStoredTCO2e = period.cStoredTCO2e;
      body.cBaselineTCO2e = period.cBaselineTCO2e ?? 0;
      body.cLossTCO2e = period.cLossTCO2e;
      body.persistenceFractionPercent = period.persistenceFractionPercent;
      body.eProjectTCO2e = period.eProjectTCO2e;
      body.eLeakageTCO2e = period.eLeakageTCO2e ?? 0;
      body.netCORCsTCO2e = period.netCORCsTCO2e;
    }

    const result = createCORCSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: result.error.issues },
        { status: 400 }
      );
    }

    // Check if serial number is unique
    const existingSerial = await db.cORCIssuance.findUnique({
      where: { serialNumber: result.data.serialNumber },
    });

    if (existingSerial) {
      return NextResponse.json(
        { error: 'Serial number already exists' },
        { status: 400 }
      );
    }

    const corc = await db.cORCIssuance.create({
      data: result.data,
      include: {
        monitoringPeriod: {
          include: {
            facility: true,
          },
        },
      },
    });

    return NextResponse.json(corc, { status: 201 });
  } catch (error) {
    console.error('Error creating CORC:', error);
    return NextResponse.json(
      { error: 'Failed to create CORC' },
      { status: 500 }
    );
  }
}
