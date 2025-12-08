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
import { TRANSPORT_FUEL_TYPES } from '@/lib/validations/transport';

async function getTransportEvent(id: string) {
  return db.transportEvent.findUnique({
    where: { id },
    include: {
      evidence: true,
      feedstockDelivery: {
        select: { id: true, date: true, feedstockType: true },
      },
      sequestrationEvent: {
        select: { id: true, finalDeliveryDate: true },
      },
    },
  });
}

export default async function TransportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const transportEvent = await getTransportEvent(id);

  if (!transportEvent) {
    notFound();
  }

  const fuelTypeLabel = transportEvent.fuelType
    ? TRANSPORT_FUEL_TYPES.find((t) => t.value === transportEvent.fuelType)
        ?.label || transportEvent.fuelType
    : null;

  return (
    <PageContainer>
      <PageHeader
        title="Transport Event Details"
        description={`Transport on ${formatDateTime(transportEvent.date)}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Transport', href: '/transport' },
          { label: 'Details' },
        ]}
        action={
          <Link href={`/transport/${id}/edit`}>
            <Button>Edit Event</Button>
          </Link>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">QR Code</CardTitle>
          </CardHeader>
          <CardContent>
            <QRDisplay
              entityType="transport"
              entityId={transportEvent.id}
              entityLabel={`Transport Event - ${formatDateTime(transportEvent.date)}`}
              size="md"
              showActions
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transport Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Date</span>
              <span className="font-medium">
                {formatDateTime(transportEvent.date)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Distance</span>
              <span className="font-medium">{transportEvent.distanceKm.toFixed(2)} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">
                Cargo Description
              </span>
              <span className="font-medium">
                {transportEvent.cargoDescription || '-'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vehicle & Fuel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Vehicle ID</span>
              <span className="font-medium">
                {transportEvent.vehicleId || '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">
                Vehicle Description
              </span>
              <span className="font-medium">
                {transportEvent.vehicleDescription || '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Fuel Type</span>
              <span className="font-medium">{fuelTypeLabel || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Fuel Amount</span>
              <span className="font-medium">
                {transportEvent.fuelAmount
                  ? `${transportEvent.fuelAmount.toFixed(1)} L`
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
            {transportEvent.evidence.length > 0 ? (
              <div className="grid gap-2">
                {transportEvent.evidence.map((file) => (
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

        {transportEvent.notes && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{transportEvent.notes}</p>
            </CardContent>
          </Card>
        )}

        {(transportEvent.feedstockDelivery ||
          transportEvent.sequestrationEvent) && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Linked Records</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {transportEvent.feedstockDelivery && (
                <Link
                  href={`/feedstock/${transportEvent.feedstockDelivery.id}`}
                  className="flex items-center justify-between border p-3 hover:bg-[var(--muted)]"
                >
                  <span className="font-medium">Feedstock Delivery</span>
                  <span className="text-[var(--muted-foreground)]">
                    {formatDateTime(transportEvent.feedstockDelivery.date)}
                  </span>
                </Link>
              )}
              {transportEvent.sequestrationEvent && (
                <Link
                  href={`/sequestration/${transportEvent.sequestrationEvent.id}`}
                  className="flex items-center justify-between border p-3 hover:bg-[var(--muted)]"
                >
                  <span className="font-medium">Sequestration Event</span>
                  <span className="text-[var(--muted-foreground)]">
                    {formatDateTime(transportEvent.sequestrationEvent.finalDeliveryDate)}
                  </span>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
