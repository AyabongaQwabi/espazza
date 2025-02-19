'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface SongPreviewProps {
  url: string;
  title: string;
  artist: string;
  coverArt: string;
}

export function SongPreview({
  url,
  title,
  artist,
  coverArt,
}: SongPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => {
        audioRef.current?.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current?.removeEventListener(
          'loadedmetadata',
          handleLoadedMetadata
        );
      };
    }
  }, []);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const volumeValue = newVolume[0];
    setVolume(volumeValue);
    if (audioRef.current) {
      audioRef.current.volume = volumeValue;
    }
    setIsMuted(volumeValue === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className='flex items-center space-x-4 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 p-4 rounded-lg shadow-lg'>
      <img
        src={
          coverArt !== '' || coverArt !== null
            ? coverArt
            : 'https://images.unsplash.com/photo-1511367461989-f85a21fda167'
        }
        alt={`${title} cover`}
        className='w-16 h-16 rounded-md shadow-md'
      />
      <div className='flex-grow'>
        <h3 className='text-lg font-semibold text-white'>{title}</h3>
        <p className='text-sm text-gray-200'>{artist}</p>
        <div className='flex items-center mt-2'>
          <Button
            variant='ghost'
            size='icon'
            className='text-white hover:text-gray-200'
            onClick={togglePlayPause}
          >
            {isPlaying ? (
              <Pause className='h-6 w-6' />
            ) : (
              <Play className='h-6 w-6' />
            )}
          </Button>
          <div className='flex-grow mx-2'>
            <Slider
              value={[currentTime]}
              max={duration}
              step={0.1}
              onValueChange={(value) => {
                if (audioRef.current) {
                  audioRef.current.currentTime = value[0];
                }
              }}
              className='w-full'
            />
          </div>
          <span className='text-xs text-white'>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>
      <div className='flex items-center space-x-2'>
        <Button
          variant='ghost'
          size='icon'
          className='text-white hover:text-gray-200'
          onClick={toggleMute}
        >
          {isMuted ? (
            <VolumeX className='h-4 w-4' />
          ) : (
            <Volume2 className='h-4 w-4' />
          )}
        </Button>
        <Slider
          value={[volume]}
          max={1}
          step={0.01}
          onValueChange={handleVolumeChange}
          className='w-20'
        />
      </div>
      <audio ref={audioRef} src={url} />
    </div>
  );
}
