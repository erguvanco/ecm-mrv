import { WorkflowIndicator, type WorkflowStep } from '@/components/ui';
import db from '@/lib/db';

export type WorkflowPage = 'feedstock' | 'production' | 'sequestration' | 'registry';

interface WorkflowNavProps {
  currentPage: WorkflowPage;
}

async function getWorkflowStats() {
  const [feedstockCount, productionCount, productionCompleteCount, sequestrationCount, sequestrationCompleteCount, bcuCount] =
    await Promise.all([
      db.feedstockDelivery.count(),
      db.productionBatch.count(),
      db.productionBatch.count({ where: { status: 'complete' } }),
      db.sequestrationEvent.count(),
      db.sequestrationEvent.count({ where: { status: 'complete' } }),
      db.bCU.count(),
    ]);

  return {
    feedstockCount,
    productionCount,
    productionCompleteCount,
    sequestrationCount,
    sequestrationCompleteCount,
    bcuCount,
  };
}

export async function WorkflowNav({ currentPage }: WorkflowNavProps) {
  const stats = await getWorkflowStats();

  const workflowSteps: WorkflowStep[] = [
    {
      id: 'feedstock',
      label: 'Feedstock',
      href: '/feedstock',
      status: stats.feedstockCount > 0 ? 'complete' : 'available',
      count: stats.feedstockCount,
    },
    {
      id: 'production',
      label: 'Production',
      href: '/production',
      status: stats.productionCompleteCount > 0 ? 'complete' : stats.feedstockCount > 0 ? 'available' : 'pending',
      count: stats.productionCount,
    },
    {
      id: 'sequestration',
      label: 'Sequestration',
      href: '/sequestration',
      status: stats.sequestrationCompleteCount > 0 ? 'complete' : stats.productionCompleteCount > 0 ? 'available' : 'pending',
      count: stats.sequestrationCount,
    },
    {
      id: 'registry',
      label: 'Registry',
      href: '/registry',
      status: stats.bcuCount > 0 ? 'complete' : stats.sequestrationCompleteCount > 0 ? 'available' : 'pending',
      count: stats.bcuCount,
    },
  ];

  return <WorkflowIndicator steps={workflowSteps} currentStep={currentPage} />;
}
