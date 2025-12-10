import { NextResponse } from 'next/server';
import db from '@/lib/db';

// Approximate CO2e sequestration factor for biochar
// ~3.67 tonnes CO2e per tonne of biochar (based on ~80% carbon content)
const CO2E_FACTOR = 3.67;

export async function GET() {
  try {
    const [feedstockCount, productionCount, sequestrationCount, productionBatches, sequestrationBatches] =
      await Promise.all([
        db.feedstockDelivery.count(),
        db.productionBatch.count(),
        db.sequestrationEvent.count(),
        db.productionBatch.findMany({
          where: { status: 'complete' },
          select: { outputBiocharWeightTonnes: true },
        }),
        db.sequestrationBatch.findMany({
          select: { quantityTonnes: true },
        }),
      ]);

    const totalBiocharTonnes = productionBatches.reduce(
      (sum, batch) => sum + batch.outputBiocharWeightTonnes,
      0
    );

    // Calculate total sequestered biochar and estimated CO2e
    const totalSequesteredBiochar = sequestrationBatches.reduce(
      (sum, batch) => sum + batch.quantityTonnes,
      0
    );
    const totalCO2eTonnes = totalSequesteredBiochar * CO2E_FACTOR;

    return NextResponse.json({
      feedstockCount,
      productionCount,
      sequestrationCount,
      totalBiocharTonnes,
      totalCO2eTonnes,
    });
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
