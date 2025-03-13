'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MusicIcon, UsersIcon, BookOpenIcon, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { YoutubeIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import sign from 'jwt-encode';
import { EncryptJWT } from 'jose';
import axios from 'axios';
import crypto from 'crypto-js';
import url from 'url';
import short from 'short-uuid';
import ShortUniqueId from 'short-unique-id';

const SECRET_KEY = new Uint8Array(32);
const keyMaterial = new TextEncoder().encode(
  process.env.NEXT_PUBLIC_SECRET_KEY
);
SECRET_KEY.set(keyMaterial.slice(0, 32));
const API_ENDPOINT = 'https://api.ikhokha.com/public-api/v1/api/payment';
const APPLICATION_ID = process.env.NEXT_IKHOKA_APP_ID;
const APPLICATION_KEY = process.env.NEXT_PUBLIC_IKHOKA_APP_KEY;
const ITEMS_PER_PAGE = 12;

async function encryptData(data: any) {
  try {
    console.log('Encrypting data:', data);
    console.log('SECRET_KEY:', SECRET_KEY);
    const jwt = await new EncryptJWT(data)
      .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
      .setIssuedAt()
      .encrypt(SECRET_KEY);
    return jwt;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [youtubeLink, setYoutubeLink] = useState('');
  const [promotionalText, setPromotionalText] = useState('');
  const [promotingVideo, setPromotingVideo] = useState(false);

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      console.log('PROFILE', profileData);
      if (profileData) {
        setProfile(profileData);
      }

      // Load posts
      const { data: postsData } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (postsData) {
        setPosts(postsData);
      }

      // Load events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', user.id)
        .order('date', { ascending: true })
        .limit(5);

      if (eventsData) {
        setEvents(eventsData);
      }

      // Load bookings
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*, events(*)')
        .eq('artist_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (bookingsData) {
        setBookings(bookingsData);
      }

      setLoading(false);
    }

    loadData();
  }, []);

  function createPayloadToSign(urlPath: string, body = '') {
    try {
      const parsedUrl = url.parse(urlPath);
      const basePath = parsedUrl.path;
      if (!basePath) throw new Error('No basePath in url');
      const payload = basePath + body;
      return jsStringEscape(payload);
    } catch (error) {
      console.error('Error on createPayloadToSign:', error);
      return '';
    }
  }

  function jsStringEscape(str: string) {
    return str.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
  }

  const handlePromoteVideo = async () => {
    try {
      setPromotingVideo(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Error',
          description: 'User not authenticated',
          variant: 'destructive',
        });
        setPromotingVideo(false);
        return;
      }
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (!profileData?.username) {
        toast({
          title: 'Error',
          description: 'Could not find user profile',
          variant: 'destructive',
        });
        return;
      }

      const transactionId = short().toUUID(short.generate());
      const totalPrice = 100 * 100; // Convert to cents
      // const request = {
      //   entityID: youtubeLink,
      //   externalEntityID: youtubeLink,
      //   amount: totalPrice,
      //   currency: 'ZAR',
      //   requesterUrl: 'https://espazza.co.za/dashboard',
      //   description: `Purchase of YT Link Promotion: ${youtubeLink}}`,
      //   paymentReference: `${user.id}-yt-promo-${transactionId}`,
      //   mode: 'live',
      //   externalTransactionID: transactionId,
      //   urls: {
      //     callbackUrl: 'https://espazza.co.za/api/payment/callback',
      //     successPageUrl: `https://espazza.co.za/dashboard/success?transaction_id=${transactionId}`,
      //     failurePageUrl: 'https://espazza.co.za/failure',
      //     cancelUrl: 'https://espazza.co.za/cancel',
      //   },
      // };

      // const response = await axios.post('/api/payment', request);
      const { data, error } = await supabase
        .from('video_promotion_queue')
        .insert({
          youtube_link: youtubeLink,
          promotional_text: promotionalText,
          user_id: user.id,
          username: profileData.username,
          transaction_id: transactionId,
          status: 'pending',
          created_at: new Date().toISOString(),
        });

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to promote video',
          variant: 'destructive',
        });
        setPromotingVideo(false);
        throw error;
      }

      setYoutubeLink('');
      setPromotionalText('');

      // if (response.data?.paylinkUrl) {

      //   window.location.href = response.data.paylinkUrl;
      // } else {
      //   setPromotingVideo(false);
      //   throw new Error('No payment URL received');
      // }

      // Insert into video_promotion_queue table

      toast({
        title: 'Success',
        description: 'Video promotion request has been queued',
      });
      setPromotingVideo(false);
    } catch (error) {
      console.error('Error promoting video:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className='p-8 w-full h-screen flex items-center justify-center'>
        <p className='text-zinc-400'>Loading...</p>
      </div>
    );
  }

  return (
    <div className='p-8'>
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='mb-8'
      >
        <h1 className='text-3xl font-bold text-white mb-2'>
          Molo, {profile?.artist_name || profile?.username || 'Artist'}!
        </h1>
        <p className='text-zinc-400'>Welcome back to your eSpazza dashboard</p>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-8'
      >
        <Button asChild className='bg-red-600 hover:bg-red-700'>
          <Link href='/dashboard/blog/new'>
            <PlusIcon className='h-4 w-4 mr-2' />
            Create New Post
          </Link>
        </Button>
        <Button asChild variant='outline'>
          <Link href='/dashboard/events'>
            <PlusIcon className='h-4 w-4 mr-2' />
            Create Event
          </Link>
        </Button>
        <Button asChild variant='outline'>
          <Link href='/dashboard/merchandise'>
            <PlusIcon className='h-4 w-4 mr-2' />
            Add Product
          </Link>
        </Button>
        <Button asChild variant='outline'>
          <Link href='/dashboard/messages'>
            <PlusIcon className='h-4 w-4 mr-2' />
            New Message
          </Link>
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant='outline'>
              <YoutubeIcon className='h-4 w-4 mr-2' />
              Promote YouTube Video
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Promote YouTube Video</DialogTitle>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='grid gap-2'>
                <label htmlFor='youtubeLink'>YouTube Video Link</label>
                <Input
                  id='youtubeLink'
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                  placeholder='https://www.youtube.com/watch?v=...'
                />
              </div>
              <div className='grid gap-2'>
                <label htmlFor='promotionalText'>Promotional Text</label>
                <Textarea
                  id='promotionalText'
                  value={promotionalText}
                  onChange={(e) => setPromotionalText(e.target.value)}
                  placeholder='Enter your promotional text here...'
                />
              </div>
            </div>
            <Button disabled={promotingVideo} onClick={handlePromoteVideo}>
              {promotingVideo ? 'Saving...' : 'Promote Video'}
            </Button>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'
      >
        <Card className='bg-zinc-900 border-zinc-800'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-lg font-medium text-white'>
              Posts
            </CardTitle>
            <BookOpenIcon className='h-5 w-5 text-red-600' />
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-white'>{posts.length}</div>
            <p className='text-zinc-400 text-sm mt-1'>
              {posts.filter((post) => post.published).length} published
            </p>
          </CardContent>
        </Card>

        <Card className='bg-zinc-900 border-zinc-800'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-lg font-medium text-white'>
              Events
            </CardTitle>
            <MusicIcon className='h-5 w-5 text-red-600' />
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-white'>{events.length}</div>
            <p className='text-zinc-400 text-sm mt-1'>
              {
                events.filter((event) => new Date(event.date) > new Date())
                  .length
              }{' '}
              upcoming
            </p>
          </CardContent>
        </Card>

        <Card className='bg-zinc-900 border-zinc-800'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-lg font-medium text-white'>
              Bookings
            </CardTitle>
            <UsersIcon className='h-5 w-5 text-red-600' />
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-white'>
              {bookings.length}
            </div>
            <p className='text-zinc-400 text-sm mt-1'>
              {
                bookings.filter((booking) => booking.status === 'Pending')
                  .length
              }{' '}
              pending
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className='grid grid-cols-1 md:grid-cols-2 gap-8'
      >
        {/* Recent Posts */}
        <Card className='bg-zinc-900 border-zinc-800'>
          <CardHeader>
            <CardTitle className='text-white'>Recent Posts</CardTitle>
            <CardDescription>Your latest blog posts</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className='h-[300px]'>
              <div className='space-y-4'>
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/dashboard/blog/edit/${post.id}`}
                    className='block'
                  >
                    <div className='bg-zinc-800 p-4 rounded-lg hover:bg-zinc-700 transition-colors'>
                      <h3 className='text-white font-medium mb-1'>
                        {post.title}
                      </h3>
                      <div className='flex items-center text-sm text-zinc-400'>
                        <span>
                          {new Date(post.created_at).toLocaleDateString(
                            'en-ZA'
                          )}
                        </span>
                        <span className='mx-2'>•</span>
                        <span
                          className={
                            post.published
                              ? 'text-green-500'
                              : 'text-yellow-500'
                          }
                        >
                          {post.published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
                {posts.length === 0 && (
                  <div className='text-center py-8'>
                    <p className='text-zinc-400 mb-4'>No posts yet</p>
                    <Button asChild>
                      <Link href='/dashboard/blog/new'>
                        Create Your First Post
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card className='bg-zinc-900 border-zinc-800'>
          <CardHeader>
            <CardTitle className='text-white'>Recent Bookings</CardTitle>
            <CardDescription>Your latest event bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className='h-[300px]'>
              <div className='space-y-4'>
                {bookings.map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/dashboard/bookings`}
                    className='block'
                  >
                    <div className='bg-zinc-800 p-4 rounded-lg hover:bg-zinc-700 transition-colors'>
                      <h3 className='text-white font-medium mb-1'>
                        {booking.events?.name}
                      </h3>
                      <div className='flex items-center text-sm text-zinc-400'>
                        <span>
                          {new Date(booking.created_at).toLocaleDateString(
                            'en-ZA'
                          )}
                        </span>
                        <span className='mx-2'>•</span>
                        <span
                          className={
                            booking.status === 'Pending'
                              ? 'text-yellow-500'
                              : booking.status === 'Approved'
                              ? 'text-green-500'
                              : 'text-red-500'
                          }
                        >
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
                {bookings.length === 0 && (
                  <div className='text-center py-8'>
                    <p className='text-zinc-400'>No bookings yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
