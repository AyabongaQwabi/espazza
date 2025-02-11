-- Add foreign key constraint to blog_posts table
ALTER TABLE blog_posts
ADD CONSTRAINT fk_blog_posts_author
FOREIGN KEY (author_id)
REFERENCES profiles(id);

-- Create index for better query performance
CREATE INDEX idx_blog_posts_author_id ON blog_posts(author_id);

