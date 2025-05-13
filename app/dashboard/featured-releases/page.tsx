'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Search,
  Plus,
  Trash2,
  Star,
  Check,
  Loader2,
  Filter,
  Music,
  Calendar,
  Play,
  Pause,
} from 'lucide-react';
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

export default function FeaturedReleasesDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [featuredReleases, setFeaturedReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<any>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [genreFilter, setGenreFilter] = useState<string>('');
  const [genres, setGenres] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('featured');
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [releaseToRemove, setReleaseToRemove] = useState<any>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  const supabase = createClientComponentClient();

  useEffect(() => {
    checkAuth();
    loadFeaturedReleases();
    extractGenres();
    setAudioRef(new Audio());

    return () => {
      if (audioRef) {
        audioRef.pause();
        audioRef.src = '';
      }
    };
  }, []);

  async function checkAuth() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);

    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to manage featured releases',
        variant: 'destructive',
      });
    }
  }

  async function loadFeaturedReleases() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('featured_releases')
        .select(
          `
          *,
          release:release_id(
            id,
            title,
            cover_image_url,
            release_date,
            genre_id,
            tracks,
            record_owner(
              id,
              username,
              artist_name
            ),
            genre:genres(
              id,
              name
            )
          ),
          featured_by_user:featured_by(
            username,
            artist_name
          )
        `
        )
        .order('featured_at', { ascending: false });

      if (error) throw error;

      setFeaturedReleases(data || []);
    } catch (error) {
      console.error('Error loading featured releases:', error);
      toast({
        title: 'Error',
        description: 'Failed to load featured releases',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function searchReleases() {
    if (!searchQuery.trim()) return;

    try {
      setSearchLoading(true);
      const searchTerm = `%${searchQuery}%`;

      const { data, error } = await supabase
        .from('releases')
        .select(
          `
          id, 
          title, 
          cover_image_url, 
          release_date,
          tracks,
          genre:genres(id, name),
          record_owner:profiles(id, username, artist_name)
        `
        )
        .or(`title.ilike.${searchTerm}`)
        .limit(20);

      if (error) throw error;

      // Filter out releases that are already featured
      const featuredIds = featuredReleases.map((item) => item.release_id);
      const filteredResults =
        data?.filter((release) => !featuredIds.includes(release.id)) || [];

      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching releases:', error);
      toast({
        title: 'Error',
        description: 'Failed to search releases',
        variant: 'destructive',
      });
    } finally {
      setSearchLoading(false);
    }
  }

  function extractGenres() {
    // Extract unique genres from releases
    supabase
      .from('genres')
      .select('name')
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching genres:', error);
          return;
        }

        const uniqueGenres = Array.from(
          new Set(data?.map((genre) => genre.name).filter(Boolean))
        );

        setGenres(uniqueGenres as string[]);
      });
  }

  const handleSelectRelease = (release: any) => {
    setSelectedRelease(release);
    setConfirmDialogOpen(true);
  };

  const handleAddFeaturedRelease = async () => {
    if (!selectedRelease || !user) return;

    try {
      setSubmitting(true);

      const { error } = await supabase.from('featured_releases').insert({
        release_id: selectedRelease.id,
        featured_by: user.id,
        reason: reason,
        featured_at: new Date().toISOString(),
      });

      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation
          toast({
            title: 'Already Featured',
            description: 'This release is already in the featured list',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: 'Success',
          description: 'Release added to featured list',
        });

        // Reset states
        setConfirmDialogOpen(false);
        setSelectedRelease(null);
        setReason('');
        setSearchResults(
          searchResults.filter((release) => release.id !== selectedRelease.id)
        );

        // Reload featured releases
        loadFeaturedReleases();
      }
    } catch (error) {
      console.error('Error adding featured release:', error);
      toast({
        title: 'Error',
        description: 'Failed to add release to featured list',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveFeaturedRelease = async () => {
    if (!releaseToRemove) return;

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('featured_releases')
        .delete()
        .eq('id', releaseToRemove.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Release removed from featured list',
      });

      // Reset states
      setRemoveDialogOpen(false);
      setReleaseToRemove(null);

      // Reload featured releases
      loadFeaturedReleases();
    } catch (error) {
      console.error('Error removing featured release:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove release from featured list',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlayPreview = (track: any) => {
    if (!audioRef) return;

    if (currentlyPlaying === track.url) {
      audioRef.pause();
      setCurrentlyPlaying(null);
    } else {
      if (currentlyPlaying) {
        audioRef.pause();
      }

      audioRef.src = track.url;
      audioRef.play();
      setCurrentlyPlaying(track.url);
    }
  };

  const filteredFeaturedReleases = genreFilter
    ? featuredReleases.filter(
        (item) => item.release?.genre?.name === genreFilter
      )
    : featuredReleases;

  const filteredSearchResults = genreFilter
    ? searchResults.filter((release) => release.genre?.name === genreFilter)
    : searchResults;

  return (
    <div className='p-8'>
      {/* Header Section */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-white mb-2'>
          Featured Releases
        </h1>
        <p className='text-zinc-400'>Manage featured releases for eSpazza</p>
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue='featured'
        onValueChange={setActiveTab}
        className='mb-6'
      >
        <TabsList className='mb-4'>
          <TabsTrigger value='featured'>Featured Releases</TabsTrigger>
          <TabsTrigger value='search'>Search & Add</TabsTrigger>
        </TabsList>

        {/* Featured Releases Tab */}
        <TabsContent value='featured'>
          <Card className='bg-zinc-900 border-zinc-800'>
            <CardHeader className='flex flex-row items-center justify-between'>
              <div>
                <CardTitle className='text-white'>Featured Releases</CardTitle>
                <CardDescription>
                  Releases currently featured on the platform
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
                  Add Release
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
              ) : filteredFeaturedReleases.length === 0 ? (
                <div className='text-center py-8'>
                  <Star className='h-12 w-12 mx-auto mb-4 text-zinc-600' />
                  <p className='text-zinc-400 mb-4'>No featured releases yet</p>
                  <Button onClick={() => setActiveTab('search')}>
                    Add Your First Featured Release
                  </Button>
                </div>
              ) : (
                <ScrollArea className='h-[600px]'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='w-[80px]'>Cover</TableHead>
                        <TableHead className='max-w-[150px]'>Title</TableHead>
                        <TableHead className='hidden md:table-cell'>
                          Artist
                        </TableHead>
                        <TableHead className='hidden md:table-cell'>
                          Genre
                        </TableHead>
                        <TableHead>Featured By</TableHead>
                        <TableHead>Featured On</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFeaturedReleases.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className='h-10 w-10 rounded-md overflow-hidden bg-zinc-800 relative'>
                              {item.release?.cover_image_url ? (
                                <Image
                                  src={
                                    item.release.cover_image_url ||
                                    '/placeholder.svg' ||
                                    '/placeholder.svg'
                                  }
                                  alt={item.release.title}
                                  fill
                                  className='object-cover'
                                />
                              ) : (
                                <div className='flex items-center justify-center h-full w-full text-zinc-500'>
                                  <Music className='h-5 w-5' />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className='font-medium'>
                            {item.release?.title}
                          </TableCell>
                          <TableCell className='hidden md:table-cell'>
                            {item.release?.record_owner?.artist_name ||
                              item.release?.record_owner?.username}
                          </TableCell>
                          <TableCell className='hidden md:table-cell'>
                            {item.release?.genre?.name ? (
                              <Badge
                                variant='outline'
                                className='bg-zinc-800 text-zinc-300'
                              >
                                {item.release.genre.name}
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
                                href={`/r/${
                                  item.release?.short_unique_id ||
                                  item.release?.id
                                }`}
                                passHref
                              >
                                <Button variant='outline' size='sm'>
                                  View Release
                                </Button>
                              </Link>
                              <Button
                                variant='destructive'
                                size='sm'
                                onClick={() => {
                                  setReleaseToRemove(item);
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
              <CardTitle className='text-white'>Search Releases</CardTitle>
              <CardDescription>
                Find releases to feature on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex items-center space-x-2 mb-6'>
                <div className='relative flex-grow'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400' />
                  <Input
                    type='text'
                    placeholder='Search by release title...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchReleases()}
                    className='pl-10 bg-zinc-800 border-zinc-700'
                  />
                </div>
                <Button
                  onClick={searchReleases}
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
                  <p className='text-zinc-400 mb-2'>No releases found</p>
                  <p className='text-zinc-500 text-sm'>
                    Try a different search term or filter
                  </p>
                </div>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {filteredSearchResults.map((release) => (
                    <Card
                      key={release.id}
                      className='bg-zinc-800 border-zinc-700 hover:border-zinc-600 transition-colors'
                    >
                      <CardContent className='p-4'>
                        <div className='flex items-start space-x-4'>
                          <div className='h-16 w-16 rounded-md overflow-hidden bg-zinc-700 relative flex-shrink-0'>
                            {release.cover_image_url ? (
                              <Image
                                src={
                                  release.cover_image_url || '/placeholder.svg'
                                }
                                alt={release.title}
                                fill
                                className='object-cover'
                              />
                            ) : (
                              <div className='flex items-center justify-center h-full w-full text-zinc-500'>
                                <Music className='h-8 w-8' />
                              </div>
                            )}
                          </div>
                          <div className='flex-1 min-w-0'>
                            <h3 className='text-lg font-semibold text-white truncate'>
                              {release.title}
                            </h3>
                            <p className='text-sm text-zinc-400 mb-2'>
                              By{' '}
                              {release.record_owner?.artist_name ||
                                release.record_owner?.username}
                            </p>
                            <div className='flex items-center space-x-2 mb-2'>
                              {release.genre?.name && (
                                <Badge
                                  variant='outline'
                                  className='bg-zinc-700 text-zinc-300'
                                >
                                  {release.genre.name}
                                </Badge>
                              )}
                              <span className='text-xs text-zinc-500 flex items-center'>
                                <Calendar className='h-3 w-3 mr-1' />
                                {new Date(
                                  release.release_date
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <p className='text-xs text-zinc-400'>
                              {release.tracks?.length || 0} tracks
                            </p>
                          </div>
                        </div>
                        <div className='flex justify-between mt-4 pt-3 border-t border-zinc-700'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => {
                              if (release.tracks && release.tracks.length > 0) {
                                const firstTrack =
                                  typeof release.tracks === 'string'
                                    ? JSON.parse(release.tracks)[0]
                                    : release.tracks[0];
                                handlePlayPreview(firstTrack);
                              }
                            }}
                          >
                            {currentlyPlaying ===
                            (release.tracks && release.tracks.length > 0
                              ? typeof release.tracks === 'string'
                                ? JSON.parse(release.tracks)[0].url
                                : release.tracks[0].url
                              : null) ? (
                              <>
                                <Pause className='h-4 w-4 mr-2' /> Pause
                              </>
                            ) : (
                              <>
                                <Play className='h-4 w-4 mr-2' /> Preview
                              </>
                            )}
                          </Button>
                          <Button
                            size='sm'
                            onClick={() => handleSelectRelease(release)}
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
            <DialogTitle>Feature Release</DialogTitle>
            <DialogDescription>
              Are you sure you want to feature this release on the platform?
            </DialogDescription>
          </DialogHeader>

          {selectedRelease && (
            <div className='flex items-center space-x-4 my-4'>
              <div className='h-16 w-16 rounded-md overflow-hidden bg-zinc-800 relative'>
                {selectedRelease.cover_image_url ? (
                  <Image
                    src={selectedRelease.cover_image_url || '/placeholder.svg'}
                    alt={selectedRelease.title}
                    fill
                    className='object-cover'
                  />
                ) : (
                  <div className='flex items-center justify-center h-full w-full text-zinc-500'>
                    <Music className='h-8 w-8' />
                  </div>
                )}
              </div>
              <div>
                <h3 className='text-lg font-semibold text-white'>
                  {selectedRelease.title}
                </h3>
                <p className='text-sm text-zinc-400'>
                  By{' '}
                  {selectedRelease.record_owner?.artist_name ||
                    selectedRelease.record_owner?.username}
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
                placeholder='Why should this release be featured?'
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
            <Button onClick={handleAddFeaturedRelease} disabled={submitting}>
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
            <DialogTitle>Remove Featured Release</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this release from the featured
              list?
            </DialogDescription>
          </DialogHeader>

          {releaseToRemove && (
            <div className='flex items-center space-x-4 my-4'>
              <div className='h-16 w-16 rounded-md overflow-hidden bg-zinc-800 relative'>
                {releaseToRemove.release?.cover_image_url ? (
                  <Image
                    src={
                      releaseToRemove.release.cover_image_url ||
                      '/placeholder.svg' ||
                      '/placeholder.svg'
                    }
                    alt={releaseToRemove.release.title}
                    fill
                    className='object-cover'
                  />
                ) : (
                  <div className='flex items-center justify-center h-full w-full text-zinc-500'>
                    <Music className='h-8 w-8' />
                  </div>
                )}
              </div>
              <div>
                <h3 className='text-lg font-semibold text-white'>
                  {releaseToRemove.release?.title}
                </h3>
                <p className='text-sm text-zinc-400'>
                  By{' '}
                  {releaseToRemove.release?.record_owner?.artist_name ||
                    releaseToRemove.release?.record_owner?.username}
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
              onClick={handleRemoveFeaturedRelease}
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
