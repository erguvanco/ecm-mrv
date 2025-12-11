'use client';

import { useEffect, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { generateQRCodeDataURL, EntityType, getEntityTypeLabel } from '@/lib/qr';
import { cn } from '@/lib/utils';

interface QRDisplayProps {
  entityType: EntityType;
  entityId: string;
  entityLabel?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showActions?: boolean;
  className?: string;
}

const SIZE_MAP = {
  xs: 64,  // Extra small for map popups
  sm: 128,
  md: 200,
  lg: 256,
};

export function QRDisplay({
  entityType,
  entityId,
  entityLabel,
  size = 'md',
  showActions = true,
  className,
}: QRDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Derive loading state: loading when we have no URL and no error
  const isLoading = !qrDataUrl && !error;

  const pixelSize = SIZE_MAP[size];

  useEffect(() => {
    let cancelled = false;

    // Reset state before async operation
    setQrDataUrl(null);
    setError(null);

    generateQRCodeDataURL(entityType, entityId, { width: pixelSize })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to generate QR code:', err);
          setError('Failed to generate QR code');
        }
      });

    return () => { cancelled = true; };
  }, [entityType, entityId, pixelSize]);

  const handleDownload = () => {
    if (!qrDataUrl) return;

    const link = document.createElement('a');
    link.download = `qr-${entityType}-${entityId.slice(0, 8)}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handlePrint = () => {
    if (!qrDataUrl) return;

    const label = entityLabel || `${getEntityTypeLabel(entityType)} - ${entityId.slice(0, 8)}`;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>QR Code - ${label}</title>
            <style>
              body {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                font-family: system-ui, -apple-system, sans-serif;
              }
              .container {
                text-align: center;
              }
              img {
                width: 200px;
                height: 200px;
              }
              p {
                margin-top: 16px;
                font-size: 14px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <img src="${qrDataUrl}" alt="QR Code" />
              <p>${label}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-[var(--muted)]',
          className
        )}
        style={{ width: pixelSize, height: pixelSize }}
      >
        <Spinner size="md" />
      </div>
    );
  }

  if (error || !qrDataUrl) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-[var(--muted)] text-[var(--muted-foreground)] text-sm',
          className
        )}
        style={{ width: pixelSize, height: pixelSize }}
      >
        {error || 'Error'}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <img
        src={qrDataUrl}
        alt={`QR Code for ${getEntityTypeLabel(entityType)}`}
        width={pixelSize}
        height={pixelSize}
        className="border"
      />
      {entityLabel && (
        <p className="text-sm text-[var(--muted-foreground)] text-center max-w-[200px]">
          {entityLabel}
        </p>
      )}
      {showActions && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
        </div>
      )}
    </div>
  );
}
