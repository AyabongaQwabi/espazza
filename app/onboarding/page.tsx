'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function OnboardingRedirect() {
  const router = useRouter();

  useEffect(() => {
    async function checkOnboardingStatus() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('basic_info_complete')
        .eq('id', user.id)
        .single();

      if (!profile) {
        router.push('/login');
        return;
      }

      if (!profile.basic_info_complete) {
        router.push('/onboarding/basic-info');
      } else {
        router.push('/onboarding/media');
      }
    }

    checkOnboardingStatus();
  }, [router]);

  return (
    <div className='min-h-screen bg-zinc-900 flex items-center justify-center'>
      <p className='text-zinc-400'>Loading...</p>
    </div>
  );
}
