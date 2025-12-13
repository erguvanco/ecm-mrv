export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Calendar,
  Building2,
  Factory,
  ArrowDownToLine,
  Award,
  Calculator,
  CheckCircle,
  Clock,
  ChevronRight,
  AlertCircle,
  FileText,
  Beaker,
} from 'lucide-react';
import db from '@/lib/db';
import { PageContainer, PageHeader } from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from '@/components/ui';

interface MonitoringPeriodData {
  id: string;
  periodStart: Date;
  periodEnd: Date;
  status: string;
  calculatedAt: Date | null;
  // CORC calculation fields
  cStoredTCO2e: number | null;
  cBaselineTCO2e: number | null;
  cLossTCO2e: number | null;
  persistenceFractionPercent: number | null;
  eProjectTCO2e: number | null;
  eLeakageTCO2e: number | null;
  netCORCsTCO2e: number | null;
  facility: {
    id: string;
    name: string;
    registrationNumber: string | null;
  };
  corcIssuances: Array<{
    id: string;
    serialNumber: string;
    status: string;
    netCORCsTCO2e: number | null;
    permanenceType: string | null;
    issuanceDate: Date | null;
  }>;
}

interface ProductionBatchData {
  id: string;
  serialNumber: number;
  productionDate: Date;
  status: string;
  outputBiocharWeightTonnes: number;
  hCorgRatio: number | null;
  qualityValidationStatus: string | null;
  labTests: Array<{
    id: string;
    labName: string | null;
  }>;
}

interface SequestrationEventData {
  id: string;
  sequestrationType: string;
  finalDeliveryDate: Date;
  batches: Array<{ quantityTonnes: number }>;
  endUseCategory: string | null;
  persistenceFractionPercent: number | null;
  meanAnnualSoilTempC: number | null;
}

async function getMonitoringPeriod(id: string): Promise<{
  period: MonitoringPeriodData | null;
  productionBatches: ProductionBatchData[];
  sequestrationEvents: SequestrationEventData[];
}> {
  const period = await db.monitoringPeriod.findUnique({
    where: { id },
    include: {
      facility: {
        select: {
          id: true,
          name: true,
          registrationNumber: true,
        },
      },
      corcIssuances: {
        select: {
          id: true,
          serialNumber: true,
          status: true,
          netCORCsTCO2e: true,
          permanenceType: true,
          issuanceDate: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!period) {
    return { period: null, productionBatches: [], sequestrationEvents: [] };
  }

  // Get production batches within this period
  const productionBatches = await db.productionBatch.findMany({
    where: {
      facilityId: period.facilityId,
      productionDate: {
        gte: period.periodStart,
        lte: period.periodEnd,
      },
    },
    select: {
      id: true,
      serialNumber: true,
      productionDate: true,
      status: true,
      outputBiocharWeightTonnes: true,
      hCorgRatio: true,
      qualityValidationStatus: true,
      labTests: {
        select: {
          id: true,
          labName: true,
        },
      },
    },
    orderBy: { productionDate: 'desc' },
  });

  // Get sequestration events within this period
  const sequestrationEvents = await db.sequestrationEvent.findMany({
    where: {
      finalDeliveryDate: {
        gte: period.periodStart,
        lte: period.periodEnd,
      },
    },
    select: {
      id: true,
      sequestrationType: true,
      finalDeliveryDate: true,
      batches: {
        select: { quantityTonnes: true },
      },
      endUseCategory: true,
      persistenceFractionPercent: true,
      meanAnnualSoilTempC: true,
    },
    orderBy: { finalDeliveryDate: 'desc' },
  });

  return { period, productionBatches, sequestrationEvents };
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: 'default' | 'secondary' | 'outline'; icon: typeof Clock }> = {
    active: { variant: 'default', icon: Clock },
    closed: { variant: 'outline', icon: CheckCircle },
    verified: { variant: 'secondary', icon: Award },
  };

  const { variant, icon: Icon } = config[status] || config.active;

  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function CalculationBreakdownCard({ period }: { period: MonitoringPeriodData }) {
  const hasCalculation = period.cStoredTCO2e !== null;

  if (!hasCalculation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            CORC Calculation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-3">
              <AlertCircle className="h-6 w-6 text-amber-500" />
            </div>
            <p className="text-sm font-medium mb-1">Not Yet Calculated</p>
            <p className="text-xs text-[var(--muted-foreground)] mb-4 max-w-xs">
              Run the CORC calculation to see the carbon accounting breakdown for this monitoring period.
            </p>
            <Link href={`/lca?periodId=${period.id}`}>
              <Button size="sm">
                <Calculator className="h-4 w-4 mr-2" />
                Calculate CORCs
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const breakdown = [
    { label: 'C_stored', value: period.cStoredTCO2e, color: 'text-emerald-600', bg: 'bg-emerald-500' },
    { label: 'C_baseline', value: -(period.cBaselineTCO2e ?? 0), color: 'text-red-500', bg: 'bg-red-400' },
    { label: 'C_loss', value: -(period.cLossTCO2e ?? 0), color: 'text-red-500', bg: 'bg-red-400' },
    { label: 'E_project', value: -(period.eProjectTCO2e ?? 0), color: 'text-orange-500', bg: 'bg-orange-400' },
    { label: 'E_leakage', value: -(period.eLeakageTCO2e ?? 0), color: 'text-orange-500', bg: 'bg-orange-400' },
  ];

  const maxValue = Math.max(period.cStoredTCO2e ?? 0, 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          CORC Calculation Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formula */}
        <div className="p-3 bg-[var(--muted)]/50 rounded text-sm font-mono text-center">
          CORCs = C_stored - C_baseline - C_loss - E_project - E_leakage
        </div>

        {/* Waterfall visualization */}
        <div className="space-y-2">
          {breakdown.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="w-20 text-xs text-[var(--muted-foreground)] text-right">{item.label}</span>
              <div className="flex-1 h-6 bg-[var(--muted)]/30 rounded relative overflow-hidden">
                <div
                  className={`absolute top-0 h-full ${item.bg} rounded transition-all`}
                  style={{
                    width: `${Math.abs(item.value ?? 0) / maxValue * 100}%`,
                    left: item.value && item.value > 0 ? '0%' : 'auto',
                    right: item.value && item.value < 0 ? '0%' : 'auto',
                    opacity: item.value && item.value < 0 ? 0.6 : 1,
                  }}
                />
              </div>
              <span className={`w-20 text-sm font-medium ${item.color}`}>
                {item.value && item.value > 0 ? '+' : ''}{(item.value ?? 0).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Persistence fraction */}
        {period.persistenceFractionPercent !== null && (
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
            <span className="text-sm text-[var(--muted-foreground)]">Persistence Fraction</span>
            <Badge variant="outline">{period.persistenceFractionPercent.toFixed(1)}%</Badge>
          </div>
        )}

        {/* Net CORCs */}
        <div className="flex items-center justify-between pt-4 border-t-2 border-[var(--border)]">
          <span className="font-medium">Net CORCs</span>
          <span className="text-xl font-bold text-emerald-600">
            {period.netCORCsTCO2e?.toFixed(2) ?? '0'} <span className="text-sm font-normal">tCO2e</span>
          </span>
        </div>

        {period.calculatedAt && (
          <p className="text-xs text-[var(--muted-foreground)] text-center">
            Last calculated: {format(period.calculatedAt, 'MMM d, yyyy HH:mm')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default async function MonitoringPeriodDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { period, productionBatches, sequestrationEvents } = await getMonitoringPeriod(id);

  if (!period) {
    notFound();
  }

  const totalBiocharProduced = productionBatches.reduce((sum, b) => sum + b.outputBiocharWeightTonnes, 0);
  const totalBiocharSequestered = sequestrationEvents.reduce((sum, e) => sum + e.batches.reduce((bSum, b) => bSum + b.quantityTonnes, 0), 0);
  const qualifiedBatches = productionBatches.filter(b => b.hCorgRatio !== null && b.hCorgRatio <= 0.7);
  const issuedCORCs = period.corcIssuances.filter(c => c.status === 'issued' || c.status === 'retired');

  return (
    <PageContainer>
      <PageHeader
        title="Monitoring Period"
        description={`${format(period.periodStart, 'MMM d, yyyy')} - ${format(period.periodEnd, 'MMM d, yyyy')}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Monitoring', href: '/monitoring' },
          { label: 'Period Details' },
        ]}
        action={
          period.status === 'active' ? (
            <Link href={`/lca?periodId=${period.id}`}>
              <Button>
                <Calculator className="h-4 w-4 mr-2" />
                Calculate CORCs
              </Button>
            </Link>
          ) : undefined
        }
      />

      {/* Status & Facility Header */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Period Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Status</span>
              <StatusBadge status={period.status} />
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Start Date</span>
              <span className="font-medium">{format(period.periodStart, 'MMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">End Date</span>
              <span className="font-medium">{format(period.periodEnd, 'MMM d, yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Duration</span>
              <span className="font-medium">
                {Math.ceil((period.periodEnd.getTime() - period.periodStart.getTime()) / (1000 * 60 * 60 * 24))} days
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Facility
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Name</span>
              <Link href={`/facility`} className="font-medium text-[var(--primary)] hover:underline">
                {period.facility.name}
              </Link>
            </div>
            {period.facility.registrationNumber && (
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Registration</span>
                <span className="font-mono text-sm">{period.facility.registrationNumber}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-3 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Factory className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{productionBatches.length}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Production Batches</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <ArrowDownToLine className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sequestrationEvents.length}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Sequestration Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Beaker className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{qualifiedBatches.length}/{productionBatches.length}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Quality Validated</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Award className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{issuedCORCs.length}</p>
                <p className="text-xs text-[var(--muted-foreground)]">CORCs Issued</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* CORC Calculation Breakdown */}
        <CalculationBreakdownCard period={period} />

        {/* Issued CORCs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5" />
              CORCs from this Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            {period.corcIssuances.length > 0 ? (
              <div className="space-y-2">
                {period.corcIssuances.map((corc) => (
                  <Link
                    key={corc.id}
                    href={`/corc/${corc.id}`}
                    className="flex items-center justify-between p-3 border rounded hover:bg-[var(--muted)] transition-colors"
                  >
                    <div>
                      <p className="font-medium font-mono text-sm">{corc.serialNumber}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {corc.permanenceType?.replace(/_/g, ' ')} • {corc.issuanceDate ? format(corc.issuanceDate, 'MMM d, yyyy') : 'Pending'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold">{corc.netCORCsTCO2e?.toFixed(2) ?? '—'}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">tCO2e</p>
                      </div>
                      <Badge
                        variant={
                          corc.status === 'issued' ? 'default' :
                          corc.status === 'retired' ? 'secondary' : 'outline'
                        }
                      >
                        {corc.status}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-8 w-8 text-[var(--muted-foreground)] mb-2" />
                <p className="text-sm text-[var(--muted-foreground)]">No CORCs issued yet</p>
                {period.netCORCsTCO2e && period.netCORCsTCO2e > 0 && (
                  <Link href={`/corc/new?periodId=${period.id}`} className="mt-3">
                    <Button size="sm" variant="outline">
                      <Award className="h-4 w-4 mr-2" />
                      Issue CORC
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Production Batches */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Factory className="h-5 w-5" />
            Production Batches ({productionBatches.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {productionBatches.length > 0 ? (
            <div className="space-y-2">
              {productionBatches.map((batch) => {
                const hasLabTest = batch.labTests.length > 0;
                const qualityPassed = batch.hCorgRatio !== null && batch.hCorgRatio <= 0.7;

                return (
                  <Link
                    key={batch.id}
                    href={`/production/${batch.id}`}
                    className="flex items-center justify-between p-3 border rounded hover:bg-[var(--muted)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">
                          {batch.serialNumber || format(batch.productionDate, 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {batch.outputBiocharWeightTonnes.toFixed(2)}t biochar
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {batch.hCorgRatio !== null && (
                        <Badge variant={qualityPassed ? 'default' : 'destructive'} className="text-xs">
                          H/C: {batch.hCorgRatio.toFixed(2)}
                        </Badge>
                      )}
                      {hasLabTest && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Beaker className="h-3 w-3" />
                          Lab Test
                        </Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
                    </div>
                  </Link>
                );
              })}
              <div className="flex justify-between items-center pt-3 mt-3 border-t border-[var(--border)]">
                <span className="text-sm font-medium">Total Biochar Produced</span>
                <span className="font-bold">{totalBiocharProduced.toFixed(2)} tonnes</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-8">
              No production batches in this period
            </p>
          )}
        </CardContent>
      </Card>

      {/* Sequestration Events */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowDownToLine className="h-5 w-5" />
            Sequestration Events ({sequestrationEvents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sequestrationEvents.length > 0 ? (
            <div className="space-y-2">
              {sequestrationEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/sequestration/${event.id}`}
                  className="flex items-center justify-between p-3 border rounded hover:bg-[var(--muted)] transition-colors"
                >
                  <div>
                    <p className="font-medium">
                      {event.sequestrationType.replace(/_/g, ' ')} - {format(event.finalDeliveryDate, 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {event.endUseCategory?.replace(/_/g, ' ') ?? 'Unclassified'} • {event.batches.reduce((sum, b) => sum + b.quantityTonnes, 0).toFixed(2)}t
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {event.persistenceFractionPercent !== null && (
                      <Badge variant="outline" className="text-xs">
                        {event.persistenceFractionPercent.toFixed(1)}% persistence
                      </Badge>
                    )}
                    {event.meanAnnualSoilTempC !== null && (
                      <Badge variant="outline" className="text-xs">
                        {event.meanAnnualSoilTempC}°C soil
                      </Badge>
                    )}
                    <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
                  </div>
                </Link>
              ))}
              <div className="flex justify-between items-center pt-3 mt-3 border-t border-[var(--border)]">
                <span className="text-sm font-medium">Total Biochar Sequestered</span>
                <span className="font-bold">{totalBiocharSequestered.toFixed(2)} tonnes</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-8">
              No sequestration events in this period
            </p>
          )}
        </CardContent>
      </Card>

    </PageContainer>
  );
}
