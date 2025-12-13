import { Card, CardContent } from '@/components/ui/card';

export default function MonitoringLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-[var(--muted)] rounded animate-pulse" />
          <div className="h-4 w-72 bg-[var(--muted)] rounded animate-pulse mt-2" />
        </div>
        <div className="h-10 w-32 bg-[var(--muted)] rounded animate-pulse" />
      </div>

      {/* Summary Stats skeleton */}
      <div className="grid gap-3 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[var(--muted)] animate-pulse" />
                <div>
                  <div className="h-7 w-12 bg-[var(--muted)] rounded animate-pulse" />
                  <div className="h-3 w-20 bg-[var(--muted)] rounded animate-pulse mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Periods List skeleton */}
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-[var(--muted)] animate-pulse" />
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-44 bg-[var(--muted)] rounded animate-pulse" />
                      <div className="h-5 w-16 bg-[var(--muted)] rounded animate-pulse" />
                    </div>
                    <div className="h-4 w-32 bg-[var(--muted)] rounded animate-pulse mt-1" />
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="h-6 w-24 bg-[var(--muted)] rounded animate-pulse" />
                    <div className="h-3 w-20 bg-[var(--muted)] rounded animate-pulse mt-1" />
                  </div>
                  <div className="h-8 w-8 bg-[var(--muted)] rounded animate-pulse" />
                </div>
              </div>

              {/* Progress indicator skeleton for first item */}
              {i === 0 && (
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-48 bg-[var(--muted)] rounded animate-pulse" />
                    <div className="h-8 w-32 bg-[var(--muted)] rounded animate-pulse" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
