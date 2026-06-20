const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

/**
 * Returns a Supabase image transform URL for card thumbnails.
 * Uses Supabase's built-in image resizing (backed by Imgproxy) to serve
 * smaller, lower-quality versions of storage images — reducing bandwidth
 * costs significantly for grid cards that don't need full resolution.
 *
 * Only applies to images stored in Supabase storage (same origin).
 * Passes external URLs (e.g. Cloudinary) through unchanged.
 *
 * @param url   Original storage URL
 * @param width Target width in px (height scales proportionally)
 * @param quality 1–100, defaults to 60 for thumbnails
 */
export function thumbUrl(
  url: string | null | undefined,
  width = 400,
  quality = 60
): string {
  if (!url) return '/placeholder.svg';

  // Only transform Supabase storage URLs for this project
  if (!url.includes(SUPABASE_URL) && !url.includes('supabase.co/storage')) {
    return url;
  }

  // Supabase image transform endpoint:
  // /storage/v1/render/image/public/<bucket>/<path>?width=&quality=&resize=contain
  const transformed = url.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/'
  );

  const separator = transformed.includes('?') ? '&' : '?';
  return `${transformed}${separator}width=${width}&quality=${quality}&resize=cover`;
}
