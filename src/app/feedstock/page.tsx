export const dynamic = 'force-dynamic';

import Link from 'next/link';
import db from '@/lib/db';
import { PageContainer, PageHeader } from '@/components/layout/page-container';
import { Button } from '@/components/ui';
import { FeedstockTable } from '@/components/feedstock';

async function getFeedstocks() {
  return db.feedstockDelivery.findMany({
    orderBy: { date: 'desc' },
    select: {
      id: true,
      serialNumber: true,
      date: true,
      feedstockType: true,
      weightTonnes: true,
      volumeM3: true,
      deliveryDistanceKm: true,
      vehicleId: true,
      sourceAddress: true,
      updatedAt: true,
      evidence: { select: { id: true } },
      _count: {
        select: {
          productionBatches: true,
          transportEvents: true,
        },
      },
    },
  });
}

export default async function FeedstockPage() {
  const feedstocks = await getFeedstocks();

  return (
    <PageContainer>
      <PageHeader
        title="Feedstock Deliveries"
        description="Manage and track incoming feedstock for biochar production"
        action={
          <Link href="/feedstock/new">
            <Button>Add Delivery</Button>
          </Link>
        }
      />
      <FeedstockTable feedstocks={feedstocks} />
    </PageContainer>
  );
}
