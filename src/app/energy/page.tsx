import Link from 'next/link';
import db from '@/lib/db';
import { PageContainer, PageHeader } from '@/components/layout/page-container';
import { Button } from '@/components/ui';
import { EnergyTable } from '@/components/energy';

async function getEnergyUsages() {
  return db.energyUsage.findMany({
    orderBy: { periodStart: 'desc' },
    include: {
      evidence: { select: { id: true } },
      productionBatch: {
        select: { id: true, productionDate: true },
      },
    },
  });
}

export default async function EnergyPage() {
  const energyUsages = await getEnergyUsages();

  return (
    <PageContainer>
      <PageHeader
        title="Energy Usage"
        description="Track energy consumption across production and operations"
        action={
          <Link href="/energy/new">
            <Button>Add Record</Button>
          </Link>
        }
      />
      <EnergyTable energyUsages={energyUsages} />
    </PageContainer>
  );
}
