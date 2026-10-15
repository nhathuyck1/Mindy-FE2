import type { Metadata } from 'next';
import '@fontsource-variable/nunito';
import { appConfig } from '@/utils/app-config';
import './globals.css';
import { AppProviders } from './providers';

export const metadata: Metadata = {
  title: `${appConfig.name} — Học lập trình, mở thế giới của bạn`,
  description: appConfig.description,
  icons: { icon: '/brand/mindy-logo.jpg', apple: '/brand/mindy-logo.jpg' },
  openGraph: {
    title: `${appConfig.name} — Học lập trình`,
    description: appConfig.description,
    locale: 'vi_VN',
    type: 'website',
  },
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full font-sans">
        <AppProviders>{props.children}</AppProviders>
      </body>
    </html>
  );
}
