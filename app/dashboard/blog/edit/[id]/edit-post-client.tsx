'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
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
  UploadIcon,
  PencilIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import ShortUniqueId from 'short-unique-id';
import * as textReadability from 'text-readability';

export default function EditBlogPost({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFileName, setAudioFileName] = useState('');
  const [published, setPublished] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [audioUploadProgress, setAudioUploadProgress] = useState(0);
  const [analyzingContent, setAnalyzingContent] = useState(false);
  const [liveScore, setLiveScore] = useState({
    score: 0,
    category: 'Not Analyzed',
    details: {},
  });
  const uid = new ShortUniqueId({ length: 11 });

  // Cloudinary upload function
  const uploadToCloudinary = async (file: File) => {
    const fileId = uid.rnd();
    setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'espazza_images'); // Replace with your unsigned upload preset

    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round(
            (event.loaded / event.total) * 100
          );
          setUploadProgress((prev) => ({ ...prev, [fileId]: percentComplete }));
        }
      });

      return new Promise<string>((resolve, reject) => {
        xhr.open(
          'POST',
          'https://api.cloudinary.com/v1_1/espazza/image/upload'
        );

        xhr.onload = () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            setUploadProgress((prev) => {
              const newProgress = { ...prev };
              delete newProgress[fileId];
              return newProgress;
            });
            resolve(response.secure_url);
          } else {
            reject(new Error('Upload failed'));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Upload failed'));
        };

        xhr.send(formData);
      });
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      setUploadProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[fileId];
        return newProgress;
      });
      throw error;
    }
  };

  // Calculate content score
  function calculateContentScore(
    content: string,
    isLiveUpdate = false
  ): { score: number; category: string; details: any } {
    if (!isLiveUpdate) {
      setAnalyzingContent(true);
    }

    try {
      // For Markdown content analysis
      const plainText = content;
      const wordCount = plainText
        .split(/\s+/)
        .filter((word) => word.length > 0).length;

      // Count images in Markdown content (![alt](url) syntax)
      const imageCount = (content.match(/!\[.*?\]$$.*?$$/g) || []).length;

      // Check if there's a featured image
      const hasFeaturedImage = !!featuredImage;

      // Total image count (content + featured)
      const totalImageCount = imageCount + (hasFeaturedImage ? 1 : 0);

      // Check for embedded video
      const hasVideo =
        !!youtubeUrl ||
        content.includes('youtube.com') ||
        content.includes('vimeo.com') ||
        content.includes('<iframe');

      // Check for Markdown headings
      const hasHeadings = /^#{1,3}\s+.+$/m.test(content);

      // Check for Markdown bullet points or numbered lists
      const hasBullets = /^(\s*[-*+]|\s*\d+\.)\s+.+$/m.test(content);

      // Check for Markdown links
      const hasLinks =
        /\[.+?\]$$.+?$$/.test(content) ||
        content.includes('http://') ||
        content.includes('https://');

      // Check for basic structure (paragraphs with empty lines between them)
      const paragraphs = content
        .split(/\n\s*\n/)
        .filter((p) => p.trim().length > 0).length;
      const hasBasicStructure = paragraphs >= 3;

      // Check for readability
      let readabilityScore = 8; // Default to grade 8 as fallback
      try {
        if (plainText && plainText.trim().length > 50) {
          readabilityScore = textReadability.fleschKincaidGrade(plainText);
        }
      } catch (readabilityError) {
        console.error('Error calculating readability score:', readabilityError);
      }
      const isReadable = readabilityScore <= 12; // Grade 12 or lower is considered readable

      // Check for engagement elements (questions, calls to action)
      const hasQuestions = plainText.includes('?');
      const hasCTA =
        plainText.toLowerCase().includes('comment') ||
        plainText.toLowerCase().includes('share') ||
        plainText.toLowerCase().includes('let me know') ||
        plainText.toLowerCase().includes('what do you think');

      // Calculate scores for each criterion
      const details = {
        wordCount,
        imageCount: totalImageCount,
        hasVideo,
        hasHeadings,
        hasBullets,
        hasLinks,
        hasBasicStructure,
        isReadable,
        hasQuestions,
        hasCTA,
        readabilityScore,
      };

      // Determine if it meets R50 criteria
      const meetsR50Criteria =
        isReadable && // Basic readability
        wordCount >= 300 && // Minimum word count
        hasBasicStructure && // Basic engagement
        totalImageCount >= 1; // Basic media use

      // Determine if it meets R80 criteria
      const meetsR80Criteria =
        wordCount >= 700 && // Higher word count
        hasLinks && // In-depth research with references
        (hasQuestions || hasCTA) && // High engagement potential
        hasHeadings &&
        hasBullets && // Well-structured
        (totalImageCount >= 2 || hasVideo); // Visually appealing

      // Calculate final score (0-100)
      let score = 0;

      // Word count score (0-25)
      if (wordCount >= 700) score += 25;
      else if (wordCount >= 500) score += 20;
      else if (wordCount >= 300) score += 15;
      else score += Math.min((wordCount / 300) * 15, 15);

      // Structure score (0-25)
      let structureScore = 0;
      if (hasHeadings) structureScore += 10;
      if (hasBullets) structureScore += 8;
      if (hasBasicStructure) structureScore += 7;
      score += Math.min(structureScore, 25);

      // Media score (0-20)
      let mediaScore = 0;
      mediaScore += totalImageCount * 7;
      if (hasVideo) mediaScore += 10;
      score += Math.min(mediaScore, 20);

      // Engagement score (0-15)
      let engagementScore = 0;
      if (hasQuestions) engagementScore += 7;
      if (hasCTA) engagementScore += 8;
      score += Math.min(engagementScore, 15);

      // Research score (0-15)
      let researchScore = 0;
      if (hasLinks) researchScore += 15;
      score += Math.min(researchScore, 15);

      // Determine category based on criteria
      let category;
      if (meetsR80Criteria) {
        category = 'Quality Post (R80)';
      } else if (meetsR50Criteria) {
        category = 'Regular Post (R50)';
      } else {
        category = 'Below Standards';
      }

      return { score, category, details };
    } catch (error) {
      console.error('Error calculating content score:', error);
      return { score: 0, category: 'Error', details: {} };
    } finally {
      if (!isLiveUpdate) {
        setAnalyzingContent(false);
      }
    }
  }

  // Update live score when content changes
  useEffect(() => {
    // Debounce the score calculation to avoid excessive calculations
    const timer = setTimeout(() => {
      if (content.trim().length > 0) {
        const result = calculateContentScore(content, true);
        setLiveScore(result);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [content, featuredImage, youtubeUrl]);

  useEffect(() => {
    async function fetchPost() {
      try {
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
          return;
        }

        if (data) {
          setTitle(data.title || '');
          setContent(data.content || '');
          setExcerpt(data.excerpt || '');
          setFeaturedImage(data.featured_image || '');
          setYoutubeUrl(data.youtube_url || '');
          setAudioUrl(data.audio_url || '');
          setPublished(data.published || false);

          // Calculate initial score
          if (data.content) {
            const result = calculateContentScore(data.content, true);
            setLiveScore(result);
          }
        }
      } catch (err: any) {
        toast({
          title: 'Error',
          description: err.message,
          variant: 'destructive',
        });
        router.push('/dashboard/blog');
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [params.id, router]);

  async function handleSave(publish: boolean) {
    setSaving(true);

    try {
      let audioUploadUrl = audioUrl;

      // Upload new audio file if selected
      if (audioFile) {
        try {
          setIsUploadingAudio(true);
          audioUploadUrl = await uploadToCloudinary(audioFile);
          setIsUploadingAudio(false);
        } catch (error) {
          setIsUploadingAudio(false);
          throw new Error('Failed to upload audio file. Please try again.');
        }
      }

      // Calculate content score
      const { score, category, details } = calculateContentScore(content);

      const { error } = await supabase
        .from('blog_posts')
        .update({
          title,
          content,
          excerpt,
          featured_image: featuredImage,
          youtube_url: youtubeUrl,
          audio_url: audioUploadUrl,
          published: publish,
          ai_score: score,
          category,
          content_details: details,
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
      setSaving(false);
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
        audioUrl,
      })
    );
    window.open('/dashboard/blog/preview', '_blank');
  }

  async function handleAudioFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    if (file) {
      setAudioFile(file);
      setAudioFileName(file.name);
    } else {
      setAudioFile(null);
      setAudioFileName('');
    }
  }

  // Calculate total upload progress
  const anyUploadsInProgress = Object.keys(uploadProgress).length > 0;
  const totalUploadProgress = anyUploadsInProgress
    ? Object.values(uploadProgress).reduce(
        (sum, progress) => sum + progress,
        0
      ) / Object.keys(uploadProgress).length
    : 0;

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 pt-6 pb-20 flex items-center justify-center'>
        <div className='bg-gray-900/60 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-500/20 p-8 max-w-md mx-auto text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto mb-4'></div>
          <p className='text-pink-200 text-lg'>Loading your post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 pt-6 pb-20'>
      {anyUploadsInProgress && (
        <div className='fixed top-0 left-0 right-0 z-50 bg-gray-900/80 p-2'>
          <div className='max-w-md mx-auto'>
            <p className='text-white text-sm mb-1 flex items-center'>
              <UploadIcon className='h-4 w-4 mr-2 animate-pulse' />
              Uploading files... {Math.round(totalUploadProgress)}%
            </p>
            <Progress value={totalUploadProgress} className='h-2' />
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='p-8 max-w-4xl mx-auto bg-gray-900/60 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-500/20'
      >
        <h1 className='text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 mb-2 flex items-center'>
          <PencilIcon className='mr-2 h-6 w-6 text-pink-400' />
          Edit Your Post
        </h1>
        <p className='text-pink-200 mb-8'>Make your content even better</p>

        <div className='space-y-8'>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className='bg-gray-800/50 p-6 rounded-xl border border-purple-500/20'
          >
            <label className='block text-lg font-medium text-pink-400 mb-2 flex items-center'>
              <FileTextIcon className='mr-2 h-5 w-5' />
              Post Title
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
            transition={{ duration: 0.3, delay: 0.1 }}
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
            transition={{ duration: 0.3, delay: 0.2 }}
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
              uploadFunction={uploadToCloudinary}
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
              transition={{ duration: 0.3, delay: 0.3 }}
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
              transition={{ duration: 0.3, delay: 0.4 }}
              className='bg-gray-800/50 p-6 rounded-xl border border-purple-500/20'
            >
              <label className='block text-lg font-medium text-pink-400 mb-2 flex items-center'>
                <MicIcon className='mr-2 h-5 w-5 text-purple-400' />
                Audio Track
              </label>
              <p className='text-gray-400 text-sm mb-4'>
                {audioUrl
                  ? 'Current audio track uploaded'
                  : 'Share your latest track or freestyle'}
              </p>
              <div className='relative'>
                {audioUrl && (
                  <div className='mb-3 p-2 bg-gray-700/50 rounded-lg border border-purple-500/30 flex justify-between items-center'>
                    <span className='text-sm text-white truncate max-w-[200px]'>
                      {audioUrl.split('/').pop() || 'Audio file'}
                    </span>
                    <Button
                      variant='destructive'
                      size='sm'
                      className='h-7 px-2'
                      onClick={() => setAudioUrl('')}
                    >
                      Remove
                    </Button>
                  </div>
                )}
                <Input
                  type='file'
                  accept='audio/mpeg'
                  onChange={handleAudioFileChange}
                  className='w-full bg-gray-700/50 border-purple-500/30 focus:border-pink-500 text-white'
                />
                {audioFileName && (
                  <p className='mt-2 text-sm text-green-400 flex items-center'>
                    <span className='mr-2'>✓</span> {audioFileName} (New)
                  </p>
                )}
                {isUploadingAudio && (
                  <div className='mt-2'>
                    <p className='text-xs text-indigo-300 mb-1'>
                      Uploading audio...
                    </p>
                    <Progress value={audioUploadProgress} className='h-1' />
                  </div>
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
            <div className='flex justify-between items-center mb-2'>
              <label className='block text-lg font-medium text-pink-400'>
                Content
              </label>
              <div className='flex items-center space-x-2'>
                <span className='text-sm text-gray-300'>Post Score:</span>
                <div className='w-32 h-6 bg-gray-700 rounded-full overflow-hidden'>
                  <div
                    className={`h-full ${
                      liveScore.score >= 80
                        ? 'bg-green-500'
                        : liveScore.score >= 50
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${liveScore.score}%` }}
                  ></div>
                </div>
                <span className='text-sm font-medium text-gray-300'>
                  {liveScore.score}
                </span>
              </div>
            </div>
            <div className='flex justify-between items-center mb-4'>
              <p className='text-gray-400 text-sm'>
                Share your story with the world
              </p>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  liveScore.category === 'Quality Post (R80)'
                    ? 'bg-green-900/50 text-green-300'
                    : liveScore.category === 'Regular Post (R50)'
                    ? 'bg-yellow-900/50 text-yellow-300'
                    : 'bg-red-900/50 text-red-300'
                }`}
              >
                {liveScore.category}
              </span>
            </div>
            <div className='bg-gray-700/50 rounded-lg overflow-hidden'>
              <Editor
                value={content}
                onChange={setContent}
                onImageUpload={async (file: File) => {
                  try {
                    // Use Cloudinary instead of Supabase
                    const imageUrl = await uploadToCloudinary(file);
                    return imageUrl;
                  } catch (error) {
                    console.error('Error uploading image:', error);
                    toast({
                      title: 'Image upload failed',
                      description: 'Could not upload image. Please try again.',
                      variant: 'destructive',
                    });
                    throw error;
                  }
                }}
              />
            </div>

            {/* Live score details */}
            {content.trim().length > 0 && (
              <div className='mt-4 bg-gray-900/60 p-4 rounded-lg border border-purple-500/20'>
                <h4 className='text-sm font-medium text-pink-400 mb-2'>
                  Content Analysis
                </h4>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                  <div className='bg-gray-800/50 p-2 rounded'>
                    <p className='text-xs text-gray-400'>Words</p>
                    <p
                      className={`text-sm font-medium ${
                        liveScore.details?.wordCount >= 500
                          ? 'text-green-400'
                          : liveScore.details?.wordCount >= 300
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}
                    >
                      {liveScore.details?.wordCount || 0}
                    </p>
                  </div>
                  <div className='bg-gray-800/50 p-2 rounded'>
                    <p className='text-xs text-gray-400'>Images</p>
                    <p
                      className={`text-sm font-medium ${
                        liveScore.details?.imageCount >= 2
                          ? 'text-green-400'
                          : liveScore.details?.imageCount >= 1
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}
                    >
                      {liveScore.details?.imageCount || 0}
                    </p>
                  </div>
                  <div className='bg-gray-800/50 p-2 rounded'>
                    <p className='text-xs text-gray-400'>Structure</p>
                    <p
                      className={`text-sm font-medium ${
                        liveScore.details?.hasHeadings &&
                        liveScore.details?.hasBullets
                          ? 'text-green-400'
                          : liveScore.details?.hasBasicStructure
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}
                    >
                      {liveScore.details?.hasHeadings &&
                      liveScore.details?.hasBullets
                        ? 'Great'
                        : liveScore.details?.hasBasicStructure
                        ? 'Basic'
                        : 'Needs Work'}
                    </p>
                  </div>
                  <div className='bg-gray-800/50 p-2 rounded'>
                    <p className='text-xs text-gray-400'>Engagement</p>
                    <p
                      className={`text-sm font-medium ${
                        liveScore.details?.hasQuestions &&
                        liveScore.details?.hasCTA
                          ? 'text-green-400'
                          : liveScore.details?.hasQuestions ||
                            liveScore.details?.hasCTA
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}
                    >
                      {liveScore.details?.hasQuestions &&
                      liveScore.details?.hasCTA
                        ? 'High'
                        : liveScore.details?.hasQuestions ||
                          liveScore.details?.hasCTA
                        ? 'Medium'
                        : 'Low'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className='flex flex-wrap gap-4 pt-4'
          >
            <Button
              onClick={() => handleSave(false)}
              disabled={
                saving ||
                analyzingContent ||
                anyUploadsInProgress ||
                isUploadingAudio
              }
              className='bg-indigo-600 hover:bg-indigo-700 text-white'
            >
              <SaveIcon className='mr-2 h-4 w-4' />
              Save as Draft
            </Button>
            <Button
              onClick={handlePreview}
              disabled={
                saving ||
                analyzingContent ||
                anyUploadsInProgress ||
                isUploadingAudio
              }
              className='bg-purple-600 hover:bg-purple-700 text-white'
            >
              <EyeIcon className='mr-2 h-4 w-4' />
              Preview
            </Button>
            <Button
              onClick={() => handleSave(true)}
              className='bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white'
              disabled={
                saving ||
                analyzingContent ||
                anyUploadsInProgress ||
                isUploadingAudio
              }
            >
              <SendIcon className='mr-2 h-4 w-4' />
              {saving ||
              analyzingContent ||
              anyUploadsInProgress ||
              isUploadingAudio
                ? analyzingContent
                  ? 'Analyzing Content...'
                  : anyUploadsInProgress || isUploadingAudio
                  ? 'Uploading Files...'
                  : 'Saving...'
                : published
                ? 'Update Post'
                : 'Publish Post'}
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
