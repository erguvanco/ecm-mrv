export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Award,
  Building2,
  Calendar,
  ChevronRight,
  Factory,
  Leaf,
  ArrowDownToLine,
  FileText,
  User,
  CheckCircle2,
  Circle,
  Beaker,
  Thermometer,
  TreeDeciduous,
} from 'lucide-react';
import db from '@/lib/db';
import { PageContainer, PageHeader } from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from '@/components/ui';

async function getCORC(id: string) {
  const corc = await db.cORCIssuance.findUnique({
    where: { id },
    include: {
      monitoringPeriod: {
        include: {
          facility: true,
        },
      },
      productionBatches: {
        include: {
          productionBatch: {
            include: {
              labTests: {
                select: {
                  id: true,
                  labName: true,
                  testDate: true,
                },
              },
              feedstockAllocations: {
                include: {
                  feedstockDelivery: {
                    select: {
                      id: true,
                      feedstockType: true,
                      puroCategory: true,
                      puroCategoryName: true,
                      weightTonnes: true,
                      date: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      sequestrationEvents: {
        include: {
          sequestration: true,
        },
      },
      evidence: true,
    },
  });

  return corc;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; className?: string }> = {
    draft: { variant: 'outline' },
    issued: { variant: 'default', className: 'bg-emerald-600' },
    retired: { variant: 'secondary' },
  };

  const { variant, className } = config[status] || config.draft;

  return (
    <Badge variant={variant} className={className}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

interface JourneyStage {
  id: string;
  label: string;
  icon: typeof Building2;
  completed: boolean;
  href?: string;
}

function CORCJourneyProgress({ stages }: { stages: JourneyStage[] }) {
  return (
    <div className="flex items-center gap-1 py-3 px-4 bg-[var(--muted)]/30 rounded-lg overflow-x-auto">
      {stages.map((stage, index) => {
        const Icon = stage.icon;
        const isLast = index === stages.length - 1;

        return (
          <div key={stage.id} className="flex items-center">
            {stage.href ? (
              <Link
                href={stage.href}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs transition-colors ${
                  stage.completed
                    ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80'
                }`}
              >
                {stage.completed ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Circle className="h-3.5 w-3.5" />
                )}
                <Icon className="h-3.5 w-3.5" />
                <span className="whitespace-nowrap">{stage.label}</span>
              </Link>
            ) : (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs ${
                  stage.completed
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                }`}
              >
                {stage.completed ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Circle className="h-3.5 w-3.5" />
                )}
                <Icon className="h-3.5 w-3.5" />
                <span className="whitespace-nowrap">{stage.label}</span>
              </div>
            )}
            {!isLast && (
              <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] mx-1 flex-shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function CalculationWaterfall({
  cStored,
  cBaseline,
  cLoss,
  eProject,
  eLeakage,
  netCORCs,
}: {
  cStored: number | null;
  cBaseline: number | null;
  cLoss: number | null;
  eProject: number | null;
  eLeakage: number | null;
  netCORCs: number | null;
}) {
  const items = [
    { label: 'C_stored', value: cStored ?? 0, type: 'positive' as const, description: 'Carbon stored in biochar' },
    { label: 'C_baseline', value: cBaseline ?? 0, type: 'negative' as const, description: 'Baseline emissions' },
    { label: 'C_loss', value: cLoss ?? 0, type: 'negative' as const, description: 'Carbon loss (1 - persistence)' },
    { label: 'E_project', value: eProject ?? 0, type: 'negative' as const, description: 'Project emissions' },
    { label: 'E_leakage', value: eLeakage ?? 0, type: 'negative' as const, description: 'Leakage emissions' },
  ];

  const maxValue = Math.max(cStored ?? 0, 1);

  return (
    <div className="space-y-3">
      {/* Formula */}
      <div className="p-3 bg-[var(--muted)]/50 rounded text-sm font-mono text-center">
        CORCs = C_stored - C_baseline - C_loss - E_project - E_leakage
      </div>

      {/* Bars */}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="group">
            <div className="flex items-center gap-3">
              <span className="w-20 text-xs text-[var(--muted-foreground)] text-right font-mono">
                {item.label}
              </span>
              <div className="flex-1 h-7 bg-[var(--muted)]/30 rounded relative overflow-hidden">
                <div
                  className={`absolute top-0 h-full rounded transition-all ${
                    item.type === 'positive' ? 'bg-emerald-500' : 'bg-red-400/70'
                  }`}
                  style={{
                    width: `${Math.min((item.value / maxValue) * 100, 100)}%`,
                  }}
                />
                <span className="absolute inset-0 flex items-center px-2 text-xs font-medium">
                  {item.type === 'positive' ? '+' : '-'}{item.value.toFixed(2)} tCO2e
                </span>
              </div>
            </div>
            <p className="text-[10px] text-[var(--muted-foreground)] ml-[92px] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {item.description}
            </p>
          </div>
        ))}
      </div>

      {/* Result */}
      <div className="flex items-center justify-between pt-4 border-t-2 border-[var(--border)]">
        <span className="font-semibold">Net CORCs</span>
        <div className="text-right">
          <span className="text-2xl font-bold text-emerald-600">{netCORCs?.toFixed(2) ?? '0'}</span>
          <span className="text-sm text-[var(--muted-foreground)] ml-1">tCO2e</span>
        </div>
      </div>
    </div>
  );
}

export default async function CORCDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const corc = await getCORC(id);

  if (!corc) {
    notFound();
  }

  // Extract unique feedstock sources from all production batches
  const feedstockSources = new Map<string, {
    id: string;
    type: string;
    puroCategory: string | null;
    categoryName: string | null;
    weight: number;
    date: Date;
  }>();

  corc.productionBatches.forEach((pb) => {
    pb.productionBatch.feedstockAllocations.forEach((fa) => {
      const fd = fa.feedstockDelivery;
      if (!feedstockSources.has(fd.id)) {
        feedstockSources.set(fd.id, {
          id: fd.id,
          type: fd.feedstockType,
          puroCategory: fd.puroCategory,
          categoryName: fd.puroCategoryName,
          weight: fd.weightTonnes ?? 0,
          date: fd.date,
        });
      }
    });
  });

  const journeyStages: JourneyStage[] = [
    {
      id: 'facility',
      label: 'Facility',
      icon: Building2,
      completed: true,
      href: '/facility',
    },
    {
      id: 'feedstock',
      label: 'Feedstock',
      icon: Leaf,
      completed: feedstockSources.size > 0,
      href: '/feedstock',
    },
    {
      id: 'production',
      label: 'Production',
      icon: Factory,
      completed: corc.productionBatches.length > 0,
      href: '/production',
    },
    {
      id: 'sequestration',
      label: 'Sequestration',
      icon: ArrowDownToLine,
      completed: corc.sequestrationEvents.length > 0,
      href: '/sequestration',
    },
    {
      id: 'monitoring',
      label: 'Monitoring',
      icon: Calendar,
      completed: corc.monitoringPeriod !== null,
      href: corc.monitoringPeriod ? `/monitoring/${corc.monitoringPeriod.id}` : undefined,
    },
    {
      id: 'corc',
      label: 'CORC',
      icon: Award,
      completed: corc.status === 'issued' || corc.status === 'retired',
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="CORC Certificate"
        description={corc.serialNumber}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'CORC Registry', href: '/corc' },
          { label: corc.serialNumber },
        ]}
      />

      {/* Journey Progress */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
            CORC Journey
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <CORCJourneyProgress stages={journeyStages} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Certificate Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5" />
              Certificate Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Serial Number</span>
              <span className="font-mono text-sm font-medium">{corc.serialNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Status</span>
              <StatusBadge status={corc.status} />
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Permanence Type</span>
              <Badge variant="outline">{corc.permanenceType?.replace(/_/g, ' ') ?? 'N/A'}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Issuance Date</span>
              <span className="font-medium">
                {corc.issuanceDate ? format(corc.issuanceDate, 'MMM d, yyyy') : 'Pending'}
              </span>
            </div>
            {corc.retirementDate && (
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Retirement Date</span>
                <span className="font-medium">{format(corc.retirementDate, 'MMM d, yyyy')}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Facility & Period */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Facility & Period
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Facility</span>
              <Link href="/facility" className="font-medium text-[var(--primary)] hover:underline">
                {corc.monitoringPeriod.facility.name}
              </Link>
            </div>
            {corc.monitoringPeriod.facility.registrationNumber && (
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Registration #</span>
                <span className="font-mono text-sm">{corc.monitoringPeriod.facility.registrationNumber}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Monitoring Period</span>
              <Link
                href={`/monitoring/${corc.monitoringPeriod.id}`}
                className="text-[var(--primary)] hover:underline"
              >
                {format(corc.monitoringPeriod.periodStart, 'MMM d')} - {format(corc.monitoringPeriod.periodEnd, 'MMM d, yyyy')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calculation Waterfall */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Carbon Accounting Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <CalculationWaterfall
            cStored={corc.cStoredTCO2e}
            cBaseline={corc.cBaselineTCO2e}
            cLoss={corc.cLossTCO2e}
            eProject={corc.eProjectTCO2e}
            eLeakage={corc.eLeakageTCO2e}
            netCORCs={corc.netCORCsTCO2e}
          />

          {/* Additional calculation details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-[var(--border)]">
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Persistence Fraction</p>
              <p className="text-lg font-semibold">{corc.persistenceFractionPercent?.toFixed(1) ?? '—'}%</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Production Batches</p>
              <p className="text-lg font-semibold">{corc.productionBatches.length}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Sequestration Events</p>
              <p className="text-lg font-semibold">{corc.sequestrationEvents.length}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">Feedstock Sources</p>
              <p className="text-lg font-semibold">{feedstockSources.size}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Source Data Traceability */}
      <div className="grid gap-6 lg:grid-cols-3 mt-6">
        {/* Feedstock Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Leaf className="h-4 w-4" />
              Feedstock Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feedstockSources.size > 0 ? (
              <div className="space-y-2">
                {Array.from(feedstockSources.values()).map((fs) => (
                  <Link
                    key={fs.id}
                    href={`/feedstock/${fs.id}`}
                    className="block p-2 border rounded hover:bg-[var(--muted)] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{fs.type.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-[var(--muted-foreground)]">{fs.weight.toFixed(1)}t</span>
                    </div>
                    {fs.puroCategory && (
                      <Badge variant="outline" className="text-[10px]">
                        {fs.puroCategory}: {fs.categoryName}
                      </Badge>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted-foreground)] text-center py-4">No feedstock data</p>
            )}
          </CardContent>
        </Card>

        {/* Production Batches */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Factory className="h-4 w-4" />
              Production Batches
            </CardTitle>
          </CardHeader>
          <CardContent>
            {corc.productionBatches.length > 0 ? (
              <div className="space-y-2">
                {corc.productionBatches.map((pb) => {
                  const batch = pb.productionBatch;
                  const hasLabTest = batch.labTests.length > 0;

                  return (
                    <Link
                      key={batch.id}
                      href={`/production/${batch.id}`}
                      className="block p-2 border rounded hover:bg-[var(--muted)] transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">
                          {format(batch.productionDate, 'MMM d, yyyy')}
                        </span>
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {batch.outputBiocharWeightTonnes.toFixed(1)}t
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {batch.hCorgRatio !== null && (
                          <Badge
                            variant={batch.hCorgRatio <= 0.7 ? 'default' : 'destructive'}
                            className="text-[10px]"
                          >
                            H/C: {batch.hCorgRatio.toFixed(2)}
                          </Badge>
                        )}
                        {hasLabTest && (
                          <Badge variant="outline" className="text-[10px] gap-0.5">
                            <Beaker className="h-2.5 w-2.5" />
                            Lab
                          </Badge>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted-foreground)] text-center py-4">No production data</p>
            )}
          </CardContent>
        </Card>

        {/* Sequestration Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowDownToLine className="h-4 w-4" />
              Sequestration Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {corc.sequestrationEvents.length > 0 ? (
              <div className="space-y-2">
                {corc.sequestrationEvents.map((se) => {
                  const event = se.sequestration;

                  return (
                    <Link
                      key={event.id}
                      href={`/sequestration/${event.id}`}
                      className="block p-2 border rounded hover:bg-[var(--muted)] transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">
                          {format(event.finalDeliveryDate, 'MMM d, yyyy')}
                        </span>
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {event.sequestrationType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {event.endUseCategory && (
                          <Badge variant="outline" className="text-[10px]">
                            <TreeDeciduous className="h-2.5 w-2.5 mr-0.5" />
                            {event.endUseCategory.replace(/_/g, ' ')}
                          </Badge>
                        )}
                        {event.meanAnnualSoilTempC !== null && (
                          <Badge variant="outline" className="text-[10px]">
                            <Thermometer className="h-2.5 w-2.5 mr-0.5" />
                            {event.meanAnnualSoilTempC}°C
                          </Badge>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted-foreground)] text-center py-4">No sequestration data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ownership & Retirement */}
      {(corc.retirementBeneficiary || corc.status === 'retired') && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Ownership & Retirement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {corc.retirementBeneficiary && (
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Beneficiary</span>
                <span className="font-medium">{corc.retirementBeneficiary}</span>
              </div>
            )}
            {corc.retirementDate && (
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Retired On</span>
                <span className="font-medium">{format(corc.retirementDate, 'MMM d, yyyy')}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Evidence */}
      {corc.evidence.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Evidence & Documentation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {corc.evidence.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <div>
                    <p className="font-medium text-sm">{file.fileName}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {file.category} • {(file.fileSize / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Badge variant="outline">{file.fileType}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {corc.notes && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{corc.notes}</p>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
