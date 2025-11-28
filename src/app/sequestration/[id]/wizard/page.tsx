import { notFound } from 'next/navigation';
import db from '@/lib/db';
import { PageContainer, PageHeader } from '@/components/layout/page-container';
import { SequestrationWizard } from '@/components/sequestration';

async function getSequestrationEvent(id: string) {
  return db.sequestrationEvent.findUnique({
    where: { id },
    include: {
      productionBatches: true,
    },
  });
}

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

export default async function SequestrationWizardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [event, productionBatchOptions] = await Promise.all([
    getSequestrationEvent(id),
    getProductionBatchOptions(),
  ]);

  if (!event) {
    notFound();
  }

  return (
    <PageContainer>
      <PageHeader
        title="Edit Sequestration Event"
        description="Continue editing this sequestration event"
      />
      <SequestrationWizard
        productionBatchOptions={productionBatchOptions}
        eventId={event.id}
        initialData={{
          storageBeforeDelivery: event.storageBeforeDelivery,
          storageLocation: event.storageLocation,
          storageStartDate: event.storageStartDate,
          storageEndDate: event.storageEndDate,
          storageContainerIds: event.storageContainerIds,
          storageConditions: event.storageConditions,
          productionBatches: event.productionBatches.map((pb) => ({
            productionBatchId: pb.productionBatchId,
            quantityTonnes: pb.quantityTonnes,
          })),
          finalDeliveryDate: event.finalDeliveryDate,
          deliveryVehicleDescription: event.deliveryVehicleDescription,
          deliveryPostcode: event.deliveryPostcode,
          sequestrationType: event.sequestrationType,
          notes: event.notes,
        }}
      />
    </PageContainer>
  );
}
