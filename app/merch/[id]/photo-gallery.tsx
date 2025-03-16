'use client';

import type React from 'react';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X, Expand, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PhotoGalleryProps {
  images: string[];
  merchandiserName: string;
}

export default function PhotoGallery({
  images,
  merchandiserName,
}: PhotoGalleryProps) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const hasImages = images.length > 0;
  const hasMultipleImages = images.length > 1;

  const openGallery = (index = 0) => {
    setCurrentImageIndex(index);
    setGalleryOpen(true);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'Escape') setGalleryOpen(false);
  };

  return (
    <>
      {/* Main featured image */}
      <div
        className='aspect-square relative rounded-lg overflow-hidden border border-zinc-800 cursor-pointer group'
        onClick={() => hasImages && openGallery(0)}
      >
        <Image
          src={hasImages ? images[0] : '/placeholder.svg?height=600&width=600'}
          alt={merchandiserName}
          fill
          className='object-cover transition-transform duration-500 group-hover:scale-105'
          priority
          sizes='(max-width: 768px) 100vw, 50vw'
        />
        {hasImages && (
          <div className='absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
            <Expand className='h-10 w-10 text-white' />
          </div>
        )}
      </div>

      {/* Thumbnail grid */}
      {hasMultipleImages && (
        <div className='grid grid-cols-4 gap-2'>
          {images.slice(1, 5).map((image, index) => (
            <div
              key={index}
              className='aspect-square relative rounded-lg overflow-hidden border border-zinc-800 cursor-pointer group'
              onClick={() => openGallery(index + 1)}
            >
              <Image
                src={image || '/placeholder.svg'}
                alt={`${merchandiserName} product ${index + 1}`}
                fill
                className='object-cover transition-transform duration-500 group-hover:scale-105'
                sizes='(max-width: 768px) 25vw, 12vw'
              />
              <div className='absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                <ZoomIn className='h-5 w-5 text-white' />
              </div>
            </div>
          ))}

          {images.length > 5 && (
            <div className='col-span-4 text-center mt-2'>
              <Button
                variant='outline'
                onClick={() => openGallery()}
                className='bg-zinc-800 hover:bg-zinc-700 border-zinc-700'
              >
                View all {images.length} photos
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Full-screen gallery dialog */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent
          className='max-w-[95vw] max-h-[95vh] p-0 bg-zinc-900 border-zinc-800 overflow-hidden'
          onKeyDown={handleKeyDown}
        >
          <div className='relative h-full flex flex-col'>
            {/* Gallery header */}
            <div className='flex justify-between items-center p-4 border-b border-zinc-800'>
              <DialogTitle className='text-white'>
                {merchandiserName} - Photo {currentImageIndex + 1} of{' '}
                {images.length}
              </DialogTitle>
              <DialogClose asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='text-zinc-400 hover:text-white'
                >
                  <X className='h-5 w-5' />
                </Button>
              </DialogClose>
            </div>

            {/* Gallery content */}
            <div className='flex-1 relative flex items-center justify-center p-4 overflow-hidden'>
              <AnimatePresence mode='wait'>
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className='relative w-full h-full flex items-center justify-center'
                >
                  <div className='relative max-h-[70vh] max-w-full'>
                    <Image
                      src={images[currentImageIndex] || '/placeholder.svg'}
                      alt={`${merchandiserName} product ${
                        currentImageIndex + 1
                      }`}
                      width={1200}
                      height={800}
                      className='object-contain max-h-[70vh] max-w-full rounded-md'
                    />
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation buttons */}
              {hasMultipleImages && (
                <>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='absolute left-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2'
                    onClick={prevImage}
                  >
                    <ChevronLeft className='h-6 w-6' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='absolute right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2'
                    onClick={nextImage}
                  >
                    <ChevronRight className='h-6 w-6' />
                  </Button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {hasMultipleImages && (
              <div className='p-4 border-t border-zinc-800 overflow-x-auto'>
                <div className='flex space-x-2'>
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className={`relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden cursor-pointer border-2 transition-all ${
                        index === currentImageIndex
                          ? 'border-red-500 scale-105'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      <Image
                        src={image || '/placeholder.svg'}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        className='object-cover'
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
