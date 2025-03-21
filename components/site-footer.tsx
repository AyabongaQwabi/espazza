'use client';

import {
  MusicIcon,
  Mail,
  Phone,
  MapPin,
  Twitter,
  Instagram,
  Youtube,
  InfoIcon,
  UsersIcon,
  CalendarIcon,
  BookOpenIcon,
  ShieldIcon,
  FileTextIcon,
} from 'lucide-react';
import Link from 'next/link';
import { IconButton } from '@/components/ui/icon-button';
import { HoverIcon } from '@/components/ui/hover-icon';

export function SiteFooter() {
  return (
    <footer className='bg-zinc-900'>
      <div className='max-w-7xl mx-auto px-4 py-12'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
          <div>
            <div className='flex items-center space-x-2 mb-4'>
              <img src='/logo.png' className='w-10 h-10 rounded-full' />
              <span className='text-2xl font-bold text-white'>eSpazza</span>
            </div>
            <p className='text-zinc-400'>The home of South African music</p>
          </div>

          <div>
            <h3 className='text-white font-semibold mb-4'>Quick Links</h3>
            <ul className='space-y-2'>
              {[
                { href: '/about', icon: InfoIcon, label: 'About Us' },
                { href: '/artists', icon: UsersIcon, label: 'Artists' },
                { href: '/events', icon: CalendarIcon, label: 'Events' },
                { href: '/blog', icon: BookOpenIcon, label: 'iiPosts' },
                { href: '/privacy', icon: ShieldIcon, label: 'Privacy Policy' },
                { href: '/terms', icon: FileTextIcon, label: 'Terms of Use' },
              ].map(({ href, icon: Icon, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className='text-zinc-400 hover:text-white flex items-center gap-2'
                  >
                    <Icon className='w-4 h-4' />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className='text-white font-semibold mb-4'>Contact</h3>
            <ul className='space-y-2 text-zinc-400'>
              <li className='flex items-center gap-2'>
                <Mail className='w-4 h-4' />
                info@espazza.co.za
              </li>
              <li className='flex items-center gap-2'>
                <Phone className='w-4 h-4' />
                0603116777
              </li>
              <li className='flex items-center gap-2'>
                <MapPin className='w-4 h-4' />
                Cape Town, South Africa
              </li>
            </ul>
          </div>

          <div>
            <h3 className='text-white font-semibold mb-4'>Follow Us</h3>
            <div className='flex space-x-4'>
              <IconButton
                Icon={Twitter}
                label='Twitter'
                variant='ghost'
                size='sm'
                className='hover:text-blue-400'
                asChild
              >
                <a href='#' target='_blank' rel='noopener noreferrer'>
                  Twitter
                </a>
              </IconButton>
              <IconButton
                Icon={Instagram}
                label='Instagram'
                variant='ghost'
                size='sm'
                className='hover:text-pink-500'
                asChild
              >
                <a href='#' target='_blank' rel='noopener noreferrer'>
                  Instagram
                </a>
              </IconButton>
              <IconButton
                Icon={Youtube}
                label='YouTube'
                variant='ghost'
                size='sm'
                className='hover:text-red-500'
                asChild
              >
                <a href='#' target='_blank' rel='noopener noreferrer'>
                  YouTube
                </a>
              </IconButton>
            </div>
          </div>
        </div>

        <div className='border-t border-zinc-800 mt-12 pt-8 text-center text-zinc-400'>
          <p>&copy; {new Date().getFullYear()} eSpazza. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
