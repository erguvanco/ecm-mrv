import { PageContainer, PageHeader } from '@/components/layout/page-container';
import { FeedstockForm } from '@/components/feedstock';

export default function NewFeedstockPage() {
  return (
    <PageContainer>
      <PageHeader
        title="New Feedstock Delivery"
        description="Record a new feedstock delivery"
      />
      <FeedstockForm mode="create" />
    </PageContainer>
  );
}
