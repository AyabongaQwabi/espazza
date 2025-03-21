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
  AlertCircleIcon,
  InfoIcon,
  LockIcon,
  UploadIcon,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { format, startOfWeek, endOfWeek, isAfter, isBefore } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import ShortUniqueId from 'short-unique-id';

import * as textReadability from 'text-readability';

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
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );
  const uid = new ShortUniqueId({ length: 11 });

  // Hidden fields for engagement tracking
  const [views, setViews] = useState(0);
  const [shares, setShares] = useState(0);

  // Hidden field for AI score
  const [aiScore, setAiScore] = useState(0);
  const [analyzingContent, setAnalyzingContent] = useState(false);

  // Weekly post limit tracking
  const [weeklyPostCount, setWeeklyPostCount] = useState(0);
  const [weekStart, setWeekStart] = useState<Date | null>(null);
  const [weekEnd, setWeekEnd] = useState<Date | null>(null);
  const [reachedWeeklyLimit, setReachedWeeklyLimit] = useState(false);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [writerRecordId, setWriterRecordId] = useState<string | null>(null);

  // Add a new state variable for live score tracking
  const [liveScore, setLiveScore] = useState({
    score: 0,
    category: 'Not Analyzed',
    details: {},
  });

  // Audio upload progress
  const [audioUploadProgress, setAudioUploadProgress] = useState(0);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  // Cloudinary upload function
  const uploadToCloudinary = async (file: File) => {
    // Only run in browser environment
    if (typeof window === 'undefined') return '';

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

  // Check user's weekly post count on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      checkUserWeeklyPosts();
    }
  }, []);

  async function checkUserWeeklyPosts() {
    setLoadingUserData(true);
    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to create a post',
          variant: 'destructive',
        });
        router.push('/login');
        return;
      }

      // Get current date and week boundaries
      const today = new Date();
      const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 }); // Week starts on Monday
      const currentWeekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Week ends on Sunday

      // Format for display
      const formattedWeekStart = format(currentWeekStart, 'MMM dd, yyyy');
      const formattedWeekEnd = format(currentWeekEnd, 'MMM dd, yyyy');

      // Check if user has a record in blog_writers for the current week
      const { data: writerData, error: writerError } = await supabase
        .from('blog_writers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (writerError) throw writerError;

      let currentWeekRecord = null;
      let postsThisWeek = 0;

      if (writerData && writerData.length > 0) {
        const latestRecord = writerData[0];
        const recordWeekStart = new Date(latestRecord.week_start);
        const recordWeekEnd = new Date(latestRecord.week_end);

        // Check if the latest record is for the current week
        if (isAfter(today, recordWeekStart) && isBefore(today, recordWeekEnd)) {
          // This is the current week's record
          currentWeekRecord = latestRecord;
          postsThisWeek = latestRecord.posts_this_week || 0;
          setWriterRecordId(latestRecord.id);
        } else {
          // It's a new week, create a new record
          const { data: newRecord, error: newRecordError } = await supabase
            .from('blog_writers')
            .insert([
              {
                user_id: user.id,
                week_start: currentWeekStart.toISOString(),
                week_end: currentWeekEnd.toISOString(),
                posts_this_week: 0,
                posts_limit: 5,
                week_number: Math.ceil(today.getDate() / 7),
                month: today.getMonth() + 1,
                year: today.getFullYear(),
              },
            ])
            .select();

          if (newRecordError) throw newRecordError;

          currentWeekRecord = newRecord[0];
          postsThisWeek = 0;
          setWriterRecordId(currentWeekRecord.id);
        }
      } else {
        // No records found, create first record for this user
        const { data: newRecord, error: newRecordError } = await supabase
          .from('blog_writers')
          .insert([
            {
              user_id: user.id,
              week_start: currentWeekStart.toISOString(),
              week_end: currentWeekEnd.toISOString(),
              posts_this_week: 0,
              posts_limit: 5,
              week_number: Math.ceil(today.getDate() / 7),
              month: today.getMonth() + 1,
              year: today.getFullYear(),
            },
          ])
          .select();

        if (newRecordError) throw newRecordError;

        currentWeekRecord = newRecord[0];
        postsThisWeek = 0;
        setWriterRecordId(currentWeekRecord.id);
      }

      // Update state with weekly post information
      setWeeklyPostCount(postsThisWeek);
      setWeekStart(currentWeekStart);
      setWeekEnd(currentWeekEnd);
      setReachedWeeklyLimit(postsThisWeek >= 5);

      // Show toast if user is close to or at their limit
      if (postsThisWeek >= 4) {
        toast({
          title:
            postsThisWeek >= 5
              ? 'Weekly limit reached'
              : 'Almost at weekly limit',
          description:
            postsThisWeek >= 5
              ? `You've reached your limit of 5 posts for this week (${formattedWeekStart} - ${formattedWeekEnd}). Try again next week.`
              : `You have ${
                  5 - postsThisWeek
                } post remaining for this week (${formattedWeekStart} - ${formattedWeekEnd}).`,
          variant: postsThisWeek >= 5 ? 'destructive' : 'default',
        });
      }
    } catch (error: any) {
      console.error('Error checking weekly posts:', error);
      toast({
        title: 'Error checking weekly post limit',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingUserData(false);
    }
  }

  async function updateWeeklyPostCount() {
    if (!writerRecordId) return;

    try {
      // Increment the posts_this_week count
      const newCount = weeklyPostCount + 1;

      const { error } = await supabase
        .from('blog_writers')
        .update({ posts_this_week: newCount })
        .eq('id', writerRecordId);

      if (error) throw error;

      // Update local state
      setWeeklyPostCount(newCount);
      setReachedWeeklyLimit(newCount >= 5);
    } catch (error: any) {
      console.error('Error updating weekly post count:', error);
    }
  }

  async function handleSaveAsDraft() {
    await handleSubmit(false);
  }

  async function handlePublish() {
    await handleSubmit(true);
  }

  // Modify the calculateContentScore function to work with Markdown
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

  // Add a useEffect to update the live score when content changes
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

  async function handleSubmit(publish: boolean) {
    // Check if user has reached weekly limit
    if (reachedWeeklyLimit) {
      toast({
        title: 'Weekly limit reached',
        description:
          "You've reached your limit of 5 posts for this week. Try again next week.",
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('You need to log in first to drop this heat!');

      let audioUrl = '';
      if (audioFile) {
        try {
          setIsUploadingAudio(true);
          // Upload audio to Cloudinary
          audioUrl = await uploadToCloudinary(audioFile);
          setIsUploadingAudio(false);
        } catch (error) {
          setIsUploadingAudio(false);
          throw new Error('Failed to upload audio file. Please try again.');
        }
      }

      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Calculate content score
      toast({
        title: 'Analyzing your content',
        description: "We're evaluating your post quality...",
      });

      const { score, category, details } = calculateContentScore(content);
      setAiScore(score);

      // Show score classification to the user
      let scoreMessage = '';
      if (category === 'Quality Post (R80)') {
        scoreMessage =
          'Quality Post (R80) - Great work! Your post meets our highest quality standards.';
      } else if (category === 'Regular Post (R50)') {
        scoreMessage =
          'Regular Post (R50) - Good job! Your post meets our basic quality standards.';
      } else {
        scoreMessage =
          'Your post needs improvement to meet our quality standards.';
      }

      // Add details to the message
      scoreMessage += `\n\nDetails: ${details.wordCount} words, ${
        details.imageCount
      } images${details.hasVideo ? ', includes video' : ''}`;

      toast({
        title: `Content Score: ${score}`,
        description: scoreMessage,
      });

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
            views,
            shares,
            ai_score: score,
            category,
            content_details: details,
            week_start: weekStart?.toISOString(),
            week_end: weekEnd?.toISOString(),
            week_post_number: weeklyPostCount + 1,
          },
        ])
        .select();

      if (error) throw error;

      // Update the weekly post count in blog_writers table
      await updateWeeklyPostCount();

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

  // Format dates for display
  const formattedWeekStart = weekStart ? format(weekStart, 'MMM dd, yyyy') : '';
  const formattedWeekEnd = weekEnd ? format(weekEnd, 'MMM dd, yyyy') : '';

  // Calculate total upload progress
  const anyUploadsInProgress = Object.keys(uploadProgress).length > 0;
  const totalUploadProgress = anyUploadsInProgress
    ? Object.values(uploadProgress).reduce(
        (sum, progress) => sum + progress,
        0
      ) / Object.keys(uploadProgress).length
    : 0;

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
        <h1 className='text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 mb-2'>
          Write Your Next Post 🔥
        </h1>
        <p className='text-pink-200 mb-8'>
          Share your story with the South African music community
        </p>

        {loadingUserData ? (
          <div className='flex justify-center items-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500'></div>
            <span className='ml-3 text-pink-300'>
              Loading your account data...
            </span>
          </div>
        ) : reachedWeeklyLimit ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className='bg-red-900/40 p-8 rounded-xl border border-red-500/50 mb-6 text-center'
          >
            <LockIcon className='h-16 w-16 text-red-400 mx-auto mb-4' />
            <h2 className='text-2xl font-bold text-red-300 mb-2'>
              Weekly Post Limit Reached
            </h2>
            <p className='text-red-200 mb-4'>
              You've created 5 posts this week ({formattedWeekStart} -{' '}
              {formattedWeekEnd}).
            </p>
            <p className='text-red-200 mb-6'>
              Please check back next week to create more content.
            </p>
            <Button
              onClick={() => router.push('/dashboard/blog')}
              className='bg-red-600 hover:bg-red-700 text-white'
            >
              Return to Dashboard
            </Button>
          </motion.div>
        ) : (
          <div className='space-y-8'>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className='bg-purple-900/40 p-6 rounded-xl border border-purple-500/30 mb-6'
            >
              <Alert className='bg-transparent border-purple-500/30'>
                <AlertCircleIcon className='h-5 w-5 text-pink-400' />
                <AlertTitle className='text-lg font-medium text-pink-400 flex items-center gap-2'>
                  <InfoIcon className='h-5 w-5' /> Blog Submission Guidelines
                </AlertTitle>
                <AlertDescription className='text-pink-200 mt-2'>
                  <div className='bg-indigo-900/40 p-3 rounded-lg border border-indigo-500/30 mb-4'>
                    <p className='font-medium text-indigo-300'>
                      Weekly Post Limit: {weeklyPostCount}/5
                    </p>
                    <p className='text-indigo-300 text-sm'>
                      Current week: {formattedWeekStart} - {formattedWeekEnd}
                    </p>
                  </div>
                  <ul className='space-y-2'>
                    <li className='flex items-start'>
                      <span className='text-pink-400 mr-2'>•</span>
                      <span>Each user can post up to 5 times per week</span>
                    </li>
                    <li className='flex items-start'>
                      <span className='text-pink-400 mr-2'>•</span>
                      <span>
                        Posts are automatically categorized using our quality
                        scoring:
                        <ul className='ml-6 mt-1'>
                          <li className='flex items-start'>
                            <span className='text-indigo-400 mr-2'>◦</span>
                            <span>
                              Regular Post (R50): Meets basic quality standards
                            </span>
                          </li>
                          <li className='flex items-start'>
                            <span className='text-indigo-400 mr-2'>◦</span>
                            <span>
                              Quality Post (R80): Meets premium quality
                              standards
                            </span>
                          </li>
                        </ul>
                      </span>
                    </li>
                    <li className='flex items-start'>
                      <span className='text-pink-400 mr-2'>•</span>
                      <span>
                        Regular Post (R50) Criteria:
                        <ul className='ml-6 mt-1'>
                          <li className='flex items-start'>
                            <span className='text-indigo-400 mr-2'>◦</span>
                            <span>
                              Basic readability – No major grammar/spelling
                              errors
                            </span>
                          </li>
                          <li className='flex items-start'>
                            <span className='text-indigo-400 mr-2'>◦</span>
                            <span>
                              Minimum word count – At least 300-500 words
                            </span>
                          </li>
                          <li className='flex items-start'>
                            <span className='text-indigo-400 mr-2'>◦</span>
                            <span>
                              Relevant to eSpazza – Content must relate to the
                              platform's focus
                            </span>
                          </li>
                          <li className='flex items-start'>
                            <span className='text-indigo-400 mr-2'>◦</span>
                            <span>
                              Basic engagement – Some structure (intro, body,
                              conclusion)
                            </span>
                          </li>
                          <li className='flex items-start'>
                            <span className='text-indigo-400 mr-2'>◦</span>
                            <span>Basic media use – At least 1 image</span>
                          </li>
                        </ul>
                      </span>
                    </li>
                    <li className='flex items-start'>
                      <span className='text-pink-400 mr-2'>•</span>
                      <span>
                        Quality Post (R80) Criteria:
                        <ul className='ml-6 mt-1'>
                          <li className='flex items-start'>
                            <span className='text-indigo-400 mr-2'>◦</span>
                            <span>Higher word count – At least 700+ words</span>
                          </li>
                          <li className='flex items-start'>
                            <span className='text-indigo-400 mr-2'>◦</span>
                            <span>
                              In-depth research – Well-researched with
                              references, facts, or stats
                            </span>
                          </li>
                          <li className='flex items-start'>
                            <span className='text-indigo-400 mr-2'>◦</span>
                            <span>
                              Original insights – Unique perspective or fresh
                              take on a topic
                            </span>
                          </li>
                          <li className='flex items-start'>
                            <span className='text-indigo-400 mr-2'>◦</span>
                            <span>
                              High engagement potential – Thought-provoking,
                              encourages discussion
                            </span>
                          </li>
                          <li className='flex items-start'>
                            <span className='text-indigo-400 mr-2'>◦</span>
                            <span>
                              Well-structured – Clear headings, bullet points,
                              easy to skim
                            </span>
                          </li>
                          <li className='flex items-start'>
                            <span className='text-indigo-400 mr-2'>◦</span>
                            <span>
                              Visually appealing – Multiple images, maybe a
                              short embedded video
                            </span>
                          </li>
                        </ul>
                      </span>
                    </li>
                    <li className='flex items-start'>
                      <span className='text-pink-400 mr-2'>•</span>
                      <span>
                        Engagement tracking (views, shares) will be recorded but
                        won't determine payout
                      </span>
                    </li>
                  </ul>
                </AlertDescription>
              </Alert>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
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
                  Tell Your Story
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
                  This is where you spit your real thoughts
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
                        description:
                          'Could not upload image. Please try again.',
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
                onClick={handleSaveAsDraft}
                disabled={
                  loading ||
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
                  loading ||
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
                onClick={handlePublish}
                className='bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white'
                disabled={
                  loading ||
                  analyzingContent ||
                  anyUploadsInProgress ||
                  isUploadingAudio
                }
              >
                <SendIcon className='mr-2 h-4 w-4' />
                {loading ||
                analyzingContent ||
                anyUploadsInProgress ||
                isUploadingAudio
                  ? analyzingContent
                    ? 'Analyzing Content...'
                    : anyUploadsInProgress || isUploadingAudio
                    ? 'Uploading Files...'
                    : 'Dropping...'
                  : 'Drop This Heat 🔥'}
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
        )}
      </motion.div>
    </div>
  );
}
