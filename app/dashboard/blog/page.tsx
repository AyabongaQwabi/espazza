'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function DashboardBlog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPosts() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      setPosts(data || []);
      setLoading(false);
    }

    loadPosts();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">
          Amabali Am (My Stories)
        </h1>
        <Button asChild>
          <Link href="/dashboard/blog/new">
            Bhala Ibali (Write Story)
          </Link>
        </Button>
      </div>

      <div className="grid gap-6">
        {posts.map((post: any) => (
          <div 
            key={post.id}
            className="bg-zinc-900 rounded-lg p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-2">
              {post.title}
            </h2>
            <p className="text-gray-400 mb-4">
              {post.excerpt}
            </p>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {new Date(post.created_at).toLocaleDateString('en-ZA')}
                <span className="mx-2">•</span>
                {post.published ? (
                  <span className="text-green-500">Published</span>
                ) : (
                  <span className="text-yellow-500">Draft</span>
                )}
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/blog/edit/${post.id}`}>
                  Hlela (Edit)
                </Link>
              </Button>
            </div>
          </div>
        ))}

        {posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">
              Awukabhali amabali (You haven't written any stories yet)
            </p>
            <Button asChild>
              <Link href="/dashboard/blog/new">
                Qala Ukubhala (Start Writing)
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}