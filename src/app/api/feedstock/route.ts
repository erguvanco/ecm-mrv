import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { createFeedstockDeliverySchema } from '@/lib/validations/feedstock';
import { calculateFeedstockRoute } from '@/lib/services/routing';
import { mapFeedstockToPuroCategory, PURO_BIOMASS_CATEGORIES } from '@/lib/validations/puro-categories';
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
    const total = await db.feedstockDelivery.count();

    // Fetch paginated data
    const feedstocks = await db.feedstockDelivery.findMany({
      orderBy: { date: 'desc' },
      skip: calculateSkip(pagination.page, pagination.limit),
      take: pagination.limit,
      include: {
        evidence: true,
        _count: {
          select: {
            productionBatches: true,
            transportEvents: true,
          },
        },
      },
    });

    // Add Puro category info to each feedstock
    const feedstocksWithPuro = feedstocks.map(f => {
      const puroCategory = f.puroCategory || mapFeedstockToPuroCategory(f.feedstockType);
      const puroCategoryInfo = puroCategory
        ? PURO_BIOMASS_CATEGORIES.find(c => c.code === puroCategory)
        : null;

      return {
        ...f,
        puroCategory,
        puroCategoryInfo,
      };
    });

    return NextResponse.json(createPaginatedResponse(feedstocksWithPuro, total, pagination));
  } catch (error) {
    console.error('Error fetching feedstocks:', error);
    return serverErrorResponse('Failed to fetch feedstock deliveries');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createFeedstockDeliverySchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse(result.error.issues);
    }

    // Auto-map Puro category from feedstock type if not provided
    const puroCategory = body.puroCategory || mapFeedstockToPuroCategory(result.data.feedstockType);
    const puroCategoryInfo = puroCategory
      ? PURO_BIOMASS_CATEGORIES.find(c => c.code === puroCategory)
      : null;

    const feedstock = await db.feedstockDelivery.create({
      data: {
        ...result.data,
        puroCategory,
        puroCategoryName: puroCategoryInfo?.name || null,
        routeStatus: result.data.sourceLat && result.data.sourceLng ? 'pending' : null,
      },
      include: {
        evidence: true,
      },
    });

    // Fire-and-forget: calculate route if coordinates exist
    if (feedstock.sourceLat && feedstock.sourceLng) {
      calculateFeedstockRoute(feedstock.id).catch((err) =>
        console.error('Background route calculation failed:', err)
      );
    }

    return NextResponse.json(feedstock, { status: 201 });
  } catch (error) {
    console.error('Error creating feedstock:', error);
    return serverErrorResponse('Failed to create feedstock delivery');
  }
}
