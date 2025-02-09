'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MusicIcon, LayoutDashboardIcon, BookOpenIcon, LogOutIcon } from 'lucide-react';
import { useSupabase } from '@/components/providers/supabase-provider';
import { supabase } from '@/lib/supabase';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useSupabase();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Show only the children for onboarding pages
  if (pathname?.startsWith('/dashboard/onboarding')) {
    return children;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-zinc-950 border-r border-zinc-800">
        <div className="p-6">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" className="w-10 h-10 object-fit"/>
          </div>
        </div>
        <nav className="px-4 py-6">
          <ul className="space-y-2">
            <li>
              <Button
                asChild
                variant="ghost"
                className="w-full justify-start"
              >
                <Link href="/dashboard">
                  <LayoutDashboardIcon className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
            </li>
            <li>
              <Button
                asChild
                variant="ghost"
                className="w-full justify-start"
              >
                <Link href="/dashboard/blog">
                  <BookOpenIcon className="h-4 w-4 mr-2" />
                  Amabali (Stories)
                </Link>
              </Button>
            </li>
          </ul>
        </nav>
        <div className="absolute bottom-0 w-64 p-4 border-t border-zinc-800">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-red-500/10"
            onClick={handleLogout}
          >
            <LogOutIcon className="h-4 w-4 mr-2" />
            Phuma (Logout)
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}