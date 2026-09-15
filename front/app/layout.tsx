import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ustaadlink.pk';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'UstaadLink — Teacher & School Recruitment Marketplace',
    template: '%s | UstaadLink',
  },
  description: 'Connect schools with verified teachers directly in District Malir & Karachi. Create a free professional Educator Profile or search teachers by subject, class level, shift, and expected salary.',
  applicationName: 'UstaadLink',
  authors: [{ name: 'UstaadLink Team' }],
  generator: 'Next.js',
  keywords: [
    'teacher jobs Karachi',
    'teaching vacancies Malir',
    'find school teachers Karachi',
    'hire teachers in Malir',
    'school teacher recruitment Pakistan',
    'mathematics teacher Malir',
    'science teacher Karachi',
    'private school hiring Malir',
    'Gadap town teachers',
    'Ibrahim Hyderi teachers',
    'UstaadLink',
  ],
  creator: 'UstaadLink',
  publisher: 'UstaadLink',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/logo.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: [
      { url: '/logo.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
  },
  manifest: '/manifest.webmanifest',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'UstaadLink — Teacher & School Recruitment Marketplace',
    description: 'Empowering schools and educators in Karachi to connect directly without commission or recruitment fees.',
    url: baseUrl,
    siteName: 'UstaadLink',
    locale: 'en_PK',
    type: 'website',
    images: [
      {
        url: '/logo.svg',
        width: 512,
        height: 512,
        alt: 'UstaadLink — Connecting Teachers with Schools',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UstaadLink — Teacher & School Recruitment Marketplace',
    description: 'Connect schools with verified teachers directly across Karachi.',
    creator: '@ustaadlink',
    images: ['/logo.svg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Suppress unhandled rejection noise from browser extension content scripts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                window.addEventListener('unhandledrejection', function(event) {
                  if (event.reason && (
                    String(event.reason).includes('tabs:outgoing.message.ready') ||
                    String(event.reason?.message).includes('tabs:outgoing.message.ready') ||
                    String(event.reason?.message).includes('No Listener')
                  )) {
                    event.preventDefault();
                    event.stopPropagation();
                  }
                });
              }
            `,
          }}
        />

        {/* Schema.org JSON-LD Structured Data for Search Engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebSite',
                  '@id': `${baseUrl}/#website`,
                  url: baseUrl,
                  name: 'UstaadLink',
                  description: 'Teacher & School Recruitment Marketplace in Karachi',
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: `${baseUrl}/teachers?query={search_term_string}`,
                    'query-input': 'required name=search_term_string',
                  },
                },
                {
                  '@type': 'Organization',
                  '@id': `${baseUrl}/#organization`,
                  name: 'UstaadLink',
                  url: baseUrl,
                  logo: `${baseUrl}/logo.svg`,
                  description: 'Pakistan premier teacher and school recruitment marketplace connecting verified educators with educational institutions.',
                  address: {
                    '@type': 'PostalAddress',
                    addressLocality: 'Malir',
                    addressRegion: 'Karachi',
                    addressCountry: 'PK',
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body 
        className="min-h-screen flex flex-col font-sans antialiased bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white"
        suppressHydrationWarning
      >
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
