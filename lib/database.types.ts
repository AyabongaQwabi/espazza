export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      blog_posts: {
        Row: {
          id: string;
          title: string;
          content: string;
          author_id: string;
          slug: string;
          published: boolean;
          featured_image: string | null;
          excerpt: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          author_id: string;
          slug: string;
          published?: boolean;
          featured_image?: string | null;
          excerpt?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          author_id?: string;
          slug?: string;
          published?: boolean;
          featured_image?: string | null;
          excerpt?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          username: string;
          artist_name: string | null;
          artist_bio: string | null;
          profile_image_url: string | null;
          gallery_images: string[];
          created_at: string;
          updated_at: string;
          banner_image?: string | null;
          tagline?: string | null;
          genre?: string | null;
          location?: string | null;
          youtube_url?: string | null;
          spotify_url?: string | null;
          instagram_url?: string | null;
          twitter_url?: string | null;
          facebook_url?: string | null;
          tiktok_url?: string | null;
          cellphone?: string | null;
          email?: string | null;
          achievements?: string[] | null;
          merch?: { image: string; name: string; price: string }[] | null;
          upcoming_events?: { name: string; date: string; location: string }[] | null;
          registration_complete?: boolean | null;
          government_name?: string | null;
          date_of_birth?: string | null;
          sa_id_number?: string | null;
          phone_number?: string | null;
          street_address?: string | null;
          suburb?: string | null;
          town_id?: string | null;
          province?: string | null;
          record_label_id?: string | null;
          has_manager?: boolean | null;
          distributor_id?: string | null;
          samro_member?: boolean | null;
          samro_id?: string | null;
          cappasso_member?: boolean | null;
          cappasso_id?: string | null;
          risa_member?: boolean | null;
          risa_id?: string | null;
          sampra_member?: boolean | null;
          sampra_id?: string | null;
          demo_songs?: string[] | null;
          youtube_links?: string[] | null;
        };
        Insert: {
          id: string;
          username: string;
          artist_name?: string | null;
          artist_bio?: string | null;
          profile_image_url?: string | null;
          gallery_images: string[];
          created_at?: string;
          updated_at?: string;
          banner_image?: string | null;
          tagline?: string | null;
          genre?: string | null;
          location?: string | null;
          youtube_url?: string | null;
          spotify_url?: string | null;
          instagram_url?: string | null;
          twitter_url?: string | null;
          facebook_url?: string | null;
          tiktok_url?: string | null;
          cellphone?: string | null;
          email?: string | null;
          achievements?: string[] | null;
          merch?: { image: string; name: string; price: string }[] | null;
          upcoming_events?: { name: string; date: string; location: string }[] | null;
          registration_complete?: boolean | null;
          government_name?: string | null;
          date_of_birth?: string | null;
          sa_id_number?: string | null;
          phone_number?: string | null;
          street_address?: string | null;
          suburb?: string | null;
          town_id?: string | null;
          province?: string | null;
          record_label_id?: string | null;
          has_manager?: boolean | null;
          distributor_id?: string | null;
          samro_member?: boolean | null;
          samro_id?: string | null;
          cappasso_member?: boolean | null;
          cappasso_id?: string | null;
          risa_member?: boolean | null;
          risa_id?: string | null;
          sampra_member?: boolean | null;
          sampra_id?: string | null;
          demo_songs?: string[] | null;
          youtube_links?: string[] | null;
        };
        Update: {
          id?: string;
          username?: string;
          artist_name?: string | null;
          artist_bio?: string | null;
          profile_image_url?: string | null;
          gallery_images?: string[];
          created_at?: string;
          updated_at?: string;
          banner_image?: string | null;
          tagline?: string | null;
          genre?: string | null;
          location?: string | null;
          youtube_url?: string | null;
          spotify_url?: string | null;
          instagram_url?: string | null;
          twitter_url?: string | null;
          facebook_url?: string | null;
          tiktok_url?: string | null;
          cellphone?: string | null;
          email?: string | null;
          achievements?: string[] | null;
          merch?: { image: string; name: string; price: string }[] | null;
          upcoming_events?: { name: string; date: string; location: string }[] | null;
          registration_complete?: boolean | null;
          government_name?: string | null;
          date_of_birth?: string | null;
          sa_id_number?: string | null;
          phone_number?: string | null;
          street_address?: string | null;
          suburb?: string | null;
          town_id?: string | null;
          province?: string | null;
          record_label_id?: string | null;
          has_manager?: boolean | null;
          distributor_id?: string | null;
          samro_member?: boolean | null;
          samro_id?: string | null;
          cappasso_member?: boolean | null;
          cappasso_id?: string | null;
          risa_member?: boolean | null;
          risa_id?: string | null;
          sampra_member?: boolean | null;
          sampra_id?: string | null;
          demo_songs?: string[] | null;
          youtube_links?: string[] | null;
        };
      };
      events: {
        Row: {
          id: string;
          organizer_id: string;
          name: string;
          description: string | null;
          venue: string;
          date: string;
          budget: number | null;
          ticket_price: number | null;
          max_attendees: number | null;
          cover_image: string | null;
          created_at: string;
          updated_at: string;
          town_id?: string | null;
          organizer_name?: string | null;
          venue_id?: string | null;
        };
        Insert: {
          id?: string;
          organizer_id: string;
          name: string;
          description?: string | null;
          venue: string;
          date: string;
          budget?: number | null;
          ticket_price?: number | null;
          max_attendees?: number | null;
          cover_image?: string | null;
          created_at?: string;
          updated_at?: string;
          town_id?: string | null;
          organizer_name?: string | null;
          venue_id?: string | null;
        };
        Update: {
          id?: string;
          organizer_id?: string;
          name?: string;
          description?: string | null;
          venue?: string;
          date?: string;
          budget?: number | null;
          ticket_price?: number | null;
          max_attendees?: number | null;
          cover_image?: string | null;
          created_at?: string;
          updated_at?: string;
          town_id?: string | null;
          organizer_name?: string | null;
          venue_id?: string | null;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string;
          price: string;
          category: string;
          stock: string;
          images: string[];
          seller_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          price: string;
          category: string;
          stock: string;
          images: string[];
          seller_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          price?: string;
          category?: string;
          stock?: string;
          images?: string[];
          seller_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          artist_id: string;
          event_id: string;
          organizer_id: string;
          status: "Pending" | "Approved" | "Rejected" | "Completed";
          fee: number;
          payment_terms: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          artist_id: string;
          event_id: string;
          organizer_id: string;
          status: "Pending" | "Approved" | "Rejected" | "Completed";
          fee: number;
          payment_terms: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          artist_id?: string;
          event_id?: string;
          organizer_id?: string;
          status?: "Pending" | "Approved" | "Rejected" | "Completed";
          fee?: number;
          payment_terms?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      event_artists: {
        Row: {
          id: string;
          event_id: string;
          artist_id: string;
          status: string;
          fee: number | null;
          payment_terms: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          artist_id: string;
          status?: string;
          fee?: number | null;
          payment_terms?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          artist_id?: string;
          status?: string;
          fee?: number | null;
          payment_terms?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      event_tickets: {
        Row: {
          id: string;
          event_id: string;
          buyer_id: string;
          quantity: number;
          total_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          buyer_id: string;
          quantity: number;
          total_price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          buyer_id?: string;
          quantity?: number;
          total_price?: number;
          created_at?: string;
        };
      };
      venues: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          town_id: string | null;
          capacity: number | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          town_id?: string | null;
          capacity?: number | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          town_id?: string | null;
          capacity?: number | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

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
          gallery_images: string[]
          created_at: string
          updated_at: string
          banner_image?: string | null
          tagline?: string | null
          genre?: string | null
          location?: string | null
          youtube_url?: string | null
          spotify_url?: string | null
          instagram_url?: string | null
          twitter_url?: string | null
          facebook_url?: string | null
          tiktok_url?: string | null
          cellphone?: string | null
          email?: string | null
          achievements?: string[] | null
          merch?: { image: string; name: string; price: string }[] | null
          upcoming_events?: { name: string; date: string; location: string }[] | null
          registration_complete?: boolean | null
          government_name?: string | null
          date_of_birth?: string | null
          sa_id_number?: string | null
          phone_number?: string | null
          street_address?: string | null
          suburb?: string | null
          town_id?: string | null
          province?: string | null
          record_label_id?: string | null
          has_manager?: boolean | null
          distributor_id?: string | null
          samro_member?: boolean | null
          samro_id?: string | null
          cappasso_member?: boolean | null
          cappasso_id?: string | null
          risa_member?: boolean | null
          risa_id?: string | null
          sampra_member?: boolean | null
          sampra_id?: string | null
          demo_songs?: string[] | null
          youtube_links?: string[] | null
        }
        Insert: {
          id: string
          username: string
          artist_name?: string | null
          artist_bio?: string | null
          profile_image_url?: string | null
          gallery_images: string[]
          created_at?: string
          updated_at?: string
          banner_image?: string | null
          tagline?: string | null
          genre?: string | null
          location?: string | null
          youtube_url?: string | null
          spotify_url?: string | null
          instagram_url?: string | null
          twitter_url?: string | null
          facebook_url?: string | null
          tiktok_url?: string | null
          cellphone?: string | null
          email?: string | null
          achievements?: string[] | null
          merch?: { image: string; name: string; price: string }[] | null
          upcoming_events?: { name: string; date: string; location: string }[] | null
          registration_complete?: boolean | null
          government_name?: string | null
          date_of_birth?: string | null
          sa_id_number?: string | null
          phone_number?: string | null
          street_address?: string | null
          suburb?: string | null
          town_id?: string | null
          province?: string | null
          record_label_id?: string | null
          has_manager?: boolean | null
          distributor_id?: string | null
          samro_member?: boolean | null
          samro_id?: string | null
          cappasso_member?: boolean | null
          cappasso_id?: string | null
          risa_member?: boolean | null
          risa_id?: string | null
          sampra_member?: boolean | null
          sampra_id?: string | null
          demo_songs?: string[] | null
          youtube_links?: string[] | null
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
          banner_image?: string | null
          tagline?: string | null
          genre?: string | null
          location?: string | null
          youtube_url?: string | null
          spotify_url?: string | null
          instagram_url?: string | null
          twitter_url?: string | null
          facebook_url?: string | null
          tiktok_url?: string | null
          cellphone?: string | null
          email?: string | null
          achievements?: string[] | null
          merch?: { image: string; name: string; price: string }[] | null
          upcoming_events?: { name: string; date: string; location: string }[] | null
          registration_complete?: boolean | null
          government_name?: string | null
          date_of_birth?: string | null
          sa_id_number?: string | null
          phone_number?: string | null
          street_address?: string | null
          suburb?: string | null
          town_id?: string | null
          province?: string | null
          record_label_id?: string | null
          has_manager?: boolean | null
          distributor_id?: string | null
          samro_member?: boolean | null
          samro_id?: string | null
          cappasso_member?: boolean | null
          cappasso_id?: string | null
          risa_member?: boolean | null
          risa_id?: string | null
          sampra_member?: boolean | null
          sampra_id?: string | null
          demo_songs?: string[] | null
          youtube_links?: string[] | null
        }
      }
      south_african_towns: {
        Row: {
          id: string
          name: string
          province: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          province: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          province?: string
          created_at?: string
        }
      }
      record_labels: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      distributors: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      songs: {
        Row: {
          id: string
          title: string
          artist_id: string
          audio_url: string
          youtube_url: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          artist_id: string
          audio_url: string
          youtube_url: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          artist_id?: string
          audio_url?: string
          youtube_url?: string
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          organizer_id: string
          name: string
          description: string | null
          venue_id: string | null
          town_id: string | null
          date: string
          budget: number | null
          ticket_price: number | null
          max_attendees: number | null
          cover_image: string | null
          created_at: string
          updated_at: string
          organizer_name: string | null
        }
        Insert: {
          id?: string
          organizer_id: string
          name: string
          description?: string | null
          venue_id?: string | null
          town_id?: string | null
          date: string
          budget?: number | null
          ticket_price?: number | null
          max_attendees?: number | null
          cover_image?: string | null
          created_at?: string
          updated_at?: string
          organizer_name?: string | null
        }
        Update: {
          id?: string
          organizer_id?: string
          name?: string
          description?: string | null
          venue_id?: string | null
          town_id?: string | null
          date?: string
          budget?: number | null
          ticket_price?: number | null
          max_attendees?: number | null
          cover_image?: string | null
          created_at?: string
          updated_at?: string
          organizer_name?: string | null
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string
          price: string
          category: string
          stock: string
          images: string[]
          seller_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          price: string
          category: string
          stock: string
          images: string[]
          seller_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: string
          category?: string
          stock?: string
          images?: string[]
          seller_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      event_artists: {
        Row: {
          id: string
          event_id: string
          artist_id: string
          status: string
          fee: number | null
          payment_terms: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          artist_id: string
          status?: string
          fee?: number | null
          payment_terms?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          artist_id?: string
          status?: string
          fee?: number | null
          payment_terms?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      event_tickets: {
        Row: {
          id: string
          event_id: string
          buyer_id: string
          quantity: number
          total_price: number
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          buyer_id: string
          quantity: number
          total_price: number
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          buyer_id?: string
          quantity?: number
          total_price?: number
          created_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          artist_id: string
          event_id: string
          organizer_id: string
          status: "Pending" | "Approved" | "Rejected" | "Completed"
          fee: number
          payment_terms: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          artist_id: string
          event_id: string
          organizer_id: string
          status: "Pending" | "Approved" | "Rejected" | "Completed"
          fee: number
          payment_terms: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          artist_id?: string
          event_id?: string
          organizer_id?: string
          status?: "Pending" | "Approved" | "Rejected" | "Completed"
          fee?: number
          payment_terms?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      venues: {
        Row: {
          id: string
          name: string
          address: string | null
          town_id: string | null
          capacity: number | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          town_id?: string | null
          capacity?: number | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          town_id?: string | null
          capacity?: number | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}

