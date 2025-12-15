import { z } from 'zod';

export const evidenceFileSchema = z.object({
  id: z.string().uuid().optional(),
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.string().min(1, 'File type is required'),
  fileSize: z.number().int().positive('File size must be positive'),
  mimeType: z.string().min(1, 'MIME type is required'),
  storagePath: z.string().min(1, 'Storage path is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional().nullable(),
  // Entity links (only one should be set)
  feedstockDeliveryId: z.string().uuid().optional().nullable(),
  productionBatchId: z.string().uuid().optional().nullable(),
  energyUsageId: z.string().uuid().optional().nullable(),
  transportEventId: z.string().uuid().optional().nullable(),
  sequestrationEventId: z.string().uuid().optional().nullable(),
  bcuId: z.string().uuid().optional().nullable(),
});

export const createEvidenceFileSchema = evidenceFileSchema.omit({ id: true });

export type EvidenceFileInput = z.infer<typeof createEvidenceFileSchema>;

export const EVIDENCE_CATEGORIES = [
  { value: 'sustainability', label: 'Sustainability Certificate' },
  { value: 'transport_license', label: 'Transport License' },
  { value: 'weight_in', label: 'Weight-In Evidence' },
  { value: 'weight_out', label: 'Weight-Out Evidence' },
  { value: 'biochar_out', label: 'Biochar Output Evidence' },
  { value: 'temperature_log', label: 'Temperature Log' },
  { value: 'delivery', label: 'Delivery Note' },
  { value: 'regulatory', label: 'Regulatory Permit' },
  { value: 'storage', label: 'Storage Evidence' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'photo', label: 'Photo' },
  { value: 'lab_report', label: 'Lab Report' },
  { value: 'general', label: 'General' },
] as const;

export const ALLOWED_FILE_TYPES = [
  { value: 'pdf', label: 'PDF', mimeTypes: ['application/pdf'] },
  { value: 'image', label: 'Image', mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] },
  { value: 'csv', label: 'CSV', mimeTypes: ['text/csv', 'application/csv'] },
  { value: 'excel', label: 'Excel', mimeTypes: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] },
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
