'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { useMusicPlayer } from '@/hooks/use-music-player';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Play,
  Pause,
  Music,
  User,
  Calendar,
  ListMusic,
  MoreHorizontal,
  Heart,
  HeartOff,
  Edit,
  Trash2,
  Globe,
  Lock,
  ChevronLeft,
  Clock,
  Sparkles,
  Share2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function PlaylistDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const {
    state,
    playPlaylist,
    playTrack,
    savePlaylist,
    unsavePlaylist,
    deletePlaylist,
    isPlaylistSaved,
    refreshPlaylists,
  } = useMusicPlayer();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [playlist, setPlaylist] = useState<any>(null);

  useEffect(() => {
    checkUser();
    loadPlaylist();
  }, [params.id]);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUser(user);
  }

  async function loadPlaylist() {
    setLoading(true);

    // Find the playlist in the state
    const foundPlaylist = state.playlists.find((p) => p.id === params.id);

    if (foundPlaylist) {
      setPlaylist(foundPlaylist);
      setLoading(false);
      return;
    }

    // If not found in state, fetch it from Supabase
    try {
      const { data: playlistData, error: playlistError } = await supabase
        .from('playlists')
        .select(
          `
          id,
          name,
          description,
          cover_image_url,
          created_at,
          updated_at,
          user_id,
          is_public
        `
        )
        .eq('id', params.id)
        .single();

      if (playlistError) throw playlistError;

      const { data: tracks, error: tracksError } = await supabase
        .from('playlist_tracks')
        .select(
          `
          id,
          track_id,
          track_title,
          artist_name,
          artist_id,
          cover_image_url,
          url,
          added_at,
          position
        `
        )
        .eq('playlist_id', params.id)
        .order('position');

      if (tracksError) throw tracksError;

      const playlistWithTracks = {
        ...playlistData,
        tracks: tracks.map((track) => ({
          id: track.track_id,
          title: track.track_title,
          artist: track.artist_name || '',
          artistId: track.artist_id,
          cover_image_url: track.cover_image_url || '',
          url: track.url,
        })),
      };

      setPlaylist(playlistWithTracks);
    } catch (error) {
      console.error('Error loading playlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to load playlist. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const handlePlayPlaylist = () => {
    if (playlist) {
      playPlaylist(playlist);
    }
  };

  const handlePlayTrack = (track) => {
    playTrack(track);
  };

  const handleSavePlaylist = async () => {
    if (playlist) {
      await savePlaylist(playlist.id);
      await refreshPlaylists();
    }
  };

  const handleUnsavePlaylist = async () => {
    if (playlist) {
      await unsavePlaylist(playlist.id);
      await refreshPlaylists();
    }
  };

  const handleDeletePlaylist = async () => {
    if (
      playlist &&
      window.confirm(
        'Are you sure you want to delete this playlist? This action cannot be undone.'
      )
    ) {
      await deletePlaylist(playlist.id);
      router.push('/playlists');
    }
  };

  const isUserPlaylist = () => {
    return currentUser && playlist && playlist.user_id === currentUser.id;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-900 text-white pb-20'>
        <div className='container mx-auto px-4 py-8'>
          <div className='flex items-center mb-8'>
            <Button
              variant='ghost'
              className='text-white hover:bg-white/10'
              onClick={() => router.push('/playlists')}
            >
              <ChevronLeft className='mr-2 h-4 w-4' /> Back to Playlists
            </Button>
          </div>

          <div className='flex flex-col md:flex-row gap-8'>
            <Skeleton className='h-64 w-64 bg-gray-800 flex-shrink-0' />

            <div className='flex-grow'>
              <Skeleton className='h-8 w-40 bg-gray-800 mb-2' />
              <Skeleton className='h-6 w-60 bg-gray-800 mb-4' />
              <Skeleton className='h-4 w-full max-w-md bg-gray-800 mb-2' />
              <Skeleton className='h-4 w-full max-w-sm bg-gray-800 mb-6' />
              <div className='flex gap-2'>
                <Skeleton className='h-10 w-24 bg-gray-800' />
                <Skeleton className='h-10 w-24 bg-gray-800' />
              </div>
            </div>
          </div>

          <div className='mt-12'>
            <Skeleton className='h-6 w-32 bg-gray-800 mb-4' />
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className='flex items-center py-3 border-b border-gray-800'
              >
                <Skeleton className='h-4 w-4 bg-gray-800 mr-4' />
                <Skeleton className='h-10 w-10 bg-gray-800 mr-4' />
                <div className='flex-grow'>
                  <Skeleton className='h-4 w-40 bg-gray-800 mb-2' />
                  <Skeleton className='h-3 w-24 bg-gray-800' />
                </div>
                <Skeleton className='h-4 w-16 bg-gray-800' />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className='flex flex-col items-center justify-center h-screen bg-gray-900 text-white'>
        <ListMusic className='h-16 w-16 mb-4 text-red-500' />
        <h2 className='text-2xl font-bold mb-2'>Playlist not found</h2>
        <p className='text-gray-400 mb-6'>
          The playlist you're looking for doesn't exist or has been removed
        </p>
        <Button
          onClick={() => router.push('/playlists')}
          className='bg-red-500 hover:bg-red-600 text-white'
        >
          <ChevronLeft className='mr-2 h-4 w-4' /> Back to Playlists
        </Button>
      </div>
    );
  }

  const isCurrentlyPlaying = state.currentPlaylist?.id === playlist.id;

  return (
    <div className='min-h-screen bg-gray-900 text-white pb-20'>
      {/* Header with blurred background */}
      <div className='relative'>
        <div className='absolute inset-0 overflow-hidden'>
          <div className='absolute inset-0 bg-gradient-to-b from-gray-900/70 to-gray-900'></div>
          {playlist.cover_image_url && (
            <Image
              src={playlist.cover_image_url || '/placeholder.svg'}
              alt={playlist.name}
              layout='fill'
              objectFit='cover'
              className='opacity-30 blur-xl'
            />
          )}
        </div>

        <div className='container mx-auto px-4 py-8 relative z-10'>
          <Button
            variant='ghost'
            className='mb-6 text-white hover:bg-white/10'
            onClick={() => router.push('/playlists')}
          >
            <ChevronLeft className='mr-2 h-4 w-4' /> Back to Playlists
          </Button>

          <div className='flex flex-col md:flex-row gap-8'>
            <div className='flex-shrink-0'>
              <div className='relative group w-64 h-64'>
                {playlist.cover_image_url ? (
                  <Image
                    src={playlist.cover_image_url || '/placeholder.svg'}
                    alt={playlist.name}
                    width={256}
                    height={256}
                    className='rounded-lg shadow-xl shadow-black/50 w-full h-full object-cover'
                  />
                ) : (
                  <div className='rounded-lg shadow-xl shadow-black/50 w-full h-full bg-gray-800 flex items-center justify-center'>
                    <ListMusic className='h-24 w-24 text-gray-600' />
                  </div>
                )}
                <Button
                  size='icon'
                  className='absolute inset-0 m-auto bg-red-500/80 hover:bg-red-500 rounded-full h-16 w-16 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg'
                  onClick={handlePlayPlaylist}
                >
                  {isCurrentlyPlaying && state.isPlaying ? (
                    <Pause className='h-8 w-8' />
                  ) : (
                    <Play className='h-8 w-8 ml-1' />
                  )}
                </Button>
              </div>
            </div>

            <div className='flex-grow'>
              <div className='flex items-center gap-2 mb-2'>
                <Badge className='bg-red-500 text-white px-3 py-1'>
                  PLAYLIST
                </Badge>
                <Badge
                  className={`${
                    playlist.is_public ? 'bg-green-600' : 'bg-gray-600'
                  } text-white px-3 py-1`}
                >
                  {playlist.is_public ? (
                    <>
                      <Globe className='h-3 w-3 mr-1' /> Public
                    </>
                  ) : (
                    <>
                      <Lock className='h-3 w-3 mr-1' /> Private
                    </>
                  )}
                </Badge>
              </div>

              <h1 className='text-4xl font-bold mb-2'>{playlist.name}</h1>

              {playlist.description && (
                <p className='text-gray-300 mb-4 max-w-2xl'>
                  {playlist.description}
                </p>
              )}

              <div className='flex items-center gap-2 mb-4 text-sm text-gray-400'>
                <span className='flex items-center'>
                  <User className='h-4 w-4 mr-1' />
                  Created by {isUserPlaylist() ? 'you' : 'user'}
                </span>
                <span className='text-gray-500'>•</span>
                <span className='flex items-center'>
                  <Calendar className='h-4 w-4 mr-1' />
                  {formatDate(playlist.created_at)}
                </span>
                <span className='text-gray-500'>•</span>
                <span className='flex items-center'>
                  <Music className='h-4 w-4 mr-1' />
                  {playlist.tracks.length}{' '}
                  {playlist.tracks.length === 1 ? 'track' : 'tracks'}
                </span>
              </div>

              <div className='flex flex-wrap gap-3 mt-6'>
                <Button
                  className='bg-red-500 hover:bg-red-600 text-white'
                  onClick={handlePlayPlaylist}
                >
                  {isCurrentlyPlaying && state.isPlaying ? (
                    <>
                      <Pause className='mr-2 h-4 w-4' /> Pause
                    </>
                  ) : (
                    <>
                      <Play className='mr-2 h-4 w-4' /> Play
                    </>
                  )}
                </Button>

                {currentUser && !isUserPlaylist() && (
                  <>
                    {isPlaylistSaved(playlist.id) ? (
                      <Button
                        variant='outline'
                        className='border-gray-700 text-white hover:bg-gray-800'
                        onClick={handleUnsavePlaylist}
                      >
                        <HeartOff className='mr-2 h-4 w-4' />
                        Remove from Library
                      </Button>
                    ) : (
                      <Button
                        variant='outline'
                        className='border-gray-700 text-white hover:bg-gray-800'
                        onClick={handleSavePlaylist}
                      >
                        <Heart className='mr-2 h-4 w-4' />
                        Save to Library
                      </Button>
                    )}
                  </>
                )}

                {isUserPlaylist() && (
                  <>
                    <Button
                      variant='outline'
                      className='border-gray-700 text-white hover:bg-gray-800'
                      onClick={() =>
                        router.push(`/playlist/${playlist.id}/edit`)
                      }
                    >
                      <Edit className='mr-2 h-4 w-4' />
                      Edit
                    </Button>
                    <Button
                      variant='outline'
                      className='border-gray-700 text-red-400 hover:bg-gray-800 hover:text-red-300'
                      onClick={handleDeletePlaylist}
                    >
                      <Trash2 className='mr-2 h-4 w-4' />
                      Delete
                    </Button>
                  </>
                )}

                <Button
                  variant='outline'
                  className='border-gray-700 text-white hover:bg-gray-800'
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast({
                      title: 'Link Copied',
                      description: 'Playlist link copied to clipboard',
                      variant: 'default',
                    });
                  }}
                >
                  <Share2 className='mr-2 h-4 w-4' />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tracks List */}
      <div className='container mx-auto px-4 py-8'>
        <h2 className='text-2xl font-bold mb-6'>Tracks</h2>

        {playlist.tracks.length === 0 ? (
          <div className='text-center py-12 bg-gray-800 rounded-lg'>
            <Music className='h-16 w-16 mx-auto mb-4 text-gray-600' />
            <h3 className='text-xl font-semibold mb-2'>
              No tracks in this playlist
            </h3>
            <p className='text-gray-400 mb-6'>This playlist is empty</p>
          </div>
        ) : (
          <div className='bg-gray-800 rounded-lg overflow-hidden'>
            <div className='grid grid-cols-12 p-3 text-sm font-medium text-gray-400 border-b border-gray-700'>
              <div className='col-span-1'>#</div>
              <div className='col-span-5'>TITLE</div>
              <div className='col-span-4'>ARTIST</div>
              <div className='col-span-1 text-right'>
                <Clock className='h-4 w-4 inline' />
              </div>
              <div className='col-span-1'></div>
            </div>

            <ScrollArea className='h-[calc(100vh-500px)] min-h-[300px]'>
              {playlist.tracks.map((track, index) => {
                const isTrackPlaying =
                  state.currentTrack?.id === track.id && state.isPlaying;

                return (
                  <div
                    key={`${track.id}-${index}`}
                    className={`grid grid-cols-12 p-3 items-center hover:bg-gray-700 group ${
                      state.currentTrack?.id === track.id
                        ? 'bg-gray-700'
                        : index % 2 === 0
                        ? 'bg-gray-800'
                        : 'bg-gray-850'
                    }`}
                  >
                    <div className='col-span-1 flex items-center'>
                      {state.currentTrack?.id === track.id ? (
                        <Sparkles className='h-4 w-4 text-red-500 animate-pulse' />
                      ) : (
                        <span className='text-gray-400 group-hover:hidden'>
                          {index + 1}
                        </span>
                      )}
                      <Button
                        size='icon'
                        variant='ghost'
                        className='hidden group-hover:flex h-6 w-6 text-white hover:bg-white/10 rounded-full'
                        onClick={() => handlePlayTrack(track)}
                      >
                        {isTrackPlaying ? (
                          <Pause className='h-3 w-3' />
                        ) : (
                          <Play className='h-3 w-3' />
                        )}
                      </Button>
                    </div>

                    <div className='col-span-5 flex items-center'>
                      <div className='relative h-10 w-10 mr-3 flex-shrink-0'>
                        <Image
                          src={track.cover_image_url || '/placeholder.svg'}
                          alt={track.title}
                          layout='fill'
                          objectFit='cover'
                          className='rounded'
                        />
                        {state.currentTrack?.id === track.id && (
                          <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded'>
                            {state.isPlaying ? (
                              <div className='flex space-x-1'>
                                <div className='w-1 h-3 bg-red-500 animate-pulse'></div>
                                <div className='w-1 h-3 bg-red-500 animate-pulse delay-75'></div>
                                <div className='w-1 h-3 bg-red-500 animate-pulse delay-150'></div>
                              </div>
                            ) : (
                              <Play size={16} className='text-white' />
                            )}
                          </div>
                        )}
                      </div>
                      <div className='min-w-0'>
                        <p className='font-medium truncate'>{track.title}</p>
                      </div>
                    </div>

                    <div className='col-span-4'>
                      {track.artistId ? (
                        <Link
                          href={`/artists/${track.artistId}`}
                          className='text-gray-400 hover:text-white truncate block'
                        >
                          {track.artist}
                        </Link>
                      ) : (
                        <span className='text-gray-400 truncate'>
                          {track.artist}
                        </span>
                      )}
                    </div>

                    <div className='col-span-1 text-right text-gray-400 text-sm'>
                      {track.duration ? formatDuration(track.duration) : '-:--'}
                    </div>

                    <div className='col-span-1 flex justify-end'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size='icon'
                            variant='ghost'
                            className='h-8 w-8 text-gray-400'
                          >
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className='bg-gray-800 border-gray-700 text-white'>
                          <DropdownMenuItem
                            className='cursor-pointer hover:bg-gray-700'
                            onClick={() => handlePlayTrack(track)}
                          >
                            {isTrackPlaying ? (
                              <>
                                <Pause className='mr-2 h-4 w-4' />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className='mr-2 h-4 w-4' />
                                Play
                              </>
                            )}
                          </DropdownMenuItem>

                          {isUserPlaylist() && (
                            <>
                              <DropdownMenuSeparator className='bg-gray-700' />
                              <DropdownMenuItem
                                className='cursor-pointer hover:bg-gray-700 text-red-400'
                                onClick={async () => {
                                  if (
                                    window.confirm(
                                      'Remove this track from the playlist?'
                                    )
                                  ) {
                                    try {
                                      const { error } = await supabase
                                        .from('playlist_tracks')
                                        .delete()
                                        .eq('playlist_id', playlist.id)
                                        .eq('track_id', track.id);

                                      if (error) throw error;

                                      // Refresh the playlist
                                      await refreshPlaylists();
                                      await loadPlaylist();

                                      toast({
                                        title: 'Track Removed',
                                        description:
                                          'Track removed from playlist',
                                        variant: 'default',
                                      });
                                    } catch (error) {
                                      console.error(
                                        'Error removing track:',
                                        error
                                      );
                                      toast({
                                        title: 'Error',
                                        description:
                                          'Failed to remove track. Please try again.',
                                        variant: 'destructive',
                                      });
                                    }
                                  }
                                }}
                              >
                                <Trash2 className='mr-2 h-4 w-4' />
                                Remove from Playlist
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
