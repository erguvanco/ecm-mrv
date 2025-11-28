import db from '@/lib/db';
import { PageContainer, PageHeader } from '@/components/layout/page-container';
import { ProductionWizard } from '@/components/production';

async function getFeedstockOptions() {
  return db.feedstockDelivery.findMany({
    orderBy: { date: 'desc' },
    select: {
      id: true,
      date: true,
      feedstockType: true,
      weightTonnes: true,
    },
  });
}

export default async function NewProductionPage() {
  const feedstockOptions = await getFeedstockOptions();

  return (
    <PageContainer>
      <PageHeader
        title="New Production Batch"
        description="Create a new biochar production batch"
      />
      <ProductionWizard feedstockOptions={feedstockOptions} />
    </PageContainer>
  );
}
