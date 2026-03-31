import type { ReactNode } from 'react';
import type { Metadata } from 'next';

interface Props {
  params: { code: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const code = (params.code || '').toUpperCase();
  const API = 'https://kabrak-exchange-pro-production.up.railway.app';

  let businessName = 'KABRAK Exchange Pro';
  try {
    const res = await fetch(`${API}/api/settings/public`, { next: { revalidate: 60 } });
    const json = await res.json();
    if (json?.success && json?.data?.businessName) {
      businessName = json.data.businessName;
    }
  } catch {}

  const pageTitle = `Portail client — ${businessName}`;
  const pageUrl = `/client/${code}`;

  return {
    title: pageTitle,
    description: `Suivez vos commandes et envoyez vos reçus — ${businessName}`,
    manifest: `/api/manifest?start_url=${encodeURIComponent(pageUrl)}&name=${encodeURIComponent(businessName || 'Portail')}&scope=${encodeURIComponent(pageUrl)}`,
    appleWebApp: {
      capable: true,
      title: businessName || 'Portail',
      statusBarStyle: 'black-translucent',
    },
    other: {
      'mobile-web-app-capable': 'yes',
      'theme-color': '#0B6E4F',
    },
  };
}

export default function ClientPortalLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
