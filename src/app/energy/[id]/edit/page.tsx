export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import db from '@/lib/db';
import { PageContainer, PageHeader } from '@/components/layout/page-container';
import { EnergyForm } from '@/components/energy';

async function getEnergyUsage(id: string) {
  return db.energyUsage.findUnique({
    where: { id },
  });
}

export default async function EditEnergyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const energyUsage = await getEnergyUsage(id);

  if (!energyUsage) {
    notFound();
  }

  return (
    <PageContainer>
      <PageHeader
        title="Edit Energy Usage Record"
        description="Update energy usage information"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Energy', href: '/energy' },
          { label: 'Edit' },
        ]}
      />
      <EnergyForm
        mode="edit"
        initialData={{
          id: energyUsage.id,
          scope: energyUsage.scope,
          energyType: energyUsage.energyType,
          quantity: energyUsage.quantity,
          unit: energyUsage.unit,
          periodStart: energyUsage.periodStart,
          periodEnd: energyUsage.periodEnd,
          productionBatchId: energyUsage.productionBatchId,
          notes: energyUsage.notes,
        }}
      />
    </PageContainer>
  );
}
