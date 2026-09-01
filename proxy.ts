import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Intercept legacy URLs and return a strict 404 status
  if (
    pathname === '/contact-us' ||
    pathname === '/contact-us/' ||
    pathname.startsWith('/index.php')
  ) {
    // We could return a rewritten response to a custom 404 page, but a direct 404 NextResponse is the most SEO-friendly for Soft 404s.
    // However, returning a null body might look ugly to users if they actually click it.
    // Let's rewrite to a non-existent route to trigger the Next.js not-found.tsx UI, but with a 404 status.
    // Wait, rewriting to a non-existent path will automatically trigger `not-found.tsx` with a 404 status in Next.js App Router.
    const url = request.nextUrl.clone();
    url.pathname = '/_not-found-page-trigger';
    return NextResponse.rewrite(url, { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/contact-us',
    '/contact-us/',
    '/index.php/:path*'
  ],
};
