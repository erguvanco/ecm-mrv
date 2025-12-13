export const dynamic = 'force-dynamic';

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
          vehicleId: feedstock.vehicleId || '',
          vehicleDescription: feedstock.vehicleDescription || '',
          deliveryDistanceKm: feedstock.deliveryDistanceKm,
          weightTonnes: feedstock.weightTonnes ?? 0,
          volumeM3: feedstock.volumeM3,
          feedstockType: feedstock.feedstockType,
          feedstockTypeOther: feedstock.feedstockTypeOther,
          fuelType: feedstock.fuelType || '',
          fuelTypeOther: feedstock.fuelTypeOther,
          fuelAmount: feedstock.fuelAmount ?? 0,
          notes: feedstock.notes,
          sourceAddress: feedstock.sourceAddress || '',
          sourceLat: feedstock.sourceLat || 0,
          sourceLng: feedstock.sourceLng || 0,
          // Puro methodology fields
          puroCategory: feedstock.puroCategory || undefined,
          puroCategoryName: feedstock.puroCategoryName || undefined,
          ilucRiskLevel: (feedstock.ilucRiskLevel as 'LOW' | 'HIGH' | null) || undefined,
          sourceClassification: (feedstock.sourceClassification as 'RESIDUE' | 'WASTE' | 'DEDICATED_CROP' | null) || undefined,
          sustainabilityCertification: feedstock.sustainabilityCertification || undefined,
          certificationNumber: feedstock.certificationNumber || undefined,
          certificationExpiry: feedstock.certificationExpiry || undefined,
          isDedicatedCrop: feedstock.isDedicatedCrop ?? false,
          isPrimaryLandDriver: feedstock.isPrimaryLandDriver ?? false,
          firstGatheringPointAddress: feedstock.firstGatheringPointAddress || undefined,
          firstGatheringPointLat: feedstock.firstGatheringPointLat || undefined,
          firstGatheringPointLng: feedstock.firstGatheringPointLng || undefined,
        }}
      />
    </PageContainer>
  );
}
