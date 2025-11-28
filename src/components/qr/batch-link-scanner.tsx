'use client';

import { useState } from 'react';
import { ScanLine, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { QRScanner, ScanResult } from './qr-scanner';

interface BatchLinkScannerProps {
  onBatchScanned: (batchId: string) => void;
  linkedBatchIds?: string[];
}

type ScanState = 'scanning' | 'success' | 'duplicate' | 'wrong_type';

export function BatchLinkScanner({
  onBatchScanned,
  linkedBatchIds = [],
}: BatchLinkScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [lastScannedId, setLastScannedId] = useState<string | null>(null);

  const handleScan = async (result: ScanResult) => {
    // Check if it's a production batch
    if (result.entityType !== 'production') {
      setScanState('wrong_type');
      return;
    }

    // Check if already linked
    if (linkedBatchIds.includes(result.id)) {
      setScanState('duplicate');
      setLastScannedId(result.id);
      return;
    }

    // Log the scan
    try {
      await fetch('/api/qr/scan-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: result.entityType,
          entityId: result.id,
          scanContext: 'batch_link',
          sourcePagePath: typeof window !== 'undefined' ? window.location.pathname : undefined,
          scanResult: 'success',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        }),
      });
    } catch (err) {
      console.error('Failed to log scan:', err);
    }

    // Success - add the batch
    setScanState('success');
    setLastScannedId(result.id);
    onBatchScanned(result.id);

    // Auto close after success
    setTimeout(() => {
      setIsOpen(false);
      setScanState('scanning');
      setLastScannedId(null);
    }, 1500);
  };

  const handleClose = () => {
    setIsOpen(false);
    setScanState('scanning');
    setLastScannedId(null);
  };

  const handleScanAnother = () => {
    setScanState('scanning');
    setLastScannedId(null);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
      >
        <ScanLine className="h-4 w-4 mr-1" />
        Scan Batch QR
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Production Batch</DialogTitle>
            <DialogDescription>
              Scan a production batch QR code to add it to this sequestration event
            </DialogDescription>
          </DialogHeader>

          {scanState === 'scanning' && (
            <QRScanner
              onScan={handleScan}
              allowedEntityTypes={['production']}
              className="mt-4"
            />
          )}

          {scanState === 'success' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <div className="text-center">
                <p className="font-medium">Batch Added!</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1 font-mono">
                  {lastScannedId?.slice(0, 8)}...
                </p>
              </div>
            </div>
          )}

          {scanState === 'duplicate' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <AlertCircle className="h-16 w-16 text-yellow-500" />
              <div className="text-center">
                <p className="font-medium">Already Added</p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  This batch is already linked to this event
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
                <Button onClick={handleScanAnother}>
                  Scan Another
                </Button>
              </div>
            </div>
          )}

          {scanState === 'wrong_type' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <AlertCircle className="h-16 w-16 text-red-500" />
              <div className="text-center">
                <p className="font-medium">Wrong QR Code Type</p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Please scan a Production Batch QR code
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
                <Button onClick={handleScanAnother}>
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
