export const dynamic = 'force-dynamic';

import Link from 'next/link';
import db from '@/lib/db';
import { PageContainer, PageHeader } from '@/components/layout/page-container';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { BCUTable } from '@/components/registry';
import { WorkflowNav } from '@/components/workflow-nav';
import { Award, TreePine, ArrowRightLeft, CheckCircle, Plus } from 'lucide-react';

async function getBCUs() {
  return db.bCU.findMany({
    orderBy: { issuanceDate: 'desc' },
    include: {
      sequestrationEvents: {
        include: {
          sequestration: {
            select: {
              id: true,
              finalDeliveryDate: true,
              sequestrationType: true,
            },
          },
        },
      },
    },
  });
}

async function getStats() {
  const [total, issued, transferred, retired, totalQuantity, retiredQuantity] =
    await Promise.all([
      db.bCU.count(),
      db.bCU.count({ where: { status: 'issued' } }),
      db.bCU.count({ where: { status: 'transferred' } }),
      db.bCU.count({ where: { status: 'retired' } }),
      db.bCU.aggregate({ _sum: { quantityTonnesCO2e: true } }),
      db.bCU.aggregate({
        where: { status: 'retired' },
        _sum: { quantityTonnesCO2e: true },
      }),
    ]);

  return {
    total,
    issued,
    transferred,
    retired,
    totalQuantity: totalQuantity._sum.quantityTonnesCO2e || 0,
    retiredQuantity: retiredQuantity._sum.quantityTonnesCO2e || 0,
  };
}

export default async function RegistryPage() {
  const [bcus, stats] = await Promise.all([getBCUs(), getStats()]);

  return (
    <PageContainer>
      <WorkflowNav currentPage="registry" />

      <PageHeader
        title="BCU Registry"
        description="Manage Biochar Carbon Unit issuance, transfers, and retirements"
        icon={Award}
        iconColor="text-amber-500"
        action={
          <Link href="/registry/issue">
            <Button size="sm" className="h-8">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Issue BCU
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
                <Award className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xl font-semibold leading-none">{stats.total}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">Total BCUs</p>
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
                <p className="text-xl font-semibold leading-none">{stats.issued}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[var(--border)]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center">
                <ArrowRightLeft className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xl font-semibold leading-none">{stats.transferred}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">Transferred</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[var(--border)] bg-emerald-500/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-md bg-emerald-500/10 flex items-center justify-center">
                <TreePine className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xl font-semibold leading-none text-emerald-600">{stats.retiredQuantity.toFixed(1)}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">tCO₂e retired</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BCUTable bcus={bcus} />
    </PageContainer>
  );
}
