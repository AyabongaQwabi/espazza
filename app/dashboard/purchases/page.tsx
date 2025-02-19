'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Ticket, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { SongPreview } from '@/components/SongPreview';

export default function TicketsPage() {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: releases, error } = await supabase
      .from('purchases')
      .select(
        `
        *,
        release: releases (
          title,
          description,
          cover_image_url,
          tracks,
          profiles (
          username,
          artist_name
          )
        )
        
      `
      )
      .eq('user_id', user.id)
      .eq('purchase_type', 'release')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching releases:', error);
      toast({
        title: 'Error',
        description: 'Failed to load releases',
        variant: 'destructive',
      });
    } else {
      setReleases(releases || []);
    }
    setLoading(false);
  }

  if (loading) {
    return <div className='p-8'>Loading releases...</div>;
  }

  console.log(releases);

  return (
    <div className='p-8'>
      <h1 className='text-2xl font-bold mb-8'>My Purchased Tracks</h1>

      {releases.length === 0 ? (
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <Ticket className='h-12 w-12 text-zinc-400 mb-4' />
            <p className='text-zinc-400 text-lg mb-4'>No releases yet</p>
            <Button asChild>
              <a href='/tracks'>Browse Tracks</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-6 grid grid-cols-2 gap-4'>
          {releases.map((r) => (
            <Card key={r.release.id}>
              <CardHeader>
                <CardTitle className='flex items-center justify-between'>
                  <span>{r.release.profiles.artist_name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center gap-4 mb-4'>
                  {/* <div className='w-24 h-24 relative'>
                    <img
                      src={r.release.cover_image_url || '/placeholder.svg'}
                      alt={r.release.title}
                      className='w-full h-full object-cover rounded'
                    />
                  </div> */}
                  {/* <div>
                    <div className='flex items-center text-sm text-zinc-400 mb-2'>
                      <Calendar className='w-4 h-4 mr-2' />
                      {format(new Date(release.events.date), 'PPP')}
                    </div>
                    <p className='text-sm text-zinc-400'>
                      Organized by:{' '}
                      {release.events.profiles.artist_name ||
                        release.events.profiles.username}
                    </p>
                    <p className='text-sm text-zinc-400'>
                      Quantity: {release.quantity}
                    </p>
                    <p className='text-sm text-zinc-400'>
                      Total: R{release.total_price}
                    </p>
                  </div> */}
                </div>
                {r.release.tracks.map((track) => (
                  <div
                    key={track.id}
                    className='flex-col gap-2 space-y-3 items-center gap-4'
                  >
                    <SongPreview
                      url={track.url}
                      coverArt={r.release.cover_image_url}
                      title={track.title}
                      artist={r.release.profiles.artist_name}
                    />
                    <br />
                    <a href={track.url} download={`${track.title}.mp3`}>
                      <Button>Download</Button>
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
