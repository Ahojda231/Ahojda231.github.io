import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuth = !!token;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/dashboard')) {
    if (!isAuth) {
      const signInUrl = new URL('/login', req.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  if (pathname.startsWith('/shop')) {
    if (!isAuth) {
      const signInUrl = new URL('/login', req.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  if (pathname.startsWith('/admin')) {
    const isAdmin = isAuth && Number((token as any)?.admin ?? 0) > 0;
    if (!isAdmin) {
      // redirect non-admins to home (or login if unauthenticated)
      const dest = isAuth ? '/' : '/login';
      const url = new URL(dest, req.url);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/shop/:path*', '/admin/:path*'],
};
