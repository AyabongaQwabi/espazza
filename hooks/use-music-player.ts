'use client';

import { useMusicPlayer as usePlayerContext } from '@/contexts/music-player-context';
import type { Track } from '@/types/music-player';

export function useMusicPlayer() {
  const context = usePlayerContext();

  // Helper function to play a track from a release page
  const playTrackFromRelease = (track: Track, allTracks: Track[]) => {
    // Set the queue to all tracks from the release
    context.dispatch({ type: 'SET_QUEUE', payload: allTracks });

    // Then play the selected track
    context.dispatch({ type: 'SET_TRACK', payload: track });
  };

  return {
    ...context,
    playTrackFromRelease,
  };
}
