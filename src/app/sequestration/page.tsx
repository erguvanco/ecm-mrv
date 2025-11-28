import Link from 'next/link';
import db from '@/lib/db';
import { PageContainer, PageHeader } from '@/components/layout/page-container';
import { Button } from '@/components/ui';
import { SequestrationTable } from '@/components/sequestration';

async function getSequestrationEvents() {
  const events = await db.sequestrationEvent.findMany({
    orderBy: { finalDeliveryDate: 'desc' },
    include: {
      evidence: { select: { id: true } },
      batches: {
        include: {
          productionBatch: {
            select: { id: true, productionDate: true },
          },
        },
      },
      _count: {
        select: { bcuEvents: true },
      },
    },
  });

  return events.map((event) => ({
    ...event,
    quantityTonnes: event.batches.reduce(
      (sum, pb) => sum + pb.quantityTonnes,
      0
    ),
  }));
}

export default async function SequestrationPage() {
  const events = await getSequestrationEvents();

  return (
    <PageContainer>
      <PageHeader
        title="Sequestration Events"
        description="Track biochar sequestration with storage and delivery details"
        action={
          <Link href="/sequestration/new">
            <Button>New Event</Button>
          </Link>
        }
      />
      <SequestrationTable events={events} />
    </PageContainer>
  );
}
