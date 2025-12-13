export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { format } from 'date-fns';
import {
  Award,
  Plus,
  ChevronRight,
  FileCheck,
  Clock,
  CheckCircle,
  Archive,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui';
import db from '@/lib/db';

async function getCORCData() {
  try {
    const corcs = await db.cORCIssuance.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        monitoringPeriod: {
          include: {
            facility: {
              select: {
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            productionBatches: true,
            sequestrationEvents: true,
            evidence: true,
          },
        },
      },
    });

    // Calculate totals
    const totals = {
      draft: corcs.filter(c => c.status === 'draft').reduce((sum, c) => sum + c.netCORCsTCO2e, 0),
      issued: corcs.filter(c => c.status === 'issued').reduce((sum, c) => sum + c.netCORCsTCO2e, 0),
      retired: corcs.filter(c => c.status === 'retired').reduce((sum, c) => sum + c.netCORCsTCO2e, 0),
      total: corcs.reduce((sum, c) => sum + c.netCORCsTCO2e, 0),
    };

    return { corcs, totals, error: null };
  } catch (error) {
    console.error('Error fetching CORC data:', error);
    return {
      corcs: [],
      totals: { draft: 0, issued: 0, retired: 0, total: 0 },
      error: 'Failed to load CORC registry'
    };
  }
}

export default async function CORCRegistryPage() {
  const { corcs, totals, error } = await getCORCData();

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-logo text-2xl tracking-tight">CORC Registry</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
              CO₂ Removal Certificates issued under Puro.earth methodology
            </p>
          </div>
        </div>
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Award className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Data</h3>
            <p className="text-sm text-[var(--muted-foreground)] text-center max-w-md">
              {error}. Please try refreshing the page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = {
    draft: { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-500/10', badgeVariant: 'outline' as const },
    issued: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', badgeVariant: 'default' as const },
    retired: { icon: Archive, color: 'text-violet-500', bg: 'bg-violet-500/10', badgeVariant: 'secondary' as const },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-logo text-2xl tracking-tight">CORC Registry</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            CO₂ Removal Certificates issued under Puro.earth methodology
          </p>
        </div>
        <Link href="/monitoring">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create from Monitoring Period
          </Button>
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-emerald-500/5 via-emerald-500/10 to-teal-500/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totals.total.toFixed(1)}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Total tCO₂e</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-slate-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totals.draft.toFixed(1)}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Draft tCO₂e</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totals.issued.toFixed(1)}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Issued tCO₂e</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-violet-500/10 flex items-center justify-center">
                <Archive className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totals.retired.toFixed(1)}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Retired tCO₂e</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CORCs List */}
      {corcs.length > 0 ? (
        <div className="space-y-3">
          {corcs.map((corc) => {
            const config = statusConfig[corc.status as keyof typeof statusConfig] || statusConfig.draft;
            const StatusIcon = config.icon;

            return (
              <Card key={corc.id} className="hover:border-[var(--foreground)]/20 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full ${config.bg} flex items-center justify-center`}>
                        <StatusIcon className={`h-5 w-5 ${config.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-mono font-medium">{corc.serialNumber}</p>
                          <Badge variant={config.badgeVariant}>
                            {corc.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {corc.permanenceType}
                          </Badge>
                        </div>
                        <p className="text-sm text-[var(--muted-foreground)]">
                          {corc.monitoringPeriod.facility.name} · {format(corc.monitoringPeriod.periodStart, 'MMM yyyy')} - {format(corc.monitoringPeriod.periodEnd, 'MMM yyyy')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-lg font-semibold">
                          {corc.netCORCsTCO2e.toFixed(2)} <span className="text-sm font-normal text-[var(--muted-foreground)]">tCO₂e</span>
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {corc._count.productionBatches} batches · {corc._count.sequestrationEvents} events
                        </p>
                      </div>
                      <Link href={`/corc/${corc.id}`}>
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* CORC Breakdown */}
                  <div className="mt-4 pt-4 border-t border-[var(--border)]">
                    <div className="grid grid-cols-6 gap-4 text-xs">
                      <div>
                        <p className="text-[var(--muted-foreground)]">C_stored</p>
                        <p className="font-medium">{corc.cStoredTCO2e.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-[var(--muted-foreground)]">C_baseline</p>
                        <p className="font-medium">-{corc.cBaselineTCO2e.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-[var(--muted-foreground)]">C_loss</p>
                        <p className="font-medium">-{corc.cLossTCO2e.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-[var(--muted-foreground)]">E_project</p>
                        <p className="font-medium">-{corc.eProjectTCO2e.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-[var(--muted-foreground)]">E_leakage</p>
                        <p className="font-medium">-{corc.eLeakageTCO2e.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-[var(--muted-foreground)]">Persistence</p>
                        <p className="font-medium">{corc.persistenceFractionPercent.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons for draft CORCs */}
                  {corc.status === 'draft' && (
                    <div className="mt-4 flex justify-end gap-2">
                      <Link href={`/corc/${corc.id}`}>
                        <Button variant="outline" size="sm">
                          <FileCheck className="h-3.5 w-3.5 mr-1.5" />
                          Review & Issue
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Award className="h-12 w-12 text-[var(--muted-foreground)] mb-4" />
            <h3 className="text-lg font-medium mb-2">No CORCs Yet</h3>
            <p className="text-sm text-[var(--muted-foreground)] text-center max-w-md mb-4">
              CORCs are created from monitoring period calculations. Start by creating a monitoring period and running the CORC calculation.
            </p>
            <Link href="/monitoring">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Go to Monitoring Periods
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
