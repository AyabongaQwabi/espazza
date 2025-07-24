'use client';

import Link from 'next/link';
import {
  InfoIcon,
  UsersIcon,
  CalendarIcon,
  ShoppingBagIcon,
  BookOpenIcon,
  MailIcon,
  UserIcon,
  LayoutDashboardIcon,
  MenuIcon,
  MusicIcon,
  MessageSquare,
  EditIcon,
  PackageIcon,
  ShoppingCart,
  BarChart3,
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useSupabase } from '@/components/providers/supabase-provider';
import { motion } from 'framer-motion';
import { IconButton } from '@/components/ui/icon-button';
import { HoverIcon } from '@/components/ui/hover-icon';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';

function Navigation({ className = '' }: { className?: string }) {
  return (
    <nav className={`flex items-center ${className}`}>
      <div className='flex items-center space-x-8'>
        <Link
          href='/releases'
          className='hover:text-red-500 transition-colors flex items-center gap-2'
        >
          <HoverIcon Icon={ShoppingBagIcon} size={16} />
          <span>Music</span>
        </Link>
        <Link
          href='/blog'
          className='hover:text-red-500 transition-colors flex items-center gap-2'
        >
          <HoverIcon Icon={BookOpenIcon} size={16} />
          <span>Posts</span>
        </Link>
        <Link
          href='/podcasts'
          className='hover:text-red-500 transition-colors flex items-center gap-2'
        >
          <HoverIcon Icon={UsersIcon} size={16} />
          <span>Podcasts</span>
        </Link>
        <Link
          href='/videos'
          className='hover:text-red-500 transition-colors flex items-center gap-2'
        >
          <HoverIcon Icon={ShoppingBagIcon} size={16} />
          <span>Hot Videos</span>
        </Link>
        <Link
          href='/producers'
          className='hover:text-red-500 transition-colors flex items-center gap-2'
        >
          <HoverIcon Icon={ShoppingBagIcon} size={16} />
          <span>Producers</span>
        </Link>

        <Link
          href='/merch-store'
          className='hover:text-red-500 transition-colors flex items-center gap-2'
        >
          <HoverIcon Icon={ShoppingBagIcon} size={16} />
          <span>Buy Merch</span>
        </Link>
        {/* <Link
          href='/events'
          className='hover:text-red-500 transition-colors flex items-center gap-2'
        >
          <HoverIcon Icon={CalendarIcon} size={16} />
          <span>Events</span>
        </Link> */}
      </div>
    </nav>
  );
}

export function SiteHeader() {
  const { user, loading } = useSupabase();
  const router = useRouter();
  return (
    <motion.header
      className='fixed w-full z-50 bg-zinc-900/90 backdrop-blur-sm border-b border-zinc-800'
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className='max-w-7xl mx-auto px-4 h-16 flex items-center justify-between'>
        <Link href='/' className='flex items-center space-x-2 hover-lift'>
          <img src='/logo.png' className='w-10 h-10 rounded-full' />
          <span className='text-2xl font-bold text-white'>eSpazza</span>
        </Link>

        <Navigation className='hidden lg:flex text-sm text-white' />

        <div className='hidden lg:flex items-center space-x-4'>
          {!loading &&
            (user ? (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href='/dashboard'>
                  <IconButton
                    Icon={LayoutDashboardIcon}
                    label='Dashboard'
                    variant='default'
                    className='bg-red-600 hover:bg-red-700'
                    asChild
                  >
                    Dashboard
                  </IconButton>
                </Link>
                <a
                  onClick={async () => {
                    await supabase.auth.signOut();
                    router.push('/login');
                  }}
                >
                  <IconButton
                    Icon={LayoutDashboardIcon}
                    label='Logout'
                    variant='default'
                    className='ml-2'
                  >
                    Logout
                  </IconButton>
                </a>
              </motion.div>
            ) : (
              <>
                <Link href='/login'>
                  <IconButton
                    Icon={UserIcon}
                    label='Login'
                    variant='ghost'
                    asChild
                  >
                    Login
                  </IconButton>
                </Link>

                <Link href='/register'>
                  <IconButton
                    Icon={MusicIcon}
                    label='Sign up'
                    className='bg-red-600 hover:bg-red-700'
                    asChild
                  >
                    Sign up
                  </IconButton>
                </Link>
              </>
            ))}
        </div>

        <Sheet>
          <SheetTrigger className='lg:hidden'>
            <MenuIcon className='h-6 w-6 text-white' />
          </SheetTrigger>
          <SheetContent
            side='left'
            className='bg-zinc-900 border-r border-zinc-800 p-0'
          >
            <ScrollArea className='h-full'>
              <div className='flex flex-col space-y-6 mt-8 p-6'>
                <div className='flex flex-col space-y-4'>
                  <Link
                    href='/'
                    className='hover:text-red-500 transition-colors flex items-center gap-2'
                  >
                    <HoverIcon Icon={BookOpenIcon} size={16} />
                    <span>Community</span>
                  </Link>
                  <Link
                    href='/artists'
                    className='hover:text-red-500 transition-colors flex items-center gap-2'
                  >
                    <HoverIcon Icon={UsersIcon} size={16} />
                    <span>Artists</span>
                  </Link>
                  <Link
                    href='/merch'
                    className='hover:text-red-500 transition-colors flex items-center gap-2'
                  >
                    <HoverIcon Icon={ShoppingBagIcon} size={16} />
                    <span>Merchants</span>
                  </Link>
                  <Link
                    href='/producers'
                    className='hover:text-red-500 transition-colors flex items-center gap-2'
                  >
                    <HoverIcon Icon={ShoppingBagIcon} size={16} />
                    <span>Producers</span>
                  </Link>
                  <Link
                    href='/releases'
                    className='hover:text-red-500 transition-colors flex items-center gap-2'
                  >
                    <HoverIcon Icon={ShoppingBagIcon} size={16} />
                    <span>Tracks</span>
                  </Link>
                  <Link
                    href='/merch-store'
                    className='hover:text-red-500 transition-colors flex items-center gap-2'
                  >
                    <HoverIcon Icon={ShoppingBagIcon} size={16} />
                    <span>Buy Merch</span>
                  </Link>
                  <Link
                    href='/events'
                    className='hover:text-red-500 transition-colors flex items-center gap-2'
                  >
                    <HoverIcon Icon={CalendarIcon} size={16} />
                    <span>Events</span>
                  </Link>
                </div>

                <hr className='border-zinc-800' />

                {!loading &&
                  (user ? (
                    <div className='space-y-4'>
                      <h3 className='text-sm font-semibold text-zinc-400'>
                        Dashboard
                      </h3>
                      <div className='space-y-2'>
                        <Link href='/dashboard'>
                          <IconButton
                            Icon={LayoutDashboardIcon}
                            label='Overview'
                            variant='ghost'
                            className='w-full justify-start'
                            asChild
                          >
                            Overview
                          </IconButton>
                        </Link>
                        <Link href='/dashboard/profile'>
                          <IconButton
                            Icon={UserIcon}
                            label='Profile'
                            variant='ghost'
                            className='w-full justify-start'
                            asChild
                          >
                            Profile
                          </IconButton>
                        </Link>
                        <Link href='/dashboard/messages'>
                          <IconButton
                            Icon={MessageSquare}
                            label='Messages'
                            variant='ghost'
                            className='w-full justify-start'
                            asChild
                          >
                            Messages
                          </IconButton>
                        </Link>
                        <Link href='/dashboard/blog'>
                          <IconButton
                            Icon={EditIcon}
                            label='Manage Community'
                            variant='ghost'
                            className='w-full justify-start'
                            asChild
                          >
                            Manage Community
                          </IconButton>
                        </Link>
                        <Link href='/dashboard/merchandise'>
                          <IconButton
                            Icon={PackageIcon}
                            label='Manage Merchandise'
                            variant='ghost'
                            className='w-full justify-start'
                            asChild
                          >
                            Manage Merchandise
                          </IconButton>
                        </Link>
                        <Link href='/dashboard/orders'>
                          <IconButton
                            Icon={ShoppingCart}
                            label='Orders'
                            variant='ghost'
                            className='w-full justify-start'
                            asChild
                          >
                            Orders
                          </IconButton>
                        </Link>
                        <Link href='/dashboard/balances'>
                          <IconButton
                            Icon={BarChart3}
                            label='Balances'
                            variant='ghost'
                            className='w-full justify-start'
                            asChild
                          >
                            Balances
                          </IconButton>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className='space-y-4'>
                      <Link href='/login'>
                        <IconButton
                          Icon={UserIcon}
                          label='Login'
                          variant='ghost'
                          className='w-full'
                          asChild
                        >
                          Login
                        </IconButton>
                      </Link>

                      <Link href='/register'>
                        <IconButton
                          Icon={MusicIcon}
                          label='Sign up'
                          className='bg-red-600 hover:bg-red-700 w-full'
                          asChild
                        >
                          Sign up
                        </IconButton>
                      </Link>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    </motion.header>
  );
}
