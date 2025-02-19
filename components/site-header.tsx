'use client';

import Link from 'next/link';
import {
  HomeIcon,
  InfoIcon,
  UsersIcon,
  CalendarIcon,
  ShoppingBagIcon,
  BookOpenIcon,
  MailIcon,
  LogOutIcon,
  UserIcon,
  LayoutDashboardIcon,
  MenuIcon,
  MusicIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useSupabase } from '@/components/providers/supabase-provider';
import { motion } from 'framer-motion';
import { IconButton } from '@/components/ui/icon-button';
import { HoverIcon } from '@/components/ui/hover-icon';
import { BounceIcon } from '@/components/ui/bounce-icon';

function Navigation({ className = '' }: { className?: string }) {
  return (
    <nav className={`flex items-center ${className}`}>
      <div className='flex items-center space-x-8'>
        <Link
          href='/'
          className='hover:text-red-500 transition-colors flex items-center gap-2'
        >
          <HoverIcon Icon={HomeIcon} size={16} />
          <span>Ikhaya</span>
        </Link>
        <Link
          href='/about'
          className='hover:text-red-500 transition-colors flex items-center gap-2'
        >
          <HoverIcon Icon={InfoIcon} size={16} />
          <span>Malunga Nathi</span>
        </Link>
        <Link
          href='/blog'
          className='hover:text-red-500 transition-colors flex items-center gap-2'
        >
          <HoverIcon Icon={BookOpenIcon} size={16} />
          <span>iiPosts</span>
        </Link>
        <Link
          href='/artists'
          className='hover:text-red-500 transition-colors flex items-center gap-2'
        >
          <HoverIcon Icon={UsersIcon} size={16} />
          <span>iiMCs</span>
        </Link>
        <Link
          href='/merch'
          className='hover:text-red-500 transition-colors flex items-center gap-2'
        >
          <HoverIcon Icon={ShoppingBagIcon} size={16} />
          <span>iMerch</span>
        </Link>
        <Link
          href='/releases'
          className='hover:text-red-500 transition-colors flex items-center gap-2'
        >
          <HoverIcon Icon={ShoppingBagIcon} size={16} />
          <span>iiTracks</span>
        </Link>
        <Link
          href='/events'
          className='hover:text-red-500 transition-colors flex items-center gap-2'
        >
          <HoverIcon Icon={CalendarIcon} size={16} />
          <span>Iziganeko</span>
        </Link>
        <Link
          href='/contact'
          className='hover:text-red-500 transition-colors flex items-center gap-2'
        >
          <HoverIcon Icon={MailIcon} size={16} />
          <span>Qhagamshelana</span>
        </Link>
      </div>
    </nav>
  );
}

export function SiteHeader() {
  const { user, loading } = useSupabase();

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
              </motion.div>
            ) : (
              <>
                <Link href='/login'>
                  <IconButton
                    Icon={UserIcon}
                    label='Ngena'
                    variant='ghost'
                    asChild
                  >
                    Ngena
                  </IconButton>
                </Link>

                <Link href='/register'>
                  <IconButton
                    Icon={MusicIcon}
                    label='Qala Apha'
                    className='bg-red-600 hover:bg-red-700'
                    asChild
                  >
                    Qala Apha
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
            className='bg-zinc-900 border-r border-zinc-800'
          >
            <div className='flex flex-col space-y-6 mt-8'>
              <div className='flex flex-col space-y-4'>
                <Link
                  href='/'
                  className='hover:text-red-500 transition-colors flex items-center gap-2'
                >
                  <HoverIcon Icon={HomeIcon} size={16} />
                  <span>Ikhaya</span>
                </Link>
                <Link
                  href='/about'
                  className='hover:text-red-500 transition-colors flex items-center gap-2'
                >
                  <HoverIcon Icon={InfoIcon} size={16} />
                  <span>Malunga Nathi</span>
                </Link>
                <Link
                  href='/blog'
                  className='hover:text-red-500 transition-colors flex items-center gap-2'
                >
                  <HoverIcon Icon={BookOpenIcon} size={16} />
                  <span>iiPosts</span>
                </Link>
                <Link
                  href='/artists'
                  className='hover:text-red-500 transition-colors flex items-center gap-2'
                >
                  <HoverIcon Icon={UsersIcon} size={16} />
                  <span>iiMCs</span>
                </Link>
                <Link
                  href='/merch'
                  className='hover:text-red-500 transition-colors flex items-center gap-2'
                >
                  <HoverIcon Icon={ShoppingBagIcon} size={16} />
                  <span>iMerch</span>
                </Link>
                <Link
                  href='/releases'
                  className='hover:text-red-500 transition-colors flex items-center gap-2'
                >
                  <HoverIcon Icon={ShoppingBagIcon} size={16} />
                  <span>iiTracks</span>
                </Link>
                <Link
                  href='/events'
                  className='hover:text-red-500 transition-colors flex items-center gap-2'
                >
                  <HoverIcon Icon={CalendarIcon} size={16} />
                  <span>Iziganeko</span>
                </Link>
                <Link
                  href='/contact'
                  className='hover:text-red-500 transition-colors flex items-center gap-2'
                >
                  <HoverIcon Icon={MailIcon} size={16} />
                  <span>Qhagamshelana</span>
                </Link>
              </div>

              <hr className='border-zinc-800' />

              {!loading &&
                (user ? (
                  <Link href='/dashboard'>
                    <IconButton
                      Icon={LayoutDashboardIcon}
                      label='Dashboard'
                      className='bg-red-600 hover:bg-red-700 w-full'
                      asChild
                    >
                      Dashboard
                    </IconButton>
                  </Link>
                ) : (
                  <div className='space-y-4'>
                    <Link href='/login'>
                      <IconButton
                        Icon={UserIcon}
                        label='Ngena'
                        variant='ghost'
                        className='w-full'
                        asChild
                      >
                        Ngena
                      </IconButton>
                    </Link>

                    <Link href='/register'>
                      <IconButton
                        Icon={MusicIcon}
                        label='Qala Apha'
                        className='bg-red-600 hover:bg-red-700 w-full'
                        asChild
                      >
                        Qala Apha
                      </IconButton>
                    </Link>
                  </div>
                ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </motion.header>
  );
}
