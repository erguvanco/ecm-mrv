import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Standardized API response utilities
 */

// Standard error response format
export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

// Pagination parameters schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

// Paginated response format
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Parse pagination parameters from URL search params
 */
export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = searchParams.get('page');
  const limit = searchParams.get('limit');

  const result = paginationSchema.safeParse({
    page: page ?? 1,
    limit: limit ?? 20,
  });

  if (result.success) {
    return result.data;
  }

  // Return defaults if parsing fails
  return { page: 1, limit: 20 };
}

/**
 * Calculate pagination skip value for Prisma
 */
export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / params.limit);

  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasMore: params.page < totalPages,
    },
  };
}

/**
 * Standard success response
 */
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Standard error responses
 */
export function errorResponse(
  message: string,
  status: number,
  code?: string,
  details?: unknown
): NextResponse<ApiError> {
  const error: ApiError = { error: message };
  if (code) error.code = code;
  if (details) error.details = details;

  return NextResponse.json(error, { status });
}

export function badRequestResponse(message: string, details?: unknown) {
  return errorResponse(message, 400, 'BAD_REQUEST', details);
}

export function notFoundResponse(resource: string) {
  return errorResponse(`${resource} not found`, 404, 'NOT_FOUND');
}

export function unauthorizedResponse(message = 'Unauthorized') {
  return errorResponse(message, 401, 'UNAUTHORIZED');
}

export function forbiddenResponse(message = 'Forbidden') {
  return errorResponse(message, 403, 'FORBIDDEN');
}

export function serverErrorResponse(message = 'Internal server error', details?: unknown) {
  return errorResponse(message, 500, 'INTERNAL_ERROR', details);
}

export function validationErrorResponse(issues: unknown) {
  return errorResponse('Validation failed', 400, 'VALIDATION_ERROR', issues);
}

/**
 * CORC status enum for validation
 */
export const VALID_CORC_STATUSES = ['draft', 'issued', 'retired'] as const;
export type CORCStatus = typeof VALID_CORC_STATUSES[number];

/**
 * Validate status query parameter
 */
export function validateStatusParam(status: string | null, validStatuses: readonly string[]): string | null {
  if (!status) return null;
  if (validStatuses.includes(status)) return status;
  return null; // Invalid status, return null to ignore it
}

/**
 * Validate UUID query parameter
 */
export function validateUUIDParam(value: string | null): string | null {
  if (!value) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value) ? value : null;
}
