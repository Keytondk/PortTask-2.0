import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Navo - Maritime Operations Platform',
  description:
    'Enterprise-grade maritime operations platform for port call management, service ordering, and vessel tracking at scale.',
  keywords: [
    'maritime',
    'shipping',
    'port operations',
    'vessel tracking',
    'maritime software',
    'port call management',
    'maritime logistics',
  ],
  openGraph: {
    title: 'Navo - Maritime Operations Platform',
    description:
      'Enterprise-grade maritime operations platform for port call management, service ordering, and vessel tracking at scale.',
    type: 'website',
    url: 'https://navo.io',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Navo Maritime Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Navo - Maritime Operations Platform',
    description:
      'Enterprise-grade maritime operations platform for port call management, service ordering, and vessel tracking at scale.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
