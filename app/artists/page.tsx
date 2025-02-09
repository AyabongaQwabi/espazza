import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

async function getArtists() {
  const supabase = createServerComponentClient({ cookies });
  const { data: artists } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  
  return artists || [];
}

export default async function ArtistsPage() {
  const artists = await getArtists();

  return (
    <div className="min-h-screen bg-gray-900 pt-16">
      {/* Hero Section */}
      <div className="relative h-[40vh] flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url("/lxndi.jpg")',
          }}
        >
          <div className="absolute inset-0 bg-gray-900/90" />
        </div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Abaculi
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Discover Xhosa Hip Hop Artists
          </p>
        </div>
      </div>

      {/* Artists Grid */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {artists.map((artist) => (
            <div 
              key={artist.id}
              className="bg-zinc-950 rounded-lg overflow-hidden hover:bg-zinc-800 transition-colors"
            >
              <div 
                className="h-64 w-full bg-cover bg-center"
                style={{ 
                  backgroundImage: artist.profile_image_url 
                    ? `url(${artist.profile_image_url})`
                    : 'url("https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&q=80")'
                }}
              />
              <div className="p-6">
                <h2 className="text-xl font-semibold text-white mb-2">
                  {artist.artist_name || artist.username}
                </h2>
                {artist.artist_bio && (
                  <p className="text-gray-400 mb-4 line-clamp-2">{artist.artist_bio}</p>
                )}
                <Button asChild className="w-full">
                  <Link href={`/artists/${artist.username}`}>
                    Jonga Iprofayile
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Join as Artist CTA */}
        <div className="mt-20 text-center">
          <div className="inline-block p-8 bg-zinc-950 rounded-2xl">
            <UsersIcon className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Ngumrhapi? Yiba yiNxalenye!
            </h2>
            <p className="text-gray-400 mb-6 max-w-lg mx-auto">
              Are you a Xhosa Hip Hop artist? Join our platform to showcase your music and connect with fans.
            </p>
            <Button asChild size="lg" className="bg-red-600 hover:bg-red-700">
              <Link href="/register">Qala Apha</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}