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

  const pageTitle = `Versement — ${businessName}`;
  const pageUrl = `https://exchange.kabrakeng.com/upload/${code}`;

  return {
    title: pageTitle,
    description: `Envoyez votre reçu de versement — ${businessName}`,
    manifest: `/api/manifest?start_url=${encodeURIComponent(pageUrl)}&name=${encodeURIComponent(pageTitle)}`,
    appleWebApp: {
      capable: true,
      title: pageTitle,
      statusBarStyle: 'black-translucent',
    },
    other: {
      'mobile-web-app-capable': 'yes',
      'theme-color': '#0B6E4F',
    },
  };
}

export default function UploadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
