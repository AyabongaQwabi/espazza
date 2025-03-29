'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchableSelect } from '@/components/SearchableSelect';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import short from 'short-uuid';
import { ArtistMultiSelect } from '../artists';
import { SongPreview } from '@/components/SongPreview';
import ProgressBar from '@/components/ProgressBar';
import { PaymentDialog } from '@/components/PaymentDialog';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { X, CreditCard, AlertCircle, Loader2 } from 'lucide-react';

interface Song {
  id: string;
  file?: File;
  title: string;
  cover_image_url: string;
  url: string;
  featured_artists: { id: string; artist_name: string }[];
  producers: { id: string; artist_name: string }[];
  lyrics: string;
  price: number;
  preview_start: string;
  release_date: Date;
  genre_id: string;
}

export default function CreateReleasePage() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); // Add loading state for initial data fetch
  const [recordLabels, setRecordLabels] = useState<
    { id: string; name: string }[]
  >([]);
  const [distributors, setDistributors] = useState<
    { id: string; name: string }[]
  >([]);
  const [genres, setGenres] = useState<{ id: string; name: string }[]>([]);
  const [songUploadProgress, setSongUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [newRelease, setNewRelease] = useState({
    title: '',
    description: '',
    record_label_id: '',
    distributor_id: '',
    genre_id: '',
    cover_image_url: '',
    tracks: [],
    release_date: new Date(),
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    null
  );
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [newReleaseSongs, setReleaseSongs] = useState<Song[]>([]);
  const [currentUploadingFile, setCurrentUploadingFile] = useState<
    string | null
  >(null);
  const [creationStatus, setCreationStatus] = useState<string | null>(null);
  // Update the payment dialog handling to reset state when closed
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [createdReleaseId, setCreatedReleaseId] = useState<string | null>(null);
  const [releaseCreated, setReleaseCreated] = useState(false); // Track if release has been created
  const [isUpdating, setIsUpdating] = useState(false); // Track if we're updating an existing release

  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const loadInitialData = async () => {
      setInitialLoading(true);
      try {
        // Load options (genres, labels, distributors)
        const [labelsResponse, distributorsResponse, genresResponse] =
          await Promise.all([
            supabase.from('record_labels').select('id, name'),
            supabase.from('distributors').select('id, name'),
            supabase.from('genres').select('id, name'),
          ]);

        if (labelsResponse.data) setRecordLabels(labelsResponse.data);
        if (distributorsResponse.data)
          setDistributors(distributorsResponse.data);
        if (genresResponse.data) setGenres(genresResponse.data);

        // No longer checking for unpaid releases on load
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load initial data. Please refresh the page.',
          variant: 'destructive',
        });
      } finally {
        setInitialLoading(false);
      }
    };

    loadInitialData();
  }, []); // Empty dependency array to run only once

  // Update the checkUnpaidRelease function to properly fetch and populate all release details
  const checkUnpaidRelease = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Check for the most recent unpaid release by this user with complete data
      const { data, error } = await supabase
        .from('releases')
        .select(
          `
        *,
        tracks,
        record_label:record_label_id (id, name),
        distributor:distributor_id (id, name),
        genre:genre_id (id, name)
      `
        )
        .eq('record_owner', user.id)
        .eq('is_paid', false)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const unpaidRelease = data[0];
        console.log('Found unpaid release:', unpaidRelease);

        // Set the release ID and mark as created
        setCreatedReleaseId(unpaidRelease.id);
        setReleaseCreated(true);
        setIsUpdating(true);

        // Populate the form with the unpaid release data
        setNewRelease({
          title: unpaidRelease.title || '',
          description: unpaidRelease.description || '',
          record_label_id: unpaidRelease.record_label_id || '',
          distributor_id: unpaidRelease.distributor_id || '',
          genre_id: unpaidRelease.genre_id || '',
          cover_image_url: unpaidRelease.cover_image_url || '',
          tracks: unpaidRelease.tracks || [],
          release_date: unpaidRelease.release_date
            ? new Date(unpaidRelease.release_date)
            : new Date(),
        });

        // Set cover image preview if available
        if (unpaidRelease.cover_image_url) {
          setCoverImagePreview(unpaidRelease.cover_image_url);
        }

        // Convert tracks to the format expected by the form
        if (unpaidRelease.tracks && Array.isArray(unpaidRelease.tracks)) {
          const formattedSongs: Song[] = unpaidRelease.tracks.map(
            (track: any) => ({
              id: track.id,
              title: track.title || '',
              cover_image_url: track.cover_image_url || '',
              url: track.url || '',
              featured_artists: track.featured_artists || [],
              producers: track.producers || [],
              lyrics: track.lyrics || '',
              price: track.price || 0.99,
              preview_start: track.preview_start || '00:30',
              release_date: track.release_date
                ? new Date(track.release_date)
                : new Date(),
              genre_id: track.genre_id || '',
            })
          );

          setReleaseSongs(formattedSongs);
        }

        toast({
          title: 'Unpaid Release Found',
          description:
            "We've loaded your unpaid release. Complete the payment to list it on our platform.",
        });
      }
    } catch (error) {
      console.error('Error checking for unpaid releases:', error);
    }
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'cover' | 'release'
  ) => {
    const files = e.target.files;
    if (!files) return;

    if (type === 'cover' && files[0]) {
      setCoverImage(files[0]);
      const preview = URL.createObjectURL(files[0]);
      setCoverImagePreview(preview);
    } else if (type === 'release') {
      const newFile = files[0];
      if (newReleaseSongs.length < 20 && newFile) {
        const newSong: Song = {
          id: short.generate(),
          file: newFile,
          title: newFile.name.split('.')[0],
          cover_image_url: '',
          url: URL.createObjectURL(newFile),
          featured_artists: [],
          producers: [],
          lyrics: '',
          price: 0.99,
          preview_start: '00:30',
          release_date: new Date(),
          genre_id: '',
        };
        setReleaseSongs([...newReleaseSongs, newSong]);
      }
    }
  };

  const removeFile = (index: number) => {
    setReleaseSongs(newReleaseSongs.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File, bucket: string, id: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          upsert: true,
          onUploadProgress: (progress) => {
            if (progress.totalBytes > 0) {
              const percent =
                (progress.bytesUploaded / progress.totalBytes) * 100;
              if (bucket === 'release-songs') {
                setSongUploadProgress((prev) => ({ ...prev, [id]: percent }));
              } else {
                setUploadProgress((prev) => ({ ...prev, [id]: percent }));
              }
            }
          },
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error(`Error uploading file to ${bucket}:`, error);
      toast({
        title: 'Error',
        description: `Failed to upload file to ${bucket}. Please try again.`,
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleCreateNewRecordLabel = async (name: string) => {
    const { data, error } = await supabase
      .from('record_labels')
      .insert({ name })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create new record label. Please try again.',
        variant: 'destructive',
      });
      return null;
    }

    setRecordLabels((prev) => [...prev, data]);
    return data.id;
  };

  const handleCreateNewDistributor = async (name: string) => {
    const { data, error } = await supabase
      .from('distributors')
      .insert({ name })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create new distributor. Please try again.',
        variant: 'destructive',
      });
      return null;
    }

    setDistributors((prev) => [...prev, data]);
    return data.id;
  };

  const handleCreateNewGenre = async (name: string) => {
    const { data, error } = await supabase
      .from('genres')
      .insert({ name })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create new genre. Please try again.',
        variant: 'destructive',
      });
      return null;
    }

    setGenres((prev) => [...prev, data]);
    return data.id;
  };

  // Update the handleCreateRelease function to handle updating an existing release
  const handleCreateRelease = async (e: React.FormEvent) => {
    console.log('creating new release', newRelease);
    e.preventDefault();

    // If release is already created, just show payment dialog
    if (releaseCreated && createdReleaseId) {
      // Update the release with any changes before showing payment dialog
      if (isUpdating) {
        await updateExistingRelease();
      }
      setPaymentDialogOpen(true);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    if (
      !newRelease.title ||
      !newRelease.genre_id ||
      newReleaseSongs.length === 0
    ) {
      toast({
        title: 'Missing information',
        description:
          'Please fill in all required fields and add at least one song.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setCreationStatus('Uploading cover image...');

    try {
      let updatedCoverImageUrl = newRelease.cover_image_url;
      if (coverImage) {
        const coverImageUrl = await uploadFile(
          coverImage,
          'releases',
          'cover_image'
        );
        if (coverImageUrl) {
          updatedCoverImageUrl = coverImageUrl;
        }
      }

      // Process songs that have files (new uploads)
      const uploadedSongs = await Promise.all(
        newReleaseSongs.map(async (song, index) => {
          // If the song has a file property, it needs to be uploaded
          if (song.file) {
            setCreationStatus(`Uploading song ${index + 1}...`);
            setCurrentUploadingFile(song.title);
            const url = await uploadFile(song.file, 'release-songs', song.id);
            if (!url) return null;

            return {
              id: song.id,
              title: song.title,
              featured_artists: song.featured_artists,
              producers: song.producers,
              lyrics: song.lyrics,
              price: song.price,
              preview_start: song.preview_start,
              release_date: newRelease.release_date,
              url,
              genre_id: song.genre_id,
            };
          } else {
            // If no file, just return the song data as is
            return {
              id: song.id,
              title: song.title,
              featured_artists: song.featured_artists,
              producers: song.producers,
              lyrics: song.lyrics,
              price: song.price,
              preview_start: song.preview_start,
              release_date: newRelease.release_date,
              url: song.url,
              genre_id: song.genre_id,
            };
          }
        })
      );

      const tracks = uploadedSongs.filter(
        (song): song is Song => song !== null
      );
      setCreationStatus('Saving to database...');
      console.log({
        ...newRelease,
        record_owner: user.id,
        cover_image_url: updatedCoverImageUrl,
        tracks,
        price: tracks.reduce((total, track) => total + (track.price || 0), 0),
        is_paid: false, // Initially set to false until payment is made
      });
      // Create release with is_paid set to false initially
      const { data, error } = await supabase
        .from('releases')
        .insert([
          {
            ...newRelease,
            record_owner: user.id,
            cover_image_url: updatedCoverImageUrl,
            tracks,
            price: tracks.reduce(
              (total, track) => total + (track.price || 0),
              0
            ),
            is_paid: false, // Initially set to false until payment is made
          },
        ])
        .select();

      if (error) throw error;

      // Store the created release ID for payment
      setCreatedReleaseId(data[0].id);
      setReleaseCreated(true); // Mark release as created

      // Show payment dialog
      setPaymentDialogOpen(true);

      toast({
        title: 'Release created',
        description:
          'Your release has been created. Please complete the payment to list it on our platform.',
      });
    } catch (error: any) {
      console.error('Error creating release:', error);
      toast({
        title: 'Error',
        description:
          error.message || 'Failed to create release. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setCreationStatus(null);
    }
  };

  // Add a new function to update an existing release
  const updateExistingRelease = async () => {
    if (!createdReleaseId) return;

    setLoading(true);
    setCreationStatus('Updating release...');

    try {
      let updatedCoverImageUrl = newRelease.cover_image_url;
      if (coverImage) {
        const coverImageUrl = await uploadFile(
          coverImage,
          'releases',
          'cover_image'
        );
        if (coverImageUrl) {
          updatedCoverImageUrl = coverImageUrl;
        }
      }

      // Process songs that have files (new uploads)
      const uploadedSongs = await Promise.all(
        newReleaseSongs.map(async (song, index) => {
          // If the song has a file property, it needs to be uploaded
          if (song.file) {
            setCreationStatus(`Uploading song ${index + 1}...`);
            setCurrentUploadingFile(song.title);
            const url = await uploadFile(song.file, 'release-songs', song.id);
            if (!url) return null;

            return {
              id: song.id,
              title: song.title,
              featured_artists: song.featured_artists,
              producers: song.producers,
              lyrics: song.lyrics,
              price: song.price,
              preview_start: song.preview_start,
              release_date: newRelease.release_date,
              url,
              genre_id: song.genre_id,
            };
          } else {
            // If no file, just return the song data as is
            return {
              id: song.id,
              title: song.title,
              featured_artists: song.featured_artists,
              producers: song.producers,
              lyrics: song.lyrics,
              price: song.price,
              preview_start: song.preview_start,
              release_date: newRelease.release_date,
              url: song.url,
              genre_id: song.genre_id,
            };
          }
        })
      );

      const tracks = uploadedSongs.filter(
        (song): song is Song => song !== null
      );

      // Update the existing release
      const { error } = await supabase
        .from('releases')
        .update({
          title: newRelease.title,
          description: newRelease.description,
          record_label_id: newRelease.record_label_id,
          distributor_id: newRelease.distributor_id,
          genre_id: newRelease.genre_id,
          cover_image_url: updatedCoverImageUrl,
          tracks,
          release_date: newRelease.release_date,
          price: tracks.reduce((total, track) => total + (track.price || 0), 0),
        })
        .eq('id', createdReleaseId);

      if (error) throw error;

      toast({
        title: 'Release updated',
        description:
          'Your release has been updated. Please complete the payment to list it on our platform.',
      });
    } catch (error: any) {
      console.error('Error updating release:', error);
      toast({
        title: 'Error',
        description:
          error.message || 'Failed to update release. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setCreationStatus(null);
    }
  };

  const handlePaymentComplete = () => {
    toast({
      title: 'Success',
      description: 'Your release has been successfully listed on our platform!',
    });

    // Redirect to releases page
    router.push('/dashboard/releases');
  };

  // Add this function to handle payment dialog state changes
  const handlePaymentDialogChange = (open: boolean) => {
    setPaymentDialogOpen(open);

    // If dialog is closed, reset any loading states
    if (!open) {
      setCreationStatus(null);
      setLoading(false);
    }
  };

  // Show loading state while fetching initial data
  if (initialLoading) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh] p-4'>
        <Loader2 className='h-12 w-12 animate-spin text-primary mb-4' />
        <h2 className='text-xl font-semibold mb-2'>Loading...</h2>
        <p className='text-muted-foreground'>
          Please wait while we prepare your form
        </p>
      </div>
    );
  }

  // Update the button text based on whether the release has been created
  return (
    <div className='p-4 my-4 text-white'>
      <h1 className='text-2xl font-bold mb-4'>
        {isUpdating ? 'Continue Your Release' : 'Create New Release'}
      </h1>

      <div className='bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-4 mb-6'>
        <div className='flex items-start'>
          <AlertCircle className='h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 mr-3' />
          <div>
            <h3 className='font-medium text-amber-800 dark:text-amber-400'>
              Release Listing Fee
            </h3>
            <p className='text-sm text-amber-700 dark:text-amber-300 mt-1'>
              There is a R20.00 fee to list your release on our platform. You'll
              be prompted to pay after creating your release.
            </p>
          </div>
        </div>
      </div>

      <div className='flex justify-end mb-4'>
        <Button
          variant='outline'
          onClick={checkUnpaidRelease}
          className='flex items-center gap-2'
        >
          <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Check for Unpaid Releases
        </Button>
      </div>

      <form onSubmit={handleCreateRelease} className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle>Release Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <Label htmlFor='title'>Title</Label>
              <Input
                id='title'
                placeholder='Release Title'
                value={newRelease.title}
                onChange={(e) =>
                  setNewRelease({ ...newRelease, title: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                placeholder='Description'
                value={newRelease.description}
                onChange={(e) =>
                  setNewRelease({ ...newRelease, description: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor='genre'>Genre</Label>
              <SearchableSelect
                id='genre'
                name='genre'
                displayName='Genre'
                value={newRelease.genre_id}
                onChange={(value) => {
                  setNewRelease((prev) => ({
                    ...prev,
                    genre_id: value,
                  }));
                }}
                onCreateNew={handleCreateNewGenre}
                options={genres}
                placeholder='Select or create a genre'
              />
            </div>

            <div>
              <Label>Release Date</Label>
              <Calendar
                mode='single'
                selected={newRelease.release_date}
                onSelect={(date) =>
                  date && setNewRelease({ ...newRelease, release_date: date })
                }
                className='rounded-md border mt-2'
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cover Image</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <Label>Cover Art</Label>
              <p className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                Upload a high quality cover image for the release. Cover art
                must have a minimum resolution of 500 x 500
              </p>
              <div className='flex items-center gap-4'>
                <Input
                  type='file'
                  accept='image/*'
                  onChange={(e) => handleFileSelect(e, 'cover')}
                />
                {coverImagePreview && (
                  <div className='relative w-20 h-20'>
                    <img
                      src={coverImagePreview || '/placeholder.svg'}
                      alt='Cover preview'
                      className='w-full h-full object-cover rounded-lg'
                    />
                  </div>
                )}
              </div>
              {uploadProgress['cover'] > 0 && (
                <ProgressBar progress={uploadProgress['cover']} />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='record_label_id'>Record Label</Label>
                <SearchableSelect
                  id='record_label_id'
                  name='record_label_id'
                  displayName='Record Label'
                  value={newRelease.record_label_id}
                  onChange={(value) =>
                    setNewRelease((prev) => ({
                      ...prev,
                      record_label_id: value,
                    }))
                  }
                  onCreateNew={handleCreateNewRecordLabel}
                  options={recordLabels}
                  placeholder='Select or create a record label'
                />
              </div>
              <div>
                <Label htmlFor='distributor_id'>Distributor</Label>
                <SearchableSelect
                  id='distributor_id'
                  name='distributor_id'
                  displayName='Distributor'
                  value={newRelease.distributor_id}
                  onChange={(value) =>
                    setNewRelease((prev) => ({
                      ...prev,
                      distributor_id: value,
                    }))
                  }
                  onCreateNew={handleCreateNewDistributor}
                  options={distributors}
                  placeholder='Select or create a distributor'
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tracks</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='bg-gray-50 dark:bg-gray-900 rounded-lg p-6 space-y-4'>
              <h2 className='text-xl font-semibold mb-4'>Upload Tracks</h2>

              <div className='flex flex-col space-y-2'>
                <Label>Upload Track</Label>
                <p className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                  Upload high quality MP3 files for your release
                </p>
                <div className='flex items-center gap-4'>
                  <Input
                    type='file'
                    accept='audio/*'
                    onChange={(e) => handleFileSelect(e, 'release')}
                    className='flex-1'
                  />
                  <Button
                    type='button'
                    onClick={(e) => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'audio/*';
                      input.multiple = true;
                      input.onchange = (e) => {
                        const files = e.target.files;
                        if (files) {
                          for (let i = 0; i < files.length; i++) {
                            if (newReleaseSongs.length < 20) {
                              const newFile = files[i];
                              const newSong = {
                                id: short.generate(),
                                file: newFile,
                                title: newFile.name.split('.')[0],
                                cover_image_url: '',
                                url: URL.createObjectURL(newFile),
                                featured_artists: [],
                                producers: [],
                                lyrics: '',
                                price: 0.99,
                                preview_start: '00:30',
                                release_date: new Date(),
                                genre_id: '',
                              };
                              setReleaseSongs((prev) => [...prev, newSong]);
                            }
                          }
                        }
                      };
                      input.click();
                    }}
                  >
                    Upload Multiple
                  </Button>
                </div>
              </div>
              <div className='space-y-4'>
                {newReleaseSongs.map((song, index) => (
                  <div
                    key={`new-${song.id}`}
                    className='flex flex-col bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6 border border-gray-200 dark:border-gray-700'
                  >
                    <div className='flex flex-col sm:flex-row items-center justify-between mb-4 space-y-2 sm:space-y-0'>
                      <div className='flex items-center gap-2'>
                        <span className='bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium'>
                          {index + 1}
                        </span>
                        <SongPreview
                          url={song.url}
                          title={song.title}
                          artist={newRelease.title}
                          coverArt={
                            newRelease.cover_image_url ||
                            coverImagePreview ||
                            '/placeholder.svg'
                          }
                        />
                      </div>
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={(e) => {
                          e.preventDefault();
                          removeFile(index);
                        }}
                      >
                        <X className='h-4 w-4 mr-2' /> Remove
                      </Button>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <label className='text-sm font-medium mb-2 block'>
                          Title
                        </label>
                        <Input
                          value={song.title}
                          onChange={(e) => {
                            const updatedSongs = [...newReleaseSongs];
                            updatedSongs[index].title = e.target.value;
                            setReleaseSongs(updatedSongs);
                          }}
                          placeholder='Song title'
                          className='mb-4'
                        />
                      </div>

                      <div>
                        <label className='text-sm font-medium mb-2 block'>
                          Genre
                        </label>
                        <SearchableSelect
                          id={`genre-${song.id}`}
                          name={`genre-${song.id}`}
                          displayName='Genre'
                          value={song.genre_id}
                          onChange={(value) => {
                            const updatedSongs = [...newReleaseSongs];
                            updatedSongs[index].genre_id = value;
                            setReleaseSongs(updatedSongs);
                          }}
                          onCreateNew={handleCreateNewGenre}
                          options={genres}
                          placeholder='Select or create a genre'
                        />
                      </div>
                    </div>

                    <div className='mt-4'>
                      <label className='text-sm font-medium mb-2 block'>
                        Price
                      </label>
                      <Input
                        placeholder='Price'
                        value={song.price}
                        type='number'
                        onChange={(e) => {
                          const updatedSongs = [...newReleaseSongs];
                          updatedSongs[index].price = Number.parseFloat(
                            e.target.value
                          );
                          setReleaseSongs(updatedSongs);
                        }}
                        required
                        className='mb-4'
                      />
                    </div>

                    <ArtistMultiSelect
                      song={song}
                      title='Featured Artists'
                      id='featured_artists'
                      updateSong={(updatedSong) => {
                        const updatedSongs = [...newReleaseSongs];
                        updatedSongs[index] = updatedSong;
                        setReleaseSongs(updatedSongs);
                      }}
                    />

                    <ArtistMultiSelect
                      song={song}
                      title='Producers'
                      id='producers'
                      updateSong={(updatedSong) => {
                        const updatedSongs = [...newReleaseSongs];
                        updatedSongs[index] = updatedSong;
                        setReleaseSongs(updatedSongs);
                      }}
                    />

                    <div className='mt-4'>
                      <label className='text-sm font-medium mb-2 block'>
                        Lyrics
                      </label>
                      <Textarea
                        placeholder='Lyrics'
                        value={song.lyrics}
                        onChange={(e) => {
                          const updatedSongs = [...newReleaseSongs];
                          updatedSongs[index].lyrics = e.target.value;
                          setReleaseSongs(updatedSongs);
                        }}
                        required
                        className='mb-4'
                      />
                    </div>

                    <div>
                      <label className='text-sm font-medium mb-2 block'>
                        Preview Start Time
                      </label>
                      <p className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                        Enter the time in the song where the preview should
                        start in the format mm:ss
                      </p>
                      <Input
                        placeholder='Preview Start Time'
                        value={song.preview_start}
                        onChange={(e) => {
                          const updatedSongs = [...newReleaseSongs];
                          updatedSongs[index].preview_start = e.target.value;
                          setReleaseSongs(updatedSongs);
                        }}
                        required
                      />
                    </div>

                    {songUploadProgress[song.id] !== undefined && (
                      <div className='mt-4'>
                        <ProgressBar progress={songUploadProgress[song.id]} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className='flex flex-col sm:flex-row gap-4 justify-end'>
          <Button
            type='button'
            variant='outline'
            onClick={() => router.push('/dashboard/releases')}
          >
            Cancel
          </Button>
          <Button
            type='submit'
            disabled={loading}
            className='flex items-center gap-2'
          >
            {loading ? (
              <>{creationStatus || 'Processing...'}</>
            ) : releaseCreated ? (
              <>
                <CreditCard className='h-4 w-4' />
                Pay R20.00
              </>
            ) : (
              <>
                <CreditCard className='h-4 w-4' />
                Create Release & Pay R20.00
              </>
            )}
          </Button>
        </div>
      </form>

      {createdReleaseId && (
        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={handlePaymentDialogChange}
          releaseId={createdReleaseId}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
}
