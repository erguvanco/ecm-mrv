import Link from 'next/link';
import db from '@/lib/db';
import { PageContainer, PageHeader } from '@/components/layout/page-container';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { BCUTable } from '@/components/registry';

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
      <PageHeader
        title="BCU Registry"
        description="Manage Biochar Carbon Unit issuance, transfers, and retirements"
        action={
          <Link href="/registry/issue">
            <Button>Issue BCU</Button>
          </Link>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
              Total BCUs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-[var(--muted-foreground)]">
              {stats.totalQuantity.toFixed(2)} tCO2e
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
              Issued
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.issued}
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              Available for transfer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
              Transferred
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.transferred}
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              Changed ownership
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
              Retired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats.retired}
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              {stats.retiredQuantity.toFixed(2)} tCO2e claimed
            </p>
          </CardContent>
        </Card>
      </div>

      <BCUTable bcus={bcus} />
    </PageContainer>
  );
}
