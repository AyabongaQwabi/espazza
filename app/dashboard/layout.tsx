'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  MusicIcon,
  LayoutDashboardIcon,
  BookOpenIcon,
  CalendarIcon,
  ShoppingBagIcon,
  BookmarkIcon,
  LogOutIcon,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(profileData);
      setLoading(false);

      if (
        profileData &&
        !profileData.registration_complete &&
        pathname !== '/dashboard/onboarding'
      ) {
        router.push('/dashboard/onboarding');
      }
    }
    checkAuth();
  }, [router, pathname]);

  if (loading) {
    return (
      <div className='min-h-screen bg-zinc-900 flex items-center justify-center'>
        <p className='text-gray-400'>Loading...</p>
      </div>
    );
  }

  if (pathname === '/dashboard/onboarding') {
    return children;
  }

  return (
    <div className='min-h-screen bg-zinc-900 flex'>
      {/* Sidebar */}
      <div className='w-64 bg-gray-900 border-r border-zinc-800'>
        <div className='p-6'>
          <div className='flex items-center space-x-2'>
            <MusicIcon className='h-6 w-6 text-red-600' />
            <span className='text-2xl font-bold text-white'>
              X<span className='text-red-600'>HAP</span>
            </span>
          </div>
        </div>
        <nav className='px-4 py-6'>
          <ul className='space-y-2'>
            <li>
              <Button
                asChild
                variant='ghost'
                className={`w-full justify-start ${
                  pathname === '/dashboard' ? 'bg-zinc-800' : ''
                }`}
              >
                <Link href='/dashboard'>
                  <LayoutDashboardIcon className='h-4 w-4 mr-2' />
                  Dashboard
                </Link>
              </Button>
            </li>
            <li>
              <Button
                asChild
                variant='ghost'
                className={`w-full justify-start ${
                  pathname === '/dashboard/blog' ? 'bg-zinc-800' : ''
                }`}
              >
                <Link href='/dashboard/blog'>
                  <BookOpenIcon className='h-4 w-4 mr-2' />
                  Amabali (Stories)
                </Link>
              </Button>
            </li>
            <li>
              <Button
                asChild
                variant='ghost'
                className={`w-full justify-start ${
                  pathname === '/dashboard/events' ? 'bg-zinc-800' : ''
                }`}
              >
                <Link href='/dashboard/events'>
                  <CalendarIcon className='h-4 w-4 mr-2' />
                  Events
                </Link>
              </Button>
            </li>
            <li>
              <Button
                asChild
                variant='ghost'
                className={`w-full justify-start ${
                  pathname === '/dashboard/merchandise' ? 'bg-zinc-800' : ''
                }`}
              >
                <Link href='/dashboard/merchandise'>
                  <ShoppingBagIcon className='h-4 w-4 mr-2' />
                  Merchandise
                </Link>
              </Button>
            </li>
            <li>
              <Button
                asChild
                variant='ghost'
                className={`w-full justify-start ${
                  pathname === '/dashboard/bookings' ? 'bg-zinc-800' : ''
                }`}
              >
                <Link href='/dashboard/bookings'>
                  <BookmarkIcon className='h-4 w-4 mr-2' />
                  Bookings
                </Link>
              </Button>
            </li>
          </ul>
        </nav>
        <div className='absolute bottom-0 w-64 p-4 border-t border-zinc-800'>
          <Button
            variant='ghost'
            className='w-full justify-start text-red-500 hover:text-red-400 hover:bg-red-500/10'
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/login');
            }}
          >
            <LogOutIcon className='h-4 w-4 mr-2' />
            Phuma (Logout)
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className='flex-1 overflow-auto mt-20'>{children}</div>
    </div>
  );
}
