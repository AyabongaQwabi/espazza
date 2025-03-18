'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';
import {
  CalendarIcon,
  MapPinIcon,
  TicketIcon,
  UsersIcon,
  UserIcon,
  Loader2,
  AlertTriangle,
  Heart,
  MessageCircle,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';
import axios from 'axios';
import crypto from 'crypto-js';
import url from 'url';
import short from 'short-uuid';
import { motion, AnimatePresence } from 'framer-motion';

const API_ENDPOINT = 'https://api.ikhokha.com/public-api/v1/api/payment';
const APPLICATION_ID = process.env.NEXT_IKHOKA_APP_ID;
const APPLICATION_KEY = process.env.NEXT_PUBLIC_IKHOKA_APP_KEY;
const SURCHARGE = 2;

export default function EventClient({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [availableTickets, setAvailableTickets] = useState(0);
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchEvent();
    checkAuth();
  }, []);

  async function checkAuth() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      checkIfLiked(user.id);
    }
  }

  async function checkIfLiked(userId: string) {
    const { data } = await supabase
      .from('event_likes')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    setIsLiked(!!data);
  }

  async function fetchEvent() {
    const { data: event, error } = await supabase
      .from('events')
      .select(
        `
        *,
        venues (name, address),
        south_african_towns (name),
        profiles!organizer_id (username, artist_name)
      `
      )
      .eq('id', eventId)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
      router.push('/events');
      return;
    }

    setEvent(event);
    fetchLikes(event.id);
    fetchComments(event.id);

    // Get available tickets count
    const { data: ticketsData } = await supabase
      .from('event_tickets')
      .select('quantity')
      .eq('event_id', event.id)
      .eq('status', 'confirmed');

    const soldTickets =
      ticketsData?.reduce((sum, ticket) => sum + ticket.quantity, 0) || 0;
    const available = event.max_attendees
      ? event.max_attendees - soldTickets
      : null;

    setAvailableTickets(available);
    setLoading(false);
  }

  async function fetchLikes(eventId: string) {
    const { data } = await supabase
      .from('event_likes')
      .select('*, profiles(username, profile_image_url)')
      .eq('event_id', eventId);
    setLikes(data || []);
  }

  async function fetchComments(eventId: string) {
    const { data } = await supabase
      .from('event_comments')
      .select('*, profiles(username, profile_image_url)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });
    setComments(data || []);
  }

  async function handleLike() {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to like events',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from('event_likes')
          .delete()
          .eq('event_id', event.id)
          .eq('user_id', user.id);
        setLikes(likes.filter((like) => like.user_id !== user.id));
      } else {
        const { data } = await supabase
          .from('event_likes')
          .insert([{ event_id: event.id, user_id: user.id }])
          .select('*, profiles(username, profile_image_url)')
          .single();
        if (data) {
          setLikes([...likes, data]);
        }
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: 'Error',
        description: 'Failed to like event. Please try again.',
        variant: 'destructive',
      });
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to comment',
        variant: 'destructive',
      });
      return;
    }

    if (!newComment.trim()) return;

    try {
      const { data, error } = await supabase
        .from('event_comments')
        .insert([
          {
            event_id: event.id,
            user_id: user.id,
            content: newComment,
          },
        ])
        .select('*, profiles(username, profile_image_url)')
        .single();

      if (error) throw error;

      setComments([...comments, data]);
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to post comment. Please try again.',
        variant: 'destructive',
      });
    }
  }

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
    try {
      return str.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
    } catch (error) {
      console.error('Error on jsStringEscape:', error);
      return '';
    }
  }

  async function handlePurchaseTicket() {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to purchase tickets',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    if (!event.ticket_price) {
      toast({
        title: 'Error',
        description: 'This event is free and does not require ticket purchase.',
        variant: 'destructive',
      });
      return;
    }

    if (availableTickets !== null && availableTickets <= 0) {
      toast({
        title: 'Sold Out',
        description: 'Sorry, this event is sold out.',
        variant: 'destructive',
      });
      return;
    }

    setPurchaseLoading(true);

    try {
      const transactionId = short().toUUID(short.generate());
      const totalPrice = event.ticket_price + SURCHARGE;

      const request = {
        entityID: event.id,
        externalEntityID: event.id,
        amount: totalPrice * 100, // Convert to cents
        currency: 'ZAR',
        requesterUrl: 'https://espazza.co.za/events',
        description: `Ticket for ${event.name} (includes R${SURCHARGE} service fee)`,
        paymentReference: event.id,
        mode: 'live',
        externalTransactionID: transactionId,
        urls: {
          callbackUrl: 'https://espazza.co.za/api/payment/callback',
          successPageUrl: `https://espazza.co.za/events/ticket/success?transaction_id=${transactionId}`,
          failurePageUrl: 'https://espazza.co.za/failure',
          cancelUrl: 'https://espazza.co.za/cancel',
        },
      };

      const requestBody = JSON.stringify(request);
      const payloadToSign = createPayloadToSign(API_ENDPOINT, requestBody);
      const signature = crypto
        .HmacSHA256(payloadToSign, APPLICATION_KEY.trim())
        .toString(crypto.enc.Hex);

      const response = await axios.post('/api/payment', request);
      console.log('Payment API response:', response.data);
      if (response.data?.paylinkUrl) {
        // Create ticket record
        console.log('Creating ticket record...', {
          event_id: event.id,
          buyer_id: user.id,
          quantity: 1,
          total_price: totalPrice,
          transaction_id: transactionId,
          status: 'pending',
        });
        const { error: ticketError } = await supabase
          .from('event_tickets')
          .insert([
            {
              event_id: event.id, // Explicitly specify the table
              buyer_id: user.id,
              quantity: 1,
              total_price: totalPrice,
              transaction_id: transactionId,
              status: 'pending',
            },
          ]);

        if (ticketError) throw ticketError;

        window.location.href = response.data.paylinkUrl;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to process ticket purchase. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPurchaseLoading(false);
    }
  }

  if (loading) {
    return <div className='p-4'>Loading event details...</div>;
  }

  if (!event) {
    return <div className='p-4'>Event not found</div>;
  }

  const isSoldOut = availableTickets !== null && availableTickets <= 0;
  console.log('conmments', comments);
  return (
    <div className='container mx-auto p-4'>
      <Button onClick={() => router.push('/events')} className='mb-4'>
        Back to Events
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{event?.name}</CardTitle>
          <CardDescription>
            <div className='flex items-center'>
              <CalendarIcon className='mr-2 h-4 w-4' />
              {event && format(new Date(event.date), 'PPP')}
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid md:grid-cols-2 gap-6'>
            {/* Left Column */}
            <div>
              <Image
                src={event?.cover_image || '/placeholder.svg'}
                alt={event?.name}
                width={500}
                height={300}
                className='rounded-lg object-cover w-full h-64'
              />
              <div className='mt-4 space-y-2'>
                <div className='flex items-center'>
                  <MapPinIcon className='mr-2 h-4 w-4' />
                  {event?.venues?.name}, {event?.venues?.address},{' '}
                  {event?.south_african_towns?.name}
                </div>
                <div className='flex items-center'>
                  <TicketIcon className='mr-2 h-4 w-4' />
                  Ticket Price:{' '}
                  {event?.ticket_price ? (
                    <>
                      R{event.ticket_price}{' '}
                      <span className='text-sm text-zinc-400'>
                        (+R{SURCHARGE} service fee)
                      </span>
                    </>
                  ) : (
                    'Free'
                  )}
                </div>
                <div className='flex items-center'>
                  <UsersIcon className='mr-2 h-4 w-4' />
                  {availableTickets !== null ? (
                    <>Available Tickets: {availableTickets}</>
                  ) : (
                    'Unlimited Tickets'
                  )}
                </div>
                {event?.profiles && (
                  <div className='flex items-center'>
                    <UserIcon className='mr-2 h-4 w-4' />
                    Organizer:{' '}
                    {event.profiles.artist_name || event.profiles.username}
                  </div>
                )}
              </div>

              {/* Likes and Comments Section */}
              <div className='mt-6 flex items-center space-x-4'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleLike}
                  className={isLiked ? 'text-red-500' : ''}
                >
                  <Heart className='h-5 w-5 mr-2' />
                  {likes.length} {likes.length === 1 ? 'Like' : 'Likes'}
                </Button>
                <Button variant='ghost' size='sm'>
                  <MessageCircle className='h-5 w-5 mr-2' />
                  {comments.length}{' '}
                  {comments.length === 1 ? 'Comment' : 'Comments'}
                </Button>
              </div>

              {event?.ticket_price > 0 && (
                <>
                  {isSoldOut ? (
                    <div className='mt-6 bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-center justify-center'>
                      <AlertTriangle className='h-5 w-5 text-red-500 mr-2' />
                      <span className='text-red-500 font-semibold'>
                        Sold Out
                      </span>
                    </div>
                  ) : (
                    <Button
                      onClick={handlePurchaseTicket}
                      className='mt-6 w-full bg-red-600 hover:bg-red-700'
                      disabled={purchaseLoading || isSoldOut}
                    >
                      {purchaseLoading ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          Processing...
                        </>
                      ) : (
                        <>
                          Purchase Ticket - R{event.ticket_price + SURCHARGE}{' '}
                          (incl. fee)
                        </>
                      )}
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Right Column */}
            <div className='space-y-6'>
              <div>
                <h3 className='text-xl font-semibold mb-2'>
                  Event Description
                </h3>
                <p className='text-zinc-400'>{event?.description}</p>
              </div>

              {/* Comments Section */}
              <div className='mt-6'>
                <h3 className='text-xl font-semibold mb-4'>Comments</h3>
                <form onSubmit={handleComment} className='mb-6'>
                  <Textarea
                    placeholder='Add a comment...'
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className='mb-2'
                  />
                  <Button type='submit' disabled={!user}>
                    <Send className='h-4 w-4 mr-2' />
                    Post Comment
                  </Button>
                </form>

                <div className='h-96 overflow-y-auto'>
                  <AnimatePresence>
                    {comments.map((comment) => (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className='bg-zinc-900 rounded-lg p-4 mb-4'
                      >
                        <div className='flex items-center mb-2'>
                          {comment.profiles?.profile_image_url && (
                            <Image
                              src={comment.profiles.profile_image_url}
                              alt={comment.profiles.username}
                              width={32}
                              height={32}
                              className='rounded-full mr-2'
                            />
                          )}
                          <div>
                            <p className='font-medium text-white'>
                              {comment.profiles?.username}
                            </p>
                            <p className='text-xs text-zinc-400'>
                              {format(new Date(comment.created_at), 'PPp')}
                            </p>
                          </div>
                        </div>
                        <p className='text-zinc-300'>{comment.content}</p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
