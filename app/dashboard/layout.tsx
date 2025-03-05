'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  MusicIcon,
  LayoutDashboardIcon,
  BookOpenIcon,
  CalendarIcon,
  ShoppingBagIcon,
  BookmarkIcon,
  LogOutIcon,
  HomeIcon,
  InfoIcon,
  UsersIcon,
  MailIcon,
  EditIcon,
  CalendarPlusIcon,
  PackageIcon,
  UserIcon,
  MessageSquare,
  CreditCard,
  BarChart3,
  Ticket,
  ShoppingCart,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Analytics } from '@vercel/analytics/next';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type React from 'react';

// Group navigation items by category
const navGroups = [
  {
    label: 'Dashboard',
    items: [
      { href: '/dashboard', icon: LayoutDashboardIcon, label: 'Overview' },
      { href: '/dashboard/profile', icon: UserIcon, label: 'Profile Yakho' },
      { href: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/dashboard/blog', icon: EditIcon, label: 'Manage Posts' },
      {
        href: '/dashboard/events',
        icon: CalendarPlusIcon,
        label: 'iiEvents Zakho',
      },
      {
        href: '/dashboard/promotion',
        icon: MusicIcon,
        label: 'iiTracks Zakho',
      },
    ],
  },
  {
    label: 'Commerce',
    items: [
      {
        href: '/dashboard/merchandise',
        icon: PackageIcon,
        label: 'Manage Merchandise',
      },
      { href: '/dashboard/orders', icon: ShoppingCart, label: 'Orders' },
      {
        href: '/dashboard/bookings',
        icon: BookmarkIcon,
        label: 'Manage Bookings',
      },
    ],
  },
  {
    label: 'Finances',
    items: [
      { href: '/dashboard/balances', icon: BarChart3, label: 'Balances' },
      {
        href: '/dashboard/purchases',
        icon: ShoppingBagIcon,
        label: 'Music Bought',
      },
      { href: '/dashboard/tickets', icon: Ticket, label: 'Tickets Bought' },
      { href: '/dashboard/ikhoka', icon: CreditCard, label: 'iKhoka' },
    ],
  },
];

// Main site navigation
const mainNavItems = [
  { href: '/', icon: HomeIcon, label: 'Ikhaya (Home)' },
  { href: '/about', icon: InfoIcon, label: 'Malunga Nathi (About Us)' },
  { href: '/artists', icon: UsersIcon, label: 'Abaculi (Artists)' },
  { href: '/events', icon: CalendarIcon, label: 'Iziganeko (Events)' },
  { href: '/merch', icon: ShoppingBagIcon, label: 'Merchandise' },
  { href: '/blog', icon: BookOpenIcon, label: 'Amabali (Blog)' },
  { href: '/contact', icon: MailIcon, label: 'Qhagamshelana (Contact)' },
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
        pathname !== '/user-type-selection'
      ) {
        router.push('/user-type-selection');
      }
    }
    checkAuth();
  }, [router, pathname]);

  if (loading) {
    return <LoadingState />;
  }

  if (pathname === '/dashboard/onboarding') {
    return children;
  }

  return (
    <SidebarProvider defaultOpen>
      <div className='min-h-screen bg-black flex'>
        <DashboardSidebar profile={profile} pathname={pathname} />

        {/* Main Content */}
        <div className='flex-1 flex flex-col w-full'>
          <div className='md:hidden h-16' /> {/* Spacer for mobile header */}
          <div className='md:hidden fixed top-0 left-0 right-0 z-40 bg-zinc-900 border-b border-zinc-800 p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <img
                  src='/logo.png'
                  className='w-10 h-10 rounded-full'
                  alt='eSpazza Logo'
                />
                <span className='text-2xl font-bold text-white'>eSpazza</span>
              </div>
              <SidebarTrigger />
            </div>
          </div>
          <div className='flex-1 w-full h-full overflow-auto pb-16 md:pb-0'>
            {children}
          </div>
          <Analytics />
        </div>
        <MobileNav profile={profile} pathname={pathname} />
      </div>
    </SidebarProvider>
  );
}

function DashboardSidebar({
  profile,
  pathname,
}: {
  profile: any;
  pathname: string;
}) {
  const router = useRouter();

  return (
    <Sidebar className='border-r border-zinc-800'>
      <SidebarHeader className='border-b border-zinc-800'>
        <div className='flex items-center gap-2 px-2 py-3'>
          <img
            src='/logo.png'
            className='w-10 h-10 rounded-full'
            alt='eSpazza Logo'
          />
          <div className='flex flex-col'>
            <span className='text-lg font-bold text-white'>eSpazza</span>
            <span className='text-xs text-zinc-400'>Artist Dashboard</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <div className='px-4 py-2'>
          <div className='flex items-center gap-3 mb-6'>
            <Avatar>
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className='bg-zinc-800 text-zinc-200'>
                {profile?.artist_name?.charAt(0) ||
                  profile?.username?.charAt(0) ||
                  'U'}
              </AvatarFallback>
            </Avatar>
            <div className='flex flex-col'>
              <span className='font-medium text-white'>
                {profile?.artist_name || profile?.username || 'Artist'}
              </span>
              <span className='text-xs text-zinc-400'>{profile?.email}</span>
            </div>
          </div>
        </div>

        {navGroups.map((group, index) => (
          <SidebarGroup key={index}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarGroup>
          <Collapsible className='group/collapsible'>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className='flex w-full items-center'>
                Main Site
                <ChevronDown className='ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180' />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainNavItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild tooltip={item.label}>
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className='border-t border-zinc-800'>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip='Settings'>
              <Link href='/dashboard/settings'>
                <Settings className='h-4 w-4' />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              className='text-red-500 hover:text-red-400 hover:bg-red-500/10'
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/login');
              }}
            >
              <LogOutIcon className='h-4 w-4' />
              <span>Phuma (Logout)</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function LoadingState() {
  return (
    <div className='min-h-screen bg-black flex'>
      <div className='hidden md:flex w-64 bg-zinc-900 border-r border-zinc-800 flex-col'>
        <div className='p-6 border-b border-zinc-800'>
          <div className='flex items-center space-x-2'>
            <Skeleton className='w-10 h-10 rounded-full' />
            <Skeleton className='h-6 w-24' />
          </div>
        </div>
        <div className='p-4'>
          <div className='flex items-center gap-3 mb-6'>
            <Skeleton className='w-10 h-10 rounded-full' />
            <div className='space-y-2'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-3 w-32' />
            </div>
          </div>

          <div className='space-y-6'>
            {[1, 2, 3, 4].map((group) => (
              <div key={group} className='space-y-2'>
                <Skeleton className='h-4 w-20' />
                <div className='space-y-2 mt-3'>
                  {[1, 2, 3].map((item) => (
                    <Skeleton key={item} className='h-8 w-full rounded-md' />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className='flex-1 flex items-center justify-center'>
        <div className='text-center'>
          <div className='inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-zinc-500 border-r-2 border-zinc-500 border-b-2 border-transparent'></div>
          <p className='text-zinc-400 mt-4'>Loading dashboard...</p>
        </div>
      </div>
    </div>
  );
}

function MobileNav({ profile, pathname }: { profile: any; pathname: string }) {
  const router = useRouter();

  return (
    <div className='md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-900 border-t border-zinc-800'>
      <div className='grid grid-cols-5 h-16'>
        <Link
          href='/dashboard'
          className={`flex flex-col items-center justify-center ${
            pathname === '/dashboard' ? 'text-white' : 'text-zinc-400'
          }`}
        >
          <LayoutDashboardIcon className='h-5 w-5' />
          <span className='text-xs mt-1'>Overview</span>
        </Link>

        <Link
          href='/dashboard/profile'
          className={`flex flex-col items-center justify-center ${
            pathname === '/dashboard/profile' ? 'text-white' : 'text-zinc-400'
          }`}
        >
          <UserIcon className='h-5 w-5' />
          <span className='text-xs mt-1'>Profile</span>
        </Link>

        <Link
          href='/dashboard/promotion'
          className={`flex flex-col items-center justify-center ${
            pathname === '/dashboard/promotion' ? 'text-white' : 'text-zinc-400'
          }`}
        >
          <MusicIcon className='h-5 w-5' />
          <span className='text-xs mt-1'>Tracks</span>
        </Link>

        <Link
          href='/dashboard/merchandise'
          className={`flex flex-col items-center justify-center ${
            pathname === '/dashboard/merchandise'
              ? 'text-white'
              : 'text-zinc-400'
          }`}
        >
          <PackageIcon className='h-5 w-5' />
          <span className='text-xs mt-1'>Merch</span>
        </Link>

        <Link
          href='/dashboard/balances'
          className={`flex flex-col items-center justify-center ${
            pathname === '/dashboard/balances' ? 'text-white' : 'text-zinc-400'
          }`}
        >
          <BarChart3 className='h-5 w-5' />
          <span className='text-xs mt-1'>Finance</span>
        </Link>
      </div>
    </div>
  );
}
