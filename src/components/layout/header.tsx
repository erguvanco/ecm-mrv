'use client';

import * as React from 'react';
import { Menu, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QRScannerDialog } from '@/components/qr';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
  collapsed?: boolean;
  onMenuClick?: () => void;
}

export function Header({ collapsed = false, onMenuClick }: HeaderProps) {
  const [scannerOpen, setScannerOpen] = React.useState(false);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center border-b bg-[var(--background)] px-6 transition-all duration-200',
        collapsed ? 'ml-16' : 'ml-[260px]'
      )}
    >
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setScannerOpen(true)}
          title="Scan QR Code"
        >
          <ScanLine className="h-5 w-5" />
        </Button>
        <span className="text-xs text-[var(--muted-foreground)]">v0.1.0</span>
      </div>

      <QRScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        context="navigation"
        title="Scan QR Code"
        description="Scan a dMRV QR code to navigate to the entity"
      />
    </header>
  );
}
