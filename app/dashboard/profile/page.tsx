'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, Play, Pause, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchableSelect } from '@/components/SearchableSelect';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { isEmpty, isNil } from 'ramda';

const exists = (i) => !isNil(i) && !isEmpty(i);

interface Song {
  id: string;
  file: File;
  title: string;
  features: string;
  releaseDate: string;
  url: string;
}

interface DemoSong {
  id: string;
  title: string;
  features: string;
  releaseDate: string;
  url: string;
}

const PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape',
];

export default function ArtistProfilePage() {
  const [profile, setProfile] = useState({
    artist_name: '',
    government_name: '',
    artist_bio: '',
    genre: '',
    location: '',
    twitter_url: '',
    instagram_url: '',
    facebook_url: '',
    whatsapp_number: '',
    youtube_url: '',
    spotify_url: '',
    tiktok_url: '',
    profile_image_url: '',
    banner_image: '',
    tagline: '',
    email: '',
    phone_number: '',
    date_of_birth: '',
    sa_id_number: '',
    street_address: '',
    suburb: '',
    town_id: '',
    province: '',
    record_label_id: '',
    has_manager: false,
    distributor_id: '',
    samro_member: false,
    samro_id: '',
    cappasso_member: false,
    cappasso_id: '',
    risa_member: false,
    risa_id: '',
    sampra_member: false,
    sampra_id: '',
    gallery_images: [] as string[],
    demo_songs: [] as DemoSong[],
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [towns, setTowns] = useState<{ id: string; name: string }[]>([]);
  const [recordLabels, setRecordLabels] = useState<
    { id: string; name: string }[]
  >([]);
  const [distributors, setDistributors] = useState<
    { id: string; name: string }[]
  >([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [currentUploadingFile, setCurrentUploadingFile] = useState<
    string | null
  >(null);
  const [songUploadProgress, setSongUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [newDemoSongs, setNewDemoSongs] = useState<
    {
      id: string;
      title: string;
      features: string;
      releaseDate: string;
      file: File;
    }[]
  >([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile. Please try again.',
          variant: 'destructive',
        });
      } else if (data) {
        const songs = data.demo_songs
          .map((i) => (exists(i) ? JSON.parse(i) : null))
          .filter((i) => exists(i));
        setProfile({
          ...data,
          demo_songs: songs,
        });
      }
      setLoading(false);
    }

    loadProfile();
  }, [router, supabase]);

  useEffect(() => {
    async function loadOptions() {
      const { data: townsData } = await supabase
        .from('south_african_towns')
        .select('id, name');
      const { data: labelsData } = await supabase
        .from('record_labels')
        .select('id, name');
      const { data: distributorsData } = await supabase
        .from('distributors')
        .select('id, name');

      if (townsData) setTowns(townsData);
      if (labelsData) setRecordLabels(labelsData);
      if (distributorsData) setDistributors(distributorsData);
    }

    loadOptions();
  }, [supabase]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Upload profile image if changed
      let updatedProfileImageUrl = profile.profile_image_url;
      if (profileImage) {
        const profileImageUrl = await uploadFile(
          profileImage,
          'profile-images',
          'profile'
        );
        if (profileImageUrl) {
          updatedProfileImageUrl = profileImageUrl;
        }
      }

      // Upload gallery images
      const existingGalleryImages = profile.gallery_images || [];
      const newGalleryImageUrls = await Promise.all(
        galleryImages.map(async (file, index) => {
          const url = await uploadFile(
            file,
            'gallery-images',
            `gallery-${index}`
          );
          return url;
        })
      );

      const updatedGalleryImages = [
        ...existingGalleryImages,
        ...newGalleryImageUrls.filter(Boolean),
      ];

      // Upload demo songs
      const uploadedDemoSongs = await Promise.all(
        newDemoSongs.map(async (song) => {
          setCurrentUploadingFile(song.title);
          const url = await uploadFile(song.file, 'demo-songs', song.id);
          if (!url) return null;

          return {
            id: song.id,
            title: song.title,
            features: song.features,
            releaseDate: song.releaseDate,
            url,
          };
        })
      );

      const updatedDemoSongs = [
        ...profile.demo_songs,
        ...uploadedDemoSongs.filter((song): song is DemoSong => song !== null),
      ];

      const updatedProfile = {
        ...profile,
        profile_image_url: updatedProfileImageUrl,
        gallery_images: updatedGalleryImages,
        demo_songs: updatedDemoSongs,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updatedProfile)
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Your profile has been updated successfully.',
      });

      // Reset file states
      setProfileImage(null);
      setProfileImagePreview('');
      setGalleryImages([]);
      setGalleryPreviews([]);
      setNewDemoSongs([]);
      setUploadProgress({});
      setSongUploadProgress({});
      setProfile(updatedProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
      setCurrentUploadingFile(null);
    }
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
              if (bucket === 'demo-songs') {
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

  const handleCreateNewTown = async (name: string) => {
    const { data, error } = await supabase
      .from('south_african_towns')
      .insert({ name })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create new town. Please try again.',
        variant: 'destructive',
      });
      return null;
    }

    setTowns((prev) => [...prev, data]);
    return data.id;
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

  const removeExistingGalleryImage = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      gallery_images: prev.gallery_images?.filter((_, i) => i !== index),
    }));
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'profile' | 'gallery' | 'demo'
  ) => {
    const files = e.target.files;
    if (!files) return;

    if (type === 'profile' && files[0]) {
      setProfileImage(files[0]);
      const preview = URL.createObjectURL(files[0]);
      setProfileImagePreview(preview);
    } else if (type === 'gallery') {
      const newFiles = Array.from(files).slice(
        0,
        6 - galleryImages.length - (profile.gallery_images?.length || 0)
      );
      setGalleryImages([...galleryImages, ...newFiles]);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setGalleryPreviews([...galleryPreviews, ...newPreviews]);
    } else if (type === 'demo') {
      const newFile = files[0];
      if (newDemoSongs.length < 3 && newFile) {
        const newSong: Song = {
          id: Math.random().toString(36).substr(2, 9),
          file: newFile,
          title: newFile.name,
          features: '',
          releaseDate: '',
          url: URL.createObjectURL(newFile),
        };
        setNewDemoSongs([...newDemoSongs, newSong]);
      }
    }
  };

  const removeFile = (index: number, type: 'gallery' | 'demo') => {
    if (type === 'gallery') {
      setGalleryImages(galleryImages.filter((_, i) => i !== index));
      setGalleryPreviews(galleryPreviews.filter((_, i) => i !== index));
    } else if (type === 'demo') {
      setNewDemoSongs(newDemoSongs.filter((_, i) => i !== index));
    }
  };

  const removeExistingDemoSong = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      demo_songs: prev.demo_songs.filter((_, i) => i !== index),
    }));
  };

  const togglePlayPause = (songId: string) => {
    if (currentlyPlaying === songId) {
      audioRef.current?.pause();
      setCurrentlyPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const song = profile.demo_songs.find((s) => s.id === songId);
      if (song) {
        audioRef.current = new Audio(song.url);
        audioRef.current.play();
        setCurrentlyPlaying(songId);
      }
    }
  };
  console.log('profile', profile);
  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  const ProgressBar = ({ progress }: { progress: number }) => (
    <div className='w-full bg-zinc-800 rounded-full h-2 mt-2'>
      <div
        className='bg-red-600 h-2 rounded-full transition-all duration-300'
        style={{ width: `${progress}%` }}
      />
    </div>
  );

  console.log('upload progrerss', songUploadProgress);

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='space-y-8'>
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='artist_name'>Artist Name</Label>
                <Input
                  id='artist_name'
                  name='artist_name'
                  value={profile.artist_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor='government_name'>Government Name</Label>
                <Input
                  id='government_name'
                  name='government_name'
                  value={profile.government_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor='artist_bio'>Bio</Label>
              <Textarea
                id='artist_bio'
                name='artist_bio'
                value={profile.artist_bio}
                onChange={handleInputChange}
                rows={4}
              />
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='genre'>Genre</Label>
                <Input
                  id='genre'
                  name='genre'
                  value={profile.genre}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor='location'>Current Location</Label>
                <Input
                  id='location'
                  name='location'
                  value={profile.location}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div>
              <Label htmlFor='tagline'>Tagline</Label>
              <Input
                id='tagline'
                name='tagline'
                value={profile.tagline}
                onChange={handleInputChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  name='email'
                  type='email'
                  value={profile.email}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor='phone_number'>Phone Number</Label>
                <Input
                  id='phone_number'
                  name='phone_number'
                  type='tel'
                  value={profile.phone_number}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='date_of_birth'>Date of Birth</Label>
                <Input
                  id='date_of_birth'
                  name='date_of_birth'
                  type='date'
                  value={profile.date_of_birth}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor='sa_id_number'>SA ID Number</Label>
                <Input
                  id='sa_id_number'
                  name='sa_id_number'
                  value={profile.sa_id_number}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <Label htmlFor='street_address'>Street Address</Label>
              <Input
                id='street_address'
                name='street_address'
                value={profile.street_address}
                onChange={handleInputChange}
              />
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='suburb'>Suburb</Label>
                <Input
                  id='suburb'
                  name='suburb'
                  value={profile.suburb}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor='town_id'>Town</Label>
                <SearchableSelect
                  id='town_id'
                  name='town_id'
                  displayName='Town'
                  value={profile.town_id}
                  onChange={(value) =>
                    setProfile((prev) => ({ ...prev, town_id: value }))
                  }
                  onCreateNew={handleCreateNewTown}
                  options={towns}
                  placeholder='Select or create a town'
                />
              </div>
            </div>
            <div>
              <Label htmlFor='province'>Province</Label>
              <Select
                value={profile.province}
                onValueChange={(value) =>
                  setProfile({ ...profile, province: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select province' />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCES?.map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card>
          <CardHeader>
            <CardTitle>Social Media</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='twitter_url'>Twitter URL</Label>
                <Input
                  id='twitter_url'
                  name='twitter_url'
                  value={profile.twitter_url}
                  onChange={handleInputChange}
                  type='url'
                />
              </div>
              <div>
                <Label htmlFor='instagram_url'>Instagram URL</Label>
                <Input
                  id='instagram_url'
                  name='instagram_url'
                  value={profile.instagram_url}
                  onChange={handleInputChange}
                  type='url'
                />
              </div>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='facebook_url'>Facebook URL</Label>
                <Input
                  id='facebook_url'
                  name='facebook_url'
                  value={profile.facebook_url}
                  onChange={handleInputChange}
                  type='url'
                />
              </div>
              <div>
                <Label htmlFor='tiktok_url'>TikTok URL</Label>
                <Input
                  id='tiktok_url'
                  name='tiktok_url'
                  value={profile.tiktok_url}
                  onChange={handleInputChange}
                  type='url'
                />
              </div>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='youtube_url'>YouTube Channel URL</Label>
                <Input
                  id='youtube_url'
                  name='youtube_url'
                  value={profile.youtube_url}
                  onChange={handleInputChange}
                  type='url'
                />
              </div>
              <div>
                <Label htmlFor='spotify_url'>Spotify Artist URL</Label>
                <Input
                  id='spotify_url'
                  name='spotify_url'
                  value={profile.spotify_url}
                  onChange={handleInputChange}
                  type='url'
                />
              </div>
            </div>
            <div>
              <Label htmlFor='whatsapp_number'>WhatsApp Number</Label>
              <Input
                id='whatsapp_number'
                name='whatsapp_number'
                value={profile.whatsapp_number}
                onChange={handleInputChange}
                type='tel'
              />
            </div>
          </CardContent>
        </Card>

        {/* Profile Images */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Images</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='bg-zinc-900 rounded-lg p-6 space-y-4'>
              <h2 className='text-xl font-semibold text-white mb-4'>
                Profile Image
              </h2>

              <div className='space-y-4'>
                <Label>Profile Picture</Label>
                <div className='flex items-center gap-4'>
                  <Input
                    type='file'
                    accept='image/*'
                    onChange={(e) => handleFileSelect(e, 'profile')}
                  />
                  {profileImagePreview ? (
                    <div className='relative w-20 h-20'>
                      <img
                        src={profileImagePreview || '/placeholder.svg'}
                        alt='Profile preview'
                        className='w-full h-full object-cover rounded-lg'
                      />
                    </div>
                  ) : (
                    profile.profile_image_url && (
                      <div className='relative w-20 h-20'>
                        <img
                          src={profile.profile_image_url || '/placeholder.svg'}
                          alt='Existing profile'
                          className='w-full h-full object-cover rounded-lg'
                        />
                      </div>
                    )
                  )}
                </div>
                {uploadProgress['profile-images'] > 0 && (
                  <ProgressBar progress={uploadProgress['profile-images']} />
                )}
              </div>
            </div>

            {/* Gallery Images */}
            <div className='bg-zinc-900 rounded-lg p-6 space-y-4'>
              <h2 className='text-xl font-semibold text-white mb-4'>
                Gallery Images
              </h2>

              <div className='space-y-4'>
                <Label>Upload up to 6 images</Label>
                <Input
                  type='file'
                  accept='image/*'
                  multiple
                  onChange={(e) => handleFileSelect(e, 'gallery')}
                  disabled={
                    galleryImages.length +
                      (profile.gallery_images?.length || 0) >=
                    6
                  }
                />
                <div className='grid grid-cols-3 gap-4'>
                  {profile.gallery_images?.map((imageUrl, index) => (
                    <div key={`existing-${index}`} className='relative'>
                      <img
                        src={imageUrl || '/placeholder.svg'}
                        alt={`Existing Gallery ${index + 1}`}
                        className='w-full h-32 object-cover rounded-lg'
                      />
                      <Button
                        variant='destructive'
                        size='sm'
                        className='absolute top-2 right-2'
                        onClick={() => removeExistingGalleryImage(index)}
                      >
                        <X className='h-4 w-4' />
                      </Button>
                    </div>
                  ))}
                  {galleryPreviews.map((preview, index) => (
                    <div key={`new-${index}`} className='relative'>
                      <img
                        src={preview || '/placeholder.svg'}
                        alt={`New Gallery ${index + 1}`}
                        className='w-full h-32 object-cover rounded-lg'
                      />
                      <Button
                        variant='destructive'
                        size='sm'
                        className='absolute top-2 right-2'
                        onClick={() => removeFile(index, 'gallery')}
                      >
                        <X className='h-4 w-4' />
                      </Button>
                      {uploadProgress[`gallery-images-${index}`] > 0 && (
                        <ProgressBar
                          progress={uploadProgress[`gallery-images-${index}`]}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Songs */}
        {/* Demo Songs */}
        <Card>
          <CardHeader>
            <CardTitle>Demo Songs</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='bg-zinc-900 rounded-lg p-6 space-y-4'>
              <h2 className='text-xl font-semibold text-white mb-4'>
                Upload Demo Songs
              </h2>

              <div className='space-y-4'>
                <Label>Upload up to 3 demo songs</Label>
                <Input
                  type='file'
                  accept='audio/*'
                  onChange={(e) => handleFileSelect(e, 'demo')}
                  disabled={
                    newDemoSongs.length + (profile.demo_songs?.length || 0) >= 3
                  }
                />
                <div className='space-y-4'>
                  {profile.demo_songs?.map((song, index) => (
                    <div
                      key={`existing-${index}`}
                      className='flex items-center justify-between bg-zinc-800 p-4 rounded-lg'
                    >
                      <div className='flex items-center space-x-4'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => togglePlayPause(song.id)}
                        >
                          {currentlyPlaying === song.id ? (
                            <Pause className='h-4 w-4' />
                          ) : (
                            <Play className='h-4 w-4' />
                          )}
                        </Button>
                        <div>
                          <span className='font-semibold'>{song.title}</span>
                          <p className='text-sm text-zinc-400'>
                            Features: {song.features || 'None'} | Released:{' '}
                            {song.releaseDate || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={() => removeExistingDemoSong(index)}
                      >
                        <X className='h-4 w-4' />
                      </Button>
                    </div>
                  ))}
                  {newDemoSongs.map((song, index) => (
                    <div
                      key={`new-${song.id}`}
                      className='flex flex-col bg-zinc-800 p-4 rounded-lg'
                    >
                      <div className='flex items-center justify-between mb-2'>
                        <audio
                          src={song.url}
                          controls
                          className='w-full max-w-xs'
                        />
                        <Button
                          variant='destructive'
                          size='sm'
                          onClick={() => removeFile(index, 'demo')}
                        >
                          <X className='h-4 w-4' />
                        </Button>
                      </div>
                      <Input
                        value={song.title}
                        onChange={(e) => {
                          const updatedSongs = [...newDemoSongs];
                          updatedSongs[index].title = e.target.value;
                          setNewDemoSongs(updatedSongs);
                        }}
                        placeholder='Song title'
                        className='mb-2'
                      />
                      <Input
                        value={song.features}
                        onChange={(e) => {
                          const updatedSongs = [...newDemoSongs];
                          updatedSongs[index].features = e.target.value;
                          setNewDemoSongs(updatedSongs);
                        }}
                        placeholder='Features (comma-separated)'
                        className='mb-2'
                      />
                      <Input
                        type='date'
                        value={song.releaseDate}
                        onChange={(e) => {
                          const updatedSongs = [...newDemoSongs];
                          updatedSongs[index].releaseDate = e.target.value;
                          setNewDemoSongs(updatedSongs);
                        }}
                        placeholder='Release Date'
                      />
                      {songUploadProgress[song.id] !== undefined && (
                        <ProgressBar progress={songUploadProgress[song.id]} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
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
                  value={profile.record_label_id}
                  onChange={(value) =>
                    setProfile((prev) => ({ ...prev, record_label_id: value }))
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
                  value={profile.distributor_id}
                  onChange={(value) =>
                    setProfile((prev) => ({ ...prev, distributor_id: value }))
                  }
                  onCreateNew={handleCreateNewDistributor}
                  options={distributors}
                  placeholder='Select or create a distributor'
                />
              </div>
            </div>
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='has_manager'
                checked={profile.has_manager}
                onCheckedChange={(checked) =>
                  setProfile((prev) => ({
                    ...prev,
                    has_manager: checked as boolean,
                  }))
                }
              />
              <Label htmlFor='has_manager'>I have a manager</Label>
            </div>
          </CardContent>
        </Card>

        {/* Memberships */}
        <Card>
          <CardHeader>
            <CardTitle>Memberships</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='samro_member'
                    checked={profile.samro_member}
                    onCheckedChange={(checked) =>
                      setProfile((prev) => ({
                        ...prev,
                        samro_member: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor='samro_member'>SAMRO Member</Label>
                </div>
                {profile.samro_member && (
                  <Input
                    id='samro_id'
                    name='samro_id'
                    value={profile.samro_id}
                    onChange={handleInputChange}
                    placeholder='SAMRO ID'
                    className='mt-2'
                  />
                )}
              </div>
              <div>
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='cappasso_member'
                    checked={profile.cappasso_member}
                    onCheckedChange={(checked) =>
                      setProfile((prev) => ({
                        ...prev,
                        cappasso_member: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor='cappasso_member'>CAPPASSO Member</Label>
                </div>
                {profile.cappasso_member && (
                  <Input
                    id='cappasso_id'
                    name='cappasso_id'
                    value={profile.cappasso_id}
                    onChange={handleInputChange}
                    placeholder='CAPPASSO ID'
                    className='mt-2'
                  />
                )}
              </div>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='risa_member'
                    checked={profile.risa_member}
                    onCheckedChange={(checked) =>
                      setProfile((prev) => ({
                        ...prev,
                        risa_member: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor='risa_member'>RISA Member</Label>
                </div>
                {profile.risa_member && (
                  <Input
                    id='risa_id'
                    name='risa_id'
                    value={profile.risa_id}
                    onChange={handleInputChange}
                    placeholder='RISA ID'
                    className='mt-2'
                  />
                )}
              </div>
              <div>
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='sampra_member'
                    checked={profile.sampra_member}
                    onCheckedChange={(checked) =>
                      setProfile((prev) => ({
                        ...prev,
                        sampra_member: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor='sampra_member'>SAMPRA Member</Label>
                </div>
                {profile.sampra_member && (
                  <Input
                    id='sampra_id'
                    name='sampra_id'
                    value={profile.sampra_id}
                    onChange={handleInputChange}
                    placeholder='SAMPRA ID'
                    className='mt-2'
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type='submit' disabled={updating} onClick={handleSubmit}>
          {updating ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              {currentUploadingFile
                ? `Uploading ${currentUploadingFile}...`
                : 'Updating...'}
            </>
          ) : (
            'Update Profile'
          )}
        </Button>
      </div>
    </div>
  );
}
