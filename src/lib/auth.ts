import { NextRequest } from 'next/server';

/**
 * Authentication configuration
 * In production, API_KEY should be set as an environment variable
 */
const API_KEY = process.env.API_KEY;
const AUTH_ENABLED = process.env.AUTH_ENABLED !== 'false'; // Enabled by default

export interface AuthResult {
  authenticated: boolean;
  error?: string;
  userId?: string;
}

/**
 * Validates the request authentication
 * Checks for API key in Authorization header or X-API-Key header
 */
export function validateAuth(request: NextRequest): AuthResult {
  // If auth is disabled (e.g., in development), allow all requests
  if (!AUTH_ENABLED) {
    return { authenticated: true, userId: 'dev-user' };
  }

  // If no API key is configured, log warning and deny access
  if (!API_KEY) {
    console.warn(
      'AUTH WARNING: No API_KEY environment variable set. All API requests will be denied. ' +
      'Set AUTH_ENABLED=false to disable authentication in development.'
    );
    return {
      authenticated: false,
      error: 'Server authentication not configured',
    };
  }

  // Check Authorization header (Bearer token format)
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    const [scheme, token] = authHeader.split(' ');
    if (scheme === 'Bearer' && token === API_KEY) {
      return { authenticated: true, userId: 'api-key-user' };
    }
  }

  // Check X-API-Key header (alternative format)
  const apiKeyHeader = request.headers.get('X-API-Key');
  if (apiKeyHeader === API_KEY) {
    return { authenticated: true, userId: 'api-key-user' };
  }

  return {
    authenticated: false,
    error: 'Invalid or missing authentication credentials',
  };
}

/**
 * Helper to create an unauthorized response
 */
export function unauthorizedResponse(message = 'Unauthorized') {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * List of public paths that don't require authentication
 */
export const PUBLIC_PATHS = [
  '/api/health',
  '/api/status',
];

/**
 * Check if a path is public (doesn't require authentication)
 */
export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname.startsWith(path));
}
