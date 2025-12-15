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
import {
  Leaf,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  TreeDeciduous,
  Recycle,
} from 'lucide-react';

// Puro biomass categories for display
const PURO_CATEGORY_INFO: Record<string, { name: string; description: string }> = {
  A: { name: 'Forestry residues', description: 'Harvesting & processing residues' },
  B: { name: 'Forest thinnings', description: 'Sustainable forest management' },
  C: { name: 'Non-renewable natural forests', description: 'Non-renewable timber' },
  D: { name: 'Salvaged timber', description: 'Fire, storm, pest damaged wood' },
  E: { name: 'Dedicated crops', description: 'SRC, energy crops with LUC' },
  F: { name: 'Dedicated crops (no LUC)', description: 'SRC, energy crops without LUC' },
  G: { name: 'Agricultural residues', description: 'Straw, husks, stalks' },
  H: { name: 'Animal residues', description: 'Manure, slurry' },
  I: { name: 'Food waste', description: 'Organic food processing waste' },
  J: { name: 'MSW biogenic', description: 'Municipal solid waste biogenic fraction' },
  K: { name: 'Industrial byproducts', description: 'Paper sludge, distillery waste' },
  L: { name: 'Invasive species', description: 'Removed invasive biomass' },
  M: { name: 'Peat', description: 'Extracted peat' },
  N: { name: 'Algae/seaweed', description: 'Aquatic biomass' },
  O: { name: 'Other', description: 'Other eligible biomass' },
};

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
      productionAllocations: {
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

        {/* Puro Biomass Category */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Leaf className="h-5 w-5" />
              Puro Biomass Classification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Category */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <TreeDeciduous className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Biomass Category</span>
                </div>
                {feedstock.puroCategory ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default" className="text-lg px-3 py-1">
                        {feedstock.puroCategory}
                      </Badge>
                      <span className="font-medium">
                        {feedstock.puroCategoryName || PURO_CATEGORY_INFO[feedstock.puroCategory]?.name || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {PURO_CATEGORY_INFO[feedstock.puroCategory]?.description || 'Puro.earth biomass category'}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-[var(--muted-foreground)]">Not classified</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">
                      Set biomass category for CORC eligibility
                    </p>
                  </div>
                )}
              </div>

              {/* iLUC Risk & Source Classification */}
              <div className="p-4 border rounded-lg space-y-4">
                {/* iLUC Risk Level */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[var(--muted-foreground)]">iLUC Risk Level</span>
                    {feedstock.ilucRiskLevel ? (
                      <Badge
                        variant={feedstock.ilucRiskLevel === 'LOW' ? 'default' : 'destructive'}
                        className="gap-1"
                      >
                        {feedstock.ilucRiskLevel === 'LOW' ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        {feedstock.ilucRiskLevel}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Not Set</Badge>
                    )}
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Indirect Land Use Change risk assessment
                  </p>
                </div>

                {/* Source Classification */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[var(--muted-foreground)]">Source Classification</span>
                    {feedstock.sourceClassification ? (
                      <Badge variant="outline" className="gap-1">
                        <Recycle className="h-3 w-3" />
                        {feedstock.sourceClassification.replace(/_/g, ' ')}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Not Set</Badge>
                    )}
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    RESIDUE, WASTE, or DEDICATED_CROP
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sustainability Certification */}
        {(feedstock.sustainabilityCertification || feedstock.certificationNumber) && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Sustainability Certification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-[var(--muted-foreground)] mb-1">Certification Type</p>
                  <p className="font-medium">
                    {feedstock.sustainabilityCertification?.replace(/_/g, ' ') || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[var(--muted-foreground)] mb-1">Certificate Number</p>
                  <p className="font-mono text-sm">
                    {feedstock.certificationNumber || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[var(--muted-foreground)] mb-1">Expiry Date</p>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {feedstock.certificationExpiry
                        ? formatDateTime(feedstock.certificationExpiry)
                        : '—'}
                    </span>
                    {feedstock.certificationExpiry && (
                      <Badge
                        variant={
                          new Date(feedstock.certificationExpiry) > new Date()
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {new Date(feedstock.certificationExpiry) > new Date() ? 'Valid' : 'Expired'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Production Batches (via allocations or legacy link) */}
        {(feedstock.productionAllocations.length > 0 || feedstock.productionBatches.length > 0) && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">
                Linked Production Batches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {/* New allocation-based links */}
                {feedstock.productionAllocations.map((allocation) => (
                  <Link
                    key={allocation.productionBatch.id}
                    href={`/production/${allocation.productionBatch.id}`}
                    className="flex items-center justify-between border p-3 hover:bg-[var(--muted)] rounded"
                  >
                    <div>
                      <span className="font-medium">
                        {formatDateTime(allocation.productionBatch.productionDate)}
                      </span>
                      <span className="text-sm text-[var(--muted-foreground)] ml-2">
                        ({allocation.percentageUsed}% of this feedstock)
                      </span>
                    </div>
                    <span className="text-[var(--muted-foreground)]">
                      {allocation.productionBatch.outputBiocharWeightTonnes?.toFixed(2) || '-'} tonnes output
                    </span>
                  </Link>
                ))}
                {/* Legacy direct links (fallback) */}
                {feedstock.productionAllocations.length === 0 &&
                  feedstock.productionBatches.map((batch) => (
                    <Link
                      key={batch.id}
                      href={`/production/${batch.id}`}
                      className="flex items-center justify-between border p-3 hover:bg-[var(--muted)] rounded"
                    >
                      <span className="font-medium">
                        {formatDateTime(batch.productionDate)}
                      </span>
                      <span className="text-[var(--muted-foreground)]">
                        {batch.outputBiocharWeightTonnes?.toFixed(2) || '-'} tonnes output
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
