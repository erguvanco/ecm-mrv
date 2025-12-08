'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Leaf,
  Factory,
  Zap,
  Truck,
  ArrowDownToLine,
  Network,
  Calculator,
  Database,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'feedstock', label: 'Feedstock', icon: Leaf, path: '/feedstock' },
  { id: 'production', label: 'Production', icon: Factory, path: '/production' },
  { id: 'energy', label: 'Energy', icon: Zap, path: '/energy' },
  { id: 'transport', label: 'Transport', icon: Truck, path: '/transport' },
  { id: 'sequestration', label: 'Sequestration', icon: ArrowDownToLine, path: '/sequestration' },
  { id: 'network', label: 'Network', icon: Network, path: '/network' },
  { id: 'lca', label: 'LCA & Verification', icon: Calculator, path: '/lca' },
  { id: 'datasets', label: 'Datasets', icon: Database, path: '/datasets' },
  { id: 'registry', label: 'Registry', icon: FileCheck, path: '/registry' },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

export function Sidebar({ collapsed = false, onCollapsedChange, mobileOpen = false, onMobileOpenChange }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  // Close mobile sidebar when navigating
  React.useEffect(() => {
    if (mobileOpen) {
      onMobileOpenChange?.(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-5">
        {!collapsed ? (
          <Link href="/" className="flex items-baseline gap-1">
            <span className="font-logo text-xl tracking-tight">ECM</span>
            <span className="text-xs font-medium tracking-widest text-[var(--muted-foreground)] uppercase">MRV</span>
          </Link>
        ) : (
          <Link href="/" className="mx-auto">
            <span className="font-logo text-xl">E</span>
          </Link>
        )}
        {/* Mobile close button */}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto lg:hidden"
          onClick={() => onMobileOpenChange?.(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6">
        <ul className="space-y-0.5 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <li key={item.id}>
                <Link
                  href={item.path}
                  className={cn(
                    'flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-[var(--foreground)] text-[var(--background)] font-medium'
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={cn('h-4 w-4 shrink-0', active ? 'stroke-[2]' : 'stroke-[1.5]')} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Toggle - hidden on mobile */}
      <div className="border-t p-3 hidden lg:block">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          onClick={() => onCollapsedChange?.(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => onMobileOpenChange?.(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-[260px] border-r bg-[var(--background)] transition-transform duration-200 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen border-r bg-[var(--background)] transition-all duration-200 hidden lg:block',
          collapsed ? 'w-16' : 'w-[260px]'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
