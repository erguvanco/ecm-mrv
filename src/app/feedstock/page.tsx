export const dynamic = 'force-dynamic';

import Link from 'next/link';
import db from '@/lib/db';
import { PageContainer, PageHeader } from '@/components/layout/page-container';
import { Button, Card, CardContent } from '@/components/ui';
import { FeedstockTable } from '@/components/feedstock';
import { WorkflowNav } from '@/components/workflow-nav';
import { Leaf, Scale, Truck, Plus } from 'lucide-react';

async function getFeedstocks() {
  return db.feedstockDelivery.findMany({
    orderBy: { date: 'desc' },
    select: {
      id: true,
      serialNumber: true,
      date: true,
      feedstockType: true,
      weightTonnes: true,
      volumeM3: true,
      deliveryDistanceKm: true,
      vehicleId: true,
      sourceAddress: true,
      updatedAt: true,
      evidence: { select: { id: true } },
      _count: {
        select: {
          productionBatches: true,
          transportEvents: true,
        },
      },
    },
  });
}

async function getStats() {
  const feedstocks = await db.feedstockDelivery.findMany({
    select: { weightTonnes: true, deliveryDistanceKm: true },
  });
  const totalWeight = feedstocks.reduce((sum, f) => sum + (f.weightTonnes || 0), 0);
  const totalDistance = feedstocks.reduce((sum, f) => sum + (f.deliveryDistanceKm || 0), 0);
  const linkedToProduction = await db.feedstockDelivery.count({
    where: { productionBatches: { some: {} } },
  });

  return {
    count: feedstocks.length,
    totalWeight,
    totalDistance,
    linkedToProduction,
  };
}

export default async function FeedstockPage() {
  const [feedstocks, stats] = await Promise.all([getFeedstocks(), getStats()]);

  return (
    <PageContainer>
      <WorkflowNav currentPage="feedstock" />

      <PageHeader
        title="Feedstock Deliveries"
        description="Track incoming biomass for biochar production"
        icon={Leaf}
        iconColor="text-emerald-500"
        action={
          <Link href="/feedstock/new">
            <Button size="sm" className="h-8">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Delivery
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card className="border-[var(--border)]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-md bg-emerald-500/10 flex items-center justify-center">
                <Leaf className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xl font-semibold leading-none">{stats.count}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">Deliveries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[var(--border)]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-md bg-emerald-500/10 flex items-center justify-center">
                <Scale className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xl font-semibold leading-none">{stats.totalWeight.toFixed(1)}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">tonnes total</p>
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
                <p className="text-xl font-semibold leading-none">{stats.totalDistance.toFixed(0)}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">km travelled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[var(--border)] bg-blue-500/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center">
                <Leaf className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xl font-semibold leading-none text-blue-600">{stats.linkedToProduction}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">in production</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <FeedstockTable feedstocks={feedstocks} />
    </PageContainer>
  );
}
