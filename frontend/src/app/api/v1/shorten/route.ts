import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const backendUrl = (process.env.BACKEND_URL || 'http://localhost:8080').replace(/\/$/, '');

    // Ensure the URL has a protocol prefix before forwarding to the backend,
    // because the backend's @URL validator rejects URLs without one.
    let url = body.longUrl?.trim() || '';
    if (url && !/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    console.log(`[API Proxy] Proxying to: ${backendUrl}/api/v1/shorten`);

    const res = await fetch(`${backendUrl}/api/v1/shorten`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ longUrl: url }),
    });

    if (!res.ok) {
      console.error(`[API Proxy] Backend returned status: ${res.status}`);
      // The rate limiter may return plain text, so read as text first
      const errorText = await res.text();
      console.error(`[API Proxy] Backend error body: ${errorText}`);

      // Try to parse as JSON; fall back to a generic error object
      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json(errorJson, { status: res.status });
      } catch {
        return NextResponse.json({ error: errorText || 'Backend error' }, { status: res.status });
      }
    }

    const data = await res.json();
    console.log(`[API Proxy] Success — shortCode: ${data.shortCode}`);
    return NextResponse.json(data, { status: res.status });

  } catch (error: any) {
    console.error(`[API Proxy] Exception: ${error.message}`);
    return NextResponse.json({ error: 'Unable to reach the shortening service' }, { status: 502 });
  }
}
