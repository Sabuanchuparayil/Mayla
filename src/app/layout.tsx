import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Mayla — Meet Real People, Verified',
  description: 'Mayla uses face verification and AI to ensure every match is a real person. Safe, genuine connections.',
  openGraph: {
    title: 'Mayla — Meet Real People, Verified',
    description: 'Mayla uses face verification and AI to ensure every match is a real person.',
    url: 'https://mayla.app',
    siteName: 'Mayla',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mayla — Meet Real People, Verified',
    description: 'Mayla uses face verification and AI to ensure every match is a real person.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><Providers>{children}</Providers></body>
    </html>
  );
}
