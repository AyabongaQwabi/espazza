'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { useMusicPlayer } from '@/hooks/use-music-player';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  Plus,
  User,
  ListMusic,
  MoreHorizontal,
  Heart,
  HeartOff,
  Edit,
  Trash2,
  Globe,
  Lock,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function PlaylistsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const {
    state,
    playPlaylist,
    createPlaylist,
    savePlaylist,
    unsavePlaylist,
    deletePlaylist,
    isPlaylistSaved,
    refreshPlaylists,
  } = useMusicPlayer();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [newPlaylistIsPublic, setNewPlaylistIsPublic] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  useEffect(() => {
    checkUser();
    refreshPlaylists();
  }, []);

  useEffect(() => {
    if (state.currentPlaylist) {
      setCurrentlyPlaying(state.currentPlaylist.id);
    } else {
      setCurrentlyPlaying(null);
    }
  }, [state.currentPlaylist]);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUser(user);
  }

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a playlist name',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingPlaylist(true);

    try {
      const playlistId = await createPlaylist(
        newPlaylistName,
        newPlaylistDescription,
        [],
        newPlaylistIsPublic
      );

      if (playlistId) {
        setCreateDialogOpen(false);
        setNewPlaylistName('');
        setNewPlaylistDescription('');
        setNewPlaylistIsPublic(false);
        setActiveTab('my');
      }
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  const handlePlayPlaylist = (playlist) => {
    playPlaylist(playlist);
    setCurrentlyPlaying(playlist.id);
  };

  const handleSavePlaylist = async (playlistId) => {
    await savePlaylist(playlistId);
  };

  const handleUnsavePlaylist = async (playlistId) => {
    await unsavePlaylist(playlistId);
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (
      window.confirm(
        'Are you sure you want to delete this playlist? This action cannot be undone.'
      )
    ) {
      await deletePlaylist(playlistId);
    }
  };

  const getFilteredPlaylists = () => {
    if (!state.playlists) return [];

    if (activeTab === 'all') {
      return state.playlists;
    } else if (activeTab === 'my') {
      return state.playlists.filter(
        (playlist) => currentUser && playlist.user_id === currentUser.id
      );
    } else if (activeTab === 'saved') {
      return state.playlists.filter(
        (playlist) =>
          state.userPlaylists.includes(playlist.id) &&
          currentUser &&
          playlist.user_id !== currentUser.id
      );
    }

    return state.playlists;
  };

  const isUserPlaylist = (playlist) => {
    return currentUser && playlist.user_id === currentUser.id;
  };

  return (
    <div className='min-h-screen bg-gray-900 text-white pb-20'>
      <div className='container mx-auto px-4 py-8'>
        <div className='flex items-center justify-between mb-8'>
          <h1 className='text-3xl font-bold'>Playlists</h1>

          {currentUser && (
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className='bg-red-500 hover:bg-red-600'
            >
              <Plus className='mr-2 h-4 w-4' />
              Create Playlist
            </Button>
          )}
        </div>

        <Tabs
          defaultValue='all'
          value={activeTab}
          onValueChange={setActiveTab}
          className='w-full'
        >
          <div className='flex items-center justify-between mb-6'>
            <TabsList className='bg-gray-800'>
              <TabsTrigger
                value='all'
                className='data-[state=active]:bg-red-500 data-[state=active]:text-white'
              >
                All Playlists
              </TabsTrigger>
              {currentUser && (
                <>
                  <TabsTrigger
                    value='my'
                    className='data-[state=active]:bg-red-500 data-[state=active]:text-white'
                  >
                    My Playlists
                  </TabsTrigger>
                  <TabsTrigger
                    value='saved'
                    className='data-[state=active]:bg-red-500 data-[state=active]:text-white'
                  >
                    Saved Playlists
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </div>

          <TabsContent value='all' className='mt-0'>
            <PlaylistGrid
              playlists={getFilteredPlaylists()}
              loading={state.loadingPlaylists}
              currentlyPlaying={currentlyPlaying}
              onPlay={handlePlayPlaylist}
              onSave={handleSavePlaylist}
              onUnsave={handleUnsavePlaylist}
              onDelete={handleDeletePlaylist}
              isPlaylistSaved={isPlaylistSaved}
              isUserPlaylist={isUserPlaylist}
              currentUser={currentUser}
            />
          </TabsContent>

          <TabsContent value='my' className='mt-0'>
            <PlaylistGrid
              playlists={getFilteredPlaylists()}
              loading={state.loadingPlaylists}
              currentlyPlaying={currentlyPlaying}
              onPlay={handlePlayPlaylist}
              onSave={handleSavePlaylist}
              onUnsave={handleUnsavePlaylist}
              onDelete={handleDeletePlaylist}
              isPlaylistSaved={isPlaylistSaved}
              isUserPlaylist={isUserPlaylist}
              currentUser={currentUser}
            />
          </TabsContent>

          <TabsContent value='saved' className='mt-0'>
            <PlaylistGrid
              playlists={getFilteredPlaylists()}
              loading={state.loadingPlaylists}
              currentlyPlaying={currentlyPlaying}
              onPlay={handlePlayPlaylist}
              onSave={handleSavePlaylist}
              onUnsave={handleUnsavePlaylist}
              onDelete={handleDeletePlaylist}
              isPlaylistSaved={isPlaylistSaved}
              isUserPlaylist={isUserPlaylist}
              currentUser={currentUser}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Playlist Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className='bg-gray-800 border-gray-700 text-white'>
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Playlist Name</Label>
              <Input
                id='name'
                placeholder='My Awesome Playlist'
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className='bg-gray-700 border-gray-600'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='description'>Description (optional)</Label>
              <Textarea
                id='description'
                placeholder='Describe your playlist...'
                value={newPlaylistDescription}
                onChange={(e) => setNewPlaylistDescription(e.target.value)}
                className='bg-gray-700 border-gray-600 min-h-[100px]'
              />
            </div>

            <div className='flex items-center space-x-2'>
              <Switch
                id='public'
                checked={newPlaylistIsPublic}
                onCheckedChange={setNewPlaylistIsPublic}
              />
              <Label
                htmlFor='public'
                className='flex items-center cursor-pointer'
              >
                {newPlaylistIsPublic ? (
                  <>
                    <Globe className='h-4 w-4 mr-2 text-green-500' />
                    Public playlist
                  </>
                ) : (
                  <>
                    <Lock className='h-4 w-4 mr-2 text-gray-400' />
                    Private playlist
                  </>
                )}
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setCreateDialogOpen(false)}
              className='border-gray-600 text-white hover:bg-gray-700'
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePlaylist}
              className='bg-red-500 hover:bg-red-600'
              disabled={isCreatingPlaylist || !newPlaylistName.trim()}
            >
              {isCreatingPlaylist ? 'Creating...' : 'Create Playlist'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlaylistGrid({
  playlists,
  loading,
  currentlyPlaying,
  onPlay,
  onSave,
  onUnsave,
  onDelete,
  isPlaylistSaved,
  isUserPlaylist,
  currentUser,
}) {
  const router = useRouter();

  if (loading) {
    return (
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
        {[...Array(8)].map((_, i) => (
          <div key={i} className='bg-gray-800 rounded-lg overflow-hidden'>
            <Skeleton className='h-40 w-full bg-gray-700' />
            <div className='p-4'>
              <Skeleton className='h-6 w-3/4 mb-2 bg-gray-700' />
              <Skeleton className='h-4 w-1/2 mb-4 bg-gray-700' />
              <div className='flex justify-between'>
                <Skeleton className='h-8 w-20 bg-gray-700' />
                <Skeleton className='h-8 w-8 bg-gray-700 rounded-full' />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <div className='text-center py-16 bg-gray-800 rounded-lg'>
        <ListMusic className='h-16 w-16 mx-auto mb-4 text-gray-600' />
        <h3 className='text-xl font-semibold mb-2'>No playlists found</h3>
        <p className='text-gray-400 mb-6'>
          {currentUser
            ? "You haven't created or saved any playlists yet."
            : 'Please log in to create playlists.'}
        </p>
        {currentUser && (
          <Button
            onClick={() =>
              document.querySelector('[data-create-playlist]')?.click()
            }
            className='bg-red-500 hover:bg-red-600'
          >
            <Plus className='mr-2 h-4 w-4' />
            Create Your First Playlist
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
      {playlists.map((playlist) => (
        <div
          key={playlist.id}
          className='bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300 group'
        >
          <div className='relative aspect-square overflow-hidden bg-gray-700'>
            {playlist.cover_image_url ? (
              <Image
                src={playlist.cover_image_url || '/placeholder.svg'}
                alt={playlist.name}
                layout='fill'
                objectFit='cover'
                className='transition-transform duration-500 group-hover:scale-110'
              />
            ) : (
              <div className='absolute inset-0 flex items-center justify-center'>
                <ListMusic className='h-20 w-20 text-gray-600' />
              </div>
            )}
            <div className='absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-3'>
              <Button
                size='icon'
                className='bg-red-500 hover:bg-red-600 rounded-full h-12 w-12 shadow-lg transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300'
                onClick={() => onPlay(playlist)}
              >
                {currentlyPlaying === playlist.id ? (
                  <Pause className='h-5 w-5' />
                ) : (
                  <Play className='h-5 w-5 ml-1' />
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='text-white hover:bg-white/20 rounded-full transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300'
                  >
                    <MoreHorizontal className='h-5 w-5' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='bg-gray-800 border-gray-700 text-white'>
                  <DropdownMenuItem
                    className='cursor-pointer hover:bg-gray-700'
                    onClick={() => router.push(`/playlist/${playlist.id}`)}
                  >
                    <ListMusic className='mr-2 h-4 w-4' />
                    View Details
                  </DropdownMenuItem>

                  {currentUser && (
                    <>
                      {isUserPlaylist(playlist) ? (
                        <>
                          <DropdownMenuItem
                            className='cursor-pointer hover:bg-gray-700'
                            onClick={() =>
                              router.push(`/playlist/${playlist.id}/edit`)
                            }
                          >
                            <Edit className='mr-2 h-4 w-4' />
                            Edit Playlist
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className='bg-gray-700' />
                          <DropdownMenuItem
                            className='cursor-pointer hover:bg-gray-700 text-red-400'
                            onClick={() => onDelete(playlist.id)}
                          >
                            <Trash2 className='mr-2 h-4 w-4' />
                            Delete Playlist
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          {isPlaylistSaved(playlist.id) ? (
                            <DropdownMenuItem
                              className='cursor-pointer hover:bg-gray-700'
                              onClick={() => onUnsave(playlist.id)}
                            >
                              <HeartOff className='mr-2 h-4 w-4' />
                              Remove from Library
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className='cursor-pointer hover:bg-gray-700'
                              onClick={() => onSave(playlist.id)}
                            >
                              <Heart className='mr-2 h-4 w-4' />
                              Save to Library
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className='p-4'>
            <Link href={`/playlist/${playlist.id}`} className='block'>
              <h3 className='font-bold text-lg mb-1 truncate hover:text-red-500 transition-colors'>
                {playlist.name}
              </h3>
            </Link>

            <div className='flex items-center text-sm text-gray-400 mb-3'>
              <User className='h-3 w-3 mr-1' />
              <span className='truncate'>
                Created by {isUserPlaylist(playlist) ? 'you' : 'user'}
              </span>
            </div>

            <div className='flex items-center justify-between'>
              <Badge
                className={`${
                  playlist.is_public ? 'bg-green-600' : 'bg-gray-600'
                } text-xs`}
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

              <span className='text-xs text-gray-400'>
                {playlist.tracks.length}{' '}
                {playlist.tracks.length === 1 ? 'track' : 'tracks'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
