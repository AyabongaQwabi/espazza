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
        Iziganeko
      </Link>
      <Link href='/contact' className='hover:text-red-500 transition-colors'>
        Qhagamshelana
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
      <div className='bg-gradient-to-br from-primary/10 to-secondary/10 backdrop-blur-md rounded-lg shadow-lg overflow-hidden h-full'>
        <div className='relative h-48'>
          <Image
            src={image || '/placeholder.svg'}
            alt={title}
            layout='fill'
            objectFit='cover'
          />
        </div>
        <div className='p-6'>
          <h3 className='text-2xl font-bold mb-2'>{title}</h3>
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
      className='w-64 h-80 m-4 bg-gradient-to-br from-primary/10 to-secondary/10 backdrop-blur-md rounded-lg shadow-lg overflow-hidden transform transition-all duration-300'
      whileHover={{ scale: 1.05, rotate: 0, skew: 0 }}
      initial={{ rotate: 3, skew: 3 }}
    >
      <div className='relative h-48'>
        <Image
          src={image || '/placeholder.svg'}
          alt={name}
          layout='fill'
          objectFit='cover'
        />
      </div>
      <div className='p-4'>
        <h3 className='text-xl font-bold mb-2'>{name}</h3>
        <p className='text-zinc-600'>{genre}</p>
      </div>
    </motion.div>
  );
};

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className='min-h-screen bg-gradient-to-br from-background to-secondary/20'>
      {/* Header */}

      {/* Hero Section */}
      <section className='relative h-screen flex items-center justify-center overflow-hidden'>
        <motion.div
          className='absolute inset-0 z-0 min-h-screen flex items-center justify-center'
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&q=80")',
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
          {' '}
          <div className='absolute inset-0 bg-zinc-900/90' />
          <div className='relative z-10 text-center'>
            <motion.h1
              className='text-5xl md:text-7xl font-bold mb-4 text-primary'
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Ncaah kwi Xhosa Hip Hop App!
            </motion.h1>
            <motion.p
              className='text-xl md:text-2xl mb-8 text-primary-foreground'
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Discover and connect with amazing artists all on one platform.
            </motion.p>
            <div className='space-x-4'>
              <Button asChild size='lg' className='bg-red-600 hover:bg-red-700'>
                <Link href='/register'>Qala Apha</Link>
              </Button>
              <Button
                asChild
                size='lg'
                variant='outline'
                className='text-white border-white hover:bg-white/10'
              >
                <Link href='/login'>Ngena</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className='py-16 bg-gradient-to-br from-background to-primary/20'>
        <div className='container mx-auto px-4'>
          <h2 className='text-4xl font-bold mb-12 text-center'>
            Welcome to the Spaza Shop
          </h2>
          <div className='flex flex-wrap -mx-4'>
            <FeatureCard
              title='Upload Your Music'
              subtitle='Share your talent with the world'
              description='Easily upload and manage your music catalog on eSpazza.'
              image='https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80'
            />
            <FeatureCard
              title='Connect with Artists'
              subtitle='Collaborate and grow together'
              description='Network with other artists and find exciting collaboration opportunities.'
              image='https://images.unsplash.com/photo-1525362081669-2b476bb628c3?auto=format&fit=crop&q=80'
            />
            <FeatureCard
              title='Grow Your Fame'
              subtitle='Reach a wider audience'
              description="Gain exposure and grow your fanbase through eSpazza's platform."
              image='https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&q=80'
            />
          </div>
        </div>
      </section>

      {/* Featured Artists Section */}
      <section className='py-16 bg-gradient-to-br from-background to-secondary/20'>
        <div className='container mx-auto px-4'>
          <h2 className='text-4xl font-bold mb-12 text-center'>
            Abaculi Abaphambili
          </h2>
          <motion.div
            className='flex overflow-x-auto pb-8'
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <ArtistCard
              name='Dee Koala'
              image='/deekoala.jpg'
              genre='Hip Hop'
            />
            <ArtistCard name='K Keed' image='/kkeed.jpg' genre='Hip Hop' />
            <ArtistCard
              name='Flash Ikumkani'
              image='/flash.jpg'
              genre='Xhosa Trap'
            />
            <ArtistCard
              name='Driemanskap'
              image='/driemanskap.jpg'
              genre='Hip Hop'
            />
          </motion.div>
        </div>
      </section>

      {/* Event Search Section */}
      <section className='py-16 bg-gradient-to-br from-background to-primary/20'>
        <div className='container mx-auto px-4'>
          <h2 className='text-4xl font-bold mb-12 text-center'>Find Events</h2>
          <Card className='max-w-md mx-auto'>
            <CardHeader>
              <CardTitle>Search for Events</CardTitle>
              <CardDescription>
                Find exciting events happening near you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className='space-y-4'>
                <div>
                  <label
                    htmlFor='location'
                    className='block text-sm font-medium text-zinc-700 mb-1'
                  >
                    Location
                  </label>
                  <Input id='location' placeholder='Enter city or venue' />
                </div>
                <div>
                  <label
                    htmlFor='date'
                    className='block text-sm font-medium text-zinc-700 mb-1'
                  >
                    Date
                  </label>
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    dateFormat='MMMM d, yyyy'
                    className='w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary'
                  />
                </div>
                <RippleButton className='w-full'>Search Events</RippleButton>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
