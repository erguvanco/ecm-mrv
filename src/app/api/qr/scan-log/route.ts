import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { scanLogSchema } from '@/lib/validations/qr';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = scanLogSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', issues: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { entityType, entityId, scanContext, sourcePagePath, scanResult, userAgent } =
      validationResult.data;

    const scanLog = await db.qRScanLog.create({
      data: {
        entityType,
        entityId,
        scanContext,
        sourcePagePath,
        scanResult,
        userAgent,
      },
    });

    return NextResponse.json({ success: true, id: scanLog.id });
  } catch (error) {
    console.error('Failed to create scan log:', error);
    return NextResponse.json(
      { error: 'Failed to log scan' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');

    const where: Record<string, string> = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    const logs = await db.qRScanLog.findMany({
      where,
      orderBy: { scannedAt: 'desc' },
      take: 100,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Failed to fetch scan logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scan logs' },
      { status: 500 }
    );
  }
}
