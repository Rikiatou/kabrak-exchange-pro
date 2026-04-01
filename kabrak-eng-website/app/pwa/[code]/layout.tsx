import type { ReactNode } from 'react';
import type { Metadata } from 'next';

interface Props {
  params: { code: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const code = (params.code || '').toUpperCase();
  const pwaUrl = `/pwa/${code}`;
  return {
    title: 'KABRAK Exchange Pro',
    manifest: `/api/manifest?start_url=${encodeURIComponent(pwaUrl)}&name=KABRAK%20Exchange&scope=%2F`,
    appleWebApp: {
      capable: true,
      title: 'KABRAK Exchange',
      statusBarStyle: 'black-translucent',
    },
    icons: {
      apple: '/KEiconelogo.jpeg',
    },
    other: {
      'mobile-web-app-capable': 'yes',
    },
  };
}

export default function PwaLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
