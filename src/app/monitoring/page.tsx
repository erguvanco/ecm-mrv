export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { format } from 'date-fns';
import {
  Calendar,
  Plus,
  ChevronRight,
  Calculator,
  CheckCircle,
  Clock,
  Award,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui';
import db from '@/lib/db';

async function getMonitoringPeriods() {
  try {
    const periods = await db.monitoringPeriod.findMany({
      orderBy: { periodStart: 'desc' },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
          },
        },
        corcIssuances: {
          select: {
            id: true,
            netCORCsTCO2e: true,
            status: true,
          },
        },
      },
    });

    return { periods, error: null };
  } catch (error) {
    console.error('Error fetching monitoring periods:', error);
    return { periods: [], error: 'Failed to load monitoring periods' };
  }
}

export default async function MonitoringPeriodsPage() {
  const { periods, error } = await getMonitoringPeriods();

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-logo text-2xl tracking-tight">Monitoring Periods</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
              Track and calculate CORCs for each monitoring period
            </p>
          </div>
        </div>
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-red-500 mb-4" />
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
    active: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    closed: { icon: CheckCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    verified: { icon: Award, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-logo text-2xl tracking-tight">Monitoring Periods</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            Track and calculate CORCs for each monitoring period
          </p>
        </div>
        <Link href="/monitoring/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Period
          </Button>
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{periods.filter(p => p.status === 'active').length}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{periods.filter(p => p.status === 'closed').length}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Pending Verification</p>
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
                <p className="text-2xl font-bold">{periods.filter(p => p.status === 'verified').length}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-violet-500/10 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {periods.reduce((sum, p) => sum + (p.netCORCsTCO2e ?? 0), 0).toFixed(1)}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">Total tCO₂e</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Periods List */}
      {periods.length > 0 ? (
        <div className="space-y-3">
          {periods.map((period) => {
            const config = statusConfig[period.status as keyof typeof statusConfig] || statusConfig.active;
            const StatusIcon = config.icon;
            const issuedCORCs = period.corcIssuances.filter(c => c.status === 'issued' || c.status === 'retired').length;

            return (
              <Card key={period.id} className="hover:border-[var(--foreground)]/20 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full ${config.bg} flex items-center justify-center`}>
                        <StatusIcon className={`h-5 w-5 ${config.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {format(period.periodStart, 'MMM d')} - {format(period.periodEnd, 'MMM d, yyyy')}
                          </p>
                          <Badge
                            variant={
                              period.status === 'active' ? 'default' :
                              period.status === 'verified' ? 'secondary' : 'outline'
                            }
                          >
                            {period.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-[var(--muted-foreground)]">
                          {period.facility.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-lg font-semibold">
                          {period.netCORCsTCO2e?.toFixed(2) ?? '—'} <span className="text-sm font-normal text-[var(--muted-foreground)]">tCO₂e</span>
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {issuedCORCs} CORCs issued
                        </p>
                      </div>
                      <Link href={`/monitoring/${period.id}`}>
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Progress indicators */}
                  {period.status === 'active' && (
                    <div className="mt-4 pt-4 border-t border-[var(--border)]">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--muted-foreground)]">
                          {period.calculatedAt
                            ? `Last calculated: ${format(period.calculatedAt, 'MMM d, yyyy HH:mm')}`
                            : 'Not yet calculated'}
                        </span>
                        <Link href={`/monitoring/${period.id}`}>
                          <Button variant="outline" size="sm">
                            <Calculator className="h-3.5 w-3.5 mr-1.5" />
                            Calculate CORCs
                          </Button>
                        </Link>
                      </div>
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
            <Calendar className="h-12 w-12 text-[var(--muted-foreground)] mb-4" />
            <h3 className="text-lg font-medium mb-2">No Monitoring Periods</h3>
            <p className="text-sm text-[var(--muted-foreground)] text-center max-w-md mb-4">
              Create your first monitoring period to start tracking and calculating CORCs.
            </p>
            <Link href="/monitoring/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Monitoring Period
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
