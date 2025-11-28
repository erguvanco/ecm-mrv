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
import { BCU_STATUSES } from '@/lib/validations/bcu';
import { BCUActions } from '@/components/registry';

async function getBCU(id: string) {
  return db.bCU.findUnique({
    where: { id },
    include: {
      evidence: true,
      sequestrationEvent: {
        include: {
          productionBatches: {
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
        },
      },
    },
  });
}

export default async function BCUDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bcu = await getBCU(id);

  if (!bcu) {
    notFound();
  }

  const statusInfo = BCU_STATUSES.find((s) => s.value === bcu.status);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'issued':
        return 'default';
      case 'transferred':
        return 'outline';
      case 'retired':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="BCU Details"
        description={`Serial: ${bcu.registrySerialNumber}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Registry', href: '/registry' },
          { label: 'Details' },
        ]}
        action={<BCUActions bcuId={bcu.id} status={bcu.status} />}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">QR Code</CardTitle>
          </CardHeader>
          <CardContent>
            <QRDisplay
              entityType="registry"
              entityId={bcu.id}
              entityLabel={`BCU - ${bcu.registrySerialNumber}`}
              size="md"
              showActions
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">BCU Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Serial Number</span>
              <span className="font-mono text-sm">
                {bcu.registrySerialNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Quantity</span>
              <span className="font-medium">
                {bcu.quantityTonnesCO2e.toFixed(2)} tCO2e
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Issuance Date</span>
              <span className="font-medium">
                {format(new Date(bcu.issuanceDate), 'MMM d, yyyy')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Status</span>
              <Badge variant={getStatusBadgeVariant(bcu.status)}>
                {statusInfo?.label || bcu.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ownership</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Current Owner</span>
              <span className="font-medium">{bcu.ownerName || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Account ID</span>
              <span className="font-medium">{bcu.accountId || '-'}</span>
            </div>
            {bcu.status === 'retired' && (
              <>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">
                    Retirement Date
                  </span>
                  <span className="font-medium">
                    {bcu.retirementDate
                      ? format(new Date(bcu.retirementDate), 'MMM d, yyyy')
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">
                    Beneficiary
                  </span>
                  <span className="font-medium">
                    {bcu.retirementBeneficiary || '-'}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {bcu.sequestrationEvent && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">
                Linked Sequestration Event
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/sequestration/${bcu.sequestrationEvent.id}`}
                className="flex items-center justify-between border p-4 hover:bg-[var(--muted)]"
              >
                <div>
                  <p className="font-medium">
                    Delivery:{' '}
                    {format(
                      new Date(bcu.sequestrationEvent.finalDeliveryDate),
                      'MMM d, yyyy'
                    )}
                  </p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {bcu.sequestrationEvent.sequestrationType} •{' '}
                    {bcu.sequestrationEvent.deliveryPostcode}
                  </p>
                </div>
                <Badge variant="outline">
                  {bcu.sequestrationEvent.productionBatches.length} batch
                  {bcu.sequestrationEvent.productionBatches.length !== 1
                    ? 'es'
                    : ''}
                </Badge>
              </Link>

              {bcu.sequestrationEvent.productionBatches.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-[var(--muted-foreground)]">
                    Production Batches:
                  </p>
                  {bcu.sequestrationEvent.productionBatches.map((pb) => (
                    <Link
                      key={pb.id}
                      href={`/production/${pb.productionBatch.id}`}
                      className="flex items-center justify-between border p-3 hover:bg-[var(--muted)]"
                    >
                      <span>
                        {format(
                          new Date(pb.productionBatch.productionDate),
                          'MMM d, yyyy'
                        )}
                      </span>
                      <span className="text-[var(--muted-foreground)]">
                        {pb.quantityTonnes.toFixed(2)} tonnes
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Evidence Files</CardTitle>
          </CardHeader>
          <CardContent>
            {bcu.evidence.length > 0 ? (
              <div className="grid gap-2">
                {bcu.evidence.map((file) => (
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
                No evidence files attached.
              </p>
            )}
          </CardContent>
        </Card>

        {bcu.notes && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{bcu.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
