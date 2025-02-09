export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      blog_posts: {
        Row: {
          id: string
          title: string
          content: string
          author_id: string
          slug: string
          published: boolean
          featured_image: string | null
          excerpt: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          author_id: string
          slug: string
          published?: boolean
          featured_image?: string | null
          excerpt?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          author_id?: string
          slug?: string
          published?: boolean
          featured_image?: string | null
          excerpt?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          username: string
          artist_name: string | null
          artist_bio: string | null
          profile_image_url: string | null
          gallery_images: string [],
          youtube_links: string [],
          demo_songs: string [],
          created_at: string
          updated_at: string,
          town_id :string | null
          suburb: string | null,
          youtube_url: string | null,
          spotify_url: string | null,
          instagram_url: string | null,
          twitter_url: string | null,
          facebook_url: string | null,
          tiktok_url: string | null,
          cellphone: string | null,
          email: string | null,
          upcoming_events:  string [],
        }
        Insert: {
          id: string
          username: string
          artist_name?: string | null
          artist_bio?: string | null
          profile_image_url?: string | null
          gallery_images: string [],
          youtube_links: string [],
          demo_songs: string [],
          created_at?: string,
          updated_at?: string,
          town_id: string | null,
          suburb: string | null,
          youtube_url: string | null,
          spotify_url: string | null,
          instagram_url: string | null,
          twitter_url: string | null,
          facebook_url: string | null,
          tiktok_url: string | null,
          cellphone: string | null,
          email: string | null,
          upcoming_events:  string [],

        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}