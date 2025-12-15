import { z } from 'zod';

export const bcuSchema = z.object({
  id: z.string().uuid().optional(),
  quantityTonnesCO2e: z.coerce.number().positive('Quantity must be positive'),
  issuanceDate: z.coerce.date(),
  status: z.enum(['issued', 'transferred', 'retired']).default('issued'),
  registrySerialNumber: z.string().min(1, 'Serial number is required'),
  ownerName: z.string().optional().nullable(),
  accountId: z.string().optional().nullable(),
  retirementDate: z.coerce.date().optional().nullable(),
  retirementBeneficiary: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const createBCUSchema = bcuSchema.omit({ id: true });

export const updateBCUSchema = bcuSchema.partial().required({ id: true });

export const transferBCUSchema = z.object({
  id: z.string().uuid(),
  newOwnerName: z.string().min(1, 'New owner name is required'),
  newAccountId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const retireBCUSchema = z.object({
  id: z.string().uuid(),
  retirementBeneficiary: z.string().min(1, 'Beneficiary is required'),
  notes: z.string().optional().nullable(),
});

export type BCUInput = z.infer<typeof createBCUSchema>;
export type BCUUpdate = z.infer<typeof updateBCUSchema>;
export type BCUTransfer = z.infer<typeof transferBCUSchema>;
export type BCURetire = z.infer<typeof retireBCUSchema>;

export const BCU_STATUSES = [
  { value: 'issued', label: 'Issued', color: 'success' },
  { value: 'transferred', label: 'Transferred', color: 'info' },
  { value: 'retired', label: 'Retired', color: 'secondary' },
] as const;
