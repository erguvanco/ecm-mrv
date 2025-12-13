import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function FacilityLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-[var(--muted)] rounded animate-pulse" />
          <div className="h-4 w-64 bg-[var(--muted)] rounded animate-pulse mt-2" />
        </div>
        <div className="h-9 w-28 bg-[var(--muted)] rounded animate-pulse" />
      </div>

      {/* Main Info Grid skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Facility Details */}
        <Card>
          <CardHeader className="pb-2">
            <div className="h-4 w-24 bg-[var(--muted)] rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-5 w-32 bg-[var(--muted)] rounded animate-pulse" />
            <div className="h-5 w-48 bg-[var(--muted)] rounded animate-pulse" />
            <div className="h-4 w-28 bg-[var(--muted)] rounded animate-pulse" />
          </CardContent>
        </Card>

        {/* Crediting Period */}
        <Card>
          <CardHeader className="pb-2">
            <div className="h-4 w-28 bg-[var(--muted)] rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-5 w-44 bg-[var(--muted)] rounded animate-pulse" />
            <div className="h-4 w-36 bg-[var(--muted)] rounded animate-pulse" />
            <div className="h-4 w-40 bg-[var(--muted)] rounded animate-pulse" />
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader className="pb-2">
            <div className="h-4 w-20 bg-[var(--muted)] rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <div className="h-8 w-12 bg-[var(--muted)] rounded animate-pulse mx-auto" />
                  <div className="h-3 w-14 bg-[var(--muted)] rounded animate-pulse mx-auto mt-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Monitoring Period skeleton */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="h-5 w-40 bg-[var(--muted)] rounded animate-pulse" />
            <div className="h-5 w-16 bg-[var(--muted)] rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="h-4 w-48 bg-[var(--muted)] rounded animate-pulse" />
              <div className="h-3 w-36 bg-[var(--muted)] rounded animate-pulse mt-1" />
            </div>
            <div className="h-9 w-28 bg-[var(--muted)] rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>

      {/* Recent Monitoring Periods skeleton */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="h-4 w-40 bg-[var(--muted)] rounded animate-pulse" />
            <div className="h-8 w-20 bg-[var(--muted)] rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--muted)]/30"
              >
                <div>
                  <div className="h-4 w-36 bg-[var(--muted)] rounded animate-pulse" />
                  <div className="h-3 w-28 bg-[var(--muted)] rounded animate-pulse mt-1" />
                </div>
                <div className="h-5 w-16 bg-[var(--muted)] rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
