'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploader } from '@/components/ImageUploader';
import { supabase } from '@/lib/supabase';
import { Editor } from '@/components/Editor';
import { toast } from '@/hooks/use-toast';

export default function NewBlogPost() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);

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
      if (!user) throw new Error('Please login to create a post');

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
        title: publish ? 'Post Published' : 'Draft Saved',
        description: publish
          ? 'Your post has been published successfully.'
          : 'Your draft has been saved successfully.',
      });

      router.push('/dashboard/blog');
    } catch (err: any) {
      toast({
        title: 'Error',
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

  return (
    <div className='p-8 max-w-4xl mx-auto'>
      <h1 className='text-2xl font-bold text-white mb-8'>
        Bhala iPost Entsha (Write New Post)
      </h1>

      <div className='space-y-6'>
        <div>
          <label className='block text-sm font-medium text-zinc-400 mb-1'>
            Title
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className='w-full'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-zinc-400 mb-1'>
            Excerpt
          </label>
          <Textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            required
            className='w-full h-20'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-zinc-400 mb-1'>
            Featured Image
          </label>
          <ImageUploader
            onUploadComplete={(urls) => setFeaturedImage(urls[0])}
            maxSizeInMB={5}
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-zinc-400 mb-1'>
            YouTube URL
          </label>
          <Input
            type='url'
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder='https://youtube.com/watch?v=...'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-zinc-400 mb-1'>
            Audio File (MP3)
          </label>
          <Input
            type='file'
            accept='audio/mpeg'
            onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-zinc-400 mb-1'>
            Content
          </label>
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
              } = supabase.storage.from('blog-images').getPublicUrl(data.path);

              return publicUrl;
            }}
          />
        </div>

        <div className='flex gap-4'>
          <Button onClick={handleSaveAsDraft} disabled={loading}>
            Save as Draft
          </Button>
          <Button onClick={handlePreview} disabled={loading}>
            Preview
          </Button>
          <Button
            onClick={handlePublish}
            className='bg-red-600 hover:bg-red-700'
            disabled={loading}
          >
            Publish
          </Button>
          <Button
            variant='outline'
            onClick={() => router.push('/dashboard/blog')}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
