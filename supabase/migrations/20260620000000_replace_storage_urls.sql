-- Migration: Replace old Supabase project storage URLs with new project URLs
-- Old: https://ohrqizehefkjgqnqutlf.supabase.co
-- New: https://ddmczupqwlpnplwjeykf.supabase.co

-- beats.file_url
UPDATE public.beats
SET file_url = REPLACE(file_url, 'https://ohrqizehefkjgqnqutlf.supabase.co', 'https://ddmczupqwlpnplwjeykf.supabase.co')
WHERE file_url LIKE '%ohrqizehefkjgqnqutlf.supabase.co%';

-- blog_posts.featured_image
UPDATE public.blog_posts
SET featured_image = REPLACE(featured_image, 'https://ohrqizehefkjgqnqutlf.supabase.co', 'https://ddmczupqwlpnplwjeykf.supabase.co')
WHERE featured_image LIKE '%ohrqizehefkjgqnqutlf.supabase.co%';

-- blog_posts.audio_url
UPDATE public.blog_posts
SET audio_url = REPLACE(audio_url, 'https://ohrqizehefkjgqnqutlf.supabase.co', 'https://ddmczupqwlpnplwjeykf.supabase.co')
WHERE audio_url LIKE '%ohrqizehefkjgqnqutlf.supabase.co%';

-- events.cover_image
UPDATE public.events
SET cover_image = REPLACE(cover_image, 'https://ohrqizehefkjgqnqutlf.supabase.co', 'https://ddmczupqwlpnplwjeykf.supabase.co')
WHERE cover_image LIKE '%ohrqizehefkjgqnqutlf.supabase.co%';

-- playlist_tracks.cover_image_url
UPDATE public.playlist_tracks
SET cover_image_url = REPLACE(cover_image_url, 'https://ohrqizehefkjgqnqutlf.supabase.co', 'https://ddmczupqwlpnplwjeykf.supabase.co')
WHERE cover_image_url LIKE '%ohrqizehefkjgqnqutlf.supabase.co%';

-- playlist_tracks.url (audio track URL)
UPDATE public.playlist_tracks
SET url = REPLACE(url, 'https://ohrqizehefkjgqnqutlf.supabase.co', 'https://ddmczupqwlpnplwjeykf.supabase.co')
WHERE url LIKE '%ohrqizehefkjgqnqutlf.supabase.co%';

-- playlists.cover_image_url
UPDATE public.playlists
SET cover_image_url = REPLACE(cover_image_url, 'https://ohrqizehefkjgqnqutlf.supabase.co', 'https://ddmczupqwlpnplwjeykf.supabase.co')
WHERE cover_image_url LIKE '%ohrqizehefkjgqnqutlf.supabase.co%';

-- podcasters.profile_image_url
UPDATE public.podcasters
SET profile_image_url = REPLACE(profile_image_url, 'https://ohrqizehefkjgqnqutlf.supabase.co', 'https://ddmczupqwlpnplwjeykf.supabase.co')
WHERE profile_image_url LIKE '%ohrqizehefkjgqnqutlf.supabase.co%';

-- products.images (text[] array)
UPDATE public.products
SET images = ARRAY(
  SELECT REPLACE(url, 'https://ohrqizehefkjgqnqutlf.supabase.co', 'https://ddmczupqwlpnplwjeykf.supabase.co')
  FROM unnest(images) AS url
)
WHERE images::text LIKE '%ohrqizehefkjgqnqutlf.supabase.co%';

-- profiles.profile_image_url
UPDATE public.profiles
SET profile_image_url = REPLACE(profile_image_url, 'https://ohrqizehefkjgqnqutlf.supabase.co', 'https://ddmczupqwlpnplwjeykf.supabase.co')
WHERE profile_image_url LIKE '%ohrqizehefkjgqnqutlf.supabase.co%';

-- profiles.gallery_images (text[] array)
UPDATE public.profiles
SET gallery_images = ARRAY(
  SELECT REPLACE(url, 'https://ohrqizehefkjgqnqutlf.supabase.co', 'https://ddmczupqwlpnplwjeykf.supabase.co')
  FROM unnest(gallery_images) AS url
)
WHERE gallery_images::text LIKE '%ohrqizehefkjgqnqutlf.supabase.co%';

-- profiles.demo_songs (text[] array)
UPDATE public.profiles
SET demo_songs = ARRAY(
  SELECT REPLACE(url, 'https://ohrqizehefkjgqnqutlf.supabase.co', 'https://ddmczupqwlpnplwjeykf.supabase.co')
  FROM unnest(demo_songs) AS url
)
WHERE demo_songs::text LIKE '%ohrqizehefkjgqnqutlf.supabase.co%';

-- releases.cover_image_url
UPDATE public.releases
SET cover_image_url = REPLACE(cover_image_url, 'https://ohrqizehefkjgqnqutlf.supabase.co', 'https://ddmczupqwlpnplwjeykf.supabase.co')
WHERE cover_image_url LIKE '%ohrqizehefkjgqnqutlf.supabase.co%';

-- releases.tracks (json[] — contains audio URLs per track)
UPDATE public.releases
SET tracks = ARRAY(
  SELECT REPLACE(t::text, 'https://ohrqizehefkjgqnqutlf.supabase.co', 'https://ddmczupqwlpnplwjeykf.supabase.co')::json
  FROM unnest(tracks) AS t
)
WHERE tracks::text LIKE '%ohrqizehefkjgqnqutlf.supabase.co%';

-- releases_duplicate.cover_image_url
UPDATE public.releases_duplicate
SET cover_image_url = REPLACE(cover_image_url, 'https://ohrqizehefkjgqnqutlf.supabase.co', 'https://ddmczupqwlpnplwjeykf.supabase.co')
WHERE cover_image_url LIKE '%ohrqizehefkjgqnqutlf.supabase.co%';

-- releases_duplicate.tracks (json[])
UPDATE public.releases_duplicate
SET tracks = ARRAY(
  SELECT REPLACE(t::text, 'https://ohrqizehefkjgqnqutlf.supabase.co', 'https://ddmczupqwlpnplwjeykf.supabase.co')::json
  FROM unnest(tracks) AS t
)
WHERE tracks::text LIKE '%ohrqizehefkjgqnqutlf.supabase.co%';

-- songs.audio_url
UPDATE public.songs
SET audio_url = REPLACE(audio_url, 'https://ohrqizehefkjgqnqutlf.supabase.co', 'https://ddmczupqwlpnplwjeykf.supabase.co')
WHERE audio_url LIKE '%ohrqizehefkjgqnqutlf.supabase.co%';
