/**
 * Image Proxy — Little Buddy Club
 * Proxies shelter animal photos to avoid hotlinking issues.
 * Accepts any HTTPS image URL — validates response content-type.
 */
import { NextRequest, NextResponse } from 'next/server';

function isAllowedUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        // Only allow HTTPS (or HTTP for legacy shelter sites)
        return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
        return false;
    }
}

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    if (!isAllowedUrl(url)) {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 403 });
    }

    try {
        const response = await fetch(url, {
            signal: AbortSignal.timeout(10_000),
            headers: {
                'User-Agent': 'LittleBuddyClub/1.0 ImageProxy',
                'Accept': 'image/*',
            },
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Upstream fetch failed' }, { status: 502 });
        }

        const contentType = response.headers.get('content-type') || 'image/jpeg';
        if (!contentType.startsWith('image/')) {
            return NextResponse.json({ error: 'Not an image' }, { status: 400 });
        }

        const imageBuffer = await response.arrayBuffer();

        return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
                'X-Proxy-Source': 'little-buddy-image-proxy',
                'Content-Security-Policy': "default-src 'none'",
                'X-Content-Type-Options': 'nosniff',
            },
        });
    } catch (err) {
        return NextResponse.json(
            { error: `Proxy error: ${(err as Error).message}` },
            { status: 502 },
        );
    }
}
