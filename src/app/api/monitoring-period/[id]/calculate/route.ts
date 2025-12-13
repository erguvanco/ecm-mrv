import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import {
  calculateCORCs,
  validateCORCInput,
  getCORCCalculationBreakdown,
  createDefaultEProjectInput,
  createDefaultLeakageInput,
} from '@/lib/corc';
import type { CORCCalculationInput } from '@/lib/corc';

/**
 * POST /api/monitoring-period/[id]/calculate
 * Run CORC calculation for a monitoring period
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { saveResult = true, meanSoilTempCOverride, returnFullBreakdown = false } = body;

    // Get monitoring period with facility
    const monitoringPeriod = await db.monitoringPeriod.findUnique({
      where: { id },
      include: {
        facility: true,
      },
    });

    if (!monitoringPeriod) {
      return NextResponse.json(
        { error: 'Monitoring period not found' },
        { status: 404 }
      );
    }

    // Get all production batches within this period
    const productionBatches = await db.productionBatch.findMany({
      where: {
        facilityId: monitoringPeriod.facilityId,
        productionDate: {
          gte: monitoringPeriod.periodStart,
          lte: monitoringPeriod.periodEnd,
        },
        status: 'complete',
      },
      include: {
        labTests: {
          orderBy: { testDate: 'desc' },
          take: 1, // Most recent lab test
        },
        feedstockAllocations: {
          include: {
            feedstockDelivery: true,
          },
        },
        energyUsages: true,
      },
    });

    if (productionBatches.length === 0) {
      return NextResponse.json(
        { error: 'No completed production batches found in this monitoring period' },
        { status: 400 }
      );
    }

    // Get sequestration events within this period with batch quantities
    const sequestrationEvents = await db.sequestrationEvent.findMany({
      where: {
        finalDeliveryDate: {
          gte: monitoringPeriod.periodStart,
          lte: monitoringPeriod.periodEnd,
        },
      },
      include: {
        batches: {
          select: {
            quantityTonnes: true,
          },
        },
      },
    });

    // Get latest leakage assessment for the facility
    const leakageAssessment = await db.leakageAssessment.findFirst({
      where: { facilityId: monitoringPeriod.facilityId },
      orderBy: { assessmentDate: 'desc' },
    });

    // Aggregate production data
    let totalBiocharDryMassTonnes = 0;
    let weightedOrganicCarbonPercent = 0;
    let weightedHydrogenPercent = 0;
    let totalBiomassEmissionsKgCO2e = 0;
    let totalProductionEnergyKgCO2e = 0;
    let totalStackCH4Kg = 0;
    let totalStackN2OKg = 0;

    for (const batch of productionBatches) {
      const dryMass = batch.dryMassTonnes ?? batch.outputBiocharWeightTonnes;
      totalBiocharDryMassTonnes += dryMass;

      // Get quality parameters from lab test or batch
      const labTest = batch.labTests[0];
      const organicCarbon = labTest?.organicCarbonPercent ?? batch.organicCarbonPercent ?? 80;
      const hydrogen = labTest?.hydrogenPercent ?? batch.hydrogenPercent ?? 2;

      weightedOrganicCarbonPercent += organicCarbon * dryMass;
      weightedHydrogenPercent += hydrogen * dryMass;

      // Sum stack emissions
      totalStackCH4Kg += batch.ch4EmissionsKg ?? 0;
      totalStackN2OKg += batch.n2oEmissionsKg ?? 0;

      // Sum feedstock transport emissions
      for (const allocation of batch.feedstockAllocations) {
        const delivery = allocation.feedstockDelivery;
        // Estimate transport emissions: distance * weight * emission factor
        const transportEmissions = (delivery.deliveryDistanceKm ?? 0) *
          (allocation.weightUsedTonnes ?? 0) * 0.1; // 0.1 kg CO2e per tonne-km estimate
        totalBiomassEmissionsKgCO2e += transportEmissions;
      }

      // Sum energy usage emissions (estimate based on energy type and quantity)
      for (const energy of batch.energyUsages) {
        // Simple emission factor estimation: electricity ~0.5 kg CO2e/kWh, diesel ~2.7 kg CO2e/L
        let emissionFactor = 0.5; // default for electricity
        if (energy.energyType === 'diesel') emissionFactor = 2.7;
        else if (energy.energyType === 'gas') emissionFactor = 2.0;
        else if (energy.energyType === 'propane') emissionFactor = 1.5;
        totalProductionEnergyKgCO2e += energy.quantity * emissionFactor;
      }
    }

    // Guard against division by zero
    if (totalBiocharDryMassTonnes === 0) {
      return NextResponse.json(
        { error: 'No valid biochar dry mass data available for calculation. All production batches have zero dry mass.' },
        { status: 400 }
      );
    }

    // Calculate weighted averages
    const avgOrganicCarbonPercent = weightedOrganicCarbonPercent / totalBiocharDryMassTonnes;
    const avgHydrogenPercent = weightedHydrogenPercent / totalBiocharDryMassTonnes;

    // Get mean soil temperature from sequestration events or override
    let meanSoilTempC = meanSoilTempCOverride ?? 15; // Default to 15°C
    if (sequestrationEvents.length > 0) {
      const temps = sequestrationEvents
        .map(e => e.meanAnnualSoilTempC)
        .filter((t): t is number => t !== null);
      if (temps.length > 0) {
        meanSoilTempC = temps.reduce((a, b) => a + b, 0) / temps.length;
      }
    }

    // Calculate end-use emissions (transport to sequestration sites)
    let totalEndUseTransportKgCO2e = 0;
    for (const event of sequestrationEvents) {
      // Sum quantity from batches
      const totalQuantity = event.batches.reduce((sum, b) => sum + b.quantityTonnes, 0);
      // Estimate based on distance if available
      totalEndUseTransportKgCO2e += totalQuantity * 10; // 10 kg CO2e per tonne estimate
    }

    // Build project emissions input
    const projectEmissions = {
      ...createDefaultEProjectInput(),
      biomassEmissions: {
        cultivation: 0,
        collection: totalBiomassEmissionsKgCO2e * 0.2,
        transport: totalBiomassEmissionsKgCO2e * 0.6,
        preprocessing: totalBiomassEmissionsKgCO2e * 0.2,
      },
      productionEmissions: {
        energy: totalProductionEnergyKgCO2e,
        materials: 0,
        waste: 0,
        stackCH4Kg: totalStackCH4Kg,
        stackN2OKg: totalStackN2OKg,
        fossilCO2Kg: 0,
        maintenance: 0,
      },
      embodiedEmissions: {
        infrastructure: (monitoringPeriod.facility.totalInfrastructureEmissionsTCO2e ?? 0) * 1000 /
          (monitoringPeriod.facility.infrastructureLifetimeYears ?? 10),
        dLUC: 0,
      },
      endUseEmissions: {
        transport: totalEndUseTransportKgCO2e,
        packaging: 0,
        incorporation: 0,
      },
    };

    // Build leakage input
    const leakageInput = leakageAssessment
      ? {
          ecologicalLeakage: {
            facility: leakageAssessment.facilityEcologicalKgCO2e,
            biomassSourcing: leakageAssessment.biomassEcologicalKgCO2e,
          },
          marketActivityLeakage: {
            afolu: leakageAssessment.afoluLeakageKgCO2e,
            energyMaterial: leakageAssessment.energyMaterialLeakageKgCO2e,
            iluc: leakageAssessment.ilucContributionKgCO2e,
          },
        }
      : createDefaultLeakageInput();

    // Build CORC calculation input
    const calculationInput: CORCCalculationInput = {
      biocharDryMassTonnes: totalBiocharDryMassTonnes,
      organicCarbonPercent: avgOrganicCarbonPercent,
      hydrogenPercent: avgHydrogenPercent,
      meanSoilTempC,
      baselineType: monitoringPeriod.facility.baselineType as 'NEW_BUILT' | 'RETROFIT_FACILITY' | 'CHARCOAL_REPURPOSE',
      baselineCarbonStorageTCO2e: 0,
      projectEmissions,
      leakageEmissions: leakageInput,
    };

    // Validate input
    const validation = validateCORCInput(calculationInput);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'CORC calculation validation failed',
          errors: validation.errors,
          warnings: validation.warnings,
        },
        { status: 400 }
      );
    }

    // Run calculation
    const result = returnFullBreakdown
      ? getCORCCalculationBreakdown(calculationInput)
      : { result: calculateCORCs(calculationInput) };

    // Save result to monitoring period if requested
    if (saveResult) {
      await db.monitoringPeriod.update({
        where: { id },
        data: {
          cStoredTCO2e: result.result.cStoredTCO2e,
          cBaselineTCO2e: result.result.cBaselineTCO2e,
          cLossTCO2e: result.result.cLossTCO2e,
          persistenceFractionPercent: result.result.persistenceFractionPercent,
          eProjectTCO2e: result.result.eProjectTCO2e,
          eLeakageTCO2e: result.result.eLeakageTCO2e,
          netCORCsTCO2e: result.result.netCORCsTCO2e,
          calculatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      ...result,
      input: calculationInput,
      validation,
      productionBatchCount: productionBatches.length,
      sequestrationEventCount: sequestrationEvents.length,
    });
  } catch (error) {
    console.error('Error calculating CORCs:', error);
    return NextResponse.json(
      { error: 'Failed to calculate CORCs', details: String(error) },
      { status: 500 }
    );
  }
}
