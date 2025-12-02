export const dynamic = 'force-dynamic';

import Link from 'next/link';
import db from '@/lib/db';
import { PageContainer, PageHeader } from '@/components/layout/page-container';
import { Button } from '@/components/ui';
import { TransportTable } from '@/components/transport';

async function getTransportEvents() {
  return db.transportEvent.findMany({
    orderBy: { date: 'desc' },
    include: {
      evidence: { select: { id: true } },
      feedstockDelivery: {
        select: { id: true, date: true, feedstockType: true },
      },
      sequestrationEvent: {
        select: { id: true, finalDeliveryDate: true },
      },
    },
  });
}

export default async function TransportPage() {
  const transportEvents = await getTransportEvents();

  return (
    <PageContainer>
      <PageHeader
        title="Transport Events"
        description="Track transport and logistics for feedstock and biochar"
        action={
          <Link href="/transport/new">
            <Button>Add Event</Button>
          </Link>
        }
      />
      <TransportTable transportEvents={transportEvents} />
    </PageContainer>
  );
}
