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
import {
  Beaker,
  CheckCircle2,
  Circle,
  XCircle,
  Award,
  Leaf,
  Factory,
  ArrowDownToLine,
  ChevronRight,
} from 'lucide-react';

async function getProductionBatch(id: string) {
  return db.productionBatch.findUnique({
    where: { id },
    include: {
      evidence: true,
      labTests: {
        select: {
          id: true,
          labName: true,
          testDate: true,
          organicCarbonPercent: true,
          hydrogenPercent: true,
          hCorgRatio: true,
        },
        orderBy: { testDate: 'desc' },
      },
      feedstockDelivery: {
        select: {
          id: true,
          date: true,
          feedstockType: true,
          weightTonnes: true,
          puroCategory: true,
          puroCategoryName: true,
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
              puroCategory: true,
              puroCategoryName: true,
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
      corcBatches: {
        include: {
          corc: {
            select: { id: true, serialNumber: true, status: true },
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

        {/* Puro Quality Parameters */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Beaker className="h-5 w-5" />
              Puro Quality Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* H/C_org Ratio - Key quality indicator */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--muted-foreground)]">H/C_org Ratio</span>
                  {batch.hCorgRatio !== null ? (
                    <Badge variant={batch.hCorgRatio <= 0.7 ? 'default' : 'destructive'}>
                      {batch.hCorgRatio <= 0.7 ? 'PASS' : 'FAIL'}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Not Set</Badge>
                  )}
                </div>
                <p className="text-2xl font-bold">
                  {batch.hCorgRatio?.toFixed(3) ?? '—'}
                </p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Threshold: ≤ 0.7 for CORC eligibility
                </p>
              </div>

              {/* Carbon & Hydrogen Content */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Organic Carbon</span>
                  <span className="font-medium">
                    {batch.organicCarbonPercent?.toFixed(1) ?? '—'}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Hydrogen</span>
                  <span className="font-medium">
                    {batch.hydrogenPercent?.toFixed(2) ?? '—'}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Validation Status</span>
                  <Badge variant={batch.qualityValidationStatus === 'validated' ? 'default' : 'outline'}>
                    {batch.qualityValidationStatus?.replace(/_/g, ' ') ?? 'Pending'}
                  </Badge>
                </div>
              </div>

              {/* Lab Tests */}
              <div className="md:col-span-2">
                <p className="text-sm font-medium mb-2">Lab Tests</p>
                {batch.labTests.length > 0 ? (
                  <div className="space-y-2">
                    {batch.labTests.map((test) => (
                      <div
                        key={test.id}
                        className="flex items-center justify-between p-3 border rounded hover:bg-[var(--muted)] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Beaker className="h-4 w-4 text-[var(--muted-foreground)]" />
                          <div>
                            <p className="font-medium text-sm">{test.labName || 'Lab Test'}</p>
                            <p className="text-xs text-[var(--muted-foreground)]">
                              {test.testDate ? formatDateTime(test.testDate) : 'Date unknown'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {test.hCorgRatio !== null && (
                            <Badge
                              variant={test.hCorgRatio <= 0.7 ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              H/C: {test.hCorgRatio.toFixed(3)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--muted-foreground)] p-3 border rounded border-dashed text-center">
                    No lab tests on file. Lab testing is required for CORC issuance.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CORC Eligibility Checklist */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5" />
              CORC Eligibility
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const hasLabTest = batch.labTests.length > 0;
              const qualityPassed = batch.hCorgRatio !== null && batch.hCorgRatio <= 0.7;
              const hasSequestration = batch.sequestrationBatches.length > 0;
              const includedInCORC = batch.corcBatches && batch.corcBatches.length > 0;

              const checks = [
                {
                  label: 'Quality validated (H/C_org ≤ 0.7)',
                  passed: qualityPassed,
                  detail: batch.hCorgRatio !== null ? `H/C_org = ${batch.hCorgRatio.toFixed(3)}` : 'Not measured',
                },
                {
                  label: 'Lab test on file',
                  passed: hasLabTest,
                  detail: hasLabTest ? `${batch.labTests.length} test(s) available` : 'No lab tests uploaded',
                },
                {
                  label: 'Linked to sequestration event',
                  passed: hasSequestration,
                  detail: hasSequestration ? `${batch.sequestrationBatches.length} event(s)` : 'Not yet sequestered',
                },
                {
                  label: 'Included in CORC issuance',
                  passed: includedInCORC,
                  detail: includedInCORC ? `CORC: ${batch.corcBatches[0].corc.serialNumber}` : 'Not yet included',
                },
              ];

              const passedCount = checks.filter(c => c.passed).length;

              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--muted)]/50">
                    <div className="text-2xl font-bold">{passedCount}/4</div>
                    <div>
                      <p className="text-sm font-medium">Eligibility Score</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {passedCount === 4 ? 'Ready for CORC' : 'Requirements incomplete'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {checks.map((check, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div className="flex items-center gap-2">
                          {check.passed ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-[var(--muted-foreground)]" />
                          )}
                          <span className="text-sm">{check.label}</span>
                        </div>
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {check.detail}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Data Lineage */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Data Lineage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 overflow-x-auto py-2">
              {/* Feedstock */}
              <div className="flex items-center gap-1 px-3 py-2 bg-green-500/10 text-green-700 rounded text-sm">
                <Leaf className="h-4 w-4" />
                <span>Feedstock</span>
                <span className="text-xs opacity-70">
                  ({batch.feedstockAllocations.length || (batch.feedstockDelivery ? 1 : 0)})
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] flex-shrink-0" />

              {/* This Batch */}
              <div className="flex items-center gap-1 px-3 py-2 bg-blue-500 text-white rounded text-sm font-medium">
                <Factory className="h-4 w-4" />
                <span>This Batch</span>
              </div>
              <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] flex-shrink-0" />

              {/* Sequestration */}
              <div className={`flex items-center gap-1 px-3 py-2 rounded text-sm ${
                batch.sequestrationBatches.length > 0
                  ? 'bg-purple-500/10 text-purple-700'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
              }`}>
                <ArrowDownToLine className="h-4 w-4" />
                <span>Sequestration</span>
                {batch.sequestrationBatches.length > 0 && (
                  <span className="text-xs opacity-70">({batch.sequestrationBatches.length})</span>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] flex-shrink-0" />

              {/* CORC */}
              <div className={`flex items-center gap-1 px-3 py-2 rounded text-sm ${
                batch.corcBatches && batch.corcBatches.length > 0
                  ? 'bg-emerald-500/10 text-emerald-700'
                  : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
              }`}>
                <Award className="h-4 w-4" />
                <span>CORC</span>
                {batch.corcBatches && batch.corcBatches.length > 0 && (
                  <span className="text-xs opacity-70">({batch.corcBatches.length})</span>
                )}
              </div>
            </div>

            {/* CORC Links */}
            {batch.corcBatches && batch.corcBatches.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <p className="text-sm font-medium mb-2">Linked CORCs</p>
                <div className="space-y-2">
                  {batch.corcBatches.map((cb) => (
                    <Link
                      key={cb.corc.id}
                      href={`/corc/${cb.corc.id}`}
                      className="flex items-center justify-between p-2 border rounded hover:bg-[var(--muted)] transition-colors"
                    >
                      <span className="font-mono text-sm">{cb.corc.serialNumber}</span>
                      <Badge variant={cb.corc.status === 'issued' ? 'default' : 'outline'}>
                        {cb.corc.status}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
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
