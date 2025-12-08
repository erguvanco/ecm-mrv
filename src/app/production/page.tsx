export const dynamic = 'force-dynamic';

import Link from 'next/link';
import db from '@/lib/db';
import { PageContainer, PageHeader } from '@/components/layout/page-container';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { ProductionTable } from '@/components/production';
import { WorkflowNav } from '@/components/workflow-nav';
import { Factory, Scale, TrendingUp, Plus, CheckCircle } from 'lucide-react';

async function getProductionBatches() {
  return db.productionBatch.findMany({
    orderBy: { productionDate: 'desc' },
    include: {
      evidence: { select: { id: true } },
      feedstockDelivery: {
        select: { id: true, serialNumber: true, date: true, feedstockType: true },
      },
      _count: {
        select: {
          sequestrationBatches: true,
          bcuBatches: true,
        },
      },
    },
  });
}

async function getStats() {
  const [total, complete, batches] = await Promise.all([
    db.productionBatch.count(),
    db.productionBatch.count({ where: { status: 'complete' } }),
    db.productionBatch.findMany({
      where: { status: 'complete' },
      select: { inputFeedstockWeightTonnes: true, outputBiocharWeightTonnes: true },
    }),
  ]);

  const totalInput = batches.reduce((sum, b) => sum + b.inputFeedstockWeightTonnes, 0);
  const totalOutput = batches.reduce((sum, b) => sum + b.outputBiocharWeightTonnes, 0);
  const avgYield = totalInput > 0 ? (totalOutput / totalInput) * 100 : 0;

  return { total, complete, totalInput, totalOutput, avgYield };
}

export default async function ProductionPage() {
  const [batches, stats] = await Promise.all([getProductionBatches(), getStats()]);

  return (
    <PageContainer>
      <WorkflowNav currentPage="production" />

      <PageHeader
        title="Production Batches"
        description="Track biochar production with step-by-step workflow"
        icon={Factory}
        iconColor="text-blue-500"
        action={
          <Link href="/production/new">
            <Button size="sm" className="h-8">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Batch
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card className="border-[var(--border)]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center">
                <Factory className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xl font-semibold leading-none">{stats.total}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">Total batches</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[var(--border)]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-md bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xl font-semibold leading-none">{stats.complete}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[var(--border)]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center">
                <Scale className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xl font-semibold leading-none">{stats.totalOutput.toFixed(1)}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">tonnes biochar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[var(--border)] bg-emerald-500/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-md bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xl font-semibold leading-none text-emerald-600">{stats.avgYield.toFixed(0)}%</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">avg yield</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ProductionTable batches={batches} />
    </PageContainer>
  );
}
