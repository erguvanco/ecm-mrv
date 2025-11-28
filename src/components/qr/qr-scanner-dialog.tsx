'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QRScanner, ScanResult } from './qr-scanner';
import { EntityType, getEntityDetailPath, getEntityTypeLabel } from '@/lib/qr';

interface QRScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan?: (entityType: EntityType, id: string) => void;
  context?: 'navigation' | 'batch_link';
  allowedEntityTypes?: EntityType[];
  title?: string;
  description?: string;
}

export function QRScannerDialog({
  open,
  onOpenChange,
  onScan,
  context = 'navigation',
  allowedEntityTypes,
  title = 'Scan QR Code',
  description = 'Scan a dMRV QR code to navigate to the entity',
}: QRScannerDialogProps) {
  const router = useRouter();
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isLogging, setIsLogging] = useState(false);

  const handleScan = async (result: ScanResult) => {
    setScanResult(result);
    setIsLogging(true);

    try {
      // Log the scan
      await fetch('/api/qr/scan-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: result.entityType,
          entityId: result.id,
          scanContext: context,
          sourcePagePath: typeof window !== 'undefined' ? window.location.pathname : undefined,
          scanResult: 'success',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        }),
      });
    } catch (err) {
      console.error('Failed to log scan:', err);
    } finally {
      setIsLogging(false);
    }

    // Call the onScan callback if provided
    onScan?.(result.entityType, result.id);

    // If context is navigation, navigate after a short delay
    if (context === 'navigation') {
      setTimeout(() => {
        onOpenChange(false);
        router.push(getEntityDetailPath(result.entityType, result.id));
      }, 1000);
    }
  };

  const handleClose = () => {
    setScanResult(null);
    onOpenChange(false);
  };

  const handleNavigate = () => {
    if (scanResult) {
      onOpenChange(false);
      router.push(getEntityDetailPath(scanResult.entityType, scanResult.id));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {!scanResult ? (
          <QRScanner
            onScan={handleScan}
            allowedEntityTypes={allowedEntityTypes}
            className="mt-4"
          />
        ) : (
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <div className="text-center">
              <p className="font-medium">Scan Successful!</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                {getEntityTypeLabel(scanResult.entityType)}
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1 font-mono">
                {scanResult.id.slice(0, 8)}...
              </p>
            </div>

            {context === 'navigation' && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleNavigate} disabled={isLogging}>
                  {isLogging ? 'Loading...' : 'Go to Details'}
                </Button>
              </div>
            )}

            {context === 'batch_link' && (
              <Button onClick={handleClose}>
                Done
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
