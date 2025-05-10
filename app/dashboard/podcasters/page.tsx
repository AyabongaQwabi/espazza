'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  PlusIcon,
  Loader2,
  ImageIcon,
  Trash2Icon,
  YoutubeIcon,
  User,
  Search,
  X,
  MusicIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

export default function PodcastersPage() {
  const [podcasters, setPodcasters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPodcaster, setSelectedPodcaster] = useState<any>(null);
  const [formData, setFormData] = useState({
    podcast_name: '',
    youtube_channel_link: '',
  });
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Episode related states
  const [episodeDialogOpen, setEpisodeDialogOpen] = useState(false);
  const [episodeFormData, setEpisodeFormData] = useState({
    title: '',
    youtube_link: '',
  });
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [selectedPodcasterForEpisode, setSelectedPodcasterForEpisode] =
    useState<any>(null);

  // Artist search states
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<any>(null);

  const supabase = createClientComponentClient();

  useEffect(() => {
    // Check authentication
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'You must be logged in to manage podcasters',
          variant: 'destructive',
        });
      }
    }

    checkAuth();
    loadPodcasters();
  }, []);

  async function loadPodcasters() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('podcasters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // For each podcaster, get the image if it's not already a public URL
      const podcastersWithImages = await Promise.all(
        (data || []).map(async (podcaster) => {
          // If profile_image_url is already a full URL, use it directly
          if (
            podcaster.profile_image_url &&
            (podcaster.profile_image_url.startsWith('http://') ||
              podcaster.profile_image_url.startsWith('https://'))
          ) {
            return podcaster;
          }

          // Otherwise, check if there's an image in storage
          const { data: imageData } = await supabase.storage
            .from('podcaster-images')
            .list(podcaster.id.toString());

          let imageUrl = null;
          if (imageData && imageData.length > 0) {
            imageUrl = supabase.storage
              .from('podcaster-images')
              .getPublicUrl(`${podcaster.id}/${imageData[0].name}`)
              .data.publicUrl;

            // Update the podcaster record with the public URL
            await supabase
              .from('podcasters')
              .update({ profile_image_url: imageUrl })
              .eq('id', podcaster.id);
          }

          return {
            ...podcaster,
            profile_image_url: imageUrl || podcaster.profile_image_url,
          };
        })
      );

      setPodcasters(podcastersWithImages);
    } catch (error) {
      console.error('Error loading podcasters:', error);
      toast({
        title: 'Error',
        description: 'Failed to load podcasters',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadEpisodes(podcasterId: string) {
    try {
      setLoadingEpisodes(true);

      // Get episodes for the selected podcaster
      const { data: episodesData, error: episodesError } = await supabase
        .from('podcast_episodes')
        .select(
          `
          *,
          featured_artist:featured_artist_id(id, username, artist_name, profile_image_url)
        `
        )
        .eq('podcaster_id', podcasterId)
        .order('created_at', { ascending: false });

      if (episodesError) throw episodesError;

      setEpisodes(episodesData || []);
    } catch (error) {
      console.error('Error loading episodes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load podcast episodes',
        variant: 'destructive',
      });
    } finally {
      setLoadingEpisodes(false);
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEpisodeInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEpisodeFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImageUrl(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImage(null);
    setImageUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      // Get current user
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to add a podcaster',
          variant: 'destructive',
        });
        return;
      }

      // Insert podcaster data
      const { data: podcasterData, error } = await supabase
        .from('podcasters')
        .insert({
          podcast_name: formData.podcast_name,
          youtube_channel_link: formData.youtube_channel_link,
          created_at: new Date().toISOString(),
        })
        .select();

      if (error) throw error;

      // Upload image if there is one
      if (image && podcasterData) {
        const podcasterId = podcasterData[0].id;
        const fileExt = image.name.split('.').pop();
        const fileName = `profile.${fileExt}`;
        const filePath = `${podcasterId}/${fileName}`;

        // Update progress
        setUploadProgress(50);

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('podcaster-images')
          .upload(filePath, image);

        if (uploadError) throw uploadError;

        // Get the public URL
        const { data: publicUrlData } = supabase.storage
          .from('podcaster-images')
          .getPublicUrl(filePath);

        // Update the podcaster record with the image URL
        await supabase
          .from('podcasters')
          .update({ profile_image_url: publicUrlData.publicUrl })
          .eq('id', podcasterId);

        setUploadProgress(100);
      }

      // Reset form
      setFormData({
        podcast_name: '',
        youtube_channel_link: '',
      });
      setImage(null);
      setImageUrl('');
      setUploadProgress(0);
      setDialogOpen(false);

      // Reload podcasters
      loadPodcasters();

      toast({
        title: 'Success',
        description: 'Podcaster added successfully',
      });
    } catch (error) {
      console.error('Error adding podcaster:', error);
      toast({
        title: 'Error',
        description: 'Failed to add podcaster',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddEpisode = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      if (!selectedPodcasterForEpisode) {
        toast({
          title: 'Error',
          description: 'No podcaster selected',
          variant: 'destructive',
        });
        return;
      }

      // Insert episode data
      const { data: episodeData, error } = await supabase
        .from('podcast_episodes')
        .insert({
          title: episodeFormData.title,
          podcaster_id: selectedPodcasterForEpisode.id,
          featured_artist_id: selectedArtist?.id || null,
          youtube_link: episodeFormData.youtube_link,
          created_at: new Date().toISOString(),
        })
        .select();

      if (error) throw error;

      // Reset form
      setEpisodeFormData({
        title: '',
        youtube_link: '',
      });
      setSelectedArtist(null);
      setSearchQuery('');
      setEpisodeDialogOpen(false);

      // Reload episodes for the selected podcaster
      loadEpisodes(selectedPodcasterForEpisode.id);

      toast({
        title: 'Success',
        description: 'Episode added successfully',
      });
    } catch (error) {
      console.error('Error adding episode:', error);
      toast({
        title: 'Error',
        description: 'Failed to add episode',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const viewPodcaster = async (podcaster: any) => {
    setSelectedPodcaster(podcaster);
    await loadEpisodes(podcaster.id);
  };

  const editPodcaster = (podcaster: any) => {
    setSelectedPodcaster(podcaster);
    setFormData({
      podcast_name: podcaster.podcast_name,
      youtube_channel_link: podcaster.youtube_channel_link || '',
    });
    setImage(null);
    setImageUrl(podcaster.profile_image_url || '');
    setEditDialogOpen(true);
  };

  const addEpisodeToPodcaster = (podcaster: any) => {
    setSelectedPodcasterForEpisode(podcaster);
    setEpisodeFormData({
      title: '',
      youtube_link: '',
    });
    setSelectedArtist(null);
    setSearchQuery('');
    setEpisodeDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      // Get current user
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to update a podcaster',
          variant: 'destructive',
        });
        return;
      }

      if (!selectedPodcaster) {
        toast({
          title: 'Error',
          description: 'No podcaster selected for update',
          variant: 'destructive',
        });
        return;
      }

      // Update podcaster data
      const { error } = await supabase
        .from('podcasters')
        .update({
          podcast_name: formData.podcast_name,
          youtube_channel_link: formData.youtube_channel_link,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedPodcaster.id);

      if (error) throw error;

      // Upload new image if there is one
      if (image) {
        const podcasterId = selectedPodcaster.id;
        const fileExt = image.name.split('.').pop();
        const fileName = `profile.${fileExt}`;
        const filePath = `${podcasterId}/${fileName}`;

        // Update progress
        setUploadProgress(50);

        const { error: uploadError } = await supabase.storage
          .from('podcaster-images')
          .upload(filePath, image, {
            upsert: true,
          });

        if (uploadError) throw uploadError;

        // Get the public URL
        const { data: publicUrlData } = supabase.storage
          .from('podcaster-images')
          .getPublicUrl(filePath);

        // Update the podcaster record with the image URL
        await supabase
          .from('podcasters')
          .update({ profile_image_url: publicUrlData.publicUrl })
          .eq('id', podcasterId);

        setUploadProgress(100);
      }

      // Reset form
      setFormData({
        podcast_name: '',
        youtube_channel_link: '',
      });
      setImage(null);
      setImageUrl('');
      setUploadProgress(0);
      setEditDialogOpen(false);

      // Reload podcasters
      loadPodcasters();

      toast({
        title: 'Success',
        description: 'Podcaster updated successfully',
      });
    } catch (error) {
      console.error('Error updating podcaster:', error);
      toast({
        title: 'Error',
        description: 'Failed to update podcaster',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const deletePodcaster = async (podcasterId: string) => {
    if (!confirm('Are you sure you want to delete this podcaster?')) {
      return;
    }

    try {
      setLoading(true);

      // Delete the podcaster
      const { error } = await supabase
        .from('podcasters')
        .delete()
        .eq('id', podcasterId);

      if (error) throw error;

      // Delete the image from storage
      await supabase.storage
        .from('podcaster-images')
        .remove([`${podcasterId}/profile.jpg`]);
      await supabase.storage
        .from('podcaster-images')
        .remove([`${podcasterId}/profile.png`]);
      await supabase.storage
        .from('podcaster-images')
        .remove([`${podcasterId}/profile.jpeg`]);

      // Reload podcasters
      loadPodcasters();

      toast({
        title: 'Success',
        description: 'Podcaster deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting podcaster:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete podcaster',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteEpisode = async (episodeId: string) => {
    if (!confirm('Are you sure you want to delete this episode?')) {
      return;
    }

    try {
      setLoadingEpisodes(true);

      // Delete the episode
      const { error } = await supabase
        .from('podcast_episodes')
        .delete()
        .eq('id', episodeId);

      if (error) throw error;

      // Reload episodes
      if (selectedPodcaster) {
        loadEpisodes(selectedPodcaster.id);
      }

      toast({
        title: 'Success',
        description: 'Episode deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting episode:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete episode',
        variant: 'destructive',
      });
    } finally {
      setLoadingEpisodes(false);
    }
  };

  // Search for artists in the profiles table
  const searchArtists = async (query: string) => {
    if (!query || query.length < 2) {
      setProfiles([]);
      return;
    }

    setProfilesLoading(true);
    try {
      // Search pattern for better matching
      const searchPattern = `%${query}%`;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, artist_name, profile_image_url')
        .or(
          `username.ilike.${searchPattern},artist_name.ilike.${searchPattern}`
        )
        .limit(10);

      if (error) throw error;

      setProfiles(data || []);
    } catch (error) {
      console.error('Error searching artists:', error);
      toast({
        title: 'Error',
        description: 'Failed to search artists',
        variant: 'destructive',
      });
    } finally {
      setProfilesLoading(false);
    }
  };

  return (
    <div className='p-8'>
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='mb-8'
      >
        <h1 className='text-3xl font-bold text-white mb-2'>Podcasters</h1>
        <p className='text-zinc-400'>Manage podcasters for eSpazza</p>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className='mb-8'
      >
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className='bg-red-600 hover:bg-red-700'>
              <PlusIcon className='h-4 w-4 mr-2' />
              Add New Podcaster
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[90vw] h-screen overflow-scroll flex flex-col'>
            <DialogHeader>
              <DialogTitle>Add New Podcaster</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className='flex flex-col h-full'>
              <div className='overflow-y-auto flex-1 pr-1'>
                <div className='grid gap-4 py-4'>
                  <div className='grid gap-2'>
                    <Label htmlFor='podcast_name'>Podcast Name</Label>
                    <Input
                      id='podcast_name'
                      name='podcast_name'
                      value={formData.podcast_name}
                      onChange={handleInputChange}
                      placeholder='Enter podcast name'
                      required
                    />
                  </div>

                  <div className='grid gap-2'>
                    <Label htmlFor='youtube_channel_link'>
                      YouTube Channel Link
                    </Label>
                    <Input
                      id='youtube_channel_link'
                      name='youtube_channel_link'
                      value={formData.youtube_channel_link}
                      onChange={handleInputChange}
                      placeholder='https://youtube.com/channel'
                    />
                  </div>

                  <div className='grid gap-2'>
                    <Label htmlFor='image'>Profile Image</Label>
                    <div className='border border-zinc-700 rounded-md p-4'>
                      <Input
                        id='image'
                        type='file'
                        accept='image/*'
                        onChange={handleImageChange}
                        className='mb-4'
                      />

                      {imageUrl && (
                        <div className='relative group'>
                          <div className='aspect-square w-40 h-40 relative rounded-md overflow-hidden mx-auto'>
                            <Image
                              src={imageUrl || '/placeholder.svg'}
                              alt='Podcaster preview'
                              fill
                              className='object-cover'
                            />
                          </div>
                          <button
                            type='button'
                            onClick={removeImage}
                            className='absolute top-1 right-1 bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
                          >
                            <Trash2Icon className='h-4 w-4 text-white' />
                          </button>
                        </div>
                      )}

                      {!imageUrl && (
                        <div className='flex flex-col items-center justify-center text-zinc-400 py-8'>
                          <ImageIcon className='h-12 w-12 mb-2' />
                          <p>No image selected</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className='sticky bottom-0 bg-background pt-2'>
                <Button type='submit' disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                      {uploadProgress > 0
                        ? `Uploading... ${uploadProgress}%`
                        : 'Saving...'}
                    </>
                  ) : (
                    'Add Podcaster'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Podcaster Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className='sm:max-w-[90vw] h-screen overflow-scroll flex flex-col'>
            <DialogHeader>
              <DialogTitle>Edit Podcaster</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className='flex flex-col h-full'>
              <div className='overflow-y-auto flex-1 pr-1'>
                <div className='grid gap-4 py-4'>
                  <div className='grid gap-2'>
                    <Label htmlFor='edit-podcast_name'>Podcast Name</Label>
                    <Input
                      id='edit-podcast_name'
                      name='podcast_name'
                      value={formData.podcast_name}
                      onChange={handleInputChange}
                      placeholder='Enter podcast name'
                      required
                    />
                  </div>

                  <div className='grid gap-2'>
                    <Label htmlFor='edit-youtube_channel_link'>
                      YouTube Channel Link
                    </Label>
                    <Input
                      id='edit-youtube_channel_link'
                      name='youtube_channel_link'
                      value={formData.youtube_channel_link}
                      onChange={handleInputChange}
                      placeholder='https://youtube.com/channel'
                    />
                  </div>

                  <div className='grid gap-2'>
                    <Label htmlFor='edit-image'>Profile Image</Label>
                    <div className='border border-zinc-700 rounded-md p-4'>
                      <Input
                        id='edit-image'
                        type='file'
                        accept='image/*'
                        onChange={handleImageChange}
                        className='mb-4'
                      />

                      {(imageUrl || image) && (
                        <div className='relative group'>
                          <div className='aspect-square w-40 h-40 relative rounded-md overflow-hidden mx-auto'>
                            <Image
                              src={
                                image
                                  ? URL.createObjectURL(image)
                                  : imageUrl || '/placeholder.svg'
                              }
                              alt='Podcaster preview'
                              fill
                              className='object-cover'
                            />
                          </div>
                          <button
                            type='button'
                            onClick={removeImage}
                            className='absolute top-1 right-1 bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
                          >
                            <Trash2Icon className='h-4 w-4 text-white' />
                          </button>
                        </div>
                      )}

                      {!imageUrl && !image && (
                        <div className='flex flex-col items-center justify-center text-zinc-400 py-8'>
                          <ImageIcon className='h-12 w-12 mb-2' />
                          <p>No image selected</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className='sticky bottom-0 bg-background pt-2'>
                <Button type='submit' disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                      {uploadProgress > 0
                        ? `Uploading... ${uploadProgress}%`
                        : 'Saving...'}
                    </>
                  ) : (
                    'Update Podcaster'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Episode Dialog */}
        <Dialog open={episodeDialogOpen} onOpenChange={setEpisodeDialogOpen}>
          <DialogContent className='sm:max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col'>
            <DialogHeader>
              <DialogTitle>
                Add Episode to{' '}
                {selectedPodcasterForEpisode?.podcast_name || 'Podcaster'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddEpisode} className='flex flex-col h-full'>
              <div className='overflow-y-auto flex-1 pr-1'>
                <div className='grid gap-4 py-4'>
                  <div className='grid gap-2'>
                    <Label htmlFor='episode-title'>Episode Title</Label>
                    <Input
                      id='episode-title'
                      name='title'
                      value={episodeFormData.title}
                      onChange={handleEpisodeInputChange}
                      placeholder='Enter episode title'
                      required
                    />
                  </div>

                  <div className='grid gap-2'>
                    <Label htmlFor='episode-youtube-link'>YouTube Link</Label>
                    <Input
                      id='episode-youtube-link'
                      name='youtube_link'
                      value={episodeFormData.youtube_link}
                      onChange={handleEpisodeInputChange}
                      placeholder='https://youtube.com/watch?v=...'
                    />
                  </div>

                  <div className='grid gap-2'>
                    <Label htmlFor='featured-artist'>Featured Artist</Label>
                    <p className='text-xs text-zinc-400 mb-2'>
                      Search for an artist to feature in this episode
                    </p>

                    <div className='relative'>
                      <div className='flex items-center'>
                        <Input
                          id='featured-artist'
                          placeholder='Search artists by name...'
                          value={searchQuery}
                          onChange={(e) => {
                            const value = e.target.value;
                            setSearchQuery(value);
                            if (value.length >= 2) {
                              searchArtists(value);
                            }
                          }}
                          className='w-full'
                        />
                        <Button
                          variant='ghost'
                          size='icon'
                          className='absolute right-0'
                          onClick={() => searchArtists(searchQuery)}
                        >
                          <Search className='h-4 w-4' />
                        </Button>
                      </div>

                      {/* Selected artist display */}
                      {selectedArtist && (
                        <div className='mt-2 p-2 border rounded-md flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            {selectedArtist.profile_image_url ? (
                              <img
                                src={
                                  selectedArtist.profile_image_url ||
                                  '/placeholder.svg'
                                }
                                alt={
                                  selectedArtist.artist_name ||
                                  selectedArtist.username
                                }
                                className='w-8 h-8 rounded-full object-cover'
                              />
                            ) : (
                              <User className='h-6 w-6 text-muted-foreground' />
                            )}
                            <div>
                              <div className='font-medium'>
                                {selectedArtist.artist_name ||
                                  selectedArtist.username}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => setSelectedArtist(null)}
                          >
                            <X className='h-4 w-4' />
                          </Button>
                        </div>
                      )}

                      {/* Search results */}
                      {searchQuery.length >= 2 &&
                        profiles.length > 0 &&
                        !selectedArtist && (
                          <div className='absolute z-10 w-full mt-1 bg-background border rounded-md shadow-md max-h-60 overflow-y-auto'>
                            {profilesLoading ? (
                              <div className='flex items-center justify-center p-4'>
                                <Loader2 className='h-4 w-4 animate-spin mr-2' />
                                <span>Searching...</span>
                              </div>
                            ) : (
                              <div>
                                {profiles.map((profile) => (
                                  <div
                                    key={profile.id}
                                    className='p-2 hover:bg-muted cursor-pointer flex items-center gap-2'
                                    onClick={() => {
                                      setSelectedArtist(profile);
                                      setSearchQuery('');
                                    }}
                                  >
                                    {profile.profile_image_url ? (
                                      <img
                                        src={
                                          profile.profile_image_url ||
                                          '/placeholder.svg'
                                        }
                                        alt={
                                          profile.artist_name ||
                                          profile.username
                                        }
                                        className='w-8 h-8 rounded-full object-cover'
                                      />
                                    ) : (
                                      <User className='h-6 w-6 text-muted-foreground' />
                                    )}
                                    <div>
                                      <div className='font-medium'>
                                        {profile.artist_name ||
                                          profile.username}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                      {/* No results message */}
                      {searchQuery.length >= 2 &&
                        profiles.length === 0 &&
                        !profilesLoading &&
                        !selectedArtist && (
                          <div className='absolute z-10 w-full mt-1 bg-background border rounded-md shadow-md p-4 text-center'>
                            <p>No artists found matching "{searchQuery}"</p>
                            <p className='text-xs text-muted-foreground mt-1'>
                              Try a different search term
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className='sticky bottom-0 bg-background pt-2'>
                <Button type='submit' disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                      Saving...
                    </>
                  ) : (
                    'Add Episode'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Podcasters List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className='bg-zinc-900 border-zinc-800'>
          <CardHeader>
            <CardTitle className='text-white'>Podcasters</CardTitle>
            <CardDescription>All registered podcasters</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className='flex justify-center items-center py-8'>
                <Loader2 className='h-8 w-8 animate-spin text-zinc-400' />
              </div>
            ) : podcasters.length === 0 ? (
              <div className='text-center py-8'>
                <p className='text-zinc-400 mb-4'>No podcasters added yet</p>
                <Button onClick={() => setDialogOpen(true)}>
                  Add Your First Podcaster
                </Button>
              </div>
            ) : (
              <ScrollArea className='h-[500px]'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Podcaster</TableHead>
                      <TableHead>YouTube Channel</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {podcasters.map((podcaster) => (
                      <TableRow key={podcaster.id}>
                        <TableCell>
                          <div className='flex items-center space-x-3'>
                            <div className='h-10 w-10 rounded-full overflow-hidden bg-zinc-800 relative'>
                              {podcaster.profile_image_url ? (
                                <Image
                                  src={
                                    podcaster.profile_image_url ||
                                    '/placeholder.svg'
                                  }
                                  alt={podcaster.podcast_name}
                                  fill
                                  className='object-cover'
                                />
                              ) : (
                                <div className='flex items-center justify-center h-full w-full text-zinc-500'>
                                  <ImageIcon className='h-5 w-5' />
                                </div>
                              )}
                            </div>
                            <div className='font-medium text-white'>
                              {podcaster.podcast_name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {podcaster.youtube_channel_link ? (
                            <a
                              href={podcaster.youtube_channel_link}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='flex items-center text-red-400 hover:text-red-300'
                            >
                              <YoutubeIcon className='h-4 w-4 mr-2' />
                              YouTube Channel
                            </a>
                          ) : (
                            <span className='text-zinc-500'>
                              No channel linked
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className='text-sm text-zinc-400'>
                            {new Date(
                              podcaster.created_at
                            ).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex space-x-2'>
                            <Button
                              variant='outline'
                              size='sm'
                              className='bg-green-900/20 text-green-400 border-green-800 hover:bg-green-900/40'
                              onClick={() => addEpisodeToPodcaster(podcaster)}
                            >
                              <PlusIcon className='h-3 w-3 mr-1' /> Episode
                            </Button>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  onClick={() => viewPodcaster(podcaster)}
                                >
                                  View Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className='sm:max-w-[700px] max-h-[90vh] overflow-y-auto'>
                                <DialogHeader>
                                  <DialogTitle>
                                    {podcaster.podcast_name}
                                  </DialogTitle>
                                </DialogHeader>
                                <div className='grid gap-4 py-4'>
                                  <div className='grid grid-cols-3 gap-4'>
                                    <div className='col-span-1'>
                                      <div className='aspect-square rounded-md overflow-hidden bg-zinc-800 relative'>
                                        {podcaster.profile_image_url ? (
                                          <Image
                                            src={
                                              podcaster.profile_image_url ||
                                              '/placeholder.svg'
                                            }
                                            alt={podcaster.podcast_name}
                                            fill
                                            className='object-cover'
                                          />
                                        ) : (
                                          <div className='flex items-center justify-center h-full w-full text-zinc-500'>
                                            <ImageIcon className='h-10 w-10' />
                                          </div>
                                        )}
                                      </div>

                                      <div className='mt-4'>
                                        <h3 className='font-medium mb-2'>
                                          Links
                                        </h3>
                                        <div className='space-y-2'>
                                          {podcaster.youtube_channel_link && (
                                            <a
                                              href={
                                                podcaster.youtube_channel_link
                                              }
                                              target='_blank'
                                              rel='noopener noreferrer'
                                              className='flex items-center text-red-400 hover:text-red-300'
                                            >
                                              <YoutubeIcon className='h-4 w-4 mr-2' />
                                              YouTube Channel
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className='col-span-2'>
                                      <div>
                                        <h3 className='font-medium mb-2'>
                                          Podcast Information
                                        </h3>
                                        <p className='text-sm mb-4'>
                                          <span className='text-zinc-400'>
                                            Name:
                                          </span>{' '}
                                          {podcaster.podcast_name}
                                        </p>
                                        <p className='text-sm mb-4'>
                                          <span className='text-zinc-400'>
                                            Added:
                                          </span>{' '}
                                          {new Date(
                                            podcaster.created_at
                                          ).toLocaleString()}
                                        </p>
                                        {podcaster.updated_at && (
                                          <p className='text-sm'>
                                            <span className='text-zinc-400'>
                                              Last Updated:
                                            </span>{' '}
                                            {new Date(
                                              podcaster.updated_at
                                            ).toLocaleString()}
                                          </p>
                                        )}
                                      </div>

                                      <div className='mt-6'>
                                        <div className='flex items-center justify-between mb-4'>
                                          <h3 className='font-medium'>
                                            Episodes
                                          </h3>
                                          <Button
                                            size='sm'
                                            variant='outline'
                                            className='bg-green-900/20 text-green-400 border-green-800 hover:bg-green-900/40'
                                            onClick={() =>
                                              addEpisodeToPodcaster(podcaster)
                                            }
                                          >
                                            <PlusIcon className='h-3 w-3 mr-1' />{' '}
                                            Add Episode
                                          </Button>
                                        </div>

                                        {loadingEpisodes ? (
                                          <div className='flex justify-center items-center py-4'>
                                            <Loader2 className='h-5 w-5 animate-spin text-zinc-400 mr-2' />
                                            <span className='text-zinc-400'>
                                              Loading episodes...
                                            </span>
                                          </div>
                                        ) : episodes.length === 0 ? (
                                          <div className='text-center py-4 border border-dashed border-zinc-700 rounded-md'>
                                            <MusicIcon className='h-8 w-8 text-zinc-500 mx-auto mb-2' />
                                            <p className='text-zinc-400'>
                                              No episodes added yet
                                            </p>
                                          </div>
                                        ) : (
                                          <div className='space-y-3'>
                                            {episodes.map((episode) => (
                                              <div
                                                key={episode.id}
                                                className='p-3 border border-zinc-700 rounded-md bg-zinc-800/50'
                                              >
                                                <div className='flex justify-between items-start'>
                                                  <div>
                                                    <h4 className='font-medium text-white'>
                                                      {episode.title}
                                                    </h4>
                                                    <p className='text-xs text-zinc-400 mt-1'>
                                                      Added:{' '}
                                                      {new Date(
                                                        episode.created_at
                                                      ).toLocaleDateString()}
                                                    </p>
                                                  </div>
                                                  <Button
                                                    variant='ghost'
                                                    size='sm'
                                                    className='text-red-400 hover:text-red-300 hover:bg-red-900/20'
                                                    onClick={() =>
                                                      deleteEpisode(episode.id)
                                                    }
                                                  >
                                                    <Trash2Icon className='h-4 w-4' />
                                                  </Button>
                                                </div>

                                                {episode.youtube_link && (
                                                  <a
                                                    href={episode.youtube_link}
                                                    target='_blank'
                                                    rel='noopener noreferrer'
                                                    className='flex items-center text-red-400 hover:text-red-300 mt-2 text-sm'
                                                  >
                                                    <YoutubeIcon className='h-4 w-4 mr-1' />
                                                    Watch on YouTube
                                                  </a>
                                                )}

                                                {episode.featured_artist && (
                                                  <div className='mt-2 flex items-center'>
                                                    <Badge className='bg-zinc-700 text-zinc-300'>
                                                      Featured Artist
                                                    </Badge>
                                                    <div className='flex items-center ml-2'>
                                                      {episode.featured_artist
                                                        .profile_image_url ? (
                                                        <div className='h-5 w-5 rounded-full overflow-hidden mr-1'>
                                                          <Image
                                                            src={
                                                              episode
                                                                .featured_artist
                                                                .profile_image_url ||
                                                              '/placeholder.svg'
                                                            }
                                                            alt={
                                                              episode
                                                                .featured_artist
                                                                .artist_name ||
                                                              episode
                                                                .featured_artist
                                                                .username
                                                            }
                                                            width={20}
                                                            height={20}
                                                            className='object-cover'
                                                          />
                                                        </div>
                                                      ) : (
                                                        <User className='h-4 w-4 mr-1 text-zinc-400' />
                                                      )}
                                                      <span className='text-sm text-zinc-300'>
                                                        {episode.featured_artist
                                                          .artist_name ||
                                                          episode
                                                            .featured_artist
                                                            .username}
                                                      </span>
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            {/* <Button
                              variant='secondary'
                              size='sm'
                              onClick={() => editPodcaster(podcaster)}
                            >
                              Edit
                            </Button>

                            <Button
                              variant='destructive'
                              size='sm'
                              onClick={() => deletePodcaster(podcaster.id)}
                            >
                              Delete
                            </Button> */}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
