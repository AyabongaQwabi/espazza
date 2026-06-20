export const SITE_URL = 'https://espazza.xyz';
export const SITE_NAME = 'eSpazza';
export const SITE_DESCRIPTION =
  'eSpazza is South Africa\'s premier digital music platform dedicated to Xhosa hip hop and South African hip hop. Discover artists, stream releases, read music news, and support local SA music culture.';

export const BASE_KEYWORDS = [
  'South African hip hop',
  'Xhosa hip hop',
  'SA hip hop',
  'South African music',
  'Mzansi music',
  'SA rap',
  'Xhosa rap',
  'eSpazza',
  'South African artists',
  'local SA music',
  'township music',
  'kasi music',
];

export function artistKeywords(name: string, genre?: string | null, location?: string | null) {
  return [
    name,
    `${name} songs`,
    `${name} music`,
    `${name} rapper`,
    `${name} South Africa`,
    `${name} albums`,
    `${name} new music`,
    genre || 'hip hop',
    location ? `${location} rapper` : 'SA rapper',
    'South African hip hop artist',
    'Xhosa hip hop artist',
    'SA rapper',
    ...BASE_KEYWORDS,
  ].filter(Boolean);
}

export function releaseKeywords(
  title: string,
  artistName: string,
  genre?: string | null
) {
  return [
    title,
    artistName,
    `${title} ${artistName}`,
    `${artistName} album`,
    `${artistName} EP`,
    `${artistName} new release`,
    genre || 'hip hop',
    'South African hip hop',
    'Xhosa hip hop',
    'SA music release',
    'stream South African music',
    ...BASE_KEYWORDS,
  ].filter(Boolean);
}

export function blogKeywords(title: string) {
  return [
    title,
    'South African hip hop news',
    'SA music news',
    'Xhosa hip hop news',
    'Mzansi music blog',
    'SA rap news',
    ...BASE_KEYWORDS,
  ];
}

export function eventKeywords(title: string, location?: string | null) {
  return [
    title,
    'South African music event',
    'SA hip hop event',
    location ? `music event ${location}` : 'music event South Africa',
    'Mzansi concert',
    'SA rap show',
    ...BASE_KEYWORDS,
  ].filter(Boolean);
}

export const PUBLISHER_LD = {
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/logo.png`,
    width: 512,
    height: 512,
  },
  sameAs: [
    'https://twitter.com/espazza',
    'https://www.instagram.com/espazza',
  ],
};
