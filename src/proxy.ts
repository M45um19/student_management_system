import { NextResponse, type NextRequest } from 'next/server';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';
import { COOKIES } from '@/lib/constants';

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const accessToken = req.cookies.get(COOKIES.ACCESS_TOKEN)?.value;
  const refreshToken = req.cookies.get(COOKIES.REFRESH_TOKEN)?.value;

  const user = accessToken ? await verifyAccessToken(accessToken) : null;

  // If access token is expired, but refresh token exists and is valid
  if (!user && refreshToken) {
    const refreshData = await verifyRefreshToken(refreshToken);
    if (!refreshData) {
      // Both tokens are invalid or expired
      if (pathname.startsWith('/staff') || pathname.startsWith('/student')) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('redirect', pathname);
        const res = NextResponse.redirect(loginUrl);
        res.cookies.delete(COOKIES.ACCESS_TOKEN);
        res.cookies.delete(COOKIES.REFRESH_TOKEN);
        return res;
      }
    }
  }

  // 1. If accessing /login while already authenticated with a valid access token
  if (pathname === '/login' && user) {
    if (user.role === 'STAFF') {
      return NextResponse.redirect(new URL('/staff/dashboard', req.url));
    }
    return NextResponse.redirect(new URL('/student/dashboard', req.url));
  }

  // 2. Protected Staff Routes
  if (pathname.startsWith('/staff')) {
    if (!user && !refreshToken) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (user && user.role !== 'STAFF') {
      return NextResponse.redirect(new URL('/student/dashboard', req.url));
    }
  }

  // 3. Protected Student Routes
  if (pathname.startsWith('/student')) {
    if (!user && !refreshToken) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (user && user.role !== 'STUDENT') {
      return NextResponse.redirect(new URL('/staff/dashboard', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/staff/:path*', '/student/:path*'],
};
