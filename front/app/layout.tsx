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

export const metadata: Metadata = {
  title: 'UstaadLink — Teacher & School Recruitment Marketplace',
  description: 'Connect schools with teachers directly. Create a free professional Educator Profile or find qualified teachers by subject, location, experience, and availability.',
  keywords: [
    'teacher jobs',
    'teaching jobs in Karachi',
    'find teachers',
    'hire teachers',
    'school teacher recruitment',
    'mathematics teacher',
    'science teacher',
    'UstaadLink',
  ],
  openGraph: {
    title: 'UstaadLink — Find Teachers & Teaching Opportunities',
    description: 'The free teacher–school recruitment marketplace.',
    type: 'website',
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
