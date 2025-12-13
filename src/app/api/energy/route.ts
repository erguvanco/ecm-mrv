import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { createEnergyUsageSchema } from '@/lib/validations/energy';
import {
  parsePaginationParams,
  calculateSkip,
  createPaginatedResponse,
  serverErrorResponse,
  validationErrorResponse,
} from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pagination = parsePaginationParams(searchParams);

    // Get total count for pagination
    const total = await db.energyUsage.count();

    // Fetch paginated data
    const energyUsages = await db.energyUsage.findMany({
      orderBy: { periodStart: 'desc' },
      skip: calculateSkip(pagination.page, pagination.limit),
      take: pagination.limit,
      include: {
        evidence: { select: { id: true } },
        productionBatch: {
          select: { id: true, productionDate: true },
        },
      },
    });

    return NextResponse.json(createPaginatedResponse(energyUsages, total, pagination));
  } catch (error) {
    console.error('Error fetching energy usages:', error);
    return serverErrorResponse('Failed to fetch energy usages');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createEnergyUsageSchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse(result.error.issues);
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
    return serverErrorResponse('Failed to create energy usage');
  }
}
