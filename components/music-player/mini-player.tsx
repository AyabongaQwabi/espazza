'use client';
import Image from 'next/image';
import { useMusicPlayer } from '@/contexts/music-player-context';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipForward } from 'lucide-react';

export function MiniPlayer() {
  const { state, togglePlay, nextTrack } = useMusicPlayer();
  const { currentTrack, isPlaying } = state;

  if (!currentTrack) return null;

  return (
    <div className='fixed bottom-16 left-4 right-4 bg-gray-900/90 backdrop-blur-md rounded-lg p-2 border border-gray-800 shadow-lg md:hidden z-40'>
      <div className='flex items-center'>
        <div className='relative h-10 w-10 mr-3'>
          <Image
            src={currentTrack.cover_image_url || '/placeholder.svg'}
            alt={currentTrack.title}
            layout='fill'
            objectFit='cover'
            className='rounded'
          />
        </div>
        <div className='flex-1 min-w-0'>
          <p className='text-sm font-medium text-white truncate'>
            {currentTrack.title}
          </p>
          <p className='text-xs text-gray-400 truncate'>
            {currentTrack.artist}
          </p>
        </div>
        <div className='flex items-center space-x-1'>
          <Button
            size='icon'
            className='h-8 w-8 bg-red-500 hover:bg-red-600 text-white rounded-full'
            onClick={togglePlay}
          >
            {isPlaying ? (
              <Pause size={16} />
            ) : (
              <Play size={16} className='ml-0.5' />
            )}
          </Button>
          <Button
            size='icon'
            variant='ghost'
            className='h-8 w-8 text-gray-400 hover:text-white'
            onClick={nextTrack}
          >
            <SkipForward size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
