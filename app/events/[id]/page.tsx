import EventClient from './EventClient';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL, PUBLISHER_LD, eventKeywords } from '@/lib/seo';

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

    const { data: event } = await supabase
      .from('events')
      .select('title, description, cover_image, event_date, location, venue')
      .eq('id', params.id)
      .single();

    if (!event) return { title: `Event Not Found | ${SITE_NAME}` };

    const description =
      event.description ||
      `${event.title} — a South African hip hop event${event.location ? ` in ${event.location}` : ''}. Get tickets and info on ${SITE_NAME}.`;
    const ogImage = event.cover_image || `${SITE_URL}/logo.png`;
    const url = `${SITE_URL}/events/${params.id}`;

    return {
      title: `${event.title} | ${SITE_NAME} Events`,
      description,
      keywords: eventKeywords(event.title, event.location),
      openGraph: {
        title: event.title,
        description,
        type: 'website',
        url,
        images: [{ url: ogImage, width: 1200, height: 630, alt: event.title }],
        siteName: SITE_NAME,
        locale: 'en_ZA',
      },
      twitter: {
        card: 'summary_large_image',
        title: event.title,
        description,
        images: [ogImage],
        site: '@espazza',
      },
      alternates: { canonical: url },
      robots: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    };
  } catch {
    return { title: SITE_NAME };
  }
}

export default async function EventPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', params.id)
    .single();

  const url = `${SITE_URL}/events/${params.id}`;

  const jsonLd = event
    ? {
        '@context': 'https://schema.org',
        '@type': 'MusicEvent',
        name: event.title,
        url,
        description: event.description || `${event.title} - South African hip hop event on ${SITE_NAME}.`,
        startDate: event.event_date,
        image: event.cover_image || `${SITE_URL}/logo.png`,
        location: event.venue || event.location
          ? {
              '@type': 'Place',
              name: event.venue || event.location,
              address: {
                '@type': 'PostalAddress',
                addressLocality: event.location || '',
                addressCountry: 'ZA',
              },
            }
          : {
              '@type': 'Place',
              name: 'South Africa',
              address: { '@type': 'PostalAddress', addressCountry: 'ZA' },
            },
        organizer: PUBLISHER_LD,
        inLanguage: 'en-ZA',
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <EventClient eventId={params.id} />
    </>
  );
}
