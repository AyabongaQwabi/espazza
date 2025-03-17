'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, MapPin, Facebook, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

const MERCHANDISERS_PER_PAGE = 9;

export default function MerchandisersList({
  initialData = [],
}: {
  initialData?: any[];
}) {
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';
  const [merchandisers, setMerchandisers] = useState<any[]>(initialData);
  const [loading, setLoading] = useState(initialData.length === 0);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [user, setUser] = useState<any>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient();

  // Fetch merchandisers with pagination
  const fetchMerchandisers = useCallback(
    async (pageNumber: number) => {
      const start = (pageNumber - 1) * MERCHANDISERS_PER_PAGE;
      const end = start + MERCHANDISERS_PER_PAGE - 1;

      try {
        setLoading(true);

        let query = supabase
          .from('merchandisers')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(start, end);

        if (search) {
          query = query.ilike('name', `%${search}%`);
        }

        const { data: newMerchandisers, count, error } = await query;

        if (error) {
          console.error('Error fetching merchandisers:', error);
          toast({
            title: 'Error',
            description: 'Failed to load merchandisers',
            variant: 'destructive',
          });
          return false;
        }

        if (newMerchandisers && newMerchandisers.length > 0) {
          // For each merchandiser, get the images
          const merchandisersWithImages = await Promise.all(
            newMerchandisers.map(async (merchandiser) => {
              const { data: imageData } = await supabase.storage
                .from('merchandiser-images')
                .list(merchandiser.id.toString());

              const imageUrls =
                imageData?.map(
                  (img) =>
                    supabase.storage
                      .from('merchandiser-images')
                      .getPublicUrl(`${merchandiser.id}/${img.name}`).data
                      .publicUrl
                ) || [];

              return {
                ...merchandiser,
                images: imageUrls,
              };
            })
          );

          // If it's the first page, replace merchandisers, otherwise append
          setMerchandisers((prevMerchandisers) =>
            pageNumber === 1
              ? merchandisersWithImages
              : [...prevMerchandisers, ...merchandisersWithImages]
          );

          // Check if we've reached the end
          setHasMore(start + merchandisersWithImages.length < (count || 0));
          return true;
        } else {
          if (pageNumber === 1) {
            setMerchandisers([]);
          }
          setHasMore(false);
          return false;
        }
      } catch (error) {
        console.error('Error in fetchMerchandisers:', error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [supabase, search]
  );

  // Check authentication
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    }

    checkAuth();
  }, [supabase]);

  // Initial load
  useEffect(() => {
    // If we have initial data and no search, don't fetch again
    if (initialData.length > 0 && !search) {
      setMerchandisers(initialData);
      setLoading(false);
      return;
    }

    fetchMerchandisers(1);
  }, [fetchMerchandisers, initialData, search]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading) {
          setPage((prevPage) => {
            const nextPage = prevPage + 1;
            fetchMerchandisers(nextPage);
            return nextPage;
          });
        }
      },
      { threshold: 0.1 }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [hasMore, loading, fetchMerchandisers]);

  if (loading && merchandisers.length === 0) {
    return <MerchandisersLoading />;
  }

  if (merchandisers.length === 0) {
    return (
      <div className='text-center py-20'>
        <h3 className='text-2xl font-semibold text-white mb-4'>
          No merchandisers found
        </h3>
        <p className='text-zinc-400 mb-8'>
          {search
            ? `No results found for "${search}". Try a different search term.`
            : "We don't have any merchandisers listed yet. Check back soon!"}
        </p>
        {search && (
          <Button asChild variant='outline'>
            <Link href='/merch'>View all merchandisers</Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {merchandisers.map((merchandiser, index) => (
          <MerchandiserCard
            key={merchandiser.id}
            merchandiser={merchandiser}
            index={index}
          />
        ))}
      </div>

      {/* Loader element for infinite scroll */}
      <div
        ref={loaderRef}
        className='flex justify-center items-center py-8 mt-8'
      >
        {hasMore ? (
          <Loader2 className='h-8 w-8 text-red-500 animate-spin' />
        ) : merchandisers.length > 0 ? (
          <p className='text-zinc-400 bg-zinc-800/50 backdrop-blur-sm px-4 py-2 rounded-full'>
            You've seen all merchandisers ✨
          </p>
        ) : null}
      </div>
    </>
  );
}

function MerchandiserCard({
  merchandiser,
  index,
}: {
  merchandiser: any;
  index: number;
}) {
  const featuredImage =
    merchandiser.images && merchandiser.images.length > 0
      ? merchandiser.images[0]
      : '/placeholder.svg?height=400&width=600';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className='h-full flex flex-col overflow-hidden bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors'>
        <div className='aspect-[4/3] relative overflow-hidden'>
          <Image
            src={featuredImage || '/placeholder.svg'}
            alt={merchandiser.name}
            fill
            className='object-cover transition-transform duration-500 hover:scale-105'
            sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
          />
          {merchandiser.images && merchandiser.images.length > 1 && (
            <Badge className='absolute bottom-2 right-2 bg-black/70 hover:bg-black/70'>
              +{merchandiser.images.length - 1} photos
            </Badge>
          )}
        </div>
        <CardContent className='flex-1 p-6'>
          <h2 className='text-xl font-bold text-white mb-2'>
            {merchandiser.name}
          </h2>
          <p className='text-zinc-400 text-sm line-clamp-3 mb-4'>
            {merchandiser.description}
          </p>
          <div className='space-y-2 text-sm'>
            <div className='flex items-start'>
              <Mail className='h-4 w-4 text-zinc-500 mt-0.5 mr-2' />
              <a
                href={`mailto:${merchandiser.email}`}
                className='text-zinc-300 hover:text-white'
              >
                {merchandiser.email}
              </a>
            </div>
            <div className='flex items-start'>
              <Phone className='h-4 w-4 text-zinc-500 mt-0.5 mr-2' />
              <a
                href={`tel:${merchandiser.contact_number}`}
                className='text-zinc-300 hover:text-white'
              >
                {merchandiser.contact_number}
              </a>
            </div>
            {merchandiser.address && (
              <div className='flex items-start'>
                <MapPin className='h-4 w-4 text-zinc-500 mt-0.5 mr-2' />
                <span className='text-zinc-300'>{merchandiser.address}</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className='px-6 pb-6 pt-0'>
          <div className='w-full flex gap-3'>
            <Button asChild className='flex-1 bg-red-600 hover:bg-red-700'>
              <Link href={`/merch/${merchandiser.id}`}>View Details</Link>
            </Button>
            {merchandiser.facebook_page && (
              <Button variant='outline' size='icon' asChild>
                <a
                  href={merchandiser.facebook_page}
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label='Facebook Page'
                >
                  <Facebook className='h-4 w-4' />
                </a>
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

function MerchandisersLoading() {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className='bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden animate-pulse'
        >
          <div className='aspect-[4/3] bg-zinc-800' />
          <div className='p-6 space-y-3'>
            <div className='h-6 bg-zinc-800 rounded w-3/4' />
            <div className='h-4 bg-zinc-800 rounded w-1/2' />
            <div className='h-4 bg-zinc-800 rounded w-5/6' />
            <div className='h-4 bg-zinc-800 rounded w-4/6' />
            <div className='h-10 bg-zinc-800 rounded w-full mt-6' />
          </div>
        </div>
      ))}
    </div>
  );
}
