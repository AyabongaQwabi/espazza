-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    release_id UUID REFERENCES releases(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, release_id)
);

-- Create function to update average_rating in releases table
CREATE OR REPLACE FUNCTION update_release_average_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE releases
    SET average_rating = (
        SELECT AVG(rating)
        FROM reviews
        WHERE release_id = NEW.release_id
    )
    WHERE id = NEW.release_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update average_rating when a review is added or updated
CREATE TRIGGER update_release_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_release_average_rating();

-- Create indexes for performance
CREATE INDEX idx_releases_genre ON releases(genre);
CREATE INDEX idx_releases_release_date ON releases(release_date);
CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX idx_playlists_user_id ON playlists(user_id);
CREATE INDEX idx_playlist_releases_playlist_id ON playlist_releases(playlist_id);
CREATE INDEX idx_reviews_release_id ON reviews(release_id);

-- Enable Row Level Security (RLS) on tables
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for Row Level Security
-- Releases: Everyone can view, only admins can modify
CREATE POLICY "Releases are viewable by everyone" ON releases FOR SELECT USING (true);
CREATE POLICY "Releases are editable by admins" ON releases FOR ALL USING (auth.role() = 'admin');


-- Purchases: Users can view their own purchases, admins can view all
CREATE POLICY "Users can view own purchases" ON purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all purchases" ON purchases FOR ALL USING (auth.role() = 'admin');

-- Wishlists: Users can manage their own wishlists
CREATE POLICY "Users can manage own wishlists" ON wishlists FOR ALL USING (auth.uid() = user_id);

-- Playlists: Users can manage their own playlists, can view public playlists
CREATE POLICY "Users can manage own playlists" ON playlists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view public playlists" ON playlists FOR SELECT USING (is_public = true);

CREATE POLICY "Users can manage releases in own playlists" ON playlist_releases 
FOR ALL USING (auth.uid() = (SELECT user_id FROM playlists WHERE id = playlist_id));
CREATE POLICY "Users can view releases in public playlists" ON playlist_releases 
FOR SELECT USING ((SELECT is_public FROM playlists WHERE id = playlist_id) = true);

-- Reviews: Users can manage their own reviews, everyone can view
CREATE POLICY "Users can manage own reviews" ON reviews FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);

