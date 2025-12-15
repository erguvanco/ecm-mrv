export const dynamic = 'force-dynamic';

import { redirect, notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import db from '@/lib/db';
import { isValidEntityType, getEntityDetailPath, getEntityTypeLabel } from '@/lib/qr';
import { PageContainer, PageHeader } from '@/components/layout/page-container';
import { Button, Card, CardContent } from '@/components/ui';
import { AlertCircle, Home } from 'lucide-react';

interface ScanPageProps {
  params: Promise<{ type: string; id: string }>;
}

async function validateAndLogScan(
  entityType: string,
  entityId: string,
  userAgent: string | null
): Promise<{ valid: boolean; error?: string }> {
  // Validate entity type
  if (!isValidEntityType(entityType)) {
    return { valid: false, error: 'Invalid entity type' };
  }

  // Check if entity exists
  let exists = false;

  try {
    switch (entityType) {
      case 'production':
        exists = !!(await db.productionBatch.findUnique({
          where: { id: entityId },
          select: { id: true },
        }));
        break;
      case 'feedstock':
        exists = !!(await db.feedstockDelivery.findUnique({
          where: { id: entityId },
          select: { id: true },
        }));
        break;
      case 'sequestration':
        exists = !!(await db.sequestrationEvent.findUnique({
          where: { id: entityId },
          select: { id: true },
        }));
        break;
      case 'transport':
        exists = !!(await db.transportEvent.findUnique({
          where: { id: entityId },
          select: { id: true },
        }));
        break;
      case 'energy':
        exists = !!(await db.energyUsage.findUnique({
          where: { id: entityId },
          select: { id: true },
        }));
        break;
      case 'registry':
        exists = !!(await db.bCU.findUnique({
          where: { id: entityId },
          select: { id: true },
        }));
        break;
    }
  } catch (error) {
    console.error('Error checking entity existence:', error);
    return { valid: false, error: 'Database error' };
  }

  if (!exists) {
    // Log failed scan
    try {
      await db.qRScanLog.create({
        data: {
          entityType,
          entityId,
          scanContext: 'navigation',
          scanResult: 'entity_not_found',
          userAgent,
        },
      });
    } catch (err) {
      console.error('Failed to log scan:', err);
    }
    return { valid: false, error: 'Entity not found' };
  }

  // Log successful scan
  try {
    await db.qRScanLog.create({
      data: {
        entityType,
        entityId,
        scanContext: 'navigation',
        scanResult: 'success',
        userAgent,
      },
    });
  } catch (err) {
    console.error('Failed to log scan:', err);
  }

  return { valid: true };
}

export default async function ScanRedirectPage({ params }: ScanPageProps) {
  const { type, id } = await params;
  const headersList = await headers();
  const userAgent = headersList.get('user-agent');

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return (
      <ScanErrorPage
        title="Invalid QR Code"
        message="The scanned QR code contains an invalid ID format."
      />
    );
  }

  const result = await validateAndLogScan(type, id, userAgent);

  if (!result.valid) {
    if (result.error === 'Invalid entity type') {
      return (
        <ScanErrorPage
          title="Invalid QR Code"
          message="The scanned QR code is not a valid dMRV code."
        />
      );
    }

    if (result.error === 'Entity not found') {
      const entityLabel = isValidEntityType(type) ? getEntityTypeLabel(type) : 'Entity';
      return (
        <ScanErrorPage
          title={`${entityLabel} Not Found`}
          message="The scanned item may have been deleted or the QR code is outdated."
        />
      );
    }

    return (
      <ScanErrorPage
        title="Scan Error"
        message="An error occurred while processing the QR code."
      />
    );
  }

  // Valid scan - redirect to the entity detail page
  if (isValidEntityType(type)) {
    redirect(getEntityDetailPath(type, id));
  }

  notFound();
}

function ScanErrorPage({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <PageContainer>
      <PageHeader
        title="QR Code Scan"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Scan Result' },
        ]}
      />

      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center gap-4">
            <AlertCircle className="h-16 w-16 text-red-500" />
            <div>
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="text-[var(--muted-foreground)] mt-2">{message}</p>
            </div>
            <Link href="/">
              <Button>
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
