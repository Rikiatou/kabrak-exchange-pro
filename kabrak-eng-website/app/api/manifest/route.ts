import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const startUrl = searchParams.get('start_url') || '/';
  const name = searchParams.get('name') || 'KABRAK Exchange Pro';
  const scope = searchParams.get('scope') || '/';

  const manifest = {
    name,
    short_name: 'Versement',
    start_url: startUrl,
    scope,
    display: 'standalone',
    background_color: '#071a12',
    theme_color: '#0B6E4F',
    icons: [
      { src: '/KEiconelogo.jpeg', sizes: '192x192', type: 'image/jpeg', purpose: 'any maskable' },
    ],
  };

  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'no-store',
    },
  });
}
