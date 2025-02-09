'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordField } from '@/components/ui/password-field';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit() {
    setLoading(true);
    setError('');

    if (!isSupabaseConfigured()) {
      setError('Database connection not configured. Please connect to Supabase first.');
      setLoading(false);
      return;
    }


    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log(data, signInError)
  
      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.');
        } else {
          setError(signInError.message);
        }
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError('Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      // Check if user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setError('Error accessing your profile. Please try again.');
        setLoading(false);
        return;
      }
      console.log("routing to dash")
      router.push("/dashboard")
      console.log("done")
    } catch (err: any) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Ngena (Login)
          </h1>
          <p className="text-gray-400">
            Welcome back to Xhap
          </p>
        </div>

        <div  className="space-y-4">
          <div>
            <Input
              name="email"
              type="email"
              placeholder="Email"
              required
              className="w-full"
              aria-label="Email address"
              value={email}
              onChange={(e)=> setEmail(e.target.value)}
            />
          </div>
          <div>
            <PasswordField
              name="password"
              placeholder="Password"
              required
              className="w-full"
              aria-label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700"
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>

          <p className="text-center text-gray-400 text-sm">
            Don't have an account?{' '}
            <Link href="/register" className="text-red-500 hover:text-red-400">
              Qala Apha (Register)
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}