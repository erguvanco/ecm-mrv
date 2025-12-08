import { notFound } from 'next/navigation';
import db from '@/lib/db';
import { PageContainer, PageHeader } from '@/components/layout/page-container';
import { TransportForm } from '@/components/transport';
import { DEFAULT_ORIGIN_ADDRESS, DEFAULT_ORIGIN_COORDS } from '@/lib/validations/transport';

async function getTransportEvent(id: string) {
  return db.transportEvent.findUnique({
    where: { id },
  });
}

export default async function EditTransportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const transportEvent = await getTransportEvent(id);

  if (!transportEvent) {
    notFound();
  }

  return (
    <PageContainer>
      <PageHeader
        title="Edit Transport Event"
        description="Update transport event information"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Transport', href: '/transport' },
          { label: 'Edit' },
        ]}
      />
      <TransportForm
        mode="edit"
        initialData={{
          id: transportEvent.id,
          date: transportEvent.date,
          // Origin location - use defaults if not set (for legacy data)
          originAddress: DEFAULT_ORIGIN_ADDRESS,
          originLat: DEFAULT_ORIGIN_COORDS.lat,
          originLng: DEFAULT_ORIGIN_COORDS.lng,
          // Destination location - empty for legacy data
          destinationAddress: '',
          destinationLat: 0,
          destinationLng: 0,
          distanceKm: transportEvent.distanceKm,
          vehicleId: transportEvent.vehicleId,
          vehicleDescription: transportEvent.vehicleDescription,
          fuelType: transportEvent.fuelType,
          fuelTypeOther: transportEvent.fuelTypeOther,
          fuelAmount: transportEvent.fuelAmount,
          cargoDescription: transportEvent.cargoDescription,
          feedstockDeliveryId: transportEvent.feedstockDeliveryId,
          sequestrationEventId: transportEvent.sequestrationEventId,
          notes: transportEvent.notes,
        }}
      />
    </PageContainer>
  );
}
