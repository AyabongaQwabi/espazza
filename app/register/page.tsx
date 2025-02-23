'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordField } from '@/components/ui/password-field';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ChromeIcon as Google } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { FcGoogle } from 'react-icons/fc';

export default function Register() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setError(
        'Database connection not configured. Please check your Supabase setup.'
      );
    }
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isSupabaseConfigured()) {
      setError(
        'Database connection not configured. Please connect to Supabase first.'
      );
      setLoading(false);
      return;
    }

    if (passwordStrength < 3) {
      setError('Please choose a stronger password');
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const username = formData.get('username') as string;

    try {
      // Validate username format
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        setError(
          'Username can only contain letters, numbers, underscores, and hyphens'
        );
        setLoading(false);
        return;
      }

      // Sign up user
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
            },
          },
        });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('This email is already registered. Please login instead.');
          setLoading(false);
          return;
        }
        throw signUpError;
      }

      if (!signUpData.user) {
        throw new Error('Failed to create user account');
      }

      // Wait for the session to be established
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Sign in the user to get a fresh session
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        console.log('signin error', signInError, signInData);
        throw new Error('Failed to establish session. Please try logging in.');
      }

      if (!signInData.session) {
        throw new Error('No session established after sign in');
      }

      // Create profile using the authenticated session
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: signUpData.user.id,
            username,
            email: signUpData.user.email,
          },
        ])
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation failed:', profileError);
        // Clean up by deleting the auth user if profile creation fails
        await supabase.auth.signOut();
        throw new Error(
          `Failed to create user profile: ${profileError.message}`
        );
      }

      // Redirect to user type selection page after successful registration
      router.push('/user-type-selection');
    } catch (err: any) {
      console.error('Registration error:', err);

      // Provide more specific error messages based on the error type
      if (err.message?.includes('row-level security')) {
        setError(
          'Unable to create profile. Please try again or contact support if the problem persists.'
        );
      } else if (err.message?.includes('network')) {
        setError(
          'Network error. Please check your internet connection and try again.'
        );
      } else if (err.message?.includes('session')) {
        setError('Authentication failed. Please try again or contact support.');
      } else {
        setError(
          err.message || 'An unexpected error occurred during registration'
        );
      }

      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
    }
  }

  return (
    <div className='min-h-screen bg-black flex items-center justify-center px-4'>
      <div className='max-w-md w-full'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-white mb-2'>
            Qala Apha (Get Started)
          </h1>
          <p className='text-gray-400'>Join the Xhosa Hip Hop community</p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <Input
              name='username'
              type='text'
              placeholder='Username'
              required
              className='w-full'
              aria-label='Username'
              minLength={3}
              maxLength={30}
              pattern='^[a-zA-Z0-9_-]+$'
              title='Username can only contain letters, numbers, underscores, and hyphens'
            />
          </div>
          <div>
            <Input
              name='email'
              type='email'
              placeholder='Email'
              required
              className='w-full'
              aria-label='Email address'
            />
          </div>
          <div>
            <PasswordField
              name='password'
              placeholder='Password'
              required
              className='w-full'
              minLength={8}
              onStrengthChange={setPasswordStrength}
              aria-label='Password'
            />
          </div>

          {error && (
            <div className='bg-red-500/10 border border-red-500/50 rounded-lg p-4'>
              <p className='text-red-500 text-sm'>{error}</p>
              {error.includes('already registered') && (
                <Button
                  asChild
                  variant='link'
                  className='text-red-500 hover:text-red-400 p-0 h-auto mt-2'
                >
                  <Link href='/login'>Click here to login →</Link>
                </Button>
              )}
            </div>
          )}

          <Button
            type='submit'
            className='w-full bg-red-600 hover:bg-red-700'
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </Button>

          <div className='relative my-6'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-t border-gray-700'></div>
            </div>
            <div className='relative flex justify-center text-sm'>
              <span className='px-2 text-gray-400 bg-black'>or</span>
            </div>
          </div>

          <Button
            type='button'
            variant='outline'
            className='w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 hover:text-red-500 text-black'
            onClick={handleGoogleSignUp}
            disabled={loading}
          >
            <FcGoogle className='w-5 h-5' />
            Register with Google
          </Button>

          <p className='text-center text-gray-400 text-sm'>
            Already have an account?{' '}
            <Link href='/login' className='text-red-500 hover:text-red-400'>
              Ngena (Login)
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
