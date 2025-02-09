'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordField } from '@/components/ui/password-field';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function Register() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isSupabaseConfigured()) {
      setError('Database connection not configured. Please connect to Supabase first.');
      setLoading(false);
      return;
    }

    if (passwordStrength < 60) {
      setError('Please choose a stronger password');
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const username = formData.get('username') as string;

    try {
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        setError('Username can only contain letters, numbers, underscores, and hyphens');
        setLoading(false);
        return;
      }

      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('This email is already registered. Please login instead.');
          setLoading(false);
          return;
        }
        throw signUpError;
      }

      if (!user) {
        throw new Error('Failed to create user account');
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            username,
            email: user.email,
          }
        ]);

      if (profileError) {
        console.error('Profile creation failed:', profileError);
        await supabase.auth.signOut();
        throw new Error('Failed to create user profile. Please try again.');
      }

      router.push('/dashboard/onboarding/basic-info');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Qala Apha (Get Started)
          </h1>
          <p className="text-gray-400">
            Join the Xhosa Hip Hop community
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              name="username"
              type="text"
              placeholder="Username"
              required
              className="w-full"
              aria-label="Username"
              minLength={3}
              maxLength={30}
              pattern="^[a-zA-Z0-9_-]+$"
              title="Username can only contain letters, numbers, underscores, and hyphens"
            />
          </div>
          <div>
            <Input
              name="email"
              type="email"
              placeholder="Email"
              required
              className="w-full"
              aria-label="Email address"
            />
          </div>
          <div>
            <PasswordField
              name="password"
              placeholder="Password"
              required
              className="w-full"
              minLength={8}
              onStrengthChange={setPasswordStrength}
              aria-label="Password"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-500 text-sm">{error}</p>
              {error.includes('already registered') && (
                <Button
                  asChild
                  variant="link"
                  className="text-red-500 hover:text-red-400 p-0 h-auto mt-2"
                >
                  <Link href="/login">
                    Click here to login →
                  </Link>
                </Button>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </Button>

          <p className="text-center text-gray-400 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-red-500 hover:text-red-400">
              Ngena (Login)
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}