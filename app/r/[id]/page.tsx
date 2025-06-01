import ReleasePageClient from './ReleasePageClient';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

// This makes the page dynamic
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Define the generateMetadata function for SEO
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({
      cookies: () => cookieStore,
    });

    const { data: release, error } = await supabase
      .from('releases')
      .select(
        `
        *,
        genre:genres(id, name),
        record_label:record_labels(name),
        record_owner:profiles(artist_name, username),
        tracks(id, title, price)
      `
      )
      .eq('short_unique_id', params.id)
      .single();

    if (error) {
      console.error('Metadata fetch error:', error);
      return {
        title: 'Espazza',
        description: 'Discover and stream the latest hip-hop releases',
      };
    }

    if (!release) {
      return {
        title: 'Release Not Found | Espazza',
        description: 'The requested release could not be found.',
      };
    }

    const artistName =
      release.record_owner.artist_name || release.record_owner.username;
    const releaseYear = new Date(release.release_date).getFullYear();
    const trackCount = release.tracks?.length || 0;
    const totalPrice =
      release.tracks?.reduce(
        (sum: number, track: any) => sum + (track.price || 0),
        0
      ) || 0;

    const description =
      release.description ||
      `Listen to ${release.title} by ${artistName}. ${trackCount} tracks of pure hip-hop music. Available now on Espazza.`;

    const ogImage = release.cover_image_url || '/default-release-og.jpg';

    return {
      title: `${release.title} by ${artistName} | Espazza`,
      description: description,
      keywords: [
        release.title,
        artistName,
        'hip-hop',
        'music',
        'album',
        'south african music',
        release.genre?.name || 'hip-hop',
        'stream music',
        'buy music',
      ].join(', '),
      openGraph: {
        title: `${release.title} by ${artistName}`,
        description: description,
        type: 'music.album',
        url: `/releases/${params.id}`,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 1200,
            alt: `${release.title} album cover`,
          },
        ],
        siteName: 'Espazza',
        locale: 'en_ZA',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${release.title} by ${artistName}`,
        description: description,
        images: [ogImage],
        creator: '@espazzamusic',
      },
      alternates: {
        canonical: `/releases/${params.id}`,
      },
      robots: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
      other: {
        // Music-specific meta tags
        'music:duration': release.tracks?.length
          ? `${release.tracks.length} tracks`
          : undefined,
        'music:album': release.title,
        'music:musician': artistName,
        'music:release_date': release.release_date,
        'music:genre': release.genre?.name,
        // Schema.org structured data
        'application/ld+json': JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'MusicAlbum',
          name: release.title,
          byArtist: {
            '@type': 'MusicGroup',
            name: artistName,
          },
          datePublished: release.release_date,
          genre: release.genre?.name || 'Hip Hop',
          image: ogImage,
          description: description,
          numTracks: trackCount,
          offers: {
            '@type': 'Offer',
            price: totalPrice.toFixed(2),
            priceCurrency: 'ZAR',
            availability: 'https://schema.org/InStock',
          },
          publisher: {
            '@type': 'Organization',
            name: 'Espazza',
            url: 'https://espazza.co.za',
          },
        }),
      },
    };
  } catch (error) {
    console.error('Metadata generation error:', error);
    return {
      title: 'Espazza',
      description: 'Discover and stream the latest hip-hop releases',
    };
  }
}

export default async function ReleasePage({
  params,
}: {
  params: { id: string };
}) {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({
      cookies: () => cookieStore,
    });

    const { data: release, error: releaseError } = await supabase
      .from('releases')
      .select(
        `
        *,
        genre:genres(id, name),
        record_label:record_labels(name),
        record_owner:profiles(artist_name, username)
      `
      )
      .eq('short_unique_id', params.id)
      .single();

    if (releaseError) {
      console.error('Release fetch error:', releaseError);
      throw new Error('Failed to fetch release');
    }

    if (!release) {
      notFound();
    }

    // Fetch related releases by the same artist or genre
    const { data: relatedReleases, error: relatedError } = await supabase
      .from('releases')
      .select(
        'id, title, short_unique_id, cover_image_url, record_owner:profiles(artist_name, username)'
      )
      .neq('id', release.id)
      .or(
        `record_owner.eq.${release.record_owner},genre_id.eq.${release.genre_id}`
      )
      .limit(4);

    if (relatedError) {
      console.error('Related releases fetch error:', relatedError);
    }

    return (
      <ReleasePageClient
        params={params}
        initialRelease={release}
        relatedReleases={relatedReleases || []}
      />
    );
  } catch (error) {
    console.error('Page render error:', error);
    throw error; // Let Next.js handle the error
  }
}
