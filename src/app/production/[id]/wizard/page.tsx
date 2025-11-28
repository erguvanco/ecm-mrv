import { notFound } from 'next/navigation';
import db from '@/lib/db';
import { PageContainer, PageHeader } from '@/components/layout/page-container';
import { ProductionWizard } from '@/components/production';

async function getProductionBatch(id: string) {
  return db.productionBatch.findUnique({
    where: { id },
  });
}

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

export default async function ProductionWizardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [batch, feedstockOptions] = await Promise.all([
    getProductionBatch(id),
    getFeedstockOptions(),
  ]);

  if (!batch) {
    notFound();
  }

  return (
    <PageContainer>
      <PageHeader
        title="Edit Production Batch"
        description="Continue editing this production batch"
      />
      <ProductionWizard
        feedstockOptions={feedstockOptions}
        batchId={batch.id}
        initialData={{
          productionDate: batch.productionDate,
          feedstockDeliveryId: batch.feedstockDeliveryId,
          inputFeedstockWeightTonnes: batch.inputFeedstockWeightTonnes,
          outputBiocharWeightTonnes: batch.outputBiocharWeightTonnes,
          temperatureMin: batch.temperatureMin,
          temperatureMax: batch.temperatureMax,
          temperatureAvg: batch.temperatureAvg,
          notes: batch.notes,
        }}
      />
    </PageContainer>
  );
}
