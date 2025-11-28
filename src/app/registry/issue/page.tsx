import db from '@/lib/db';
import { PageContainer, PageHeader } from '@/components/layout/page-container';
import { IssueBCUForm } from '@/components/registry';

async function getSequestrationOptions() {
  const events = await db.sequestrationEvent.findMany({
    where: { status: 'complete' },
    orderBy: { finalDeliveryDate: 'desc' },
    include: {
      productionBatches: {
        select: { quantityTonnes: true },
      },
    },
  });

  return events.map((event) => ({
    id: event.id,
    finalDeliveryDate: event.finalDeliveryDate.toISOString(),
    sequestrationType: event.sequestrationType,
    quantityTonnes: event.productionBatches.reduce(
      (sum, pb) => sum + pb.quantityTonnes,
      0
    ),
  }));
}

export default async function IssueBCUPage() {
  const sequestrationOptions = await getSequestrationOptions();

  return (
    <PageContainer>
      <PageHeader
        title="Issue BCU"
        description="Create a new Biochar Carbon Unit from a completed sequestration event"
      />
      <IssueBCUForm sequestrationOptions={sequestrationOptions} />
    </PageContainer>
  );
}
