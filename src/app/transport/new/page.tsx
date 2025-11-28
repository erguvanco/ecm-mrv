import { PageContainer, PageHeader } from '@/components/layout/page-container';
import { TransportForm } from '@/components/transport';

export default function NewTransportPage() {
  return (
    <PageContainer>
      <PageHeader
        title="New Transport Event"
        description="Record a new transport event"
      />
      <TransportForm mode="create" />
    </PageContainer>
  );
}
