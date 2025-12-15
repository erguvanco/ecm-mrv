'use client';

import dynamic from 'next/dynamic';
import { Spinner } from '@/components/ui';

// Dynamic import DashboardMap to prevent SSR issues with mapbox-gl
const DashboardMap = dynamic(
  () => import('./dashboard-map').then((mod) => mod.DashboardMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[400px] items-center justify-center bg-[var(--muted)] rounded">
        <Spinner className="h-8 w-8" />
      </div>
    ),
  }
);

export function DashboardMapWrapper() {
  return <DashboardMap />;
}
