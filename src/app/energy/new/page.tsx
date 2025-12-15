import { PageContainer, PageHeader } from '@/components/layout/page-container';
import { EnergyForm } from '@/components/energy';

export default function NewEnergyPage() {
  return (
    <PageContainer>
      <PageHeader
        title="New Energy Usage Record"
        description="Record energy consumption data"
      />
      <EnergyForm mode="create" />
    </PageContainer>
  );
}
