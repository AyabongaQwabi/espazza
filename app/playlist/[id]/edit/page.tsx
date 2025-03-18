'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import { useMusicPlayer } from '@/hooks/use-music-player';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronLeft,
  Save,
  Globe,
  Lock,
  Trash2,
  Music,
  MoreHorizontal,
  ImagePlus,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

export default function EditPlaylistPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { state, updatePlaylist, deletePlaylist } = useMusicPlayer();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [playlist, setPlaylist] = useState<any>(null);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

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
      setPlaylistName(foundPlaylist.name);
      setPlaylistDescription(foundPlaylist.description || '');
      setIsPublic(foundPlaylist.is_public || false);
      setCoverImageUrl(foundPlaylist.cover_image_url || '');
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
      setPlaylistName(playlistWithTracks.name);
      setPlaylistDescription(playlistWithTracks.description || '');
      setIsPublic(playlistWithTracks.is_public || false);
      setCoverImageUrl(playlistWithTracks.cover_image_url || '');
    } catch (error) {
      console.error('Error loading playlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to load playlist. Please try again.',
        variant: 'destructive',
      });
      router.push('/playlists');
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    if (!playlistName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a playlist name',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      await updatePlaylist(params.id, {
        name: playlistName,
        description: playlistDescription,
        is_public: isPublic,
        cover_image_url: coverImageUrl,
      });

      toast({
        title: 'Success',
        description: 'Playlist updated successfully',
        variant: 'default',
      });

      router.push(`/playlist/${params.id}`);
    } catch (error) {
      console.error('Error updating playlist:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        'Are you sure you want to delete this playlist? This action cannot be undone.'
      )
    ) {
      try {
        await deletePlaylist(params.id);
        router.push('/playlists');
      } catch (error) {
        console.error('Error deleting playlist:', error);
      }
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    try {
      const { error } = await supabase
        .from('playlist_tracks')
        .delete()
        .eq('playlist_id', params.id)
        .eq('track_id', trackId);

      if (error) throw error;

      // Update local state
      setPlaylist({
        ...playlist,
        tracks: playlist.tracks.filter((track) => track.id !== trackId),
      });

      toast({
        title: 'Track Removed',
        description: 'Track removed from playlist',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error removing track:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove track. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);

    try {
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      const filePath = `playlist-covers/${params.id}-${Date.now()}.${fileExt}`;

      // Upload the file to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('covers')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('covers')
        .getPublicUrl(filePath);

      setCoverImageUrl(urlData.publicUrl);

      toast({
        title: 'Success',
        description: 'Cover image uploaded successfully',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // Check if user is authorized to edit this playlist
  const isAuthorized =
    currentUser && playlist && currentUser.id === playlist.user_id;

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
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className='flex flex-col items-center justify-center h-screen bg-gray-900 text-white'>
        <Music className='h-16 w-16 mb-4 text-red-500' />
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

  if (!isAuthorized) {
    return (
      <div className='flex flex-col items-center justify-center h-screen bg-gray-900 text-white'>
        <Lock className='h-16 w-16 mb-4 text-red-500' />
        <h2 className='text-2xl font-bold mb-2'>Access Denied</h2>
        <p className='text-gray-400 mb-6'>
          You don't have permission to edit this playlist
        </p>
        <Button
          onClick={() => router.push(`/playlist/${params.id}`)}
          className='bg-red-500 hover:bg-red-600 text-white'
        >
          <ChevronLeft className='mr-2 h-4 w-4' /> Back to Playlist
        </Button>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-900 text-white pb-20'>
      <div className='container mx-auto px-4 py-8'>
        <div className='flex items-center justify-between mb-8'>
          <Button
            variant='ghost'
            className='text-white hover:bg-white/10'
            onClick={() => router.push(`/playlist/${params.id}`)}
          >
            <ChevronLeft className='mr-2 h-4 w-4' /> Back to Playlist
          </Button>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              className='border-gray-700 text-red-400 hover:bg-gray-800 hover:text-red-300'
              onClick={handleDelete}
            >
              <Trash2 className='mr-2 h-4 w-4' />
              Delete Playlist
            </Button>
            <Button
              className='bg-red-500 hover:bg-red-600'
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
              ) : (
                <Save className='h-4 w-4 mr-2' />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        <div className='flex flex-col md:flex-row gap-8'>
          <div className='flex-shrink-0'>
            <div className='relative group w-64 h-64'>
              {coverImageUrl ? (
                <Image
                  src={coverImageUrl || '/placeholder.svg'}
                  alt={playlistName}
                  width={256}
                  height={256}
                  className='rounded-lg shadow-xl shadow-black/50 w-full h-full object-cover'
                />
              ) : (
                <div className='rounded-lg shadow-xl shadow-black/50 w-full h-full bg-gray-800 flex items-center justify-center'>
                  <Music className='h-24 w-24 text-gray-600' />
                </div>
              )}
              <div className='absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center'>
                <label className='cursor-pointer'>
                  <div className='flex flex-col items-center'>
                    <ImagePlus className='h-10 w-10 text-white mb-2' />
                    <span className='text-white text-sm'>Change Cover</span>
                  </div>
                  <input
                    type='file'
                    accept='image/*'
                    className='hidden'
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </label>
              </div>
              {uploadingImage && (
                <div className='absolute inset-0 bg-black/70 rounded-lg flex items-center justify-center'>
                  <Loader2 className='h-10 w-10 text-white animate-spin' />
                </div>
              )}
            </div>
          </div>

          <div className='flex-grow'>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='name' className='text-white'>
                  Playlist Name
                </Label>
                <Input
                  id='name'
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  className='bg-gray-800 border-gray-700 text-white'
                  placeholder='Enter playlist name'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='description' className='text-white'>
                  Description (optional)
                </Label>
                <Textarea
                  id='description'
                  value={playlistDescription}
                  onChange={(e) => setPlaylistDescription(e.target.value)}
                  className='bg-gray-800 border-gray-700 text-white min-h-[100px]'
                  placeholder='Describe your playlist...'
                />
              </div>

              <div className='flex items-center space-x-2'>
                <Switch
                  id='public'
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <Label
                  htmlFor='public'
                  className='flex items-center cursor-pointer'
                >
                  {isPublic ? (
                    <>
                      <Globe className='h-4 w-4 mr-2 text-green-500' />
                      Public playlist (visible to everyone)
                    </>
                  ) : (
                    <>
                      <Lock className='h-4 w-4 mr-2 text-gray-400' />
                      Private playlist (only visible to you)
                    </>
                  )}
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* Tracks Section */}
        <div className='mt-12'>
          <h2 className='text-2xl font-bold mb-6'>Tracks</h2>

          {playlist.tracks.length === 0 ? (
            <div className='text-center py-12 bg-gray-800 rounded-lg'>
              <Music className='h-16 w-16 mx-auto mb-4 text-gray-600' />
              <h3 className='text-xl font-semibold mb-2'>
                No tracks in this playlist
              </h3>
              <p className='text-gray-400 mb-6'>This playlist is empty</p>
              <Button
                className='bg-red-500 hover:bg-red-600'
                onClick={() => router.push('/releases')}
              >
                Browse Releases
              </Button>
            </div>
          ) : (
            <div className='bg-gray-800 rounded-lg overflow-hidden'>
              <div className='grid grid-cols-12 p-3 text-sm font-medium text-gray-400 border-b border-gray-700'>
                <div className='col-span-1'>#</div>
                <div className='col-span-5'>TITLE</div>
                <div className='col-span-5'>ARTIST</div>
                <div className='col-span-1'></div>
              </div>

              <ScrollArea className='h-[400px]'>
                {playlist.tracks.map((track, index) => (
                  <div
                    key={track.id}
                    className={`grid grid-cols-12 p-3 items-center hover:bg-gray-700 ${
                      index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-850'
                    }`}
                  >
                    <div className='col-span-1'>{index + 1}</div>
                    <div className='col-span-5 flex items-center'>
                      <div className='relative h-10 w-10 mr-3 flex-shrink-0'>
                        <Image
                          src={track.cover_image_url || '/placeholder.svg'}
                          alt={track.title}
                          layout='fill'
                          objectFit='cover'
                          className='rounded'
                        />
                      </div>
                      <div className='min-w-0'>
                        <p className='font-medium truncate'>{track.title}</p>
                      </div>
                    </div>
                    <div className='col-span-5'>
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
                            className='cursor-pointer hover:bg-gray-700 text-red-400'
                            onClick={() => handleRemoveTrack(track.id)}
                          >
                            <Trash2 className='mr-2 h-4 w-4' />
                            Remove from Playlist
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
