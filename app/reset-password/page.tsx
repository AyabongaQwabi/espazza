'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hashParams.get('access_token');
    if (accessToken) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          // If there's no session, use the access token to set the session
          supabase.auth.setSession({ access_token: accessToken });
        }
      });
    }
  }, [supabase.auth]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Your password has been reset successfully',
      });
      router.push('/login');
    }

    setLoading(false);
  };

  return (
    <div className='flex items-center justify-center min-h-screen bg-black'>
      <div className='w-full max-w-md p-8 space-y-6 bg-zinc-900 rounded-xl'>
        <h1 className='text-2xl font-bold text-center text-white'>
          Set New Password
        </h1>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <Label htmlFor='password'>New Password</Label>
            <Input
              id='password'
              type='password'
              placeholder='Enter your new password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type='submit' className='w-full' disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}
