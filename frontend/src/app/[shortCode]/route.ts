import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ shortCode: string }> }) {
  const { shortCode } = await params;
  const backendUrl = (process.env.BACKEND_URL || 'http://localhost:8080').replace(/\/$/, '');

  try {
    // Proxy the redirect server-side: fetch the backend's redirect endpoint
    // and extract the final destination URL, so the user's browser never
    // sees the internal backend hostname.
    const res = await fetch(`${backendUrl}/${shortCode}`, {
      redirect: 'manual', // don't follow the 302 — we need the Location header
    });

    const location = res.headers.get('Location');
    if (location) {
      return NextResponse.redirect(location, 302);
    }

    return NextResponse.json({ error: 'Short URL not found' }, { status: 404 });
  } catch (error: any) {
    console.error(`[Redirect Proxy] Failed to reach backend: ${error.message}`);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 502 });
  }
}
