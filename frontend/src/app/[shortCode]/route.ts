import { NextResponse } from 'next/server';

function getBackendUrl(): string {
  const url = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  return url.replace(/\/$/, '');
}

export async function GET(request: Request, { params }: { params: Promise<{ shortCode: string }> }) {
  const { shortCode } = await params;

  // Ignore static assets and reserved routes
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

    const location = res.headers.get('Location') || res.headers.get('location');
    if (location) {
      try {
        const destination = new URL(location);
        return NextResponse.redirect(destination.toString(), 302);
      } catch {
        // If not a full URL, ensure https://
        try {
          const destination = new URL('https://' + location.replace(/^\/+/, ''));
          return NextResponse.redirect(destination.toString(), 302);
        } catch {
          // invalid location header
        }
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
