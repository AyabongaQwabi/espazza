'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploader } from '@/components/ImageUploader';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Editor } from '@/components/Editor';
import { toast } from '@/hooks/use-toast';

export default function EditBlogPost({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [published, setPublished] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchPost() {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch post. Please try again.',
          variant: 'destructive',
        });
        router.push('/dashboard/blog');
      } else if (data) {
        setTitle(data.title);
        setContent(data.content);
        setExcerpt(data.excerpt || '');
        setFeaturedImage(data.featured_image || '');
        setPublished(data.published);
        setLoading(false);
      }
    }

    fetchPost();
  }, [params.id, router, supabase]);

  async function handleSave(publish: boolean) {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          title,
          content,
          excerpt,
          featured_image: featuredImage,
          published: publish,
        })
        .eq('id', params.id);

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
      JSON.stringify({ title, content, excerpt, featuredImage })
    );
    window.open('/dashboard/blog/preview', '_blank');
  }

  if (loading) {
    return <div className='p-8'>Loading...</div>;
  }

  return (
    <div className='p-8 max-w-4xl mx-auto'>
      <h1 className='text-2xl font-bold text-white mb-8'>Edit Blog Post</h1>

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
          {featuredImage && (
            <img
              src={featuredImage || '/placeholder.svg'}
              alt='Featured'
              className='mt-2 max-h-40 rounded'
            />
          )}
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
          <Button onClick={() => handleSave(false)} disabled={loading}>
            Save as Draft
          </Button>
          <Button onClick={handlePreview} disabled={loading}>
            Preview
          </Button>
          <Button
            onClick={() => handleSave(true)}
            className='bg-red-600 hover:bg-red-700'
            disabled={loading}
          >
            {published ? 'Update' : 'Publish'}
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
