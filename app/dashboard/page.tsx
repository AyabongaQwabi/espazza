'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MusicIcon, UsersIcon, BookOpenIcon, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Load posts
      const { data: postsData } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      if (postsData) {
        setPosts(postsData);
      }

      setLoading(false);
    }

    loadData();
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
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          Molo, {profile?.username || 'Artist'}!
        </h1>
        <p className="text-gray-400">
          Welcome to your XHAP dashboard
        </p>
      </div>

      {/* Create Post Button */}
      <div className="mb-8">
        <Button asChild className="bg-red-600 hover:bg-red-700">
          <Link href="/dashboard/blog/new">
            <PlusIcon className="h-4 w-4 mr-2" />
            Create New Post
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-zinc-950 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Total Posts</h3>
            <BookOpenIcon className="h-5 w-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-white">{posts.length}</p>
        </div>
        <div className="bg-zinc-950 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Published</h3>
            <MusicIcon className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-white">
            {posts.filter(post => post.published).length}
          </p>
        </div>
        <div className="bg-zinc-950 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Drafts</h3>
            <UsersIcon className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-white">
            {posts.filter(post => !post.published).length}
          </p>
        </div>
      </div>

      {/* Recent Posts */}
      <div className="bg-zinc-950 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Recent Posts</h2>
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-zinc-800 rounded-lg p-4 hover:bg-bg-zinc-800 transition-colors"
            >
              <Link href={`/dashboard/blog/edit/${post.id}`}>
                <h3 className="text-lg font-medium text-white mb-2">{post.title}</h3>
                <div className="flex items-center text-sm text-gray-400">
                  <span>{new Date(post.created_at).toLocaleDateString('en-ZA')}</span>
                  <span className="mx-2">•</span>
                  <span className={post.published ? 'text-green-500' : 'text-yellow-500'}>
                    {post.published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </Link>
            </div>
          ))}

          {posts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No posts yet</p>
              <Button asChild>
                <Link href="/dashboard/blog/new">Create Your First Post</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}