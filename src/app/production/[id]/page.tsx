import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import db from '@/lib/db';
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
        description={`Batch from ${format(new Date(batch.productionDate), 'MMMM d, yyyy')}`}
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
              entityLabel={`Production Batch - ${format(new Date(batch.productionDate), 'MMM d, yyyy')}`}
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
                {format(new Date(batch.productionDate), 'MMM d, yyyy')}
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

        {batch.feedstockDelivery && (
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
                  {format(
                    new Date(batch.feedstockDelivery.date),
                    'MMM d, yyyy'
                  )}{' '}
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
                      {format(
                        new Date(sb.sequestration.finalDeliveryDate),
                        'MMM d, yyyy'
                      )}
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
