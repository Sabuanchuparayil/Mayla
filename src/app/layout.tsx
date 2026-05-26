import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display, Amaranth } from 'next/font/google';
import { PwaRegister } from '@/components/pwa-register';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  display: 'swap',
});

const amaranth = Amaranth({
  variable: '--font-amaranth',
  weight: ['700'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mayla — Where Real Connections Begin',
  description: 'Selfie-verified social discovery for the Middle East. Every profile, every photo — real.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-icon', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mayla',
  },
};

export const viewport: Viewport = {
  themeColor: '#C9445A',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${amaranth.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
