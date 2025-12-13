import { NextResponse, type NextRequest } from 'next/server';
import { validateAuth, unauthorizedResponse, isPublicPath } from '@/lib/auth';

/**
 * Middleware that protects API routes with authentication
 *
 * Configuration:
 * - Set API_KEY environment variable to enable authentication
 * - Set AUTH_ENABLED=false to disable authentication (e.g., in development)
 *
 * Authentication methods:
 * - Authorization: Bearer <API_KEY>
 * - X-API-Key: <API_KEY>
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect API routes
  if (!pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Skip authentication for public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Validate authentication
  const authResult = validateAuth(request);

  if (!authResult.authenticated) {
    console.warn(`[AUTH] Unauthorized access attempt to ${pathname}`);
    return unauthorizedResponse(authResult.error);
  }

  // Add user info to headers for downstream use
  const response = NextResponse.next();
  if (authResult.userId) {
    response.headers.set('X-User-ID', authResult.userId);
  }

  return response;
}

/**
 * Configure which routes the middleware runs on
 * This matcher includes all API routes except those listed in PUBLIC_PATHS
 */
export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
  ],
};
