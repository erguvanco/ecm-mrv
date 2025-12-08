export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  Leaf,
  Factory,
  Zap,
  Truck,
  ArrowDownToLine,
  Plus,
  Award,
  Scale,
  TreePine,
  Activity,
  TrendingUp,
  ChevronRight,
  Layers,
  Database,
  MapPin,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, OnboardingBanner } from '@/components/ui';
import type { OnboardingStep } from '@/components/ui';
import { DashboardChart, TimeFilter } from '@/components/dashboard';
import { getDateRange, type TimeRange } from '@/lib/utils/date-range';
import { DashboardMapWrapper } from '@/components/dashboard/dashboard-map-wrapper';
import db from '@/lib/db';
import { Suspense } from 'react';

async function getStats(range: TimeRange) {
  // Get date range for filtering
  const { start: startDate } = getDateRange(range);
  const dateFilter = startDate ? { gte: startDate } : undefined;
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
    bcuTransferredCount,
  ] = await Promise.all([
    db.feedstockDelivery.count({ where: dateFilter ? { date: dateFilter } : undefined }),
    db.productionBatch.count({ where: dateFilter ? { productionDate: dateFilter } : undefined }),
    db.productionBatch.count({ where: { status: 'complete', ...(dateFilter ? { productionDate: dateFilter } : {}) } }),
    db.energyUsage.count({ where: dateFilter ? { periodStart: dateFilter } : undefined }),
    db.transportEvent.count({ where: dateFilter ? { date: dateFilter } : undefined }),
    db.sequestrationEvent.count({ where: dateFilter ? { finalDeliveryDate: dateFilter } : undefined }),
    db.sequestrationEvent.count({ where: { status: 'complete', ...(dateFilter ? { finalDeliveryDate: dateFilter } : {}) } }),
    db.bCU.count({ where: dateFilter ? { issuanceDate: dateFilter } : undefined }),
    db.bCU.count({ where: { status: 'retired', ...(dateFilter ? { issuanceDate: dateFilter } : {}) } }),
    db.bCU.count({ where: { status: 'transferred', ...(dateFilter ? { issuanceDate: dateFilter } : {}) } }),
  ]);

  // Calculate total feedstock weight
  const feedstockDeliveries = await db.feedstockDelivery.findMany({
    where: dateFilter ? { date: dateFilter } : undefined,
    select: { weightTonnes: true },
  });
  const totalFeedstock = feedstockDeliveries.reduce(
    (sum, fd) => sum + (fd.weightTonnes || 0),
    0
  );

  // Calculate total biochar produced
  const productionBatches = await db.productionBatch.findMany({
    where: { status: 'complete', ...(dateFilter ? { productionDate: dateFilter } : {}) },
    select: { outputBiocharWeightTonnes: true },
  });
  const totalBiochar = productionBatches.reduce(
    (sum, batch) => sum + batch.outputBiocharWeightTonnes,
    0
  );

  // Calculate sequestered biochar (filtered by sequestration event date)
  const sequestrationEvents = await db.sequestrationEvent.findMany({
    where: dateFilter ? { finalDeliveryDate: dateFilter } : undefined,
    select: { id: true },
  });
  const sequestrationIds = sequestrationEvents.map(e => e.id);
  const sequestrationBatches = await db.sequestrationBatch.findMany({
    where: sequestrationIds.length > 0 ? { sequestrationId: { in: sequestrationIds } } : undefined,
    select: { quantityTonnes: true },
  });
  const totalSequestered = sequestrationBatches.reduce(
    (sum, sb) => sum + sb.quantityTonnes,
    0
  );

  // Calculate total energy usage (assuming kWh unit)
  const energyUsages = await db.energyUsage.findMany({
    where: dateFilter ? { periodStart: dateFilter } : undefined,
    select: { quantity: true },
  });
  const totalEnergy = energyUsages.reduce(
    (sum, eu) => sum + (eu.quantity || 0),
    0
  );

  // Calculate total transport distance
  const transportEventsData = await db.transportEvent.findMany({
    where: dateFilter ? { date: dateFilter } : undefined,
    select: { distanceKm: true },
  });
  const totalDistance = transportEventsData.reduce(
    (sum, te) => sum + (te.distanceKm || 0),
    0
  );

  // Calculate estimated CO2e removed (simplified: 2.5 tCO2e per tonne biochar)
  const estimatedCO2e = totalSequestered * 2.5;

  // Get recent activity (filtered by date range)
  const [recentFeedstock, recentProduction, recentSequestration, recentBCU] = await Promise.all([
    db.feedstockDelivery.findMany({
      take: 3,
      where: dateFilter ? { date: dateFilter } : undefined,
      orderBy: { createdAt: 'desc' },
      select: { id: true, feedstockType: true, weightTonnes: true, createdAt: true },
    }),
    db.productionBatch.findMany({
      take: 3,
      where: dateFilter ? { productionDate: dateFilter } : undefined,
      orderBy: { createdAt: 'desc' },
      select: { id: true, serialNumber: true, status: true, outputBiocharWeightTonnes: true, createdAt: true },
    }),
    db.sequestrationEvent.findMany({
      take: 3,
      where: dateFilter ? { finalDeliveryDate: dateFilter } : undefined,
      orderBy: { createdAt: 'desc' },
      select: { id: true, sequestrationType: true, status: true, createdAt: true },
    }),
    db.bCU.findMany({
      take: 3,
      where: dateFilter ? { issuanceDate: dateFilter } : undefined,
      orderBy: { issuanceDate: 'desc' },
      select: { id: true, registrySerialNumber: true, quantityTonnesCO2e: true, status: true, issuanceDate: true },
    }),
  ]);

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
    bcuTransferredCount,
    totalFeedstock,
    totalBiochar,
    totalSequestered,
    totalEnergy,
    totalDistance,
    estimatedCO2e,
    recentFeedstock,
    recentProduction,
    recentSequestration,
    recentBCU,
  };
}

function formatFeedstockType(type: string): string {
  return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

interface PageProps {
  searchParams: Promise<{ range?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const range = (params.range as TimeRange) || 'all';
  const stats = await getStats(range);

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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'complete': return 'default';
      case 'in_progress': return 'outline';
      case 'issued': return 'default';
      case 'retired': return 'secondary';
      default: return 'outline';
    }
  };

  // Combine recent activity into a single timeline
  const recentActivity = [
    ...stats.recentFeedstock.map(item => ({
      type: 'feedstock' as const,
      id: item.id,
      title: formatFeedstockType(item.feedstockType),
      subtitle: `${(item.weightTonnes || 0).toFixed(1)}t delivered`,
      createdAt: item.createdAt,
      href: `/feedstock/${item.id}`,
      icon: Leaf,
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-500/10',
    })),
    ...stats.recentProduction.map(item => ({
      type: 'production' as const,
      id: item.id,
      title: `Batch #${item.serialNumber}`,
      subtitle: `${item.outputBiocharWeightTonnes.toFixed(1)}t biochar`,
      status: item.status,
      createdAt: item.createdAt,
      href: `/production/${item.id}`,
      icon: Factory,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-500/10',
    })),
    ...stats.recentSequestration.map(item => ({
      type: 'sequestration' as const,
      id: item.id,
      title: formatFeedstockType(item.sequestrationType),
      subtitle: 'Sequestration event',
      status: item.status,
      createdAt: item.createdAt,
      href: `/sequestration/${item.id}`,
      icon: ArrowDownToLine,
      iconColor: 'text-violet-500',
      iconBg: 'bg-violet-500/10',
    })),
    ...stats.recentBCU.map(item => ({
      type: 'bcu' as const,
      id: item.id,
      title: item.registrySerialNumber,
      subtitle: `${item.quantityTonnesCO2e.toFixed(1)} tCO₂e`,
      status: item.status,
      createdAt: item.issuanceDate,
      href: `/registry/${item.id}`,
      icon: Award,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-500/10',
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-logo text-2xl tracking-tight">Dashboard</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            Biochar carbon removal overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <TimeFilter defaultValue={range} />
          <div className="flex gap-2">
            <Link href="/feedstock/new">
              <Button size="sm" variant="outline" className="h-8">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Feedstock
              </Button>
            </Link>
            <Link href="/production/new">
              <Button size="sm" variant="outline" className="h-8">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Production
              </Button>
            </Link>
            <Link href="/registry/issue">
              <Button size="sm" className="h-8">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Issue BCU
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Onboarding Banner for new users */}
      {isNewUser && (
        <OnboardingBanner
          title="Welcome to ECM MRV"
          description="Track your biochar carbon removal journey in 4 simple steps"
          steps={onboardingSteps}
        />
      )}

      {/* Hero Metrics Row */}
      <div className="grid gap-3 md:grid-cols-3">
        {/* CO2 Impact - Hero Card */}
        <Card className="md:col-span-1 bg-gradient-to-br from-emerald-500/5 via-emerald-500/10 to-teal-500/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Carbon Removed</p>
                <p className="text-3xl font-bold mt-1 tracking-tight">{stats.estimatedCO2e.toFixed(1)}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">tonnes CO₂e sequestered</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <TreePine className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-emerald-500/20">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--muted-foreground)]">From {stats.totalSequestered.toFixed(1)}t biochar</span>
                <Link href="/lca" className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5">
                  View LCA <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Production Stats */}
        <Card className="md:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--muted-foreground)]">Biochar Produced</p>
                <p className="text-3xl font-bold mt-1 tracking-tight">{stats.totalBiochar.toFixed(1)}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">tonnes from {stats.productionCompleteCount} batches</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Scale className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[var(--border)]">
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <Leaf className="h-3 w-3 text-emerald-500" />
                  <span className="text-[var(--muted-foreground)]">{stats.totalFeedstock.toFixed(1)}t input</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-blue-500" />
                  <span className="text-[var(--muted-foreground)]">{stats.totalFeedstock > 0 ? ((stats.totalBiochar / stats.totalFeedstock) * 100).toFixed(0) : 0}% yield</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BCU Stats */}
        <Card className="md:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-[var(--muted-foreground)]">Carbon Credits</p>
                <p className="text-3xl font-bold mt-1 tracking-tight">{stats.bcuCount}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">BCUs issued</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Award className="h-5 w-5 text-amber-500" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[var(--border)]">
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="default" className="text-[10px] h-5">{stats.bcuCount - stats.bcuRetiredCount - stats.bcuTransferredCount} active</Badge>
                <Badge variant="secondary" className="text-[10px] h-5">{stats.bcuRetiredCount} retired</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
        <Link href="/feedstock" className="group">
          <Card className="border-[var(--border)] hover:border-emerald-500/50 transition-colors">
            <CardContent className="p-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-md bg-emerald-500/10 flex items-center justify-center">
                  <Leaf className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xl font-semibold leading-none">{stats.feedstockCount}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">Feedstock</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/production" className="group">
          <Card className="border-[var(--border)] hover:border-blue-500/50 transition-colors">
            <CardContent className="p-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center">
                  <Factory className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xl font-semibold leading-none">{stats.productionCount}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">Production</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/energy" className="group">
          <Card className="border-[var(--border)] hover:border-amber-500/50 transition-colors">
            <CardContent className="p-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-md bg-amber-500/10 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-xl font-semibold leading-none">{(stats.totalEnergy / 1000).toFixed(1)}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">MWh energy</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/transport" className="group">
          <Card className="border-[var(--border)] hover:border-slate-500/50 transition-colors">
            <CardContent className="p-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-md bg-slate-500/10 flex items-center justify-center">
                  <Truck className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xl font-semibold leading-none">{stats.totalDistance.toFixed(0)}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">km transport</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Content Grid - Chart and Activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Chart - spans 2 columns */}
        <div className="lg:col-span-2">
          <DashboardChart />
        </div>

        {/* Recent Activity - Timeline Style */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader className="pb-2 pt-4 px-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5" />
                Recent Activity
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 flex-1 overflow-auto">
            {recentActivity.length > 0 ? (
              <div className="space-y-0.5">
                {recentActivity.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={`${item.type}-${item.id}`}
                      href={item.href}
                      className="flex items-center gap-2.5 p-2 -mx-2 rounded-md hover:bg-[var(--muted)] transition-colors group"
                    >
                      <div className={`h-7 w-7 rounded-md ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-3.5 w-3.5 ${item.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          {'status' in item && item.status && (
                            <Badge variant={getStatusVariant(item.status)} className="text-[9px] h-4 px-1.5 flex-shrink-0">
                              {item.status}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-[var(--muted-foreground)] truncate">
                          {item.subtitle} · {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-[var(--muted-foreground)]">
                <Activity className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Map and Quick Navigation */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Map - spans 2 columns */}
        <div className="lg:col-span-2">
          <DashboardMapWrapper />
        </div>

        {/* Quick Navigation - Compact */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
              Quick Navigation
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-1">
              {[
                { label: 'Feedstock', href: '/feedstock', icon: Leaf, count: stats.feedstockCount, color: 'emerald' },
                { label: 'Production', href: '/production', icon: Factory, count: stats.productionCount, color: 'blue' },
                { label: 'Sequestration', href: '/sequestration', icon: ArrowDownToLine, count: stats.sequestrationCount, color: 'violet' },
                { label: 'Registry', href: '/registry', icon: Award, count: stats.bcuCount, color: 'amber' },
              ].map((item) => {
                const Icon = item.icon;
                const colorClasses = {
                  emerald: 'bg-emerald-500/10 text-emerald-500',
                  blue: 'bg-blue-500/10 text-blue-500',
                  violet: 'bg-violet-500/10 text-violet-500',
                  amber: 'bg-amber-500/10 text-amber-500',
                };
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 p-2 rounded-md hover:bg-[var(--muted)] transition-colors group"
                  >
                    <div className={`h-7 w-7 rounded-md flex items-center justify-center ${colorClasses[item.color as keyof typeof colorClasses]}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm font-medium flex-1">{item.label}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">{item.count}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                );
              })}
            </div>

            {/* Additional Links */}
            <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-0.5">
              {[
                { label: 'Energy', href: '/energy', icon: Zap, count: stats.energyCount },
                { label: 'Transport', href: '/transport', icon: Truck, count: stats.transportCount },
                { label: 'Network Map', href: '/network', icon: MapPin },
                { label: 'Emission Factors', href: '/datasets', icon: Database },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 px-2 py-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="flex-1">{item.label}</span>
                    {'count' in item && <span>{item.count}</span>}
                  </Link>
                );
              })}
            </div>

            {/* LCA Link */}
            <div className="mt-3">
              <Link
                href="/lca"
                className="flex items-center gap-2.5 p-2.5 rounded-md bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 hover:border-violet-500/40 transition-colors group"
              >
                <div className="h-7 w-7 rounded-md bg-violet-500/10 flex items-center justify-center">
                  <TrendingUp className="h-3.5 w-3.5 text-violet-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">LCA Calculator</p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-violet-500 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
