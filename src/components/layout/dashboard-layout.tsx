'use client';

import * as React from 'react';
import { Sidebar } from './sidebar';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
      <div
        className={cn(
          'flex flex-col min-h-screen transition-all duration-200',
          collapsed ? 'ml-16' : 'ml-[260px]'
        )}
      >
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
