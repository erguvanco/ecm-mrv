export const dynamic = 'force-dynamic';

import Link from 'next/link';
import db from '@/lib/db';
import { PageContainer, PageHeader } from '@/components/layout/page-container';
import { Button, Card, CardContent } from '@/components/ui';
import { SequestrationTable } from '@/components/sequestration';
import { WorkflowNav } from '@/components/workflow-nav';
import { ArrowDownToLine, Scale, Award, Plus, CheckCircle } from 'lucide-react';

async function getSequestrationEvents() {
  const events = await db.sequestrationEvent.findMany({
    orderBy: { finalDeliveryDate: 'desc' },
    include: {
      evidence: { select: { id: true } },
      batches: {
        include: {
          productionBatch: {
            select: { id: true, productionDate: true },
          },
        },
      },
      _count: {
        select: { bcuEvents: true },
      },
    },
  });

  return events.map((event) => ({
    ...event,
    quantityTonnes: event.batches.reduce(
      (sum, pb) => sum + pb.quantityTonnes,
      0
    ),
  }));
}

async function getStats() {
  const [total, complete, batches, bcuLinked] = await Promise.all([
    db.sequestrationEvent.count(),
    db.sequestrationEvent.count({ where: { status: 'complete' } }),
    db.sequestrationBatch.findMany({ select: { quantityTonnes: true } }),
    db.sequestrationEvent.count({ where: { bcuEvents: { some: {} } } }),
  ]);

  const totalQuantity = batches.reduce((sum, b) => sum + b.quantityTonnes, 0);

  return { total, complete, totalQuantity, bcuLinked };
}

export default async function SequestrationPage() {
  const [events, stats] = await Promise.all([getSequestrationEvents(), getStats()]);

  return (
    <PageContainer>
      <WorkflowNav currentPage="sequestration" />

      <PageHeader
        title="Sequestration Events"
        description="Track biochar sequestration with storage and delivery"
        icon={ArrowDownToLine}
        iconColor="text-violet-500"
        action={
          <Link href="/sequestration/new">
            <Button size="sm" className="h-8">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Event
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card className="border-[var(--border)]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-md bg-violet-500/10 flex items-center justify-center">
                <ArrowDownToLine className="h-4 w-4 text-violet-500" />
              </div>
              <div>
                <p className="text-xl font-semibold leading-none">{stats.total}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">Events</p>
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
              <div className="h-8 w-8 rounded-md bg-violet-500/10 flex items-center justify-center">
                <Scale className="h-4 w-4 text-violet-500" />
              </div>
              <div>
                <p className="text-xl font-semibold leading-none">{stats.totalQuantity.toFixed(1)}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">tonnes applied</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[var(--border)] bg-amber-500/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-md bg-amber-500/10 flex items-center justify-center">
                <Award className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xl font-semibold leading-none text-amber-600">{stats.bcuLinked}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">BCU issued</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <SequestrationTable events={events} />
    </PageContainer>
  );
}
