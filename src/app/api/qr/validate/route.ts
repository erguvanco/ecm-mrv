import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { validateEntitySchema } from '@/lib/validations/qr';
import { formatDateTime } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = validateEntitySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { valid: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const { entityType, entityId } = validationResult.data;

    let entity = null;
    let label = '';
    let details: Record<string, string | number | null> = {};

    switch (entityType) {
      case 'production':
        entity = await db.productionBatch.findUnique({
          where: { id: entityId },
          select: {
            id: true,
            productionDate: true,
            status: true,
            outputBiocharWeightTonnes: true,
            createdAt: true,
          },
        });
        if (entity) {
          label = `Production Batch - ${formatDateTime(entity.productionDate)}`;
          details = {
            status: entity.status,
            output: entity.outputBiocharWeightTonnes,
          };
        }
        break;

      case 'feedstock':
        entity = await db.feedstockDelivery.findUnique({
          where: { id: entityId },
          select: {
            id: true,
            date: true,
            feedstockType: true,
            weightTonnes: true,
            createdAt: true,
          },
        });
        if (entity) {
          label = `Feedstock Delivery - ${formatDateTime(entity.date)}`;
          details = {
            type: entity.feedstockType,
            weight: entity.weightTonnes,
          };
        }
        break;

      case 'sequestration':
        entity = await db.sequestrationEvent.findUnique({
          where: { id: entityId },
          select: {
            id: true,
            finalDeliveryDate: true,
            sequestrationType: true,
            status: true,
            createdAt: true,
          },
        });
        if (entity) {
          label = `Sequestration Event - ${formatDateTime(entity.finalDeliveryDate)}`;
          details = {
            type: entity.sequestrationType,
            status: entity.status,
          };
        }
        break;

      case 'transport':
        entity = await db.transportEvent.findUnique({
          where: { id: entityId },
          select: {
            id: true,
            date: true,
            distanceKm: true,
            cargoDescription: true,
            createdAt: true,
          },
        });
        if (entity) {
          label = `Transport Event - ${formatDateTime(entity.date)}`;
          details = {
            distance: entity.distanceKm,
            cargo: entity.cargoDescription,
          };
        }
        break;

      case 'energy':
        entity = await db.energyUsage.findUnique({
          where: { id: entityId },
          select: {
            id: true,
            periodStart: true,
            energyType: true,
            quantity: true,
            unit: true,
            createdAt: true,
          },
        });
        if (entity) {
          label = `Energy Usage - ${formatDateTime(entity.periodStart)}`;
          details = {
            type: entity.energyType,
            quantity: `${entity.quantity} ${entity.unit}`,
          };
        }
        break;

      case 'registry':
        entity = await db.bCU.findUnique({
          where: { id: entityId },
          select: {
            id: true,
            registrySerialNumber: true,
            quantityTonnesCO2e: true,
            status: true,
            issuanceDate: true,
            createdAt: true,
          },
        });
        if (entity) {
          label = `BCU - ${entity.registrySerialNumber}`;
          details = {
            quantity: entity.quantityTonnesCO2e,
            status: entity.status,
          };
        }
        break;

      default:
        return NextResponse.json(
          { valid: false, error: 'Unknown entity type' },
          { status: 400 }
        );
    }

    if (!entity) {
      return NextResponse.json({
        valid: false,
        error: 'Entity not found',
      });
    }

    return NextResponse.json({
      valid: true,
      entity: {
        id: entity.id,
        type: entityType,
        label,
        details,
        createdAt: entity.createdAt,
      },
    });
  } catch (error) {
    console.error('Failed to validate entity:', error);
    return NextResponse.json(
      { valid: false, error: 'Validation failed' },
      { status: 500 }
    );
  }
}
