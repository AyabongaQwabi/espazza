'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ReactMarkdown from 'react-markdown';
import {
  MusicIcon,
  Heart,
  MessageCircle,
  Share2,
  Clock,
  Tag,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { DiscussionEmbed } from 'disqus-react';
import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
} from 'react-share';
import { FacebookIcon, TwitterIcon, LinkedinIcon } from 'react-share';

interface RelatedArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
}

interface BlogPostClientProps {
  post: any;
  relatedArticles: RelatedArticle[];
}

export default function BlogPostClient({
  post,
  relatedArticles,
}: BlogPostClientProps) {
  const [likes, setLikes] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [user, setUser] = useState<any>(null);
  const [showSignupPopup, setShowSignupPopup] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchLikes(post.id);
    fetchComments(post.id);
    checkAuth();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [post.id]);

  const handleScroll = () => {
    const scrollPercentage =
      (window.scrollY /
        (document.documentElement.scrollHeight - window.innerHeight)) *
      100;
    if (scrollPercentage > 50 && !user && !showSignupPopup) {
      setShowSignupPopup(true);
    }
  };

  async function checkAuth() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
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

  const estimatedReadingTime = () => {
    const wordsPerMinute = 200;
    const wordCount = post.content.trim().split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);
    return readingTime;
  };

  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: 'Link Copied',
      description: 'The link has been copied to your clipboard.',
    });
  };

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
            <p className='text-xl text-zinc-400 max-w-2xl mx-auto mb-6'>
              {post.excerpt}
            </p>
          )}

          <div className='flex items-center justify-center space-x-4 mb-8'>
            <div className='flex items-center text-zinc-400'>
              <Clock className='w-5 h-5 mr-2' />
              <span>{estimatedReadingTime()} min read</span>
            </div>
            <div className='flex items-center text-zinc-400'>
              <Tag className='w-5 h-5 mr-2' />
              <span>{post?.tags?.join(', ')}</span>
            </div>
          </div>

          <div className='flex justify-center space-x-4'>
            <FacebookShareButton url={window.location.href} quote={post.title}>
              <FacebookIcon size={32} round />
            </FacebookShareButton>
            <TwitterShareButton url={window.location.href} title={post.title}>
              <TwitterIcon size={32} round />
            </TwitterShareButton>
            <LinkedinShareButton url={window.location.href}>
              <LinkedinIcon size={32} round />
            </LinkedinShareButton>
            <Button onClick={copyLinkToClipboard} variant='outline' size='icon'>
              <Share2 className='h-4 w-4' />
            </Button>
            <Button
              onClick={() =>
                (window.location.href = `mailto:?subject=${encodeURIComponent(
                  post.title
                )}&body=${encodeURIComponent(window.location.href)}`)
              }
              variant='outline'
              size='icon'
            >
              <Mail className='h-4 w-4' />
            </Button>
          </div>
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

        {/* Call to Action */}
        <div className='bg-red-600 rounded-xl p-8 mb-12 text-center'>
          <h3 className='text-2xl font-bold text-white mb-4'>
            Enjoy this post?
          </h3>
          <p className='text-white mb-6'>
            Sign up for our newsletter to get more great content!
          </p>
          <Button asChild className='bg-white text-red-600 hover:bg-zinc-200'>
            <Link href='/register'>Sign Up Now</Link>
          </Button>
        </div>

        {/* Related Articles */}
        <div className='mb-12'>
          <h3 className='text-2xl font-bold text-white mb-6'>
            Related Articles
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {relatedArticles.map((article) => (
              <div key={article.id} className='bg-zinc-900 rounded-xl p-6'>
                <h4 className='text-xl font-bold text-white mb-2'>
                  {article.title}
                </h4>
                <p className='text-zinc-400 mb-4'>{article.excerpt}</p>
                <Link
                  href={`/blog/${article.slug}`}
                  className='text-red-600 hover:text-red-500'
                >
                  Read More
                </Link>
              </div>
            ))}
          </div>
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

          {/* Disqus Comments */}
          <DiscussionEmbed
            shortname='espazza'
            config={{
              url: window.location.href,
              identifier: post.id,
              title: post.title,
            }}
          />
        </div>
      </article>

      {/* Sign-up Popup */}
      <AnimatePresence>
        {showSignupPopup && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className='fixed bottom-4 right-4 bg-red-600 text-white p-6 rounded-xl shadow-lg'
          >
            <h3 className='text-xl font-bold mb-2'>Enjoying the content?</h3>
            <p className='mb-4'>
              Sign up now to get more great articles like this!
            </p>
            <div className='flex space-x-4'>
              <Button
                asChild
                className='bg-white text-red-600 hover:bg-zinc-200'
              >
                <Link href='/register'>Sign Up</Link>
              </Button>
              <Button
                variant='outline'
                onClick={() => setShowSignupPopup(false)}
              >
                Maybe Later
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
