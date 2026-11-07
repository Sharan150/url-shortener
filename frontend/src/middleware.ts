import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function getBackendUrl(): string {
  const url = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://premium-url-shortener-backend.onrender.com';
  return url.replace(/\/$/, '');
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore root homepage, API routes, static Next.js assets, and files with extensions
  if (
    pathname === '/' ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const shortCode = pathname.replace(/^\/+/, '').trim();
  if (!shortCode) {
    return NextResponse.next();
  }

  const backendUrl = getBackendUrl();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    let res: Response;
    try {
      res = await fetch(`${backendUrl}/${shortCode}`, {
        redirect: 'manual',
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    // 1. Check Location header from manual redirect
    const location = res.headers.get('location') || res.headers.get('Location');
    if (location) {
      try {
        const dest = new URL(location);
        return NextResponse.redirect(dest.toString(), 302);
      } catch {
        try {
          const dest = new URL('https://' + location.replace(/^\/+/, ''));
          return NextResponse.redirect(dest.toString(), 302);
        } catch {
          // invalid location
        }
      }
    }

    // 2. Fallback: follow redirect if Location header is hidden
    if (res.status === 302 || res.status === 301 || res.status === 0 || !location) {
      try {
        const followRes = await fetch(`${backendUrl}/${shortCode}`, {
          redirect: 'follow',
        });
        if (followRes.url && !followRes.url.includes(shortCode)) {
          return NextResponse.redirect(followRes.url, 302);
        }
      } catch {
        // ignore fallback failure
      }
    }

  } catch (error: any) {
    // If backend is unreachable, let request proceed to Next.js route handler
    console.error(`[Middleware Redirect] Error: ${error?.message}`);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
