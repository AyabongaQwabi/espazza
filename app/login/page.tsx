'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    //setError("") //This line was causing an error, as 'setError' was not defined.  It's removed.

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      router.push('/dashboard');
    }

    setLoading(false);
  }

  async function handleMagicLinkLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setMagicLinkSent(true);
      toast({
        title: 'Success',
        description: 'Magic link sent to your email',
      });
    }

    setLoading(false);
  }

  return (
    <div className='min-h-screen bg-black flex items-center justify-center px-4'>
      <div className='max-w-md w-full'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-white mb-2'>Ngena (Login)</h1>
          <p className='text-gray-400'>Welcome back to Xhap</p>
        </div>

        {!magicLinkSent ? (
          <>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <Input
                  name='email'
                  type='email'
                  placeholder='Email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className='w-full'
                />
              </div>
              <div>
                <Input
                  name='password'
                  type='password'
                  placeholder='Password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className='w-full'
                />
              </div>

              <Button
                type='submit'
                className='w-full bg-red-600 hover:bg-red-700'
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>

            <div className='mt-4 text-center'>
              <Button
                variant='link'
                onClick={handleMagicLinkLogin}
                disabled={loading}
              >
                Login with Magic Link
              </Button>
            </div>

            <div className='mt-4 text-center'>
              <Link
                href='/forgot-password'
                className='text-red-500 hover:text-red-400'
              >
                Forgot Password?
              </Link>
            </div>

            <p className='text-center text-gray-400 text-sm mt-4'>
              Don't have an account?{' '}
              <Link
                href='/register'
                className='text-red-500 hover:text-red-400'
              >
                Qala Apha (Register)
              </Link>
            </p>
          </>
        ) : (
          <div className='text-center text-white'>
            <p>Magic link sent! Check your email to log in.</p>
            <Button onClick={() => setMagicLinkSent(false)} className='mt-4'>
              Back to Login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
