import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { createFeedstockDeliverySchema } from '@/lib/validations/feedstock';
import { calculateFeedstockRoute } from '@/lib/services/routing';

export async function GET() {
  try {
    const feedstocks = await db.feedstockDelivery.findMany({
      orderBy: { date: 'desc' },
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

    return NextResponse.json(feedstocks);
  } catch (error) {
    console.error('Error fetching feedstocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedstock deliveries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = createFeedstockDeliverySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: result.error.issues },
        { status: 400 }
      );
    }

    const feedstock = await db.feedstockDelivery.create({
      data: {
        ...result.data,
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
    return NextResponse.json(
      { error: 'Failed to create feedstock delivery' },
      { status: 500 }
    );
  }
}
