import { NextResponse } from 'next/server';

function getBackendUrl(): string {
  const url = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  return url.replace(/\/$/, '');
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const backendUrl = getBackendUrl();

    let url = (body.longUrl || '').trim();
    if (!url) {
      return NextResponse.json({ error: 'Please enter a valid URL to shorten.' }, { status: 400 });
    }

    // Auto-prefix protocol if missing
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    // Validate basic URL structure
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format. Example: https://example.com' }, { status: 400 });
    }

    // Extract caller IP to pass to backend rate limiter
    const forwardedFor = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (forwardedFor) {
      headers['X-Forwarded-For'] = forwardedFor;
    }

    // 15-second timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let res: Response;
    try {
      res = await fetch(`${backendUrl}/api/v1/shorten`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ longUrl: url }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      const errorText = await res.text();
      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json(errorJson, { status: res.status });
      } catch {
        if (res.status === 429) {
          return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
        }
        return NextResponse.json({ error: errorText || 'Failed to shorten URL.' }, { status: res.status });
      }
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });

  } catch (error: any) {
    console.error(`[API Proxy] Error: ${error?.message}`);
    if (error?.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Server took too long to respond. It may be waking up — please try again in a moment.' },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: 'Unable to reach the server. It may be waking up — please retry in a few seconds.' },
      { status: 502 }
    );
  }
}
