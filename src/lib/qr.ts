import QRCode from 'qrcode';

export const ENTITY_TYPES = {
  production: { route: '/production', label: 'Production Batch' },
  feedstock: { route: '/feedstock', label: 'Feedstock Delivery' },
  sequestration: { route: '/sequestration', label: 'Sequestration Event' },
  transport: { route: '/transport', label: 'Transport Event' },
  energy: { route: '/energy', label: 'Energy Usage' },
  registry: { route: '/registry', label: 'BCU' },
} as const;

export type EntityType = keyof typeof ENTITY_TYPES;

export const ENTITY_TYPE_LIST = Object.keys(ENTITY_TYPES) as EntityType[];

/**
 * Get the full URL for an entity (for QR code encoding)
 */
export function getEntityUrl(entityType: EntityType, id: string): string {
  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/scan/${entityType}/${id}`;
}

/**
 * Get the detail page path for an entity
 */
export function getEntityDetailPath(entityType: EntityType, id: string): string {
  return `${ENTITY_TYPES[entityType].route}/${id}`;
}

/**
 * Generate a QR code as a data URL
 */
export async function generateQRCodeDataURL(
  entityType: EntityType,
  id: string,
  options?: {
    width?: number;
    margin?: number;
  }
): Promise<string> {
  const url = getEntityUrl(entityType, id);
  return QRCode.toDataURL(url, {
    width: options?.width ?? 256,
    margin: options?.margin ?? 2,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'H', // High error correction for better scanning
  });
}

/**
 * Parse a scanned QR code URL and extract entity info
 */
export function parseQRCodeData(
  data: string
): { entityType: EntityType; id: string } | null {
  try {
    const url = new URL(data);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Expect format: /scan/{entityType}/{uuid}
    if (pathParts.length !== 3 || pathParts[0] !== 'scan') {
      return null;
    }

    const [, entityTypeStr, id] = pathParts;

    // Validate entity type
    if (!ENTITY_TYPE_LIST.includes(entityTypeStr as EntityType)) {
      return null;
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return null;
    }

    return { entityType: entityTypeStr as EntityType, id };
  } catch {
    return null;
  }
}

/**
 * Get the human-readable label for an entity type
 */
export function getEntityTypeLabel(entityType: EntityType): string {
  return ENTITY_TYPES[entityType].label;
}

/**
 * Validate if a string is a valid entity type
 */
export function isValidEntityType(type: string): type is EntityType {
  return ENTITY_TYPE_LIST.includes(type as EntityType);
}
