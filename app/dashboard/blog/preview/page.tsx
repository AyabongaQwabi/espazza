'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

export default function PreviewBlogPost() {
  const [post, setPost] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const storedPost = localStorage.getItem('previewPost');
    if (storedPost) {
      setPost(JSON.parse(storedPost));
    }
  }, []);

  if (!post) {
    return <div className='p-8'>No preview data available.</div>;
  }

  return (
    <div className='p-8 max-w-4xl mx-auto'>
      <h1 className='text-3xl font-bold text-white mb-4'>{post.title}</h1>
      {post.featuredImage && (
        <img
          src={post.featuredImage || '/placeholder.svg'}
          alt='Featured'
          className='w-full h-64 object-cover rounded-lg mb-6'
        />
      )}
      <div className='text-gray-400 mb-6'>{post.excerpt}</div>
      <div className='prose prose-invert max-w-none'>
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>
      <div className='mt-8'>
        <Button onClick={() => router.back()}>Back to Editor</Button>
      </div>
    </div>
  );
}
