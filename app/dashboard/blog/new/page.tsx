'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';

export default function NewBlogPost() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const excerpt = formData.get('excerpt') as string;
    const featured_image = formData.get('featured_image') as string;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please login to create a post');

      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { error: insertError } = await supabase
        .from('blog_posts')
        .insert([
          {
            title,
            content,
            excerpt,
            featured_image,
            slug,
            author_id: user.id,
            published: false,
          },
        ]);

      if (insertError) throw insertError;

      router.push('/dashboard/blog');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-8">
        Bhala Ibali Elitsha (Write New Story)
      </h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Title
          </label>
          <Input
            name="title"
            required
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Excerpt
          </label>
          <Textarea
            name="excerpt"
            required
            className="w-full h-20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Featured Image URL
          </label>
          <Input
            name="featured_image"
            type="url"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Content
          </label>
          <Textarea
            name="content"
            required
            className="w-full h-64"
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <div className="flex gap-4">
          <Button
            type="submit"
            className="bg-red-600 hover:bg-red-700"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save as Draft'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/blog')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}