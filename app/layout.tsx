import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { SupabaseProvider } from '@/components/providers/supabase-provider';
import AnimationWrapper from '@/components/AnimationWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'eSpazza - Xhosa Hip Hop Spaza Shop',
  description: 'Iplatform yabaRhepi baseKhaya - The home of Xhosa Hip Hop',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='xh' className='dark'>
      <body className={inter.className}>
        <SupabaseProvider>
          <div className='flex flex-col min-h-screen bg-zinc-800'>
            <SiteHeader />
            <AnimationWrapper>{children}</AnimationWrapper>
            <SiteFooter />
          </div>
          <Toaster />
        </SupabaseProvider>
      </body>
    </html>
  );
}
