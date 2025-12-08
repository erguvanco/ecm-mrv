export const dynamic = 'force-dynamic';

import Link from 'next/link';
import {
  Leaf,
  Factory,
  Zap,
  Truck,
  ArrowDownToLine,
  Plus,
  ArrowRight,
  Award,
  Scale,
  TreePine,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OnboardingBanner, WorkflowIndicator } from '@/components/ui';
import type { OnboardingStep, WorkflowStep } from '@/components/ui';
import { DashboardChart } from '@/components/dashboard';
import { DashboardMapWrapper } from '@/components/dashboard/dashboard-map-wrapper';
import db from '@/lib/db';

async function getStats() {
  const [
    feedstockCount,
    productionCount,
    productionCompleteCount,
    energyCount,
    transportCount,
    sequestrationCount,
    sequestrationCompleteCount,
    bcuCount,
    bcuRetiredCount,
  ] = await Promise.all([
    db.feedstockDelivery.count(),
    db.productionBatch.count(),
    db.productionBatch.count({ where: { status: 'complete' } }),
    db.energyUsage.count(),
    db.transportEvent.count(),
    db.sequestrationEvent.count(),
    db.sequestrationEvent.count({ where: { status: 'complete' } }),
    db.bCU.count(),
    db.bCU.count({ where: { status: 'retired' } }),
  ]);

  // Calculate total biochar produced
  const productionBatches = await db.productionBatch.findMany({
    where: { status: 'complete' },
    select: { outputBiocharWeightTonnes: true },
  });
  const totalBiochar = productionBatches.reduce(
    (sum, batch) => sum + batch.outputBiocharWeightTonnes,
    0
  );

  // Calculate sequestered biochar
  const sequestrationBatches = await db.sequestrationBatch.findMany({
    select: { quantityTonnes: true },
  });
  const totalSequestered = sequestrationBatches.reduce(
    (sum, sb) => sum + sb.quantityTonnes,
    0
  );

  // Calculate estimated CO2e removed (simplified: 2.5 tCO2e per tonne biochar)
  const estimatedCO2e = totalSequestered * 2.5;

  return {
    feedstockCount,
    productionCount,
    productionCompleteCount,
    energyCount,
    transportCount,
    sequestrationCount,
    sequestrationCompleteCount,
    bcuCount,
    bcuRetiredCount,
    totalBiochar,
    totalSequestered,
    estimatedCO2e,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const metrics: { label: string; value: string | number; icon: LucideIcon; description?: string; highlight?: boolean }[] = [
    {
      label: 'Feedstock Deliveries',
      value: stats.feedstockCount,
      icon: Leaf,
      description: 'Total incoming biomass'
    },
    {
      label: 'Production Batches',
      value: stats.productionCount,
      icon: Factory,
      description: `${stats.productionCompleteCount} completed`
    },
    {
      label: 'Biochar Produced',
      value: `${stats.totalBiochar.toFixed(1)}t`,
      icon: Scale,
      description: 'Total output weight'
    },
    {
      label: 'CO₂e Sequestered',
      value: `${stats.estimatedCO2e.toFixed(1)}t`,
      icon: TreePine,
      description: 'Estimated carbon removal',
      highlight: true
    },
  ];

  const modules = [
    { id: 'feedstock', label: 'Feedstock', icon: Leaf, count: stats.feedstockCount, href: '/feedstock' },
    { id: 'production', label: 'Production', icon: Factory, count: stats.productionCount, href: '/production' },
    { id: 'energy', label: 'Energy', icon: Zap, count: stats.energyCount, href: '/energy' },
    { id: 'transport', label: 'Transport', icon: Truck, count: stats.transportCount, href: '/transport' },
    { id: 'sequestration', label: 'Sequestration', icon: ArrowDownToLine, count: stats.sequestrationCount, href: '/sequestration' },
    { id: 'registry', label: 'Registry', icon: Award, count: stats.bcuCount, href: '/registry' },
  ];

  // Check if user is new (no data)
  const isNewUser =
    stats.feedstockCount === 0 &&
    stats.productionCount === 0 &&
    stats.sequestrationCount === 0;

  // Onboarding steps
  const onboardingSteps: OnboardingStep[] = [
    { label: 'Add feedstock delivery', href: '/feedstock/new', completed: stats.feedstockCount > 0 },
    { label: 'Create production batch', href: '/production/new', completed: stats.productionCompleteCount > 0 },
    { label: 'Record sequestration event', href: '/sequestration/new', completed: stats.sequestrationCompleteCount > 0 },
    { label: 'Issue BCU', href: '/registry/issue', completed: stats.bcuCount > 0 },
  ];

  // Workflow steps for indicator
  const workflowSteps: WorkflowStep[] = [
    {
      id: 'feedstock',
      label: 'Feedstock',
      href: '/feedstock',
      status: stats.feedstockCount > 0 ? 'complete' : 'available',
      count: stats.feedstockCount,
    },
    {
      id: 'production',
      label: 'Production',
      href: '/production',
      status: stats.productionCompleteCount > 0 ? 'complete' : stats.feedstockCount > 0 ? 'available' : 'pending',
      count: stats.productionCount,
    },
    {
      id: 'sequestration',
      label: 'Sequestration',
      href: '/sequestration',
      status: stats.sequestrationCompleteCount > 0 ? 'complete' : stats.productionCompleteCount > 0 ? 'available' : 'pending',
      count: stats.sequestrationCount,
    },
    {
      id: 'registry',
      label: 'Registry',
      href: '/registry',
      status: stats.bcuCount > 0 ? 'complete' : stats.sequestrationCompleteCount > 0 ? 'available' : 'pending',
      count: stats.bcuCount,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-logo text-3xl tracking-tight">Dashboard</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Biochar carbon removal tracking
        </p>
      </div>

      {/* Onboarding Banner for new users */}
      {isNewUser && (
        <OnboardingBanner
          title="Welcome to ECM MRV"
          description="Track your biochar carbon removal journey in 4 simple steps"
          steps={onboardingSteps}
        />
      )}

      {/* Workflow Progress */}
      <div>
        <h2 className="text-sm font-medium mb-3 text-[var(--muted-foreground)]">
          Workflow Progress
        </h2>
        <WorkflowIndicator steps={workflowSteps} />
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card
              key={metric.label}
              className={`border-[var(--border)] transition-all hover:shadow-md ${
                metric.highlight ? 'bg-green-50 border-green-200' : ''
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
                      {metric.label}
                    </p>
                    <p className={`text-2xl font-semibold mt-1 ${metric.highlight ? 'text-green-700' : ''}`}>
                      {metric.value}
                    </p>
                    {metric.description && (
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">
                        {metric.description}
                      </p>
                    )}
                  </div>
                  <div className={`p-2 ${metric.highlight ? 'bg-green-100' : 'bg-[var(--muted)]'}`}>
                    <Icon className={`h-5 w-5 ${metric.highlight ? 'text-green-600' : 'text-[var(--muted-foreground)]'}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions & Modules */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
            <p className="text-xs text-[var(--muted-foreground)]">
              Follow the biochar lifecycle: Feedstock → Production → Sequestration
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/feedstock/new">
              <Button variant="outline" className="w-full justify-start h-10">
                <span className="flex items-center justify-center w-5 h-5 bg-[var(--muted)] text-xs font-medium mr-3">
                  1
                </span>
                <Plus className="h-4 w-4 mr-2" />
                New Feedstock Delivery
              </Button>
            </Link>
            <Link href="/production/new">
              <Button variant="outline" className="w-full justify-start h-10">
                <span className="flex items-center justify-center w-5 h-5 bg-[var(--muted)] text-xs font-medium mr-3">
                  2
                </span>
                <Plus className="h-4 w-4 mr-2" />
                New Production Batch
              </Button>
            </Link>
            <Link href="/sequestration/new">
              <Button variant="outline" className="w-full justify-start h-10">
                <span className="flex items-center justify-center w-5 h-5 bg-[var(--muted)] text-xs font-medium mr-3">
                  3
                </span>
                <Plus className="h-4 w-4 mr-2" />
                New Sequestration Event
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Modules */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium">Modules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <Link
                  key={module.id}
                  href={module.href}
                  className="flex items-center justify-between py-2.5 px-3 -mx-3 rounded hover:bg-[var(--muted)] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-[var(--muted-foreground)]" />
                    <span className="text-sm">{module.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {module.count}
                    </span>
                    <ArrowRight className="h-4 w-4 text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <DashboardChart />

      {/* Supply Network Map */}
      <DashboardMapWrapper />
    </div>
  );
}
