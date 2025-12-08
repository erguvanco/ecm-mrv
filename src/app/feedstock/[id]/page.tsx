export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import db from '@/lib/db';
import { PageContainer, PageHeader } from '@/components/layout/page-container';
import { formatDateTime } from '@/lib/utils';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from '@/components/ui';
import { QRDisplay } from '@/components/qr';
import { FEEDSTOCK_TYPES, FUEL_TYPES } from '@/lib/validations/feedstock';

async function getFeedstock(id: string) {
  return db.feedstockDelivery.findUnique({
    where: { id },
    include: {
      evidence: true,
      productionBatches: {
        select: {
          id: true,
          productionDate: true,
          outputBiocharWeightTonnes: true,
        },
      },
      transportEvents: {
        select: { id: true, date: true, distanceKm: true },
      },
    },
  });
}

export default async function FeedstockDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const feedstock = await getFeedstock(id);

  if (!feedstock) {
    notFound();
  }

  const feedstockTypeLabel =
    FEEDSTOCK_TYPES.find((t) => t.value === feedstock.feedstockType)?.label ||
    feedstock.feedstockType;

  const fuelTypeLabel = feedstock.fuelType
    ? FUEL_TYPES.find((t) => t.value === feedstock.fuelType)?.label ||
      feedstock.fuelType
    : null;

  return (
    <PageContainer>
      <PageHeader
        title="Feedstock Delivery Details"
        description={`Delivery from ${formatDateTime(feedstock.date)}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Feedstock', href: '/feedstock' },
          { label: 'Details' },
        ]}
        action={
          <div className="flex gap-2">
            <Link href={`/feedstock/${id}/edit`}>
              <Button>Edit Delivery</Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">QR Code</CardTitle>
          </CardHeader>
          <CardContent>
            <QRDisplay
              entityType="feedstock"
              entityId={feedstock.id}
              entityLabel={`Feedstock Delivery - ${formatDateTime(feedstock.date)}`}
              size="md"
              showActions
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Delivery Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Date</span>
              <span className="font-medium">
                {formatDateTime(feedstock.date)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">
                Feedstock Type
              </span>
              <Badge variant="secondary">{feedstockTypeLabel}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Weight</span>
              <span className="font-medium">
                {feedstock.weightTonnes
                  ? `${feedstock.weightTonnes.toFixed(2)} tonnes`
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Volume</span>
              <span className="font-medium">
                {feedstock.volumeM3
                  ? `${feedstock.volumeM3.toFixed(2)} m³`
                  : '-'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transport Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Vehicle ID</span>
              <span className="font-medium">
                {feedstock.vehicleId || '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">
                Vehicle Description
              </span>
              <span className="font-medium">
                {feedstock.vehicleDescription || '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">
                Delivery Distance
              </span>
              <span className="font-medium">
                {feedstock.deliveryDistanceKm.toFixed(2)} km
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Fuel Type</span>
              <span className="font-medium">{fuelTypeLabel || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Fuel Amount</span>
              <span className="font-medium">
                {feedstock.fuelAmount
                  ? `${feedstock.fuelAmount.toFixed(1)} L`
                  : '-'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Evidence Files</CardTitle>
          </CardHeader>
          <CardContent>
            {feedstock.evidence.length > 0 ? (
              <div className="grid gap-2">
                {feedstock.evidence.map((file) => (
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

        {feedstock.notes && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{feedstock.notes}</p>
            </CardContent>
          </Card>
        )}

        {feedstock.productionBatches.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">
                Linked Production Batches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {feedstock.productionBatches.map((batch) => (
                  <Link
                    key={batch.id}
                    href={`/production/${batch.id}`}
                    className="flex items-center justify-between border p-3 hover:bg-[var(--muted)]"
                  >
                    <span className="font-medium">
                      {formatDateTime(batch.productionDate)}
                    </span>
                    <span className="text-[var(--muted-foreground)]">
                      {batch.outputBiocharWeightTonnes?.toFixed(2) || '-'} tonnes
                      output
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
