import ReleasePageClient from './ReleasePageClient';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SITE_NAME, SITE_URL, PUBLISHER_LD, releaseKeywords } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    const { data: release } = await supabase
      .from('releases')
      .select(`
        title, description, cover_image_url, release_date, tracks,
        genre:genres(name),
        record_owner:profiles(artist_name, username)
      `)
      .eq('short_unique_id', params.id)
      .single();

    if (!release) {
      return { title: `Release Not Found | ${SITE_NAME}` };
    }

    const artistName = release.record_owner?.artist_name || release.record_owner?.username || 'Unknown Artist';
    const trackCount = release.tracks?.length || 0;
    const description =
      release.description ||
      `Listen to ${release.title} by ${artistName}. ${trackCount} track${trackCount !== 1 ? 's' : ''} of South African hip hop music. Stream and download on ${SITE_NAME}.`;
    const ogImage = release.cover_image_url || `${SITE_URL}/logo.png`;
    const url = `${SITE_URL}/r/${params.id}`;

    return {
      title: `${release.title} by ${artistName} | ${SITE_NAME}`,
      description,
      keywords: releaseKeywords(release.title, artistName, release.genre?.name),
      openGraph: {
        title: `${release.title} by ${artistName}`,
        description,
        type: 'music.album',
        url,
        images: [{ url: ogImage, width: 1200, height: 1200, alt: `${release.title} album cover` }],
        siteName: SITE_NAME,
        locale: 'en_ZA',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${release.title} by ${artistName}`,
        description,
        images: [ogImage],
        creator: '@espazza',
        site: '@espazza',
      },
      alternates: { canonical: url },
      robots: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    };
  } catch {
    return { title: SITE_NAME };
  }
}

export default async function ReleasePage({
  params,
}: {
  params: { id: string };
}) {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: release, error: releaseError } = await supabase
    .from('releases')
    .select(`
      *,
      genre:genres(id, name),
      record_label:record_labels(name),
      record_owner:profiles(artist_name, username)
    `)
    .eq('short_unique_id', params.id)
    .single();

  if (releaseError || !release) notFound();

  const { data: relatedReleases } = await supabase
    .from('releases')
    .select('id, title, short_unique_id, cover_image_url, record_owner:profiles(artist_name, username)')
    .neq('id', release.id)
    .or(`record_owner.eq.${release.record_owner},genre_id.eq.${release.genre_id}`)
    .limit(4);

  const artistName = release.record_owner?.artist_name || release.record_owner?.username || 'Unknown Artist';
  const artistUrl = `${SITE_URL}/artists/${release.record_owner?.username}`;
  const trackCount = release.tracks?.length || 0;
  const totalPrice = release.tracks?.reduce((sum: number, t: any) => sum + (t.price || 0), 0) || 0;
  const ogImage = release.cover_image_url || `${SITE_URL}/logo.png`;
  const url = `${SITE_URL}/r/${params.id}`;
  const description =
    release.description ||
    `Listen to ${release.title} by ${artistName}. ${trackCount} tracks of South African hip hop. Stream and download on ${SITE_NAME}.`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicAlbum',
    name: release.title,
    url,
    image: ogImage,
    description,
    datePublished: release.release_date,
    genre: release.genre?.name || 'Hip Hop',
    numTracks: trackCount,
    byArtist: {
      '@type': 'MusicGroup',
      name: artistName,
      url: artistUrl,
    },
    offers: totalPrice > 0
      ? {
          '@type': 'Offer',
          price: totalPrice.toFixed(2),
          priceCurrency: 'ZAR',
          availability: 'https://schema.org/InStock',
          url,
        }
      : undefined,
    publisher: PUBLISHER_LD,
    inLanguage: 'en-ZA',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ReleasePageClient
        params={params}
        initialRelease={release}
        relatedReleases={relatedReleases || []}
      />
    </>
  );
}
