'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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

interface Song {
  file: File;
  title: string;
  features: string;
  releaseDate: string;
}

export default function MediaUploadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [youtubeLinks, setYoutubeLinks] = useState<string[]>(['']);
  const [artistBio, setArtistBio] = useState('');

  const ProgressBar = ({ progress }: { progress: number }) => (
    <div className='w-full bg-zinc-800 rounded-full h-2 mt-2'>
      <div
        className='bg-red-600 h-2 rounded-full transition-all duration-300'
        style={{ width: `${progress}%` }}
      />
    </div>
  );

  const handleSongUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFile = files[0];
    if (songs.length < 3 && newFile) {
      setSongs([
        ...songs,
        {
          file: newFile,
          title: '',
          features: '',
          releaseDate: '',
        },
      ]);
    }
  };

  const updateSongMetadata = (
    index: number,
    field: keyof Song,
    value: string
  ) => {
    const updatedSongs = [...songs];
    updatedSongs[index] = {
      ...updatedSongs[index],
      [field]: value,
    };
    setSongs(updatedSongs);
  };

  // Helper function to handle file selection
  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'profile' | 'gallery'
  ) => {
    const files = e.target.files;
    if (!files) return;

    if (type === 'profile' && files[0]) {
      setProfileImage(files[0]);
      const preview = URL.createObjectURL(files[0]);
      setProfileImagePreview(preview);
    } else if (type === 'gallery') {
      const newFiles = Array.from(files).slice(0, 6 - galleryImages.length);
      setGalleryImages([...galleryImages, ...newFiles]);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setGalleryPreviews([...galleryPreviews, ...newPreviews]);
    }
  };

  // Helper function to remove files
  const removeFile = (index: number, type: 'gallery' | 'youtube') => {
    if (type === 'gallery') {
      setGalleryImages(galleryImages.filter((_, i) => i !== index));
      setGalleryPreviews(galleryPreviews.filter((_, i) => i !== index));
    } else if (type === 'youtube') {
      setYoutubeLinks(youtubeLinks.filter((_, i) => i !== index));
    }
  };

  // Helper function to add YouTube link field
  const addYoutubeLink = () => {
    if (youtubeLinks.length < 4) {
      setYoutubeLinks([...youtubeLinks, '']);
    }
  };

  // Helper function to upload files to Supabase storage
  const uploadFile = async (file: File, bucket: string, index?: number) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;

    const uploadKey = index !== undefined ? `${bucket}-${index}` : bucket;
    setUploadProgress((prev) => ({ ...prev, [uploadKey]: 0 }));

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        onUploadProgress: (progress) => {
          if (progress.totalBytes > 0) {
            const percent =
              (progress.bytesUploaded / progress.totalBytes) * 100;
            setUploadProgress((prev) => ({ ...prev, [uploadKey]: percent }));
          }
        },
      });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setUploadProgress({}); // Reset progress

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let profileImageUrl = '';
      if (profileImage) {
        profileImageUrl = await uploadFile(profileImage, 'profile-images');
      }

      const galleryUrls = await Promise.all(
        galleryImages.map((file, index) =>
          uploadFile(file, 'gallery-images', index)
        )
      );

      const songUploads = await Promise.all(
        songs.map(async (song, index) => {
          const url = await uploadFile(song.file, 'demo-songs', index);
          return {
            url,
            title: song.title,
            features: song.features,
            releaseDate: song.releaseDate,
          };
        })
      );

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          profile_image_url: profileImageUrl,
          gallery_images: galleryUrls,
          demo_songs: songUploads,
          youtube_links: youtubeLinks.filter((link) => link),
          artist_artist_bio: artistBio,
          registration_complete: true,
        })
        .eq('id', user.id);
      console.log('update error', updateError);
      if (updateError) throw updateError;

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-900 p-8'>
      <div className='max-w-3xl mx-auto'>
        <h1 className='text-3xl font-bold text-white mb-8'>
          Step 2: Media Upload
        </h1>

        <form onSubmit={handleSubmit} className='space-y-8'>
          {/* Profile Image Upload */}
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
                {profileImagePreview && (
                  <div className='relative w-20 h-20'>
                    <img
                      src={profileImagePreview}
                      alt='Profile preview'
                      className='w-full h-full object-cover rounded-lg'
                    />
                  </div>
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
                disabled={galleryImages.length >= 6}
              />
              <div className='grid grid-cols-3 gap-4'>
                {galleryPreviews.map((preview, index) => (
                  <div key={index} className='relative'>
                    <img
                      src={preview}
                      alt={`Gallery ${index + 1}`}
                      className='w-full h-32 object-cover rounded-lg'
                    />
                    <Button
                      variant='destructive'
                      size='sm'
                      className='absolute top-2 right-2'
                      onClick={() => removeFile(index, 'gallery')}
                    >
                      X
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

          {/* Artist Bio */}
          <div className='bg-zinc-900 rounded-lg p-6 space-y-4'>
            <h2 className='text-xl font-semibold text-white mb-4'>
              Artist Bio
            </h2>

            <div className='space-y-4'>
              <Label>Tell us about yourself</Label>
              <Textarea
                value={artistBio}
                onChange={(e) => setArtistBio(e.target.value)}
                className='h-32'
                placeholder='Share your story...'
              />
            </div>
          </div>

          {/* Demo Songs */}
          <div className='bg-zinc-900 rounded-lg p-6 space-y-4'>
            <h2 className='text-xl font-semibold text-white mb-4'>
              Demo Songs
            </h2>

            <div className='space-y-4'>
              <Label>Upload up to 3 MP3s</Label>
              <Input
                type='file'
                accept='.mp3'
                onChange={handleSongUpload}
                disabled={songs.length >= 3}
              />
              <div className='space-y-4'>
                {songs.map((song, index) => (
                  <div
                    key={index}
                    className='bg-zinc-800 p-4 rounded-lg space-y-3'
                  >
                    <div className='flex justify-between items-center'>
                      <span className='text-white'>{song.file.name}</span>
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={() => {
                          const newSongs = [...songs];
                          newSongs.splice(index, 1);
                          setSongs(newSongs);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                    {uploadProgress[`demo-songs-${index}`] > 0 && (
                      <ProgressBar
                        progress={uploadProgress[`demo-songs-${index}`]}
                      />
                    )}
                    <div className='grid gap-3'>
                      <div>
                        <Label>Song Title</Label>
                        <Input
                          value={song.title}
                          onChange={(e) =>
                            updateSongMetadata(index, 'title', e.target.value)
                          }
                          placeholder='Enter song title'
                          required
                        />
                      </div>
                      <div>
                        <Label>Features</Label>
                        <Input
                          value={song.features}
                          onChange={(e) =>
                            updateSongMetadata(
                              index,
                              'features',
                              e.target.value
                            )
                          }
                          placeholder='Enter featured artists (optional)'
                        />
                      </div>
                      <div>
                        <Label>Release Date</Label>
                        <Input
                          type='date'
                          value={song.releaseDate}
                          onChange={(e) =>
                            updateSongMetadata(
                              index,
                              'releaseDate',
                              e.target.value
                            )
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* YouTube Links */}
          <div className='bg-zinc-900 rounded-lg p-6 space-y-4'>
            <h2 className='text-xl font-semibold text-white mb-4'>
              YouTube Links
            </h2>

            <div className='space-y-4'>
              <Label>Add up to 4 YouTube links</Label>
              {youtubeLinks.map((link, index) => (
                <div key={index} className='flex gap-2'>
                  <Input
                    value={link}
                    onChange={(e) => {
                      const newLinks = [...youtubeLinks];
                      newLinks[index] = e.target.value;
                      setYoutubeLinks(newLinks);
                    }}
                    placeholder='YouTube URL'
                  />
                  <Button
                    variant='destructive'
                    onClick={() => removeFile(index, 'youtube')}
                  >
                    X
                  </Button>
                </div>
              ))}
              {youtubeLinks.length < 4 && (
                <Button
                  type='button'
                  variant='outline'
                  onClick={addYoutubeLink}
                >
                  Add Another Link
                </Button>
              )}
            </div>
          </div>

          {error && (
            <div className='bg-red-500/10 border border-red-500/50 rounded-lg p-4'>
              <p className='text-red-500 text-sm'>{error}</p>
            </div>
          )}

          <Button
            type='submit'
            className='w-full bg-red-600 hover:bg-red-700'
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Complete Registration'}
          </Button>
        </form>
      </div>
    </div>
  );
}
