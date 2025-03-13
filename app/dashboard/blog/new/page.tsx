'use client';

import type React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploader } from '@/components/ImageUploader';
import { supabase } from '@/lib/supabase';
import { Editor } from '@/components/Editor';
import { toast } from '@/hooks/use-toast';
import {
  MicIcon,
  ImageIcon,
  YoutubeIcon,
  FileTextIcon,
  SaveIcon,
  EyeIcon,
  SendIcon,
  XIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function NewBlogPost() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFileName, setAudioFileName] = useState('');

  async function handleSaveAsDraft() {
    await handleSubmit(false);
  }

  async function handlePublish() {
    await handleSubmit(true);
  }

  async function handleSubmit(publish: boolean) {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('You need to log in first to drop this heat!');

      let audioUrl = '';
      if (audioFile) {
        const { data: audioData, error: audioError } = await supabase.storage
          .from('blog-audio')
          .upload(`${Date.now()}-${audioFile.name}`, audioFile);

        if (audioError) throw audioError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('blog-audio').getPublicUrl(audioData.path);

        audioUrl = publicUrl;
      }

      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { data, error } = await supabase
        .from('blog_posts')
        .insert([
          {
            title,
            content,
            excerpt,
            featured_image: featuredImage,
            youtube_url: youtubeUrl,
            audio_url: audioUrl,
            slug,
            author_id: user.id,
            published: publish,
          },
        ])
        .select();

      if (error) throw error;

      toast({
        title: publish ? '🔥 Post Dropped! 🔥' : '💾 Draft Saved',
        description: publish
          ? 'Your content is now live for the world to see!'
          : "Your draft is safe. Come back and finish it when you're ready.",
      });

      router.push('/dashboard/blog');
    } catch (err: any) {
      toast({
        title: 'Oops! Something went wrong',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function handlePreview() {
    localStorage.setItem(
      'previewPost',
      JSON.stringify({
        title,
        content,
        excerpt,
        featuredImage,
        youtubeUrl,
      })
    );
    window.open('/dashboard/blog/preview', '_blank');
  }

  function handleAudioFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setAudioFile(file);
    setAudioFileName(file?.name || '');
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 pt-6 pb-20'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='p-8 max-w-4xl mx-auto bg-gray-900/60 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-500/20'
      >
        <h1 className='text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 mb-2'>
          Write Your Next Post 🔥
        </h1>
        <p className='text-pink-200 mb-8'>
          Share your story with the Xhosa Hip Hop community
        </p>

        <div className='space-y-8'>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className='bg-gray-800/50 p-6 rounded-xl border border-purple-500/20'
          >
            <label className='block text-lg font-medium text-pink-400 mb-2 flex items-center'>
              <FileTextIcon className='mr-2 h-5 w-5' />
              Give Your Post a Dope Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="What's this post all about?"
              className='w-full bg-gray-700/50 border-purple-500/30 focus:border-pink-500 text-white'
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className='bg-gray-800/50 p-6 rounded-xl border border-purple-500/20'
          >
            <label className='block text-lg font-medium text-pink-400 mb-2'>
              Hook Your Audience (Short Description)
            </label>
            <Textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              required
              placeholder="Give people a taste of what's coming..."
              className='w-full h-20 bg-gray-700/50 border-purple-500/30 focus:border-pink-500 text-white'
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className='bg-gray-800/50 p-6 rounded-xl border border-purple-500/20'
          >
            <label className='block text-lg font-medium text-pink-400 mb-2 flex items-center'>
              <ImageIcon className='mr-2 h-5 w-5' />
              Cover Art
            </label>
            <p className='text-gray-400 text-sm mb-4'>
              Make it eye-catching - this is what people see first!
            </p>
            <ImageUploader
              onUploadComplete={(urls) => setFeaturedImage(urls[0])}
              maxSizeInMB={5}
            />
            {featuredImage && (
              <div className='mt-4 relative'>
                <img
                  src={featuredImage || '/placeholder.svg'}
                  alt='Featured image preview'
                  className='h-40 object-cover rounded-lg border border-purple-500/30'
                />
                <Button
                  variant='destructive'
                  size='sm'
                  className='absolute top-2 right-2 rounded-full w-8 h-8 p-0'
                  onClick={() => setFeaturedImage('')}
                >
                  <XIcon className='h-4 w-4' />
                </Button>
              </div>
            )}
          </motion.div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className='bg-gray-800/50 p-6 rounded-xl border border-purple-500/20'
            >
              <label className='block text-lg font-medium text-pink-400 mb-2 flex items-center'>
                <YoutubeIcon className='mr-2 h-5 w-5 text-red-500' />
                YouTube Video
              </label>
              <p className='text-gray-400 text-sm mb-4'>
                Got a music video or interview to share?
              </p>
              <Input
                type='url'
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder='https://youtube.com/watch?v=...'
                className='w-full bg-gray-700/50 border-purple-500/30 focus:border-pink-500 text-white'
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className='bg-gray-800/50 p-6 rounded-xl border border-purple-500/20'
            >
              <label className='block text-lg font-medium text-pink-400 mb-2 flex items-center'>
                <MicIcon className='mr-2 h-5 w-5 text-purple-400' />
                Drop an Audio Track
              </label>
              <p className='text-gray-400 text-sm mb-4'>
                Share your latest track or freestyle
              </p>
              <div className='relative'>
                <Input
                  type='file'
                  accept='audio/mpeg'
                  onChange={handleAudioFileChange}
                  className='w-full bg-gray-700/50 border-purple-500/30 focus:border-pink-500 text-white'
                />
                {audioFileName && (
                  <p className='mt-2 text-sm text-green-400 flex items-center'>
                    <span className='mr-2'>✓</span> {audioFileName}
                  </p>
                )}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            className='bg-gray-800/50 p-6 rounded-xl border border-purple-500/20'
          >
            <label className='block text-lg font-medium text-pink-400 mb-2'>
              Tell Your Story
            </label>
            <p className='text-gray-400 text-sm mb-4'>
              This is where you spit your real thoughts
            </p>
            <div className='bg-gray-700/50 rounded-lg overflow-hidden'>
              <Editor
                value={content}
                onChange={setContent}
                onImageUpload={async (file: File) => {
                  const { data, error } = await supabase.storage
                    .from('blog-images')
                    .upload(`${Date.now()}-${file.name}`, file);

                  if (error) {
                    throw error;
                  }

                  const {
                    data: { publicUrl },
                  } = supabase.storage
                    .from('blog-images')
                    .getPublicUrl(data.path);

                  return publicUrl;
                }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className='flex flex-wrap gap-4 pt-4'
          >
            <Button
              onClick={handleSaveAsDraft}
              disabled={loading}
              className='bg-indigo-600 hover:bg-indigo-700 text-white'
            >
              <SaveIcon className='mr-2 h-4 w-4' />
              Save as Draft
            </Button>
            <Button
              onClick={handlePreview}
              disabled={loading}
              className='bg-purple-600 hover:bg-purple-700 text-white'
            >
              <EyeIcon className='mr-2 h-4 w-4' />
              Preview
            </Button>
            <Button
              onClick={handlePublish}
              className='bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white'
              disabled={loading}
            >
              <SendIcon className='mr-2 h-4 w-4' />
              {loading ? 'Dropping...' : 'Drop This Heat 🔥'}
            </Button>
            <Button
              variant='outline'
              onClick={() => router.push('/dashboard/blog')}
              className='border-pink-500/50 text-pink-400 hover:bg-pink-500/10'
            >
              <XIcon className='mr-2 h-4 w-4' />
              Cancel
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
