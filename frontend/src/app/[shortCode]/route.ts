import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getBackendUrl(): string {
  const url = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://premium-url-shortener-backend.onrender.com';
  return url.replace(/\/$/, '');
}

export async function GET(request: Request, { params }: { params: Promise<{ shortCode: string }> }) {
  const { shortCode } = await params;

  // Ignore static assets, browser probes, and reserved routes
  if (!shortCode || shortCode.includes('.') || shortCode.startsWith('_') || shortCode === 'api') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const backendUrl = getBackendUrl();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let res: Response;
    try {
      res = await fetch(`${backendUrl}/${shortCode}`, {
        redirect: 'manual',
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    // 1. Try extracting Location header from manual redirect
    const location = res.headers.get('location') || res.headers.get('Location');
    if (location) {
      try {
        const destination = new URL(location);
        return NextResponse.redirect(destination.toString(), 302);
      } catch {
        try {
          const destination = new URL('https://' + location.replace(/^\/+/, ''));
          return NextResponse.redirect(destination.toString(), 302);
        } catch {
          // invalid location
        }
      }
    }

    // 2. Fallback: If runtime doesn't expose Location on manual redirect, follow redirect to resolve final destination URL
    if (res.status === 302 || res.status === 301 || res.status === 0 || !location) {
      const followController = new AbortController();
      const followTimeout = setTimeout(() => followController.abort(), 8000);
      try {
        const followRes = await fetch(`${backendUrl}/${shortCode}`, {
          redirect: 'follow',
          signal: followController.signal,
        });
        if (followRes.url && !followRes.url.includes(shortCode)) {
          return NextResponse.redirect(followRes.url, 302);
        }
      } catch {
        // Ignore fallback failure
      } finally {
        clearTimeout(followTimeout);
      }
    }

    if (res.status === 404) {
      return NextResponse.json({ error: 'Short link not found or has expired.' }, { status: 404 });
    }

    return NextResponse.json({ error: 'URL not found' }, { status: 404 });

  } catch (error: any) {
    console.error(`[Redirect Proxy] Error: ${error?.message}`);
    return NextResponse.json({ error: 'Redirect service unavailable' }, { status: 502 });
  }
}
