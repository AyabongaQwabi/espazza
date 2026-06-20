import type React from 'react';
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { SupabaseProvider } from '@/components/providers/supabase-provider';
import { MusicPlayerProvider } from '@/contexts/music-player-context';
import { MusicPlayer } from '@/components/music-player/music-player';
import { MiniPlayer } from '@/components/music-player/mini-player';
import AnimationWrapper from '@/components/AnimationWrapper';
import ErrorBoundary from '@/components/ErrorBoundary';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';
import dynamic from 'next/dynamic';
import { GoogleAnalytics } from '@next/third-parties/google';
import Ezoic from '@/components/ezoic';

// Dynamically import the AdBanner component with SSR disabled
const AdBanner = dynamic(() => import('@/components/AdBanner'), { ssr: false });

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://espazza.xyz'),
  title: {
    default: 'eSpazza - South African music Spaza Shop',
    template: '%s | eSpazza',
  },
  description:
    "eSpazza is South Africa's premier digital platform for Xhosa hip hop and South African hip hop. Discover artists, stream and buy music releases, read SA music news, and explore events. The home of Mzansi hip hop culture.",
  keywords: [
    'South African hip hop',
    'Xhosa hip hop',
    'SA hip hop',
    'South African music platform',
    'Xhosa rap',
    'Mzansi music',
    'iRap',
    'South African rappers',
    'Xhosa hip hop artists',
    'SA music streaming',
    'South African music news',
    'kasi music',
    'township hip hop',
    'eSpazza',
  ],
  authors: [{ name: 'Ayabonga Qwabi' }],
  creator: 'Xhosa Hip Hop',
  publisher: 'Ayabonga Qwabi',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/logo.png',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: 'https://espazza.xyz',
    siteName: 'eSpazza',
    title: 'eSpazza - South African music Spaza Shop',
    description:
      'eSpazza is a South African digital platform dedicated to promoting local music and culture, with a particular focus on Xhosa hip hop. It serves as a hub for artists, producers, and fans, offering a variety of content and merchandise',
    images: [
      {
        url: 'https://espazza.xyz/logo.png',
        width: 1200,
        height: 630,
        alt: 'eSpazza - South African music Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'eSpazza - South African music Spaza Shop',
    description: 'The home of South African music',
    images: ['https://espazza.xyz/logo.jpg'],
    creator: '@xhap',
    site: '@espazza',
  },
  manifest: '/manifest.json',
  themeColor: '#dc2626',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://espazza.xyz',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const restartQuake = async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      await window?.adquake.restart();
    }
    console.log('AdQuake restarted');
  };
  if (typeof window !== 'undefined') {
    restartQuake(window);
  }

  return (
    <html lang='xh' className='dark'>
      <head>
        <script
          async
          src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8294995671791919'
          crossOrigin='anonymous'
        ></script>
        <meta
          name='google-adsense-account'
          content='ca-pub-8294995671791919'
        ></meta>
        <link
          rel='icon'
          type='image/png'
          href='/favicon-96x96.png'
          sizes='96x96'
        />
        <link rel='icon' type='image/svg+xml' href='/favicon.svg' />
        <link rel='shortcut icon' href='/favicon.ico' />
        <link
          rel='apple-touch-icon'
          sizes='180x180'
          href='/apple-touch-icon.png'
        />
        <meta name='apple-mobile-web-app-title' content='MyWebSite' />
        <link rel='manifest' href='/site.webmanifest' />
        <Script
          id='structured-data-website'
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'eSpazza',
              alternateName: 'eSpazza Music',
              url: 'https://espazza.xyz',
              description:
                "South Africa's premier Xhosa hip hop and South African hip hop digital music platform.",
              inLanguage: 'en-ZA',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate:
                    'https://espazza.xyz/releases?q={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        <Script
          id='structured-data-org'
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'eSpazza',
              url: 'https://espazza.xyz',
              logo: {
                '@type': 'ImageObject',
                url: 'https://espazza.xyz/logo.png',
                width: 512,
                height: 512,
              },
              description:
                "South Africa's premier digital platform for Xhosa hip hop and South African hip hop music. Discover artists, stream releases, and stay updated with SA music news.",
              foundingLocation: {
                '@type': 'Place',
                name: 'South Africa',
                address: {
                  '@type': 'PostalAddress',
                  addressCountry: 'ZA',
                },
              },
              areaServed: {
                '@type': 'Country',
                name: 'South Africa',
              },
              knowsAbout: [
                'South African Hip Hop',
                'Xhosa Hip Hop',
                'SA Music',
                'Mzansi Music',
                'Township Music',
              ],
              sameAs: [
                'https://twitter.com/espazza',
                'https://www.instagram.com/espazza',
              ],
            }),
          }}
        />
        <script
          src='https://cmp.gatekeeperconsent.com/min.js'
          data-cfasync='false'
        ></script>
        <script
          src='https://the.gatekeeperconsent.com/cmp.min.js'
          data-cfasync='false'
        ></script>
        <script async src='//www.ezojs.com/ezoic/sa.min.js'></script>
        <Script
          src='https://ezojs.com/ezoic/sa.min.js'
          async={true}
          strategy='beforeInteractive'
          crossOrigin='anonymous'
        />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <a href='#main-content' className='skip-to-content'>
            Skip to main content
          </a>
          <SupabaseProvider>
            <MusicPlayerProvider>
              <div className='flex flex-col min-h-screen bg-gradient-to-br from-zinc-900 to-zinc-800'>
                <SiteHeader />
                <Ezoic />
                <main id='main-content' className='flex-1 pb-16'>
                  {/* Desktop Ad */}
                  {/* <script
                    async
                    src='https://script.adquake.com/js/adquake.js'
                    adquake-key='jU4ct88nmUGU290dbTftwg=='
                  ></script> */}
                  {/* <div className='hidden lg:block mt-20 -mb-12'>
                    <div className='mt-4'>
                      <script
                        async='async'
                        data-cfasync='false'
                        src='//pl26249233.effectiveratecpm.com/c1f9c7a0bc454e5477f0b3c1f4a8b06f/invoke.js'
                      ></script>
                      <div id='container-c1f9c7a0bc454e5477f0b3c1f4a8b06f'></div>
                    </div>
                  </div> */}

                  {/* Mobile Ad */}
                  {/* <div className='lg:hidden mt-20'>
                    <div className='mt-4'>
                      <script
                        async='async'
                        data-cfasync='false'
                        src='//pl26249233.effectiveratecpm.com/c1f9c7a0bc454e5477f0b3c1f4a8b06f/invoke.js'
                      ></script>
                      <div id='container-c1f9c7a0bc454e5477f0b3c1f4a8b06f'></div>
                    </div>
                  </div> */}

                  <AnimationWrapper>{children}</AnimationWrapper>
                  <Analytics />
                </main>
                <SiteFooter />
                <MusicPlayer />
                <MiniPlayer />
              </div>
              <Toaster />
            </MusicPlayerProvider>
          </SupabaseProvider>
        </ErrorBoundary>
      </body>
      <GoogleAnalytics gaId='G-NC0MT9L44F' />
    </html>
  );
}
