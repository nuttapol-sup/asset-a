import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/scan') ||
    pathname.startsWith('/scan') ||
    pathname === '/login' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;

  // Determine login URL preserving any subpath prefix like /assets
  const forwardedPrefix = request.headers.get('x-forwarded-prefix') || '';
  const loginPath = forwardedPrefix ? `${forwardedPrefix}/login` : '/login';

  if (!token) {
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  const payload = await verifyJWT(token);
  if (!payload) {
    const response = NextResponse.redirect(new URL(loginPath, request.url));
    response.cookies.delete('auth_token');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
