import db from '@/lib/db';
import { PageContainer, PageHeader } from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Progress,
  Badge,
} from '@/components/ui';
import { calculateLCA, kgToTonnes, formatNumber, EMISSION_FACTORS } from '@/lib/lca';

async function getLCAData() {
  const [productionBatches, transportEvents, energyUsages, sequestrationBatches] =
    await Promise.all([
      db.productionBatch.findMany({
        where: { status: 'complete' },
        select: {
          inputFeedstockWeightTonnes: true,
          outputBiocharWeightTonnes: true,
        },
      }),
      db.transportEvent.findMany({
        select: {
          distanceKm: true,
          fuelType: true,
        },
      }),
      db.energyUsage.findMany({
        select: {
          quantity: true,
          unit: true,
          energyType: true,
        },
      }),
      db.sequestrationBatch.findMany({
        select: {
          quantityTonnes: true,
        },
      }),
    ]);

  const totalFeedstock = productionBatches.reduce(
    (sum, b) => sum + b.inputFeedstockWeightTonnes,
    0
  );
  const totalBiochar = productionBatches.reduce(
    (sum, b) => sum + b.outputBiocharWeightTonnes,
    0
  );
  const totalSequestered = sequestrationBatches.reduce(
    (sum, sb) => sum + sb.quantityTonnes,
    0
  );

  const lca = calculateLCA({
    biocharTonnes: totalSequestered,
    transportEvents: transportEvents.map((t) => ({
      distanceKm: t.distanceKm,
      fuelType: t.fuelType || undefined,
    })),
    energyUsages: energyUsages.map((e) => ({
      quantity: e.quantity,
      unit: e.unit,
      energyType: e.energyType,
    })),
  });

  return {
    ...lca,
    totalFeedstockTonnes: totalFeedstock,
    totalBiocharTonnes: totalBiochar,
    totalSequesteredTonnes: totalSequestered,
  };
}

export default async function LCAPage() {
  const lca = await getLCAData();

  const hasData = lca.totalSequesteredTonnes > 0;

  return (
    <PageContainer>
      <PageHeader
        title="LCA & Verification"
        description="Life Cycle Assessment and carbon removal calculations"
      />

      {!hasData ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-[var(--muted-foreground)]">
              No completed sequestration events found. Complete the production and
              sequestration workflow to see LCA calculations.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
                  Gross Carbon Removal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber(kgToTonnes(lca.grossRemoval))} tCO2e
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Based on {formatNumber(lca.totalSequesteredTonnes)} t biochar
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
                  Total Emissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatNumber(kgToTonnes(lca.totalEmissions))} tCO2e
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Transport + Energy
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
                  Net Carbon Removal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatNumber(kgToTonnes(lca.netRemoval))} tCO2e
                </div>
                <Badge
                  variant={lca.carbonEfficiency >= 80 ? 'default' : 'secondary'}
                  className="mt-1"
                >
                  {formatNumber(lca.carbonEfficiency, 1)}% efficiency
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Emissions Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Emissions Breakdown</CardTitle>
                <CardDescription>
                  CO2e emissions by source
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Transport Emissions</span>
                    <span>{formatNumber(kgToTonnes(lca.transportEmissions))} tCO2e</span>
                  </div>
                  <Progress
                    value={
                      lca.totalEmissions > 0
                        ? (lca.transportEmissions / lca.totalEmissions) * 100
                        : 0
                    }
                  />
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {formatNumber(lca.totalTransportKm)} km total transport
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Energy Emissions</span>
                    <span>{formatNumber(kgToTonnes(lca.energyEmissions))} tCO2e</span>
                  </div>
                  <Progress
                    value={
                      lca.totalEmissions > 0
                        ? (lca.energyEmissions / lca.totalEmissions) * 100
                        : 0
                    }
                  />
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {formatNumber(lca.totalEnergyKWh)} kWh equivalent
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="font-medium">Emission Intensity</span>
                    <span>{formatNumber(lca.emissionIntensity)} kg CO2e/t biochar</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Carbon Flow */}
            <Card>
              <CardHeader>
                <CardTitle>Carbon Flow</CardTitle>
                <CardDescription>
                  From feedstock to sequestration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between py-3 border-b">
                  <span className="text-[var(--muted-foreground)]">
                    Feedstock Input
                  </span>
                  <span className="font-medium">
                    {formatNumber(lca.totalFeedstockTonnes)} tonnes
                  </span>
                </div>

                <div className="flex justify-between py-3 border-b">
                  <span className="text-[var(--muted-foreground)]">
                    Biochar Produced
                  </span>
                  <span className="font-medium">
                    {formatNumber(lca.totalBiocharTonnes)} tonnes
                  </span>
                </div>

                <div className="flex justify-between py-3 border-b">
                  <span className="text-[var(--muted-foreground)]">
                    Biochar Sequestered
                  </span>
                  <span className="font-medium">
                    {formatNumber(lca.totalSequesteredTonnes)} tonnes
                  </span>
                </div>

                <div className="flex justify-between py-3 border-b">
                  <span className="text-[var(--muted-foreground)]">
                    Carbon Content
                  </span>
                  <span className="font-medium">
                    {EMISSION_FACTORS.sequestration.carbonContentBiochar * 100}%
                  </span>
                </div>

                <div className="flex justify-between py-3 border-b">
                  <span className="text-[var(--muted-foreground)]">
                    Permanence Factor
                  </span>
                  <span className="font-medium">
                    {EMISSION_FACTORS.sequestration.permanenceMultiplier * 100}%
                  </span>
                </div>

                <div className="flex justify-between py-3 bg-green-50 px-3 -mx-3">
                  <span className="font-medium">Net CO2e Removed</span>
                  <span className="font-bold text-green-600">
                    {formatNumber(kgToTonnes(lca.netRemoval))} tonnes
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Emission Factors Reference */}
          <Card>
            <CardHeader>
              <CardTitle>Emission Factors Used</CardTitle>
              <CardDescription>
                Reference emission factors for LCA calculations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Transport (kg CO2e/km-tonne)</h4>
                  <div className="space-y-1 text-sm">
                    {Object.entries(EMISSION_FACTORS.transport).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-[var(--muted-foreground)] capitalize">
                          {key}
                        </span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Energy (kg CO2e/unit)</h4>
                  <div className="space-y-1 text-sm">
                    {Object.entries(EMISSION_FACTORS.energy).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-[var(--muted-foreground)] capitalize">
                          {key}
                        </span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
