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
import { ENERGY_SCOPES, ENERGY_TYPES, ENERGY_UNITS } from '@/lib/validations/energy';

async function getEnergyUsage(id: string) {
  return db.energyUsage.findUnique({
    where: { id },
    include: {
      evidence: true,
      productionBatch: {
        select: {
          id: true,
          productionDate: true,
          outputBiocharWeightTonnes: true,
        },
      },
    },
  });
}

export default async function EnergyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const energyUsage = await getEnergyUsage(id);

  if (!energyUsage) {
    notFound();
  }

  const scopeLabel =
    ENERGY_SCOPES.find((s) => s.value === energyUsage.scope)?.label ||
    energyUsage.scope;

  const typeLabel =
    ENERGY_TYPES.find((t) => t.value === energyUsage.energyType)?.label ||
    energyUsage.energyType;

  const unitLabel =
    ENERGY_UNITS.find((u) => u.value === energyUsage.unit)?.label ||
    energyUsage.unit;

  return (
    <PageContainer>
      <PageHeader
        title="Energy Usage Details"
        description={`${typeLabel} usage from ${format(new Date(energyUsage.periodStart), 'MMM d')} to ${format(new Date(energyUsage.periodEnd), 'MMM d, yyyy')}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Energy', href: '/energy' },
          { label: 'Details' },
        ]}
        action={
          <Link href={`/energy/${id}/edit`}>
            <Button>Edit Record</Button>
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
              entityType="energy"
              entityId={energyUsage.id}
              entityLabel={`Energy Usage - ${typeLabel}`}
              size="md"
              showActions
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Usage Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Scope</span>
              <Badge variant="secondary">{scopeLabel}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Energy Type</span>
              <span className="font-medium">{typeLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Quantity</span>
              <span className="font-medium">
                {energyUsage.quantity.toFixed(2)} {unitLabel}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Measurement Period</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Start Date</span>
              <span className="font-medium">
                {format(new Date(energyUsage.periodStart), 'MMM d, yyyy')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">End Date</span>
              <span className="font-medium">
                {format(new Date(energyUsage.periodEnd), 'MMM d, yyyy')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Duration</span>
              <span className="font-medium">
                {Math.ceil(
                  (new Date(energyUsage.periodEnd).getTime() -
                    new Date(energyUsage.periodStart).getTime()) /
                    (1000 * 60 * 60 * 24)
                )}{' '}
                days
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Evidence Files</CardTitle>
          </CardHeader>
          <CardContent>
            {energyUsage.evidence.length > 0 ? (
              <div className="grid gap-2">
                {energyUsage.evidence.map((file) => (
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

        {energyUsage.notes && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{energyUsage.notes}</p>
            </CardContent>
          </Card>
        )}

        {energyUsage.productionBatch && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Linked Production Batch</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/production/${energyUsage.productionBatch.id}`}
                className="flex items-center justify-between border p-3 hover:bg-[var(--muted)]"
              >
                <span className="font-medium">
                  {format(
                    new Date(energyUsage.productionBatch.productionDate),
                    'MMM d, yyyy'
                  )}
                </span>
                <span className="text-[var(--muted-foreground)]">
                  {energyUsage.productionBatch.outputBiocharWeightTonnes?.toFixed(
                    2
                  ) || '-'}{' '}
                  tonnes output
                </span>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
