'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ReactMarkdown from 'react-markdown';
import { MusicIcon, Heart, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Add generateStaticParams function

export default function BlogPost({ params }: { params: { slug: string } }) {
  const [post, setPost] = useState<any>(null);
  const [likes, setLikes] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchPost();
    checkAuth();
  }, []);

  async function checkAuth() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
  }

  async function fetchPost() {
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select(
        `
        *,
        profiles (
          username,
          full_name,
          avatar_url
        )
      `
      )
      .eq('slug', params.slug)
      .eq('published', true)
      .single();

    if (error) {
      console.error('Error fetching post:', error);
      return;
    }

    setPost(post);
    fetchLikes(post.id);
    fetchComments(post.id);
    setLoading(false);
  }

  async function fetchLikes(postId: string) {
    const { data: likes } = await supabase
      .from('blog_likes')
      .select('*, profiles(username, avatar_url)')
      .eq('post_id', postId);
    setLikes(likes || []);
  }

  async function fetchComments(postId: string) {
    const { data: comments } = await supabase
      .from('blog_comments')
      .select('*, profiles(username, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    setComments(comments || []);
  }

  async function handleLike() {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to like posts',
        variant: 'destructive',
      });
      return;
    }

    const existingLike = likes.find((like) => like.user_id === user.id);
    if (existingLike) {
      const { error } = await supabase
        .from('blog_likes')
        .delete()
        .eq('id', existingLike.id);

      if (!error) {
        setLikes(likes.filter((like) => like.id !== existingLike.id));
      }
    } else {
      const { data, error } = await supabase
        .from('blog_likes')
        .insert([{ post_id: post.id, user_id: user.id }])
        .select('*, profiles(username, avatar_url)')
        .single();

      if (!error && data) {
        setLikes([...likes, data]);
      }
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to comment',
        variant: 'destructive',
      });
      return;
    }

    if (!newComment.trim()) return;

    const { data, error } = await supabase
      .from('blog_comments')
      .insert([{ post_id: post.id, user_id: user.id, content: newComment }])
      .select('*, profiles(username, avatar_url)')
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to post comment',
        variant: 'destructive',
      });
    } else if (data) {
      setComments([...comments, data]);
      setNewComment('');
    }
  }

  if (loading) {
    return <div className='p-8'>Loading...</div>;
  }

  if (!post) {
    return (
      <div className='min-h-screen bg-black flex items-center justify-center px-4'>
        <div className='text-center'>
          <MusicIcon className='h-12 w-12 text-red-600 mx-auto mb-6' />
          <h1 className='text-4xl font-bold text-white mb-4'>
            Le Post Ayifumaneki
          </h1>
          <p className='text-zinc-400 mb-8 max-w-md mx-auto'>
            The story you're looking for doesn't exist or has been moved.
          </p>
          <Button asChild>
            <Link href='/blog'>Buyela kuMabali (Back to Stories)</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-black pt-24'>
      <article className='max-w-4xl mx-auto px-4'>
        {/* Featured Image */}
        {post.featured_image && (
          <div
            className='w-full h-[500px] rounded-xl bg-cover bg-center mb-12 shadow-2xl'
            style={{ backgroundImage: `url(${post.featured_image})` }}
          />
        )}

        {/* Title and Meta */}
        <header className='mb-12 text-center'>
          <h1 className='text-5xl md:text-6xl font-bold text-white mb-8 leading-tight'>
            {post.title}
          </h1>

          <div className='flex items-center justify-center mb-8'>
            <div className='flex items-center'>
              {post.profiles.avatar_url && (
                <div
                  className='w-12 h-12 rounded-full bg-cover bg-center mr-4 border-2 border-red-600'
                  style={{
                    backgroundImage: `url(${post.profiles.avatar_url})`,
                  }}
                />
              )}
              <div>
                <p className='text-white font-medium text-lg'>
                  {post.profiles.full_name || post.profiles.username}
                </p>
                <p className='text-zinc-400'>
                  {new Date(post.created_at).toLocaleDateString('en-ZA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          {post.excerpt && (
            <p className='text-xl text-zinc-400 max-w-2xl mx-auto'>
              {post.excerpt}
            </p>
          )}
        </header>

        {/* Media Section */}
        {(post.youtube_url || post.audio_url) && (
          <div className='mb-12 bg-zinc-900 rounded-xl p-6'>
            {post.youtube_url && (
              <div className='aspect-video mb-6'>
                <iframe
                  src={`https://www.youtube.com/embed/${
                    post.youtube_url.split('v=')[1]
                  }`}
                  className='w-full h-full rounded-lg'
                  allowFullScreen
                />
              </div>
            )}
            {post.audio_url && (
              <div className='bg-zinc-800 p-4 rounded-lg'>
                <audio controls className='w-full'>
                  <source src={post.audio_url} type='audio/mpeg' />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className='prose prose-invert prose-lg max-w-none mb-16'>
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className='text-4xl font-bold mt-12 mb-6'>{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className='text-3xl font-bold mt-10 mb-5'>{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className='text-2xl font-bold mt-8 mb-4'>{children}</h3>
              ),
              p: ({ children }) => (
                <p className='text-lg leading-relaxed mb-6 text-zinc-300'>
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className='list-disc pl-6 mb-6 space-y-2'>{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className='list-decimal pl-6 mb-6 space-y-2'>{children}</ol>
              ),
              li: ({ children }) => (
                <li className='text-zinc-300'>{children}</li>
              ),
              blockquote: ({ children }) => (
                <blockquote className='border-l-4 border-red-600 pl-4 italic my-6 text-zinc-400'>
                  {children}
                </blockquote>
              ),
              code: ({ children }) => (
                <code className='bg-zinc-800 text-zinc-300 px-2 py-1 rounded'>
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className='bg-zinc-800 p-4 rounded-lg overflow-x-auto mb-6'>
                  {children}
                </pre>
              ),
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        {/* Likes and Comments Section */}
        <div className='border-t border-zinc-800 pt-12 mb-12'>
          <div className='flex items-center space-x-6 mb-8'>
            <Button
              variant='ghost'
              size='lg'
              onClick={handleLike}
              className={`${
                likes.some((like) => like.user_id === user?.id)
                  ? 'text-red-500'
                  : ''
              } hover:bg-zinc-800`}
            >
              <Heart className='h-6 w-6 mr-2' />
              {likes.length} {likes.length === 1 ? 'Like' : 'Likes'}
            </Button>
            <Button variant='ghost' size='lg' className='hover:bg-zinc-800'>
              <MessageCircle className='h-6 w-6 mr-2' />
              {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
            </Button>
          </div>

          {/* Comments Section */}
          <div className='space-y-8'>
            <form onSubmit={handleComment} className='space-y-4'>
              <Textarea
                placeholder='Add a comment...'
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className='min-h-[120px] bg-zinc-900 border-zinc-800 focus:ring-red-600'
              />
              <Button
                type='submit'
                disabled={!user}
                className='bg-red-600 hover:bg-red-700'
              >
                Post Comment
              </Button>
            </form>

            <AnimatePresence>
              {comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className='bg-zinc-900 rounded-xl p-6'
                >
                  <div className='flex items-start space-x-4'>
                    {comment.profiles.avatar_url && (
                      <img
                        src={comment.profiles.avatar_url}
                        alt={comment.profiles.username}
                        className='w-10 h-10 rounded-full'
                      />
                    )}
                    <div className='flex-1'>
                      <div className='flex items-center justify-between mb-2'>
                        <p className='font-medium text-white'>
                          {comment.profiles.username}
                        </p>
                        <p className='text-sm text-zinc-500'>
                          {new Date(comment.created_at).toLocaleDateString(
                            'en-ZA',
                            {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </p>
                      </div>
                      <p className='text-zinc-300 leading-relaxed'>
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </article>
    </div>
  );
}
