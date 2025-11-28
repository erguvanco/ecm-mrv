import Link from 'next/link';
import db from '@/lib/db';
import { PageContainer, PageHeader } from '@/components/layout/page-container';
import { Button } from '@/components/ui';
import { ProductionTable } from '@/components/production';

async function getProductionBatches() {
  return db.productionBatch.findMany({
    orderBy: { productionDate: 'desc' },
    include: {
      evidence: { select: { id: true } },
      feedstockDelivery: {
        select: { id: true, date: true, feedstockType: true },
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

export default async function ProductionPage() {
  const batches = await getProductionBatches();

  return (
    <PageContainer>
      <PageHeader
        title="Production Batches"
        description="Manage biochar production batches with step-by-step tracking"
        action={
          <Link href="/production/new">
            <Button>New Batch</Button>
          </Link>
        }
      />
      <ProductionTable batches={batches} />
    </PageContainer>
  );
}
