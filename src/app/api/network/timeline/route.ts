import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

    // Get all geocoded feedstock deliveries for the year (matching map display)
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

    const feedstockDeliveries = await db.feedstockDelivery.findMany({
      where: {
        date: {
          gte: yearStart,
          lte: yearEnd,
        },
        sourceLat: { not: null },
        sourceLng: { not: null },
      },
      select: {
        date: true,
        weightTonnes: true,
      },
    });

    // Get all production batches for the year
    const productionBatches = await db.productionBatch.findMany({
      where: {
        productionDate: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
      select: {
        productionDate: true,
        outputBiocharWeightTonnes: true,
      },
    });

    // Get all geocoded sequestration events for the year (matching map display)
    const sequestrationEvents = await db.sequestrationEvent.findMany({
      where: {
        finalDeliveryDate: {
          gte: yearStart,
          lte: yearEnd,
        },
        destinationLat: { not: null },
        destinationLng: { not: null },
      },
      select: {
        finalDeliveryDate: true,
        batches: {
          select: {
            quantityTonnes: true,
          },
        },
      },
    });

    // Aggregate by month
    const months = MONTH_LABELS.map((label, monthIndex) => {
      // Incoming feedstock
      const monthFeedstock = feedstockDeliveries.filter((f) => {
        const date = new Date(f.date);
        return date.getMonth() === monthIndex;
      });
      const incomingCount = monthFeedstock.length;
      const incomingTonnage = monthFeedstock.reduce(
        (sum, f) => sum + (f.weightTonnes || 0),
        0
      );

      // Production batches
      const monthProduction = productionBatches.filter((p) => {
        const date = new Date(p.productionDate);
        return date.getMonth() === monthIndex;
      });
      const productionCount = monthProduction.length;
      const productionTonnage = monthProduction.reduce(
        (sum, p) => sum + (p.outputBiocharWeightTonnes || 0),
        0
      );

      // Outgoing sequestration
      const monthSequestration = sequestrationEvents.filter((s) => {
        const date = new Date(s.finalDeliveryDate);
        return date.getMonth() === monthIndex;
      });
      const outgoingCount = monthSequestration.length;
      const outgoingTonnage = monthSequestration.reduce(
        (sum, s) => sum + s.batches.reduce((bSum, b) => bSum + b.quantityTonnes, 0),
        0
      );

      return {
        month: monthIndex,
        label,
        incoming: {
          count: incomingCount,
          tonnage: Math.round(incomingTonnage * 100) / 100,
        },
        production: {
          count: productionCount,
          tonnage: Math.round(productionTonnage * 100) / 100,
        },
        outgoing: {
          count: outgoingCount,
          tonnage: Math.round(outgoingTonnage * 100) / 100,
        },
      };
    });

    return NextResponse.json({
      year,
      months,
    });
  } catch (error) {
    console.error('Error fetching timeline data:', error);
    return NextResponse.json({ error: 'Failed to fetch timeline data' }, { status: 500 });
  }
}
