'use client';
import { useState, useEffect, useCallback } from 'react';
import React from 'react';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchableSelect } from '@/components/SearchableSelect';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import { Plus, Edit, Search, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import short from 'short-uuid';
import { format } from 'date-fns';
import { ArtistMultiSelect } from './artists';
import { SongPreview } from '@/components/SongPreview';
import ProgressBar from '@/components/ProgressBar';

interface Song {
  id: string;
  file?: File;
  title: string;
  cover_image_url: string;
  url: string;
  featured_artists: object[];
  producers: object[];
  lyrics: string;
  price: number;
  preview_start: string;
  release_date: Date;
  genre_id: string;
}

interface Release {
  id: string;
  title: string;
  description?: string;
  release_date: string;
  record_label_id?: string;
  distributor_id?: string;
  genre_id?: string;
  record_label: { name: string };
  distributor: { name: string };
  genre?: { name: string };
  cover_image_url?: string;
  tracks: Song[];
}

export default function ReleasesManagement() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
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
    id: '',
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
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [newReleaseSongs, setReleaseSongs] = useState<Song[]>([]);
  const [currentUploadingFile, setCurrentUploadingFile] = useState<
    string | null
  >(null);
  const [expandedReleases, setExpandedReleases] = useState<{
    [key: string]: boolean;
  }>({});
  const [creationStatus, setCreationStatus] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const router = useRouter();

  const fetchReleases = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    let query = supabase
      .from('releases')
      .select(
        `
        *,
        record_label:record_labels (name),
        distributor:distributors (name),
        genre:genres (name)

      `
      )
      .eq('record_owner', user.id) // Filter by the current user's ID
      .order('release_date', { ascending: false });

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching releases:', error);
    } else {
      setReleases(data || []);
    }
    setLoading(false);
  }, [router, search]);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  useEffect(() => {
    const loadOptions = async () => {
      const { data: labelsData } = await supabase
        .from('record_labels')
        .select('id, name');
      const { data: distributorsData } = await supabase
        .from('distributors')
        .select('id, name');
      const { data: genresData } = await supabase
        .from('genres')
        .select('id, name');
      if (labelsData) setRecordLabels(labelsData);
      if (distributorsData) setDistributors(distributorsData);
      if (genresData) setGenres(genresData);
    };
    loadOptions();
  }, []);

  const resetForm = () => {
    setNewRelease({
      id: '',
      title: '',
      description: '',
      record_label_id: '',
      distributor_id: '',
      genre_id: '',
      cover_image_url: '',
      tracks: [],
      release_date: new Date(),
    });
    setReleaseSongs([]);
    setCoverImage(null);
    setCoverImagePreview(null);
    setIsEditMode(false);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleCreateRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    setCreationStatus(
      isEditMode ? 'Updating release...' : 'Uploading cover image...'
    );
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

    const tracks = uploadedSongs.filter((song): song is Song => song !== null);

    setCreationStatus(
      isEditMode ? 'Saving changes...' : 'Saving to database...'
    );

    try {
      if (isEditMode) {
        // Update existing release
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
            price: calculateReleasePrice(tracks),
          })
          .eq('id', newRelease.id);

        if (error) throw error;

        // Update the releases state with the edited release
        setReleases(
          releases.map((release) =>
            release.id === newRelease.id
              ? {
                  ...release,
                  title: newRelease.title,
                  description: newRelease.description,
                  record_label_id: newRelease.record_label_id,
                  distributor_id: newRelease.distributor_id,
                  genre_id: newRelease.genre_id,
                  cover_image_url: updatedCoverImageUrl,
                  tracks,
                  release_date: newRelease.release_date.toISOString(),
                  price: calculateReleasePrice(tracks),
                }
              : release
          )
        );

        toast({
          title: 'Success',
          description: 'Release updated successfully!',
        });
      } else {
        // Create new release
        const { data, error } = await supabase
          .from('releases')
          .insert([
            {
              ...newRelease,
              record_owner: user.id,
              cover_image_url: updatedCoverImageUrl,
              tracks,
              price: calculateReleasePrice(tracks),
            },
          ])
          .select();

        if (error) throw error;

        setReleases([...releases, data[0]]);

        toast({
          title: 'Success',
          description: 'Release created successfully!',
        });
      }

      handleDialogClose();
    } catch (error) {
      console.error(
        isEditMode ? 'Error updating release:' : 'Error creating release:',
        error
      );
      toast({
        title: 'Error',
        description: isEditMode
          ? 'Failed to update release. Please try again.'
          : 'Failed to create release. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCreationStatus(null);
    }
  };

  const handleEditRelease = (release: Release) => {
    setIsEditMode(true);

    // Convert release date string to Date object
    const releaseDate = new Date(release.release_date);

    // Set the form data with the existing release details
    setNewRelease({
      id: release.id,
      title: release.title,
      description: release.description || '',
      record_label_id: release.record_label_id || '',
      distributor_id: release.distributor_id || '',
      genre_id: release.genre_id || '',
      cover_image_url: release.cover_image_url || '',
      tracks: release.tracks || [],
      release_date: releaseDate,
    });

    // Set the songs for editing
    setReleaseSongs(release.tracks || []);

    // Open the dialog
    setIsDialogOpen(true);
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
      if (newReleaseSongs.length < 3 && newFile) {
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

  const removeExistingTrack = (index: number) => {
    setNewRelease((prev) => ({
      ...prev,
      tracks: prev.tracks.filter((_, i) => i !== index),
    }));
  };

  const removeFile = (index: number) => {
    setReleaseSongs(newReleaseSongs.filter((_, i) => i !== index));
  };

  const toggleExpandRelease = (releaseId: string) => {
    setExpandedReleases((prev) => ({
      ...prev,
      [releaseId]: !prev[releaseId],
    }));
  };

  const calculateReleasePrice = (tracks: Song[]) => {
    return tracks.reduce((total, track) => total + (track.price || 0), 0);
  };

  if (loading) {
    return <div className='p-4'>Loading releases...</div>;
  }

  return (
    <div className='p-4 my-4'>
      <h1 className='text-2xl font-bold mb-4'>Releases</h1>

      <div className='flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0'>
        <div className='relative w-full sm:w-64'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
          <Input
            placeholder='Search releases...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-10 w-full'
          />
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            if (!open) handleDialogClose();
            else setIsDialogOpen(true);
          }}
        >
          <DialogTrigger asChild>
            <Button className='w-full sm:w-auto'>
              <Plus className='mr-2 h-4 w-4' /> Create New Release
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-3xl w-full max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? 'Edit Release' : 'Create New Release'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateRelease} className='space-y-4'>
              <Input
                placeholder='Title'
                value={newRelease.title}
                onChange={(e) =>
                  setNewRelease({ ...newRelease, title: e.target.value })
                }
                required
              />
              <Textarea
                placeholder='Description'
                value={newRelease.description}
                onChange={(e) =>
                  setNewRelease({ ...newRelease, description: e.target.value })
                }
                required
              />
              <div className='bg-zinc-900 rounded-lg p-6 space-y-4'>
                <h2 className='text-xl font-semibold text-white mb-4'>
                  Cover Image
                </h2>

                <div className='space-y-4'>
                  <Label>Cover Art</Label>
                  <p className='text-xs text-gray-400'>
                    Upload a high quality cover image for the release. Cover art
                    must have a minimum resolution of 500 x 500
                  </p>
                  <div className='flex items-center gap-4'>
                    <Input
                      type='file'
                      accept='image/*'
                      onChange={(e) => handleFileSelect(e, 'cover')}
                    />
                    {coverImagePreview ? (
                      <div className='relative w-20 h-20'>
                        <img
                          src={coverImagePreview || '/placeholder.svg'}
                          alt='Cover preview'
                          className='w-full h-full object-cover rounded-lg'
                        />
                      </div>
                    ) : (
                      newRelease.cover_image_url && (
                        <div className='relative w-20 h-20'>
                          <img
                            src={
                              newRelease.cover_image_url || '/placeholder.svg'
                            }
                            alt='Existing cover'
                            className='w-full h-full object-cover rounded-lg'
                          />
                        </div>
                      )
                    )}
                  </div>
                  {uploadProgress['cover'] > 0 && (
                    <ProgressBar progress={uploadProgress['cover']} />
                  )}
                </div>
              </div>
              <div className='my-4 '>
                <p className='text-sm font-medium my-4'>Release Date</p>
                <Calendar
                  mode='single'
                  selected={newRelease.release_date}
                  onSelect={(date) =>
                    date && setNewRelease({ ...newRelease, release_date: date })
                  }
                  className='rounded-md border'
                />
              </div>

              <SearchableSelect
                id={`genre-${newRelease.id}`}
                name={`genre-${newRelease.id}`}
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
                  <div className='bg-zinc-900 rounded-lg p-6 space-y-4'>
                    <h2 className='text-xl font-semibold text-white mb-4'>
                      Upload Tracks
                    </h2>

                    <div className='space-y-4'>
                      <Label>Upload high quality release mp3s</Label>
                      <Input
                        type='file'
                        accept='audio/*'
                        onChange={(e) => handleFileSelect(e, 'release')}
                      />
                      <div className='space-y-4'>
                        {newReleaseSongs.map((song, index) => (
                          <div
                            key={`new-${song.id}`}
                            className='flex flex-col bg-zinc-800 p-4 rounded-lg'
                          >
                            <div className='flex flex-col sm:flex-row items-center justify-between mb-2 space-y-2 sm:space-y-0'>
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
                              <Button
                                variant='destructive'
                                size='sm'
                                onClick={(e) => {
                                  e.preventDefault();
                                  removeFile(index);
                                }}
                              >
                                <X className='h-4 w-4' />
                              </Button>
                            </div>
                            <label className='text-sm font-medium my-2 mt-4'>
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
                              className='mb-2'
                            />
                            <label className='text-sm font-medium my-2 mt-4'>
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
                            <label className='text-sm font-medium my-2 mt-4'>
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
                            />
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
                            <label className='text-sm font-medium my-2 mt-4'>
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
                            />
                            <label className='text-sm font-medium my-2'>
                              Preview Start Time
                            </label>
                            <p className='text-xs text-gray-400 my-2'>
                              Enter the time in the song where the preview
                              should start in the format mm:ss
                            </p>
                            <Input
                              placeholder='Preview Start Time'
                              value={song.preview_start}
                              onChange={(e) => {
                                const updatedSongs = [...newReleaseSongs];
                                updatedSongs[index].preview_start =
                                  e.target.value;
                                setReleaseSongs(updatedSongs);
                              }}
                              required
                            />
                            {songUploadProgress[song.id] !== undefined && (
                              <ProgressBar
                                progress={songUploadProgress[song.id]}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className='flex gap-2'>
                <Button
                  type='submit'
                  disabled={!!creationStatus}
                  className='w-full sm:w-auto'
                >
                  {creationStatus ||
                    (isEditMode ? 'Save Changes' : 'Create Release')}
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleDialogClose}
                  className='w-full sm:w-auto'
                >
                  Cancel
                </Button>
              </div>
              {creationStatus && (
                <div className='mt-4 text-sm text-gray-500'>
                  {creationStatus}
                </div>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Release Name</TableHead>
              <TableHead>Release Date</TableHead>
              <TableHead>Record Label</TableHead>
              <TableHead>Distributor</TableHead>
              <TableHead>Genre</TableHead>
              <TableHead>Number of Tracks</TableHead>
              <TableHead>Release Price</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {releases.map((release) => (
              <React.Fragment key={release.id}>
                <TableRow>
                  <TableCell>
                    <Button
                      variant='ghost'
                      onClick={() => toggleExpandRelease(release.id)}
                      className='w-full text-left'
                    >
                      {expandedReleases[release.id] ? (
                        <ChevronDown className='mr-2 h-4 w-4' />
                      ) : (
                        <ChevronRight className='mr-2 h-4 w-4' />
                      )}
                      {release.title}
                    </Button>
                  </TableCell>
                  <TableCell>
                    {format(new Date(release.release_date), 'PP')}
                  </TableCell>
                  <TableCell>{release.record_label?.name || 'N/A'}</TableCell>
                  <TableCell>{release.distributor?.name || 'N/A'}</TableCell>
                  <TableCell>{release.genre?.name || 'N/A'}</TableCell>
                  <TableCell>{release.tracks?.length || 0}</TableCell>
                  <TableCell>
                    R{calculateReleasePrice(release.tracks).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleEditRelease(release)}
                    >
                      <Edit className='h-4 w-4 mr-2' /> Edit
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedReleases[release.id] && (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <div className='overflow-x-auto'>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Track Title</TableHead>
                              <TableHead>Featured Artists</TableHead>
                              <TableHead>Producers</TableHead>
                              <TableHead>Price</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {release.tracks.map((track) => (
                              <TableRow key={track.id}>
                                <TableCell>{track.title}</TableCell>
                                <TableCell>
                                  {track.featured_artists
                                    .map((artist: any) => artist.artist_name)
                                    .join(', ')}
                                </TableCell>
                                <TableCell>
                                  {track.producers
                                    .map(
                                      (producer: any) => producer.artist_name
                                    )
                                    .join(', ')}
                                </TableCell>
                                <TableCell>R{track.price.toFixed(2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
