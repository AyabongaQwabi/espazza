import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ArtistPageClient from './ArtistPageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: artist } = await supabase
    .from('profiles')
    .select('artist_name, username, artist_bio, profile_image_url, genre, suburb, province')
    .eq('username', params.username)
    .single();

  if (!artist) {
    return { title: 'Artist Not Found | eSpazza' };
  }

  const name = artist.artist_name || artist.username;
  const description =
    artist.artist_bio ||
    `${name} is a South African hip hop artist${artist.suburb ? ` from ${artist.suburb}` : ''}. Discover their music, releases, and bookings on eSpazza.`;
  const image = artist.profile_image_url || 'https://espazza.xyz/logo.png';
  const url = `https://espazza.xyz/artists/${params.username}`;

  return {
    title: `${name} - South African Hip Hop Artist | eSpazza`,
    description,
    keywords: [
      name,
      'South African hip hop artist',
      'Xhosa hip hop',
      artist.genre || 'hip hop',
      artist.suburb || '',
      artist.province || '',
      'SA rapper',
      'eSpazza artist',
      `${name} music`,
      `${name} songs`,
      `${name} rapper`,
    ].filter(Boolean),
    openGraph: {
      type: 'profile',
      url,
      title: `${name} | eSpazza`,
      description,
      images: [{ url: image, width: 800, height: 800, alt: `${name} profile photo` }],
      siteName: 'eSpazza',
      locale: 'en_ZA',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} | eSpazza`,
      description,
      images: [image],
    },
    alternates: { canonical: url },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  };
}

export default async function ArtistPage({
  params,
}: {
  params: { username: string };
}) {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: artist } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', params.username)
    .single();

  if (!artist) notFound();

  const name = artist.artist_name || artist.username;
  const image = artist.profile_image_url || 'https://espazza.xyz/logo.png';
  const url = `https://espazza.xyz/artists/${params.username}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name,
    url,
    image,
    description:
      artist.artist_bio ||
      `${name} is a South African hip hop artist on eSpazza.`,
    genre: artist.genre || 'Hip Hop',
    foundingLocation: {
      '@type': 'Place',
      name: [artist.suburb, artist.province, 'South Africa'].filter(Boolean).join(', '),
    },
    sameAs: [
      artist.spotify_url,
      artist.youtube_url,
      artist.instagram_url,
      artist.twitter_url,
      artist.facebook_url,
      artist.tiktok_url,
    ].filter(Boolean),
    member: {
      '@type': 'Person',
      name,
      image,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArtistPageClient artist={artist} />
    </>
  );
}
