'use client';

import { useState, useCallback } from 'react';
import { Upload, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  onUploadComplete: (urls: string[]) => void;
  maxSizeInMB?: number;
}

interface UploadingImage {
  file: File;
  progress: number;
  preview: string;
  url?: string;
}

export function ImageUploader({
  onUploadComplete,
  maxSizeInMB = 5,
}: ImageUploaderProps) {
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      setError(null);

      const oversizedFiles = selectedFiles.filter(
        (file) => file.size > maxSizeInMB * 1024 * 1024
      );
      if (oversizedFiles.length > 0) {
        setError(`Some files exceed the ${maxSizeInMB}MB limit`);
        return;
      }

      const newUploadingImages = selectedFiles.map((file) => ({
        file,
        progress: 0,
        preview: URL.createObjectURL(file),
      }));

      setUploadingImages((prev) => [...prev, ...newUploadingImages]);

      const supabase = createClientComponentClient();

      for (const image of newUploadingImages) {
        try {
          const { data, error } = await supabase.storage
            .from('product-images')
            .upload(`${Date.now()}-${image.file.name}`, image.file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (error) {
            console.error('Supabase upload error:', error);
            throw error;
          }

          if (!data) {
            throw new Error('No data returned from Supabase upload');
          }

          const { data: publicUrlData, error: publicUrlError } =
            supabase.storage.from('product-images').getPublicUrl(data.path);

          if (publicUrlError) {
            console.error('Error getting public URL:', publicUrlError);
            throw publicUrlError;
          }

          setUploadingImages((prev) =>
            prev.map((img) =>
              img.file === image.file
                ? { ...img, progress: 100, url: publicUrlData.publicUrl }
                : img
            )
          );

          onUploadComplete([publicUrlData.publicUrl]);
        } catch (error) {
          console.error('Error uploading file:', error);
          toast({
            title: 'Upload Error',
            description:
              'There was an error uploading your image. Please try again.',
            variant: 'destructive',
          });
          setUploadingImages((prev) =>
            prev.filter((img) => img.file !== image.file)
          );
        }
      }
    },
    [maxSizeInMB, onUploadComplete]
  );

  const removeImage = useCallback(
    (imageToRemove: UploadingImage) => {
      setUploadingImages((prev) => prev.filter((img) => img !== imageToRemove));
      if (imageToRemove.url) {
        onUploadComplete(
          uploadingImages
            .filter((img) => img !== imageToRemove)
            .map((img) => img.url!)
        );
      }
    },
    [uploadingImages, onUploadComplete]
  );

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-center w-full'>
        <label
          htmlFor='dropzone-file'
          className='flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600'
        >
          <div className='flex flex-col items-center justify-center pt-5 pb-6'>
            <Upload className='w-8 h-8 mb-4 text-gray-500 dark:text-gray-400' />
            <p className='mb-2 text-sm text-gray-500 dark:text-gray-400'>
              <span className='font-semibold'>Click to upload</span> or drag and
              drop
            </p>
            <p className='text-xs text-gray-500 dark:text-gray-400'>
              PNG, JPG or GIF (MAX. {maxSizeInMB}MB)
            </p>
          </div>
          <input
            id='dropzone-file'
            type='file'
            className='hidden'
            onChange={handleFileChange}
            accept='image/*'
            multiple
          />
        </label>
      </div>

      {error && <p className='text-red-500 text-sm'>{error}</p>}

      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
        {uploadingImages.map((image, index) => (
          <div key={index} className='relative'>
            <Image
              src={image.preview || '/placeholder.svg'}
              alt={`Preview ${index + 1}`}
              width={200}
              height={200}
              className='rounded-lg object-cover w-full h-40'
            />
            <button
              onClick={() => removeImage(image)}
              className='absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors'
            >
              <X className='w-4 h-4' />
            </button>
            <Progress value={image.progress} className='w-full mt-2' />
          </div>
        ))}
      </div>
    </div>
  );
}
