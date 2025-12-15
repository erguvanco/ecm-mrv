export const dynamic = 'force-dynamic';

import Link from 'next/link';
import db from '@/lib/db';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Progress,
  Badge,
} from '@/components/ui';
import { Button } from '@/components/ui/button';
import {
  TreePine,
  Leaf,
  Factory,
  Truck,
  Zap,
  TrendingUp,
  ArrowDownToLine,
  ChevronRight,
  Scale,
  Info,
  AlertCircle,
  Calculator,
  Thermometer,
  FlaskConical,
  Building2,
} from 'lucide-react';
import {
  calculateCORCs,
  estimateCORCs,
  createDefaultEProjectInput,
  createDefaultLeakageInput,
} from '@/lib/corc';
import type { CORCCalculationInput } from '@/lib/corc';

async function getCORCData() {
  // Get completed production batches with lab tests
  const productionBatches = await db.productionBatch.findMany({
    where: { status: 'complete' },
    include: {
      labTests: {
        orderBy: { testDate: 'desc' },
        take: 1,
      },
      feedstockAllocations: {
        include: {
          feedstockDelivery: true,
        },
      },
      energyUsages: true,
    },
  });

  // Get sequestration events
  const sequestrationEvents = await db.sequestrationEvent.findMany({
    include: {
      batches: true,
    },
  });

  // Get facility (if exists)
  const facility = await db.facility.findFirst();

  // Get leakage assessment (if exists)
  const leakageAssessment = await db.leakageAssessment.findFirst({
    orderBy: { assessmentDate: 'desc' },
  });

  // Calculate aggregated data
  let totalBiocharDryMassTonnes = 0;
  let weightedOrganicCarbonPercent = 0;
  let weightedHydrogenPercent = 0;
  let totalBiomassEmissionsKgCO2e = 0;
  let totalProductionEnergyKgCO2e = 0;
  let totalStackCH4Kg = 0;
  let totalStackN2OKg = 0;
  let batchesWithLabTests = 0;

  for (const batch of productionBatches) {
    const dryMass = batch.dryMassTonnes ?? batch.outputBiocharWeightTonnes;
    totalBiocharDryMassTonnes += dryMass;

    // Get quality parameters from lab test or batch
    const labTest = batch.labTests[0];
    const organicCarbon = labTest?.organicCarbonPercent ?? batch.organicCarbonPercent ?? 80;
    const hydrogen = labTest?.hydrogenPercent ?? batch.hydrogenPercent ?? 2;

    if (labTest) batchesWithLabTests++;

    weightedOrganicCarbonPercent += organicCarbon * dryMass;
    weightedHydrogenPercent += hydrogen * dryMass;

    // Sum stack emissions
    totalStackCH4Kg += batch.ch4EmissionsKg ?? 0;
    totalStackN2OKg += batch.n2oEmissionsKg ?? 0;

    // Sum feedstock transport emissions
    for (const allocation of batch.feedstockAllocations) {
      const delivery = allocation.feedstockDelivery;
      const transportEmissions = (delivery.deliveryDistanceKm ?? 0) * (allocation.weightUsedTonnes ?? 0) * 0.1;
      totalBiomassEmissionsKgCO2e += transportEmissions;
    }

    // Sum energy usage emissions
    for (const energy of batch.energyUsages) {
      let emissionFactor = 0.5;
      if (energy.energyType === 'diesel') emissionFactor = 2.7;
      else if (energy.energyType === 'gas') emissionFactor = 2.0;
      else if (energy.energyType === 'propane') emissionFactor = 1.5;
      totalProductionEnergyKgCO2e += energy.quantity * emissionFactor;
    }
  }

  // Calculate weighted averages
  const avgOrganicCarbonPercent = totalBiocharDryMassTonnes > 0
    ? weightedOrganicCarbonPercent / totalBiocharDryMassTonnes
    : 80;
  const avgHydrogenPercent = totalBiocharDryMassTonnes > 0
    ? weightedHydrogenPercent / totalBiocharDryMassTonnes
    : 2;

  // Get mean soil temperature from sequestration events
  let meanSoilTempC = 15; // Default
  const temps = sequestrationEvents
    .map(e => e.meanAnnualSoilTempC)
    .filter((t): t is number => t !== null);
  if (temps.length > 0) {
    meanSoilTempC = temps.reduce((a, b) => a + b, 0) / temps.length;
  }

  // Calculate total sequestered
  const totalSequesteredTonnes = sequestrationEvents.reduce(
    (sum, e) => sum + e.batches.reduce((s, b) => s + b.quantityTonnes, 0),
    0
  );

  // Calculate end-use emissions
  let totalEndUseTransportKgCO2e = 0;
  for (const event of sequestrationEvents) {
    const qty = event.batches.reduce((s, b) => s + b.quantityTonnes, 0);
    totalEndUseTransportKgCO2e += qty * 10;
  }

  // Use actual biochar for CORC calculation if available, otherwise use sequestered
  const biocharForCalc = totalBiocharDryMassTonnes > 0
    ? totalBiocharDryMassTonnes
    : totalSequesteredTonnes;

  // Build project emissions
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
      infrastructure: facility
        ? (facility.totalInfrastructureEmissionsTCO2e * 1000) / (facility.infrastructureLifetimeYears || 10)
        : 0,
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

  // Calculate CORC if we have biochar data
  let corcResult = null;
  let estimate = null;

  if (biocharForCalc > 0) {
    const calculationInput: CORCCalculationInput = {
      biocharDryMassTonnes: biocharForCalc,
      organicCarbonPercent: avgOrganicCarbonPercent,
      hydrogenPercent: avgHydrogenPercent,
      meanSoilTempC,
      baselineType: (facility?.baselineType as 'NEW_BUILT' | 'RETROFIT_FACILITY' | 'CHARCOAL_REPURPOSE') || 'NEW_BUILT',
      baselineCarbonStorageTCO2e: 0,
      projectEmissions,
      leakageEmissions: leakageInput,
    };

    try {
      corcResult = calculateCORCs(calculationInput);
    } catch {
      // If full calculation fails, use estimate
      estimate = estimateCORCs(
        biocharForCalc,
        avgOrganicCarbonPercent,
        avgHydrogenPercent,
        meanSoilTempC
      );
    }
  }

  return {
    productionBatchCount: productionBatches.length,
    batchesWithLabTests,
    sequestrationEventCount: sequestrationEvents.length,
    totalBiocharDryMassTonnes,
    totalSequesteredTonnes,
    avgOrganicCarbonPercent,
    avgHydrogenPercent,
    meanSoilTempC,
    facility,
    corcResult,
    estimate,
    hasLeakageAssessment: !!leakageAssessment,
  };
}

function formatNumber(value: number, decimals: number = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default async function LCAPage() {
  const data = await getCORCData();
  const hasData = data.totalBiocharDryMassTonnes > 0 || data.totalSequesteredTonnes > 0;
  const result = data.corcResult || data.estimate;

  // Calculate H/C_org ratio
  const hCorgRatio = data.avgOrganicCarbonPercent > 0
    ? (data.avgHydrogenPercent / data.avgOrganicCarbonPercent) * 12
    : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-logo text-2xl tracking-tight">CORC Calculator</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            Puro.earth Biochar Methodology - CO₂ Removal Certificate quantification
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/monitoring">
            <Button size="sm" variant="outline" className="h-8">
              <Calculator className="h-3.5 w-3.5 mr-1.5" />
              Monitoring Periods
            </Button>
          </Link>
          <Link href="/corc">
            <Button size="sm" className="h-8">
              <TreePine className="h-3.5 w-3.5 mr-1.5" />
              CORC Registry
            </Button>
          </Link>
        </div>
      </div>

      {!hasData ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <TreePine className="h-12 w-12 mx-auto mb-4 text-[var(--muted-foreground)] opacity-50" />
            <p className="text-[var(--muted-foreground)] mb-4">
              No production data found. Complete production batches with lab tests to calculate CORCs.
            </p>
            <Link href="/production/new">
              <Button size="sm">
                <Factory className="h-3.5 w-3.5 mr-1.5" />
                Create Production Batch
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Formula Display */}
          <Card className="bg-gradient-to-br from-slate-500/5 via-slate-500/10 to-slate-500/5 border-slate-500/20">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-[var(--muted-foreground)] mb-2">Puro.earth Equation 5.1</p>
              <p className="font-mono text-lg">
                CORCs = C<sub>stored</sub> − C<sub>baseline</sub> − C<sub>loss</sub> − E<sub>project</sub> − E<sub>leakage</sub>
              </p>
            </CardContent>
          </Card>

          {/* Status Warnings */}
          {data.batchesWithLabTests === 0 && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">No Lab Tests Found</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Add biochar lab tests to verify H/C_org ratio and organic carbon content for accurate CORC calculation.
                  </p>
                </div>
                <Link href="/production" className="ml-auto">
                  <Button size="sm" variant="outline">Add Lab Test</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {hCorgRatio > 0.7 && (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Quality Threshold Exceeded</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    H/C_org ratio ({formatNumber(hCorgRatio, 3)}) exceeds 0.7 threshold. Biochar may not be eligible for CORCs.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hero Metrics Row */}
          <div className="grid gap-3 md:grid-cols-3">
            {/* Net CORCs - Hero Card */}
            <Card className="md:col-span-1 bg-gradient-to-br from-emerald-500/5 via-emerald-500/10 to-teal-500/5 border-emerald-500/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Net CORCs</p>
                    <p className="text-3xl font-bold mt-1 tracking-tight">
                      {result ? formatNumber('netCORCsTCO2e' in result ? result.netCORCsTCO2e : result.estimatedCORCsTCO2e) : '—'}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">tonnes CO₂e</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <TreePine className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
                {data.corcResult && (
                  <div className="mt-3 pt-3 border-t border-emerald-500/20">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--muted-foreground)]">
                        <Badge variant={data.corcResult.qualityValid ? 'default' : 'destructive'} className="text-[10px] h-5">
                          {data.corcResult.qualityValid ? 'Quality Valid' : 'Quality Failed'}
                        </Badge>
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                        {data.corcResult.permanenceType}
                      </span>
                    </div>
                  </div>
                )}
                {data.estimate && (
                  <div className="mt-3 pt-3 border-t border-emerald-500/20">
                    <p className="text-[10px] text-amber-600">Estimate only - full LCA data required</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* C_stored */}
            <Card className="md:col-span-1">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-[var(--muted-foreground)]">C_stored</p>
                    <p className="text-3xl font-bold mt-1 tracking-tight text-green-600">
                      {result ? formatNumber(result.cStoredTCO2e) : '—'}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">tonnes CO₂e gross</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Scale className="h-5 w-5 text-green-500" />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-[var(--border)]">
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <Factory className="h-3 w-3 text-blue-500" />
                      <span className="text-[var(--muted-foreground)]">{formatNumber(data.totalBiocharDryMassTonnes)}t biochar</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FlaskConical className="h-3 w-3 text-violet-500" />
                      <span className="text-[var(--muted-foreground)]">{formatNumber(data.avgOrganicCarbonPercent, 1)}% C</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deductions */}
            <Card className="md:col-span-1">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-[var(--muted-foreground)]">Total Deductions</p>
                    <p className="text-3xl font-bold mt-1 tracking-tight text-red-600">
                      {data.corcResult
                        ? formatNumber(
                            data.corcResult.cBaselineTCO2e +
                            data.corcResult.cLossTCO2e +
                            data.corcResult.eProjectTCO2e +
                            data.corcResult.eLeakageTCO2e
                          )
                        : data.estimate
                        ? formatNumber(data.estimate.cLossTCO2e + data.estimate.estimatedEmissionsTCO2e)
                        : '—'}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">tonnes CO₂e</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-red-500 rotate-180" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Input Parameters */}
          <div className="grid gap-2 grid-cols-2 md:grid-cols-5">
            <Card className="border-[var(--border)]">
              <CardContent className="p-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center">
                    <Factory className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold leading-none">{formatNumber(data.totalBiocharDryMassTonnes, 1)}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">t biochar (dry)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-[var(--border)]">
              <CardContent className="p-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-md bg-violet-500/10 flex items-center justify-center">
                    <FlaskConical className="h-4 w-4 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold leading-none">{formatNumber(hCorgRatio, 2)}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">H/C_org ratio</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-[var(--border)]">
              <CardContent className="p-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-md bg-emerald-500/10 flex items-center justify-center">
                    <Leaf className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold leading-none">{formatNumber(data.avgOrganicCarbonPercent, 1)}%</p>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">C_org content</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-[var(--border)]">
              <CardContent className="p-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-md bg-amber-500/10 flex items-center justify-center">
                    <Thermometer className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold leading-none">{formatNumber(data.meanSoilTempC, 0)}°C</p>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">mean soil temp</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-[var(--border)]">
              <CardContent className="p-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-md bg-teal-500/10 flex items-center justify-center">
                    <ArrowDownToLine className="h-4 w-4 text-teal-500" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold leading-none">
                      {data.corcResult ? formatNumber(data.corcResult.persistenceFractionPercent, 1) : '—'}%
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">persistence</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid - Formula Breakdown */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* CORC Formula Breakdown */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium">CORC Calculation Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-0">
                  <div className="flex justify-between py-2.5 border-b border-[var(--border)] text-sm">
                    <span className="text-[var(--muted-foreground)] flex items-center gap-1.5">
                      <Scale className="h-3.5 w-3.5 text-green-500" />
                      C_stored (Eq 6.1)
                    </span>
                    <span className="font-medium text-green-600">
                      +{result && 'cStoredTCO2e' in result ? formatNumber(result.cStoredTCO2e) : '—'} tCO₂e
                    </span>
                  </div>

                  <div className="flex justify-between py-2.5 border-b border-[var(--border)] text-sm">
                    <span className="text-[var(--muted-foreground)] flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-slate-500" />
                      C_baseline
                    </span>
                    <span className="font-medium text-red-600">
                      −{data.corcResult ? formatNumber(data.corcResult.cBaselineTCO2e) : '0.00'} tCO₂e
                    </span>
                  </div>

                  <div className="flex justify-between py-2.5 border-b border-[var(--border)] text-sm">
                    <span className="text-[var(--muted-foreground)] flex items-center gap-1.5">
                      <Thermometer className="h-3.5 w-3.5 text-amber-500" />
                      C_loss (Eq 6.3)
                    </span>
                    <span className="font-medium text-red-600">
                      −{result && 'cLossTCO2e' in result ? formatNumber(result.cLossTCO2e) : '—'} tCO₂e
                    </span>
                  </div>

                  <div className="flex justify-between py-2.5 border-b border-[var(--border)] text-sm">
                    <span className="text-[var(--muted-foreground)] flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-blue-500" />
                      E_project (Eq 7.1)
                    </span>
                    <span className="font-medium text-red-600">
                      −{data.corcResult ? formatNumber(data.corcResult.eProjectTCO2e) : '—'} tCO₂e
                    </span>
                  </div>

                  <div className="flex justify-between py-2.5 border-b border-[var(--border)] text-sm">
                    <span className="text-[var(--muted-foreground)] flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-violet-500" />
                      E_leakage (Eq 8.1)
                    </span>
                    <span className="font-medium text-red-600">
                      −{data.corcResult ? formatNumber(data.corcResult.eLeakageTCO2e) : '—'} tCO₂e
                    </span>
                  </div>

                  <div className="flex justify-between py-2.5 bg-emerald-500/10 px-3 -mx-3 rounded text-sm mt-2">
                    <span className="font-medium flex items-center gap-1.5">
                      <TreePine className="h-3.5 w-3.5 text-emerald-600" />
                      Net CORCs
                    </span>
                    <span className="font-bold text-emerald-600">
                      ={result ? formatNumber('netCORCsTCO2e' in result ? result.netCORCsTCO2e : result.estimatedCORCsTCO2e) : '—'} tCO₂e
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emissions Breakdown */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium">E_project Breakdown (Eq 7.2)</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-4">
                {data.corcResult && (
                  <>
                    <div>
                      <div className="flex justify-between mb-1.5 text-sm">
                        <span className="flex items-center gap-1.5">
                          <Leaf className="h-3.5 w-3.5 text-emerald-500" />
                          E_biomass
                        </span>
                        <span className="font-medium">{formatNumber(data.corcResult.breakdown.biomassEmissionsTCO2e)} tCO₂e</span>
                      </div>
                      <Progress
                        value={
                          data.corcResult.eProjectTCO2e > 0
                            ? (data.corcResult.breakdown.biomassEmissionsTCO2e / data.corcResult.eProjectTCO2e) * 100
                            : 0
                        }
                        className="h-2"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1.5 text-sm">
                        <span className="flex items-center gap-1.5">
                          <Factory className="h-3.5 w-3.5 text-blue-500" />
                          E_production
                        </span>
                        <span className="font-medium">{formatNumber(data.corcResult.breakdown.productionEmissionsTCO2e)} tCO₂e</span>
                      </div>
                      <Progress
                        value={
                          data.corcResult.eProjectTCO2e > 0
                            ? (data.corcResult.breakdown.productionEmissionsTCO2e / data.corcResult.eProjectTCO2e) * 100
                            : 0
                        }
                        className="h-2"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1.5 text-sm">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-slate-500" />
                          E_embodied
                        </span>
                        <span className="font-medium">{formatNumber(data.corcResult.breakdown.embodiedEmissionsTCO2e)} tCO₂e</span>
                      </div>
                      <Progress
                        value={
                          data.corcResult.eProjectTCO2e > 0
                            ? (data.corcResult.breakdown.embodiedEmissionsTCO2e / data.corcResult.eProjectTCO2e) * 100
                            : 0
                        }
                        className="h-2"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1.5 text-sm">
                        <span className="flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5 text-amber-500" />
                          E_end-use
                        </span>
                        <span className="font-medium">{formatNumber(data.corcResult.breakdown.endUseEmissionsTCO2e)} tCO₂e</span>
                      </div>
                      <Progress
                        value={
                          data.corcResult.eProjectTCO2e > 0
                            ? (data.corcResult.breakdown.endUseEmissionsTCO2e / data.corcResult.eProjectTCO2e) * 100
                            : 0
                        }
                        className="h-2"
                      />
                    </div>
                  </>
                )}

                {!data.corcResult && (
                  <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
                    Full emissions breakdown requires complete LCA data
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Navigation */}
          <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
            {[
              { label: 'Facility', href: '/facility', icon: Building2, color: 'slate' },
              { label: 'Production', href: '/production', icon: Factory, color: 'blue' },
              { label: 'Monitoring', href: '/monitoring', icon: Calculator, color: 'violet' },
              { label: 'CORC Registry', href: '/corc', icon: TreePine, color: 'emerald' },
            ].map((item) => {
              const Icon = item.icon;
              const colorClasses = {
                slate: 'bg-slate-500/10 text-slate-500 hover:border-slate-500/50',
                blue: 'bg-blue-500/10 text-blue-500 hover:border-blue-500/50',
                violet: 'bg-violet-500/10 text-violet-500 hover:border-violet-500/50',
                emerald: 'bg-emerald-500/10 text-emerald-500 hover:border-emerald-500/50',
              };
              return (
                <Link key={item.href} href={item.href} className="group">
                  <Card className={`border-[var(--border)] transition-colors ${colorClasses[item.color as keyof typeof colorClasses].split(' ').slice(2).join(' ')}`}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-8 w-8 rounded-md flex items-center justify-center ${colorClasses[item.color as keyof typeof colorClasses].split(' ').slice(0, 2).join(' ')}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium flex-1">{item.label}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
