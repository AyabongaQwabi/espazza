'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { PlusCircle, X, User, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Artist {
  id: string;
  artist_name?: string;
  full_name?: string;
  profile_image_url?: string;
  avatar_url?: string;
}

interface Song {
  id: string;
  featured_artists: any[];
  producers: any[];
  [key: string]: any;
}

interface ArtistMultiSelectProps {
  song: Song;
  title: string;
  id: string;
  updateSong: (updatedSong: Song) => void;
}

export function ArtistMultiSelect({
  song,
  title,
  id,
  updateSong,
}: ArtistMultiSelectProps) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newArtistName, setNewArtistName] = useState('');
  const [newArtistFullName, setNewArtistFullName] = useState('');
  const [newArtistImage, setNewArtistImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const supabase = createClientComponentClient();

  // Get the current selected artists for this field (featured_artists or producers)
  const selectedArtists = song[id] || [];

  useEffect(() => {
    fetchArtists();
  }, []);

  async function fetchArtists() {
    try {
      setLoading(true);
      // Fetch profiles that have artist_name or are of user_type 'artist'
      const { data, error } = await supabase
        .from('profiles')
        .select('id, artist_name, full_name, profile_image_url, avatar_url')
        .or('artist_name.neq.null,user_type.eq.artist')
        .order('artist_name');

      if (error) throw error;

      // Filter out profiles without artist_name or full_name
      const validArtists =
        data?.filter((profile) => profile.artist_name || profile.full_name) ||
        [];

      setArtists(validArtists);
    } catch (error: any) {
      console.error('Error fetching artists:', error);
      toast({
        title: 'Error',
        description: 'Failed to load artists',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleSelectArtist(artist: Artist) {
    // Check if artist is already selected
    if (selectedArtists.some((a: any) => a.id === artist.id)) {
      return;
    }

    // Add artist to the selected list
    const updatedSong = {
      ...song,
      [id]: [...selectedArtists, artist],
    };

    updateSong(updatedSong);
    setOpen(false);
  }

  function handleRemoveArtist(artistId: string) {
    const updatedArtists = selectedArtists.filter(
      (artist: any) => artist.id !== artistId
    );

    const updatedSong = {
      ...song,
      [id]: updatedArtists,
    };

    updateSong(updatedSong);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setNewArtistImage(file);

    // Create a preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleCreateArtist() {
    if (!newArtistName.trim()) {
      toast({
        title: 'Error',
        description: 'Artist name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Upload image if provided
      let imageUrl = null;
      if (newArtistImage) {
        const fileExt = newArtistImage.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(fileName, newArtistImage);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('profiles')
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
      }

      // Create a new user account for the artist
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: `artist_${Date.now()}@placeholder.com`,
        password: `Artist${Date.now()}!`, // Generate a random secure password
        options: {
          data: {
            artist_name: newArtistName,
            full_name: newArtistFullName || newArtistName,
          },
        },
      });

      if (authError) throw authError;

      // Update the profile with additional artist information
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .update({
          artist_name: newArtistName,
          full_name: newArtistFullName || newArtistName,
          profile_image_url: imageUrl,
          user_type: 'artist',
        })
        .eq('id', authData.user?.id)
        .select()
        .single();

      if (profileError) throw profileError;

      // Add to artists list
      setArtists([...artists, profileData]);

      // Add to selected artists
      const updatedSong = {
        ...song,
        [id]: [...selectedArtists, profileData],
      };

      updateSong(updatedSong);

      // Reset form
      setNewArtistName('');
      setNewArtistFullName('');
      setNewArtistImage(null);
      setImagePreview(null);
      setCreateDialogOpen(false);

      toast({
        title: 'Success',
        description: 'Artist created successfully',
      });
    } catch (error: any) {
      console.error('Error creating artist:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create artist',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  // Get display name for an artist (artist_name or full_name)
  function getArtistDisplayName(artist: Artist): string {
    return artist.artist_name || artist.full_name || 'Unknown Artist';
  }

  // Get image URL for an artist (profile_image_url or avatar_url)
  function getArtistImageUrl(artist: Artist): string | null {
    return artist.profile_image_url || artist.avatar_url || null;
  }

  const filteredArtists = artists.filter((artist) => {
    const displayName = getArtistDisplayName(artist).toLowerCase();
    return displayName.includes(searchQuery.toLowerCase());
  });

  return (
    <div className='space-y-2 mt-4'>
      <Label className='text-sm font-medium'>{title}</Label>

      <div className='flex flex-wrap gap-2 mb-2'>
        {selectedArtists.map((artist: Artist) => (
          <Badge
            key={artist.id}
            variant='secondary'
            className='flex items-center gap-1'
          >
            {getArtistDisplayName(artist)}
            <Button
              variant='ghost'
              size='icon'
              className='h-4 w-4 p-0 ml-1'
              onClick={() => handleRemoveArtist(artist.id)}
            >
              <X className='h-3 w-3' />
            </Button>
          </Badge>
        ))}

        {selectedArtists.length === 0 && (
          <p className='text-sm text-muted-foreground'>
            No {title.toLowerCase()} selected
          </p>
        )}
      </div>

      <div className='flex gap-2'>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant='outline' size='sm' className='h-8'>
              <Search className='mr-2 h-3.5 w-3.5' />
              <span>Select {title.toLowerCase()}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className='p-0'
            align='start'
            side='bottom'
            sideOffset={5}
          >
            <Command>
              <CommandInput
                placeholder={`Search ${title.toLowerCase()}...`}
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                <CommandEmpty>
                  <div className='py-6 text-center text-sm'>
                    <User className='mx-auto h-12 w-12 text-muted-foreground opacity-50' />
                    <h3 className='mt-2 font-semibold'>No artists found</h3>
                    <p className='text-xs text-muted-foreground mt-1'>
                      Try a different search term or create a new artist
                    </p>
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {filteredArtists.map((artist) => (
                    <CommandItem
                      key={artist.id}
                      value={getArtistDisplayName(artist)}
                      onSelect={() => handleSelectArtist(artist)}
                      className='flex items-center gap-2'
                    >
                      {getArtistImageUrl(artist) ? (
                        <div className='h-6 w-6 rounded-full overflow-hidden'>
                          <img
                            src={
                              getArtistImageUrl(artist) || '/placeholder.svg'
                            }
                            alt={getArtistDisplayName(artist)}
                            className='h-full w-full object-cover'
                          />
                        </div>
                      ) : (
                        <User className='h-5 w-5 text-muted-foreground' />
                      )}
                      <span>{getArtistDisplayName(artist)}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
              <div className='p-2 border-t'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='w-full justify-start'
                  onClick={() => {
                    setOpen(false);
                    setCreateDialogOpen(true);
                  }}
                >
                  <PlusCircle className='mr-2 h-4 w-4' />
                  Create new artist
                </Button>
              </div>
            </Command>
          </PopoverContent>
        </Popover>

        <Button
          variant='outline'
          size='sm'
          className='h-8'
          onClick={() => setCreateDialogOpen(true)}
        >
          <PlusCircle className='mr-2 h-3.5 w-3.5' />
          <span>Add new</span>
        </Button>
      </div>

      {/* Create Artist Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Create New Artist</DialogTitle>
            <DialogDescription>
              Add a new artist to your catalog.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='artist-name' className='text-right'>
                Artist Name
              </Label>
              <Input
                id='artist-name'
                value={newArtistName}
                onChange={(e) => setNewArtistName(e.target.value)}
                className='col-span-3'
                placeholder='Stage name or artist name'
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='full-name' className='text-right'>
                Full Name
              </Label>
              <Input
                id='full-name'
                value={newArtistFullName}
                onChange={(e) => setNewArtistFullName(e.target.value)}
                className='col-span-3'
                placeholder='Legal name (optional)'
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='artist-image' className='text-right'>
                Profile Image
              </Label>
              <div className='col-span-3'>
                <Input
                  id='artist-image'
                  type='file'
                  accept='image/*'
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div className='mt-2 relative w-16 h-16'>
                    <img
                      src={imagePreview || '/placeholder.svg'}
                      alt='Preview'
                      className='w-full h-full object-cover rounded-md'
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateArtist} disabled={loading}>
              {loading ? 'Creating...' : 'Create Artist'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
