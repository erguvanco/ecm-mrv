import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { startOfMonth, endOfMonth, eachMonthOfInterval, max, min } from 'date-fns';
import { getDateRange, type TimeRange } from '@/lib/utils/date-range';

export const dynamic = 'force-dynamic';

// CO2e multiplier (3.6 tonnes CO2e per tonne of biochar)
const CO2E_MULTIPLIER = 3.6;

export async function GET(request: NextRequest) {
  try {
    // Get time range from query params
    const { searchParams } = new URL(request.url);
    const range = (searchParams.get('range') as TimeRange) || 'all';
    const { start: rangeStart } = getDateRange(range);

    // Build date filter for Prisma queries
    const dateFilter = rangeStart ? { gte: rangeStart } : undefined;

    // Fetch all data with optional date filtering
    const [feedstockData, productionData, sequestrationData] = await Promise.all([
      db.feedstockDelivery.findMany({
        where: dateFilter ? { date: dateFilter } : undefined,
        select: {
          date: true,
          weightTonnes: true,
        },
        orderBy: { date: 'asc' },
      }),
      db.productionBatch.findMany({
        where: { status: 'complete', ...(dateFilter ? { productionDate: dateFilter } : {}) },
        select: {
          productionDate: true,
          outputBiocharWeightTonnes: true,
        },
        orderBy: { productionDate: 'asc' },
      }),
      db.sequestrationEvent.findMany({
        where: { status: 'complete', ...(dateFilter ? { finalDeliveryDate: dateFilter } : {}) },
        select: {
          finalDeliveryDate: true,
          batches: {
            select: {
              quantityTonnes: true,
            },
          },
        },
        orderBy: { finalDeliveryDate: 'asc' },
      }),
    ]);

    // If no data at all, return empty
    if (feedstockData.length === 0 && productionData.length === 0 && sequestrationData.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Find the date range from actual data
    const allDates: Date[] = [
      ...feedstockData.map((f) => f.date),
      ...productionData.map((p) => p.productionDate),
      ...sequestrationData.map((s) => s.finalDeliveryDate),
    ];

    const minDate = startOfMonth(min(allDates));
    const maxDate = endOfMonth(max(allDates));

    // Generate months array covering all data
    const monthsInRange = eachMonthOfInterval({ start: minDate, end: maxDate });

    // Build chart data for each month
    const chartData = monthsInRange.map((monthDate) => {
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      // Sum feedstock deliveries for this month
      const feedstockDeliveries = feedstockData
        .filter((f) => f.date >= monthStart && f.date <= monthEnd)
        .reduce((sum, f) => sum + (f.weightTonnes || 0), 0);

      // Sum biochar produced for this month
      const biocharProduced = productionData
        .filter((p) => p.productionDate >= monthStart && p.productionDate <= monthEnd)
        .reduce((sum, p) => sum + p.outputBiocharWeightTonnes, 0);

      // Sum CO2 sequestered for this month
      const co2Sequestered = sequestrationData
        .filter((s) => s.finalDeliveryDate >= monthStart && s.finalDeliveryDate <= monthEnd)
        .reduce((sum, s) => {
          const batchTotal = s.batches.reduce((bSum, b) => bSum + b.quantityTonnes, 0);
          return sum + batchTotal * CO2E_MULTIPLIER;
        }, 0);

      return {
        month: monthDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
        feedstockDeliveries: Number(feedstockDeliveries.toFixed(2)),
        biocharProduced: Number(biocharProduced.toFixed(2)),
        co2Sequestered: Number(co2Sequestered.toFixed(2)),
      };
    });

    return NextResponse.json({ data: chartData });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch chart data', details: errorMessage },
      { status: 500 }
    );
  }
}
