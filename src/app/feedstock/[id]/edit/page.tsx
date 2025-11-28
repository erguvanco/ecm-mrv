import { notFound } from 'next/navigation';
import db from '@/lib/db';
import { PageContainer, PageHeader } from '@/components/layout/page-container';
import { FeedstockForm } from '@/components/feedstock';

async function getFeedstock(id: string) {
  return db.feedstockDelivery.findUnique({
    where: { id },
  });
}

export default async function EditFeedstockPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const feedstock = await getFeedstock(id);

  if (!feedstock) {
    notFound();
  }

  return (
    <PageContainer>
      <PageHeader
        title="Edit Feedstock Delivery"
        description="Update feedstock delivery information"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Feedstock', href: '/feedstock' },
          { label: 'Edit' },
        ]}
      />
      <FeedstockForm
        mode="edit"
        initialData={{
          id: feedstock.id,
          date: feedstock.date,
          vehicleId: feedstock.vehicleId,
          vehicleDescription: feedstock.vehicleDescription,
          deliveryDistanceKm: feedstock.deliveryDistanceKm,
          weightTonnes: feedstock.weightTonnes,
          volumeM3: feedstock.volumeM3,
          feedstockType: feedstock.feedstockType,
          fuelType: feedstock.fuelType,
          fuelAmount: feedstock.fuelAmount,
          notes: feedstock.notes,
        }}
      />
    </PageContainer>
  );
}
