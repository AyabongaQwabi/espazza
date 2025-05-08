export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  track_id: string;
  track_title: string;
  artist_name?: string;
  artist_id?: string;
  cover_image_url?: string;
  url: string;
  added_at: string;
  position: number;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  cover_image_url: string;
  url: string;
  duration?: number;
  release_id?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  cover_image_url?: string;
  tracks: Track[];
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  is_public?: boolean;
}

export type RepeatMode = 'off' | 'one' | 'all';

export interface MusicPlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  muted: boolean;
  currentTime: number;
  duration: number;
  repeatMode: RepeatMode;
  shuffle: boolean;
  queue: Track[];
  currentPlaylist: Playlist | null;
  playlists: Playlist[];
  userPlaylists: string[];
  loadingPlaylists: boolean;
}

export type MusicPlayerAction =
  | { type: 'SET_TRACK'; payload: Track }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_CURRENT_TIME'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'NEXT_TRACK' }
  | { type: 'PREV_TRACK' }
  | { type: 'TOGGLE_REPEAT' }
  | { type: 'TOGGLE_SHUFFLE' }
  | { type: 'SET_QUEUE'; payload: Track[] }
  | { type: 'ADD_TO_QUEUE'; payload: Track }
  | { type: 'ADD_TRACKS_TO_QUEUE'; payload: Track[] }
  | { type: 'REMOVE_FROM_QUEUE'; payload: string }
  | { type: 'CLEAR_QUEUE' }
  | { type: 'SET_PLAYLIST'; payload: Playlist }
  | { type: 'SET_PLAYLISTS'; payload: Playlist[] }
  | { type: 'SET_USER_PLAYLISTS'; payload: string[] }
  | { type: 'SET_LOADING_PLAYLISTS'; payload: boolean }
  | { type: 'ADD_PLAYLIST'; payload: Playlist }
  | { type: 'UPDATE_PLAYLIST'; payload: Playlist }
  | { type: 'REMOVE_PLAYLIST'; payload: string }
  | { type: 'ADD_TO_PLAYLIST'; payload: { playlistId: string; track: Track } }
  | {
      type: 'REMOVE_FROM_PLAYLIST';
      payload: { playlistId: string; trackId: string };
    };
