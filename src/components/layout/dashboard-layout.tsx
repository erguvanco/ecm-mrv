'use client';

import * as React from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './sidebar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
      />
      <div
        className={cn(
          'flex flex-col min-h-screen transition-all duration-200',
          'lg:ml-[260px]',
          collapsed && 'lg:ml-16'
        )}
      >
        {/* Mobile header with menu button */}
        <header className="sticky top-0 z-30 flex h-14 items-center border-b bg-[var(--background)] px-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="ml-3 font-logo text-lg">ECM</span>
          <span className="text-xs font-medium tracking-widest text-[var(--muted-foreground)] uppercase ml-1">MRV</span>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
