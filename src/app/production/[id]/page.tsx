import { notFound } from 'next/navigation';
import Link from 'next/link';
import db from '@/lib/db';
import { formatDateTime } from '@/lib/utils';
import { PageContainer, PageHeader } from '@/components/layout/page-container';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from '@/components/ui';
import { QRDisplay } from '@/components/qr';

async function getProductionBatch(id: string) {
  return db.productionBatch.findUnique({
    where: { id },
    include: {
      evidence: true,
      feedstockDelivery: {
        select: {
          id: true,
          date: true,
          feedstockType: true,
          weightTonnes: true,
        },
      },
      feedstockAllocations: {
        include: {
          feedstockDelivery: {
            select: {
              id: true,
              date: true,
              feedstockType: true,
              weightTonnes: true,
            },
          },
        },
      },
      energyUsages: {
        select: { id: true, energyType: true, quantity: true, unit: true },
      },
      sequestrationBatches: {
        include: {
          sequestration: {
            select: { id: true, finalDeliveryDate: true, sequestrationType: true },
          },
        },
      },
      bcuBatches: {
        include: {
          bcu: {
            select: { id: true, registrySerialNumber: true, status: true },
          },
        },
      },
    },
  });
}

export default async function ProductionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const batch = await getProductionBatch(id);

  if (!batch) {
    notFound();
  }

  const conversionRate =
    batch.inputFeedstockWeightTonnes > 0
      ? (batch.outputBiocharWeightTonnes / batch.inputFeedstockWeightTonnes) *
        100
      : 0;

  return (
    <PageContainer>
      <PageHeader
        title="Production Batch Details"
        description={`Batch from ${formatDateTime(batch.productionDate)}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Production', href: '/production' },
          { label: 'Details' },
        ]}
        action={
          batch.status === 'draft' ? (
            <Link href={`/production/${id}/wizard`}>
              <Button>Continue Wizard</Button>
            </Link>
          ) : undefined
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">QR Code</CardTitle>
          </CardHeader>
          <CardContent>
            <QRDisplay
              entityType="production"
              entityId={batch.id}
              entityLabel={`Production Batch - ${formatDateTime(batch.productionDate)}`}
              size="md"
              showActions
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Batch Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Status</span>
              <Badge
                variant={batch.status === 'complete' ? 'default' : 'secondary'}
              >
                {batch.status === 'complete' ? 'Complete' : 'Draft'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">
                Production Date
              </span>
              <span className="font-medium">
                {formatDateTime(batch.productionDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Input Weight</span>
              <span className="font-medium">
                {batch.inputFeedstockWeightTonnes.toFixed(2)} tonnes
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">
                Output Weight
              </span>
              <span className="font-medium">
                {batch.outputBiocharWeightTonnes.toFixed(2)} tonnes
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">
                Conversion Rate
              </span>
              <Badge variant="outline">{conversionRate.toFixed(1)}%</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Temperature Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">
                Min Temperature
              </span>
              <span className="font-medium">
                {batch.temperatureMin ? `${batch.temperatureMin}°C` : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">
                Avg Temperature
              </span>
              <span className="font-medium">
                {batch.temperatureAvg ? `${batch.temperatureAvg}°C` : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">
                Max Temperature
              </span>
              <span className="font-medium">
                {batch.temperatureMax ? `${batch.temperatureMax}°C` : '-'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Feedstock Allocations (new multi-select) */}
        {batch.feedstockAllocations.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">
                Feedstock Sources ({batch.feedstockAllocations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {batch.feedstockAllocations.map((allocation) => {
                  const allocatedWeight = allocation.weightUsedTonnes
                    || (allocation.feedstockDelivery.weightTonnes
                      ? (allocation.feedstockDelivery.weightTonnes * allocation.percentageUsed) / 100
                      : 0);
                  return (
                    <Link
                      key={allocation.feedstockDeliveryId}
                      href={`/feedstock/${allocation.feedstockDelivery.id}`}
                      className="flex items-center justify-between border p-3 hover:bg-[var(--muted)]"
                    >
                      <div>
                        <span className="font-medium">
                          {formatDateTime(allocation.feedstockDelivery.date)}{' '}
                          – {allocation.feedstockDelivery.feedstockType}
                        </span>
                        <span className="text-sm text-[var(--muted-foreground)] ml-2">
                          ({allocation.feedstockDelivery.weightTonnes?.toFixed(1) || '?'}t total)
                        </span>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mr-2">
                          {allocation.percentageUsed}%
                        </Badge>
                        <span className="text-[var(--muted-foreground)]">
                          {allocatedWeight.toFixed(2)} tonnes
                        </span>
                      </div>
                    </Link>
                  );
                })}
                <div className="flex justify-between items-center pt-2 mt-2 border-t border-[var(--border)]">
                  <span className="text-sm font-medium">Total Allocated</span>
                  <span className="font-medium">
                    {batch.feedstockAllocations.reduce((sum, a) => {
                      const weight = a.weightUsedTonnes
                        || (a.feedstockDelivery.weightTonnes
                          ? (a.feedstockDelivery.weightTonnes * a.percentageUsed) / 100
                          : 0);
                      return sum + weight;
                    }, 0).toFixed(2)} tonnes
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Legacy single feedstock delivery (for backwards compatibility) */}
        {batch.feedstockDelivery && batch.feedstockAllocations.length === 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">
                Linked Feedstock Delivery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/feedstock/${batch.feedstockDelivery.id}`}
                className="flex items-center justify-between border p-3 hover:bg-[var(--muted)]"
              >
                <span className="font-medium">
                  {formatDateTime(batch.feedstockDelivery.date)}{' '}
                  - {batch.feedstockDelivery.feedstockType}
                </span>
                <span className="text-[var(--muted-foreground)]">
                  {batch.feedstockDelivery.weightTonnes?.toFixed(2) || '-'}{' '}
                  tonnes
                </span>
              </Link>
            </CardContent>
          </Card>
        )}

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Evidence Files</CardTitle>
          </CardHeader>
          <CardContent>
            {batch.evidence.length > 0 ? (
              <div className="grid gap-2">
                {batch.evidence.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between border p-3"
                  >
                    <div>
                      <p className="font-medium">{file.fileName}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {file.category} • {(file.fileSize / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Badge variant="outline">{file.fileType}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[var(--muted-foreground)]">
                No evidence files uploaded yet.
              </p>
            )}
          </CardContent>
        </Card>

        {batch.notes && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{batch.notes}</p>
            </CardContent>
          </Card>
        )}

        {batch.sequestrationBatches.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Sequestration Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {batch.sequestrationBatches.map((sb) => (
                  <Link
                    key={sb.sequestration.id}
                    href={`/sequestration/${sb.sequestration.id}`}
                    className="flex items-center justify-between border p-3 hover:bg-[var(--muted)]"
                  >
                    <span className="font-medium">
                      {formatDateTime(sb.sequestration.finalDeliveryDate)}
                    </span>
                    <span className="text-[var(--muted-foreground)]">
                      {sb.quantityTonnes.toFixed(2)} tonnes from this
                      batch
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
