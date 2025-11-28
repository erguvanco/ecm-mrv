import { z } from 'zod';

export const ENTITY_TYPES = [
  'production',
  'feedstock',
  'sequestration',
  'transport',
  'energy',
  'registry',
] as const;

export const SCAN_RESULTS = [
  'success',
  'entity_not_found',
  'invalid_qr',
] as const;

export const SCAN_CONTEXTS = [
  'navigation',
  'batch_link',
  'verification',
] as const;

export const entityTypeSchema = z.enum(ENTITY_TYPES);

export const scanResultSchema = z.enum(SCAN_RESULTS);

export const scanContextSchema = z.enum(SCAN_CONTEXTS);

export const scanLogSchema = z.object({
  entityType: entityTypeSchema,
  entityId: z.string().uuid(),
  scanContext: scanContextSchema.optional(),
  sourcePagePath: z.string().optional(),
  scanResult: scanResultSchema,
  userAgent: z.string().optional(),
});

export const validateEntitySchema = z.object({
  entityType: entityTypeSchema,
  entityId: z.string().uuid(),
});

export type EntityTypeValue = z.infer<typeof entityTypeSchema>;
export type ScanLogInput = z.infer<typeof scanLogSchema>;
export type ValidateEntityInput = z.infer<typeof validateEntitySchema>;
