export const dynamic = 'force-dynamic';

import db from '@/lib/db';
import { PageContainer, PageHeader } from '@/components/layout/page-container';
import { SequestrationWizard } from '@/components/sequestration';

async function getProductionBatchOptions() {
  return db.productionBatch.findMany({
    where: { status: 'complete' },
    orderBy: { productionDate: 'desc' },
    select: {
      id: true,
      productionDate: true,
      outputBiocharWeightTonnes: true,
    },
  });
}

export default async function NewSequestrationPage() {
  const productionBatchOptions = await getProductionBatchOptions();

  return (
    <PageContainer>
      <PageHeader
        title="New Sequestration Event"
        description="Create a new biochar sequestration event"
      />
      <SequestrationWizard productionBatchOptions={productionBatchOptions} />
    </PageContainer>
  );
}
