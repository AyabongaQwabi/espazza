'use client';

import type React from 'react';
import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useMusicPlayer } from '@/contexts/music-player-context';
import type { Track } from '@/types/music-player';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useRouter } from 'next/navigation';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  Shuffle,
  ListMusic,
  X,
  Heart,
  Plus,
  MoreHorizontal,
  Music,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function MusicPlayer() {
  const {
    state,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
    toggleMute,
    toggleRepeat,
    toggleShuffle,
    formatTime,
    createPlaylist,
    playPlaylist,
    addToPlaylist,
    audioRef,
  } = useMusicPlayer();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [addToPlaylistDialogOpen, setAddToPlaylistDialogOpen] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  const {
    currentTrack,
    isPlaying,
    volume,
    muted,
    currentTime,
    duration,
    repeatMode,
    shuffle,
    queue,
    playlists,
  } = state;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !duration) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;

    seekTo(newTime);
  };

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName);
      setNewPlaylistName('');
      setShowCreatePlaylist(false);
    }
  };

  const handleAddToPlaylist = (playlistId: string) => {
    if (selectedTrack) {
      addToPlaylist(playlistId, selectedTrack);
      setSelectedTrack(null);
      setAddToPlaylistDialogOpen(false);
    }
  };

  // If there's no current track, don't render the player
  if (!currentTrack) return null;

  return (
    <>
      {/* Minimized Player (always visible at bottom) */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50 transition-all duration-300',
          isExpanded ? 'h-[100vh] md:h-[85vh]' : 'h-16'
        )}
      >
        {/* Minimized Player Content */}
        <div
          className={cn(
            'flex items-center justify-between px-4 h-16',
            isExpanded && 'border-b border-gray-800'
          )}
        >
          <div className='flex items-center space-x-3 flex-1 min-w-0'>
            <div
              className='relative h-10 w-10 cursor-pointer'
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Image
                src={currentTrack.cover_image_url || '/placeholder.svg'}
                alt={currentTrack.title}
                layout='fill'
                objectFit='cover'
                className='rounded'
              />
            </div>
            <div className='min-w-0 flex-1'>
              <h4 className='text-sm font-medium text-white truncate'>
                {currentTrack.title}
              </h4>
              <p className='text-xs text-gray-400 truncate'>
                {currentTrack.artist}
              </p>
            </div>
          </div>

          <div className='flex items-center space-x-2'>
            <Button
              size='icon'
              variant='ghost'
              className='h-8 w-8 text-gray-400 hover:text-white'
              onClick={prevTrack}
            >
              <SkipBack size={18} />
            </Button>

            <Button
              size='icon'
              className='h-8 w-8 bg-red-500 hover:bg-red-600 text-white rounded-full'
              onClick={togglePlay}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </Button>

            <Button
              size='icon'
              variant='ghost'
              className='h-8 w-8 text-gray-400 hover:text-white'
              onClick={nextTrack}
            >
              <SkipForward size={18} />
            </Button>
          </div>

          <div className='flex-1 hidden md:flex items-center justify-end space-x-2'>
            <Button
              size='icon'
              variant='ghost'
              className='h-8 w-8 text-gray-400 hover:text-white'
              onClick={() => setShowQueue(true)}
            >
              <ListMusic size={18} />
            </Button>

            <Button
              size='icon'
              variant='ghost'
              className={cn(
                'h-8 w-8',
                isExpanded ? 'text-red-500' : 'text-gray-400 hover:text-white'
              )}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <X size={18} /> : <MoreHorizontal size={18} />}
            </Button>
          </div>
        </div>

        {/* Progress bar for minimized view */}
        {!isExpanded && (
          <div
            className='h-1 bg-gray-800 cursor-pointer'
            ref={progressBarRef}
            onClick={handleProgressClick}
          >
            <div
              className='h-full bg-red-500'
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        )}

        {/* Expanded Player Content */}
        {isExpanded && (
          <div className='h-[calc(100%-4rem)] p-4 flex flex-col md:flex-row'>
            {/* Album Art and Controls (Left Side) */}
            <div className='flex flex-col items-center justify-center md:w-1/2 p-4'>
              <div className='relative w-64 h-64 md:w-80 md:h-80 mb-8 shadow-2xl'>
                <Image
                  src={currentTrack.cover_image_url || '/placeholder.svg'}
                  alt={currentTrack.title}
                  layout='fill'
                  objectFit='cover'
                  className='rounded-lg'
                />
              </div>

              <div className='w-full max-w-md'>
                <div className='mb-6 text-center'>
                  <h3 className='text-xl font-bold text-white mb-1'>
                    {currentTrack.title}
                  </h3>
                  <Link
                    href={
                      currentTrack.artistId
                        ? `/artists/${currentTrack.artistId}`
                        : '#'
                    }
                    className='text-gray-400 hover:text-white text-sm'
                  >
                    {currentTrack.artist}
                  </Link>
                </div>

                {/* Progress Bar */}
                <div className='mb-4'>
                  <div className='h-2 mb-2 bg-gray-800/50 rounded-md overflow-hidden'></div>
                  <div
                    className='h-1 bg-gray-800 rounded-full cursor-pointer mb-2'
                    ref={progressBarRef}
                    onClick={handleProgressClick}
                  >
                    <div
                      className='h-full bg-red-500 rounded-full'
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>
                  <div className='flex justify-between text-xs text-gray-400'>
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Playback Controls */}
                <div className='flex items-center justify-center space-x-4 mb-6'>
                  <Button
                    size='icon'
                    variant='ghost'
                    className={cn(
                      'h-10 w-10 text-gray-400 hover:text-white',
                      shuffle && 'text-red-500'
                    )}
                    onClick={toggleShuffle}
                  >
                    <Shuffle size={20} />
                  </Button>

                  <Button
                    size='icon'
                    variant='ghost'
                    className='h-10 w-10 text-gray-400 hover:text-white'
                    onClick={prevTrack}
                  >
                    <SkipBack size={20} />
                  </Button>

                  <Button
                    size='icon'
                    className='h-14 w-14 bg-red-500 hover:bg-red-600 text-white rounded-full'
                    onClick={togglePlay}
                  >
                    {isPlaying ? (
                      <Pause size={24} />
                    ) : (
                      <Play size={24} className='ml-1' />
                    )}
                  </Button>

                  <Button
                    size='icon'
                    variant='ghost'
                    className='h-10 w-10 text-gray-400 hover:text-white'
                    onClick={nextTrack}
                  >
                    <SkipForward size={20} />
                  </Button>

                  <Button
                    size='icon'
                    variant='ghost'
                    className={cn(
                      'h-10 w-10 text-gray-400 hover:text-white',
                      repeatMode !== 'off' && 'text-red-500'
                    )}
                    onClick={toggleRepeat}
                  >
                    {repeatMode === 'one' ? (
                      <Repeat1 size={20} />
                    ) : (
                      <Repeat size={20} />
                    )}
                  </Button>
                </div>

                {/* Volume Control */}
                <div className='flex items-center space-x-2'>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='h-8 w-8 text-gray-400 hover:text-white'
                    onClick={toggleMute}
                  >
                    {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </Button>
                  <Slider
                    value={[muted ? 0 : volume * 100]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(value) => setVolume(value[0] / 100)}
                    className='w-32'
                  />
                </div>
              </div>
            </div>

            {/* Queue and Playlists (Right Side) */}
            <div className='md:w-1/2 mt-6 md:mt-0 md:pl-6 border-t md:border-t-0 md:border-l border-gray-800 pt-6 md:pt-0'>
              <Tabs defaultValue='queue'>
                <TabsList className='bg-gray-800 mb-4'>
                  <TabsTrigger
                    value='queue'
                    className='data-[state=active]:bg-red-500 data-[state=active]:text-white'
                  >
                    Queue
                  </TabsTrigger>
                  <TabsTrigger
                    value='playlists'
                    className='data-[state=active]:bg-red-500 data-[state=active]:text-white'
                  >
                    Playlists
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value='queue'
                  className='h-[calc(100vh-16rem)] md:h-[calc(85vh-12rem)]'
                >
                  <div className='flex justify-between items-center mb-4'>
                    <h3 className='text-lg font-semibold text-white'>
                      Now Playing
                    </h3>
                    <span className='text-sm text-gray-400'>
                      {queue.length} tracks
                    </span>
                  </div>

                  <ScrollArea className='h-full pr-4'>
                    {queue.length === 0 ? (
                      <div className='flex flex-col items-center justify-center h-40 text-gray-500'>
                        <Music size={40} className='mb-2 opacity-50' />
                        <p>Your queue is empty</p>
                      </div>
                    ) : (
                      <div className='space-y-2'>
                        {queue.map((track, index) => (
                          <div
                            key={`${track.id}-${index}`}
                            className={cn(
                              'flex items-center p-2 rounded-md',
                              currentTrack?.id === track.id
                                ? 'bg-gray-800'
                                : 'hover:bg-gray-800'
                            )}
                          >
                            <div className='flex items-center flex-1 min-w-0'>
                              <div className='relative h-10 w-10 mr-3 flex-shrink-0'>
                                <Image
                                  src={
                                    track.cover_image_url || '/placeholder.svg'
                                  }
                                  alt={track.title}
                                  layout='fill'
                                  objectFit='cover'
                                  className='rounded'
                                />
                                {currentTrack?.id === track.id && (
                                  <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded'>
                                    {isPlaying ? (
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
                                <p className='text-sm font-medium text-white truncate'>
                                  {track.title}
                                </p>
                                <p className='text-xs text-gray-400 truncate'>
                                  {track.artist}
                                </p>
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size='icon'
                                  variant='ghost'
                                  className='h-8 w-8 text-gray-400'
                                >
                                  <MoreHorizontal size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className='bg-gray-800 border-gray-700 text-white'>
                                <DropdownMenuItem
                                  className='cursor-pointer hover:bg-gray-700'
                                  onClick={() => {
                                    setSelectedTrack(track);
                                    setAddToPlaylistDialogOpen(true);
                                  }}
                                >
                                  <Plus size={16} className='mr-2' />
                                  Add to Playlist
                                </DropdownMenuItem>
                                <DropdownMenuItem className='cursor-pointer hover:bg-gray-700'>
                                  <Heart size={16} className='mr-2' />
                                  Add to Favorites
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent
                  value='playlists'
                  className='h-[calc(100vh-16rem)] md:h-[calc(85vh-12rem)]'
                >
                  <div className='flex justify-between items-center mb-4'>
                    <h3 className='text-lg font-semibold text-white'>
                      Your Playlists
                    </h3>
                    <div className='flex space-x-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        className='border-gray-700 text-white hover:bg-gray-800'
                        onClick={() => router.push('/playlists')}
                      >
                        <ListMusic size={16} className='mr-1' />
                        View All
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        className='border-gray-700 text-white hover:bg-gray-800'
                        onClick={() => setShowCreatePlaylist(true)}
                      >
                        <Plus size={16} className='mr-1' />
                        New Playlist
                      </Button>
                    </div>
                  </div>

                  <ScrollArea className='h-full pr-4'>
                    {playlists.length === 0 ? (
                      <div className='flex flex-col items-center justify-center h-40 text-gray-500'>
                        <ListMusic size={40} className='mb-2 opacity-50' />
                        <p>You don't have any playlists yet</p>
                        <div className='flex flex-col space-y-2 mt-2'>
                          <Button
                            variant='link'
                            className='text-red-500'
                            onClick={() => setShowCreatePlaylist(true)}
                          >
                            Create your first playlist
                          </Button>
                          <Button
                            variant='link'
                            className='text-gray-400 hover:text-white'
                            onClick={() => router.push('/playlists')}
                          >
                            Browse all playlists
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className='space-y-3'>
                        {playlists.map((playlist) => (
                          <div
                            key={playlist.id}
                            className='bg-gray-800 rounded-md overflow-hidden hover:bg-gray-750 transition-colors'
                          >
                            <div className='p-3'>
                              <div className='flex items-center justify-between mb-2'>
                                <h4 className='font-medium text-white'>
                                  {playlist.name}
                                </h4>
                                <span className='text-xs text-gray-400'>
                                  {playlist.tracks.length} tracks
                                </span>
                              </div>

                              <div className='flex justify-between items-center'>
                                <span className='text-xs text-gray-500'>
                                  Created{' '}
                                  {new Date(
                                    playlist.createdAt
                                  ).toLocaleDateString()}
                                </span>

                                <div className='flex space-x-1'>
                                  <Button
                                    size='sm'
                                    className='h-8 bg-red-500 hover:bg-red-600 text-white'
                                    onClick={() => playPlaylist(playlist)}
                                  >
                                    <Play size={14} className='mr-1' />
                                    Play
                                  </Button>

                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        size='icon'
                                        variant='ghost'
                                        className='h-8 w-8 text-gray-400'
                                      >
                                        <MoreHorizontal size={16} />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className='bg-gray-800 border-gray-700 text-white'>
                                      <DropdownMenuItem className='cursor-pointer hover:bg-gray-700'>
                                        Edit Playlist
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator className='bg-gray-700' />
                                      <DropdownMenuItem className='cursor-pointer hover:bg-gray-700 text-red-400'>
                                        Delete Playlist
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>

      {/* Queue Sheet (Mobile) */}
      <Sheet open={showQueue} onOpenChange={setShowQueue}>
        <SheetContent
          side='right'
          className='bg-gray-900 text-white border-gray-800 w-full sm:max-w-md'
        >
          <SheetHeader>
            <SheetTitle className='text-white'>Queue</SheetTitle>
          </SheetHeader>
          <div className='mt-6'>
            {queue.length === 0 ? (
              <div className='flex flex-col items-center justify-center h-40 text-gray-500'>
                <Music size={40} className='mb-2 opacity-50' />
                <p>Your queue is empty</p>
              </div>
            ) : (
              <div className='space-y-2'>
                {queue.map((track, index) => (
                  <div
                    key={`${track.id}-${index}`}
                    className={cn(
                      'flex items-center p-2 rounded-md',
                      currentTrack?.id === track.id
                        ? 'bg-gray-800'
                        : 'hover:bg-gray-800'
                    )}
                  >
                    <div className='flex items-center flex-1 min-w-0'>
                      <div className='relative h-10 w-10 mr-3 flex-shrink-0'>
                        <Image
                          src={track.cover_image_url || '/placeholder.svg'}
                          alt={track.title}
                          layout='fill'
                          objectFit='cover'
                          className='rounded'
                        />
                        {currentTrack?.id === track.id && (
                          <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded'>
                            {isPlaying ? (
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
                        <p className='text-sm font-medium text-white truncate'>
                          {track.title}
                        </p>
                        <p className='text-xs text-gray-400 truncate'>
                          {track.artist}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Create Playlist Dialog */}
      <Dialog open={showCreatePlaylist} onOpenChange={setShowCreatePlaylist}>
        <DialogContent className='bg-gray-900 text-white border-gray-800'>
          <DialogHeader>
            <DialogTitle className='text-white'>
              Create New Playlist
            </DialogTitle>
          </DialogHeader>
          <div className='py-4'>
            <Input
              placeholder='Playlist name'
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className='bg-gray-800 border-gray-700 text-white'
            />
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              className='border-gray-700 text-white hover:bg-gray-800'
              onClick={() => setShowCreatePlaylist(false)}
            >
              Cancel
            </Button>
            <Button
              className='bg-red-500 hover:bg-red-600 text-white'
              onClick={handleCreatePlaylist}
              disabled={!newPlaylistName.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Playlist Dialog */}
      <Dialog
        open={addToPlaylistDialogOpen}
        onOpenChange={setAddToPlaylistDialogOpen}
      >
        <DialogContent className='bg-gray-900 text-white border-gray-800'>
          <DialogHeader>
            <DialogTitle className='text-white'>Add to Playlist</DialogTitle>
          </DialogHeader>
          <div className='py-4'>
            {playlists.length === 0 ? (
              <div className='flex flex-col items-center justify-center h-40 text-gray-500'>
                <ListMusic size={40} className='mb-2 opacity-50' />
                <p>You don't have any playlists yet</p>
                <Button
                  variant='link'
                  className='text-red-500 mt-2'
                  onClick={() => {
                    setAddToPlaylistDialogOpen(false);
                    setShowCreatePlaylist(true);
                  }}
                >
                  Create your first playlist
                </Button>
              </div>
            ) : (
              <div className='space-y-2 max-h-60 overflow-y-auto pr-2'>
                {playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className='flex items-center justify-between p-2 rounded-md hover:bg-gray-800 cursor-pointer'
                    onClick={() => handleAddToPlaylist(playlist.id)}
                  >
                    <div>
                      <p className='font-medium text-white'>{playlist.name}</p>
                      <p className='text-xs text-gray-400'>
                        {playlist.tracks.length} tracks
                      </p>
                    </div>
                    <Plus size={16} className='text-gray-400' />
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
