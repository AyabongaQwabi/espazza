'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { redirect } from 'next/navigation';
import { MusicIcon, MenuIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Navigation = ({ className = '' }: { className?: string }) => {
  return (
    <nav className={`space-x-8 ${className}`}>
      <Link href='/' className='hover:text-red-500 transition-colors'>
        Ikhaya
      </Link>
      <Link href='/about' className='hover:text-red-500 transition-colors'>
        Malunga Nathi
      </Link>
      <Link href='/artists' className='hover:text-red-500 transition-colors'>
        Abaculi
      </Link>
      <Link href='/events' className='hover:text-red-500 transition-colors'>
        Events
      </Link>
      <Link href='/contact' className='hover:text-red-500 transition-colors'>
        Contact
      </Link>
    </nav>
  );
};

const RippleButton = ({ children, ...props }) => {
  return (
    <Button
      {...props}
      className='relative overflow-hidden transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95'
    >
      {children}
      <span className='absolute inset-0 bg-white opacity-25 rounded-full animate-ripple'></span>
    </Button>
  );
};

const FeatureCard = ({ title, subtitle, description, image }) => {
  return (
    <motion.div
      className='w-full sm:w-1/2 md:w-1/3 p-4'
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className='bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-md rounded-lg shadow-xl overflow-hidden h-full border border-zinc-800/50'>
        <div className='relative h-48'>
          <Image
            src={image || '/placeholder.svg'}
            alt={title}
            layout='fill'
            objectFit='cover'
            className='transition-transform duration-300 hover:scale-110'
          />
        </div>
        <div className='p-6'>
          <h3 className='text-2xl font-bold mb-2 text-white'>{title}</h3>
          <p className='text-zinc-300 mb-4'>{subtitle}</p>
          <p className='text-zinc-400'>{description}</p>
        </div>
      </div>
    </motion.div>
  );
};

const ArtistCard = ({ name, image, genre }) => {
  return (
    <motion.div
      className='w-64 h-80 m-4 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 backdrop-blur-md rounded-lg shadow-xl overflow-hidden transform transition-all duration-300 border border-zinc-800/50'
      whileHover={{ scale: 1.05, rotate: 0, skew: 0 }}
      initial={{ rotate: 3, skew: 3 }}
    >
      <div className='relative h-48'>
        <Image
          src={image || '/placeholder.svg'}
          alt={name}
          layout='fill'
          objectFit='cover'
          className='transition-transform duration-300 hover:scale-110'
        />
      </div>
      <div className='p-4'>
        <h3 className='text-xl font-bold mb-2 text-white'>{name}</h3>
        <p className='text-zinc-400'>{genre}</p>
      </div>
    </motion.div>
  );
};

export default function Home({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  if (searchParams.code) {
    redirect(`/reset-password?code=${searchParams.code}`);
  }
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className='min-h-screen bg-gradient-to-br from-zinc-900 to-zinc-800'>
      {/* Hero Section */}
      <section className='relative h-screen flex items-center justify-center overflow-hidden'>
        <motion.div
          className='absolute inset-0 z-0 min-h-screen flex items-center justify-center'
          style={{
            backgroundImage: 'url("/home.jpeg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          initial={{ scale: 1.03 }}
          animate={{ scale: 1 }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: 'reverse',
          }}
        >
          <div className='absolute inset-0 bg-gradient-to-br from-zinc-900/90 to-zinc-900/70' />
          <div className='relative z-10 text-center max-w-5xl px-4 flex-col items-center justify-center space-x-4 text-center'>
            <motion.h1
              className='text-5xl md:text-7xl font-bold mb-4 text-white '
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <img
                src='/logo.png'
                className='inline-flex items-center w-72 h-72 rounded-full'
              />
              <div className=''>
                <span> Unlock the Sound. Own the Culture </span>
              </div>
            </motion.h1>
            <motion.p
              className='text-xl md:text-2xl mb-8 text-zinc-300'
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Shop exclusive drops, vibe with the hottest artists, and fuel the
              future of Trap, Drill, RnB, Hip Hop, Amapiano, Gospel, Gqom &
              Sijokojoko. Tap in & make waves!{' '}
            </motion.p>
            <div className='space-x-4'>
              <Button asChild size='lg' className='bg-red-600 hover:bg-red-700'>
                <Link href='/register'>Sign up</Link>
              </Button>
              <Button
                asChild
                size='lg'
                variant='outline'
                className='text-white border-white hover:bg-white/10'
              >
                <Link href='/login'>Login</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>
      {/* Features Section */}
      <section className='py-16 bg-gradient-to-br from-zinc-900 to-zinc-800'>
        <div className='container mx-auto px-4'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className='text-center mb-12'
          >
            <h2 className='text-4xl font-bold text-white mb-4'>
              Welcome to the Spaza Shop
            </h2>
            <p className='text-zinc-400 max-w-2xl mx-auto'>
              Your one-stop platform for Hip Hop music, events, and culture.
            </p>
          </motion.div>
          <div className='flex flex-wrap -mx-4'>
            <FeatureCard
              title='Upload Your Music'
              subtitle='Share your talent with the world'
              description='Easily upload and manage your music catalog on eSpazza.'
              image='/flash.jpg'
            />
            <FeatureCard
              title='Connect with Artists'
              subtitle='Collaborate and grow together'
              description='Network with other artists and find exciting collaboration opportunities.'
              image='/kkeed.jpg'
            />
            <FeatureCard
              title='Grow Your Fame'
              subtitle='Reach a wider audience'
              description="Gain exposure and grow your fanbase through eSpazza's platform."
              image='/ndlu.jpg'
            />
          </div>
        </div>
      </section>{' '}
      <section className='py-16 bg-gradient-to-br from-zinc-800 to-zinc-900'>
        <div className='container mx-auto px-4'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className='text-center mb-12'
          >
            <h2 className='text-4xl font-bold text-white mb-4'>
              Iindidi Zomculo Ezamkelekileyo
            </h2>
            <p className='text-zinc-400 max-w-2xl mx-auto'>
              eSpazza welcomes artists from all music genres
            </p>
          </motion.div>
          <div className='flex flex-wrap justify-center gap-4'>
            {[
              'Trap',
              'Drill',
              'RnB',
              'Hip Hop',
              'Amapiano',
              'Gospel',
              'Gqom',
              'Sijokojoko',
            ].map((genre) => (
              <motion.div
                key={genre}
                className='bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold'
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {genre}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* Featured Artists Section */}
      <section className='py-16 bg-gradient-to-br from-zinc-800 to-zinc-900'>
        <div className='container mx-auto px-4'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className='text-center mb-12'
          >
            <h2 className='text-4xl font-bold text-white mb-4'>
              Abaculi Abaphambili
            </h2>
            <p className='text-zinc-400 max-w-2xl mx-auto'>
              Discover the rising stars of Hip Hop
            </p>
          </motion.div>
          <motion.div
            className='flex overflow-x-auto pb-8 space-x-6'
            initial={{ x: -100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <ArtistCard
              name='Dee Koala'
              image='/deekoala.jpg'
              genre='Hip Hop'
            />
            <ArtistCard name='K Keed' image='/kkeed.jpg' genre='Hip Hop' />
            <ArtistCard name='Flash Ikumkani' image='/flash.jpg' genre='Trap' />
            <ArtistCard name='Driemanskap' image='/ndlu.jpg' genre='Hip Hop' />
          </motion.div>
        </div>
      </section>
      {/* Event Search Section */}
      <section className='py-16 bg-gradient-to-br from-zinc-900 to-zinc-800'>
        <div className='container mx-auto px-4'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className='text-4xl font-bold text-white text-center mb-12'>
              Find Events
            </h2>
            <Card className='max-w-md mx-auto bg-zinc-800/50 backdrop-blur-md border-zinc-700'>
              <CardHeader>
                <CardTitle className='text-white'>Search for Events</CardTitle>
                <CardDescription className='text-zinc-400'>
                  Find exciting events happening near you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className='space-y-4'>
                  <div>
                    <label
                      htmlFor='location'
                      className='block text-sm font-medium text-zinc-300 mb-1'
                    >
                      Location
                    </label>
                    <Input
                      id='location'
                      placeholder='Enter city or venue'
                      className='bg-zinc-700/50 border-zinc-600 text-white placeholder-zinc-400'
                    />
                  </div>
                  <div>
                    <label
                      htmlFor='date'
                      className='block text-sm font-medium text-zinc-300 mb-1'
                    >
                      Date
                    </label>
                    <DatePicker
                      selected={selectedDate}
                      onChange={(date) => setSelectedDate(date)}
                      dateFormat='MMMM d, yyyy'
                      className='w-full px-3 py-2 bg-zinc-700/50 border border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 text-white'
                    />
                  </div>
                  <RippleButton className='w-full bg-red-600 hover:bg-red-700 text-white'>
                    Search Events
                  </RippleButton>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
