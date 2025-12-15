export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { format } from 'date-fns';
import {
  Building2,
  Calendar,
  MapPin,
  Settings,
  AlertCircle,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui';
import db from '@/lib/db';

async function getFacilityData() {
  try {
    const facility = await db.facility.findFirst({
      include: {
        monitoringPeriods: {
          orderBy: { periodStart: 'desc' },
          take: 5,
          include: {
            _count: {
              select: {
                corcIssuances: true,
              },
            },
          },
        },
        leakageAssessments: {
          orderBy: { assessmentDate: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            productionBatches: true,
            monitoringPeriods: true,
            leakageAssessments: true,
          },
        },
      },
    });

    return { facility, error: null };
  } catch (error) {
    console.error('Error fetching facility data:', error);
    return { facility: null, error: 'Failed to load facility data' };
  }
}

export default async function FacilityPage() {
  const { facility, error } = await getFacilityData();

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-logo text-2xl tracking-tight">Facility</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
              Manage your biochar production facility
            </p>
          </div>
        </div>
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Data</h3>
            <p className="text-sm text-[var(--muted-foreground)] text-center max-w-md">
              {error}. Please try refreshing the page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-logo text-2xl tracking-tight">Facility</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
              Manage your biochar production facility
            </p>
          </div>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-[var(--muted-foreground)] mb-4" />
            <h3 className="text-lg font-medium mb-2">No Facility Registered</h3>
            <p className="text-sm text-[var(--muted-foreground)] text-center max-w-md mb-4">
              To start tracking CORCs, you need to register your biochar production facility first.
            </p>
            <Link href="/facility/setup">
              <Button>
                <Building2 className="h-4 w-4 mr-2" />
                Register Facility
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const baselineTypeLabels: Record<string, string> = {
    NEW_BUILT: 'New Built',
    RETROFIT_FACILITY: 'Retrofit Facility',
    CHARCOAL_REPURPOSE: 'Charcoal Repurpose',
  };

  const activeMonitoringPeriod = facility.monitoringPeriods.find(p => p.status === 'active');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-logo text-2xl tracking-tight">{facility.name}</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            Registration: {facility.registrationNumber}
          </p>
        </div>
        <Link href="/facility/edit">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Edit Settings
          </Button>
        </Link>
      </div>

      {/* Main Info Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Facility Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
              Facility Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[var(--muted-foreground)]" />
              <span className="text-sm">{baselineTypeLabels[facility.baselineType] || facility.baselineType}</span>
            </div>
            {facility.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-[var(--muted-foreground)] mt-0.5" />
                <span className="text-sm">{facility.address}</span>
              </div>
            )}
            {facility.country && (
              <div className="text-sm text-[var(--muted-foreground)]">
                Country: {facility.country}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Crediting Period */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
              Crediting Period
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[var(--muted-foreground)]" />
              <span className="text-sm">
                {format(facility.creditingPeriodStart, 'MMM d, yyyy')} - {format(facility.creditingPeriodEnd, 'MMM d, yyyy')}
              </span>
            </div>
            <div className="text-sm text-[var(--muted-foreground)]">
              {facility.infrastructureLifetimeYears} year infrastructure lifetime
            </div>
            <div className="text-sm">
              Infrastructure emissions: {facility.totalInfrastructureEmissionsTCO2e.toFixed(2)} tCO₂e
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
              Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{facility._count.productionBatches}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Batches</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{facility._count.monitoringPeriods}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Periods</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{facility._count.leakageAssessments}</p>
                <p className="text-xs text-[var(--muted-foreground)]">Assessments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Monitoring Period */}
      {activeMonitoringPeriod ? (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Active Monitoring Period
              </CardTitle>
              <Badge variant="default">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">
                  {format(activeMonitoringPeriod.periodStart, 'MMM d, yyyy')} - {format(activeMonitoringPeriod.periodEnd, 'MMM d, yyyy')}
                </p>
                {activeMonitoringPeriod.netCORCsTCO2e !== null && (
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Calculated: {activeMonitoringPeriod.netCORCsTCO2e.toFixed(2)} tCO₂e net CORCs
                  </p>
                )}
              </div>
              <Link href={`/monitoring/${activeMonitoringPeriod.id}`}>
                <Button variant="outline" size="sm">
                  View Details
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              No Active Monitoring Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--muted-foreground)]">
                Create a monitoring period to start tracking CORCs.
              </p>
              <Link href="/monitoring/new">
                <Button size="sm">
                  Create Period
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Monitoring Periods */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
              Recent Monitoring Periods
            </CardTitle>
            <Link href="/monitoring">
              <Button variant="ghost" size="sm">
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {facility.monitoringPeriods.length > 0 ? (
            <div className="space-y-2">
              {facility.monitoringPeriods.map((period) => (
                <Link
                  key={period.id}
                  href={`/monitoring/${period.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--muted)] transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {format(period.periodStart, 'MMM d')} - {format(period.periodEnd, 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {period._count.corcIssuances} CORCs · {period.netCORCsTCO2e?.toFixed(2) ?? 'Not calculated'} tCO₂e
                    </p>
                  </div>
                  <Badge
                    variant={
                      period.status === 'active' ? 'default' :
                      period.status === 'verified' ? 'secondary' : 'outline'
                    }
                  >
                    {period.status}
                  </Badge>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
              No monitoring periods yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
