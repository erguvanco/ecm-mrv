'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Camera, CameraOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { parseQRCodeData, EntityType } from '@/lib/qr';
import { cn } from '@/lib/utils';

export interface ScanResult {
  entityType: EntityType;
  id: string;
  rawData: string;
}

interface QRScannerProps {
  onScan: (result: ScanResult) => void;
  onError?: (error: string) => void;
  allowedEntityTypes?: EntityType[];
  className?: string;
}

type ScannerState = 'initializing' | 'scanning' | 'error' | 'permission_denied';

export function QRScanner({
  onScan,
  onError,
  allowedEntityTypes,
  className,
}: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ScannerState>('initializing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasScannedRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const scannerState = scannerRef.current.getState();
        if (
          scannerState === Html5QrcodeScannerState.SCANNING ||
          scannerState === Html5QrcodeScannerState.PAUSED
        ) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (!containerRef.current) return;

    setState('initializing');
    setErrorMessage(null);
    hasScannedRef.current = false;

    try {
      // Create scanner instance
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-scanner-container');
      }

      const qrCodeSuccessCallback = (decodedText: string) => {
        // Prevent multiple scans
        if (hasScannedRef.current) return;

        const parsed = parseQRCodeData(decodedText);

        if (!parsed) {
          setErrorMessage('Invalid QR code. Please scan a dMRV QR code.');
          onError?.('Invalid QR code format');
          return;
        }

        // Check if entity type is allowed
        if (allowedEntityTypes && !allowedEntityTypes.includes(parsed.entityType)) {
          const allowed = allowedEntityTypes.join(', ');
          setErrorMessage(`Wrong type. Expected: ${allowed}`);
          onError?.(`Entity type ${parsed.entityType} not allowed`);
          return;
        }

        hasScannedRef.current = true;
        onScan({
          entityType: parsed.entityType,
          id: parsed.id,
          rawData: decodedText,
        });
      };

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        qrCodeSuccessCallback,
        undefined // Ignore errors from not finding QR codes
      );

      setState('scanning');
    } catch (err) {
      console.error('Scanner error:', err);

      if (err instanceof Error) {
        if (
          err.message.includes('Permission') ||
          err.message.includes('NotAllowedError')
        ) {
          setState('permission_denied');
          setErrorMessage('Camera access denied. Please enable camera permissions.');
        } else {
          setState('error');
          setErrorMessage(err.message);
        }
      } else {
        setState('error');
        setErrorMessage('Failed to start camera');
      }

      onError?.(errorMessage || 'Scanner error');
    }
  }, [allowedEntityTypes, onScan, onError, errorMessage]);

  useEffect(() => {
    startScanner();

    return () => {
      stopScanner();
    };
  }, [startScanner, stopScanner]);

  const handleRetry = () => {
    stopScanner().then(startScanner);
  };

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div
        id="qr-scanner-container"
        ref={containerRef}
        className="w-full max-w-sm aspect-square bg-black rounded-lg overflow-hidden relative"
      >
        {state === 'initializing' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              <Spinner size="lg" className="mb-2" />
              <p className="text-sm">Starting camera...</p>
            </div>
          </div>
        )}

        {(state === 'error' || state === 'permission_denied') && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center text-white p-4">
              {state === 'permission_denied' ? (
                <CameraOff className="h-12 w-12 mx-auto mb-3 opacity-50" />
              ) : (
                <Camera className="h-12 w-12 mx-auto mb-3 opacity-50" />
              )}
              <p className="text-sm mb-4">{errorMessage}</p>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
          </div>
        )}
      </div>

      {errorMessage && state === 'scanning' && (
        <div className="text-center text-red-500 text-sm max-w-sm">
          {errorMessage}
        </div>
      )}

      {state === 'scanning' && (
        <p className="text-sm text-[var(--muted-foreground)] text-center">
          Position the QR code within the frame to scan
        </p>
      )}
    </div>
  );
}
