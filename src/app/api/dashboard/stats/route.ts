import { NextResponse } from 'next/server';
import db from '@/lib/db';

// Approximate CO2e sequestration factor for biochar (legacy calculation)
// ~3.67 tonnes CO2e per tonne of biochar (based on ~80% carbon content)
const CO2E_FACTOR = 3.67;

export async function GET() {
  try {
    const [
      feedstockCount,
      productionCount,
      sequestrationCount,
      productionBatches,
      sequestrationBatches,
      // CORC metrics
      facility,
      monitoringPeriods,
      corcIssuances,
    ] = await Promise.all([
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
      // CORC data
      db.facility.findFirst({
        select: { id: true, name: true, registrationNumber: true },
      }),
      db.monitoringPeriod.findMany({
        select: {
          id: true,
          status: true,
          netCORCsTCO2e: true,
          periodStart: true,
          periodEnd: true,
        },
        orderBy: { periodStart: 'desc' },
        take: 5,
      }),
      db.cORCIssuance.findMany({
        select: {
          id: true,
          status: true,
          netCORCsTCO2e: true,
          issuanceDate: true,
        },
      }),
    ]);

    const totalBiocharTonnes = productionBatches.reduce(
      (sum, batch) => sum + batch.outputBiocharWeightTonnes,
      0
    );

    // Calculate total sequestered biochar and estimated CO2e (legacy)
    const totalSequesteredBiochar = sequestrationBatches.reduce(
      (sum, batch) => sum + batch.quantityTonnes,
      0
    );
    const totalCO2eTonnes = totalSequesteredBiochar * CO2E_FACTOR;

    // CORC statistics
    const corcStats = {
      totalCORCsIssued: corcIssuances
        .filter(c => c.status === 'issued' || c.status === 'retired')
        .reduce((sum, c) => sum + (c.netCORCsTCO2e ?? 0), 0),
      corcsDraft: corcIssuances.filter(c => c.status === 'draft').length,
      corcsIssued: corcIssuances.filter(c => c.status === 'issued').length,
      corcsRetired: corcIssuances.filter(c => c.status === 'retired').length,
      pendingVerification: monitoringPeriods.filter(p => p.status === 'closed').length,
      activeMonitoringPeriod: monitoringPeriods.find(p => p.status === 'active'),
    };

    return NextResponse.json({
      // Legacy metrics
      feedstockCount,
      productionCount,
      sequestrationCount,
      totalBiocharTonnes,
      totalCO2eTonnes,
      // CORC metrics (flattened for mobile app compatibility)
      totalCORCsIssued: corcStats.totalCORCsIssued,
      corcsDraft: corcStats.corcsDraft,
      corcsIssued: corcStats.corcsIssued,
      corcsRetired: corcStats.corcsRetired,
      pendingVerification: corcStats.pendingVerification,
      activeMonitoringPeriod: corcStats.activeMonitoringPeriod ?? null,
      // Additional data
      facility,
      recentMonitoringPeriods: monitoringPeriods,
    });
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
