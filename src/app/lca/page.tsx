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
import { calculateLCA, kgToTonnes, formatNumber, EMISSION_FACTORS } from '@/lib/lca';
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
  Percent,
  Info,
} from 'lucide-react';

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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-logo text-2xl tracking-tight">LCA Calculator</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            Life Cycle Assessment & carbon removal verification
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/datasets">
            <Button size="sm" variant="outline" className="h-8">
              <Info className="h-3.5 w-3.5 mr-1.5" />
              Emission Factors
            </Button>
          </Link>
          <Link href="/">
            <Button size="sm" variant="outline" className="h-8">
              <ChevronRight className="h-3.5 w-3.5 mr-1.5 rotate-180" />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {!hasData ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <TreePine className="h-12 w-12 mx-auto mb-4 text-[var(--muted-foreground)] opacity-50" />
            <p className="text-[var(--muted-foreground)] mb-4">
              No completed sequestration events found. Complete the production and
              sequestration workflow to see LCA calculations.
            </p>
            <Link href="/sequestration/new">
              <Button size="sm">
                <ArrowDownToLine className="h-3.5 w-3.5 mr-1.5" />
                Create Sequestration Event
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Hero Metrics Row */}
          <div className="grid gap-3 md:grid-cols-3">
            {/* Net Carbon Removal - Hero Card */}
            <Card className="md:col-span-1 bg-gradient-to-br from-emerald-500/5 via-emerald-500/10 to-teal-500/5 border-emerald-500/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Net Carbon Removal</p>
                    <p className="text-3xl font-bold mt-1 tracking-tight">{formatNumber(kgToTonnes(lca.netRemoval))}</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">tonnes CO₂e verified</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <TreePine className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-emerald-500/20">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--muted-foreground)]">
                      <Badge variant={lca.carbonEfficiency >= 80 ? 'default' : 'secondary'} className="text-[10px] h-5">
                        {formatNumber(lca.carbonEfficiency, 1)}% efficiency
                      </Badge>
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                      Carbon negative
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gross Removal */}
            <Card className="md:col-span-1">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-[var(--muted-foreground)]">Gross Removal</p>
                    <p className="text-3xl font-bold mt-1 tracking-tight text-green-600">{formatNumber(kgToTonnes(lca.grossRemoval))}</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">tonnes CO₂e potential</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-[var(--border)]">
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <Scale className="h-3 w-3 text-green-500" />
                      <span className="text-[var(--muted-foreground)]">{formatNumber(lca.totalSequesteredTonnes)}t biochar</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Percent className="h-3 w-3 text-green-500" />
                      <span className="text-[var(--muted-foreground)]">{EMISSION_FACTORS.sequestration.carbonContentBiochar * 100}% C</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Emissions */}
            <Card className="md:col-span-1">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-[var(--muted-foreground)]">Total Emissions</p>
                    <p className="text-3xl font-bold mt-1 tracking-tight text-red-600">{formatNumber(kgToTonnes(lca.totalEmissions))}</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">tonnes CO₂e emitted</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-red-500" />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-[var(--border)]">
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" className="text-[10px] h-5">Transport + Energy</Badge>
                    <span className="text-[var(--muted-foreground)]">{formatNumber(lca.emissionIntensity)} kg/t</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Metrics */}
          <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
            <Card className="border-[var(--border)]">
              <CardContent className="p-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-md bg-emerald-500/10 flex items-center justify-center">
                    <Leaf className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold leading-none">{formatNumber(lca.totalFeedstockTonnes)}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">t feedstock</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-[var(--border)]">
              <CardContent className="p-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center">
                    <Factory className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold leading-none">{formatNumber(lca.totalBiocharTonnes)}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">t biochar</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-[var(--border)]">
              <CardContent className="p-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-md bg-slate-500/10 flex items-center justify-center">
                    <Truck className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold leading-none">{formatNumber(lca.totalTransportKm)}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">km transport</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-[var(--border)]">
              <CardContent className="p-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-md bg-amber-500/10 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold leading-none">{formatNumber(lca.totalEnergyKWh / 1000, 1)}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">MWh energy</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Emissions Breakdown */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium">Emissions Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-4">
                <div>
                  <div className="flex justify-between mb-1.5 text-sm">
                    <span className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-slate-500" />
                      Transport
                    </span>
                    <span className="font-medium">{formatNumber(kgToTonnes(lca.transportEmissions))} tCO₂e</span>
                  </div>
                  <Progress
                    value={
                      lca.totalEmissions > 0
                        ? (lca.transportEmissions / lca.totalEmissions) * 100
                        : 0
                    }
                    className="h-2"
                  />
                  <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
                    {formatNumber(lca.totalTransportKm)} km @ avg {formatNumber(EMISSION_FACTORS.transport.diesel, 3)} kg CO₂e/km-t
                  </p>
                </div>

                <div>
                  <div className="flex justify-between mb-1.5 text-sm">
                    <span className="flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      Energy
                    </span>
                    <span className="font-medium">{formatNumber(kgToTonnes(lca.energyEmissions))} tCO₂e</span>
                  </div>
                  <Progress
                    value={
                      lca.totalEmissions > 0
                        ? (lca.energyEmissions / lca.totalEmissions) * 100
                        : 0
                    }
                    className="h-2"
                  />
                  <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
                    {formatNumber(lca.totalEnergyKWh)} kWh @ {formatNumber(EMISSION_FACTORS.energy.electricity, 3)} kg CO₂e/kWh
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--border)]">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted-foreground)]">Emission Intensity</span>
                    <span className="font-medium">{formatNumber(lca.emissionIntensity)} kg CO₂e/t biochar</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Carbon Flow */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium">Carbon Flow</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-0">
                  <div className="flex justify-between py-2.5 border-b border-[var(--border)] text-sm">
                    <span className="text-[var(--muted-foreground)] flex items-center gap-1.5">
                      <Leaf className="h-3.5 w-3.5 text-emerald-500" />
                      Feedstock Input
                    </span>
                    <span className="font-medium">{formatNumber(lca.totalFeedstockTonnes)} t</span>
                  </div>

                  <div className="flex justify-between py-2.5 border-b border-[var(--border)] text-sm">
                    <span className="text-[var(--muted-foreground)] flex items-center gap-1.5">
                      <Factory className="h-3.5 w-3.5 text-blue-500" />
                      Biochar Produced
                    </span>
                    <span className="font-medium">{formatNumber(lca.totalBiocharTonnes)} t</span>
                  </div>

                  <div className="flex justify-between py-2.5 border-b border-[var(--border)] text-sm">
                    <span className="text-[var(--muted-foreground)] flex items-center gap-1.5">
                      <ArrowDownToLine className="h-3.5 w-3.5 text-violet-500" />
                      Biochar Sequestered
                    </span>
                    <span className="font-medium">{formatNumber(lca.totalSequesteredTonnes)} t</span>
                  </div>

                  <div className="flex justify-between py-2.5 border-b border-[var(--border)] text-sm">
                    <span className="text-[var(--muted-foreground)]">Carbon Content</span>
                    <span className="font-medium">{EMISSION_FACTORS.sequestration.carbonContentBiochar * 100}%</span>
                  </div>

                  <div className="flex justify-between py-2.5 border-b border-[var(--border)] text-sm">
                    <span className="text-[var(--muted-foreground)]">Permanence Factor</span>
                    <span className="font-medium">{EMISSION_FACTORS.sequestration.permanenceMultiplier * 100}%</span>
                  </div>

                  <div className="flex justify-between py-2.5 bg-emerald-500/10 px-3 -mx-3 rounded text-sm mt-2">
                    <span className="font-medium flex items-center gap-1.5">
                      <TreePine className="h-3.5 w-3.5 text-emerald-600" />
                      Net CO₂e Removed
                    </span>
                    <span className="font-bold text-emerald-600">
                      {formatNumber(kgToTonnes(lca.netRemoval))} t
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Navigation */}
          <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
            {[
              { label: 'Feedstock', href: '/feedstock', icon: Leaf, color: 'emerald' },
              { label: 'Production', href: '/production', icon: Factory, color: 'blue' },
              { label: 'Sequestration', href: '/sequestration', icon: ArrowDownToLine, color: 'violet' },
              { label: 'Registry', href: '/registry', icon: TreePine, color: 'amber' },
            ].map((item) => {
              const Icon = item.icon;
              const colorClasses = {
                emerald: 'bg-emerald-500/10 text-emerald-500 hover:border-emerald-500/50',
                blue: 'bg-blue-500/10 text-blue-500 hover:border-blue-500/50',
                violet: 'bg-violet-500/10 text-violet-500 hover:border-violet-500/50',
                amber: 'bg-amber-500/10 text-amber-500 hover:border-amber-500/50',
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
