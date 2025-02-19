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
  MenuIcon,
  HomeIcon,
  InfoIcon,
  UsersIcon,
  MailIcon,
  EditIcon,
  CalendarPlusIcon,
  PackageIcon,
  UserIcon,
  MessageSquare,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import type React from 'react';
import { Analytics } from '@vercel/analytics/next';

const navItems = [
  { href: '/', icon: HomeIcon, label: 'Ikhaya (Home)' },
  { href: '/about', icon: InfoIcon, label: 'Malunga Nathi (About Us)' },
  { href: '/artists', icon: UsersIcon, label: 'Abaculi (Artists)' },
  { href: '/events', icon: CalendarIcon, label: 'Iziganeko (Events)' },
  { href: '/merch', icon: ShoppingBagIcon, label: 'Merchandise' },
  { href: '/blog', icon: BookOpenIcon, label: 'Amabali (Blog)' },
  { href: '/contact', icon: MailIcon, label: 'Qhagamshelana (Contact)' },
  { href: '/dashboard', icon: LayoutDashboardIcon, label: 'Dashboard' },
  { href: '/dashboard/profile', icon: UserIcon, label: 'Edit Profile' },
  { href: '/dashboard/promotion', icon: UserIcon, label: 'Tracks' },
  { href: '/dashboard/purchases', icon: UserIcon, label: 'Purchases' },
  { href: '/dashboard/tickets', icon: UserIcon, label: 'Tickets' },
  { href: '/dashboard/blog', icon: EditIcon, label: 'Manage Posts' },
  { href: '/dashboard/events', icon: CalendarPlusIcon, label: 'Manage Events' },
  {
    href: '/dashboard/merchandise',
    icon: PackageIcon,
    label: 'Manage Merchandise',
  },
  {
    href: '/dashboard/orders',
    icon: PackageIcon,
    label: 'Orders',
  },
  { href: '/dashboard/bookings', icon: BookmarkIcon, label: 'Manage Bookings' },
  { href: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      <div className='min-h-screen bg-black flex items-center justify-center'>
        <p className='text-gray-400'>Loading...</p>
      </div>
    );
  }

  if (pathname === '/dashboard/onboarding') {
    return children;
  }

  const NavLink = ({
    href,
    icon: Icon,
    label,
  }: {
    href: string;
    icon: any;
    label: string;
  }) => (
    <Button
      asChild
      variant='ghost'
      className={`w-full justify-start ${
        pathname === href ? 'bg-zinc-800' : ''
      }`}
    >
      <Link href={href}>
        <Icon className='h-4 w-4 mr-2' />
        {label}
      </Link>
    </Button>
  );

  return (
    <div className='min-h-screen bg-black flex'>
      {/* Sidebar for larger screens */}
      <div className='hidden md:flex w-64 bg-zinc-900 border-r border-zinc-800 flex-col'>
        <div className='p-6'>
          <div className='flex items-center space-x-2'>
            <img src='/logo.png' className='w-10 h-10 rounded-full' />
            <span className='text-2xl font-bold text-white'>eSpazza</span>
          </div>
        </div>
        <ScrollArea className='flex-1 px-4 py-6'>
          <nav className='space-y-2'>
            {navItems.slice(7).map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </nav>
        </ScrollArea>
        <div className='p-4 border-t border-zinc-800'>
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

      {/* Mobile navigation */}
      <div className='md:hidden fixed top-0 left-0 right-0 z-50 bg-zinc-900 border-b border-zinc-800 p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <img src='/logo.png' className='w-10 h-10 rounded-full' />
            <span className='text-2xl font-bold text-white'>eSpazza</span>
          </div>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant='ghost' size='icon'>
                <MenuIcon className='h-6 w-6 text-white' />
              </Button>
            </SheetTrigger>
            <SheetContent
              side='left'
              className='w-[300px] sm:w-[400px] bg-zinc-900'
            >
              <ScrollArea className='h-full'>
                <nav className='flex flex-col py-6'>
                  <div className='flex-1'>
                    <h2 className='text-lg font-semibold text-white mb-2 px-4'>
                      Main Pages
                    </h2>
                    <div className='space-y-2 mb-6'>
                      {navItems.slice(0, 7).map((item) => (
                        <NavLink key={item.href} {...item} />
                      ))}
                    </div>
                    <h2 className='text-lg font-semibold text-white mb-2 px-4'>
                      Dashboard
                    </h2>
                    <div className='space-y-2'>
                      {navItems.slice(7).map((item) => (
                        <NavLink key={item.href} {...item} />
                      ))}
                    </div>
                  </div>
                  <div className='p-4 border-t border-zinc-800 mt-6'>
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
                </nav>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content */}
      <div className='flex-1 overflow-auto'>
        <div className='md:hidden h-16' /> {/* Spacer for mobile header */}
        {children}
        <Analytics />
      </div>
    </div>
  );
}
