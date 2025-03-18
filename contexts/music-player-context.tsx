'use client';

import type React from 'react';
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
} from 'react';
import type {
  MusicPlayerState,
  MusicPlayerAction,
  Track,
  Playlist,
  RepeatMode,
} from '@/types/music-player';

const initialState: MusicPlayerState = {
  currentTrack: null,
  isPlaying: false,
  volume: 0.7,
  muted: false,
  currentTime: 0,
  duration: 0,
  repeatMode: 'off',
  shuffle: false,
  queue: [],
  currentPlaylist: null,
  playlists: [],
};

function musicPlayerReducer(
  state: MusicPlayerState,
  action: MusicPlayerAction
): MusicPlayerState {
  switch (action.type) {
    case 'SET_TRACK':
      return {
        ...state,
        currentTrack: action.payload,
        isPlaying: true,
        currentTime: 0,
      };
    case 'PLAY':
      return {
        ...state,
        isPlaying: true,
      };
    case 'PAUSE':
      return {
        ...state,
        isPlaying: false,
      };
    case 'TOGGLE_PLAY':
      return {
        ...state,
        isPlaying: !state.isPlaying,
      };
    case 'SET_VOLUME':
      return {
        ...state,
        volume: action.payload,
        muted: action.payload === 0,
      };
    case 'TOGGLE_MUTE':
      return {
        ...state,
        muted: !state.muted,
      };
    case 'SET_CURRENT_TIME':
      return {
        ...state,
        currentTime: action.payload,
      };
    case 'SET_DURATION':
      return {
        ...state,
        duration: action.payload,
      };
    case 'NEXT_TRACK': {
      if (!state.queue.length) return state;

      const currentIndex = state.currentTrack
        ? state.queue.findIndex((track) => track.id === state.currentTrack?.id)
        : -1;

      let nextIndex = currentIndex + 1;

      // Handle repeat modes
      if (nextIndex >= state.queue.length) {
        if (state.repeatMode === 'all') {
          nextIndex = 0;
        } else if (state.repeatMode === 'off') {
          return {
            ...state,
            isPlaying: false,
            currentTime: 0,
          };
        }
      }

      return {
        ...state,
        currentTrack: state.queue[nextIndex] || null,
        isPlaying: nextIndex < state.queue.length,
        currentTime: 0,
      };
    }
    case 'PREV_TRACK': {
      if (!state.queue.length) return state;

      const currentIndex = state.currentTrack
        ? state.queue.findIndex((track) => track.id === state.currentTrack?.id)
        : -1;

      // If we're more than 3 seconds into the song, restart it instead of going to previous
      if (state.currentTime > 3) {
        return {
          ...state,
          currentTime: 0,
        };
      }

      let prevIndex = currentIndex - 1;

      if (prevIndex < 0) {
        if (state.repeatMode === 'all') {
          prevIndex = state.queue.length - 1;
        } else {
          prevIndex = 0;
        }
      }

      return {
        ...state,
        currentTrack: state.queue[prevIndex] || null,
        isPlaying: true,
        currentTime: 0,
      };
    }
    case 'TOGGLE_REPEAT': {
      const modes: RepeatMode[] = ['off', 'all', 'one'];
      const currentIndex = modes.indexOf(state.repeatMode);
      const nextIndex = (currentIndex + 1) % modes.length;

      return {
        ...state,
        repeatMode: modes[nextIndex],
      };
    }
    case 'TOGGLE_SHUFFLE': {
      if (!state.shuffle) {
        // Shuffle the queue, but keep the current track at its position
        const currentTrackId = state.currentTrack?.id;
        const newQueue = [...state.queue];

        if (currentTrackId) {
          const currentIndex = newQueue.findIndex(
            (track) => track.id === currentTrackId
          );
          if (currentIndex !== -1) {
            const currentTrack = newQueue[currentIndex];
            newQueue.splice(currentIndex, 1);

            // Fisher-Yates shuffle algorithm
            for (let i = newQueue.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [newQueue[i], newQueue[j]] = [newQueue[j], newQueue[i]];
            }

            // Put current track back at the beginning
            newQueue.unshift(currentTrack);
          }
        }

        return {
          ...state,
          shuffle: true,
          queue: newQueue,
        };
      } else {
        // If we're turning shuffle off and have a current playlist, restore the original order
        if (state.currentPlaylist) {
          const currentTrackId = state.currentTrack?.id;
          const newQueue = [...state.currentPlaylist.tracks];

          if (currentTrackId) {
            const currentIndex = newQueue.findIndex(
              (track) => track.id === currentTrackId
            );
            if (currentIndex !== -1) {
              // Move current track to the beginning
              const currentTrack = newQueue[currentIndex];
              newQueue.splice(currentIndex, 1);
              newQueue.unshift(currentTrack);
            }
          }

          return {
            ...state,
            shuffle: false,
            queue: newQueue,
          };
        }

        return {
          ...state,
          shuffle: false,
        };
      }
    }
    case 'SET_QUEUE':
      return {
        ...state,
        queue: action.payload,
        currentTrack: action.payload.length > 0 ? action.payload[0] : null,
        currentTime: 0,
        isPlaying: action.payload.length > 0,
      };
    case 'ADD_TO_QUEUE':
      return {
        ...state,
        queue: [...state.queue, action.payload],
      };
    case 'REMOVE_FROM_QUEUE': {
      const newQueue = state.queue.filter(
        (track) => track.id !== action.payload
      );

      // If we removed the current track, play the next one
      if (state.currentTrack?.id === action.payload) {
        const currentIndex = state.queue.findIndex(
          (track) => track.id === action.payload
        );
        const nextTrack = newQueue[currentIndex] || newQueue[0] || null;

        return {
          ...state,
          queue: newQueue,
          currentTrack: nextTrack,
          isPlaying: !!nextTrack,
          currentTime: 0,
        };
      }

      return {
        ...state,
        queue: newQueue,
      };
    }
    case 'CLEAR_QUEUE':
      return {
        ...state,
        queue: [],
        currentTrack: null,
        isPlaying: false,
        currentTime: 0,
        currentPlaylist: null,
      };
    case 'SET_PLAYLIST': {
      return {
        ...state,
        currentPlaylist: action.payload,
        queue: action.payload.tracks,
        currentTrack:
          action.payload.tracks.length > 0 ? action.payload.tracks[0] : null,
        isPlaying: action.payload.tracks.length > 0,
        currentTime: 0,
      };
    }
    case 'ADD_PLAYLIST':
      return {
        ...state,
        playlists: [...state.playlists, action.payload],
      };
    case 'REMOVE_PLAYLIST': {
      const newPlaylists = state.playlists.filter(
        (playlist) => playlist.id !== action.payload
      );

      // If we removed the current playlist, clear the queue
      if (state.currentPlaylist?.id === action.payload) {
        return {
          ...state,
          playlists: newPlaylists,
          currentPlaylist: null,
          queue: [],
          currentTrack: null,
          isPlaying: false,
          currentTime: 0,
        };
      }

      return {
        ...state,
        playlists: newPlaylists,
      };
    }
    case 'ADD_TO_PLAYLIST': {
      const { playlistId, track } = action.payload;
      const newPlaylists = state.playlists.map((playlist) => {
        if (playlist.id === playlistId) {
          // Check if track already exists in playlist
          const trackExists = playlist.tracks.some((t) => t.id === track.id);
          if (trackExists) return playlist;

          return {
            ...playlist,
            tracks: [...playlist.tracks, track],
          };
        }
        return playlist;
      });

      // Update current playlist if needed
      let newCurrentPlaylist = state.currentPlaylist;
      if (state.currentPlaylist?.id === playlistId) {
        const trackExists = state.currentPlaylist.tracks.some(
          (t) => t.id === track.id
        );
        if (!trackExists) {
          newCurrentPlaylist = {
            ...state.currentPlaylist,
            tracks: [...state.currentPlaylist.tracks, track],
          };
        }
      }

      return {
        ...state,
        playlists: newPlaylists,
        currentPlaylist: newCurrentPlaylist,
      };
    }
    case 'REMOVE_FROM_PLAYLIST': {
      const { playlistId, trackId } = action.payload;
      const newPlaylists = state.playlists.map((playlist) => {
        if (playlist.id === playlistId) {
          return {
            ...playlist,
            tracks: playlist.tracks.filter((track) => track.id !== trackId),
          };
        }
        return playlist;
      });

      // Update current playlist and queue if needed
      let newCurrentPlaylist = state.currentPlaylist;
      let newQueue = state.queue;
      let newCurrentTrack = state.currentTrack;
      let newIsPlaying = state.isPlaying;

      if (state.currentPlaylist?.id === playlistId) {
        newCurrentPlaylist = {
          ...state.currentPlaylist,
          tracks: state.currentPlaylist.tracks.filter(
            (track) => track.id !== trackId
          ),
        };

        // If we're playing from this playlist, update the queue too
        newQueue = state.queue.filter((track) => track.id !== trackId);

        // If we removed the current track, play the next one
        if (state.currentTrack?.id === trackId) {
          const currentIndex = state.queue.findIndex(
            (track) => track.id === trackId
          );
          newCurrentTrack = newQueue[currentIndex] || newQueue[0] || null;
          newIsPlaying = !!newCurrentTrack;
        }
      }

      return {
        ...state,
        playlists: newPlaylists,
        currentPlaylist: newCurrentPlaylist,
        queue: newQueue,
        currentTrack: newCurrentTrack,
        isPlaying: newIsPlaying,
        currentTime:
          newCurrentTrack !== state.currentTrack ? 0 : state.currentTime,
      };
    }
    default:
      return state;
  }
}

type MusicPlayerContextType = {
  state: MusicPlayerState;
  dispatch: React.Dispatch<MusicPlayerAction>;
  audioRef: React.RefObject<HTMLAudioElement>;
  playTrack: (track: Track) => void;
  playPlaylist: (playlist: Playlist) => void;
  addToPlaylist: (playlistId: string, track: Track) => void;
  createPlaylist: (name: string, tracks?: Track[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  formatTime: (time: number) => string;
};

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(
  undefined
);

export function MusicPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(musicPlayerReducer, initialState);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load playlists from localStorage on mount
  useEffect(() => {
    try {
      const savedPlaylists = localStorage.getItem('music-playlists');
      if (savedPlaylists) {
        const playlists = JSON.parse(savedPlaylists) as Playlist[];
        playlists.forEach((playlist) => {
          dispatch({ type: 'ADD_PLAYLIST', payload: playlist });
        });
      }
    } catch (error) {
      console.error('Failed to load playlists from localStorage:', error);
    }
  }, []);

  // Save playlists to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('music-playlists', JSON.stringify(state.playlists));
    } catch (error) {
      console.error('Failed to save playlists to localStorage:', error);
    }
  }, [state.playlists]);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      dispatch({ type: 'SET_CURRENT_TIME', payload: audio.currentTime });
    };

    const handleDurationChange = () => {
      dispatch({ type: 'SET_DURATION', payload: audio.duration });
    };

    const handleEnded = () => {
      if (state.repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else {
        dispatch({ type: 'NEXT_TRACK' });
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [state.repeatMode]);

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (state.isPlaying) {
      audio.play().catch((error) => {
        console.error('Failed to play audio:', error);
        dispatch({ type: 'PAUSE' });
      });
    } else {
      audio.pause();
    }
  }, [state.isPlaying, state.currentTrack]);

  // Handle volume changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = state.muted ? 0 : state.volume;
  }, [state.volume, state.muted]);

  // Handle track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !state.currentTrack) return;

    audio.src = state.currentTrack.url;
    audio.load();

    if (state.isPlaying) {
      audio.play().catch((error) => {
        console.error('Failed to play audio:', error);
        dispatch({ type: 'PAUSE' });
      });
    }
  }, [state.currentTrack]);

  // Helper functions
  const playTrack = (track: Track) => {
    dispatch({ type: 'SET_TRACK', payload: track });
    dispatch({ type: 'SET_QUEUE', payload: [track] });
  };

  const playPlaylist = (playlist: Playlist) => {
    dispatch({ type: 'SET_PLAYLIST', payload: playlist });
  };

  const addToPlaylist = (playlistId: string, track: Track) => {
    dispatch({
      type: 'ADD_TO_PLAYLIST',
      payload: { playlistId, track },
    });
  };

  const createPlaylist = (name: string, tracks: Track[] = []) => {
    const newPlaylist: Playlist = {
      id: `playlist-${Date.now()}`,
      name,
      tracks,
      createdAt: new Date(),
    };

    dispatch({ type: 'ADD_PLAYLIST', payload: newPlaylist });
  };

  const togglePlay = () => {
    dispatch({ type: 'TOGGLE_PLAY' });
  };

  const nextTrack = () => {
    dispatch({ type: 'NEXT_TRACK' });
  };

  const prevTrack = () => {
    dispatch({ type: 'PREV_TRACK' });
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    dispatch({ type: 'SET_CURRENT_TIME', payload: time });
  };

  const setVolume = (volume: number) => {
    dispatch({ type: 'SET_VOLUME', payload: volume });
  };

  const toggleMute = () => {
    dispatch({ type: 'TOGGLE_MUTE' });
  };

  const toggleRepeat = () => {
    dispatch({ type: 'TOGGLE_REPEAT' });
  };

  const toggleShuffle = () => {
    dispatch({ type: 'TOGGLE_SHUFFLE' });
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <MusicPlayerContext.Provider
      value={{
        state,
        dispatch,
        audioRef,
        playTrack,
        playPlaylist,
        addToPlaylist,
        createPlaylist,
        togglePlay,
        nextTrack,
        prevTrack,
        seekTo,
        setVolume,
        toggleMute,
        toggleRepeat,
        toggleShuffle,
        formatTime,
      }}
    >
      {children}
      <audio ref={audioRef} />
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
}
