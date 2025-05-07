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
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AlertCircle, Loader2, Search, X, User } from 'lucide-react';
import ShortUniqueId from 'short-unique-id';

const uid = new ShortUniqueId({ length: 10 });

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

interface Profile {
  id: string;
  username: string;
  email: string;
  artist_name?: string;
  government_name?: string;
  profile_image_url?: string;
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
    short_unique_id: uid.rnd(),
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
  const [releaseCreated, setReleaseCreated] = useState(false); // Track if release has been created
  const [isUpdating, setIsUpdating] = useState(false); // Track if we're updating an existing release
  const [createdReleaseId, setCreatedReleaseId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [recordOwner, setRecordOwner] = useState<Profile | null>(null);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);

  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const loadCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select(
            'id, username, email, artist_name, government_name, profile_image_url'
          )
          .eq('id', user.id)
          .single();

        if (profileData) {
          setRecordOwner(profileData);
        }
      }
    };

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

        // Load current user profile
        await loadCurrentUser();

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

  // Replace with improved search function
  const searchProfiles = async (query: string) => {
    if (!query || query.length < 2) {
      setProfiles([]);
      return;
    }

    setProfilesLoading(true);
    try {
      // Improved query with better pattern matching
      const searchPattern = `%${query}%`;

      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, username, email, artist_name, government_name, profile_image_url'
        )
        .or(
          `username.ilike.${searchPattern},email.ilike.${searchPattern},artist_name.ilike.${searchPattern},government_name.ilike.${searchPattern}`
        )
        .limit(10);

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      console.log('Search results:', data);
      setProfiles(data || []);
    } catch (error) {
      console.error('Error searching profiles:', error);
      toast({
        title: 'Error',
        description: 'Failed to search profiles. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setProfilesLoading(false);
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
          price: 10,
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

    if (!recordOwner) {
      toast({
        title: 'Missing information',
        description: 'Please select a record owner.',
        variant: 'destructive',
      });
      return;
    }

    // Add validation for required song fields
    const validateSongs = () => {
      for (let i = 0; i < newReleaseSongs.length; i++) {
        if (!newReleaseSongs[i].genre_id || !newReleaseSongs[i].title) {
          toast({
            title: 'Missing song information',
            description: `Please fill in all required fields for song #${
              i + 1
            }.`,
            variant: 'destructive',
          });
          return false;
        }
      }
      return true;
    };

    if (
      !newRelease.title ||
      !newRelease.genre_id ||
      !newRelease.record_label_id ||
      !newRelease.distributor_id ||
      newReleaseSongs.length === 0 ||
      !validateSongs()
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
        record_owner: recordOwner.id,
        cover_image_url: updatedCoverImageUrl,
        tracks,
        price: tracks.reduce((total, track) => total + (track.price || 0), 0),
        is_paid: true, // No payment required, set to true by default
      });
      // Create release with is_paid set to false initially
      const { data, error } = await supabase
        .from('releases')
        .insert([
          {
            ...newRelease,
            record_owner: recordOwner.id,
            cover_image_url: updatedCoverImageUrl,
            tracks,
            price: tracks.reduce(
              (total, track) => total + (track.price || 0),
              0
            ),
            is_paid: true, // No payment required, set to true by default
          },
        ])
        .select();

      if (error) throw error;

      toast({
        title: 'Success!',
        description:
          'Your release has been created and is now live on our platform!',
      });

      // Redirect to releases page
      router.push('/dashboard/releases');
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
          is_paid: true, // No payment required, set to true by default
        })
        .eq('id', createdReleaseId);

      if (error) throw error;

      toast({
        title: 'Success!',
        description:
          'Your release has been updated and is now live on our platform!',
      });

      // Redirect to releases page
      router.push('/dashboard/releases');
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
      <p className='text-gray-500 dark:text-gray-400 mb-6'>
        Share your music with the world! Creating a release is now completely
        free.
      </p>
      <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4 mb-6'>
        <div className='flex items-start'>
          <AlertCircle className='h-5 w-5 text-blue-600 dark:text-blue-500 mt-0.5 mr-3' />
          <div>
            <h3 className='font-medium text-blue-800 dark:text-blue-400'>
              How to Create a Release
            </h3>
            <ol className='text-sm text-blue-700 dark:text-blue-300 mt-1 list-decimal pl-5 space-y-1'>
              <li>Fill in your release details (title, description, etc.)</li>
              <li>Upload a cover image for your release</li>
              <li>Add your songs (MP3 files)</li>
              <li>Fill in details for each song</li>
              <li>Click "Create Release" when you're done</li>
            </ol>
          </div>
        </div>
      </div>

      <p className='text-sm text-gray-500 dark:text-gray-400 mb-6'>
        Fields marked with <span className='text-red-500'>*</span> are required.
      </p>

      <form onSubmit={handleCreateRelease} className='space-y-6'>
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle>Record Owner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <div className='flex justify-between items-center'>
                <Label htmlFor='record-owner'>Record Owner</Label>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={(e) => {
                    e.preventDefault();
                    // Load first 10 profiles to verify data access
                    setProfilesLoading(true);
                    supabase
                      .from('profiles')
                      .select(
                        'id, username, email, artist_name, government_name, profile_image_url'
                      )
                      .limit(10)
                      .then(({ data, error }) => {
                        if (error) {
                          console.error('Error loading profiles:', error);
                          toast({
                            title: 'Error',
                            description:
                              'Failed to load profiles. Please check console for details.',
                            variant: 'destructive',
                          });
                        } else {
                          console.log('Available profiles:', data);
                          setProfiles(data || []);
                          if (data && data.length > 0) {
                            toast({
                              title: 'Profiles loaded',
                              description: `Found ${data.length} profiles. Check console for details.`,
                            });
                          } else {
                            toast({
                              title: 'No profiles found',
                              description:
                                'No profiles available in the database.',
                            });
                          }
                        }
                        setProfilesLoading(false);
                      });
                  }}
                >
                  Load Users
                </Button>
              </div>
              <p className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                Select who will own this release. Defaults to your account.
              </p>

              {/* Simplified user selection with direct rendering */}
              <div className='relative'>
                <div className='flex items-center'>
                  <Input
                    placeholder='Search users by name or email...'
                    value={searchQuery}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchQuery(value);
                      if (value.length >= 2) {
                        searchProfiles(value);
                      }
                    }}
                    className='w-full'
                  />
                  <Button
                    variant='ghost'
                    size='icon'
                    className='absolute right-0'
                    onClick={() => searchProfiles(searchQuery)}
                  >
                    <Search className='h-4 w-4' />
                  </Button>
                </div>

                {/* Selected user display */}
                {recordOwner && (
                  <div className='mt-2 p-2 border rounded-md flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      {recordOwner.profile_image_url ? (
                        <img
                          src={
                            recordOwner.profile_image_url || '/placeholder.svg'
                          }
                          alt={recordOwner.username || recordOwner.email}
                          className='w-8 h-8 rounded-full object-cover'
                        />
                      ) : (
                        <User className='h-6 w-6 text-muted-foreground' />
                      )}
                      <div>
                        <div className='font-medium'>
                          {recordOwner.artist_name ||
                            recordOwner.government_name ||
                            recordOwner.username ||
                            recordOwner.email}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          {recordOwner.email}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setRecordOwner(null)}
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                )}

                {/* Search results */}
                {searchQuery.length >= 2 &&
                  profiles.length > 0 &&
                  !recordOwner && (
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
                                setRecordOwner(profile);
                                setSearchQuery('');
                              }}
                            >
                              {profile.profile_image_url ? (
                                <img
                                  src={
                                    profile.profile_image_url ||
                                    '/placeholder.svg'
                                  }
                                  alt={profile.username || profile.email}
                                  className='w-8 h-8 rounded-full object-cover'
                                />
                              ) : (
                                <User className='h-6 w-6 text-muted-foreground' />
                              )}
                              <div>
                                <div className='font-medium'>
                                  {profile.artist_name ||
                                    profile.government_name ||
                                    profile.username ||
                                    profile.email}
                                </div>
                                <div className='text-xs text-muted-foreground'>
                                  {profile.email}
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
                  !recordOwner && (
                    <div className='absolute z-10 w-full mt-1 bg-background border rounded-md shadow-md p-4 text-center'>
                      <p>No users found matching "{searchQuery}"</p>
                      <p className='text-xs text-muted-foreground mt-1'>
                        Try a different search term or click "Load Users" to see
                        available users
                      </p>
                    </div>
                  )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Release Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <Label htmlFor='title' className='flex items-center'>
                Release Title <span className='text-red-500 ml-1'>*</span>
              </Label>
              <p className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                Enter the name of your album or single (e.g., "Summer Vibes")
              </p>
              <Input
                id='title'
                placeholder='Enter your release title here'
                value={newRelease.title}
                onChange={(e) =>
                  setNewRelease({ ...newRelease, title: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor='description'>Description</Label>
              <p className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                Tell listeners about your release. What inspired it? What makes
                it special?
              </p>
              <Textarea
                id='description'
                placeholder='Write about your music here...'
                value={newRelease.description}
                onChange={(e) =>
                  setNewRelease({ ...newRelease, description: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor='genre' className='flex items-center'>
                Music Genre <span className='text-red-500 ml-1'>*</span>
              </Label>
              <p className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                Select the type of music (e.g., Hip Hop, Amapiano, Gospel)
              </p>
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
              <p className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                When should your music be available to listeners?
              </p>
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
                <Label htmlFor='record_label_id' className='flex items-center'>
                  Record Label <span className='text-red-500 ml-1'>*</span>
                </Label>
                <p className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                  The company that produces and markets your music
                </p>
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
                <Label htmlFor='distributor_id' className='flex items-center'>
                  Distributor <span className='text-red-500 ml-1'>*</span>
                </Label>
                <p className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                  The company that delivers your music to streaming platforms
                </p>
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
            <CardTitle>Your Songs</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='bg-gray-50 dark:bg-gray-900 rounded-lg p-6 space-y-4'>
              <h2 className='text-xl font-semibold mb-4'>Upload Your Songs</h2>
              <div className='bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4'>
                <div className='flex items-start'>
                  <AlertCircle className='h-5 w-5 text-green-600 dark:text-green-500 mt-0.5 mr-3' />
                  <div>
                    <h3 className='font-medium text-green-800 dark:text-green-400'>
                      Free Upload
                    </h3>
                    <p className='text-sm text-green-700 dark:text-green-300 mt-1'>
                      You can now upload your music for free! Each track will be
                      priced at R10 by default.
                    </p>
                  </div>
                </div>
              </div>

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
                        const files = (e.target as HTMLInputElement).files;
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
                                price: 10,
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
                        <label className='text-sm font-medium mb-2 block flex items-center'>
                          Song Title{' '}
                          <span className='text-red-500 ml-1'>*</span>
                        </label>
                        <p className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                          What is this song called?
                        </p>
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
                        <label className='text-sm font-medium mb-2 block flex items-center'>
                          Song Genre{' '}
                          <span className='text-red-500 ml-1'>*</span>
                        </label>
                        <p className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                          What type of music is this specific song?
                        </p>
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
                        Price (in Rands)
                      </label>
                      <p className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                        How much will this song cost? Default is R10.
                      </p>
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
                        Song Lyrics
                      </label>
                      <p className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                        Type or paste the words to your song here
                      </p>
                      <Textarea
                        placeholder='Lyrics'
                        value={song.lyrics}
                        onChange={(e) => {
                          const updatedSongs = [...newReleaseSongs];
                          updatedSongs[index].lyrics = e.target.value;
                          setReleaseSongs(updatedSongs);
                        }}
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
            className='flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2'
          >
            {loading ? (
              <>{creationStatus || 'Processing...'}</>
            ) : (
              <>Create Release</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
