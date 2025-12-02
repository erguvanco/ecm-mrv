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
import { SEQUESTRATION_TYPES, STORAGE_CONDITIONS } from '@/lib/validations/sequestration';

async function getSequestrationEvent(id: string) {
  return db.sequestrationEvent.findUnique({
    where: { id },
    include: {
      evidence: true,
      batches: {
        include: {
          productionBatch: {
            select: {
              id: true,
              productionDate: true,
              outputBiocharWeightTonnes: true,
            },
          },
        },
      },
      transportEvents: {
        select: { id: true, date: true, distanceKm: true },
      },
      bcuEvents: {
        include: {
          bcu: {
            select: {
              id: true,
              registrySerialNumber: true,
              status: true,
              quantityTonnesCO2e: true,
            },
          },
        },
      },
    },
  });
}

export default async function SequestrationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getSequestrationEvent(id);

  if (!event) {
    notFound();
  }

  const totalQuantity = event.batches.reduce(
    (sum, pb) => sum + pb.quantityTonnes,
    0
  );

  const typeLabel =
    SEQUESTRATION_TYPES.find((t) => t.value === event.sequestrationType)
      ?.label || event.sequestrationType;

  const storageConditionsLabel = event.storageConditions
    ? STORAGE_CONDITIONS.find((c) => c.value === event.storageConditions)
        ?.label || event.storageConditions
    : null;

  return (
    <PageContainer>
      <PageHeader
        title="Sequestration Event Details"
        description={`Delivery on ${format(new Date(event.finalDeliveryDate), 'MMMM d, yyyy')}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Sequestration', href: '/sequestration' },
          { label: 'Details' },
        ]}
        action={
          event.status === 'draft' ? (
            <Link href={`/sequestration/${id}/wizard`}>
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
              entityType="sequestration"
              entityId={event.id}
              entityLabel={`Sequestration - ${format(new Date(event.finalDeliveryDate), 'MMM d, yyyy')}`}
              size="md"
              showActions
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Event Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Status</span>
              <Badge
                variant={event.status === 'complete' ? 'default' : 'secondary'}
              >
                {event.status === 'complete' ? 'Complete' : 'Draft'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">
                Delivery Date
              </span>
              <span className="font-medium">
                {format(new Date(event.finalDeliveryDate), 'MMM d, yyyy')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">
                Sequestration Type
              </span>
              <Badge variant="secondary">{typeLabel}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">
                Total Quantity
              </span>
              <span className="font-medium">{totalQuantity.toFixed(2)} tonnes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">
                Delivery Postcode
              </span>
              <span className="font-medium">{event.deliveryPostcode}</span>
            </div>
          </CardContent>
        </Card>

        {event.storageBeforeDelivery && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Storage Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Location</span>
                <span className="font-medium">
                  {event.storageLocation || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">
                  Start Date
                </span>
                <span className="font-medium">
                  {event.storageStartDate
                    ? format(new Date(event.storageStartDate), 'MMM d, yyyy')
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">End Date</span>
                <span className="font-medium">
                  {event.storageEndDate
                    ? format(new Date(event.storageEndDate), 'MMM d, yyyy')
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">
                  Conditions
                </span>
                <span className="font-medium">
                  {storageConditionsLabel || '-'}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Production Batches</CardTitle>
          </CardHeader>
          <CardContent>
            {event.batches.length > 0 ? (
              <div className="grid gap-2">
                {event.batches.map((pb) => (
                  <Link
                    key={pb.productionBatchId}
                    href={`/production/${pb.productionBatch.id}`}
                    className="flex items-center justify-between border p-3 hover:bg-[var(--muted)]"
                  >
                    <span className="font-medium">
                      {format(
                        new Date(pb.productionBatch.productionDate),
                        'MMM d, yyyy'
                      )}
                    </span>
                    <span className="text-[var(--muted-foreground)]">
                      {pb.quantityTonnes.toFixed(2)} tonnes from this
                      batch
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-[var(--muted-foreground)]">
                No production batches linked.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Evidence Files</CardTitle>
          </CardHeader>
          <CardContent>
            {event.evidence.length > 0 ? (
              <div className="grid gap-2">
                {event.evidence.map((file) => (
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

        {event.notes && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{event.notes}</p>
            </CardContent>
          </Card>
        )}

        {event.bcuEvents.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">BCUs Issued</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {event.bcuEvents.map((bcuEvent) => (
                  <Link
                    key={bcuEvent.bcu.id}
                    href={`/registry/${bcuEvent.bcu.id}`}
                    className="flex items-center justify-between border p-3 hover:bg-[var(--muted)]"
                  >
                    <span className="font-medium">
                      {bcuEvent.bcu.registrySerialNumber}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--muted-foreground)]">
                        {bcuEvent.bcu.quantityTonnesCO2e.toFixed(2)} tCO2e
                      </span>
                      <Badge
                        variant={
                          bcuEvent.bcu.status === 'retired'
                            ? 'secondary'
                            : bcuEvent.bcu.status === 'transferred'
                              ? 'outline'
                              : 'default'
                        }
                      >
                        {bcuEvent.bcu.status}
                      </Badge>
                    </div>
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
