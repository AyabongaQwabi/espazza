'use client';

import type React from 'react';
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
} from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type {
  MusicPlayerState,
  MusicPlayerAction,
  Track,
  Playlist,
  RepeatMode,
} from '@/types/music-player';
import { toast } from '@/hooks/use-toast';

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
  userPlaylists: [],
  loadingPlaylists: true,
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
    case 'SET_PLAYLISTS':
      return {
        ...state,
        playlists: action.payload,
        loadingPlaylists: false,
      };
    case 'SET_USER_PLAYLISTS':
      return {
        ...state,
        userPlaylists: action.payload,
      };
    case 'SET_LOADING_PLAYLISTS':
      return {
        ...state,
        loadingPlaylists: action.payload,
      };
    case 'ADD_PLAYLIST':
      return {
        ...state,
        playlists: [...state.playlists, action.payload],
      };
    case 'UPDATE_PLAYLIST': {
      const updatedPlaylists = state.playlists.map((playlist) =>
        playlist.id === action.payload.id ? action.payload : playlist
      );

      // If this is the current playlist, update it and the queue
      let updatedCurrentPlaylist = state.currentPlaylist;
      let updatedQueue = state.queue;

      if (state.currentPlaylist?.id === action.payload.id) {
        updatedCurrentPlaylist = action.payload;
        updatedQueue = action.payload.tracks;
      }

      return {
        ...state,
        playlists: updatedPlaylists,
        currentPlaylist: updatedCurrentPlaylist,
        queue: updatedQueue,
      };
    }
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
  addToPlaylist: (playlistId: string, track: Track) => Promise<void>;
  createPlaylist: (
    name: string,
    description?: string,
    tracks?: Track[],
    isPublic?: boolean
  ) => Promise<string | null>;
  updatePlaylist: (
    playlistId: string,
    updates: Partial<Playlist>
  ) => Promise<void>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  savePlaylist: (playlistId: string) => Promise<void>;
  unsavePlaylist: (playlistId: string) => Promise<void>;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  formatTime: (time: number) => string;
  refreshPlaylists: () => Promise<void>;
  isPlaylistSaved: (playlistId: string) => boolean;
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
  const supabase = createClientComponentClient();

  // Load playlists from Supabase on mount
  useEffect(() => {
    fetchPlaylists();
  }, []);

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

  // Fetch playlists from Supabase
  const fetchPlaylists = async () => {
    dispatch({ type: 'SET_LOADING_PLAYLISTS', payload: true });

    try {
      // Get user session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (userId) {
        // Fetch playlists created by the user
        const { data: userCreatedPlaylists, error: userPlaylistsError } =
          await supabase
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
            .eq('user_id', userId);

        if (userPlaylistsError) throw userPlaylistsError;

        // Fetch public playlists
        const { data: publicPlaylists, error: publicPlaylistsError } =
          await supabase
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
            .eq('is_public', true)
            .neq('user_id', userId);

        if (publicPlaylistsError) throw publicPlaylistsError;

        // Fetch user's saved playlists
        const { data: savedPlaylists, error: savedPlaylistsError } =
          await supabase
            .from('user_playlists')
            .select(
              `
            playlist_id
          `
            )
            .eq('user_id', userId);

        if (savedPlaylistsError) throw savedPlaylistsError;

        // Combine all playlists
        const allPlaylistsData = [...userCreatedPlaylists, ...publicPlaylists];
        const savedPlaylistIds = savedPlaylists.map((sp) => sp.playlist_id);

        // Fetch tracks for each playlist
        const playlistsWithTracks = await Promise.all(
          allPlaylistsData.map(async (playlist) => {
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
              .eq('playlist_id', playlist.id)
              .order('position');

            if (tracksError) {
              console.error('Error fetching tracks for playlist:', tracksError);
              return {
                ...playlist,
                tracks: [],
              };
            }

            return {
              ...playlist,
              tracks: tracks.map((track) => ({
                id: track.track_id,
                title: track.track_title,
                artist: track.artist_name || '',
                artistId: track.artist_id,
                cover_image_url: track.cover_image_url || '',
                url: track.url,
              })),
            };
          })
        );

        dispatch({ type: 'SET_PLAYLISTS', payload: playlistsWithTracks });
        dispatch({ type: 'SET_USER_PLAYLISTS', payload: savedPlaylistIds });
      } else {
        // Fetch only public playlists for non-logged in users
        const { data: publicPlaylists, error: publicPlaylistsError } =
          await supabase
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
            .eq('is_public', true);

        if (publicPlaylistsError) throw publicPlaylistsError;

        // Fetch tracks for each playlist
        const playlistsWithTracks = await Promise.all(
          publicPlaylists.map(async (playlist) => {
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
              .eq('playlist_id', playlist.id)
              .order('position');

            if (tracksError) {
              console.error('Error fetching tracks for playlist:', tracksError);
              return {
                ...playlist,
                tracks: [],
              };
            }

            return {
              ...playlist,
              tracks: tracks.map((track) => ({
                id: track.track_id,
                title: track.track_title,
                artist: track.artist_name || '',
                artistId: track.artist_id,
                cover_image_url: track.cover_image_url || '',
                url: track.url,
              })),
            };
          })
        );

        dispatch({ type: 'SET_PLAYLISTS', payload: playlistsWithTracks });
        dispatch({ type: 'SET_USER_PLAYLISTS', payload: [] });
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
      toast({
        title: 'Error',
        description: 'Failed to load playlists. Please try again.',
        variant: 'destructive',
      });
    } finally {
      dispatch({ type: 'SET_LOADING_PLAYLISTS', payload: false });
    }
  };

  // Helper functions
  const playTrack = (track: Track) => {
    dispatch({ type: 'SET_TRACK', payload: track });
    dispatch({ type: 'SET_QUEUE', payload: [track] });
  };

  const playPlaylist = (playlist: Playlist) => {
    dispatch({ type: 'SET_PLAYLIST', payload: playlist });
  };

  const addToPlaylist = async (playlistId: string, track: Track) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to add tracks to playlists',
          variant: 'destructive',
        });
        return;
      }

      // Check if track already exists in playlist
      const { data: existingTrack, error: checkError } = await supabase
        .from('playlist_tracks')
        .select('id')
        .eq('playlist_id', playlistId)
        .eq('track_id', track.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingTrack) {
        toast({
          title: 'Track Already Exists',
          description: 'This track is already in the playlist',
          variant: 'default',
        });
        return;
      }

      // Get the highest position in the playlist
      const { data: positionData, error: positionError } = await supabase
        .from('playlist_tracks')
        .select('position')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: false })
        .limit(1);

      if (positionError) throw positionError;

      const nextPosition =
        positionData.length > 0 ? positionData[0].position + 1 : 0;

      // Add track to playlist
      const { error: insertError } = await supabase
        .from('playlist_tracks')
        .insert({
          playlist_id: playlistId,
          track_id: track.id,
          track_title: track.title,
          artist_name: track.artist,
          artist_id: track.artistId,
          cover_image_url: track.cover_image_url,
          url: track.url,
          added_by: userId,
          position: nextPosition,
        });

      if (insertError) throw insertError;

      // Update the playlist in state
      dispatch({
        type: 'ADD_TO_PLAYLIST',
        payload: { playlistId, track },
      });

      toast({
        title: 'Track Added',
        description: 'Track added to playlist successfully',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error adding track to playlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to add track to playlist. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const createPlaylist = async (
    name: string,
    description = '',
    tracks: Track[] = [],
    isPublic = false
  ) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to create playlists',
          variant: 'destructive',
        });
        return null;
      }

      // Create the playlist
      const { data: playlist, error: playlistError } = await supabase
        .from('playlists')
        .insert({
          name,
          description,
          user_id: userId,
          is_public: isPublic,
        })
        .select()
        .single();

      if (playlistError) throw playlistError;

      // Add tracks to the playlist if any
      if (tracks.length > 0) {
        const trackInserts = tracks.map((track, index) => ({
          playlist_id: playlist.id,
          track_id: track.id,
          track_title: track.title,
          artist_name: track.artist,
          artist_id: track.artistId,
          cover_image_url: track.cover_image_url,
          url: track.url,
          added_by: userId,
          position: index,
        }));

        const { error: tracksError } = await supabase
          .from('playlist_tracks')
          .insert(trackInserts);

        if (tracksError) throw tracksError;
      }

      // Add the playlist to state
      const newPlaylist = {
        ...playlist,
        tracks,
      };

      dispatch({ type: 'ADD_PLAYLIST', payload: newPlaylist });

      toast({
        title: 'Playlist Created',
        description: 'Your playlist has been created successfully',
        variant: 'default',
      });

      return playlist.id;
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to create playlist. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updatePlaylist = async (
    playlistId: string,
    updates: Partial<Playlist>
  ) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to update playlists',
          variant: 'destructive',
        });
        return;
      }

      // Update the playlist
      const { error: updateError } = await supabase
        .from('playlists')
        .update({
          name: updates.name,
          description: updates.description,
          is_public: updates.is_public,
          cover_image_url: updates.cover_image_url,
        })
        .eq('id', playlistId)
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Find the playlist in state
      const playlist = state.playlists.find((p) => p.id === playlistId);
      if (!playlist) return;

      // Update the playlist in state
      const updatedPlaylist = {
        ...playlist,
        ...updates,
      };

      dispatch({ type: 'UPDATE_PLAYLIST', payload: updatedPlaylist });

      toast({
        title: 'Playlist Updated',
        description: 'Your playlist has been updated successfully',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error updating playlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to update playlist. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to delete playlists',
          variant: 'destructive',
        });
        return;
      }

      // Delete the playlist
      const { error: deleteError } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Remove the playlist from state
      dispatch({ type: 'REMOVE_PLAYLIST', payload: playlistId });

      toast({
        title: 'Playlist Deleted',
        description: 'Your playlist has been deleted successfully',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error deleting playlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete playlist. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const savePlaylist = async (playlistId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to save playlists',
          variant: 'destructive',
        });
        return;
      }

      // Save the playlist
      const { error: saveError } = await supabase
        .from('user_playlists')
        .insert({
          user_id: userId,
          playlist_id: playlistId,
        });

      if (saveError) throw saveError;

      // Update user playlists in state
      dispatch({
        type: 'SET_USER_PLAYLISTS',
        payload: [...state.userPlaylists, playlistId],
      });

      toast({
        title: 'Playlist Saved',
        description: 'Playlist has been saved to your library',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error saving playlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to save playlist. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const unsavePlaylist = async (playlistId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (!userId) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to unsave playlists',
          variant: 'destructive',
        });
        return;
      }

      // Unsave the playlist
      const { error: unsaveError } = await supabase
        .from('user_playlists')
        .delete()
        .eq('user_id', userId)
        .eq('playlist_id', playlistId);

      if (unsaveError) throw unsaveError;

      // Update user playlists in state
      dispatch({
        type: 'SET_USER_PLAYLISTS',
        payload: state.userPlaylists.filter((id) => id !== playlistId),
      });

      toast({
        title: 'Playlist Removed',
        description: 'Playlist has been removed from your library',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error unsaving playlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove playlist. Please try again.',
        variant: 'destructive',
      });
    }
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

  const refreshPlaylists = async () => {
    await fetchPlaylists();
  };

  const isPlaylistSaved = (playlistId: string) => {
    return state.userPlaylists.includes(playlistId);
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
        updatePlaylist,
        deletePlaylist,
        savePlaylist,
        unsavePlaylist,
        togglePlay,
        nextTrack,
        prevTrack,
        seekTo,
        setVolume,
        toggleMute,
        toggleRepeat,
        toggleShuffle,
        formatTime,
        refreshPlaylists,
        isPlaylistSaved,
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
