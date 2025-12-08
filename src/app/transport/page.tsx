export const dynamic = 'force-dynamic';

import Link from 'next/link';
import db from '@/lib/db';
import { PageContainer, PageHeader } from '@/components/layout/page-container';
import { Button, Card, CardContent } from '@/components/ui';
import { TransportTable } from '@/components/transport';
import { Truck, Route, Fuel, Plus, MapPin } from 'lucide-react';

async function getTransportEvents() {
  return db.transportEvent.findMany({
    orderBy: { date: 'desc' },
    include: {
      evidence: { select: { id: true } },
      feedstockDelivery: {
        select: { id: true, date: true, feedstockType: true },
      },
      sequestrationEvent: {
        select: { id: true, finalDeliveryDate: true },
      },
    },
  });
}

async function getStats() {
  const events = await db.transportEvent.findMany({
    select: { distanceKm: true, fuelAmount: true, fuelType: true },
  });

  const totalDistance = events.reduce((sum, e) => sum + (e.distanceKm || 0), 0);
  const totalFuel = events.reduce((sum, e) => sum + (e.fuelAmount || 0), 0);
  const uniqueRoutes = await db.transportEvent.groupBy({
    by: ['originAddress', 'destinationAddress'],
  });

  return {
    count: events.length,
    totalDistance,
    totalFuel,
    uniqueRoutes: uniqueRoutes.length,
  };
}

export default async function TransportPage() {
  const [transportEvents, stats] = await Promise.all([getTransportEvents(), getStats()]);

  return (
    <PageContainer>
      <PageHeader
        title="Transport Events"
        description="Track transport logistics for feedstock and biochar"
        icon={Truck}
        iconColor="text-slate-500"
        action={
          <Link href="/transport/new">
            <Button size="sm" className="h-8">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Event
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card className="border-[var(--border)]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-md bg-slate-500/10 flex items-center justify-center">
                <Truck className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xl font-semibold leading-none">{stats.count}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[var(--border)]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-md bg-slate-500/10 flex items-center justify-center">
                <Route className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xl font-semibold leading-none">{stats.totalDistance.toFixed(0)}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">km total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[var(--border)]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-md bg-amber-500/10 flex items-center justify-center">
                <Fuel className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xl font-semibold leading-none">{stats.totalFuel.toFixed(0)}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">litres fuel</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[var(--border)] bg-violet-500/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-md bg-violet-500/10 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-violet-500" />
              </div>
              <div>
                <p className="text-xl font-semibold leading-none text-violet-600">{stats.uniqueRoutes}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">unique routes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <TransportTable transportEvents={transportEvents} />
    </PageContainer>
  );
}
