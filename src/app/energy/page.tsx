export const dynamic = 'force-dynamic';

import Link from 'next/link';
import db from '@/lib/db';
import { PageContainer, PageHeader } from '@/components/layout/page-container';
import { Button, Card, CardContent } from '@/components/ui';
import { EnergyTable } from '@/components/energy';
import { Zap, Factory, Gauge, Plus, Fuel } from 'lucide-react';

async function getEnergyUsages() {
  return db.energyUsage.findMany({
    orderBy: { periodStart: 'desc' },
    include: {
      evidence: { select: { id: true } },
      productionBatch: {
        select: { id: true, productionDate: true },
      },
    },
  });
}

async function getStats() {
  const records = await db.energyUsage.findMany({
    select: { quantity: true, unit: true, scope: true, energyType: true },
  });

  const totalKwh = records
    .filter((r) => r.unit === 'kWh')
    .reduce((sum, r) => sum + (r.quantity || 0), 0);
  const totalLitres = records
    .filter((r) => r.unit === 'litres')
    .reduce((sum, r) => sum + (r.quantity || 0), 0);
  const productionRecords = records.filter((r) => r.scope === 'production').length;

  return {
    count: records.length,
    totalKwh,
    totalLitres,
    productionRecords,
  };
}

export default async function EnergyPage() {
  const [energyUsages, stats] = await Promise.all([getEnergyUsages(), getStats()]);

  return (
    <PageContainer>
      <PageHeader
        title="Energy Usage"
        description="Track energy consumption across production and operations"
        icon={Zap}
        iconColor="text-amber-500"
        action={
          <Link href="/energy/new">
            <Button size="sm" className="h-8">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Record
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card className="border-[var(--border)]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-md bg-amber-500/10 flex items-center justify-center">
                <Zap className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xl font-semibold leading-none">{stats.count}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">Records</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[var(--border)]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-md bg-amber-500/10 flex items-center justify-center">
                <Gauge className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xl font-semibold leading-none">{(stats.totalKwh / 1000).toFixed(1)}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">MWh electricity</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[var(--border)]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-md bg-slate-500/10 flex items-center justify-center">
                <Fuel className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xl font-semibold leading-none">{stats.totalLitres.toFixed(0)}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">litres fuel</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[var(--border)] bg-blue-500/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center">
                <Factory className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xl font-semibold leading-none text-blue-600">{stats.productionRecords}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">for production</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <EnergyTable energyUsages={energyUsages} />
    </PageContainer>
  );
}
