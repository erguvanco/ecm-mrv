export const dynamic = 'force-dynamic';

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
import { SEQUESTRATION_TYPES, STORAGE_CONDITIONS } from '@/lib/validations/sequestration';
import {
  TreeDeciduous,
  Thermometer,
  Calculator,
  MapPin,
  Layers,
  ArrowDownToLine,
  Info,
} from 'lucide-react';

// End-use category descriptions
const END_USE_CATEGORY_INFO: Record<string, { name: string; description: string }> = {
  SOIL_AGRICULTURE: { name: 'Agricultural Soil', description: 'Applied to agricultural land for soil improvement' },
  SOIL_FORESTRY: { name: 'Forestry Soil', description: 'Applied to forest land' },
  SOIL_HORTICULTURE: { name: 'Horticultural Soil', description: 'Used in growing media and potting mixes' },
  SOIL_RESTORATION: { name: 'Land Restoration', description: 'Used for contaminated or degraded land restoration' },
  CONSTRUCTION_CONCRETE: { name: 'Concrete', description: 'Added to concrete and cement-based materials' },
  CONSTRUCTION_ASPHALT: { name: 'Asphalt', description: 'Added to asphalt and road materials' },
  CONSTRUCTION_OTHER: { name: 'Other Construction', description: 'Other construction applications' },
  INDUSTRIAL: { name: 'Industrial', description: 'Industrial filtration, metallurgy, etc.' },
  LANDFILL: { name: 'Controlled Landfill', description: 'Permanent disposal in engineered landfill' },
  OTHER: { name: 'Other', description: 'Other eligible sequestration method' },
};

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
              hCorgRatio: true,
              organicCarbonPercent: true,
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
      corcEvents: {
        include: {
          corc: {
            select: {
              id: true,
              serialNumber: true,
              status: true,
              netCORCsTCO2e: true,
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
        description={`Delivery on ${formatDateTime(event.finalDeliveryDate)}`}
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
              entityLabel={`Sequestration - ${formatDateTime(event.finalDeliveryDate)}`}
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
                {formatDateTime(event.finalDeliveryDate)}
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
                    ? formatDateTime(event.storageStartDate)
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">End Date</span>
                <span className="font-medium">
                  {event.storageEndDate
                    ? formatDateTime(event.storageEndDate)
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

        {/* End-Use Classification */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TreeDeciduous className="h-5 w-5" />
              End-Use Classification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* End-Use Category */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="h-5 w-5 text-purple-600" />
                  <span className="font-medium">Application Category</span>
                </div>
                {event.endUseCategory ? (
                  <div>
                    <Badge variant="default" className="mb-2">
                      {END_USE_CATEGORY_INFO[event.endUseCategory]?.name || event.endUseCategory.replace(/_/g, ' ')}
                    </Badge>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {END_USE_CATEGORY_INFO[event.endUseCategory]?.description || 'Puro.earth end-use category'}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-[var(--muted-foreground)]">Not classified</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">
                      Set end-use category for CORC eligibility
                    </p>
                  </div>
                )}
              </div>

              {/* Incorporation Details */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Incorporation Method</span>
                  <Badge variant="outline">
                    {event.incorporationMethod?.replace(/_/g, ' ') ?? 'Not specified'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Incorporation Depth</span>
                  <span className="font-medium">
                    {event.incorporationDepthCm ? `${event.incorporationDepthCm} cm` : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Notes</span>
                  <span className="font-medium text-sm text-right max-w-[200px] truncate">
                    {event.notes || '—'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Persistence Calculation */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              Persistence Calculation (BC+200)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              // Calculate average H/C_org from linked batches
              const batchesWithHC = event.batches.filter(b => b.productionBatch.hCorgRatio !== null);
              const avgHCorg = batchesWithHC.length > 0
                ? batchesWithHC.reduce((sum, b) => sum + (b.productionBatch.hCorgRatio ?? 0), 0) / batchesWithHC.length
                : null;

              return (
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Soil Temperature */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Thermometer className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-[var(--muted-foreground)]">Mean Annual Soil Temp</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {event.meanAnnualSoilTempC !== null ? `${event.meanAnnualSoilTempC}°C` : '—'}
                    </p>
                    {event.soilTempRegion && (
                      <Badge variant="outline" className="mt-2">
                        <MapPin className="h-3 w-3 mr-1" />
                        {event.soilTempRegion.replace(/_/g, ' ')}
                      </Badge>
                    )}
                  </div>

                  {/* H/C_org from linked batches */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-[var(--muted-foreground)]">Avg H/C_org from Batches</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {avgHCorg !== null ? avgHCorg.toFixed(3) : '—'}
                    </p>
                    {avgHCorg !== null && (
                      <Badge variant={avgHCorg <= 0.7 ? 'default' : 'destructive'} className="mt-2">
                        {avgHCorg <= 0.7 ? 'Eligible' : 'Above threshold'}
                      </Badge>
                    )}
                  </div>

                  {/* Persistence Fraction */}
                  <div className="p-4 border rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm text-emerald-700 dark:text-emerald-400">Persistence Fraction</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">
                      {event.persistenceFractionPercent !== null
                        ? `${event.persistenceFractionPercent.toFixed(1)}%`
                        : '—'}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-2">
                      Carbon remaining after 200 years
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Formula explanation */}
            <div className="mt-4 p-3 bg-[var(--muted)]/50 rounded text-sm">
              <p className="font-mono text-xs text-center text-[var(--muted-foreground)]">
                Persistence is calculated using the BC+200 model based on soil temperature and H/C_org ratio
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Carbon Accounting Preview */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5" />
              Carbon Accounting Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              // Calculate C_stored estimate
              const avgCorgPercent = event.batches.length > 0
                ? event.batches.reduce((sum, b) => sum + (b.productionBatch.organicCarbonPercent ?? 80), 0) / event.batches.length
                : 80;

              const grossCStored = totalQuantity * (avgCorgPercent / 100) * (44 / 12);
              const persistence = event.persistenceFractionPercent ?? 80;
              const netCStored = grossCStored * (persistence / 100);

              return (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 border rounded-lg text-center">
                      <p className="text-sm text-[var(--muted-foreground)] mb-1">Biochar Sequestered</p>
                      <p className="text-2xl font-bold">{totalQuantity.toFixed(2)}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">tonnes</p>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <p className="text-sm text-[var(--muted-foreground)] mb-1">Gross C_stored</p>
                      <p className="text-2xl font-bold">{grossCStored.toFixed(2)}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">tCO2e (before persistence)</p>
                    </div>
                    <div className="p-4 border rounded-lg text-center bg-emerald-50 dark:bg-emerald-950/20">
                      <p className="text-sm text-emerald-700 dark:text-emerald-400 mb-1">After Persistence</p>
                      <p className="text-2xl font-bold text-emerald-600">{netCStored.toFixed(2)}</p>
                      <p className="text-xs text-emerald-600/70">tCO2e ({persistence.toFixed(0)}% retained)</p>
                    </div>
                  </div>

                  <p className="text-xs text-center text-[var(--muted-foreground)]">
                    Estimates based on average organic carbon content of {avgCorgPercent.toFixed(0)}%
                  </p>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* CORCs from this sequestration */}
        {event.corcEvents && event.corcEvents.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Linked CORCs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {event.corcEvents.map((corcEvent) => (
                  <Link
                    key={corcEvent.corc.id}
                    href={`/corc/${corcEvent.corc.id}`}
                    className="flex items-center justify-between border p-3 hover:bg-[var(--muted)] rounded"
                  >
                    <span className="font-mono font-medium">
                      {corcEvent.corc.serialNumber}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--muted-foreground)]">
                        {corcEvent.corc.netCORCsTCO2e?.toFixed(2) ?? '—'} tCO2e
                      </span>
                      <Badge
                        variant={
                          corcEvent.corc.status === 'issued' ? 'default' :
                          corcEvent.corc.status === 'retired' ? 'secondary' : 'outline'
                        }
                      >
                        {corcEvent.corc.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
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
                      {formatDateTime(pb.productionBatch.productionDate)}
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
