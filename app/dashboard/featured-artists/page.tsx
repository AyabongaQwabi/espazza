'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Search,
  User,
  Plus,
  Trash2,
  Star,
  Check,
  Loader2,
  Filter,
  Music,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function FeaturedArtistsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [featuredArtists, setFeaturedArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [genreFilter, setGenreFilter] = useState<string>('');
  const [genres, setGenres] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('featured');
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [artistToRemove, setArtistToRemove] = useState<any>(null);

  const supabase = createClientComponentClient();

  useEffect(() => {
    checkAuth();
    loadFeaturedArtists();
    extractGenres();
  }, []);

  async function checkAuth() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);

    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to manage featured artists',
        variant: 'destructive',
      });
    }
  }

  async function loadFeaturedArtists() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('featured_artists')
        .select(
          `
          *,
          artist:artist_id(
            id,
            username,
            artist_name,
            profile_image_url,
            genre,
            artist_bio
          ),
          featured_by_user:featured_by(
            username,
            artist_name
          )
        `
        )
        .order('featured_at', { ascending: false });

      if (error) throw error;

      setFeaturedArtists(data || []);
    } catch (error) {
      console.error('Error loading featured artists:', error);
      toast({
        title: 'Error',
        description: 'Failed to load featured artists',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function searchArtists() {
    if (!searchQuery.trim()) return;

    try {
      setSearchLoading(true);
      const searchTerm = `%${searchQuery}%`;

      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, username, artist_name, profile_image_url, genre, artist_bio'
        )
        .or(`username.ilike.${searchTerm},artist_name.ilike.${searchTerm}`)
        .eq('user_type', 'artist')
        .limit(20);

      if (error) throw error;

      // Filter out artists that are already featured
      const featuredIds = featuredArtists.map((item) => item.artist_id);
      const filteredResults =
        data?.filter((artist) => !featuredIds.includes(artist.id)) || [];

      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching artists:', error);
      toast({
        title: 'Error',
        description: 'Failed to search artists',
        variant: 'destructive',
      });
    } finally {
      setSearchLoading(false);
    }
  }

  function extractGenres() {
    // Extract unique genres from profiles
    supabase
      .from('profiles')
      .select('genre')
      .not('genre', 'is', null)
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching genres:', error);
          return;
        }

        const uniqueGenres = Array.from(
          new Set(data?.map((profile) => profile.genre).filter(Boolean))
        );

        setGenres(uniqueGenres as string[]);
      });
  }

  const handleSelectArtist = (artist: any) => {
    setSelectedArtist(artist);
    setConfirmDialogOpen(true);
  };

  const handleAddFeaturedArtist = async () => {
    if (!selectedArtist || !user) return;

    try {
      setSubmitting(true);

      const { error } = await supabase.from('featured_artists').insert({
        artist_id: selectedArtist.id,
        featured_by: user.id,
        reason: reason,
        featured_at: new Date().toISOString(),
      });

      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation
          toast({
            title: 'Already Featured',
            description: 'This artist is already in the featured list',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: 'Success',
          description: 'Artist added to featured list',
        });

        // Reset states
        setConfirmDialogOpen(false);
        setSelectedArtist(null);
        setReason('');
        setSearchResults(
          searchResults.filter((artist) => artist.id !== selectedArtist.id)
        );

        // Reload featured artists
        loadFeaturedArtists();
      }
    } catch (error) {
      console.error('Error adding featured artist:', error);
      toast({
        title: 'Error',
        description: 'Failed to add artist to featured list',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveFeaturedArtist = async () => {
    if (!artistToRemove) return;

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('featured_artists')
        .delete()
        .eq('id', artistToRemove.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Artist removed from featured list',
      });

      // Reset states
      setRemoveDialogOpen(false);
      setArtistToRemove(null);

      // Reload featured artists
      loadFeaturedArtists();
    } catch (error) {
      console.error('Error removing featured artist:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove artist from featured list',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFeaturedArtists = genreFilter
    ? featuredArtists.filter((item) => item.artist?.genre === genreFilter)
    : featuredArtists;

  const filteredSearchResults = genreFilter
    ? searchResults.filter((artist) => artist.genre === genreFilter)
    : searchResults;

  return (
    <div className='p-8'>
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='mb-8'
      >
        <h1 className='text-3xl font-bold text-white mb-2'>Featured Artists</h1>
        <p className='text-zinc-400'>Manage featured artists for eSpazza</p>
      </motion.div>

      {/* Tabs */}
      <Tabs
        defaultValue='featured'
        onValueChange={setActiveTab}
        className='mb-6'
      >
        <TabsList className='mb-4'>
          <TabsTrigger value='featured'>Featured Artists</TabsTrigger>
          <TabsTrigger value='search'>Search & Add</TabsTrigger>
        </TabsList>

        {/* Featured Artists Tab */}
        <TabsContent value='featured'>
          <Card className='bg-zinc-900 border-zinc-800'>
            <CardHeader className='flex flex-row items-center justify-between'>
              <div>
                <CardTitle className='text-white'>Featured Artists</CardTitle>
                <CardDescription>
                  Artists currently featured on the platform
                </CardDescription>
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    setGenreFilter('');
                    setActiveTab('search');
                  }}
                >
                  <Plus className='h-4 w-4 mr-2' />
                  Add Artist
                </Button>
                {genres.length > 0 && (
                  <div className='relative'>
                    <Button variant='outline' size='sm'>
                      <Filter className='h-4 w-4 mr-2' />
                      {genreFilter || 'All Genres'}
                    </Button>
                    <div className='absolute right-0 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg z-10 hidden group-hover:block'>
                      <div className='py-1'>
                        <button
                          className='block w-full text-left px-4 py-2 text-sm text-white hover:bg-zinc-700'
                          onClick={() => setGenreFilter('')}
                        >
                          All Genres
                        </button>
                        {genres.map((genre) => (
                          <button
                            key={genre}
                            className='block w-full text-left px-4 py-2 text-sm text-white hover:bg-zinc-700'
                            onClick={() => setGenreFilter(genre)}
                          >
                            {genre}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className='flex justify-center items-center py-8'>
                  <Loader2 className='h-8 w-8 animate-spin text-zinc-400' />
                </div>
              ) : filteredFeaturedArtists.length === 0 ? (
                <div className='text-center py-8'>
                  <Star className='h-12 w-12 mx-auto mb-4 text-zinc-600' />
                  <p className='text-zinc-400 mb-4'>No featured artists yet</p>
                  <Button onClick={() => setActiveTab('search')}>
                    Add Your First Featured Artist
                  </Button>
                </div>
              ) : (
                <ScrollArea className='h-[600px]'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Artist</TableHead>
                        <TableHead>Genre</TableHead>
                        <TableHead>Featured By</TableHead>
                        <TableHead>Featured On</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFeaturedArtists.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className='flex items-center space-x-3'>
                              <div className='h-10 w-10 rounded-full overflow-hidden bg-zinc-800 relative'>
                                {item.artist?.profile_image_url ? (
                                  <Image
                                    src={
                                      item.artist.profile_image_url ||
                                      '/placeholder.svg'
                                    }
                                    alt={
                                      item.artist.artist_name ||
                                      item.artist.username
                                    }
                                    fill
                                    className='object-cover'
                                  />
                                ) : (
                                  <div className='flex items-center justify-center h-full w-full text-zinc-500'>
                                    <User className='h-5 w-5' />
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className='font-medium text-white'>
                                  {item.artist?.artist_name ||
                                    item.artist?.username}
                                </div>
                                <div className='text-sm text-zinc-400'>
                                  @{item.artist?.username}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.artist?.genre ? (
                              <Badge
                                variant='outline'
                                className='bg-zinc-800 text-zinc-300'
                              >
                                {item.artist.genre}
                              </Badge>
                            ) : (
                              <span className='text-zinc-500'>
                                Not specified
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className='text-zinc-400'>
                              {item.featured_by_user?.artist_name ||
                                item.featured_by_user?.username ||
                                'Admin'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className='text-zinc-400'>
                              {new Date(item.featured_at).toLocaleDateString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className='max-w-xs truncate text-zinc-400'>
                              {item.reason || 'No reason provided'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex space-x-2'>
                              <Link
                                href={`/artists/${item.artist?.username}`}
                                passHref
                              >
                                <Button variant='outline' size='sm'>
                                  View Profile
                                </Button>
                              </Link>
                              <Button
                                variant='destructive'
                                size='sm'
                                onClick={() => {
                                  setArtistToRemove(item);
                                  setRemoveDialogOpen(true);
                                }}
                              >
                                <Trash2 className='h-4 w-4' />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value='search'>
          <Card className='bg-zinc-900 border-zinc-800'>
            <CardHeader>
              <CardTitle className='text-white'>Search Artists</CardTitle>
              <CardDescription>
                Find artists to feature on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex items-center space-x-2 mb-6'>
                <div className='relative flex-grow'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400' />
                  <Input
                    type='text'
                    placeholder='Search by artist name or username...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchArtists()}
                    className='pl-10 bg-zinc-800 border-zinc-700'
                  />
                </div>
                <Button
                  onClick={searchArtists}
                  disabled={searchLoading || !searchQuery.trim()}
                >
                  {searchLoading ? (
                    <Loader2 className='h-4 w-4 animate-spin mr-2' />
                  ) : (
                    <Search className='h-4 w-4 mr-2' />
                  )}
                  Search
                </Button>
                {genres.length > 0 && (
                  <div className='relative group'>
                    <Button variant='outline'>
                      <Filter className='h-4 w-4 mr-2' />
                      {genreFilter || 'All Genres'}
                    </Button>
                    <div className='absolute right-0 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg z-10 hidden group-hover:block'>
                      <div className='py-1'>
                        <button
                          className='block w-full text-left px-4 py-2 text-sm text-white hover:bg-zinc-700'
                          onClick={() => setGenreFilter('')}
                        >
                          All Genres
                        </button>
                        {genres.map((genre) => (
                          <button
                            key={genre}
                            className='block w-full text-left px-4 py-2 text-sm text-white hover:bg-zinc-700'
                            onClick={() => setGenreFilter(genre)}
                          >
                            {genre}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {searchLoading ? (
                <div className='flex justify-center items-center py-8'>
                  <Loader2 className='h-8 w-8 animate-spin text-zinc-400' />
                </div>
              ) : filteredSearchResults.length === 0 ? (
                <div className='text-center py-8 bg-zinc-800 rounded-lg'>
                  <Music className='h-12 w-12 mx-auto mb-4 text-zinc-600' />
                  <p className='text-zinc-400 mb-2'>No artists found</p>
                  <p className='text-zinc-500 text-sm'>
                    Try a different search term or filter
                  </p>
                </div>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {filteredSearchResults.map((artist) => (
                    <Card
                      key={artist.id}
                      className='bg-zinc-800 border-zinc-700 hover:border-zinc-600 transition-colors'
                    >
                      <CardContent className='p-4'>
                        <div className='flex items-start space-x-4'>
                          <div className='h-16 w-16 rounded-full overflow-hidden bg-zinc-700 relative flex-shrink-0'>
                            {artist.profile_image_url ? (
                              <Image
                                src={
                                  artist.profile_image_url || '/placeholder.svg'
                                }
                                alt={artist.artist_name || artist.username}
                                fill
                                className='object-cover'
                              />
                            ) : (
                              <div className='flex items-center justify-center h-full w-full text-zinc-500'>
                                <User className='h-8 w-8' />
                              </div>
                            )}
                          </div>
                          <div className='flex-1 min-w-0'>
                            <h3 className='text-lg font-semibold text-white truncate'>
                              {artist.artist_name || artist.username}
                            </h3>
                            <p className='text-sm text-zinc-400 mb-2'>
                              @{artist.username}
                            </p>
                            {artist.genre && (
                              <Badge
                                variant='outline'
                                className='bg-zinc-700 text-zinc-300 mb-2'
                              >
                                {artist.genre}
                              </Badge>
                            )}
                            {artist.artist_bio && (
                              <p className='text-sm text-zinc-400 line-clamp-2'>
                                {artist.artist_bio}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className='flex justify-between mt-4 pt-3 border-t border-zinc-700'>
                          <Link href={`/artists/${artist.username}`} passHref>
                            <Button variant='outline' size='sm'>
                              View Profile
                            </Button>
                          </Link>
                          <Button
                            size='sm'
                            onClick={() => handleSelectArtist(artist)}
                          >
                            <Star className='h-4 w-4 mr-2' />
                            Feature
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className='bg-zinc-900 border-zinc-800'>
          <DialogHeader>
            <DialogTitle>Feature Artist</DialogTitle>
            <DialogDescription>
              Are you sure you want to feature this artist on the platform?
            </DialogDescription>
          </DialogHeader>

          {selectedArtist && (
            <div className='flex items-center space-x-4 my-4'>
              <div className='h-16 w-16 rounded-full overflow-hidden bg-zinc-800 relative'>
                {selectedArtist.profile_image_url ? (
                  <Image
                    src={selectedArtist.profile_image_url || '/placeholder.svg'}
                    alt={selectedArtist.artist_name || selectedArtist.username}
                    fill
                    className='object-cover'
                  />
                ) : (
                  <div className='flex items-center justify-center h-full w-full text-zinc-500'>
                    <User className='h-8 w-8' />
                  </div>
                )}
              </div>
              <div>
                <h3 className='text-lg font-semibold text-white'>
                  {selectedArtist.artist_name || selectedArtist.username}
                </h3>
                <p className='text-sm text-zinc-400'>
                  @{selectedArtist.username}
                </p>
              </div>
            </div>
          )}

          <div className='space-y-4 py-2'>
            <div className='space-y-2'>
              <label
                htmlFor='reason'
                className='text-sm font-medium text-zinc-400'
              >
                Reason for featuring (optional)
              </label>
              <Textarea
                id='reason'
                placeholder='Why should this artist be featured?'
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className='bg-zinc-800 border-zinc-700'
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddFeaturedArtist} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Processing...
                </>
              ) : (
                <>
                  <Check className='h-4 w-4 mr-2' />
                  Confirm
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent className='bg-zinc-900 border-zinc-800'>
          <DialogHeader>
            <DialogTitle>Remove Featured Artist</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this artist from the featured
              list?
            </DialogDescription>
          </DialogHeader>

          {artistToRemove && (
            <div className='flex items-center space-x-4 my-4'>
              <div className='h-16 w-16 rounded-full overflow-hidden bg-zinc-800 relative'>
                {artistToRemove.artist?.profile_image_url ? (
                  <Image
                    src={
                      artistToRemove.artist.profile_image_url ||
                      '/placeholder.svg'
                    }
                    alt={
                      artistToRemove.artist.artist_name ||
                      artistToRemove.artist.username
                    }
                    fill
                    className='object-cover'
                  />
                ) : (
                  <div className='flex items-center justify-center h-full w-full text-zinc-500'>
                    <User className='h-8 w-8' />
                  </div>
                )}
              </div>
              <div>
                <h3 className='text-lg font-semibold text-white'>
                  {artistToRemove.artist?.artist_name ||
                    artistToRemove.artist?.username}
                </h3>
                <p className='text-sm text-zinc-400'>
                  @{artistToRemove.artist?.username}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setRemoveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleRemoveFeaturedArtist}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Processing...
                </>
              ) : (
                <>
                  <Trash2 className='h-4 w-4 mr-2' />
                  Remove
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
